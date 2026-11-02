// Centralized Community Challenges Service for BLOOM
// Connects to Cloud Firestore: challenges, participants, checkIns, and comments.
// Supports dynamic discovery, creation, progress tracking, and discussions.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Challenge,
  ChallengeCategory,
  ChallengeParticipant,
  ChallengeDailyCheckIn,
  ChallengeComment,
  ChallengeActivity,
} from '../types/collabs';

// ============================================================================
// CURATED INITIAL CHALLENGE TEMPLATES (High-Resolution Landscape Covers)
// Used to seed Firestore on fresh databases so the discovery hub is immediately alive
// ============================================================================
export const CURATED_CHALLENGE_TEMPLATES: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Winter Arc – 90 Days',
    shortDescription: 'Build supreme mental & physical discipline over 90 days.',
    description:
      'The Winter Arc is a 90-day seasonal reset to lock in healthy habits, eliminate distractions, build unbreakable physical strength, and step into the new year at your personal peak.',
    category: 'Fitness',
    categoryTag: 'Seasonal Arc',
    coverImageUrl:
      'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=800&auto=format&fit=crop&q=75',
    duration: '90 Days',
    durationDays: 90,
    participantsCount: 2450,
    participantsText: '2,450 joined',
    isJoined: false,
    isPopular: true,
    isTrending: true,
    creatorUid: 'bloom_official',
    creatorName: 'Bloom Wellness Team',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=70',
    visibility: 'public',
    status: 'Active',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    dailyActivities: [
      { id: 'act_w1', title: '45-minute daily workout (lifting or cardio)' },
      { id: 'act_w2', title: 'Drink 3 liters of water' },
      { id: 'act_w3', title: 'Read 10 pages of a non-fiction book' },
      { id: 'act_w4', title: 'No junk food or sugary snacks' },
      { id: 'act_w5', title: 'Wake up at or before 6:30 AM' },
    ],
    rules: [
      'Every day counts. Do not skip two days in a row.',
      'Log your activities each night before 11:00 PM.',
      'Take a weekly reflection photo or journal entry.',
    ],
    gradientColors: ['#365B45', '#789B83'],
  },
  {
    title: '75 Hard Challenge',
    shortDescription: 'The ultimate 75-day transformative mental toughness protocol.',
    description:
      'A true test of personal willpower and daily consistency. 75 consecutive days of physical workouts, clean eating, mindful hydration, and positive mindset training.',
    category: 'Fitness',
    categoryTag: 'Toughness',
    coverImageUrl:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=75',
    duration: '75 Days',
    durationDays: 75,
    participantsCount: 1820,
    participantsText: '1,820 joined',
    isJoined: false,
    isPopular: true,
    isTrending: true,
    creatorUid: 'bloom_official',
    creatorName: 'Coach Leo',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=70',
    visibility: 'public',
    status: 'Active',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 75 * 86400000).toISOString().split('T')[0],
    dailyActivities: [
      { id: 'act_75_1', title: 'Two 45-minute workouts (at least one outdoors)' },
      { id: 'act_75_2', title: 'Follow a clean nutrition plan with zero alcohol' },
      { id: 'act_75_3', title: 'Drink one gallon (~3.8L) of pure water' },
      { id: 'act_75_4', title: 'Read 10 pages of self-growth literature' },
      { id: 'act_75_5', title: 'Take a daily progress photo' },
    ],
    rules: [
      'If you miss any single task on any day, you must restart from Day 1.',
      'No cheat meals or compromise.',
    ],
    gradientColors: ['#29332E', '#365B45'],
  },
  {
    title: '30-Day Study Sprint',
    shortDescription: 'Deep study habits and distraction-free exam preparation.',
    description:
      'Organize your semester and maintain laser focus. Complete 2 to 3 hours of Pomodoro deep work every day alongside fellow university and high school students.',
    category: 'Study',
    categoryTag: 'Academic',
    coverImageUrl:
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=75',
    duration: '30 Days',
    durationDays: 30,
    participantsCount: 3140,
    participantsText: '3,140 joined',
    isJoined: false,
    isPopular: true,
    isTrending: true,
    creatorUid: 'bloom_official',
    creatorName: 'Study With Bloom',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=70',
    visibility: 'public',
    status: 'Active',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    dailyActivities: [
      { id: 'act_ss_1', title: 'Complete 2 hours of focused deep study' },
      { id: 'act_ss_2', title: 'Review lecture notes or flashcards' },
      { id: 'act_ss_3', title: 'Set top 3 daily study priorities in the morning' },
      { id: 'act_ss_4', title: 'Clear study desk before going to sleep' },
    ],
    rules: [
      'Turn off social media notifications during study sprints.',
      'Take a 5-minute break every 25 minutes (Pomodoro technique).',
    ],
    gradientColors: ['#789B83', '#A8C5B2'],
  },
  {
    title: 'Digital Sunset Sprint',
    shortDescription: 'Unplug 45 minutes before sleep for restorative rest.',
    description:
      'Reclaim your evenings and reset your circadian rhythm by eliminating blue light, phone scrolling, and bedtime anxiety for 14 nights.',
    category: 'Sleep',
    categoryTag: 'Night Ritual',
    coverImageUrl:
      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop&q=75',
    duration: '14 Days',
    durationDays: 14,
    participantsCount: 1670,
    participantsText: '1,670 joined',
    isJoined: false,
    isPopular: false,
    isTrending: true,
    creatorUid: 'bloom_official',
    creatorName: 'Dr. Sarah (Sleep Coach)',
    creatorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=70',
    visibility: 'public',
    status: 'Active',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    dailyActivities: [
      { id: 'act_ds_1', title: 'Phones & screens off 45 minutes before bed' },
      { id: 'act_ds_2', title: '5 minutes of evening gratitude or light journaling' },
      { id: 'act_ds_3', title: 'Sleep in a dark, cool room' },
    ],
    rules: [
      'No checking emails or TikTok once in bed.',
      'Replace screen time with light reading, stretching, or breathing.',
    ],
    gradientColors: ['#F7E5DA', '#EAE5F4'],
  },
  {
    title: '7-Day Mindful Breathing',
    shortDescription: 'Find calm and reset stress in just 5 mindful minutes a day.',
    description:
      'A beginner-friendly mindfulness journey. Practice daily box breathing or guided breathwork in the Bloom Heal Zone to soothe nervous tension.',
    category: 'Mindfulness',
    categoryTag: 'Reset',
    coverImageUrl:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=75',
    duration: '7 Days',
    durationDays: 7,
    participantsCount: 4210,
    participantsText: '4,210 joined',
    isJoined: false,
    isPopular: true,
    isTrending: false,
    creatorUid: 'bloom_official',
    creatorName: 'Elena Mindful',
    creatorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=70',
    visibility: 'public',
    status: 'Active',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    dailyActivities: [
      { id: 'act_mb_1', title: '5 minutes of box breathing (4-4-4-4)' },
      { id: 'act_mb_2', title: 'One mindful outdoor walk without headphones' },
      { id: 'act_mb_3', title: 'Log current mood in Bloom tracker' },
    ],
    rules: [
      'Breathe gently through the nose into the diaphragm.',
      'Practice either first thing in the morning or mid-afternoon study break.',
    ],
    gradientColors: ['#E8F1E8', '#D9EEE5'],
  },
  {
    title: '21-Day Self Discipline Challenge',
    shortDescription: 'Rewire habits, conquer procrastination, and build grit.',
    description:
      'Science shows it takes 21 days to form a foundational behavioral pathway. Build the core disciplines that separate students who dream from students who achieve.',
    category: 'Personal Growth',
    categoryTag: 'Habit Mastery',
    coverImageUrl:
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=75',
    duration: '21 Days',
    durationDays: 21,
    participantsCount: 1980,
    participantsText: '1,980 joined',
    isJoined: false,
    isPopular: false,
    isTrending: true,
    creatorUid: 'bloom_official',
    creatorName: 'Marcus Peak',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=70',
    visibility: 'public',
    status: 'Active',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
    dailyActivities: [
      { id: 'act_sd_1', title: 'Make bed immediately upon waking up' },
      { id: 'act_sd_2', title: 'Eat healthy whole foods (no refined sweets)' },
      { id: 'act_sd_3', title: 'Complete hardest task before 12:00 PM' },
      { id: 'act_sd_4', title: '20 minutes of physical movement' },
    ],
    rules: ['Never negotiate with your alarm clock.', 'Track daily wins every evening.'],
    gradientColors: ['#FAF8F2', '#E8F1E8'],
  },
  {
    title: '30-Day Digital Detox',
    shortDescription: 'Cut phone screen time in half and reclaim real-life presence.',
    description:
      'Break dopamine addiction, remove mindless feed scrolling, and reconnect with reading, sports, real friendships, and creative hobbies.',
    category: 'Digital Detox',
    categoryTag: 'Focus Quest',
    coverImageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=75',
    duration: '30 Days',
    durationDays: 30,
    participantsCount: 2190,
    participantsText: '2,190 joined',
    isJoined: false,
    isPopular: true,
    isTrending: false,
    creatorUid: 'bloom_official',
    creatorName: 'Tara Bloom',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=70',
    visibility: 'public',
    status: 'Active',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    dailyActivities: [
      { id: 'act_dd_1', title: 'Keep phone screen time under 2.5 hours total' },
      { id: 'act_dd_2', title: 'No phone usage during meals' },
      { id: 'act_dd_3', title: 'Delete or lock non-essential social apps' },
      { id: 'act_dd_4', title: 'Spend 30 minutes reading a physical book' },
    ],
    rules: ['Keep phone out of reach while studying or socializing.'],
    gradientColors: ['#E0EAF5', '#D9EEE5'],
  },
  {
    title: '14-Day Gratitude Challenge',
    shortDescription: 'Rewire your brain for happiness with 3 daily positive reflections.',
    description:
      'Positive psychology proves that actively noticing 3 good things each day reduces anxiety and boosts everyday peace and connection.',
    category: 'Mindfulness',
    categoryTag: 'Joy Reset',
    coverImageUrl:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=75',
    duration: '14 Days',
    durationDays: 14,
    participantsCount: 1430,
    participantsText: '1,430 joined',
    isJoined: false,
    isPopular: false,
    isTrending: false,
    creatorUid: 'bloom_official',
    creatorName: 'Bloom Community',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=70',
    visibility: 'public',
    status: 'Active',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    dailyActivities: [
      { id: 'act_gr_1', title: 'Write down 3 things you are grateful for' },
      { id: 'act_gr_2', title: 'Send one kind compliment or thank-you text' },
      { id: 'act_gr_3', title: 'Take 60 seconds to appreciate a moment of peace' },
    ],
    rules: ['Be specific with your gratitude items. No repeats allowed!'],
    gradientColors: ['#F7E5DA', '#FAF8F2'],
  },
];

