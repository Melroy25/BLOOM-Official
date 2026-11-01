import React from 'react';
import { Stack } from 'expo-router';
import { MusicPlayerProvider } from '../../components/music/MusicPlayerContext';
import { Colors } from '../../constants/colors';

export default function MusicLayout() {
  return (
    <MusicPlayerProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="playlist" options={{ headerShown: false }} />
        <Stack.Screen name="create-playlist" options={{ headerShown: false }} />
      </Stack>
    </MusicPlayerProvider>
  );
}
