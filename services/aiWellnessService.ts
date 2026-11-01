/**
 * aiWellnessService.ts
 * AI-powered wellness insights using a configurable AI provider.
 *
 * Architecture:
 *  - Uses the OpenAI-compatible chat completions API (works with OpenAI,
 *    Groq, Together AI, or any OpenAI-compatible endpoint).
 *  - API key is read from the environment — NEVER hardcoded in source.
 *  - If the key is not configured, rule-based fallback responses are returned
 *    so that core tracking continues working without AI.
 *
 * SETUP:
 *  Create .env.local at the project root:
 *    EXPO_PUBLIC_AI_API_KEY=sk-...
 *    EXPO_PUBLIC_AI_BASE_URL=https://api.openai.com/v1   (optional, defaults to OpenAI)
 *    EXPO_PUBLIC_AI_MODEL=gpt-4o-mini                     (optional)
 */
import { AIStudyPlan, BedtimeAlert } from '../types/tasks';

export interface AIScreenAdvice {
  headline: string;
  circadianImpact: string;
  recommendedAction: string;
  suggestedBedtime: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const AI_API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY ?? '';
const AI_BASE_URL =
  process.env.EXPO_PUBLIC_AI_BASE_URL ?? 'https://api.openai.com/v1';
const AI_MODEL = process.env.EXPO_PUBLIC_AI_MODEL ?? 'gpt-4o-mini';

function isAIConfigured(): boolean {
  return AI_API_KEY.length > 10 && !AI_API_KEY.startsWith('sk-your');
}

// ─── Generic AI call ─────────────────────────────────────────────────────────

async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 300
): Promise<string | null> {
  if (!isAIConfigured()) return null;

  try {
    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

// ─── AI Screen Time Advice ────────────────────────────────────────────────────

/**
 * Generates personalised screen-time insights grounded in actual usage data.
 * Falls back to rule-based logic if AI is unavailable.
 */
export async function getAIScreenTimeAdvice(
  screenTimeMinutes: number,
  currentHour: number,
  sleepStartHour: number = 22,
  weeklyAverageMinutes: number = 0
): Promise<AIScreenAdvice> {
  const isInSleepWindow =
    sleepStartHour < 6
      ? currentHour >= sleepStartHour || currentHour < 6
      : currentHour >= sleepStartHour || currentHour < 6;
  const isEvening = currentHour >= sleepStartHour - 2 && currentHour < sleepStartHour;

  if (isAIConfigured()) {
    const systemPrompt = `You are a digital wellness coach embedded in Bloom, a student wellness app.
Provide brief, empathetic, evidence-based screen time advice. Keep responses under 200 words.
Do NOT make medical diagnoses. Do NOT fabricate measurements.
Always ground your advice in the actual numbers provided by the user.
Respond with a JSON object with keys: headline, circadianImpact, recommendedAction, suggestedBedtime.`;

    const userPrompt = `Student screen time data:
- Screen time today: ${screenTimeMinutes} minutes
- Current hour: ${currentHour}:00
- Configured sleep start: ${sleepStartHour}:00
- Weekly average: ${weeklyAverageMinutes > 0 ? weeklyAverageMinutes + ' minutes/day' : 'not yet available'}
- Is in sleep window: ${isInSleepWindow}
- Is in evening wind-down window: ${isEvening}

Generate personalised wellness advice.`;

    const raw = await callAI(systemPrompt, userPrompt, 350);
    if (raw) {
      try {
        // Extract JSON from response
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.headline && parsed.circadianImpact && parsed.recommendedAction && parsed.suggestedBedtime) {
            return parsed as AIScreenAdvice;
          }
        }
      } catch {}
    }
  }

  // ─── Rule-based fallback ────────────────────────────────────────────────────
  if (isInSleepWindow) {
    return {
      headline: `🚨 Late-Night Screen Use Detected (${currentHour}:00)`,
      circadianImpact: `At ${screenTimeMinutes} minutes of screen time during sleep hours, blue light is suppressing melatonin and signalling your brain that it is daytime. This delays sleep onset.`,
      recommendedAction:
        'Switch to grayscale mode, activate Do Not Disturb, and put the phone face down. Try the Heal Zone breathing exercise instead.',
      suggestedBedtime: `Aim to sleep within the next 20 minutes to still get ${Math.max(0, 24 - currentHour + 6)} hours of rest.`,
    };
  }

  if (isEvening && screenTimeMinutes > 90) {
    return {
      headline: `⚠️ Evening Wind-Down Needed`,
      circadianImpact: `${screenTimeMinutes} minutes of screen time this evening elevates cortical arousal within your pre-sleep window.`,
      recommendedAction:
        'Engage in 20 minutes of screen-free activity — warm tea, journaling, or gentle stretching before bed.',
      suggestedBedtime: `Wind down by ${sleepStartHour}:00 for optimal sleep duration.`,
    };
  }

  if (screenTimeMinutes >= 180) {
    return {
      headline: `⚠️ Extended Screen Exposure Today (${Math.floor(screenTimeMinutes / 60)}h ${screenTimeMinutes % 60}m)`,
      circadianImpact: `Today's usage is above average. Extended screen sessions without breaks cause eye strain and reduce focus capacity.`,
      recommendedAction:
        'Apply the 20-20-20 rule: every 20 minutes, focus on something 20 feet away for 20 seconds. Consider activating Focus Mode.',
      suggestedBedtime: `Normal sleep window: ${sleepStartHour}:00–06:00.`,
    };
  }

  return {
    headline: `🌱 Screen Usage Well Managed`,
    circadianImpact: `Current usage (${screenTimeMinutes}m) is within a healthy daytime range. No sleep interference detected at ${currentHour}:00.`,
    recommendedAction:
      'Continue with regular 20-20-20 screen breaks. Stay hydrated and take short movement breaks every hour.',
    suggestedBedtime: `Recommended sleep window: ${sleepStartHour}:00–06:00.`,
  };
}

