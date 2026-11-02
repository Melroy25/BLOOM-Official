/**
 * components/theme/BackgroundGlow.tsx
 * Wharf / The Creator Ambient Background Glow System for BLOOM.
 * Renders a base canvas with two softly diffused ambient corner glow spheres
 * (Top-Right ~65% and Bottom-Left ~55%) responding to the active accent palette.
 */

import React, { memo } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BackgroundGlowProps {
  children?: React.ReactNode;
  style?: any;
}

export const BackgroundGlow: React.FC<BackgroundGlowProps> = memo(({ children, style }) => {
  const { colors, isDark } = useTheme();

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.canvas,
            backgroundImage: `radial-gradient(ellipse 65% 50% at 100% 0%, ${colors.glowTop} 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 0% 100%, ${colors.glowBottom} 0%, transparent 70%)`,
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
          } as any,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.canvas },
        style,
      ]}
    >
      {/* AMBIENT GLOW LAYER (LAYER 2) — 2 CORNERS */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            {/* Top-Right Corner Glow Sphere */}
            <RadialGradient
              id="topRightGlow"
              cx="100%"
              cy="0%"
              r="65%"
              fx="100%"
              fy="0%"
            >
              <Stop offset="0%" stopColor={colors.glowTop} stopOpacity={isDark ? 0.8 : 1} />
              <Stop offset="45%" stopColor={colors.glowTop} stopOpacity={isDark ? 0.35 : 0.45} />
              <Stop offset="100%" stopColor={colors.glowTop} stopOpacity="0" />
            </RadialGradient>

            {/* Bottom-Left Corner Glow Sphere */}
            <RadialGradient
              id="bottomLeftGlow"
              cx="0%"
              cy="100%"
              r="60%"
              fx="0%"
              fy="100%"
            >
              <Stop offset="0%" stopColor={colors.glowBottom} stopOpacity={isDark ? 0.8 : 1} />
              <Stop offset="50%" stopColor={colors.glowBottom} stopOpacity={isDark ? 0.3 : 0.4} />
              <Stop offset="100%" stopColor={colors.glowBottom} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Paint 2 corner glows */}
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#topRightGlow)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#bottomLeftGlow)" />
        </Svg>
      </View>

      {/* CONTENT LAYER */}
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
});
