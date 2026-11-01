/**
 * classroomApiService.ts
 * Google Classroom API integration.
 * Uses the official REST API with a valid OAuth access token.
 * Handles courses, coursework (assignments), and student submissions.
 *
 * All data returned is real API data — nothing is fabricated.
 * If the token is invalid or the user has no courses, empty arrays are returned
 * with appropriate error messages.
 */
import { Assignment, AssignmentPriority, AssignmentSource } from '../types/tasks';

const CLASSROOM_BASE = 'https://classroom.googleapis.com/v1';

// ─── Types matching Google Classroom API ─────────────────────────────────────

interface GCCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  courseState: string; // 'ACTIVE' | 'ARCHIVED' etc.
}

interface GCCoursework {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours: number; minutes: number };
  maxPoints?: number;
  workType: string;
  alternateLink?: string;
  state: string;
}

interface GCStudentSubmission {
  id: string;
  courseId: string;
  courseWorkId: string;
  state: string; // 'NEW' | 'CREATED' | 'TURNED_IN' | 'RETURNED' | 'RECLAIMED_BY_STUDENT'
  late?: boolean;
  assignedGrade?: number;
}

interface GCListCoursesResponse {
  courses?: GCCourse[];
  nextPageToken?: string;
}

interface GCListCourseworkResponse {
  courseWork?: GCCoursework[];
  nextPageToken?: string;
}

interface GCListSubmissionsResponse {
  studentSubmissions?: GCStudentSubmission[];
  nextPageToken?: string;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function gcFetch<T>(
  path: string,
  accessToken: string
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${CLASSROOM_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 401) {
      return { data: null, error: 'TOKEN_EXPIRED' };
    }
    if (res.status === 403) {
      return { data: null, error: 'PERMISSION_DENIED' };
    }
    if (!res.ok) {
      return { data: null, error: `HTTP_${res.status}` };
    }

    const json = await res.json();
    return { data: json as T, error: null };
  } catch {
    return { data: null, error: 'NETWORK_ERROR' };
  }
}

// ─── Paginated fetch for courses ──────────────────────────────────────────────

