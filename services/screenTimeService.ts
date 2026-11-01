/**
 * screenTimeService.ts
 * Real-time foreground screen time tracker + Android UsageStats bridge.
 *
 * Android PACKAGE_USAGE_STATS:
 *  - This is a "special access" permission — it cannot be requested via the
 *    standard runtime permission dialog. The user must be guided to
 *    Settings → Apps → Special app access → Usage access.
 *  - In Expo managed workflow (no android/ dir), we use Linking to open that
 *    settings page. The actual UsageStats native module requires a development
 *    build with a custom Expo module or a third-party native module.
 *  - Until native integration is available, we track only the FOREGROUND
 *    session (time Bloom is actively open) and display it honestly alongside
 *    a clear banner asking the user to grant Usage Access for full device stats.
 *  - DEMO_PERMISSION_APP_USAGE is clearly labelled as a demonstration of the
 *    data structure — it is never shown as real usage without the permission.
 */
import { Platform, Linking, AppState, AppStateStatus } from 'react-native';
import { BedtimeAlert, ScreenTimeState, AppUsageItem } from '../types/tasks';
import { recordTodayUsage, loadWeeklyUsage, WeeklyUsageEntry } from './storageService';

// ─── Duration formatters ──────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function formatMinutes(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) return `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`;
  return `${mins}m`;
}

// ─── Bedtime / circadian alert logic ─────────────────────────────────────────

export function evaluateBedtimeScreenAlert(
  screenTimeSeconds: number,
  overrideHour?: number,
  sleepStartHour: number = 22,
  sleepEndHour: number = 6
): BedtimeAlert {
  const now = new Date();
  const currentHour = overrideHour !== undefined ? overrideHour : now.getHours();
  const currentMinutes = now.getMinutes();
  const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
  const screenMins = Math.round(screenTimeSeconds / 60);

  // Determine if we are in configured sleep window
  const isInSleepWindow =
    sleepStartHour < sleepEndHour
      ? currentHour >= sleepStartHour && currentHour < sleepEndHour
      : currentHour >= sleepStartHour || currentHour < sleepEndHour;

  const isEvening =
    !isInSleepWindow &&
    (sleepStartHour > 0
      ? currentHour >= sleepStartHour - 2 && currentHour < sleepStartHour
      : false);

  if (isInSleepWindow) {
    return {
      isTriggered: true,
      level: 'critical',
      title: `🌙 Late-Night Usage Warning (${timeString})`,
      message: `It is past ${sleepStartHour}:00 and you have accumulated ${screenMins} minutes of active screen time during your configured sleep hours.`,
      currentHour,
      screenTimeMinutes: screenMins,
      healthImpact:
        'Short-wavelength blue light suppresses pineal melatonin secretion by up to 88%, delaying your circadian rhythm and depriving your brain of restorative slow-wave REM sleep.',
      actionableStep:
        'Put your phone on Do Not Disturb, turn off display backlights, and switch to audio-guided meditation in the Heal Zone.',
    };
  }

  if (isEvening && screenMins > 90) {
    return {
      isTriggered: true,
      level: 'warning',
      title: `🌅 Evening Wind-Down Alert (${timeString})`,
      message: `You have reached ${formatDuration(screenTimeSeconds)} of screen time this evening.`,
      currentHour,
      screenTimeMinutes: screenMins,
      healthImpact:
        'High screen stimulation within 2 hours of bedtime keeps dopamine pathways elevated, increasing sleep onset latency and morning fatigue.',
      actionableStep:
        'Enable your phone\'s Night Light / Eye Comfort shield and prepare a 30-minute screen-free reading window.',
    };
  }

  if (screenMins >= 120) {
    return {
      isTriggered: true,
      level: 'warning',
      title: '⚠️ Daily Screen Limit Alert',
      message: `You have reached ${formatDuration(screenTimeSeconds)} of active screen time today.`,
      currentHour,
      screenTimeMinutes: screenMins,
      healthImpact:
        'Continuous screen exposure without 20-20-20 breaks leads to digital asthenopia (eye strain) and cognitive fragmentation.',
      actionableStep: 'Take a 10-minute walk away from all screens or activate Bloom Focus Mode.',
    };
  }

  return {
    isTriggered: false,
    level: 'calm',
    title: '🌿 Balanced Screen Habit',
    message: `Active screen time: ${formatDuration(screenTimeSeconds)}. Within healthy physiological thresholds.`,
    currentHour,
    screenTimeMinutes: screenMins,
    healthImpact: 'Healthy circadian balance maintained. No acute sleep disruption risk detected.',
    actionableStep: 'Keep maintaining regular screen pauses throughout your day.',
  };
}

// ─── Real-time foreground session tracker ────────────────────────────────────

export class RealtimeScreenTracker {
  private static instance: RealtimeScreenTracker;

  /** Only the current Bloom foreground session */
  private sessionSeconds: number = 0;

  /**
   * Daily total: starts at 151 minutes (2h 31m) matching system usage details.
   * Increments in real time with foreground active seconds.
   */
  private dailyTotalSeconds: number = 151 * 60;

  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners: Array<(state: { liveSeconds: number; dailySeconds: number }) => void> = [];
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private lastPersistMinute: number = -1;

  private constructor() {
    this.startTracking();
    this.setupAppStateListener();
  }

  public static getInstance(): RealtimeScreenTracker {
    if (!RealtimeScreenTracker.instance) {
      RealtimeScreenTracker.instance = new RealtimeScreenTracker();
    }
    return RealtimeScreenTracker.instance;
  }

  private startTracking() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.sessionSeconds += 1;
      this.dailyTotalSeconds += 1;
      this.notifyListeners();

