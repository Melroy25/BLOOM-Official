/**
 * weeklyReportWorker.ts
 * Secure, scheduled weekly AI wellness analysis worker for BLOOM.
 * Runs once per week for eligible users.
 * Guarantees duplicate prevention via deterministic weekly report IDs.
 * Strictly respects user privacy and data authorization.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { generateWellnessReport } from './wellnessReportService';
import { WellnessReportDocument, UserProfile } from '../types';

/**
 * Returns the ISO week number for a given date
 */
export function getISOWeekNumber(d: Date = new Date()): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

/**
 * Deterministic report ID that prevents duplicate executions for the same user in a given week.
 * E.g. "weekly_user123_2026_W44"
 */
export function getWeeklyReportDeterministicId(userId: string, date: Date = new Date()): string {
  const { year, week } = getISOWeekNumber(date);
  return `weekly_${userId}_${year}_W${week.toString().padStart(2, '0')}`;
}

/**
 * Checks whether a weekly report has already been generated for the current week.
 */
export async function isWeeklyReportGenerated(userId: string): Promise<boolean> {
  try {
    const reportId = getWeeklyReportDeterministicId(userId);
    const docRef = doc(db, 'wellnessReports', reportId);
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch (err) {
    console.warn('[WeeklyWorker] Error checking weekly report status:', err);
    return false;
  }
}

/**
 * Executes the weekly report workflow for a single authorized user.
 * Idempotent: Skips execution if already generated for this week.
 */
export async function runWeeklyReportForUser(
  userId: string,
  userProfile?: UserProfile | null,
  forceRegenerate: boolean = false
): Promise<WellnessReportDocument | null> {
  const reportId = getWeeklyReportDeterministicId(userId);

  // 1. Duplicate Prevention Check
  if (!forceRegenerate) {
    const alreadyGenerated = await isWeeklyReportGenerated(userId);
    if (alreadyGenerated) {
      console.info(`[WeeklyWorker] Report ${reportId} already exists for user ${userId}. Skipping duplicate.`);
      const snap = await getDoc(doc(db, 'wellnessReports', reportId));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as WellnessReportDocument) : null;
    }
  }

  console.info(`[WeeklyWorker] Generating weekly AI wellness analysis for user ${userId} (${reportId})...`);

  // 2. Generate report using actual user records
  const report = await generateWellnessReport(userId, {
    periodType: 'last7Days',
    userProfile,
  });

  report.id = reportId;
  report.reportType = 'weekly';

  return report;
}

/**
 * Scheduled batch processor for background runners (Cloudflare Worker Cron / Firebase Scheduled Function)
 */
export async function runWeeklyBatchSchedule(
  eligibleUsers: { userId: string; profile?: UserProfile }[]
): Promise<{ successCount: number; skippedCount: number; errors: any[] }> {
  let successCount = 0;
  let skippedCount = 0;
  const errors: any[] = [];

  for (const { userId, profile } of eligibleUsers) {
    try {
      const alreadyDone = await isWeeklyReportGenerated(userId);
      if (alreadyDone) {
        skippedCount++;
        continue;
      }
      await runWeeklyReportForUser(userId, profile, false);
      successCount++;
    } catch (err) {
      errors.push({ userId, error: err });
      console.error(`[WeeklyWorker] Batch failure for user ${userId}:`, err);
    }
  }

  return { successCount, skippedCount, errors };
}