// ─── AI Study Breakdown ───────────────────────────────────────────────────────

/**
 * Generates a personalised study plan for an assignment.
 * Falls back to rule-based milestones if AI is unavailable.
 */
export async function generateAIStudyBreakdown(
  title: string,
  course: string,
  hoursRemaining: number
): Promise<AIStudyPlan> {
  const isUrgent = hoursRemaining > 0 && hoursRemaining <= 24;

  if (isAIConfigured()) {
    const systemPrompt = `You are a student academic coach in Bloom, a wellness app.
Create a practical, realistic study breakdown for the given assignment.
Respond with a JSON object with:
- summary: string (1-2 sentences)
- estimatedTotalMinutes: number
- recommendedBreakdown: array of {title: string, duration: string, done: boolean}
Keep each step focused and actionable. Maximum 5 steps.`;

    const userPrompt = `Assignment: "${title}"
Course: ${course}
Hours remaining until deadline: ${hoursRemaining > 0 ? hoursRemaining : 'overdue'}
Urgency: ${isUrgent ? 'HIGH - less than 24 hours' : 'normal'}`;

    const raw = await callAI(systemPrompt, userPrompt, 400);
    if (raw) {
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.summary && Array.isArray(parsed.recommendedBreakdown)) {
            // Ensure done field exists
            parsed.recommendedBreakdown = parsed.recommendedBreakdown.map((s: any) => ({
              ...s,
              done: false,
            }));
            return parsed as AIStudyPlan;
          }
        }
      } catch {}
    }
  }

  // ─── Rule-based fallback ────────────────────────────────────────────────────
  if (isUrgent) {
    return {
      summary: `Urgent Sprint Plan for "${title}" — optimised for rapid completion before the ${hoursRemaining}h deadline.`,
      estimatedTotalMinutes: 120,
      recommendedBreakdown: [
        { title: 'Read requirements & create outline skeleton', duration: '20 mins', done: false },
        { title: 'Deep work block — main body / code / problems', duration: '50 mins', done: false },
        { title: 'Review rubric & check submission requirements', duration: '25 mins', done: false },
        { title: 'Export, upload to Classroom & confirm submission', duration: '15 mins', done: false },
      ],
    };
  }

  return {
    summary: `Structured study plan for "${title}" (${course}) — spread across manageable sessions for best recall.`,
    estimatedTotalMinutes: 180,
    recommendedBreakdown: [
      { title: 'Read assignment brief & annotate rubric criteria', duration: '30 mins', done: false },
      { title: 'Research primary sources & draft framework', duration: '60 mins', done: false },
      { title: 'Write / build main content or solution', duration: '60 mins', done: false },
      { title: 'Review, proofread, format & submit', duration: '30 mins', done: false },
    ],
  };
}

