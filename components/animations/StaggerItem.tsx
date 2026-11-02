/**
 * components/animations/StaggerItem.tsx
 * Smooth cascade entrance using the signature easing curve: cubic-bezier(0.22, 1, 0.36, 1).
 * Cascades elements with initial opacity: 0, translateY: 16 -> opacity: 1, translateY: 0.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp, AccessibilityInfo, Platform } from 'react-native';
import { Motion } from '../../constants/motion';
import { useStaggerContext } from './StaggerContainer';

export type StaggerRole = 'header' | 'badge' | 'card' | 'chart' | 'remaining' | 'custom';

interface StaggerItemProps {
  children: React.ReactNode;
  index?: number;
  role?: StaggerRole;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  index = 0,
  role = 'custom',
  delay,
  duration = Motion.durations.cascade,
  style,
}) => {
  const context = useStaggerContext();
  const animValue = useRef(new Animated.Value(0)).current;

  // Resolve timing according to signature specification
  let computedDelay = delay;
  if (computedDelay === undefined) {
    if (role === 'header') computedDelay = Motion.staggerDelays.header;
    else if (role === 'badge') computedDelay = Motion.staggerDelays.badges;
    else if (role === 'card') computedDelay = Motion.staggerDelays.mainCards;
    else if (role === 'chart') computedDelay = Motion.staggerDelays.charts;
    else if (role === 'remaining') computedDelay = Motion.staggerDelays.remaining;
    else {
      // Index-based cascade capped at 400ms max
      const raw = context.baseDelay + index * context.interval;
      computedDelay = Math.min(raw, Motion.staggerDelays.maxListCap);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    // Fast synchronous path on web
    if (Platform.OS === 'web') {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        animValue.setValue(1);
        return;
      }
      Animated.timing(animValue, {
        toValue: 1,
        duration,
        delay: computedDelay,
        easing: Motion.easing,
        useNativeDriver: false,
      }).start();
      return;
    }

    // Native check reduced motion preference
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (isCancelled) return;
        if (reduced) {
          animValue.setValue(1);
          return;
        }

        Animated.timing(animValue, {
          toValue: 1,
          duration,
          delay: computedDelay,
          easing: Motion.easing,
          useNativeDriver: true,
        }).start();
      })
      .catch(() => {
        if (!isCancelled) {
          Animated.timing(animValue, {
            toValue: 1,
            duration,
            delay: computedDelay,
            easing: Motion.easing,
            useNativeDriver: true,
          }).start();
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [computedDelay, duration]);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Motion.transforms.entranceOffsetY, 0],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: animValue,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
