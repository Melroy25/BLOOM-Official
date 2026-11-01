/**
 * classroomService.ts
 * Utility helpers shared across assignment tracker components.
 * Real API sync is in classroomApiService.ts.
 * This file exposes helpers, constants, and the countdown calculator.
 */
import { Assignment, AssignmentPriority, AssignmentStatus } from '../types/tasks';

export interface ClassroomCourse {
  id: string;
  name: string;
  section: string;
  color: string;
  instructor: string;
}

export const DEMO_CLASSROOM_COURSES: ClassroomCourse[] = [
  {
    id: 'c1',
    name: 'CS 301: Algorithms & Data Structures',
    section: 'Sec A',
    color: '#6AAF7D',
    instructor: 'Dr. Sarah Lin',
  },
  {
    id: 'c2',
    name: 'PSY 210: Cognitive Neuroscience',
    section: 'Sec B',
    color: '#7AA7C7',
    instructor: 'Prof. Miller',
  },
  {
    id: 'c3',
    name: 'MATH 240: Linear Algebra & Optimization',
    section: 'Sec C',
    color: '#E8B86D',
    instructor: 'Dr. Ramesh Kumar',
  },
  {
    id: 'c4',
    name: 'ENG 105: Technical Communication',
    section: 'Sec D',
    color: '#A8C5B2',
    instructor: 'Prof. Davis',
  },
];

/** Helper to calculate relative date YYYY-MM-DD */
export function getRelativeDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface CountdownInfo {
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  hoursRemaining: number;
  displayText: string;
  badgeColor: string;
  badgeTextColor: string;
}

/** Calculate precise countdown and alert status for an assignment deadline */
export function calculateDueCountdown(dueDate: string, dueTime: string = '23:59'): CountdownInfo {
  const [year, month, day] = dueDate.split('-').map(Number);
  const [hour, minute] = dueTime.split(':').map(Number);
  const deadline = new Date(year, month - 1, day, hour, minute);
  const now = new Date();

  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
      hoursRemaining: diffHours,
      displayText: overdueDays <= 1 ? 'Overdue today' : `Overdue by ${overdueDays} days`,
      badgeColor: '#FBE8E8',
      badgeTextColor: '#D98B8B',
    };
  }

  const todayStr = getRelativeDateString(0);
  const tomorrowStr = getRelativeDateString(1);

  if (dueDate === todayStr) {
    if (diffHours <= 1) {
      return {
        isOverdue: false,
        isToday: true,
        isTomorrow: false,
        hoursRemaining: diffHours,
        displayText: '⚠️ Due in less than 1 hour!',
        badgeColor: '#FBE8E8',
        badgeTextColor: '#D98B8B',
      };
    }
    return {
      isOverdue: false,
      isToday: true,
      isTomorrow: false,
      hoursRemaining: diffHours,
      displayText: `⚠️ Due Today (${diffHours}h left at ${dueTime})`,
      badgeColor: '#FBF0DF',
      badgeTextColor: '#E8B86D',
    };
  }

  if (dueDate === tomorrowStr) {
    return {
      isOverdue: false,
      isToday: false,
      isTomorrow: true,
      hoursRemaining: diffHours,
      displayText: `⏰ Due Tomorrow (${dueTime})`,
      badgeColor: '#EAE5F4',
      badgeTextColor: '#7A68A7',
    };
  }

  return {
    isOverdue: false,
    isToday: false,
    isTomorrow: false,
    hoursRemaining: diffHours,
    displayText: `📅 Due in ${diffDays} days (${dueDate})`,
    badgeColor: '#E8F1E8',
    badgeTextColor: '#365B45',
  };
}

/**
 * Legacy sync stub kept for backward compatibility with tasks.tsx.
 * Real sync is done through classroomApiService.syncFromGoogleClassroom().
 * This stub will not be called unless Google auth is missing.
 */
export async function syncGoogleClassroom(): Promise<Assignment[]> {
  // This stub signals to callers that Google auth is required.
  // Return empty — the actual sync in AssignmentTracker uses classroomApiService.
  return [];
}

/**
 * Initial assignments — empty by default on fresh install.
 * Assignments are loaded from AsyncStorage via storageService.
 * This array serves as the fallback type signature reference only.
 */
export const INITIAL_ASSIGNMENTS: Assignment[] = [];
