export type CircleScreenView = 'landing' | 'global' | 'my_circle';
export type BloomCircleTab = 'global' | 'my_circle';
export type CollabTab = 'global' | 'friends' | 'challenges' | 'my_circle';
export type GlobalCircleTab = 'trending' | 'chat' | 'posts';
export type MyCircleTab = 'friends' | 'requests' | 'discover';

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  initials: string;
  bio: string;
  streak: number;
  challengesJoined: number;
  postsCount: number;
  friendsCount: number;
  isOnline: boolean;
  isFriend: boolean;
  visibility?: 'public' | 'private';
  friendshipStatus?: 'none' | 'pending_sent' | 'pending_received' | 'friends';
  mutualInfo?: string;
  tags?: string[];
  badges: Array<{ id: string; name: string; icon: string; description: string }>;
}

export interface PostComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userInitials: string;
  text: string;
  timestamp: string;
}

export interface GrowthSubCard {
  type: 'badge' | 'metric';
  badgeLabel?: string;
  streakText?: string;
  metricTitle?: string;
  metricSubtitle?: string;
  metricStatus?: string;
  imageUrl?: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  userInitials: string;
  timeAgo: string;
  category: string;
  content: string;
  image?: string;
  isPrivate?: boolean;
  likesVisible?: boolean;
  commentsEnabled?: boolean;
  gradientColors?: [string, string];
  growthCard?: GrowthSubCard;
  likesCount: number;
  isLiked: boolean;
  isBookmarked?: boolean;
  commentsCount: number;
  comments: PostComment[];
  sharesCount: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface ChatPoll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderHandle?: string;
  senderInitials?: string;
  text: string;
  image?: string;
  video?: string;
  fileDoc?: { name: string; size: string };
  audioNote?: { duration: string };
  timestamp: string;
  isMe: boolean;
  reactions?: Record<string, number>;
  myReactions?: string[];
  poll?: ChatPoll;
}

export interface Conversation {
  id: string;
  withUser: UserProfile;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export type ChallengeCategory =
  | 'All'
  | 'Fitness'
  | 'Mindfulness'
  | 'Productivity'
  | 'Study'
  | 'Digital Detox'
  | 'Sleep'
  | 'Lifestyle'
  | 'Personal Growth';

export type ChallengeVisibility = 'public' | 'private';
export type ChallengeStatus = 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';

export interface ChallengeActivity {
  id: string;
  title: string;
  description?: string;
  required?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  categoryTag?: string; // e.g. "Community Quest", "Sprint", "Detox"
  category: 'Trending' | 'Daily' | 'Weekly' | 'Popular' | ChallengeCategory;
  duration: string;
  durationDays?: number;
  participantsText?: string;
  participantsCount: number;
  currentDay?: number;
  totalDays?: number;
  progressPercent?: number;
  isJoined: boolean;
  buttonLabel?: string;
  iconName?: string;
  gradientColors?: [string, string];
  coverImageUrl?: string;
  creatorUid?: string;
  creatorName?: string;
  creatorAvatar?: string;
  startDate?: string;
  endDate?: string;
  dailyActivities?: ChallengeActivity[];
  rules?: string[];
  visibility?: ChallengeVisibility;
  status?: ChallengeStatus;
  isPopular?: boolean;
  isTrending?: boolean;
  userProgress?: number;
  completedDays?: number;
  currentStreak?: number;
  dailyTasks?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface ChallengeItem extends Challenge {
  shortDescription: string;
  category: ChallengeCategory;
  durationDays: number;
  startDate: string;
  endDate: string;
  dailyActivities: ChallengeActivity[];
  visibility: ChallengeVisibility;
  status: ChallengeStatus;
}

export interface ChallengeParticipant {
  id?: string;
  uid: string;
  displayName: string;
  avatarUrl?: string;
  joinedAt: any;
  completedDays: number;
  currentStreak: number;
  lastCheckInDate?: string;
  progressVisibility: 'public' | 'private';
  completionPercentage?: number;
}

export interface ChallengeDailyCheckIn {
  id?: string;
  date: string; // YYYY-MM-DD
  completedActivities: string[];
  completed: boolean;
  completionPercentage: number;
  createdAt: any;
  updatedAt: any;
}

export interface ChallengeComment {
  id: string;
  challengeId: string;
  uid: string;
  displayName: string;
  avatarUrl?: string;
  message: string;
  createdAt: any;
}

export interface TrendingDiscussion {
  id: string;
  title: string;
  preview: string;
  icon: string;
  repliesCount: number;
  timeAgo: string;
  comments: PostComment[];
}

export interface LeaderboardUser {
  rank: number;
  userId: string;
  name: string;
  handle: string;
  avatar: string;
  streakDays: number;
  bloomPoints: number;
  isMe?: boolean;
}
