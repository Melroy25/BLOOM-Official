export interface BurstedThought {
  id: string;
  thought: string;
  feeling: string;
  feelingEmoji: string;
  date: string;
  time: string;
  timestamp: number;
}

export interface FeelingOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export const feelingOptions: FeelingOption[] = [
  { id: '1', label: 'Felt calm', emoji: '😌', color: '#789B83' },
  { id: '2', label: 'Felt happier', emoji: '✨', color: '#E8B86D' },
  { id: '3', label: 'Felt lighter', emoji: '🍃', color: '#6AAF7D' },
  { id: '4', label: 'Felt relieved', emoji: '🕊️', color: '#5A8FA8' },
  { id: '5', label: 'Felt grounded', emoji: '🌿', color: '#365B45' },
];

export const suggestedWorries: string[] = [
  'Upcoming exam deadlines',
  'Overthinking a conversation',
  'Feeling behind on goals',
  'Social fatigue & stress',
  'Fear of making mistakes',
];

export const initialBurstedThoughts: BurstedThought[] = [
  {
    id: 'b-1',
    thought: 'Overwhelmed with multiple project deadlines and study material',
    feeling: 'Felt calm',
    feelingEmoji: '😌',
    date: 'Today',
    time: '09:20 AM',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'b-2',
    thought: 'Anxious about speaking in front of the group during seminar',
    feeling: 'Felt lighter',
    feelingEmoji: '🍃',
    date: 'Yesterday',
    time: '04:15 PM',
    timestamp: Date.now() - 86400000,
  },
  {
    id: 'b-3',
    thought: 'Constantly comparing my daily pace with classmates',
    feeling: 'Felt grounded',
    feelingEmoji: '🌿',
    date: '2 days ago',
    time: '02:40 PM',
    timestamp: Date.now() - 86400000 * 2,
  },
  {
    id: 'b-4',
    thought: 'Worrying that I did not prepare enough for the assessment',
    feeling: 'Felt happier',
    feelingEmoji: '✨',
    date: '3 days ago',
    time: '07:50 PM',
    timestamp: Date.now() - 86400000 * 3,
  },
];