// Helper: formats today's date in local YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================================================
// 1. DISCOVERY & QUERY SERVICES
// ============================================================================

/**
 * Fetches all discoverable public challenges from Firestore.
 * Automatically seeds curated templates if the Firestore collection is empty.
 */
export async function getPublicChallenges(
  category?: ChallengeCategory | 'All',
  searchQuery?: string,
  sortBy: 'popular' | 'recent' | 'shortest' | 'longest' = 'popular',
  currentUserId?: string
): Promise<Challenge[]> {
  try {
    const colRef = collection(db, 'challenges');
    const q = query(colRef, where('visibility', '==', 'public'));
    const snap = await getDocs(q);

    if (snap.empty) {
      return [];
    }

    let list: Challenge[] = snap.docs.map((docSnap) => {
      const d = docSnap.data();
      const count = typeof d.participantCount === 'number' ? d.participantCount : (d.participantsCount || 0);
      return {
        id: docSnap.id,
        title: d.title || 'Untitled Challenge',
        shortDescription: d.shortDescription || d.description || '',
        description: d.description || '',
        category: d.category || 'Productivity',
        categoryTag: d.categoryTag || d.category || 'Challenge',
        coverImageUrl: d.coverImageUrl || '',
        duration: d.duration || `${d.durationDays || 30} Days`,
        durationDays: d.durationDays || 30,
        participantsCount: count,
        participantsText: count === 1 ? '1 joined' : `${count.toLocaleString()} joined`,
        isJoined: false,
        isPopular: d.isPopular ?? (count >= 10),
        isTrending: d.isTrending ?? (count >= 3),
        creatorUid: d.creatorUid || '',
        creatorName: d.creatorName || 'Bloom Member',
        creatorAvatar: d.creatorAvatar || '',
        visibility: d.visibility || 'public',
        status: d.status || 'Active',
        startDate: d.startDate || getTodayDateString(),
        endDate: d.endDate || '',
        dailyActivities: d.dailyActivities || [],
        rules: d.rules || [],
        gradientColors: d.gradientColors || ['#789B83', '#365B45'],
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
    });

    // Enrich with joined status if user ID provided
    if (currentUserId) {
      list = await Promise.all(
        list.map(async (c) => {
          const joined = await checkIsUserJoined(c.id, currentUserId);
          return { ...c, isJoined: joined };
        })
      );
    }

    // 1. Filter by Category
    if (category && category !== 'All') {
      list = list.filter((c) => c.category === category);
    }

    // 2. Filter by Search Query
    if (searchQuery && searchQuery.trim().length > 0) {
      const qLower = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(qLower) ||
          c.category.toLowerCase().includes(qLower) ||
          (c.shortDescription && c.shortDescription.toLowerCase().includes(qLower)) ||
          c.description.toLowerCase().includes(qLower)
      );
    }

    // 3. Sorting
    switch (sortBy) {
      case 'popular':
        list.sort((a, b) => b.participantsCount - a.participantsCount);
        break;
      case 'recent':
        list.sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });
        break;
      case 'shortest':
        list.sort((a, b) => (a.durationDays || 30) - (b.durationDays || 30));
        break;
      case 'longest':
        list.sort((a, b) => (b.durationDays || 30) - (a.durationDays || 30));
        break;
    }

    return list;
  } catch (error: any) {
    if (error?.code !== 'permission-denied') {
      console.warn('[ChallengeService] Error fetching challenges:', error?.message || error);
    }
    return [];
  }
}

