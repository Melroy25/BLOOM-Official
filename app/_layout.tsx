import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { initLocationOnAppOpen } from '../services/locationService';
import { setupNotificationChannels } from '../services/notificationService';

function RootNavigationCoordinator() {
  const { user, isLoading, onboardingCompleted } = useAuth();
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
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
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
  );
}

export default function RootLayout() {
  useEffect(() => {
    // 1. Setup high-priority notification channels
    setupNotificationChannels();

    // 2. Prompt for GPS location permission immediately on app startup
    initLocationOnAppOpen();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <StatusBar style="dark" />
          <RootNavigationCoordinator />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
