import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import {
  requestPinWidget,
  requestWidgetUpdate,
} from 'react-native-android-widget';

// Alias requestPinAppWidget as requested by requirement specification
export const requestPinAppWidget = requestPinWidget;

export const WIDGET_NAME = 'BloomHomeScreenWidget';

export const WIDGET_STORAGE_KEYS = {
  SCREEN_TIME: '@bloom_widget_screen_time',
  HEAL_BUBBLE: '@bloom_widget_heal_bubble',
  LAST_SYNC: '@bloom_widget_last_sync',
};

export interface WidgetDataState {
  screenTimeText: string;
  healBubbleStatus: string;
  healBubbleSessions: number;
}

/**
 * Format minutes into a readable screen time string like "1h 45m today" or "38m today"
 */
export function formatScreenTimeForWidget(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m today`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m today`;
}

/**
 * Save current Screen Time usage to AsyncStorage and sync to widget
 */
export async function saveScreenTimeUsage(
  usage: number | string
): Promise<void> {
  try {
    const textToStore =
      typeof usage === 'number' ? formatScreenTimeForWidget(usage) : usage;
    await AsyncStorage.setItem(WIDGET_STORAGE_KEYS.SCREEN_TIME, textToStore);
    await AsyncStorage.setItem(
      WIDGET_STORAGE_KEYS.LAST_SYNC,
      new Date().toISOString()
    );
  } catch (error) {
    console.warn('[widgetDataService] Failed to save screen time:', error);
  }
}

/**
 * Save Heal Bubble session data to AsyncStorage and sync to widget
 */
export async function saveHealBubbleData(
  data:
    | {
        status?: string;
        sessionsCount?: number;
      }
    | string
): Promise<void> {
  try {
    const stringified =
      typeof data === 'string'
        ? JSON.stringify({ status: data, sessionsCount: 1 })
        : JSON.stringify(data);
    await AsyncStorage.setItem(WIDGET_STORAGE_KEYS.HEAL_BUBBLE, stringified);
    await AsyncStorage.setItem(
      WIDGET_STORAGE_KEYS.LAST_SYNC,
      new Date().toISOString()
    );
  } catch (error) {
    console.warn('[widgetDataService] Failed to save heal bubble data:', error);
  }
}

/**
 * Utility to save both Screen Time usage and Heal Bubble data to AsyncStorage
 */
export async function saveWidgetData(params: {
  screenTimeUsage?: number | string;
  healBubbleData?: { status?: string; sessionsCount?: number } | string;
}): Promise<void> {
  if (params.screenTimeUsage !== undefined) {
    await saveScreenTimeUsage(params.screenTimeUsage);
  }
  if (params.healBubbleData !== undefined) {
    await saveHealBubbleData(params.healBubbleData);
  }
}

/**
 * Retrieve current widget metrics from AsyncStorage with default fallbacks
 */
export async function getWidgetData(): Promise<WidgetDataState> {
  try {
    const [savedScreenTime, savedHealBubble] = await Promise.all([
      AsyncStorage.getItem(WIDGET_STORAGE_KEYS.SCREEN_TIME),
      AsyncStorage.getItem(WIDGET_STORAGE_KEYS.HEAL_BUBBLE),
    ]);

    let screenTimeText = savedScreenTime || '1h 45m today';
    let healBubbleStatus = 'Breathe';
    let healBubbleSessions = 1;

    if (savedHealBubble) {
      try {
        const parsed = JSON.parse(savedHealBubble);
        if (parsed.status) healBubbleStatus = parsed.status;
        if (parsed.sessionsCount) healBubbleSessions = parsed.sessionsCount;
      } catch {
        healBubbleStatus = savedHealBubble;
      }
    }

    return {
      screenTimeText,
      healBubbleStatus,
      healBubbleSessions,
    };
  } catch (error) {
    console.warn('[widgetDataService] Failed to get widget data:', error);
    return {
      screenTimeText: '1h 45m today',
      healBubbleStatus: 'Breathe',
      healBubbleSessions: 1,
    };
  }
}

/**
 * Requests the Android launcher to pin the Bloom Home Screen Widget
 * Utilizes requestPinAppWidget from react-native-android-widget
 */
export async function pinBloomWidget(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    Alert.alert(
      'Home Screen Widgets',
      'Native home screen widgets are supported on Android devices.'
    );
    return false;
  }

  try {
    // 1. Ensure current local data is saved so the widget starts with fresh state
    const data = await getWidgetData();
    await saveScreenTimeUsage(data.screenTimeText);

    // 2. Request pinning from launcher via requestPinAppWidget
    const accepted = await requestPinAppWidget({
      widgetName: WIDGET_NAME,
    });

    if (accepted) {
      Alert.alert(
        'Widget Added',
        'Check your home screen! Bloom quick actions widget has been placed.'
      );
    } else {
      Alert.alert(
        'Add Widget Manually',
        'Your launcher could not place the widget automatically. You can touch and hold your home screen, tap Widgets, and drag Bloom Quick Actions to your home screen.'
      );
    }
    return accepted;
  } catch (error: any) {
    console.warn('[widgetDataService] pinBloomWidget error:', error);
    Alert.alert(
      'Bloom Home Screen Widget',
      'To pin the widget, touch and hold on your home screen, select Widgets, and choose BLOOM. (Programmatic pinning requires an Android build).'
    );
    return false;
  }
}