export async function getChallengeById(challengeId: string): Promise<Challenge | null> {
  try {
    const docRef = doc(db, 'challenges', challengeId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      // Check if it's one of the curated templates by index fallback
      const foundTemplate = CURATED_CHALLENGE_TEMPLATES.find(
        (t, idx) => `template_${idx}` === challengeId || t.title.toLowerCase().includes(challengeId.toLowerCase())
      );
      if (foundTemplate) {
        return {
          ...foundTemplate,
          id: challengeId,
        };
      }
      return null;
    }

    const d = snap.data();
    return {
      id: snap.id,
      title: d.title || 'Untitled Challenge',
      shortDescription: d.shortDescription || d.description || '',
      description: d.description || '',
      category: d.category || 'Productivity',
      categoryTag: d.categoryTag || d.category || 'Challenge',
      coverImageUrl: d.coverImageUrl || '',
      duration: d.duration || `${d.durationDays || 30} Days`,
      durationDays: d.durationDays || 30,
      participantsCount: d.participantCount || d.participantsCount || 0,
      participantsText: `${(d.participantCount || d.participantsCount || 0).toLocaleString()} joined`,
      isJoined: false,
      isPopular: d.isPopular || (d.participantCount || 0) >= 1500,
      isTrending: d.isTrending ?? true,
      creatorUid: d.creatorUid || '',
      creatorName: d.creatorName || 'Bloom Member',
      creatorAvatar: d.creatorAvatar || '',
      visibility: d.visibility || 'public',
      status: d.status || 'Active',
      startDate: d.startDate || getTodayDateString(),
      endDate: d.endDate || '',
      dailyActivities: d.dailyActivities || [],
      rules: d.rules || [],
      gradientColors: d.gradientColors || ['#789B83', '#365B45'],
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  } catch (error: any) {
    console.warn('[ChallengeService] Error fetching challenge details:', error?.message || error);
    return null;
  }
}

// ============================================================================
// 2. CREATE CHALLENGE SERVICE
// ============================================================================

export interface CreateChallengeInput {
  title: string;
  shortDescription: string;
  description: string;
  category: ChallengeCategory;
  durationDays: number;
  startDate: string; // YYYY-MM-DD
  coverImageUrl?: string;
  dailyActivities: Array<{ title: string; description?: string }>;
  rules?: string[];
  visibility: 'public' | 'private';
}

/**
 * Creates a brand-new community challenge in Firestore.
 */
export async function createCommunityChallenge(
  input: CreateChallengeInput,
  creator: { uid: string; name: string; avatar?: string }
): Promise<string> {
  // 1. Validation
  if (!input.title || input.title.trim().length === 0) {
    throw new Error('Challenge name is required.');
  }
  if (!input.description || input.description.trim().length === 0) {
    throw new Error('Challenge description is required.');
  }
  if (!input.durationDays || input.durationDays < 1) {
    throw new Error('Please enter a valid challenge duration (at least 1 day).');
  }
  if (!input.dailyActivities || input.dailyActivities.length === 0) {
    throw new Error('Please add at least one daily activity.');
  }

  // 2. Compute End Date
  const start = new Date(input.startDate || getTodayDateString());
  const end = new Date(start.getTime() + input.durationDays * 86400000);
  const endDateStr = end.toISOString().split('T')[0];

  // 3. Format Activities with IDs
  const formattedActivities: ChallengeActivity[] = input.dailyActivities.map((a, i) => ({
    id: `act_${Date.now()}_${i}`,
    title: a.title.trim(),
    description: a.description?.trim(),
  }));

  // 4. Fallback Cover Image by Category
  let cover = input.coverImageUrl?.trim();
  if (!cover) {
    const categoryCovers: Record<string, string> = {
      Fitness: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=70',
      Mindfulness: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=70',
      Study: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=70',
      Productivity: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&auto=format&fit=crop&q=70',
      'Digital Detox': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=70',
      Sleep: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop&q=70',
      'Personal Growth': 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=70',
      Lifestyle: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=70',
    };
    cover = categoryCovers[input.category] || categoryCovers.Productivity;
  }

  // 5. Persist to Firestore
  const colRef = collection(db, 'challenges');
  const docRef = await addDoc(colRef, {
    title: input.title.trim(),
    shortDescription: input.shortDescription?.trim() || input.description.trim().slice(0, 100),
    description: input.description.trim(),
    category: input.category,
    categoryTag: input.category,
    coverImageUrl: cover,
    duration: `${input.durationDays} Days`,
    durationDays: input.durationDays,
    startDate: input.startDate || getTodayDateString(),
    endDate: endDateStr,
    dailyActivities: formattedActivities,
    rules: (input.rules || []).filter((r) => r.trim().length > 0),
    visibility: input.visibility,
    status: 'Active',
    participantCount: 1, // Creator automatically joins
    creatorUid: creator.uid,
    creatorName: creator.name || 'Bloom Member',
    creatorAvatar: creator.avatar || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Creator automatically joins as participant #1
  try {
    const participantRef = doc(db, 'challenges', docRef.id, 'participants', creator.uid);
    await setDoc(participantRef, {
      uid: creator.uid,
      displayName: creator.name || 'Bloom Member',
      avatarUrl: creator.avatar || '',
      joinedAt: serverTimestamp(),
      completedDays: 0,
      currentStreak: 0,
      progressVisibility: 'public',
    });
  } catch (_) {}

  return docRef.id;
}

// ============================================================================
// 3. PARTICIPATION & PROGRESS SERVICES
// ============================================================================

/**
 * Checks whether a given user UID has joined a challenge.
 */
export async function checkIsUserJoined(challengeId: string, uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const participantRef = doc(db, 'challenges', challengeId, 'participants', uid);
    const snap = await getDoc(participantRef);
    return snap.exists();
  } catch {
    return false;
  }
}

/**
 * Allows an authenticated user to join a challenge.
 * Prevents duplicate joins safely.
 */
export async function joinChallenge(
  challengeId: string,
  user: { uid: string; name: string; avatar?: string }
): Promise<void> {
  if (!user.uid) throw new Error('You must be signed in to join a challenge.');

  const participantRef = doc(db, 'challenges', challengeId, 'participants', user.uid);
  const existing = await getDoc(participantRef);
  if (existing.exists()) {
    return; // Already joined; no-op
  }

  // 1. Create participant record
  await setDoc(participantRef, {
    uid: user.uid,
    displayName: user.name || 'Bloom Member',
    avatarUrl: user.avatar || '',
    joinedAt: serverTimestamp(),
    completedDays: 0,
    currentStreak: 0,
    progressVisibility: 'public',
  });

  // 2. Increment challenge participant count
  const challengeRef = doc(db, 'challenges', challengeId);
  try {
    await updateDoc(challengeRef, {
      participantCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (_) {}
}

/**
 * Allows a participant to leave a challenge.
 */
export async function leaveChallenge(challengeId: string, uid: string): Promise<void> {
  if (!uid) return;
  const participantRef = doc(db, 'challenges', challengeId, 'participants', uid);
  await deleteDoc(participantRef);

  const challengeRef = doc(db, 'challenges', challengeId);
  try {
    await updateDoc(challengeRef, {
      participantCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
  } catch (_) {}
}

/**
 * Fetches participant ranking & roster for a challenge.
 */
export async function getChallengeParticipants(
  challengeId: string,
  limitCount = 30
): Promise<ChallengeParticipant[]> {
  try {
    const colRef = collection(db, 'challenges', challengeId, 'participants');
    const q = query(colRef, limit(limitCount));
    const snap = await getDocs(q);

    const participants = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        uid: data.uid || d.id,
        displayName: data.displayName || 'Bloom Member',
        avatarUrl: data.avatarUrl || '',
        joinedAt: data.joinedAt,
        completedDays: data.completedDays || 0,
        currentStreak: data.currentStreak || 0,
        progressVisibility: data.progressVisibility || 'public',
        completionPercentage: data.completionPercentage || 0,
      };
    });

    // Rank by most completed days descending
    participants.sort((a, b) => b.completedDays - a.completedDays);
    return participants;
  } catch (err: any) {
    console.warn('[ChallengeService] Error fetching participants:', err?.message || err);
    return [];
  }
}

/**
 * Fetches a participant's progress record and all completed daily check-ins.
 */
export async function getParticipantProgress(
  challengeId: string,
  uid: string
): Promise<{
  participant: ChallengeParticipant | null;
  checkIns: Record<string, ChallengeDailyCheckIn>;
}> {
  if (!uid) return { participant: null, checkIns: {} };

  try {
    // 1. Get Participant doc
    const participantRef = doc(db, 'challenges', challengeId, 'participants', uid);
    const snap = await getDoc(participantRef);
    if (!snap.exists()) {
      return { participant: null, checkIns: {} };
    }

    const pData = snap.data();
    const participant: ChallengeParticipant = {
      id: snap.id,
      uid: pData.uid || snap.id,
      displayName: pData.displayName || 'Bloom Member',
      avatarUrl: pData.avatarUrl || '',
      joinedAt: pData.joinedAt,
      completedDays: pData.completedDays || 0,
      currentStreak: pData.currentStreak || 0,
      progressVisibility: pData.progressVisibility || 'public',
    };

    // 2. Get Subcollection Check-Ins
    const checkInsCol = collection(db, 'challenges', challengeId, 'participants', uid, 'checkIns');
    const checkInsSnap = await getDocs(checkInsCol);

    const checkIns: Record<string, ChallengeDailyCheckIn> = {};
    checkInsSnap.docs.forEach((d) => {
      const data = d.data();
      checkIns[d.id] = {
        id: d.id,
        date: data.date || d.id,
        completedActivities: data.completedActivities || [],
        completed: data.completed ?? false,
        completionPercentage: data.completionPercentage ?? 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    return { participant, checkIns };
  } catch (error) {
    console.warn('[ChallengeService] Error loading participant progress:', error);
    return { participant: null, checkIns: {} };
  }
}

/**
 * Saves or updates today's daily activities check-in for a challenge.
 * Strictly prevents future date check-ins.
 */
export async function saveDailyCheckIn(
  challengeId: string,
  uid: string,
  dateStr: string,
  completedActivityIds: string[],
  totalActivitiesCount: number
): Promise<{ completed: boolean; completionPercentage: number }> {
  const todayStr = getTodayDateString();

  // Validate: Block future check-ins
  if (dateStr > todayStr) {
    throw new Error('You cannot submit check-ins for future dates.');
  }

  const completed = completedActivityIds.length >= totalActivitiesCount && totalActivitiesCount > 0;
  const completionPercentage = Math.round(
    (completedActivityIds.length / Math.max(1, totalActivitiesCount)) * 100
  );

  // 1. Save to subcollection checkIns/{dateStr}
  const checkInRef = doc(
    db,
    'challenges',
    challengeId,
    'participants',
    uid,
    'checkIns',
    dateStr
  );

  await setDoc(
    checkInRef,
    {
      date: dateStr,
      completedActivities: completedActivityIds,
      completed,
      completionPercentage,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // 2. Recalculate participant stats
  try {
    const checkInsCol = collection(db, 'challenges', challengeId, 'participants', uid, 'checkIns');
    const snap = await getDocs(checkInsCol);

    const completedDaysCount = snap.docs.filter((d) => d.data().completed === true).length;

    const participantRef = doc(db, 'challenges', challengeId, 'participants', uid);
    await updateDoc(participantRef, {
      completedDays: completedDaysCount,
      lastCheckInDate: dateStr,
      completionPercentage,
      updatedAt: serverTimestamp(),
    });
  } catch (_) {}

  return { completed, completionPercentage };
}

// ============================================================================
// 4. COMMUNITY DISCUSSION & COMMENTS SERVICES
// ============================================================================

/**
 * Fetches comments for a specific challenge.
 */
export async function getChallengeComments(
  challengeId: string,
  limitCount = 40
): Promise<ChallengeComment[]> {
  try {
    const colRef = collection(db, 'challenges', challengeId, 'comments');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        challengeId,
        uid: data.uid || '',
        displayName: data.displayName || 'Bloom Member',
        avatarUrl: data.avatarUrl || '',
        message: data.message || '',
        createdAt: data.createdAt,
      };
    });
  } catch (err: any) {
    console.warn('[ChallengeService] Error fetching comments:', err?.message || err);
    return [];
  }
}

/**
 * Adds a new comment to a challenge discussion.
 */
export async function addChallengeComment(
  challengeId: string,
  user: { uid: string; name: string; avatar?: string },
  message: string
): Promise<string> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Comment cannot be empty.');
  }
  if (trimmed.length > 1000) {
    throw new Error('Comment is too long (maximum 1,000 characters).');
  }

  const colRef = collection(db, 'challenges', challengeId, 'comments');
  const docRef = await addDoc(colRef, {
    challengeId,
    uid: user.uid,
    displayName: user.name || 'Bloom Member',
    avatarUrl: user.avatar || '',
    message: trimmed,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Deletes a user's own comment from a challenge discussion.
 */
export async function deleteChallengeComment(
  challengeId: string,
  commentId: string
): Promise<void> {
  const docRef = doc(db, 'challenges', challengeId, 'comments', commentId);
  await deleteDoc(docRef);
}
