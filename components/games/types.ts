export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyLevel;
  title: string;
  emoji: string;
  pairs: number;
  totalCards: number;
  pairsText: string;
  cardsText: string;
  description: string;
  accentColor: string;
  bgColor: string;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    id: 'easy',
    title: 'EASY',
    emoji: '🌱',
    pairs: 4,
    totalCards: 8,
    pairsText: '4 Pairs',
    cardsText: '8 Cards',
    description: 'Simple and familiar images.',
    accentColor: '#365B45',
    bgColor: '#F0F6F2',
  },
  medium: {
    id: 'medium',
    title: 'MEDIUM',
    emoji: '🌼',
    pairs: 8,
    totalCards: 16,
    pairsText: '8 Pairs',
    cardsText: '16 Cards',
    description: 'More variety.',
    accentColor: '#5A4E80',
    bgColor: '#F4EFFB',
  },
  hard: {
    id: 'hard',
    title: 'HARD',
    emoji: '🔥',
    pairs: 12,
    totalCards: 24,
    pairsText: '12 Pairs',
    cardsText: '24 Cards',
    description: 'More challenging.',
    accentColor: '#C46D4B',
    bgColor: '#FDF3EE',
  },
};

export interface GameCategory {
  id: string;
  name: string;
  emoji: string;
  shortDesc: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  symbols: string[];
}

export const GAME_CATEGORIES: GameCategory[] = [
  {
    id: 'animals',
    name: 'Animal Kingdom',
    emoji: '🐾',
    shortDesc: 'Animals & wildlife pictures',
    accentColor: '#365B45',
    bgColor: '#F7FAF7',
    borderColor: '#E2EBE2',
    symbols: ['🦁', '🐯', '🐼', '🐨', '🦊', '🐰', '🐘', '🦒', '🦓', '🐵', '🐶', '🐱'],
  },
  {
    id: 'nature',
    name: 'Nature & Plants',
    emoji: '🌿',
    shortDesc: 'Flowers, trees & leaves',
    accentColor: '#365B45',
    bgColor: '#F1F7F3',
    borderColor: '#D4E6D9',
    symbols: ['🌸', '🌿', '🌻', '🌲', '🍀', '🍁', '🍄', '🌴', '🌺', '🌾', '🌵', '🌷'],
  },
  {
    id: 'food',
    name: 'Food & Fruits',
    emoji: '🍎',
    shortDesc: 'Fruits, veggies & snacks',
    accentColor: '#365B45',
    bgColor: '#FAF5F2',
    borderColor: '#EFE5DF',
    symbols: ['🍎', '🍓', '🍌', '🍉', '🍇', '🥑', '🥕', '🍒', '🍍', '🍑', '🌽', '🥝'],
  },
  {
    id: 'world',
    name: 'World Explorer',
    emoji: '🌍',
    shortDesc: 'Countries & landmarks',
    accentColor: '#365B45',
    bgColor: '#F2F6FA',
    borderColor: '#D8E5F0',
    symbols: ['🗼', '🗽', '🗻', '🏯', '🏝️', '🌋', '⛺', '🏜️', '🧭', '🏰', '🗿', '🗺️'],
  },
  {
    id: 'space',
    name: 'Space Adventure',
    emoji: '🚀',
    shortDesc: 'Planets, stars & cosmos',
    accentColor: '#365B45',
    bgColor: '#F4EFFB',
    borderColor: '#E2D8F2',
    symbols: ['🚀', '🪐', '🌕', '⭐', '🛸', '☄️', '🛰️', '🌌', '☀️', '👾', '🔭', '👨‍🚀'],
  },
  {
    id: 'colors',
    name: 'Colors & Shapes',
    emoji: '🎨',
    shortDesc: 'Match colors & shapes',
    accentColor: '#365B45',
    bgColor: '#F6F1FA',
    borderColor: '#E6DCF1',
    symbols: ['💎', '💜', '💙', '💚', '💛', '❤️', '🧡', '🤍', '💠', '🔷', '🔶', '✨'],
  },
  {
    id: 'everyday',
    name: 'Everyday Objects',
    emoji: '🧸',
    shortDesc: 'Common daily items',
    accentColor: '#365B45',
    bgColor: '#F8F5F0',
    borderColor: '#E9E3D8',
    symbols: ['🧸', '📚', '☕', '🎧', '⏰', '🔑', '🎒', '✏️', '💡', '📷', '🎸', '🚲'],
  },
  {
    id: 'birds',
    name: 'Birds & Wildlife',
    emoji: '🐦',
    shortDesc: 'Birds, wings & wildlife',
    accentColor: '#365B45',
    bgColor: '#F0F6F5',
    borderColor: '#D4E6E3',
    symbols: ['🐦', '🦉', '🦅', '🦆', '🦜', '🦩', '🐧', '🦚', '🕊️', '🦢', '🦇', '🦋'],
  },
];

export interface MemoryCardData {
  id: number;
  pairId: number;
  symbol: string;
  isMatched: boolean;
}

export type MemorySymbol = string;

export const DEFAULT_SYMBOLS = GAME_CATEGORIES[1].symbols;
