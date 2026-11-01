import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { Leaf } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Shadows } from '../constants/shadows';

export default function RootIndexScreen() {
  const { user, isLoading, onboardingCompleted } = useAuth();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key || isLoading) return;

    if (!user) {
      router.replace('/(auth)/login');
    } else if (!onboardingCompleted) {
      router.replace('/(onboarding)');
    } else {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, onboardingCompleted, rootNavigationState?.key]);

  return (
    <View style={styles.container}>
      <View style={[styles.logoIconBg, Shadows.sm]}>
        <Leaf size={42} color={Colors.primary} strokeWidth={2.2} />
      </View>
      <Text style={styles.brandTitle}>BLOOM</Text>
      <Text style={styles.brandSubtitle}>Mindful Productivity & Student Wellness</Text>
      <ActivityIndicator size="small" color={Colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 4,
  },
  brandSubtitle: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    marginTop: 6,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 32,
  },
});
