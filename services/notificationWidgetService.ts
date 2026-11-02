import notifee, {
  AndroidImportance,
  EventType,
  Event,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getWidgetData } from './widgetDataService';

export const NOTIFICATION_WIDGET_ID = 'bloom_persistent_widget';
export const NOTIFICATION_CHANNEL_ID = 'bloom_notification_widget';
export const NOTIFICATION_WIDGET_STORAGE_KEY = '@bloom_notification_widget_enabled';
export const PENDING_NOTIFICATION_ROUTE_KEY = '@bloom_pending_notification_route';

/**
 * Creates the Android notification channel with AndroidImportance.LOW
 * (quiet, non-intrusive, persistent notification bar presence)
 */
export async function createBloomNotificationChannel(): Promise<string> {
  if (Platform.OS !== 'android') return NOTIFICATION_CHANNEL_ID;

  return await notifee.createChannel({
    id: NOTIFICATION_CHANNEL_ID,
    name: 'Bloom Persistent Notification Widget',
    description: 'Personalise it ',
    importance: AndroidImportance.LOW,
    vibration: false,
    sound: undefined,
  });
}

/**
 * Displays or updates the persistent Duolingo-style Bloom Notification Widget
 * in the Android drop-down shade and lock screen.
 */
export async function displayBloomNotificationWidget(): Promise<boolean> {
  try {
    // Request permission if needed (Android 13+)
    if (Platform.OS === 'android') {
      await notifee.requestPermission();
      await createBloomNotificationChannel();
    }

    // Retrieve latest live screen time metric
    const widgetData = await getWidgetData();
    const screenTime = widgetData.screenTimeText.replace(' today', '');

    // Display persistent notification
    await notifee.displayNotification({
      id: NOTIFICATION_WIDGET_ID,
      title: '🌿 BLOOM Daily Companion',
      body: `⏳ Screen Time Today: ${screenTime}`,
      data: {
        type: 'bloom_widget',
      },
      android: {
        channelId: NOTIFICATION_CHANNEL_ID,
        ongoing: true, // Prevents swiping away, keeps persistent in shade
        autoCancel: false,
        color: '#789B83', // BLOOM primary accent token
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        actions: [
          {
            title: '🆘 SOS',
            pressAction: {
              id: 'sos',
              launchActivity: 'default',
            },
          },
          {
            title: '🫧 Heal Bubble',
            pressAction: {
              id: 'heal_bubble',
              launchActivity: 'default',
            },
          },
          {
            title: '⏳ Screen Time',
            pressAction: {
              id: 'screen_time',
              launchActivity: 'default',
            },
          },
        ],
      },
    });

    await AsyncStorage.setItem(NOTIFICATION_WIDGET_STORAGE_KEY, 'true');
    return true;
  } catch (error) {
    console.warn('[notificationWidgetService] display error:', error);
    return false;
  }
}

/**
 * Dismisses and cancels the persistent Bloom notification widget
 */
export async function dismissBloomNotificationWidget(): Promise<void> {
  try {
    await notifee.cancelNotification(NOTIFICATION_WIDGET_ID);
    await AsyncStorage.setItem(NOTIFICATION_WIDGET_STORAGE_KEY, 'false');
  } catch (error) {
    console.warn('[notificationWidgetService] dismiss error:', error);
  }
}

/**
 * Checks if the user has enabled the persistent notification widget
 */
export async function isNotificationWidgetActive(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(NOTIFICATION_WIDGET_STORAGE_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Helper to resolve target deep link route from a notification action id
 */
export function getRouteForActionId(actionId?: string): string | null {
  if (actionId === 'sos') return '/sos';
  if (actionId === 'heal_bubble') return '/heal-bubble';
  if (actionId === 'screen_time') return '/tasks';
  return null;
}
