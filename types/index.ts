export interface DailyGoal {
  id: string;
  title: string;
  completed: boolean;
  icon: string;
}

export interface StatItem {
  id: string;
  label: string;
  value: string;
  icon: string;
  color: string;
  progress?: number;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

export interface ProgressData {
  tasksCompleted: string;
  focusTime: string;
  energyLevel: string;
  message: string;
}

export interface HealZoneItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface CollabItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  members?: number;
}

export type MoodType =
  | 'Happy'
  | 'Excited'
  | 'Calm'
  | 'Neutral'
  | 'Tired'
  | 'Anxious'
  | 'Sad'
  | 'Stressed';

export interface MoodOption {
  id: string;
  name: MoodType;
  emoji: string;
  score: number;
  color: string;
  bgColor: string;
}

export interface MoodEntry {
  id: string;
  mood: MoodType;
  emoji: string;
  score: number;
  date: string;
  time: string;
  timestamp: number;
}

export interface MoodChartPoint {
  label: string;
  score: number;
  mood: string;
  emoji: string;
}

// ==========================================
// User & Authentication Models
// ==========================================

export interface NotificationPreferences {
  dailyReminders: boolean;
  streakAlerts: boolean;
  communityUpdates: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  photoURL: string | null;
  username: string;
  createdAt: any;
  updatedAt: any;
  onboardingCompleted: boolean;
  userType: 'student' | 'professional' | 'other' | string;
  currentMood?: string;
  wellnessGoals: string[];
  whyUsingBloom?: string[];
  helpImprove?: string[];
  notificationPreferences: NotificationPreferences;
  bio?: string;
  statusBadge?: string;
  avatarSeed?: string;
}

export interface OnboardingResponses {
  fullName: string;
  currentMood: string;
  reasons: string[];
  userType: string;
  wellnessGoals: string[];
  improvements: string[];
}

// ==========================================
// Firestore Data Collection Models
// ==========================================

export interface UserSettingsDocument {
  uid: string;
  theme: 'system' | 'light' | 'dark';
  hapticsEnabled: boolean;
  audioFeedbackEnabled: boolean;
  fontSize: 'standard' | 'large';
  updatedAt: any;
}

export interface MoodEntryDocument {
  id?: string;
  userId: string;
  mood: MoodType;
  emoji: string;
  score: number;
  note?: string;
  tags?: string[];
  date: string;
  time: string;
  createdAt: any;
}

export interface WellnessActivityDocument {
  id?: string;
  userId: string;
  activityType: 'breathing' | 'soundscape' | 'journal' | 'meditation' | 'game';
  title: string;
  durationMinutes: number;
  completedAt: any;
}

export interface TaskDocument {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  category?: 'student' | 'wellness' | 'screen_time' | 'personal';
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt: any;
  updatedAt: any;
}

export interface HabitDocument {
  id?: string;
  userId: string;
  title: string;
  frequency: 'daily' | 'weekly';
  streakCount: number;
  lastCompletedDate?: string;
  createdAt: any;
}

export interface FocusSessionDocument {
  id?: string;
  userId: string;
  topic: string;
  durationMinutes: number;
  completed: boolean;
  startedAt: any;
  completedAt?: any;
}

export interface FriendDocument {
  id?: string;
  userId: string;
  friendUid: string;
  friendName: string;
  friendUsername: string;
  friendPhotoURL?: string | null;
  friendMood?: string;
  establishedAt: any;
}

export interface FriendRequestDocument {
  id?: string;
  senderUid: string;
  senderName: string;
  senderUsername: string;
  senderPhotoURL?: string | null;
  receiverUid: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
}

export interface GlobalChallengeDocument {
  id?: string;
  title: string;
  description: string;
  category: 'mindfulness' | 'screen_time' | 'focus' | 'hydration';
  participantCount: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: any;
}

export interface ChallengeParticipantDocument {
  id?: string;
  challengeId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string | null;
  progressPercent: number;
  joinedAt: any;
  completedAt?: any;
}

export interface GlobalPostDocument {
  id?: string;
  authorUid: string;
  authorName: string;
  authorUsername: string;
  authorPhotoURL?: string | null;
  content: string;
  imageUri?: string | null;
  likesCount: number;
  commentsCount: number;
  likedByUids?: string[];
  tags?: string[];
  createdAt: any;
}

export interface PostCommentDocument {
  id?: string;
  postId: string;
  authorUid: string;
  authorName: string;
  authorPhotoURL?: string | null;
  text: string;
  createdAt: any;
}

export interface GlobalMessageDocument {
  id?: string;
  authorUid: string;
  authorName: string;
  authorPhotoURL?: string | null;
  text: string;
  reactions?: Record<string, string[]>; // emoji -> list of user UIDs
  replyToMessageId?: string;
  mediaUri?: string | null;
  mediaType?: 'image' | 'poll' | null;
  pollData?: {
    question: string;
    options: { text: string; votes: string[] }[];
  } | null;
  createdAt: any;
}

export interface PrivateMessageDocument {
  id?: string;
  conversationId: string;
  senderUid: string;
  receiverUid: string;
  text: string;
  read: boolean;
  createdAt: any;
}

export interface AIConversationDocument {
  id: string;
  userId: string;
  title: string;
  lastMessageSnippet?: string;
  createdAt: any;
  updatedAt: any;
}

export interface AIMessageDocument {
  id: string;
  conversationId: string;
  userId: string;
  sender: 'user' | 'ai';
  text: string;
  emotion?: string;
  createdAt: any;
}

export interface NotificationDocument {
  id?: string;
  userId: string;
  title: string;
  body: string;
  type: 'friend_request' | 'streak_alert' | 'challenge' | 'system';
  read: boolean;
  actionRoute?: string;
  createdAt: any;
}


