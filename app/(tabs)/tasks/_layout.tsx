import React from 'react';
import { Stack } from 'expo-router';

export default function TasksStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="screen-time" options={{ headerShown: false }} />
      <Stack.Screen name="goals" options={{ headerShown: false }} />
      <Stack.Screen name="tracking" options={{ headerShown: false }} />
      <Stack.Screen name="student-task" options={{ headerShown: false }} />
      <Stack.Screen name="assignments" options={{ headerShown: false }} />
    </Stack>
  );
}
