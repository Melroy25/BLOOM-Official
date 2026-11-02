/**
 * components/animations/AnimatedCard.tsx
 * Card component with subtle tactile feedback and optional frosted glass styling.
 * Hover lift: -2px on web. Press scale: ~0.985.
 */

import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ViewStyle,
  StyleProp,
  Platform,
  View,
} from 'react-native';
import { Motion } from '../../constants/motion';
import { useTheme } from '../../context/ThemeContext';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  frosted?: boolean;
  interactive?: boolean;
  onPress?: () => void;
  scaleTo?: number;
  hoverLift?: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  frosted = false,
  interactive,
  onPress,
  scaleTo = Motion.transforms.pressScaleCard,
  hoverLift = Motion.transforms.hoverLift,
}) => {
  const { colors, isDark } = useTheme();
  const isClickable = interactive ?? Boolean(onPress);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const hoverAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (!isClickable) return;
    Animated.timing(scaleAnim, {
      toValue: scaleTo,
      duration: Motion.durations.tap,
      easing: Motion.easing,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    if (!isClickable) return;
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: Motion.durations.tap,
      easing: Motion.easing,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handleMouseEnter = () => {
    if (!isClickable || Platform.OS !== 'web') return;
    Animated.timing(hoverAnim, {
      toValue: hoverLift,
      duration: Motion.durations.tap,
      easing: Motion.easing,
      useNativeDriver: false,
    }).start();
  };

  const handleMouseLeave = () => {
    if (!isClickable || Platform.OS !== 'web') return;
    Animated.timing(hoverAnim, {
      toValue: 0,
      duration: Motion.durations.tap,
      easing: Motion.easing,
      useNativeDriver: false,
    }).start();
  };

  const frostedStyle: ViewStyle = frosted
    ? {
        backgroundColor: colors.frostedBg,
        borderColor: colors.frostedBorder,
        borderWidth: 1,
      }
    : {};

  if (!isClickable) {
    return (
      <View style={[frostedStyle, style]}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...(Platform.OS === 'web'
        ? ({
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
          } as any)
        : {})}
    >
      <Animated.View
        style={[
          frostedStyle,
          style,
          {
            transform: [
              { scale: scaleAnim },
              Platform.OS === 'web' ? { translateY: hoverAnim } : { translateY: 0 },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};
