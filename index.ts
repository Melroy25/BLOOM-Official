import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { Platform } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widgetTaskHandler } from './widgets/widgetTaskHandler';
import {
  PENDING_NOTIFICATION_ROUTE_KEY,
  getRouteForActionId,
} from './services/notificationWidgetService';

// 1. Register Android Widget background task handler at application entry
if (Platform.OS === 'android') {
  try {
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch (err) {
    // Handled gracefully in Expo Go or non-native testing environments
  }
}

// 2. Wire Notifee background event listener for persistent notification tray actions
try {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS && detail.pressAction) {
      const route = getRouteForActionId(detail.pressAction.id);
      if (route) {
        await AsyncStorage.setItem(PENDING_NOTIFICATION_ROUTE_KEY, route);
      }
    }
  });
} catch (err) {
  // Graceful fallback for non-native environments
}

import 'expo-router/entry';