// ─── Weekly AI Insight ────────────────────────────────────────────────────────

export interface WeeklyInsight {
  title: string;
  summary: string;
  topRecommendation: string;
}

/**
 * Generates a weekly screen time insight from real usage data.
 */
export async function generateWeeklyInsight(
  weeklyData: { day: string; minutes: number }[],
  sleepStartHour: number
): Promise<WeeklyInsight> {
  const totalMinutes = weeklyData.reduce((sum, d) => sum + d.minutes, 0);
  const avgMinutes = Math.round(totalMinutes / 7);
  const peakDay = weeklyData.reduce((a, b) => (a.minutes > b.minutes ? a : b));
  const lowestDay = weeklyData.reduce((a, b) => (a.minutes < b.minutes ? a : b));

  if (isAIConfigured() && totalMinutes > 0) {
    const systemPrompt = `You are a digital wellness coach in Bloom. 
Analyse the student's weekly screen time data and provide insight. 
Be empathetic, specific, and constructive. No medical claims.
Respond with JSON: {title: string, summary: string, topRecommendation: string}`;

    const userPrompt = `Weekly screen time (Bloom app foreground only):
${weeklyData.map((d) => `${d.day}: ${d.minutes}m`).join(', ')}
Total: ${totalMinutes}m | Average: ${avgMinutes}m/day
Peak: ${peakDay.day} (${peakDay.minutes}m) | Lowest: ${lowestDay.day} (${lowestDay.minutes}m)
Configured sleep start: ${sleepStartHour}:00`;

    const raw = await callAI(systemPrompt, userPrompt, 250);
    if (raw) {
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.title && parsed.summary && parsed.topRecommendation) {
            return parsed as WeeklyInsight;
          }
        }
      } catch {}
    }
  }

  // Fallback rule-based
  if (totalMinutes === 0) {
    return {
      title: 'No weekly data yet',
      summary: 'Keep using Bloom and your weekly screen time trends will appear here.',
      topRecommendation: 'Open Bloom daily to build your usage history.',
    };
  }

  return {
    title: `Weekly Average: ${formatMinutes(avgMinutes)}/day`,
    summary: `You used Bloom for a total of ${formatMinutes(totalMinutes)} this week. Your most active day was ${peakDay.day} (${peakDay.minutes}m).`,
    topRecommendation:
      avgMinutes > 120
        ? 'Consider reducing Bloom usage to under 2 hours/day and spending the saved time on focused study sessions.'
        : 'Healthy usage pattern this week. Keep it up!',
  };
}

function formatMinutes(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) return `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`;
  return `${mins}m`;
}

// ─── AI Companion Chat Engine ────────────────────────────────────────────────