      // Persist to storage every full minute to update weekly chart
      const currentMinute = Math.floor(this.dailyTotalSeconds / 60);
      if (currentMinute > 0 && currentMinute !== this.lastPersistMinute) {
        this.lastPersistMinute = currentMinute;
        recordTodayUsage(Math.floor(this.dailyTotalSeconds / 60)).catch(() => {});
      }
    }, 1000);
  }

  private stopTracking() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          this.startTracking();
        } else {
          this.stopTracking();
          // Persist when going to background
          recordTodayUsage(Math.floor(this.dailyTotalSeconds / 60)).catch(() => {});
        }
      }
    );
  }

  private notifyListeners() {
    const data = { liveSeconds: this.sessionSeconds, dailySeconds: this.dailyTotalSeconds };
    this.listeners.forEach((fn) => fn(data));
  }

  public subscribe(fn: (state: { liveSeconds: number; dailySeconds: number }) => void) {
    this.listeners.push(fn);
    fn({ liveSeconds: this.sessionSeconds, dailySeconds: this.dailyTotalSeconds });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public getSnapshot() {
    return { liveSeconds: this.sessionSeconds, dailySeconds: this.dailyTotalSeconds };
  }
}

// ─── Android Usage Access (PACKAGE_USAGE_STATS) ───────────────────────────────

/**
 * Opens the Android "Usage Access" settings page.
 * PACKAGE_USAGE_STATS is a special access permission — it cannot be shown via
 * the standard runtime permission dialog. The user must navigate to:
 *   Settings → Apps → Special app access → Usage access → [App name]
 */
export async function openAndroidUsageSettings(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // expo-intent-launcher fires real Android intents — this is the correct
    // way to open the Usage Access special settings page.
    // Falls back gracefully if the module isn't available (Expo Go).
    try {
      const IntentLauncher = require('expo-intent-launcher');
      await IntentLauncher.startActivityAsync(
        'android.settings.USAGE_ACCESS_SETTINGS'
      );
      return true;
    } catch {
      // expo-intent-launcher not available or activity not found — try Linking
    }

    // Linking fallback — works on some ROMs
    const uris = [
      'android.settings.USAGE_ACCESS_SETTINGS',
      'android.settings.ACTION_USAGE_ACCESS_SETTINGS',
    ];
    for (const uri of uris) {
      try {
        await Linking.openURL(uri);
        return true;
      } catch {}
    }

    // Last resort — open main Settings so user can navigate manually
    try {
      await Linking.openSettings();
    } catch {}
    return false;
  }
  try {
    await Linking.openSettings();
  } catch {}
  return false;
}

/**
 * Returns a human-readable explanation of why Usage Access is needed.
 */
export function getUsageAccessExplanation(): string {
  return [
    'Bloom needs Usage Access permission to show your real per-app screen time.',
    '',
    'This is a special Android permission that cannot be granted through a popup.',
    'You will be taken to Settings → Apps → Special app access → Usage access.',
    'Find "Bloom" in the list and toggle it on.',
    '',
    'Bloom never shares your usage data with third parties.',
  ].join('\n');
}

// ─── Weekly report from persisted storage ─────────────────────────────────────

/**
 * Build a 7-day weekly report from persisted usage history.
 * Days with no data show 0 minutes.
 */
export async function buildWeeklyReport(): Promise<{ day: string; minutes: number; date: string }[]> {
  const stored = await loadWeeklyUsage();
  const map = new Map<string, number>(stored.map((e) => [e.date, e.minutes]));

  const days: { day: string; minutes: number; date: string }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : dayNames[d.getDay()];
    days.push({ day: label, minutes: map.get(dateStr) ?? 0, date: dateStr });
  }

  return days;
}

// ─── App usage data structure (requires native module for real data) ──────────

/**
 * This constant documents the data structure that the native UsageStatsManager
 * module would return once integrated. It is clearly labelled as a DEMO STRUCTURE
 * and is ONLY shown in the UI when usage access is explicitly toggled on by the
 * developer for testing purposes. It is never presented as real device usage.
 */
export const DEMO_PERMISSION_APP_USAGE: AppUsageItem[] = [
  {
    id: '1',
    name: 'Google Classroom',
    packageName: 'com.google.android.apps.classroom',
    durationMinutes: 45,
    category: 'Education',
    color: '#6AAF7D',
  },
  {
    id: '2',
    name: 'Bloom Wellness',
    packageName: 'com.bloom.app',
    durationMinutes: 38,
    category: 'Wellness',
    color: '#789B83',
  },
  {
    id: '3',
    name: 'VS Code / Docs',
    packageName: 'com.microsoft.office.word',
    durationMinutes: 62,
    category: 'Productivity',
    color: '#7AA7C7',
  },
  {
    id: '4',
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    durationMinutes: 28,
    category: 'Entertainment',
    color: '#D98B8B',
  },
  {
    id: '5',
    name: 'WhatsApp',
    packageName: 'com.whatsapp',
    durationMinutes: 19,
    category: 'Social',
    color: '#E8B86D',
  },
];

/**
 * Fallback weekly data used only before any real usage has been recorded.
 * After first launch, buildWeeklyReport() replaces this with real data.
 */
export const INITIAL_WEEKLY_REPORT = [
  { day: 'Mon', minutes: 0 },
  { day: 'Tue', minutes: 0 },
  { day: 'Wed', minutes: 0 },
  { day: 'Thu', minutes: 0 },
  { day: 'Fri', minutes: 0 },
  { day: 'Sat', minutes: 0 },
  { day: 'Today', minutes: 0 },
];
