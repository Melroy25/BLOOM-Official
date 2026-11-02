/**
 * constants/typography.ts
 * Wharf / The Creator Global Typography System for BLOOM.
 * Dual-font architecture:
 * 1. Plus Jakarta Sans (Primary brand, editorial, interface, conversational)
 * 2. JetBrains Mono (Precision metrics, numbers, percentages, durations, chart values)
 */

import { TextStyle, Platform } from 'react-native';
import { Colors } from './colors';

// Font family identifier tokens with safe cross-platform fallbacks
export const FontFamily = {
  // Plus Jakarta Sans (Primary)
  sansRegular: Platform.select({
    web: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    default: 'PlusJakartaSans-Regular',
  }),
  sansMedium: Platform.select({
    web: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    default: 'PlusJakartaSans-Medium',
  }),
  sansSemiBold: Platform.select({
    web: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    default: 'PlusJakartaSans-SemiBold',
  }),
  sansBold: Platform.select({
    web: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    default: 'PlusJakartaSans-Bold',
  }),
  sansExtraBold: Platform.select({
    web: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    default: 'PlusJakartaSans-ExtraBold',
  }),

  // JetBrains Mono (Monospace / Metrics)
  monoRegular: Platform.select({
    web: `'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace`,
    default: 'JetBrainsMono-Regular',
  }),
  monoMedium: Platform.select({
    web: `'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace`,
    default: 'JetBrainsMono-Medium',
  }),
  monoSemiBold: Platform.select({
    web: `'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace`,
    default: 'JetBrainsMono-SemiBold',
  }),
  monoBold: Platform.select({
    web: `'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace`,
    default: 'JetBrainsMono-Bold',
  }),
};

// Safe cross-platform fallback font stacks
export const FontStack = {
  sans: Platform.select({
    web: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
    default: 'PlusJakartaSans-Regular',
  }),
  mono: Platform.select({
    web: `'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace`,
    default: 'JetBrainsMono-Regular',
  }),
};

export const Typography: Record<string, TextStyle> = {
  // Screen Titles & Dominant Headings (Plus Jakarta Sans)
  h1: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.darkText,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  h2: {
    fontFamily: FontFamily.sansBold,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.darkText,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  h3: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkText,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  subtitle: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.mutedText,
    lineHeight: 21,
  },

  // Body & Paragraphs
  body: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 15,
    fontWeight: '400',
    color: Colors.darkText,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.darkText,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 13,
    fontWeight: '400',
    color: Colors.mutedText,
    lineHeight: 18,
  },
  bodySmallMedium: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.mutedText,
    lineHeight: 18,
  },

  // Labels & Captions
  caption: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 12,
    fontWeight: '400',
    color: Colors.mutedText,
    lineHeight: 16,
  },
  label: {
    fontFamily: FontFamily.sansBold,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.mutedText,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Buttons & Interactive
  button: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: -0.1,
  },
  buttonSmall: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },

  // Numerical & Precision Metrics (JetBrains Mono)
  mono: {
    fontFamily: FontFamily.monoRegular,
    fontSize: 14,
    fontWeight: '400',
  },
  monoMedium: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 14,
    fontWeight: '500',
  },
  monoBold: {
    fontFamily: FontFamily.monoBold,
    fontSize: 14,
    fontWeight: '700',
  },
  monoStatLarge: {
    fontFamily: FontFamily.monoBold,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  monoStat: {
    fontFamily: FontFamily.monoBold,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkText,
  },
  monoStatMedium: {
    fontFamily: FontFamily.monoSemiBold,
    fontSize: 16,
    fontWeight: '600',
  },
  monoBadge: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 11.5,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  stat: {
    fontFamily: FontFamily.monoBold,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkText,
  },
  statLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.mutedText,
  },
};
