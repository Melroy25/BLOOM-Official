import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { initLocationOnAppOpen } from '../services/locationService';
import { setupNotificationChannels } from '../services/notificationService';

export default function RootLayout() {
  useEffect(() => {
    // 1. Setup high-priority notification channels
    setupNotificationChannels();

    // 2. Prompt for GPS location permission immediately on app startup
    // If granted, fetches real GPS coordinates and physical address
    initLocationOnAppOpen();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: 'fade',
            }}
          >
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
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
