import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { auth } from '../services/firebase';
import { MoodType } from '../types';

export type ThemeMode = 'light' | 'dark' | 'system';

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
  border: string;
  shadow: string;
  success: string;
  warning: string;
  error: string;
  isDark: boolean;
  accentMoodColor?: string;
}

export interface SettingsState {
  themeMode: ThemeMode;
  adaptToMood: boolean;
  currentMood: MoodType | null;
  dailyMoodReminderEnabled: boolean;
  dailyMoodReminderTime: string; // e.g. "20:30"
  taskRemindersEnabled: boolean;
  taskReminderTime: string;     // e.g. "09:00"
  hideNotificationContent: boolean;
  reportNotificationsEnabled: boolean;
}

interface ThemeContextType extends SettingsState {
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
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
const baseLightColors: ThemeColors = {
  primary: '#789B83',
  primaryDark: '#365B45',
  primaryLight: '#A8C5B2',
  lightSage: '#E8F1E8',
  mint: '#D9EEE5',
  cream: '#FAF8F2',
  white: '#FFFFFF',
  peach: '#F7E5DA',
  lavender: '#EAE5F4',
  softBlue: '#E2EDF3',
  darkText: '#29332E',
  mutedText: '#7B857F',
  lightText: '#A5AEA8',
  cardBg: '#FFFFFF',
  background: '#FAF8F2',
  border: '#E8ECE9',
  shadow: '#29332E',
  success: '#6AAF7D',
  warning: '#E8B86D',
  error: '#D98B8B',
  isDark: false,
};

// Base Dark Palette
const baseDarkColors: ThemeColors = {
  primary: '#8EB89B',
  primaryDark: '#4E785F',
  primaryLight: '#B5D1BE',
  lightSage: '#233128',
  mint: '#1E3228',
  cream: '#1C2420',
  white: '#222D27',
  peach: '#3B2E28',
  lavender: '#2E2838',
  softBlue: '#253038',
  darkText: '#F2F5F3',
  mutedText: '#9BA8A0',
  lightText: '#6F7B74',
  cardBg: '#202923',
  background: '#141B17',
  border: '#28352D',
  shadow: '#000000',
  success: '#7EC291',
  warning: '#EFC07B',
  error: '#E59898',
  isDark: true,
};

// Mood Palette Overlays (Subtle, accessible variations)
const moodOverlays: Record<string, { lightBg: string; darkBg: string; lightPrimary: string; darkPrimary: string }> = {
  Calm: {
    lightBg: '#FAF8F2',
    darkBg: '#141B17',
    lightPrimary: '#789B83',
    darkPrimary: '#8EB89B',
  },
  Happy: {
    lightBg: '#FAF6F2',
    darkBg: '#1C1814',
    lightPrimary: '#8A9977',
    darkPrimary: '#A2B38E',
  },
  Sad: {
    lightBg: '#F3F6F9',
    darkBg: '#14181C',
    lightPrimary: '#6E8A9A',
    darkPrimary: '#8FAAB8',
  },
  Stressed: {
    lightBg: '#F6F3F9',
    darkBg: '#18141C',
    lightPrimary: '#847998',
    darkPrimary: '#A095B5',
  },
  Anxious: {
    lightBg: '#F2F8F5',
    darkBg: '#141C18',
    lightPrimary: '#689B86',
    darkPrimary: '#84B8A3',
  },
  Tired: {
    lightBg: '#F7F6F3',
    darkBg: '#181715',
    lightPrimary: '#84877F',
    darkPrimary: '#A1A49C',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();

  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [adaptToMood, setAdaptToMoodState] = useState<boolean>(false);
  const [currentMood, setCurrentMoodState] = useState<MoodType | null>(null);

  // Reminders & Privacy
  const [dailyMoodReminderEnabled, setDailyMoodReminderEnabledState] = useState<boolean>(false);
  const [dailyMoodReminderTime, setDailyMoodReminderTimeState] = useState<string>('20:30');
  const [taskRemindersEnabled, setTaskRemindersEnabledState] = useState<boolean>(false);
  const [taskReminderTime, setTaskReminderTimeState] = useState<string>('09:00');
  const [hideNotificationContent, setHideNotificationContentState] = useState<boolean>(false);
  const [reportNotificationsEnabled, setReportNotificationsEnabledState] = useState<boolean>(true);

  // Load preferences from AsyncStorage on startup
  useEffect(() => {
    async function loadStoredPreferences() {
      try {
        const storedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          setThemeModeState(storedTheme);
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

  // Compute Active Colors with Mood Adaptation
  const colors = useMemo<ThemeColors>(() => {
    const base = isDark ? baseDarkColors : baseLightColors;

    if (adaptToMood && currentMood && moodOverlays[currentMood]) {
      const moodConfig = moodOverlays[currentMood];
      return {
        ...base,
        background: isDark ? moodConfig.darkBg : moodConfig.lightBg,
        primary: isDark ? moodConfig.darkPrimary : moodConfig.lightPrimary,
        accentMoodColor: isDark ? moodConfig.darkPrimary : moodConfig.lightPrimary,
      };
    }

    return base;
  }, [isDark, adaptToMood, currentMood]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
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
