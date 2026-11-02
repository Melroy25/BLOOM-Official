import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
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
      </Stack>
    </>
  );
}

export default function RootLayout() {
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
  }, []);

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
