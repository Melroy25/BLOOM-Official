/**
 * components/animations/AnimatedPressable.tsx
 * Tactile button pressable with physical feedback.
 * Web hover: translateY -2px.
 * Press: scale to 0.97 over 150ms with signature easing.
 */

import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { Motion } from '../../constants/motion';

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hoverLift?: number;
  disabled?: boolean;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  scaleTo = Motion.transforms.pressScaleButton,
  hoverLift = Motion.transforms.hoverLift,
  disabled = false,
  onPress,
  ...rest
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const [isHovered, setIsHovered] = useState(false);

  const handlePressIn = () => {
    if (disabled) return;
    Animated.timing(scaleAnim, {
      toValue: scaleTo,
      duration: Motion.durations.tap,
      easing: Motion.easing,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: Motion.durations.tap,
      easing: Motion.easing,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handleMouseEnter = () => {
    if (disabled || Platform.OS !== 'web') return;
    setIsHovered(true);
    Animated.timing(hoverAnim, {
      toValue: hoverLift,
      duration: Motion.durations.tap,
      easing: Motion.easing,
      useNativeDriver: false,
    }).start();
  };

  const handleMouseLeave = () => {
    if (Platform.OS !== 'web') return;
    setIsHovered(false);
    Animated.timing(hoverAnim, {
      toValue: 0,
      duration: Motion.durations.tap,
      easing: Motion.easing,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      // Web hover events
      {...(Platform.OS === 'web'
        ? ({
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
          } as any)
        : {})}
      {...rest}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [
              { scale: scaleAnim },
              Platform.OS === 'web' ? { translateY: hoverAnim } : { translateY: 0 },
            ],
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};
