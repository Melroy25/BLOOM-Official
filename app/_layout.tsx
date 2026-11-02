import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { Colors } from '../constants/colors';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { initLocationOnAppOpen } from '../services/locationService';
import { setupNotificationChannels } from '../services/notificationService';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from '../widgets/widgetTaskHandler';
import notifee, { EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PENDING_NOTIFICATION_ROUTE_KEY,
  getRouteForActionId,
} from '../services/notificationWidgetService';

// Register background task handler for Android widgets safely
if (Platform.OS === 'android') {
  try {
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch (err) {
    // Graceful fallback in environments where native module isn't loaded
  }
}

function RootNavigationCoordinator() {
  const { user, isLoading, onboardingCompleted } = useAuth();
  const { colors, isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // 1. Wait until navigation state is fully mounted
    if (!rootNavigationState?.key) return;

    // 2. Wait until Firebase Auth initial state determination finishes
    if (isLoading) return;

    const segmentList = segments as string[];
    const firstSegment = segmentList[0];
    const inAuthGroup = firstSegment === '(auth)';
    const inOnboardingGroup = firstSegment === '(onboarding)';
    const isAtRoot = !firstSegment || firstSegment === 'index';

    // Case 1: Unauthenticated user -> must be in (auth)
    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Case 2: Authenticated user with incomplete onboarding -> must be in (onboarding)
    if (!onboardingCompleted) {
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)');
      }
      return;
    }

    // Case 3: Authenticated user with completed onboarding
    // If currently on auth screens, onboarding, or the root index, route to Dashboard
    if (inAuthGroup || inOnboardingGroup || isAtRoot) {
      router.replace('/(tabs)');
    }
  }, [user, onboardingCompleted, isLoading, segments, rootNavigationState?.key]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="heal-bubble"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="music"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="sos"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const router = useRouter();

  // On native, load TTF font assets. On web, Google Fonts CSS is loaded in parallel.
  const [fontsLoaded] = useFonts(
    Platform.OS === 'web'
      ? {}
      : {
          'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
          'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
          'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
          'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
          'PlusJakartaSans-ExtraBold': PlusJakartaSans_800ExtraBold,
          'JetBrainsMono-Regular': JetBrainsMono_400Regular,
          'JetBrainsMono-Medium': JetBrainsMono_500Medium,
          'JetBrainsMono-SemiBold': JetBrainsMono_600SemiBold,
          'JetBrainsMono-Bold': JetBrainsMono_700Bold,
        }
  );

  useEffect(() => {
    // 1. Setup web Google Fonts stylesheet link
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const linkId = 'bloom-google-fonts';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
        document.head.appendChild(link);
      }
    }

    // 2. Setup high-priority notification channels
    setupNotificationChannels();

    // 3. Prompt for GPS location permission immediately on app startup
    initLocationOnAppOpen();

    // 3. Resolve widget deep-links cleanly for /sos, /tasks (screen time), and /heal-bubble
    const resolveWidgetDeepLink = (url: string | null) => {
      if (!url) return;
      try {
        const parsed = Linking.parse(url);
        // Normalize path and hostname
        const path = (parsed.path || '').replace(/^\/+/, '');
        const hostname = parsed.hostname || '';
        const target = (hostname + '/' + path).replace(/\/+$/, '').toLowerCase();

        if (target.includes('sos') || path === 'sos') {
          router.push('/sos');
        } else if (target.includes('heal-bubble') || path === 'heal-bubble') {
          router.push('/heal-bubble');
        } else if (
          target.includes('screen-time') ||
          target.includes('tasks') ||
          path === 'tasks' ||
          path === 'screen-time'
        ) {
          router.push('/(tabs)/tasks/screen-time');
        }
      } catch (err) {
        console.warn('[RootLayout] Error resolving widget deep link:', err);
      }
    };

    // Listen for incoming deep links while app is open/backgrounded
    const subscription = Linking.addEventListener('url', (event) => {
      resolveWidgetDeepLink(event.url);
    });

    // Check if app was opened via widget deep link from cold start
    Linking.getInitialURL().then((url) => {
      if (url) {
        resolveWidgetDeepLink(url);
      }
    });

    // 4. Handle Notifee Notification Widget Foreground Events
    let unsubscribeForeground = () => {};
    try {
      unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.ACTION_PRESS && detail.pressAction) {
          const route = getRouteForActionId(detail.pressAction.id);
          if (route) {
            router.push(route as any);
          }
        }
      });
    } catch (e) {
      // Graceful fallback for non-native environments
    }

    // 5. Check pending route saved from Notifee background event
    AsyncStorage.getItem(PENDING_NOTIFICATION_ROUTE_KEY)
      .then((pendingRoute) => {
        if (pendingRoute) {
          AsyncStorage.removeItem(PENDING_NOTIFICATION_ROUTE_KEY).catch(() => {});
          router.push(pendingRoute as any);
        }
      })
      .catch(() => {});

    // 6. Check initial notification on cold start
    notifee
      .getInitialNotification()
      .then((initial) => {
        if (initial?.pressAction) {
          const route = getRouteForActionId(initial.pressAction.id);
          if (route) {
            router.push(route as any);
          }
        }
      })
      .catch(() => {});

    return () => {
      subscription.remove();
      unsubscribeForeground();
    };
  }, [router]);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <RootNavigationCoordinator />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
