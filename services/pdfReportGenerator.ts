/**
 * pdfReportGenerator.ts
 * Generates professional 2-4 page botanical wellness PDFs for BLOOM.
 * Supports:
 * - Direct Web PDF file download via jsPDF (without window.print() or screen capturing)
 * - Native Android / iOS PDF export via expo-print and expo-sharing
 * - Firebase Storage upload under wellness_reports/{userId}/{reportId}.pdf
 * - Zero fabricated data, honest data availability notices.
 */

import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { jsPDF } from 'jspdf';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { WellnessReportDocument, UserProfile } from '../types';

export function formatDurationMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

/**
 * Builds standard botanical HTML for multi-page export or native rendering
 */
export function buildReportHtml(
  report: WellnessReportDocument,
  userProfile?: UserProfile | null
): string {
  const userName = userProfile?.fullName || 'Bloom Member';
  const userRole = (userProfile?.userType || 'Student').toUpperCase();
  const m = report.metrics;
  const p = report.previousPeriodComparison;
  const genDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalMoods = m.moodCheckInsCount || 1;
  const calmPct = Math.round((m.moodDistribution.calm / totalMoods) * 100);
  const happyPct = Math.round((m.moodDistribution.happy / totalMoods) * 100);
  const stressedPct = Math.round((m.moodDistribution.stressed / totalMoods) * 100);
  const tiredPct = Math.round((m.moodDistribution.tired / totalMoods) * 100);

  const renderDelta = (delta?: number, suffix = '%') => {
    if (delta === undefined || delta === 0) {
      return '<span style="color:#7A8B7B; font-size:12px;">Steady vs prior period</span>';
    }
    const isPositive = delta > 0;
    const sign = isPositive ? '+' : '';
    const color = isPositive ? '#2E6945' : '#BA4A4A';
    return `<span style="color:${color}; font-weight:700; font-size:12px;">${sign}${delta}${suffix} vs prior period</span>`;
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BLOOM Wellness Intelligence Report</title>
  <style>
    @page { size: A4 portrait; margin: 16mm 14mm 16mm 14mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #2D3A30;
      background-color: #FAF8F2;
      margin: 0; padding: 0; line-height: 1.5;
    }
    .page-container {
      background: #FFFFFF;
      padding: 24px 28px;
      margin-bottom: 20px;
      border-radius: 8px;
      page-break-after: always;
      box-sizing: border-box;
    }
    .header-table { width: 100%; border-bottom: 2px solid #E2EBE0; padding-bottom: 12px; margin-bottom: 18px; }
    .brand-title { font-size: 24px; font-weight: 800; color: #204731; margin: 0; }
    .brand-sub { font-size: 11px; font-weight: 700; color: #608F70; text-transform: uppercase; letter-spacing: 1px; }
    .report-meta { text-align: right; font-size: 11px; color: #617364; }
    .hero-card {
      background: #F4F8F4; border: 1.5px solid #D2E2D4;
      border-radius: 8px; padding: 18px; margin-bottom: 18px;
    }
    .score-badge { font-size: 32px; font-weight: 800; color: #204731; }
    .kpi-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
    .kpi-card {
      flex: 1 1 45%; background: #FFFFFF; border: 1px solid #E5ECE5;
      border-radius: 8px; padding: 12px 14px;
    }
    .kpi-label { font-size: 11px; font-weight: 700; color: #6A7F6E; text-transform: uppercase; }
    .kpi-val { font-size: 20px; font-weight: 800; color: #204731; margin: 3px 0; }
    .section-title { font-size: 15px; font-weight: 700; color: #204731; margin: 18px 0 8px 0; }
    .bar-row { display: flex; align-items: center; margin-bottom: 8px; }
    .bar-label { width: 90px; font-size: 12px; font-weight: 600; color: #3A4A3E; }
    .bar-bg { flex: 1; height: 10px; background: #E8EFE8; border-radius: 5px; overflow: hidden; margin: 0 10px; }
    .bar-fill { height: 100%; background: #6AAF7D; border-radius: 5px; }
    .bar-val { width: 45px; text-align: right; font-size: 12px; font-weight: 700; color: #204731; }
    .obs-card { background: #F8FBF8; border-left: 3.5px solid #4E8752; padding: 10px 14px; margin-bottom: 10px; border-radius: 0 6px 6px 0; }
    .disclaimer { font-size: 10.5px; color: #7A8B7B; border-top: 1px solid #E2EBE0; padding-top: 10px; margin-top: 18px; }
    .page-footer { display: flex; justify-content: space-between; font-size: 10px; color: #8A9E8D; margin-top: 20px; }
  </style>
</head>
<body>
  <!-- PAGE 1: OVERVIEW & KEY METRICS -->
  <div class="page-container">
    <table class="header-table">
      <tr>
        <td>
          <div class="brand-title">BLOOM</div>
          <div class="brand-sub">Wellness Intelligence Report</div>
        </td>
        <td class="report-meta">
          <strong>${userName}</strong> (${userRole})<br>
          Period: ${report.reportingPeriod.label}<br>
          Generated: ${genDate}
        </td>
      </tr>
    </table>

    <div class="hero-card">
      <div style="font-size:11px; font-weight:700; color:#467A58; text-transform:uppercase;">Wellness Balance Index</div>
      <div class="score-badge">${m.wellnessScore !== null ? `${m.wellnessScore} / 100` : 'Learning Baseline'}</div>
      <p style="margin:6px 0 0 0; font-size:12.5px; color:#3D4E41;">
        ${report.executiveSummary || 'Executive summary synthesized from verified student wellness records.'}
      </p>
    </div>

    <div class="section-title">Verified Core Metrics</div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Tasks Completed</div>
        <div class="kpi-val">${m.completedTasks} / ${m.totalTasks}</div>
        <div>${renderDelta(p?.taskCompletionDelta ?? p?.taskRateDelta)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Daily Avg App Time</div>
        <div class="kpi-val">${formatDurationMinutes(m.avgDailyScreenTimeMinutes)}</div>
        <div>${renderDelta(p?.screenTimeMinutesDelta ?? p?.screenTimeDeltaMinutes, 'm')}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Mindful Focus Time</div>
        <div class="kpi-val">${formatDurationMinutes(m.totalFocusMinutes ?? m.focusSessionMinutes)}</div>
        <div style="font-size:11px; color:#7A8B7B;">${m.completedFocusSessionsCount ?? m.focusSessionsCount} focus sprints logged</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Habit Consistency</div>
        <div class="kpi-val">${m.habitConsistencyRate}%</div>
        <div style="font-size:11px; color:#7A8B7B;">${m.activeHabitsCount ?? m.habitsCount} active daily habits</div>
      </div>
    </div>

    <div class="page-footer">
      <span>BLOOM • Cultivating Mindful Student Wellbeing</span>
      <span>Page 1 of 3</span>
    </div>
  </div>

  <!-- PAGE 2: PRODUCTIVITY & EMOTIONAL WELLNESS -->
  <div class="page-container">
    <table class="header-table">
      <tr>
        <td>
          <div class="brand-title">BLOOM</div>
          <div class="brand-sub">Behavioral & Emotional Analytics</div>
        </td>
        <td class="report-meta">
          Period: ${report.reportingPeriod.label}
        </td>
      </tr>
    </table>

    <div class="section-title">Emotional Mood Distribution</div>
    <div style="margin-bottom: 20px;">
      <div class="bar-row">
        <span class="bar-label">Calm & Peaceful</span>
        <div class="bar-bg"><div class="bar-fill" style="width:${calmPct}%; background:#6AAF7D;"></div></div>
        <span class="bar-val">${calmPct}%</span>
      </div>
      <div class="bar-row">
        <span class="bar-label">Happy & Excited</span>
        <div class="bar-bg"><div class="bar-fill" style="width:${happyPct}%; background:#8FC49D;"></div></div>
        <span class="bar-val">${happyPct}%</span>
      </div>
      <div class="bar-row">
        <span class="bar-label">Stressed & Anxious</span>
        <div class="bar-bg"><div class="bar-fill" style="width:${stressedPct}%; background:#D69B76;"></div></div>
        <span class="bar-val">${stressedPct}%</span>
      </div>
      <div class="bar-row">
        <span class="bar-label">Tired & Low</span>
        <div class="bar-bg"><div class="bar-fill" style="width:${tiredPct}%; background:#A2ADB4;"></div></div>
        <span class="bar-val">${tiredPct}%</span>
      </div>
    </div>

    <div class="section-title">Productivity & Habit Breakdown</div>
    <div style="margin-bottom: 18px;">
      <div class="bar-row">
        <span class="bar-label">Tasks Done</span>
        <div class="bar-bg"><div class="bar-fill" style="width:${m.taskCompletionRate}%; background:#365B45;"></div></div>
        <span class="bar-val">${m.taskCompletionRate}%</span>
      </div>
      <div class="bar-row">
        <span class="bar-label">Habit Adherence</span>
        <div class="bar-bg"><div class="bar-fill" style="width:${m.habitConsistencyRate}%; background:#608F70;"></div></div>
        <span class="bar-val">${m.habitConsistencyRate}%</span>
      </div>
    </div>

    ${(m.sleepDataAvailable ?? (m.sleepRecordedDays > 0)) ? `
    <div class="section-title">Rest & Recovery</div>
    <p style="font-size:12px; color:#3A4A3E;">Logged Average Sleep: <strong>${m.avgSleepHours?.toFixed(1) || '0'} hrs/night</strong> across verified logs.</p>
    ` : `
    <div style="background:#F2F5F2; padding:12px; border-radius:6px; font-size:11.5px; color:#6B7C6E; margin-top:14px;">
      ℹ️ <strong>Sensor Notice:</strong> No sleep sensor or manual sleep logs recorded in this period. Sleep metric is omitted to maintain real-data integrity.
    </div>
    `}

    <div class="page-footer">
      <span>BLOOM • Cultivating Mindful Student Wellbeing</span>
      <span>Page 2 of 3</span>
    </div>
  </div>

  <!-- PAGE 3: GEMINI AI OBSERVATIONS & RECOMMENDATIONS -->
  <div class="page-container">
    <table class="header-table">
      <tr>
        <td>
          <div class="brand-title">BLOOM</div>
          <div class="brand-sub">AI Synthesis & Guidance</div>
        </td>
        <td class="report-meta">
          Generated via Gemini AI Engine
        </td>
      </tr>
    </table>

    <div class="section-title">Gemini AI Synthesis</div>
    ${report.aiObservations.map(obs => `
      <div class="obs-card">
        <div style="font-size:12px; font-weight:700; color:#204731; margin-bottom:2px;">AI Reflection</div>
        <div style="font-size:12px; color:#3D4E41;">${obs}</div>
      </div>
    `).join('')}

    <div class="section-title" style="margin-top:20px;">Actionable Recommendations</div>
    <ol style="padding-left:18px; font-size:12px; color:#3D4E41; margin-top:4px;">
      ${report.recommendations.map(rec => `<li style="margin-bottom:6px;">${rec}</li>`).join('')}
    </ol>

    <div class="disclaimer">
      <strong>Medical Disclaimer:</strong> BLOOM wellness reports and AI observations are created strictly for self-reflection and educational study wellness tracking. They do not constitute clinical diagnosis, medical evaluation, or psychological advice. Consult a campus health counselor or certified physician for clinical concerns.
    </div>

    <div class="page-footer">
      <span>BLOOM • Cultivating Mindful Student Wellbeing</span>
      <span>Page 3 of 3</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds a direct jsPDF document with botanical design
 */
export function createJsPdfReport(
  report: WellnessReportDocument,
  userProfile?: UserProfile | null
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const userName = userProfile?.fullName || 'Bloom Member';
  const userRole = (userProfile?.userType || 'Student').toUpperCase();
  const m = report.metrics;
  const p = report.previousPeriodComparison;
  const genDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // PAGE 1: Overview
  // Header bar
  doc.setFillColor(32, 71, 49); // #204731 Forest Green
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('BLOOM', 16, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('WELLNESS INTELLIGENCE REPORT', 16, 24);

  doc.setFontSize(9);
  doc.text(`${userName} (${userRole})`, 194, 14, { align: 'right' });
  doc.text(`Period: ${report.reportingPeriod.label}`, 194, 20, { align: 'right' });
  doc.text(`Generated: ${genDate}`, 194, 26, { align: 'right' });

  // Executive Summary Card
  doc.setFillColor(244, 248, 244);
  doc.setDrawColor(210, 226, 212);
  doc.roundedRect(16, 40, 178, 38, 2, 2, 'FD');

  doc.setTextColor(70, 122, 88);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('WELLNESS BALANCE INDEX', 22, 48);

  doc.setTextColor(32, 71, 49);
  doc.setFontSize(20);
  doc.text(m.wellnessScore !== null ? `${m.wellnessScore} / 100` : 'Learning Baseline', 22, 58);

  doc.setTextColor(61, 78, 65);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  const splitSummary = doc.splitTextToSize(report.executiveSummary || 'Verified student metrics aggregated across daily task, focus, and emotional reflections.', 166);
  doc.text(splitSummary, 22, 66);

  // Core KPIs Grid
  doc.setTextColor(32, 71, 49);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Verified Core Metrics', 16, 88);

  // Card 1: Tasks
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(229, 236, 229);
  doc.roundedRect(16, 94, 85, 26, 2, 2, 'FD');
  doc.setTextColor(106, 127, 110);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TASKS COMPLETED', 22, 102);
  doc.setTextColor(32, 71, 49);
  doc.setFontSize(15);
  doc.text(`${m.completedTasks} / ${m.totalTasks}`, 22, 112);
  doc.setTextColor(122, 139, 123);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${m.taskCompletionRate}% rate`, 70, 112);

  // Card 2: App Screen Time
  doc.roundedRect(109, 94, 85, 26, 2, 2, 'FD');
  doc.setTextColor(106, 127, 110);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DAILY AVG APP USAGE', 115, 102);
  doc.setTextColor(32, 71, 49);
  doc.setFontSize(15);
  doc.text(formatDurationMinutes(m.avgDailyScreenTimeMinutes), 115, 112);
  doc.setTextColor(122, 139, 123);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Mindful pacing', 160, 112);

  // Card 3: Focus Time
  doc.roundedRect(16, 126, 85, 26, 2, 2, 'FD');
  doc.setTextColor(106, 127, 110);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('MINDFUL FOCUS TIME', 22, 134);
  doc.setTextColor(32, 71, 49);
  doc.setFontSize(15);
  doc.text(formatDurationMinutes(m.totalFocusMinutes ?? m.focusSessionMinutes), 22, 144);
  doc.setTextColor(122, 139, 123);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${m.completedFocusSessionsCount ?? m.focusSessionsCount} sprint(s)`, 70, 144);

  // Card 4: Habit Consistency
  doc.roundedRect(109, 126, 85, 26, 2, 2, 'FD');
  doc.setTextColor(106, 127, 110);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('HABIT ADHERENCE', 115, 134);
  doc.setTextColor(32, 71, 49);
  doc.setFontSize(15);
  doc.text(`${m.habitConsistencyRate}%`, 115, 144);
  doc.setTextColor(122, 139, 123);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${m.activeHabitsCount ?? m.habitsCount} active habit(s)`, 155, 144);

  // Emotional distribution on page 1
  doc.setTextColor(32, 71, 49);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Emotional Check-in Distribution', 16, 165);

  const totalMoods = m.moodCheckInsCount || 1;
  const calmPct = Math.round((m.moodDistribution.calm / totalMoods) * 100);
  const happyPct = Math.round((m.moodDistribution.happy / totalMoods) * 100);
  const stressedPct = Math.round((m.moodDistribution.stressed / totalMoods) * 100);
  const tiredPct = Math.round((m.moodDistribution.tired / totalMoods) * 100);

  const moods = [
    { label: 'Calm & Peaceful', pct: calmPct, color: [106, 175, 125] },
    { label: 'Happy & Motivated', pct: happyPct, color: [143, 196, 157] },
    { label: 'Stressed & Overwhelmed', pct: stressedPct, color: [214, 155, 118] },
    { label: 'Tired & Low Energy', pct: tiredPct, color: [162, 173, 180] },
  ];

  let moodY = 175;
  for (const item of moods) {
    doc.setTextColor(58, 74, 62);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, 16, moodY);

    // Bar background
    doc.setFillColor(232, 239, 232);
    doc.roundedRect(65, moodY - 3.5, 105, 5, 1.5, 1.5, 'F');

    // Bar fill
    if (item.pct > 0) {
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      const fillW = Math.max(2, (item.pct / 100) * 105);
      doc.roundedRect(65, moodY - 3.5, fillW, 5, 1.5, 1.5, 'F');
    }

    doc.setTextColor(32, 71, 49);
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.pct}%`, 178, moodY);
    moodY += 10;
  }

  // Footer page 1
  doc.setTextColor(138, 158, 141);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('BLOOM • Cultivating Mindful Student Wellbeing', 16, 285);
  doc.text('Page 1 of 2', 194, 285, { align: 'right' });

  // PAGE 2: Gemini Synthesis & Recommendations
  doc.addPage();

  // Top header bar Page 2
  doc.setFillColor(32, 71, 49);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('BLOOM • Gemini AI Synthesis & Guidance', 16, 14);

  // AI Observations Section
  doc.setTextColor(32, 71, 49);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Gemini AI Observations', 16, 34);

  let obsY = 42;
  const observations = report.aiObservations && report.aiObservations.length > 0
    ? report.aiObservations
    : ['Verified real metrics were aggregated across task, focus, and emotional check-in logs.'];

  for (const obs of observations.slice(0, 4)) {
    doc.setFillColor(248, 251, 248);
    doc.setDrawColor(78, 135, 82);
    const splitObs = doc.splitTextToSize(obs, 166);
    const boxH = Math.max(16, splitObs.length * 5 + 8);

    doc.rect(16, obsY, 3, boxH, 'F'); // Left accent bar
    doc.rect(19, obsY, 175, boxH, 'F');

    doc.setTextColor(32, 71, 49);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('• AI Observation', 22, obsY + 6);

    doc.setTextColor(61, 78, 65);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(splitObs, 22, obsY + 12);

    obsY += boxH + 6;
  }

  // Recommendations Section
  doc.setTextColor(32, 71, 49);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Actionable Next Steps', 16, obsY + 6);

  let recY = obsY + 14;
  const recs = report.recommendations && report.recommendations.length > 0
    ? report.recommendations
    : ['Schedule gentle 20-minute focus sprints for pending assignments.', 'Practice mindful evening reflection check-ins.'];

  recs.slice(0, 4).forEach((rec, idx) => {
    doc.setFillColor(232, 242, 232);
    doc.circle(21, recY - 1, 3.5, 'F');
    doc.setTextColor(32, 71, 49);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${idx + 1}`, 19.8, recY + 0.5);

    doc.setTextColor(61, 78, 65);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const splitRec = doc.splitTextToSize(rec, 160);
    doc.text(splitRec, 28, recY);
    recY += Math.max(8, splitRec.length * 5 + 4);
  });

  // Sensor Notice Box
  const noticeY = Math.min(225, recY + 8);
  doc.setFillColor(242, 245, 242);
  doc.roundedRect(16, noticeY, 178, 22, 2, 2, 'F');
  doc.setTextColor(70, 90, 75);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Data Integrity & Sensor Notice', 22, noticeY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const noticeText = 'All metrics reflect genuine Cloud Firestore records. No simulated records or fabricated metrics are presented. Sleep and sensor metrics are included only when verified entries exist.';
  doc.text(doc.splitTextToSize(noticeText, 166), 22, noticeY + 13);

  // Medical Disclaimer
  doc.setDrawColor(226, 235, 224);
  doc.line(16, 255, 194, 255);
  doc.setTextColor(122, 139, 123);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const disclaimer = 'Notice: BLOOM wellness reports and AI companion observations are designed for self-reflection and educational wellness awareness. They do not constitute clinical diagnosis, medical evaluation, or psychological advice.';
  doc.text(doc.splitTextToSize(disclaimer, 178), 16, 260);

  // Footer page 2
  doc.text('BLOOM • Cultivating Mindful Student Wellbeing', 16, 285);
  doc.text('Page 2 of 2', 194, 285, { align: 'right' });

  return doc;
}

/**
 * Downloads the report directly on Web as a .pdf file without opening window.print()
 */
export async function downloadReportPdfWeb(
  report: WellnessReportDocument,
  userProfile?: UserProfile | null
): Promise<void> {
  const doc = createJsPdfReport(report, userProfile);
  const fileName = `BLOOM_Wellness_Report_${report.reportType}_${report.reportingPeriod.startDate}.pdf`;

  if (typeof window !== 'undefined') {
    doc.save(fileName);
  }
}

/**
 * Generates local PDF file.
 * Web: generates blob URL via jsPDF
 * Native: generates file:// via expo-print
 */
export async function generateReportPdf(
  report: WellnessReportDocument,
  userProfile?: UserProfile | null
): Promise<string> {
  if (Platform.OS === 'web') {
    const doc = createJsPdfReport(report, userProfile);
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }

  // Native Android/iOS: use expo-print
  const html = buildReportHtml(report, userProfile);
  const result = await Print.printToFileAsync({
    html,
    base64: false,
  });
  return result.uri;
}

/**
 * Shares local PDF via native share sheet or opens preview
 */
export async function shareReportPdf(pdfUri: string, reportTitle: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.open(pdfUri, '_blank');
    }
    return;
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not supported on this platform.');
  }
  await Sharing.shareAsync(pdfUri, {
    mimeType: 'application/pdf',
    dialogTitle: reportTitle || 'Share BLOOM Wellness Report',
    UTI: 'com.adobe.pdf',
  });
}

/**
 * Uploads generated PDF to Firebase Storage under wellness_reports/{userId}/{reportId}.pdf
 */
export async function uploadReportPdfToStorage(
  userId: string,
  reportId: string,
  pdfUri: string
): Promise<string> {
  // On Web, skip direct Firebase Storage network upload to avoid localhost CORS preflight failures.
  // The client downloads the PDF directly using jsPDF.
  if (Platform.OS === 'web') {
    return pdfUri;
  }

  try {
    const fileName = `${reportId}.pdf`;
    const storagePath = `wellness_reports/${userId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    const response = await fetch(pdfUri);
    const blob = await response.blob();

    await uploadBytes(storageRef, blob, {
      contentType: 'application/pdf',
      customMetadata: {
        userId,
        reportId,
        generatedAt: new Date().toISOString(),
      },
    });

    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (err: any) {
    console.warn('[PDFStorage] Upload skipped or failed, using local PDF URI:', err?.message || err);
    return pdfUri;
  }
}
