export type AssignmentPriority = 'high' | 'medium' | 'low';
export type AssignmentStatus = 'pending' | 'submitted' | 'graded';
export type AssignmentSource = 'google_classroom' | 'manual' | 'email';

export interface StudyStep {
  title: string;
  duration: string;
  done: boolean;
}

export interface AIStudyPlan {
  summary: string;
  recommendedBreakdown: StudyStep[];
  estimatedTotalMinutes: number;
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  courseColor: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  priority: AssignmentPriority;
  status: AssignmentStatus;
  source: AssignmentSource;
  points?: number;
  description?: string;
  classroomLink?: string;
  reminderActive: boolean;
  aiStudyPlan?: AIStudyPlan;
  createdAt: string;
}

export interface AppUsageItem {
  id: string;
  name: string;
  packageName: string;
  durationMinutes: number;
  category: 'Education' | 'Social' | 'Productivity' | 'Entertainment' | 'Wellness';
  color: string;
}

export interface ScreenTimeState {
  liveSessionSeconds: number;
  dailyTotalSeconds: number;
  dailyLimitMinutes: number;
  hasAndroidPermission: boolean;
  appUsageList: AppUsageItem[];
  weeklyTotalsMinutes: { day: string; minutes: number }[];
}

export interface BedtimeAlert {
  isTriggered: boolean;
  level: 'critical' | 'warning' | 'calm';
  title: string;
  message: string;
  currentHour: number;
  screenTimeMinutes: number;
  healthImpact: string;
  actionableStep: string;
}

// Student Tasks & Daily/Weekly Tasks
export type TaskPeriod = 'daily' | 'weekly' | 'academic';
export interface StudentTask {
  id: string;
  title: string;
  period: TaskPeriod;
  category: 'Study' | 'Exam Prep' | 'Wellness' | 'Routine';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  dueDate?: string;
  timeEstimateMinutes: number;
  createdAt: string;
}

// Habits & Goals
export interface HabitItem {
  id: string;
  name: string;
  target: string;
  streakDays: number;
  completedToday: boolean;
  history: boolean[]; // last 7 days
  icon: string;
}

// Sleep Tracking
export interface SleepState {
  bedtimeTarget: string; // e.g. "23:00"
  wakeTarget: string; // e.g. "07:00"
  actualSleepHours: number;
  sleepEfficiencyPercent: number;
  remMinutes: number;
  deepMinutes: number;
  lightMinutes: number;
  circadianConsistencyScore: number;
  healthConnectAuthorized: boolean;
}

// Stress Tracking
export interface StressState {
  score: number; // 0 - 100
  level: 'Low (Calm)' | 'Moderate' | 'Elevated (Overload)';
  estimatedHrvMs: number;
  lastAssessedTime: string;
  pss10Answers?: number[];
}

// SOS Signal
export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
}

// Smartwatch Connection
export interface SmartwatchDevice {
  id: string;
  name: string;
  brand: 'Wear OS' | 'Pixel Watch' | 'Galaxy Watch' | 'Garmin' | 'Apple Watch';
  batteryPercent: number;
  connected: boolean;
  lastSyncTime: string;
  sensorsEnabled: {
    ppgHeartRate: boolean;
    hrvTelemetry: boolean;
    sleepSpO2: boolean;
    skinTemperature: boolean;
  };
}

// Health Connect
export interface HealthConnectPermissions {
  isAppInstalled: boolean;
  isConnected: boolean;
  readSleep: boolean;
  readSteps: boolean;
  readHeartRate: boolean;
  readExercise: boolean;
  lastSyncTimestamp: string;
}

// Widget Config
export interface WidgetSettings {
  theme: 'sage' | 'dark' | 'peach';
  showLiveScreenTime: boolean;
  showNextAssignment: boolean;
  showQuickFocusBtn: boolean;
  updateIntervalMinutes: number;
}
