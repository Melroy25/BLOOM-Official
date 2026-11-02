/**
 * bloomBackend.ts
 * Unified local backend and real-time state repository for Bloom.
 * Uses AsyncStorage for persistent storage, with instant memory fallback.
 * Pre-populates rich, realistic hackathon demo data so the app is NEVER empty.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
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

const DEFAULT_HEALTH_CONNECT: HealthConnectPermissions = {
  isAppInstalled: false,
  isConnected: false,
  readSleep: false,
  readSteps: false,
  readHeartRate: false,
  readExercise: false,
  lastSyncTimestamp: 'Not synced',
};

const DEFAULT_WIDGET: WidgetSettings = {
  theme: 'sage',
  showLiveScreenTime: true,
  showNextAssignment: true,
  showQuickFocusBtn: true,
  updateIntervalMinutes: 15,
};

// ─── BACKEND DATABASE OPERATIONS ───────────────────────────────────────────────

// 1. Assignments (Backed by Firestore assignments collection)
export async function getBackendAssignments(): Promise<Assignment[]> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const colRef = collection(db, 'assignments');
      const q = query(colRef, where('userId', '==', uid));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      await AsyncStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(list));
      return list;
    } catch (err: any) {
      if (err?.code !== 'permission-denied') {
        console.warn('[bloomBackend] Error loading Firestore assignments:', err?.message || err);
      }
    }
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function saveBackendAssignment(assignment: Assignment): Promise<Assignment[]> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const docRef = doc(db, 'assignments', assignment.id);
      await setDoc(docRef, {
        ...assignment,
        userId: uid,
        updatedAt: serverTimestamp(),
        createdAt: assignment.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[bloomBackend] Error saving assignment to Firestore:', err);
    }
  }
  const list = await getBackendAssignments();
  const idx = list.findIndex((a) => a.id === assignment.id);
  const updated = idx >= 0 ? list.map((a) => (a.id === assignment.id ? assignment : a)) : [assignment, ...list];
  await AsyncStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));
  return updated;
}

export async function toggleBackendAssignmentStatus(id: string): Promise<Assignment[]> {
  const list = await getBackendAssignments();
  let nextStatus: 'pending' | 'submitted' = 'submitted';
  const updated = list.map((a) => {
    if (a.id === id) {
      nextStatus = a.status === 'submitted' ? 'pending' : 'submitted';
      return { ...a, status: nextStatus };
    }
    return a;
  });
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const docRef = doc(db, 'assignments', id);
      await updateDoc(docRef, { status: nextStatus, updatedAt: serverTimestamp() });
    } catch (err) {
      console.warn('[bloomBackend] Error updating assignment status in Firestore:', err);
    }
  }
  await AsyncStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));
  return updated;
}

export async function deleteBackendAssignment(id: string): Promise<Assignment[]> {
  const list = await getBackendAssignments();
  const updated = list.filter((a) => a.id !== id);
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      await deleteDoc(doc(db, 'assignments', id));
    } catch (err) {
      console.warn('[bloomBackend] Error deleting assignment from Firestore:', err);
    }
  }
  await AsyncStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));
  return updated;
}

// 2. Student Tasks (Backed by Firestore tasks collection)
export async function getBackendTasks(): Promise<StudentTask[]> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const colRef = collection(db, 'tasks');
      const q = query(colRef, where('userId', '==', uid));
      const snap = await getDocs(q);
      const list: StudentTask[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || '',
          period: data.period || 'daily',
          category: data.category || 'Study',
          priority: data.priority || 'medium',
          completed: !!data.completed,
          dueDate: data.dueDate,
          timeEstimateMinutes: data.timeEstimateMinutes || 30,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        };
      });
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));
      return list;
    } catch (err: any) {
      if (err?.code !== 'permission-denied') {
        console.warn('[bloomBackend] Error loading tasks from Firestore:', err?.message || err);
      }
    }
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function saveBackendTask(task: StudentTask): Promise<StudentTask[]> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const docRef = doc(db, 'tasks', task.id);
      await setDoc(docRef, {
        ...task,
        userId: uid,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[bloomBackend] Error saving task to Firestore:', err);
    }
  }
  const list = await getBackendTasks();
  const updated = [task, ...list.filter((t) => t.id !== task.id)];
  await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  return updated;
}

export async function toggleBackendTask(id: string): Promise<StudentTask[]> {
  const list = await getBackendTasks();
  let nextCompleted = false;
  const updated = list.map((t) => {
    if (t.id === id) {
      nextCompleted = !t.completed;
      return { ...t, completed: nextCompleted };
    }
    return t;
  });
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      await updateDoc(doc(db, 'tasks', id), { completed: nextCompleted, updatedAt: serverTimestamp() });
    } catch (err) {
      console.warn('[bloomBackend] Error toggling task in Firestore:', err);
    }
  }
  await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  return updated;
}

export async function deleteBackendTask(id: string): Promise<StudentTask[]> {
  const list = await getBackendTasks();
  const updated = list.filter((t) => t.id !== id);
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      console.warn('[bloomBackend] Error deleting task from Firestore:', err);
    }
  }
  await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  return updated;
}

// 3. Habits (Backed by Firestore habits collection)
export async function getBackendHabits(): Promise<HabitItem[]> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const colRef = collection(db, 'habits');
      const q = query(colRef, where('userId', '==', uid));
      const snap = await getDocs(q);
      const list: HabitItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || data.title || '',
          target: data.target || 'Daily',
          streakDays: data.streakDays || data.streakCount || 0,
          completedToday: !!data.completedToday,
          history: Array.isArray(data.history) ? data.history : [false, false, false, false, false, false, !!data.completedToday],
          icon: data.icon || 'star',
        };
      });
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(list));
      return list;
    } catch (err: any) {
      if (err?.code !== 'permission-denied') {
        console.warn('[bloomBackend] Error loading habits from Firestore:', err?.message || err);
      }
    }
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.HABITS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function toggleBackendHabit(id: string): Promise<HabitItem[]> {
  const list = await getBackendHabits();
  let updatedHabit: HabitItem | null = null;
  const updated = list.map((h) => {
    if (h.id === id) {
      const nextCompleted = !h.completedToday;
      const nextStreak = nextCompleted ? h.streakDays + 1 : Math.max(0, h.streakDays - 1);
      const nextHistory = [...h.history.slice(1), nextCompleted];
      updatedHabit = {
        ...h,
        completedToday: nextCompleted,
        streakDays: nextStreak,
        history: nextHistory,
      };
      return updatedHabit;
    }
    return h;
  });
  const uid = auth.currentUser?.uid;
  if (uid && updatedHabit) {
    try {
      await updateDoc(doc(db, 'habits', id), {
        completedToday: (updatedHabit as HabitItem).completedToday,
        streakDays: (updatedHabit as HabitItem).streakDays,
        history: (updatedHabit as HabitItem).history,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[bloomBackend] Error updating habit in Firestore:', err);
    }
  }
  await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updated));
  return updated;
}

export async function addBackendHabit(name: string, target: string, icon: string = 'star'): Promise<HabitItem[]> {
  const newId = `h-${Date.now()}`;
  const newHabit: HabitItem = {
    id: newId,
    name,
    target,
    streakDays: 1,
    completedToday: true,
    history: [false, false, false, false, false, false, true],
    icon,
  };
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      await setDoc(doc(db, 'habits', newId), {
        ...newHabit,
        userId: uid,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[bloomBackend] Error adding habit to Firestore:', err);
    }
  }
  const list = await getBackendHabits();
  const updated = [newHabit, ...list];
  await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updated));
  return updated;
}

// 4. Sleep (Backed by Firestore sleepLogs collection)
export async function getBackendSleep(): Promise<SleepState> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const colRef = collection(db, 'sleepLogs');
      const q = query(colRef, where('userId', '==', uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const sorted = snap.docs.map((d) => d.data()).sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        const latest = sorted[0] as any;
        const totalMinutes = Math.round((latest.sleepDurationHours || 0) * 60);
        return {
          bedtimeTarget: latest.bedtime || '23:00',
          wakeTarget: latest.wakeTime || '07:00',
          actualSleepHours: latest.sleepDurationHours || 0,
          sleepEfficiencyPercent: latest.qualityRating ? latest.qualityRating * 20 : 0,
          remMinutes: Math.round(totalMinutes * 0.22),
          deepMinutes: Math.round(totalMinutes * 0.20),
          lightMinutes: Math.round(totalMinutes * 0.58),
          circadianConsistencyScore: latest.qualityRating ? latest.qualityRating * 20 : 0,
          healthConnectAuthorized: false,
        };
      }
    } catch (err: any) {
      if (err?.code !== 'permission-denied') {
        console.warn('[bloomBackend] Error loading sleep from Firestore:', err);
      }
    }
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    bedtimeTarget: '23:00',
    wakeTarget: '07:00',
    actualSleepHours: 0,
    sleepEfficiencyPercent: 0,
    remMinutes: 0,
    deepMinutes: 0,
    lightMinutes: 0,
    circadianConsistencyScore: 0,
    healthConnectAuthorized: false,
  };
}

export async function updateBackendSleep(update: Partial<SleepState>): Promise<SleepState> {
  const current = await getBackendSleep();
  const merged = { ...current, ...update };
  const uid = auth.currentUser?.uid;
  if (uid && update.actualSleepHours) {
    try {
      const docRef = doc(collection(db, 'sleepLogs'));
      await setDoc(docRef, {
        userId: uid,
        date: new Date().toISOString().split('T')[0],
        bedtime: merged.bedtimeTarget,
        wakeTime: merged.wakeTarget,
        sleepDurationHours: merged.actualSleepHours,
        qualityRating: Math.max(1, Math.round(merged.sleepEfficiencyPercent / 20)),
        source: 'manual',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[bloomBackend] Error saving sleep to Firestore:', err);
    }
  }
  await AsyncStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify(merged));
  return merged;
}

// 5. Stress (Backed by Firestore stressLogs collection)
export async function getBackendStress(): Promise<StressState> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const colRef = collection(db, 'stressLogs');
      const q = query(colRef, where('userId', '==', uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const sorted = snap.docs.map((d) => d.data()).sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        const latest = sorted[0] as any;
        const level = latest.calculatedScore < 35 ? 'Low (Calm)' : latest.calculatedScore < 65 ? 'Moderate' : 'Elevated (Overload)';
        return {
          score: latest.calculatedScore || 0,
          level,
          estimatedHrvMs: 0,
          lastAssessedTime: 'Assessed Recently',
          pss10Answers: latest.answers || [],
        };
      }
    } catch (err: any) {
      if (err?.code !== 'permission-denied') {
        console.warn('[bloomBackend] Error loading stress from Firestore:', err);
      }
    }
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.STRESS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    score: 0,
    level: 'Low (Calm)',
    estimatedHrvMs: 0,
    lastAssessedTime: 'Not assessed yet',
    pss10Answers: [],
  };
}

export async function updateBackendStress(score: number, pssAnswers?: number[]): Promise<StressState> {
  const level = score < 35 ? 'Low (Calm)' : score < 65 ? 'Moderate' : 'Elevated (Overload)';
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today';
  const updated: StressState = {
    score,
    level,
    estimatedHrvMs: 0,
    lastAssessedTime: timeStr,
    pss10Answers: pssAnswers,
  };
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const docRef = doc(collection(db, 'stressLogs'));
      await setDoc(docRef, {
        userId: uid,
        assessmentType: 'pss-10',
        answers: pssAnswers || [],
        calculatedScore: score,
        stressCategory: score < 35 ? 'low' : score < 65 ? 'moderate' : 'high',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[bloomBackend] Error saving stress to Firestore:', err);
    }
  }
  await AsyncStorage.setItem(STORAGE_KEYS.STRESS, JSON.stringify(updated));
  return updated;
}

// 6. SOS Contacts (Backed by Firestore emergencyContacts collection)
export async function getBackendContacts(): Promise<EmergencyContact[]> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const colRef = collection(db, 'emergencyContacts');
      const q = query(colRef, where('userId', '==', uid));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      await AsyncStorage.setItem(STORAGE_KEYS.SOS_CONTACTS, JSON.stringify(list));
      return list;
    } catch (err: any) {
      if (err?.code !== 'permission-denied') {
        console.warn('[bloomBackend] Error loading contacts from Firestore:', err);
      }
    }
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SOS_CONTACTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function addBackendContact(name: string, relation: string, phone: string): Promise<EmergencyContact[]> {
  const uid = auth.currentUser?.uid;
  const newId = `ec-${Date.now()}`;
  const newContact: EmergencyContact = {
    id: newId,
    name,
    relation,
    phone,
    isPrimary: false,
  };
  if (uid) {
    try {
      const docRef = doc(db, 'emergencyContacts', newId);
      await setDoc(docRef, {
        ...newContact,
        userId: uid,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[bloomBackend] Error saving contact to Firestore:', err);
    }
  }
  const list = await getBackendContacts();
  const updated = [...list.filter((c) => c.id !== newId), newContact];
  await AsyncStorage.setItem(STORAGE_KEYS.SOS_CONTACTS, JSON.stringify(updated));
  return updated;
}

export async function deleteBackendContact(id: string): Promise<EmergencyContact[]> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const docRef = doc(db, 'emergencyContacts', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[bloomBackend] Error deleting contact from Firestore:', err);
    }
  }
  const list = await getBackendContacts();
  const updated = list.filter((c) => c.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.SOS_CONTACTS, JSON.stringify(updated));
  return updated;
}

// 7. Smartwatches
export async function getBackendSmartwatches(): Promise<SmartwatchDevice[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SMARTWATCHES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
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
    batteryPercent: 100,
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
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_HEALTH_CONNECT;
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
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_WIDGET;
}

export async function updateBackendWidgetConfig(update: Partial<WidgetSettings>): Promise<WidgetSettings> {
  const current = await getBackendWidgetConfig();
  const merged = { ...current, ...update };
  await AsyncStorage.setItem(STORAGE_KEYS.WIDGET_CONFIG, JSON.stringify(merged));
  return merged;
}
