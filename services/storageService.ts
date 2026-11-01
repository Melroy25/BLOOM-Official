/**
 * storageService.ts
 * Persistent local storage using AsyncStorage.
 * Acts as the app's local database layer — replaces all hardcoded mock state.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Assignment } from '../types/tasks';

// Storage keys
const KEYS = {
  ASSIGNMENTS: '@bloom_assignments',
  SCREEN_DAILY_LIMIT: '@bloom_screen_daily_limit_minutes',
  SCREEN_SLEEP_START: '@bloom_sleep_start_hour',
  SCREEN_SLEEP_END: '@bloom_sleep_end_hour',
  APP_LIMITS: '@bloom_app_limits',
  GOOGLE_AUTH: '@bloom_google_auth',
  NOTIFICATION_PREFS: '@bloom_notification_prefs',
  WEEKLY_USAGE: '@bloom_weekly_usage',
} as const;

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function loadAssignments(): Promise<Assignment[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ASSIGNMENTS);
    if (!raw) return [];
    return JSON.parse(raw) as Assignment[];
  } catch {
    return [];
  }
}

export async function saveAssignments(assignments: Assignment[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  } catch {
    // Silent fail — data will be lost on next reload but app won't crash
  }
}

export async function upsertAssignment(assignment: Assignment): Promise<Assignment[]> {
  const all = await loadAssignments();
  const idx = all.findIndex((a) => a.id === assignment.id);
  if (idx >= 0) {
    all[idx] = assignment;
  } else {
    all.unshift(assignment);
  }
  await saveAssignments(all);
  return all;
}

export async function deleteAssignment(id: string): Promise<Assignment[]> {
  const all = await loadAssignments();
  const filtered = all.filter((a) => a.id !== id);
  await saveAssignments(filtered);
  return filtered;
}

// ─── Screen Time Settings ─────────────────────────────────────────────────────

export interface ScreenTimeSettings {
  dailyLimitMinutes: number;
  sleepStartHour: number; // 22 = 10 PM
  sleepEndHour: number;   // 6 = 6 AM
  appLimits: Record<string, number>; // packageName -> minutes
}

const DEFAULT_SETTINGS: ScreenTimeSettings = {
  dailyLimitMinutes: 120,
  sleepStartHour: 22,
  sleepEndHour: 6,
  appLimits: {},
};

export async function loadScreenTimeSettings(): Promise<ScreenTimeSettings> {
  try {
    const [limit, sleepStart, sleepEnd, appLimitsRaw] = await Promise.all([
      AsyncStorage.getItem(KEYS.SCREEN_DAILY_LIMIT),
      AsyncStorage.getItem(KEYS.SCREEN_SLEEP_START),
      AsyncStorage.getItem(KEYS.SCREEN_SLEEP_END),
      AsyncStorage.getItem(KEYS.APP_LIMITS),
    ]);
    return {
      dailyLimitMinutes: limit ? parseInt(limit, 10) : DEFAULT_SETTINGS.dailyLimitMinutes,
      sleepStartHour: sleepStart ? parseInt(sleepStart, 10) : DEFAULT_SETTINGS.sleepStartHour,
      sleepEndHour: sleepEnd ? parseInt(sleepEnd, 10) : DEFAULT_SETTINGS.sleepEndHour,
      appLimits: appLimitsRaw ? JSON.parse(appLimitsRaw) : {},
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveScreenTimeSettings(settings: ScreenTimeSettings): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(KEYS.SCREEN_DAILY_LIMIT, String(settings.dailyLimitMinutes)),
      AsyncStorage.setItem(KEYS.SCREEN_SLEEP_START, String(settings.sleepStartHour)),
      AsyncStorage.setItem(KEYS.SCREEN_SLEEP_END, String(settings.sleepEndHour)),
      AsyncStorage.setItem(KEYS.APP_LIMITS, JSON.stringify(settings.appLimits)),
    ]);
  } catch {}
}

// ─── Google Auth Token (secure-ish via AsyncStorage — use expo-secure-store for prod) ──

export interface GoogleAuthData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // unix ms
  userEmail: string;
  userName: string;
  userId: string;
}

export async function loadGoogleAuth(): Promise<GoogleAuthData | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.GOOGLE_AUTH);
    if (!raw) return null;
    return JSON.parse(raw) as GoogleAuthData;
  } catch {
    return null;
  }
}

export async function saveGoogleAuth(data: GoogleAuthData): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.GOOGLE_AUTH, JSON.stringify(data));
  } catch {}
}

export async function clearGoogleAuth(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.GOOGLE_AUTH);
  } catch {}
}

// ─── Notification Preferences ─────────────────────────────────────────────────

export interface NotificationPrefs {
  enabled: boolean;
  remind24h: boolean;
  remind12h: boolean;
  remind3h: boolean;
  remind1h: boolean;
}

const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
  enabled: true,
  remind24h: true,
  remind12h: false,
  remind3h: true,
  remind1h: true,
};

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.NOTIFICATION_PREFS);
    if (!raw) return DEFAULT_NOTIF_PREFS;
    return { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIF_PREFS;
  }
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.NOTIFICATION_PREFS, JSON.stringify(prefs));
  } catch {}
}

// ─── Weekly Usage Cache (for charts) ─────────────────────────────────────────

export interface WeeklyUsageEntry {
  date: string; // YYYY-MM-DD
  minutes: number;
}

export async function loadWeeklyUsage(): Promise<WeeklyUsageEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.WEEKLY_USAGE);
    if (!raw) return [];
    return JSON.parse(raw) as WeeklyUsageEntry[];
  } catch {
    return [];
  }
}

export async function saveWeeklyUsage(entries: WeeklyUsageEntry[]): Promise<void> {
  try {
    // Keep last 14 days only
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
    await AsyncStorage.setItem(KEYS.WEEKLY_USAGE, JSON.stringify(sorted));
  } catch {}
}

export async function recordTodayUsage(minutes: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const all = await loadWeeklyUsage();
  const idx = all.findIndex((e) => e.date === today);
  if (idx >= 0) {
    all[idx].minutes = minutes;
  } else {
    all.push({ date: today, minutes });
  }
  await saveWeeklyUsage(all);
}
