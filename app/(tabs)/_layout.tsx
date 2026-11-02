import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Heart, Sparkles, CheckSquare, Users } from 'lucide-react-native';
import { FontFamily } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 16);
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: FontFamily.sansSemiBold,
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: isDark ? 'rgba(22, 22, 26, 0.94)' : 'rgba(255, 255, 255, 0.94)',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 64 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          elevation: 12,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDark ? 0.25 : 0.08,
          shadowRadius: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && { backgroundColor: colors.accentSoft }]}>
              <Home size={21} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="heal-zone"
        options={{
          title: 'Heal Zone',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && { backgroundColor: colors.accentSoft }]}>
              <Heart size={21} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Companion',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && { backgroundColor: colors.accentSoft }]}>
              <Sparkles size={21} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && { backgroundColor: colors.accentSoft }]}>
              <CheckSquare size={21} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="collabs"
        options={{
          title: 'Bloom Circle',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && { backgroundColor: colors.accentSoft }]}>
              <Users size={21} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 36,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
});
