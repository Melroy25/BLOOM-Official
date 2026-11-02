import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { MoodType } from '../types';
import {
  ThemeColor,
  AccentPalette,
  ACCENT_PALETTES,
  CanvasColors,
  FrostedTokens,
  resolveActiveAccent,
} from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';
export type { ThemeColor, AccentPalette };

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  lightSage: string;
  mint: string;
  cream: string;
  white: string;
  peach: string;
  lavender: string;
  softBlue: string;
  darkText: string;
  mutedText: string;
  lightText: string;
  cardBg: string;
  background: string;
  canvas: string;
  border: string;
  shadow: string;
  success: string;
  warning: string;
  error: string;
  isDark: boolean;
  accentMoodColor?: string;

  // Dynamic Ambient Accent Tokens
  accent: string;
  accentSoft: string;
  accentText: string;
  glowTop: string;
  glowBottom: string;
  frostedBg: string;
  frostedBorder: string;
  highlightBorder: string;
  themeColor: ThemeColor;
}

export interface SettingsState {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  accentPalette: AccentPalette;
  adaptToMood: boolean;
  currentMood: MoodType | null;
  dailyMoodReminderEnabled: boolean;
  dailyMoodReminderTime: string;
  taskRemindersEnabled: boolean;
  taskReminderTime: string;
  hideNotificationContent: boolean;
  reportNotificationsEnabled: boolean;
}

interface ThemeContextType extends SettingsState {
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setThemeColor: (color: ThemeColor) => Promise<void>;
  setAccentPalette: (palette: AccentPalette) => Promise<void>;
  setAdaptToMood: (enabled: boolean) => Promise<void>;
  setCurrentMood: (mood: MoodType) => void;
  setDailyMoodReminderEnabled: (enabled: boolean) => Promise<void>;
  setDailyMoodReminderTime: (time: string) => Promise<void>;
  setTaskRemindersEnabled: (enabled: boolean) => Promise<void>;
  setTaskReminderTime: (time: string) => Promise<void>;
  setHideNotificationContent: (enabled: boolean) => Promise<void>;
  setReportNotificationsEnabled: (enabled: boolean) => Promise<void>;
}

const STORAGE_KEYS = {
  THEME_MODE: '@bloom_theme_mode',
  THEME_COLOR: '@bloom_app_theme_color',
  ACCENT_PALETTE: '@bloom_accent_palette',
  ADAPT_MOOD: '@bloom_adapt_mood',
  LAST_MOOD: '@bloom_last_mood',
  MOOD_REMINDER_ENABLED: '@bloom_mood_reminder_enabled',
  MOOD_REMINDER_TIME: '@bloom_mood_reminder_time',
  TASK_REMINDER_ENABLED: '@bloom_task_reminder_enabled',
  TASK_REMINDER_TIME: '@bloom_task_reminder_time',
  HIDE_NOTIF_CONTENT: '@bloom_hide_notif_content',
  REPORT_NOTIF_ENABLED: '@bloom_report_notif_enabled',
};

// Base Light Palette
const baseLightColors = {
  primaryDark: '#204731',
  primaryLight: '#A8C5B2',
  lightSage: '#E8F1E8',
  mint: '#D9EEE5',
  cream: '#FAF8F3',
  white: '#FFFFFF',
  peach: '#F7E5DA',
  lavender: '#EAE5F4',
  softBlue: '#E2EDF3',
  darkText: '#1A2E20',
  mutedText: '#617364',
  lightText: '#8FA193',
  cardBg: '#FFFFFF',
  background: '#FAF8F3',
  canvas: CanvasColors.light,
  border: '#E2EBE0',
  shadow: '#1A2E20',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  isDark: false,
};