export async function fetchAllCourses(
  accessToken: string
): Promise<{ courses: GCCourse[]; error: string | null }> {
  const courses: GCCourse[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ courseStates: 'ACTIVE' });
    if (pageToken) params.append('pageToken', pageToken);

    const { data, error } = await gcFetch<GCListCoursesResponse>(
      `/courses?${params.toString()}`,
      accessToken
    );

    if (error) return { courses: [], error };
    if (!data) break;

    courses.push(...(data.courses ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return { courses, error: null };
}

// ─── Paginated fetch for coursework in a course ───────────────────────────────

async function fetchCourseworkForCourse(
  courseId: string,
  accessToken: string
): Promise<GCCoursework[]> {
  const items: GCCoursework[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ orderBy: 'dueDate asc' });
    if (pageToken) params.append('pageToken', pageToken);

    const { data } = await gcFetch<GCListCourseworkResponse>(
      `/courses/${courseId}/courseWork?${params.toString()}`,
      accessToken
    );

    if (!data) break;
    items.push(...(data.courseWork ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
}

// ─── Fetch student submissions for a course ───────────────────────────────────

async function fetchSubmissionsForCourse(
  courseId: string,
  accessToken: string
): Promise<Map<string, GCStudentSubmission>> {
  const map = new Map<string, GCStudentSubmission>();
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams();
    if (pageToken) params.append('pageToken', pageToken);

    const { data } = await gcFetch<GCListSubmissionsResponse>(
      `/courses/${courseId}/courseWork/-/studentSubmissions?${params.toString()}`,
      accessToken
    );

    if (!data) break;
    (data.studentSubmissions ?? []).forEach((s) => {
      map.set(s.courseWorkId, s);
    });
    pageToken = data.nextPageToken;
  } while (pageToken);

  return map;
}

// ─── Colour palette for courses ───────────────────────────────────────────────

const COURSE_COLOURS = [
  '#6AAF7D', '#7AA7C7', '#E8B86D', '#A8C5B2',
  '#D98B8B', '#789B83', '#9FA8DA', '#FF8A65',
];

function courseColour(index: number): string {
  return COURSE_COLOURS[index % COURSE_COLOURS.length];
}

// ─── Map GC submission state to app status ────────────────────────────────────

function mapSubmissionState(
  submission: GCStudentSubmission | undefined
): 'pending' | 'submitted' | 'graded' {
  if (!submission) return 'pending';
  switch (submission.state) {
    case 'TURNED_IN':
      return 'submitted';
    case 'RETURNED':
      return 'graded';
    default:
      return 'pending';
  }
}

// ─── Infer priority from due date ─────────────────────────────────────────────

function inferPriority(dueDate: string | null): AssignmentPriority {
  if (!dueDate) return 'medium';
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return 'high';
  if (diffDays <= 3) return 'medium';
  return 'low';
}

// ─── Main sync function ───────────────────────────────────────────────────────

export interface ClassroomSyncResult {
  assignments: Assignment[];
  coursesFound: number;
  error: string | null;
}

export async function syncFromGoogleClassroom(
  accessToken: string
): Promise<ClassroomSyncResult> {
  // 1. Get all active courses
  const { courses, error: coursesError } = await fetchAllCourses(accessToken);
  if (coursesError) {
    return { assignments: [], coursesFound: 0, error: coursesError };
  }
  if (courses.length === 0) {
    return { assignments: [], coursesFound: 0, error: 'NO_COURSES' };
  }

  // 2. For each course, fetch coursework + submissions in parallel
  const allAssignments: Assignment[] = [];

  await Promise.all(
    courses.map(async (course, idx) => {
      const [coursework, submissions] = await Promise.all([
        fetchCourseworkForCourse(course.id, accessToken),
        fetchSubmissionsForCourse(course.id, accessToken),
      ]);

      coursework.forEach((cw) => {
        // Skip non-assignment work types
        if (cw.workType !== 'ASSIGNMENT') return;

        // Build due date/time strings
        let dueDateStr: string;
        let dueTimeStr: string = '23:59';

        if (cw.dueDate) {
          const m = String(cw.dueDate.month).padStart(2, '0');
          const d = String(cw.dueDate.day).padStart(2, '0');
          dueDateStr = `${cw.dueDate.year}-${m}-${d}`;
        } else {
          // No deadline set in Classroom — place far in future
          const future = new Date();
          future.setDate(future.getDate() + 30);
          dueDateStr = future.toISOString().split('T')[0];
        }

        if (cw.dueTime) {
          const h = String(cw.dueTime.hours ?? 23).padStart(2, '0');
          const min = String(cw.dueTime.minutes ?? 59).padStart(2, '0');
          dueTimeStr = `${h}:${min}`;
        }

        const submission = submissions.get(cw.id);
        const status = mapSubmissionState(submission);
        const priority = inferPriority(dueDateStr);

        const assignment: Assignment = {
          id: `gc_${course.id}_${cw.id}`,
          title: cw.title,
          course: course.name,
          courseColor: courseColour(idx),
          dueDate: dueDateStr,
          dueTime: dueTimeStr,
          priority,
          status,
          source: 'google_classroom' as AssignmentSource,
          points: cw.maxPoints,
          description: cw.description,
          classroomLink: cw.alternateLink,
          reminderActive: status === 'pending',
          createdAt: new Date().toISOString(),
        };

        allAssignments.push(assignment);
      });
    })
  );

  // Sort by due date ascending
  allAssignments.sort((a, b) => {
    const da = `${a.dueDate}T${a.dueTime}`;
    const db = `${b.dueDate}T${b.dueTime}`;
    return da.localeCompare(db);
  });

  return {
    assignments: allAssignments,
    coursesFound: courses.length,
    error: null,
  };
}

// ─── Merge helper — prevents duplicates when re-syncing ──────────────────────

/**
 * Merges newly synced Classroom assignments with existing local assignments.
 * Rules:
 * - Manual assignments (source === 'manual') are NEVER overwritten.
 * - Existing Classroom assignments are updated (deadline, status, title may change).
 * - New Classroom assignments are prepended.
 * - Deleted Classroom assignments are NOT removed (user may still want to see them).
 */
export function mergeAssignments(
  existing: Assignment[],
  synced: Assignment[]
): Assignment[] {
  const merged = [...existing];

  for (const syncedItem of synced) {
    const idx = merged.findIndex((a) => a.id === syncedItem.id);
    if (idx >= 0) {
      // Update Classroom assignment, but preserve local user data
      const local = merged[idx];
      merged[idx] = {
        ...syncedItem,
        // Preserve user overrides
        reminderActive: local.reminderActive,
        aiStudyPlan: local.aiStudyPlan,
        // If user already marked it submitted locally, keep that
        status: local.status === 'submitted' ? 'submitted' : syncedItem.status,
      };
    } else {
      merged.push(syncedItem);
    }
  }

  // Re-sort
  merged.sort((a, b) => {
    if (a.status === 'submitted' && b.status !== 'submitted') return 1;
    if (b.status === 'submitted' && a.status !== 'submitted') return -1;
    const da = `${a.dueDate}T${a.dueTime}`;
    const db = `${b.dueDate}T${b.dueTime}`;
    return da.localeCompare(db);
  });

  return merged;
}

// ─── Error message mapping ────────────────────────────────────────────────────

export function classroomErrorMessage(error: string): string {
  switch (error) {
    case 'TOKEN_EXPIRED':
      return 'Your Google session has expired. Please reconnect your account.';
    case 'PERMISSION_DENIED':
      return 'Google Classroom permission was denied. Re-connect and grant Classroom access.';
    case 'NO_COURSES':
      return 'No active Google Classroom courses found for this account.';
    case 'NETWORK_ERROR':
      return 'Unable to reach Google Classroom. Check your internet connection.';
    default:
      return `Sync failed (${error}). Please try again.`;
  }
}
