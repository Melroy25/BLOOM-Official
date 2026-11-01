/**
 * notificationService.ts
 * Local push notifications for assignment deadlines and screen time alerts.
 *
 * Gracefully no-ops in Expo Go (where expo-notifications native module is
 * unavailable). All functions are safe to call — they just do nothing and
 * return sensible defaults when the native module is missing.
 *
 * Full functionality requires a development build (npx expo run:android).
 */
import { Platform } from 'react-native';
import { Assignment } from '../types/tasks';
import { NotificationPrefs } from './storageService';

// ─── Safe dynamic import ──────────────────────────────────────────────────────
// expo-notifications requires native code. In Expo Go it throws on import.
// We load it at runtime and fall back gracefully if it's unavailable.

type NotifModule = typeof import('expo-notifications');
let N: NotifModule | null = null;

function getNotif(): NotifModule | null {
  if (N) return N;
  try {
    N = require('expo-notifications') as NotifModule;
    // Set handler immediately after first successful load
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowList: true,
      }),
    });
    return N;
  } catch {
    return null;
  }
}

// ─── Channel setup ────────────────────────────────────────────────────────────

export async function setupNotificationChannels(): Promise<void> {
  const notif = getNotif();
  if (!notif || Platform.OS !== 'android') return;
  try {
    await notif.setNotificationChannelAsync('assignments', {
      name: 'Assignment Reminders',
      importance: notif.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#789B83',
      sound: 'default',
    });
    await notif.setNotificationChannelAsync('screen_time', {
      name: 'Screen Time Alerts',
      importance: notif.AndroidImportance.DEFAULT,
      lightColor: '#789B83',
      sound: null,
    });
  } catch {}
}

// ─── Permission ───────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const notif = getNotif();
  if (!notif) return false;
  try {
    const { status: existing } = await notif.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await notif.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const notif = getNotif();
  if (!notif) return 'undetermined';
  try {
    const { status } = await notif.getPermissionsAsync();
    return status as 'granted' | 'denied' | 'undetermined';
  } catch {
    return 'undetermined';
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

interface ReminderOffset {
  key: string;
  hoursBeforeDeadline: number;
  label: string;
}

const REMINDER_OFFSETS: ReminderOffset[] = [
  { key: '24h', hoursBeforeDeadline: 24, label: '24 hours' },
  { key: '12h', hoursBeforeDeadline: 12, label: '12 hours' },
  { key: '3h',  hoursBeforeDeadline: 3,  label: '3 hours'  },
  { key: '1h',  hoursBeforeDeadline: 1,  label: '1 hour'   },
];

function notifId(assignmentId: string, offsetKey: string): string {
  return `bloom_asg_${assignmentId}_${offsetKey}`;
}

// ─── Schedule reminders ───────────────────────────────────────────────────────

export async function scheduleAssignmentReminders(
  assignment: Assignment,
  prefs: NotificationPrefs
): Promise<void> {
  const notif = getNotif();
  if (!notif || !prefs.enabled || assignment.status === 'submitted') return;

  const [year, month, day] = assignment.dueDate.split('-').map(Number);
  const [hour, minute] = (assignment.dueTime || '23:59').split(':').map(Number);
  const deadline = new Date(year, month - 1, day, hour, minute, 0);

  await cancelAssignmentReminders(assignment.id);

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const now = new Date();

  for (const offset of REMINDER_OFFSETS) {
    const wanted =
      (offset.key === '24h' && prefs.remind24h) ||
      (offset.key === '12h' && prefs.remind12h) ||
      (offset.key === '3h'  && prefs.remind3h)  ||
      (offset.key === '1h'  && prefs.remind1h);

    if (!wanted) continue;

    const triggerTime = new Date(
      deadline.getTime() - offset.hoursBeforeDeadline * 60 * 60 * 1000
    );
    if (triggerTime <= now) continue;

    try {
      await notif.scheduleNotificationAsync({
        identifier: notifId(assignment.id, offset.key),
        content: {
          title: `📚 Assignment Due in ${offset.label}`,
          body: `"${assignment.title}" (${assignment.course}) is due at ${assignment.dueTime}.`,
          data: { assignmentId: assignment.id, type: 'assignment_reminder' },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'assignments' }),
        },
        trigger: {
          type: notif.SchedulableTriggerInputTypes.DATE,
          date: triggerTime,
        },
      });
    } catch {}
  }
}