// Base Dark Palette
const baseDarkColors = {
  primaryDark: '#34D399',
  primaryLight: '#059669',
  lightSage: '#1C2920',
  mint: '#162E22',
  cream: '#16161A',
  white: '#222B24',
  peach: '#3B2E28',
  lavender: '#2E2838',
  softBlue: '#1F2A38',
  darkText: '#F3F6F4',
  mutedText: '#9AAFA0',
  lightText: '#6B8071',
  cardBg: '#1C241E',
  background: '#16161A',
  canvas: CanvasColors.dark,
  border: '#2A382E',
  shadow: '#000000',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  isDark: true,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();

  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [themeColor, setThemeColorState] = useState<ThemeColor>('green');
  const [accentPalette, setAccentPaletteState] = useState<AccentPalette>('green');
  const [adaptToMood, setAdaptToMoodState] = useState<boolean>(false);
  const [currentMood, setCurrentMoodState] = useState<MoodType | null>(null);

  // Reminders & Privacy
  const [dailyMoodReminderEnabled, setDailyMoodReminderEnabledState] = useState<boolean>(false);
  const [dailyMoodReminderTime, setDailyMoodReminderTimeState] = useState<string>('20:30');
  const [taskRemindersEnabled, setTaskRemindersEnabledState] = useState<boolean>(false);
  const [taskReminderTime, setTaskReminderTimeState] = useState<string>('09:00');
  const [hideNotificationContent, setHideNotificationContentState] = useState<boolean>(false);
  const [reportNotificationsEnabled, setReportNotificationsEnabledState] = useState<boolean>(true);

  // Load preferences from AsyncStorage & Firestore on startup
  useEffect(() => {
    async function loadStoredPreferences() {
      try {
        const storedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          setThemeModeState(storedTheme);
        }

        const storedColor = (await AsyncStorage.getItem(STORAGE_KEYS.THEME_COLOR)) || (await AsyncStorage.getItem('@bloom_theme_color'));
        if (storedColor === 'green' || storedColor === 'blue' || storedColor === 'pink') {
          setThemeColorState(storedColor);
          setAccentPaletteState(storedColor);
        } else {
          const storedAccent = await AsyncStorage.getItem(STORAGE_KEYS.ACCENT_PALETTE);
          if (storedAccent === 'pink' || storedAccent === 'blue' || storedAccent === 'green' || storedAccent === 'mint' || storedAccent === 'yellow') {
            const mapped = (storedAccent === 'blue' ? 'blue' : storedAccent === 'pink' ? 'pink' : 'green') as ThemeColor;
            setThemeColorState(mapped);
            setAccentPaletteState(storedAccent as AccentPalette);
          }
        }

        const storedAdapt = await AsyncStorage.getItem(STORAGE_KEYS.ADAPT_MOOD);
        if (storedAdapt !== null) {
          setAdaptToMoodState(storedAdapt === 'true');
        }

        const storedMood = await AsyncStorage.getItem(STORAGE_KEYS.LAST_MOOD);
        if (storedMood) {
          setCurrentMoodState(storedMood as MoodType);
        }

        const storedMoodRem = await AsyncStorage.getItem(STORAGE_KEYS.MOOD_REMINDER_ENABLED);
        if (storedMoodRem !== null) {
          setDailyMoodReminderEnabledState(storedMoodRem === 'true');
        }

        const storedMoodTime = await AsyncStorage.getItem(STORAGE_KEYS.MOOD_REMINDER_TIME);
        if (storedMoodTime) {
          setDailyMoodReminderTimeState(storedMoodTime);
        }

        const storedTaskRem = await AsyncStorage.getItem(STORAGE_KEYS.TASK_REMINDER_ENABLED);
        if (storedTaskRem !== null) {
          setTaskRemindersEnabledState(storedTaskRem === 'true');
        }

        const storedTaskTime = await AsyncStorage.getItem(STORAGE_KEYS.TASK_REMINDER_TIME);
        if (storedTaskTime) {
          setTaskReminderTimeState(storedTaskTime);
        }

        const storedHideNotif = await AsyncStorage.getItem(STORAGE_KEYS.HIDE_NOTIF_CONTENT);
        if (storedHideNotif !== null) {
          setHideNotificationContentState(storedHideNotif === 'true');
        }

        const storedReportNotif = await AsyncStorage.getItem(STORAGE_KEYS.REPORT_NOTIF_ENABLED);
        if (storedReportNotif !== null) {
          setReportNotificationsEnabledState(storedReportNotif === 'true');
        }
      } catch (err) {
        console.warn('[ThemeContext] Error loading stored preferences:', err);
      }
    }

    loadStoredPreferences();
  }, []);

  // Sync to Firestore when user is signed in
  const syncToFirestore = async (updates: Record<string, any>) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const userSettingsRef = doc(db, 'userSettings', user.uid);
      await setDoc(userSettingsRef, updates, { merge: true });
    } catch (_) {
      // Offline fallback
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    syncToFirestore({ theme: mode });
  };

  const setThemeColor = async (color: ThemeColor) => {
    setThemeColorState(color);
    setAccentPaletteState(color);
    setAdaptToMoodState(false);
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_COLOR, color);
    await AsyncStorage.setItem(STORAGE_KEYS.ACCENT_PALETTE, color);
    await AsyncStorage.setItem(STORAGE_KEYS.ADAPT_MOOD, 'false');
    syncToFirestore({ themeColor: color, accentPalette: color, adaptThemeToMood: false });
  };

  const setAccentPalette = async (palette: AccentPalette) => {
    setAccentPaletteState(palette);
    if (palette === 'green' || palette === 'blue' || palette === 'pink') {
      setThemeColorState(palette);
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_COLOR, palette);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.ACCENT_PALETTE, palette);
    syncToFirestore({ accentPalette: palette });
  };

  const setAdaptToMood = async (enabled: boolean) => {
    setAdaptToMoodState(enabled);
    await AsyncStorage.setItem(STORAGE_KEYS.ADAPT_MOOD, String(enabled));
    syncToFirestore({ adaptThemeToMood: enabled });
  };

  const setCurrentMood = (mood: MoodType) => {
    setCurrentMoodState(mood);
    AsyncStorage.setItem(STORAGE_KEYS.LAST_MOOD, mood).catch(() => {});
  };

  const setDailyMoodReminderEnabled = async (enabled: boolean) => {
    setDailyMoodReminderEnabledState(enabled);
    await AsyncStorage.setItem(STORAGE_KEYS.MOOD_REMINDER_ENABLED, String(enabled));
    syncToFirestore({ dailyMoodReminderEnabled: enabled });
  };

  const setDailyMoodReminderTime = async (time: string) => {
    setDailyMoodReminderTimeState(time);
    await AsyncStorage.setItem(STORAGE_KEYS.MOOD_REMINDER_TIME, time);
    syncToFirestore({ dailyMoodReminderTime: time });
  };

  const setTaskRemindersEnabled = async (enabled: boolean) => {
    setTaskRemindersEnabledState(enabled);
    await AsyncStorage.setItem(STORAGE_KEYS.TASK_REMINDER_ENABLED, String(enabled));
    syncToFirestore({ taskRemindersEnabled: enabled });
  };

  const setTaskReminderTime = async (time: string) => {
    setTaskReminderTimeState(time);
    await AsyncStorage.setItem(STORAGE_KEYS.TASK_REMINDER_TIME, time);
    syncToFirestore({ taskReminderTime: time });
  };

  const setHideNotificationContent = async (enabled: boolean) => {
    setHideNotificationContentState(enabled);
    await AsyncStorage.setItem(STORAGE_KEYS.HIDE_NOTIF_CONTENT, String(enabled));
    syncToFirestore({ hideNotificationContent: enabled });
  };

  const setReportNotificationsEnabled = async (enabled: boolean) => {
    setReportNotificationsEnabledState(enabled);
    await AsyncStorage.setItem(STORAGE_KEYS.REPORT_NOTIF_ENABLED, String(enabled));
    syncToFirestore({ reportNotificationsEnabled: enabled });
  };

  // Determine active dark mode state
  const isDark = useMemo(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return systemScheme === 'dark';
  }, [themeMode, systemScheme]);

  // Compute Active Colors with Priority:
  // 1. Mood mapping if adaptToMood is active and currentMood exists
  // 2. User's chosen accent palette
  // 3. Default mint
  const colors = useMemo<ThemeColors>(() => {
    const base = isDark ? baseDarkColors : baseLightColors;
    let activePaletteKey: AccentPalette = themeColor || 'green';
    if (adaptToMood && currentMood) {
      activePaletteKey = resolveActiveAccent(themeColor, adaptToMood, currentMood);
    }
    const tokens = ACCENT_PALETTES[activePaletteKey] || ACCENT_PALETTES[themeColor] || ACCENT_PALETTES.green;

    const frosted = isDark ? FrostedTokens.dark : FrostedTokens.light;

    const activeThemeColor: ThemeColor =
      activePaletteKey === 'blue' ? 'blue' : activePaletteKey === 'pink' ? 'pink' : 'green';

    return {
      ...base,
      primary: tokens.main,
      primaryDark: isDark
        ? (activeThemeColor === 'blue' ? '#60A5FA' : activeThemeColor === 'pink' ? '#F87171' : '#34D399')
        : (activeThemeColor === 'blue' ? '#1D4ED8' : activeThemeColor === 'pink' ? '#BE185D' : '#204731'),
      primaryLight: tokens.soft,
      accent: tokens.main,
      accentSoft: tokens.soft,
      accentText: tokens.text,
      accentMoodColor: tokens.main,
      highlightBorder: tokens.main,
      glowTop: isDark ? tokens.glowTopDark : tokens.glowTop,
      glowBottom: isDark ? tokens.glowBottomDark : tokens.glowBottom,
      frostedBg: frosted.background,
      frostedBorder: frosted.border,
      canvas: isDark ? CanvasColors.dark : CanvasColors.light,
      background: isDark ? CanvasColors.dark : CanvasColors.light,
      themeColor: activeThemeColor,
    };
  }, [isDark, themeColor, accentPalette, adaptToMood, currentMood]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        themeColor,
        accentPalette,
        adaptToMood,
        currentMood,
        dailyMoodReminderEnabled,
        dailyMoodReminderTime,
        taskRemindersEnabled,
        taskReminderTime,
        hideNotificationContent,
        reportNotificationsEnabled,
        colors,
        isDark,
        setThemeMode,
        setThemeColor,
        setAccentPalette,
        setAdaptToMood,
        setCurrentMood,
        setDailyMoodReminderEnabled,
        setDailyMoodReminderTime,
        setTaskRemindersEnabled,
        setTaskReminderTime,
        setHideNotificationContent,
        setReportNotificationsEnabled,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
