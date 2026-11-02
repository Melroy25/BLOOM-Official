/**
 * constants/theme.ts
 * Wharf / The Creator Design System Tokens for BLOOM.
 * Centralized theme configuration supporting 4 dynamic accent palettes,
 * ambient glow colors, frosted glass styling, and mood-to-accent mapping.
 */

import { MoodType } from '../types';

export type AccentPalette = 'yellow' | 'mint' | 'pink' | 'blue';

export interface AccentTokens {
  name: string;
  label: string;
  main: string;
  soft: string;
  text: string;
  glowTop: string;
  glowBottom: string;
  glowTopDark: string;
  glowBottomDark: string;
}

export const ACCENT_PALETTES: Record<AccentPalette, AccentTokens> = {
  yellow: {
    name: 'yellow',
    label: 'Sunburst',
    main: '#F59E0B',
    soft: '#FEF3C7',
    text: '#92400E',
    glowTop: 'rgba(245,185,58,0.28)',
    glowBottom: 'rgba(251,227,166,0.16)',
    glowTopDark: 'rgba(245,185,58,0.14)',
    glowBottomDark: 'rgba(251,227,166,0.08)',
  },
  mint: {
    name: 'mint',
    label: 'Botanical',
    main: '#10B981',
    soft: '#D1FAE5',
    text: '#065F46',
    glowTop: 'rgba(52,211,153,0.25)',
    glowBottom: 'rgba(167,243,208,0.14)',
    glowTopDark: 'rgba(52,211,153,0.14)',
    glowBottomDark: 'rgba(167,243,208,0.08)',
  },
  pink: {
    name: 'pink',
    label: 'Blossom',
    main: '#EC4899',
    soft: '#FCE7F3',
    text: '#9D174D',
    glowTop: 'rgba(244,114,182,0.25)',
    glowBottom: 'rgba(251,207,232,0.14)',
    glowTopDark: 'rgba(244,114,182,0.14)',
    glowBottomDark: 'rgba(251,207,232,0.08)',
  },
  blue: {
    name: 'blue',
    label: 'Ocean',
    main: '#3B82F6',
    soft: '#DBEAFE',
    text: '#1E40AF',
    glowTop: 'rgba(96,165,250,0.25)',
    glowBottom: 'rgba(191,219,254,0.14)',
    glowTopDark: 'rgba(96,165,250,0.14)',
    glowBottomDark: 'rgba(191,219,254,0.08)',
  },
};

/**
 * Base canvas colors (Layer 1 of Ambient System)
 */
export const CanvasColors = {
  light: '#FAF8F3', // Warm linen, not harsh pure white
  dark: '#16161A',  // Deep botanical obsidian
};

/**
 * Frosted Glass Card tokens (Layer 3 of Ambient System)
 */
export const FrostedTokens = {
  light: {
    background: 'rgba(255, 255, 255, 0.82)',
    border: 'rgba(232, 236, 233, 0.75)',
    shadow: 'rgba(41, 51, 46, 0.05)',
  },
  dark: {
    background: 'rgba(26, 30, 28, 0.78)',
    border: 'rgba(255, 255, 255, 0.08)',
    shadow: 'rgba(0, 0, 0, 0.35)',
  },
};

/**
 * Mood-to-Accent mapping according to BLOOM wellness principles:
 * Happy -> Yellow
 * Calm / Peaceful -> Mint
 * Focused -> Blue
 * Stressed / Sad -> Blue or Mint
 * Anxious -> Mint
 * Tired -> Mint
 */
export const MOOD_ACCENT_MAP: Record<string, AccentPalette> = {
  Happy: 'yellow',
  Calm: 'mint',
  Peaceful: 'mint',
  Focused: 'blue',
  Stressed: 'mint',
  Sad: 'blue',
  Anxious: 'mint',
  Tired: 'mint',
};

/**
 * Resolves active accent palette according to design system priority:
 * 1. If adaptToMood is enabled and a valid mood exists -> mapped accent
 * 2. Otherwise -> user's manual accent palette
 * 3. Default -> 'mint'
 */
export function resolveActiveAccent(
  manualPalette: AccentPalette = 'mint',
  adaptToMood: boolean = false,
  latestMood?: MoodType | string | null
): AccentPalette {
  if (adaptToMood && latestMood && MOOD_ACCENT_MAP[latestMood]) {
    return MOOD_ACCENT_MAP[latestMood];
  }
  return manualPalette || 'mint';
}