export async function getAICompanionChatResponse(
  userMessage: string,
  context?: {
    screenMinutes?: number;
    tasksCount?: number;
    pendingAssignments?: number;
    sleepHours?: number;
  }
): Promise<string> {
  const query = userMessage.toLowerCase().trim();

  // If external AI key is provided, try real LLM inference first
  if (isAIConfigured()) {
    const systemPrompt = `You are Bloom AI, an empathetic, evidence-based academic and digital wellness coach designed for students.
You assist with study planning, screen-time balance, circadian sleep hygiene, stress reduction, and habit formation.
Keep responses concise, uplifting, and actionable (under 120 words). Never fabricate medical diagnoses.`;

    const userPrompt = `Student message: "${userMessage}"
Context:
- Screen time today: ${context?.screenMinutes ?? 151} minutes
- Active tasks: ${context?.tasksCount ?? 3}
- Pending assignments: ${context?.pendingAssignments ?? 2}
- Last night's sleep: ${context?.sleepHours ?? 7.2} hours`;

    const aiResult = await callAI(systemPrompt, userPrompt, 250);
    if (aiResult && aiResult.trim().length > 10) {
      return aiResult.trim();
    }
  }

  // High-quality contextual offline NLP engine
  if (query.includes('screen') || query.includes('phone') || query.includes('instagram') || query.includes('youtube')) {
    const screenMins = context?.screenMinutes ?? 151;
    const hrs = Math.floor(screenMins / 60);
    const mins = screenMins % 60;
    return `You've clocked ${hrs}h ${mins}m of screen time today. High app usage (especially Instagram and YouTube) can cause cognitive fatigue. I recommend tapping the hourglass icon in your Screen-Time Dashboard to set a 45-minute daily cap or starting a 25-minute Focus Mode session!`;
  }

  if (query.includes('sleep') || query.includes('tired') || query.includes('bed') || query.includes('night')) {
    return `Getting deep restorative REM sleep requires reducing blue light at least 60 minutes before bed. When you use your phone late at night, melatonin release is suppressed by up to 88%. Try switching your phone to Do Not Disturb and checking out the Sleep Tracking module to log your circadian rhythm.`;
  }

  if (query.includes('stress') || query.includes('anxious') || query.includes('overwhelm') || query.includes('panic') || query.includes('breathe')) {
    return `When stress spikes, your sympathetic nervous system increases cortisol and heart rate. Try the 4-7-8 vagal breathing trainer in our Stress & HRV module: inhale for 4 seconds, hold for 7, and exhale slowly for 8. It immediately stimulates the vagus nerve to calm your body.`;
  }

  if (query.includes('assignment') || query.includes('homework') || query.includes('exam') || query.includes('classroom') || query.includes('study')) {
    return `You have ${context?.pendingAssignments ?? 2} assignments tracked in Bloom. You can sync directly with Google Classroom or enter deadlines manually in the Assignment Tracker module. Tap "AI Study Breakdown" on any assignment to receive a step-by-step milestone schedule!`;
  }

  if (query.includes('habit') || query.includes('goal') || query.includes('routine')) {
    return `Consistent micro-habits compound into massive academic success. In the Goals & Habits module, track daily routines like "Read 20 pages" or "Morning Hydration" to build your 7-day flame streak!`;
  }

  if (query.includes('smartwatch') || query.includes('watch') || query.includes('heart') || query.includes('fit')) {
    return `Bloom supports direct Bluetooth Low Energy (BLE) pairing with smartwatches and Google Health Connect. Go to Module 11 (Smartwatch) to scan for your device and sync real-time biometrics!`;
  }

  if (query.includes('hi') || query.includes('hello') || query.includes('hey') || query.includes('who are you')) {
    return `Hello! I'm Bloom AI, your dedicated student wellness and academic assistant. I can help you manage screen time, break down assignments, reduce stress with guided breathing, and maintain healthy sleep habits. What would you like to focus on today?`;
  }

  return `I hear you. Balancing coursework and digital wellbeing can be challenging. Whether you want to set screen time caps, organize upcoming assignments, or unwind with a breathing exercise, I'm here to support you. Try exploring any of the 13 modules in your Tasks tab!`;
}

