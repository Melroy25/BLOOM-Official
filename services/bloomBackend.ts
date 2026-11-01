/**
 * bloomBackend.ts
 * Unified local backend and real-time state repository for Bloom.
 * Uses AsyncStorage for persistent storage, with instant memory fallback.
 * Pre-populates rich, realistic hackathon demo data so the app is NEVER empty.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Assignment,
  StudentTask,
  HabitItem,
  SleepState,
  StressState,
  EmergencyContact,
  SmartwatchDevice,
  HealthConnectPermissions,
  WidgetSettings,
  AppUsageItem,
} from '../types/tasks';

const STORAGE_KEYS = {
  ASSIGNMENTS: '@bloom_assignments_v2',
  TASKS: '@bloom_tasks_v2',
  HABITS: '@bloom_habits_v2',
  SLEEP: '@bloom_sleep_v2',
  STRESS: '@bloom_stress_v2',
  SCREEN_TIME: '@bloom_screen_time_v2',
  SOS_CONTACTS: '@bloom_sos_contacts_v2',
  SMARTWATCHES: '@bloom_smartwatches_v2',
  HEALTH_CONNECT: '@bloom_health_connect_v2',
  WIDGET_CONFIG: '@bloom_widget_config_v2',
};

// Helper: relative dates YYYY-MM-DD
export function getRelativeDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─── SEED DATA (Pre-populated so judges never see a blank screen) ───────────────

const SEED_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-1',
    title: 'Graph Traversal & Shortest Path Problem Set',
    course: 'CS 301: Algorithms & Data Structures',
    courseColor: '#6AAF7D',
    dueDate: getRelativeDate(0), // Today
    dueTime: '23:59',
    priority: 'high',
    status: 'pending',
    source: 'google_classroom',
    points: 100,
    description: 'Implement Dijkstra & A* search algorithms with execution runtime benchmarks.',
    classroomLink: 'https://classroom.google.com/c/cs301-hw',
    reminderActive: true,
    createdAt: new Date().toISOString(),
    aiStudyPlan: {
      summary: 'High-yield 2-hour sprint breakdown for algorithms problem set.',
      estimatedTotalMinutes: 120,
      recommendedBreakdown: [
        { title: 'Step 1: Set up adjacency list & priority queue skeleton', duration: '25m', done: true },
        { title: 'Step 2: Implement Dijkstra distance relaxation loop', duration: '45m', done: false },
        { title: 'Step 3: Benchmark on graph dataset with 10k nodes', duration: '30m', done: false },
        { title: 'Step 4: Generate plot & upload PDF to Google Classroom', duration: '20m', done: false },
      ],
    },
  },
  {
    id: 'asg-2',
    title: 'Cognitive Memory Experiment Lab Report',
    course: 'PSY 210: Cognitive Neuroscience',
    courseColor: '#7AA7C7',
    dueDate: getRelativeDate(1), // Tomorrow
    dueTime: '17:00',
    priority: 'high',
    status: 'pending',
    source: 'google_classroom',
    points: 50,
    description: 'Analyze Stroop effect reaction times and write discussion on attentional filtering.',
    classroomLink: 'https://classroom.google.com/c/psy210-lab',
    reminderActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'asg-3',
    title: 'Eigenvalues & SVD Compression Paper',
    course: 'MATH 240: Linear Algebra',
    courseColor: '#E8B86D',
    dueDate: getRelativeDate(3),
    dueTime: '23:59',
    priority: 'medium',
    status: 'pending',
    source: 'google_classroom',
    points: 75,
    description: 'Matrix singular value decomposition applied to image compression.',
    reminderActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'asg-4',
    title: 'Literature Review: Circadian Rhythm & Screen Exposure',
    course: 'ENG 105: Technical Communication',
    courseColor: '#A8C5B2',
    dueDate: getRelativeDate(5),
    dueTime: '12:00',
    priority: 'low',
    status: 'submitted',
    source: 'manual',
    points: 40,
    description: 'Summary of peer-reviewed journals on blue light exposure and adolescent sleep architecture.',
    reminderActive: false,
    createdAt: new Date().toISOString(),
  },
];

const SEED_TASKS: StudentTask[] = [
  {
    id: 'st-1',
    title: 'Review Lecture 12: Binary Search Trees & AVL Rotations',
    period: 'daily',
    category: 'Study',
    priority: 'high',
    completed: false,
    timeEstimateMinutes: 45,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'st-2',
    title: 'Solve 3 Practice Probability Distribution Problems',
    period: 'daily',
    category: 'Exam Prep',
    priority: 'medium',
    completed: true,
    timeEstimateMinutes: 30,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'st-3',
    title: 'Read Chapter 4 of Cognitive Neuroscience Textbook',
    period: 'weekly',
    category: 'Study',
    priority: 'medium',
    completed: false,
    timeEstimateMinutes: 60,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'st-4',
    title: 'Group Study Session: Linear Algebra Proofs',
    period: 'weekly',
    category: 'Study',
    priority: 'high',
    completed: false,
    timeEstimateMinutes: 90,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'st-5',
    title: 'Download and print lab safety protocol',
    period: 'daily',
    category: 'Routine',
    priority: 'low',
    completed: true,
    timeEstimateMinutes: 15,
    createdAt: new Date().toISOString(),
  },
];

const SEED_HABITS: HabitItem[] = [
  {
    id: 'h-1',
    name: 'Morning Hydration (500ml water)',
    target: 'Every morning before 9 AM',
    streakDays: 6,
    completedToday: true,
    history: [true, true, true, true, true, true, true],
    icon: 'droplet',
  },
  {
    id: 'h-2',
    name: '30m Distraction-Free Deep Study',
    target: 'Daily during peak focus hours',
    streakDays: 4,
    completedToday: false,
    history: [true, true, true, true, false, true, false],
    icon: 'book',
  },
  {
    id: 'h-3',
    name: 'Screen-Free 45m Before Bedtime',
    target: 'Protects melatonin & REM sleep',
    streakDays: 3,
    completedToday: false,
    history: [false, true, true, true, false, true, false],
    icon: 'moon',
  },
  {
    id: 'h-4',
    name: '15m Morning Outdoor Sunlight',
    target: 'Synchronizes circadian clock',
    streakDays: 7,
    completedToday: true,
    history: [true, true, true, true, true, true, true],
    icon: 'sun',
  },
  {
    id: 'h-5',
    name: 'Mindful 4-7-8 Breathing in Heal Zone',
    target: 'Lowers academic cortisol',
    streakDays: 5,
    completedToday: false,
    history: [true, true, true, true, true, false, false],
    icon: 'heart',
  },
];

const SEED_SLEEP: SleepState = {
  bedtimeTarget: '23:00',
  wakeTarget: '07:00',
  actualSleepHours: 7.4,
  sleepEfficiencyPercent: 86,
  remMinutes: 98,
  deepMinutes: 84,
  lightMinutes: 262,
  circadianConsistencyScore: 84,
  healthConnectAuthorized: true,
};

const SEED_STRESS: StressState = {
  score: 38,
  level: 'Low (Calm)',
  estimatedHrvMs: 54,
  lastAssessedTime: '10:30 AM Today',
  pss10Answers: [1, 2, 1, 2],
};

const SEED_CONTACTS: EmergencyContact[] = [
  { id: 'ec-1', name: 'Campus Safety & Police', relation: 'Security Desk', phone: '1-800-555-SAFE', isPrimary: true },
  { id: 'ec-2', name: 'Mom', relation: 'Family', phone: '+1-555-0199', isPrimary: true },
  { id: 'ec-3', name: 'Alex (Roommate)', relation: 'Dorm Mate', phone: '+1-555-0144', isPrimary: false },
];

const SEED_WATCHES: SmartwatchDevice[] = [
  {
    id: 'w-1',
    name: 'Pixel Watch 2',
    brand: 'Wear OS',
    batteryPercent: 84,
    connected: true,
    lastSyncTime: 'Just now',
    sensorsEnabled: {
      ppgHeartRate: true,
      hrvTelemetry: true,
      sleepSpO2: true,
      skinTemperature: false,
    },
  },
  {
    id: 'w-2',
    name: 'Galaxy Watch 6 Classic',
    brand: 'Galaxy Watch',
    batteryPercent: 92,
    connected: false,
    lastSyncTime: 'Yesterday',
    sensorsEnabled: {
      ppgHeartRate: true,
      hrvTelemetry: true,
      sleepSpO2: false,
      skinTemperature: false,
    },
  },
];

const SEED_HEALTH_CONNECT: HealthConnectPermissions = {
  isAppInstalled: true,
  isConnected: true,
  readSleep: true,
  readSteps: true,
  readHeartRate: true,
  readExercise: false,
  lastSyncTimestamp: 'Synced 5m ago',
};

const SEED_WIDGET: WidgetSettings = {
  theme: 'sage',
  showLiveScreenTime: true,
  showNextAssignment: true,
  showQuickFocusBtn: true,
  updateIntervalMinutes: 15,
};

// ─── BACKEND DATABASE OPERATIONS ───────────────────────────────────────────────

// 1. Assignments
export async function getBackendAssignments(): Promise<Assignment[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(SEED_ASSIGNMENTS));
      return SEED_ASSIGNMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_ASSIGNMENTS;
  }
}

export async function saveBackendAssignment(assignment: Assignment): Promise<Assignment[]> {
  const list = await getBackendAssignments();
  const idx = list.findIndex((a) => a.id === assignment.id);
  let updated: Assignment[];
  if (idx >= 0) {
    updated = list.map((a) => (a.id === assignment.id ? assignment : a));
  } else {
    updated = [assignment, ...list];
  }
  await AsyncStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));
  return updated;
}

export async function toggleBackendAssignmentStatus(id: string): Promise<Assignment[]> {
  const list = await getBackendAssignments();
  const updated = list.map((a) =>
    a.id === id ? { ...a, status: (a.status === 'submitted' ? 'pending' : 'submitted') as any } : a
  );
  await AsyncStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));
  return updated;
}

export async function deleteBackendAssignment(id: string): Promise<Assignment[]> {
  const list = await getBackendAssignments();
  const updated = list.filter((a) => a.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));
  return updated;
}

// 2. Student Tasks
export async function getBackendTasks(): Promise<StudentTask[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(SEED_TASKS));
      return SEED_TASKS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_TASKS;
  }
}

export async function saveBackendTask(task: StudentTask): Promise<StudentTask[]> {
  const list = await getBackendTasks();
  const updated = [task, ...list];
  await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  return updated;
}

export async function toggleBackendTask(id: string): Promise<StudentTask[]> {
  const list = await getBackendTasks();
  const updated = list.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  return updated;
}

export async function deleteBackendTask(id: string): Promise<StudentTask[]> {
  const list = await getBackendTasks();
  const updated = list.filter((t) => t.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  return updated;
}

// 3. Habits
export async function getBackendHabits(): Promise<HabitItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.HABITS);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(SEED_HABITS));
      return SEED_HABITS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_HABITS;
  }
}

export async function toggleBackendHabit(id: string): Promise<HabitItem[]> {
  const list = await getBackendHabits();
  const updated = list.map((h) => {
    if (h.id === id) {
      const nextCompleted = !h.completedToday;
      const nextStreak = nextCompleted ? h.streakDays + 1 : Math.max(0, h.streakDays - 1);
      const nextHistory = [...h.history.slice(0, 6), nextCompleted];
      return {
        ...h,
        completedToday: nextCompleted,
        streakDays: nextStreak,
        history: nextHistory,
      };
    }
    return h;
  });
  await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updated));
  return updated;
}

export async function addBackendHabit(name: string, target: string, icon: string = 'star'): Promise<HabitItem[]> {
  const list = await getBackendHabits();
  const newHabit: HabitItem = {
    id: `h-${Date.now()}`,
    name,
    target,
    streakDays: 1,
    completedToday: true,
    history: [false, false, false, false, false, false, true],
    icon,
  };
  const updated = [newHabit, ...list];
  await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updated));
  return updated;
}

// 4. Sleep
export async function getBackendSleep(): Promise<SleepState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify(SEED_SLEEP));
      return SEED_SLEEP;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_SLEEP;
  }
}

export async function updateBackendSleep(update: Partial<SleepState>): Promise<SleepState> {
  const current = await getBackendSleep();
  const merged = { ...current, ...update };
  await AsyncStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify(merged));
  return merged;
}

// 5. Stress
export async function getBackendStress(): Promise<StressState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.STRESS);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEYS.STRESS, JSON.stringify(SEED_STRESS));
      return SEED_STRESS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_STRESS;
  }
}

export async function updateBackendStress(score: number, pssAnswers?: number[]): Promise<StressState> {
  const level = score < 35 ? 'Low (Calm)' : score < 65 ? 'Moderate' : 'Elevated (Overload)';
  const hrv = Math.round(75 - score * 0.45); // higher stress = lower HRV
  const updated: StressState = {
    score,
    level,
    estimatedHrvMs: Math.max(25, hrv),
    lastAssessedTime: 'Just now',
    pss10Answers: pssAnswers,
  };
  await AsyncStorage.setItem(STORAGE_KEYS.STRESS, JSON.stringify(updated));
  return updated;
}

// 6. SOS Contacts
export async function getBackendContacts(): Promise<EmergencyContact[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SOS_CONTACTS);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEYS.SOS_CONTACTS, JSON.stringify(SEED_CONTACTS));
      return SEED_CONTACTS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_CONTACTS;
  }
}

export async function addBackendContact(name: string, relation: string, phone: string): Promise<EmergencyContact[]> {
  const list = await getBackendContacts();
  const newContact: EmergencyContact = {
    id: `ec-${Date.now()}`,
    name,
    relation,
    phone,
    isPrimary: false,
  };
  const updated = [...list, newContact];
  await AsyncStorage.setItem(STORAGE_KEYS.SOS_CONTACTS, JSON.stringify(updated));
  return updated;
}

export async function deleteBackendContact(id: string): Promise<EmergencyContact[]> {
  const list = await getBackendContacts();
  const updated = list.filter((c) => c.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.SOS_CONTACTS, JSON.stringify(updated));
  return updated;
}

// 7. Smartwatches
export async function getBackendSmartwatches(): Promise<SmartwatchDevice[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SMARTWATCHES);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEYS.SMARTWATCHES, JSON.stringify(SEED_WATCHES));
      return SEED_WATCHES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_WATCHES;
  }
}

export async function toggleBackendSmartwatch(id: string): Promise<SmartwatchDevice[]> {
  const list = await getBackendSmartwatches();
  const updated = list.map((w) =>
    w.id === id
      ? { ...w, connected: !w.connected, lastSyncTime: !w.connected ? 'Just now' : w.lastSyncTime }
      : w
  );
  await AsyncStorage.setItem(STORAGE_KEYS.SMARTWATCHES, JSON.stringify(updated));
  return updated;
}

export async function addBackendSmartwatch(name: string, brand: any): Promise<SmartwatchDevice[]> {
  const list = await getBackendSmartwatches();
  const newWatch: SmartwatchDevice = {
    id: `w-${Date.now()}`,
    name,
    brand,
    batteryPercent: Math.floor(70 + Math.random() * 28),
    connected: true,
    lastSyncTime: 'Just now',
    sensorsEnabled: { ppgHeartRate: true, hrvTelemetry: true, sleepSpO2: true, skinTemperature: true },
  };
  const updated = [newWatch, ...list];
  await AsyncStorage.setItem(STORAGE_KEYS.SMARTWATCHES, JSON.stringify(updated));
  return updated;
}

// 8. Health Connect
export async function getBackendHealthConnect(): Promise<HealthConnectPermissions> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_CONNECT);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_CONNECT, JSON.stringify(SEED_HEALTH_CONNECT));
      return SEED_HEALTH_CONNECT;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_HEALTH_CONNECT;
  }
}

export async function updateBackendHealthConnect(update: Partial<HealthConnectPermissions>): Promise<HealthConnectPermissions> {
  const current = await getBackendHealthConnect();
  const merged = { ...current, ...update };
  await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_CONNECT, JSON.stringify(merged));
  return merged;
}

// 9. Widget Config
export async function getBackendWidgetConfig(): Promise<WidgetSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.WIDGET_CONFIG);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEYS.WIDGET_CONFIG, JSON.stringify(SEED_WIDGET));
      return SEED_WIDGET;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_WIDGET;
  }
}

export async function updateBackendWidgetConfig(update: Partial<WidgetSettings>): Promise<WidgetSettings> {
  const current = await getBackendWidgetConfig();
  const merged = { ...current, ...update };
  await AsyncStorage.setItem(STORAGE_KEYS.WIDGET_CONFIG, JSON.stringify(merged));
  return merged;
}

