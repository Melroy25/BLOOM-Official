/**
 * usageStatsNative.ts
 * JavaScript bridge to the native UsageStatsModule (Kotlin).
 *
 * This module ONLY works in a development build (npx expo run:android).
 * In Expo Go, all functions return { available: false } gracefully.
 *
 * The native module reads REAL usage data from Android's UsageStatsManager —
 * actual time you spent on Instagram, YouTube, WhatsApp, etc.
 */
import { NativeModules, Platform } from 'react-native';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppUsageData {
  packageName: string;
  appName: string;
  usageMs: number;
  usageMinutes: number;
  iconBase64: string; // "data:image/png;base64,..."
  isSystemApp: boolean;
}

export interface DayUsageResult {
  apps: AppUsageData[];
  totalMs: number;
  totalMinutes: number;
}

export interface WeeklyDayData {
  day: string;       // "Mon", "Tue" ... "Today"
  date: string;      // "YYYY-MM-DD"
  totalMs: number;
  totalMinutes: number;
}

// ── Native module reference ───────────────────────────────────────────────────

function getNativeModule(): any | null {
  if (Platform.OS !== 'android') return null;
  try {
    const mod = NativeModules.UsageStatsModule;
    return mod ?? null;
  } catch {
    return null;
  }
}

export function isNativeModuleAvailable(): boolean {
  return getNativeModule() !== null;
}

// ── API ───────────────────────────────────────────────────────────────────────

/** Check if Usage Access permission has been granted */
export async function hasUsagePermission(): Promise<boolean> {
  const mod = getNativeModule();
  if (!mod) return false;
  try {
    return await mod.hasPermission();
  } catch {
    return false;
  }
}

/** Open Android Usage Access settings page */
export async function openUsageAccessSettings(): Promise<boolean> {
  const mod = getNativeModule();
  if (!mod) {
    // Fallback for Expo Go
    const { Linking } = require('react-native');
    try {
      await Linking.openSettings();
    } catch {}
    return false;
  }
  try {
    return await mod.openUsageSettings();
  } catch {
    return false;
  }
}

/** Get real app-by-app usage for today */
export async function getTodayAppUsage(): Promise<DayUsageResult | null> {
  const mod = getNativeModule();
  if (!mod) return null;
  try {
    const result = await mod.getTodayUsage();
    return {
      apps: result.apps ?? [],
      totalMs: result.totalMs ?? 0,
      totalMinutes: result.totalMinutes ?? 0,
    };
  } catch {
    return null;
  }
}

/** Get real app-by-app usage for a specific date (YYYY-MM-DD) */
export async function getUsageForDate(date: string): Promise<DayUsageResult | null> {
  const mod = getNativeModule();
  if (!mod) return null;
  try {
    const result = await mod.getUsageForDate(date);
    return {
      apps: result.apps ?? [],
      totalMs: result.totalMs ?? 0,
      totalMinutes: result.totalMinutes ?? 0,
    };
  } catch {
    return null;
  }
}

/** Get total screen time per day for the last 7 days */
export async function getWeeklyUsage(): Promise<WeeklyDayData[]> {
  const mod = getNativeModule();
  if (!mod) return [];
  try {
    const result: WeeklyDayData[] = await mod.getWeeklyUsage();
    return result ?? [];
  } catch {
    return [];
  }
}

/** Format minutes into "Xh Ym" */
export function formatUsageMinutes(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/** Format minutes into "X hrs, Y mins" (big display style) */
export function formatUsageBig(minutes: number): string {
  if (minutes <= 0) return '0 mins';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0 && m > 0) return `${h} hr${h > 1 ? 's' : ''}, ${m} min${m > 1 ? 's' : ''}`;
  if (h > 0) return `${h} hr${h > 1 ? 's' : ''}`;
  return `${m} min${m > 1 ? 's' : ''}`;
}