// ─── Cancel reminders ─────────────────────────────────────────────────────────

export async function cancelAssignmentReminders(assignmentId: string): Promise<void> {
  const notif = getNotif();
  if (!notif) return;
  for (const offset of REMINDER_OFFSETS) {
    try {
      await notif.cancelScheduledNotificationAsync(notifId(assignmentId, offset.key));
    } catch {}
  }
}

export async function cancelAllBloomNotifications(): Promise<void> {
  const notif = getNotif();
  if (!notif) return;
  try {
    const scheduled = await notif.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n: any) => n.identifier.startsWith('bloom_asg_'))
        .map((n: any) => notif.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {}
}

export async function rescheduleAllAssignmentReminders(
  assignments: Assignment[],
  prefs: NotificationPrefs
): Promise<void> {
  const pending = assignments.filter((a) => a.status !== 'submitted');
  await Promise.all(pending.map((a) => scheduleAssignmentReminders(a, prefs)));
}

// ─── Screen time & Bedtime alerts ─────────────────────────────────────────────

export interface InAppAlert {
  id: string;
  title: string;
  body: string;
  type: 'screen_time' | 'sleep' | 'assignment';
  timestamp: Date;
}

type AlertListener = (alert: InAppAlert) => void;
const alertListeners: Set<AlertListener> = new Set();

export function subscribeToInAppAlerts(listener: AlertListener): () => void {
  alertListeners.add(listener);
  return () => {
    alertListeners.delete(listener);
  };
}

export function dispatchInAppAlert(
  title: string,
  body: string,
  type: 'screen_time' | 'sleep' | 'assignment' = 'screen_time'
): void {
  const alert: InAppAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    body,
    type,
    timestamp: new Date(),
  };
  alertListeners.forEach((listener) => {
    try {
      listener(alert);
    } catch {}
  });
}

export async function sendScreenTimeAlert(title: string, body: string): Promise<void> {
  // Always dispatch in-app alert first so user sees heads-up banner on screen immediately
  dispatchInAppAlert(title, body, 'screen_time');

  const notif = getNotif();
  if (!notif) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;
  try {
    await notif.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'screen_time_alert' },
        ...(Platform.OS === 'android' && { channelId: 'screen_time' }),
      },
      trigger: null,
    });
  } catch {}
}

/**
 * Fires an excessive screen time warning for a specific app or total time
 */
export async function sendExcessiveAppAlert(
  appName: string,
  usageMinutes: number,
  limitMinutes: number
): Promise<void> {
  const title = `⚠️ Screen Time Limit: ${appName}`;
  const body = `You've spent ${usageMinutes} mins on ${appName} today (limit: ${limitMinutes} mins). Time to take a break!`;
  await sendScreenTimeAlert(title, body);
}

/**
 * Fires a bedtime notification warning when user is on their phone late at night
 */
export async function sendBedtimeNotification(
  currentHour: number = new Date().getHours(),
  screenMinutes: number = 151
): Promise<void> {
  const formattedHour = currentHour >= 12 ? `${currentHour === 12 ? 12 : currentHour - 12}:00 PM` : `${currentHour}:00 AM`;
  const title = `🌙 Time to Sleep — Blue Light Warning (${formattedHour})`;
  const body = `It's late and you've used your phone for ${Math.floor(screenMinutes / 60)}h ${screenMinutes % 60}m today. Late-night screen exposure delays melatonin and disrupts REM sleep. Time to wind down!`;
  
  dispatchInAppAlert(title, body, 'sleep');

  const notif = getNotif();
  if (!notif) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;
  try {
    await notif.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'bedtime_alert' },
        ...(Platform.OS === 'android' && { channelId: 'screen_time' }),
      },
      trigger: null,
    });
  } catch {}
}
