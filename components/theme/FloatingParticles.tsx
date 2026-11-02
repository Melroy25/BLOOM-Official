/**
 * components/theme/FloatingParticles.tsx
 * Lightweight, low-opacity background particle overlay for BLOOM.
 * Renders soft dots/bubbles floating gently up and down,
 * tinted to the user's active theme color (Green, Blue, or Pink).
 */

import React, { useEffect, useRef, memo } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParticleConfig {
  id: string;
  size: number;
  left: number; // percentage of screen width
  top: number;  // percentage of screen height
  opacity: number;
  duration: number;
  range: number;
}

const PARTICLES: ParticleConfig[] = [
  { id: 'p1', size: 14, left: 0.12, top: 0.14, opacity: 0.22, duration: 4200, range: 14 },
  { id: 'p2', size: 22, left: 0.82, top: 0.18, opacity: 0.18, duration: 5100, range: 18 },
  { id: 'p3', size: 10, left: 0.68, top: 0.32, opacity: 0.25, duration: 3800, range: 12 },
  { id: 'p4', size: 18, left: 0.18, top: 0.48, opacity: 0.16, duration: 4600, range: 16 },
  { id: 'p5', size: 26, left: 0.88, top: 0.62, opacity: 0.14, duration: 5400, range: 20 },
  { id: 'p6', size: 12, left: 0.32, top: 0.72, opacity: 0.24, duration: 4000, range: 14 },
  { id: 'p7', size: 16, left: 0.75, top: 0.84, opacity: 0.18, duration: 4800, range: 15 },
  { id: 'p8', size: 8,  left: 0.50, top: 0.22, opacity: 0.28, duration: 3500, range: 10 },
];

const SingleParticle: React.FC<{
  config: ParticleConfig;
  tintColor: string;
  softTint: string;
}> = memo(({ config, tintColor, softTint }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -config.range,
          duration: config.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: config.range,
          duration: config.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: config.duration * 0.7,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [floatAnim, config]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          left: config.left * SCREEN_WIDTH,
          top: config.top * SCREEN_HEIGHT,
          opacity: config.opacity,
          backgroundColor: tintColor,
          borderColor: softTint,
          borderWidth: 1,
          transform: [{ translateY: floatAnim }],
        },
      ]}
    />
  );
});

export const FloatingParticles: React.FC<{ style?: any }> = memo(({ style }) => {
  const { colors } = useTheme();

  return (
    <View style={[StyleSheet.absoluteFill, styles.container, style]} pointerEvents="none">
      {PARTICLES.map((particle) => (
        <SingleParticle
          key={particle.id}
          config={particle}
          tintColor={colors.accent}
          softTint={colors.accentSoft}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
});
