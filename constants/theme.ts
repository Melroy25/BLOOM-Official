/**
 * constants/theme.ts
 * Wharf / The Creator Design System Tokens for BLOOM.
 * Centralized theme configuration supporting 4 dynamic accent palettes,
 * ambient glow colors, frosted glass styling, and mood-to-accent mapping.
 */

import { MoodType } from '../types';

export type ThemeColor = 'green' | 'blue' | 'pink';
export type AccentPalette = 'green' | 'blue' | 'pink' | 'mint' | 'yellow';

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
  green: {
    name: 'green',
    label: 'Sage Green',
    main: '#789B83', // Primary Sage
    soft: '#E8F1E8', // Light Sage
    text: '#204731',
    glowTop: 'rgba(120, 155, 131, 0.32)',
    glowBottom: 'rgba(232, 241, 232, 0.22)',
    glowTopDark: 'rgba(120, 155, 131, 0.20)',
    glowBottomDark: 'rgba(232, 241, 232, 0.10)',
  },
  blue: {
    name: 'blue',
    label: 'Sky Blue',
    main: '#4A90E2', // Soft Sky Blue
    soft: '#E3F2FD', // Light Ice Blue
    text: '#1E3A8A',
    glowTop: 'rgba(74, 144, 226, 0.32)',
    glowBottom: 'rgba(227, 242, 253, 0.22)',
    glowTopDark: 'rgba(74, 144, 226, 0.20)',
    glowBottomDark: 'rgba(227, 242, 253, 0.10)',
  },
  pink: {
    name: 'pink',
    label: 'Rose Pink',
    main: '#E06D85', // Soft Rose Pink
    soft: '#FCE4EC', // Light Blush
    text: '#831843',
    glowTop: 'rgba(224, 109, 133, 0.32)',
    glowBottom: 'rgba(252, 228, 236, 0.22)',
    glowTopDark: 'rgba(224, 109, 133, 0.20)',
    glowBottomDark: 'rgba(252, 228, 236, 0.10)',
  },
  mint: {
    name: 'mint',
    label: 'Sage Green',
    main: '#789B83',
    soft: '#E8F1E8',
    text: '#204731',
    glowTop: 'rgba(120, 155, 131, 0.32)',
    glowBottom: 'rgba(232, 241, 232, 0.22)',
    glowTopDark: 'rgba(120, 155, 131, 0.20)',
    glowBottomDark: 'rgba(232, 241, 232, 0.10)',
  },
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
  manualPalette: AccentPalette | ThemeColor = 'green',
  adaptToMood: boolean = false,
  latestMood?: MoodType | string | null
): AccentPalette {
  if (adaptToMood && latestMood && MOOD_ACCENT_MAP[latestMood]) {
    const mapped = MOOD_ACCENT_MAP[latestMood];
    return mapped === 'mint' ? 'green' : mapped;
  }
  if (manualPalette === 'mint') return 'green';
  return (manualPalette as AccentPalette) || 'green';
}
