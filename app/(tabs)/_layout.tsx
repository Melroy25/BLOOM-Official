import React, { useRef, useEffect, memo } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Heart, Sparkles, CheckSquare, Users } from 'lucide-react-native';
import { FontFamily } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';

/**
 * AnimatedTabButton:
 * Wraps each tab button with a smooth lift up and gentle pop/scale animation
 * over the selected tab.
 */
const AnimatedTabButton = (props: any) => {
  const { onPress, accessibilityState, children, style } = props;
  const focused = !!accessibilityState?.selected;

  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      friction: 6,
      tension: 110,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.05],
  });

  const handlePress = (e: any) => {
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.9,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(anim, {
        toValue: 1,
        friction: 5,
        tension: 130,
        useNativeDriver: true,
      }),
    ]).start();
    onPress?.(e);
  };

  return (
    <Pressable
      {...props}
      onPress={handlePress}
      style={[styles.tabButton, style]}
    >
      <Animated.View
        style={[
          styles.tabContent,
          {
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};

/**
 * TabBarParticles:
 * Soft low-opacity particle dot accents within the tab bar container,
 * tinted dynamically to the active theme color (Green, Blue, Pink).
 */
const TabBarParticles = memo(() => {
  const { colors } = useTheme();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          styles.particleDot,
          {
            left: '9%',
            top: 7,
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: colors.accent,
            opacity: 0.22,
          },
        ]}
      />
      <View
        style={[
          styles.particleDot,
          {
            left: '28%',
            bottom: 10,
            width: 9,
            height: 9,
            borderRadius: 4.5,
            backgroundColor: colors.accent,
            opacity: 0.16,
          },
        ]}
      />
      <View
        style={[
          styles.particleDot,
          {
            left: '50%',
            top: 10,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.accent,
            opacity: 0.24,
          },
        ]}
      />
      <View
        style={[
          styles.particleDot,
          {
            left: '72%',
            bottom: 12,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.accent,
            opacity: 0.18,
          },
        ]}
      />
      <View
        style={[
          styles.particleDot,
          {
            left: '91%',
            top: 8,
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: colors.accent,
            opacity: 0.20,
          },
        ]}
      />
    </View>
  );
});

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
        tabBarButton: (props) => <AnimatedTabButton {...props} />,
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark ? 'rgba(22, 22, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          >
            <TabBarParticles />
          </View>
        ),
        tabBarLabelStyle: {
          fontFamily: FontFamily.sansSemiBold,
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 3,
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 66 + bottomPadding,
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
      {/* 1. Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconBubble,
                focused && [
                  styles.activeBubble,
                  {
                    backgroundColor: colors.accentSoft,
                    borderColor: colors.accent,
                  },
                ],
              ]}
            >
              <Home size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />

      {/* 2. Heal */}
      <Tabs.Screen
        name="heal-zone"
        options={{
          title: 'Heal',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconBubble,
                focused && [
                  styles.activeBubble,
                  {
                    backgroundColor: colors.accentSoft,
                    borderColor: colors.accent,
                  },
                ],
              ]}
            >
              <Heart size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />

      {/* 3. Bloom (AI Companion) */}
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Bloom',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconBubble,
                focused && [
                  styles.activeBubble,
                  {
                    backgroundColor: colors.accentSoft,
                    borderColor: colors.accent,
                  },
                ],
              ]}
            >
              <Sparkles size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />

      {/* 4. Tasks */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconBubble,
                focused && [
                  styles.activeBubble,
                  {
                    backgroundColor: colors.accentSoft,
                    borderColor: colors.accent,
                  },
                ],
              ]}
            >
              <CheckSquare size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />

      {/* 5. Bloom Circle */}
      <Tabs.Screen
        name="collabs"
        options={{
          title: 'Bloom Circle',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconBubble,
                focused && [
                  styles.activeBubble,
                  {
                    backgroundColor: colors.accentSoft,
                    borderColor: colors.accent,
                  },
                ],
              ]}
            >
              <Users size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="ai-companion"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="bloom-circle"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="create-challenge"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="music-therapy"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="wellness-report"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubble: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBubble: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  particleDot: {
    position: 'absolute',
  },
});
