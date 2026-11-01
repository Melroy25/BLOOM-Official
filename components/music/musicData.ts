import { Colors } from '../../constants/colors';

export interface MusicSong {
  id: string;
  title: string;
  artist: string;
  durationFormatted: string;
  durationMillis: number;
  localAsset: any;
  remoteUrl?: string;
  description?: string;
}

export interface MusicPlaylist {
  id: string;
  name: string;
  theme: string;
  description: string;
  iconEmoji: string;
  iconName: 'Sun' | 'Heart' | 'Leaf' | 'Sparkles';
  bgColor: string;
  borderColor: string;
  accentColor: string;
  badgeBg: string;
  songs: MusicSong[];
}

// Local audio fallbacks bundled in the application
const singingBowlAudio = require('../../assets/audio/singing-bowl.mp3');
const windChimesAudio = require('../../assets/audio/wind-chimes.mp3');

// Royalty-free, public-domain audio stream URLs from trusted archives (with local fallback)
export const PLAYLISTS: MusicPlaylist[] = [
  {
    id: 'happy-vibes',
    name: 'Happy Vibes',
    theme: 'Happiness and positivity',
    description: 'Feel-good music to brighten your day.',
    iconEmoji: '☀️',
    iconName: 'Sun',
    bgColor: '#FDF6E9',
    borderColor: '#F7DFBF',
    accentColor: '#D98A2B',
    badgeBg: '#FCE7C5',
    songs: [
      {
        id: 'hv-1',
        title: 'Morning Sunlight',
        artist: 'Horizon Flow',
        durationFormatted: '3:12',
        durationMillis: 192000,
        localAsset: windChimesAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=uplifting-day-113576.mp3',
        description: 'Warm acoustic melodies with gentle morning rhythms.',
      },
      {
        id: 'hv-2',
        title: 'Golden Hour Glow',
        artist: 'Solace Waves',
        durationFormatted: '2:45',
        durationMillis: 165000,
        localAsset: singingBowlAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=sunshine-acoustic-ambient-11116.mp3',
        description: 'Uplifting harmonies inspired by afternoon light.',
      },
      {
        id: 'hv-3',
        title: 'Uplifted Spirit',
        artist: 'Joyful Horizon',
        durationFormatted: '3:30',
        durationMillis: 210000,
        localAsset: windChimesAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_3d1a3c613c.mp3?filename=positive-day-warmth-6078.mp3',
        description: 'Carefree acoustic tones to spark positivity and hope.',
      },
      {
        id: 'hv-4',
        title: 'Radiant Daybreak',
        artist: 'Amber Meadow',
        durationFormatted: '3:05',
        durationMillis: 185000,
        localAsset: singingBowlAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77cb7.mp3?filename=morning-breeze-hope-124008.mp3',
        description: 'Gentle upbeat resonance encouraging a vibrant mind.',
      },
    ],
  },
  {
    id: 'emotional-comfort',
    name: 'Emotional Comfort',
    theme: 'Sadness and emotional comfort',
    description: 'Music for moments when you need comfort.',
    iconEmoji: '💗',
    iconName: 'Heart',
    bgColor: '#FDF1F4',
    borderColor: '#F6D3DD',
    accentColor: '#C45B73',
    badgeBg: '#FCDAE2',
    songs: [
      {
        id: 'ec-1',
        title: 'Gentle Embrace',
        artist: 'Tender Melodies',
        durationFormatted: '3:20',
        durationMillis: 200000,
        localAsset: singingBowlAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=tender-piano-comfort-10657.mp3',
        description: 'Compassionate piano notes offering warmth and safety.',
      },
      {
        id: 'ec-2',
        title: 'Soft Rain Whispers',
        artist: 'Serene Heart',
        durationFormatted: '2:55',
        durationMillis: 175000,
        localAsset: windChimesAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_96c21e6462.mp3?filename=rain-comfort-solace-126427.mp3',
        description: 'Gentle raindrops blending with soft acoustic strings.',
      },
      {
        id: 'ec-3',
        title: 'Held in Warmth',
        artist: 'Kindred Spirit',
        durationFormatted: '3:40',
        durationMillis: 220000,
        localAsset: singingBowlAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1101.mp3?filename=warmth-of-healing-solace-10174.mp3',
        description: 'Grounding ambient tones that let you feel seen and safe.',
      },
      {
        id: 'ec-4',
        title: 'Peaceful Acceptance',
        artist: 'Solace Piano',
        durationFormatted: '3:15',
        durationMillis: 195000,
        localAsset: windChimesAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2022/04/27/audio_6ca4529f52.mp3?filename=peaceful-acceptance-soft-111154.mp3',
        description: 'Slow, soothing progressions for processing deep emotion.',
      },
    ],
  },
  {
    id: 'stress-relief',
    name: 'Stress Relief',
    theme: 'Stress reduction and relaxation',
    description: 'Slow down and let your worries fade.',
    iconEmoji: '🌿',
    iconName: 'Leaf',
    bgColor: '#EFF7F1',
    borderColor: '#D0EAD5',
    accentColor: '#365B45',
    badgeBg: '#D9EFE0',
    songs: [
      {
        id: 'sr-1',
        title: 'Forest Sanctuary',
        artist: 'Green Canopy',
        durationFormatted: '3:10',
        durationMillis: 190000,
        localAsset: windChimesAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_c1e6e02a1c.mp3?filename=forest-sanctuary-peace-112194.mp3',
        description: 'Natural woodland ambience with distant acoustic strings.',
      },
      {
        id: 'sr-2',
        title: 'Breathe In, Breathe Out',
        artist: 'Stillness Flow',
        durationFormatted: '3:25',
        durationMillis: 205000,
        localAsset: singingBowlAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_73d6bb36c3.mp3?filename=breath-mindfulness-meditation-7670.mp3',
        description: 'Rhythmic, gentle waves matched to a slow breathing pace.',
      },
      {
        id: 'sr-3',
        title: 'Mossy Pathways',
        artist: 'Earth Harmonics',
        durationFormatted: '2:50',
        durationMillis: 170000,
        localAsset: windChimesAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_51a4413efb.mp3?filename=calm-ambient-earth-path-10499.mp3',
        description: 'Soothing grounding frequencies that release muscle tension.',
      },
      {
        id: 'sr-4',
        title: 'Gentle Wind & Leaves',
        artist: 'Nature Resonators',
        durationFormatted: '3:35',
        durationMillis: 215000,
        localAsset: windChimesAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2022/10/18/audio_31368e59ec.mp3?filename=gentle-leaves-wind-peace-124434.mp3',
        description: 'Wind chime overtones floating across a tranquil forest.',
      },
    ],
  },
  {
    id: 'calm-peace',
    name: 'Calm & Peace',
    theme: 'Peace, mindfulness and meditation',
    description: 'Find your calm through soothing melodies.',
    iconEmoji: '🦋',
    iconName: 'Sparkles',
    bgColor: '#F4F0FA',
    borderColor: '#DCD2EE',
    accentColor: '#5A4E80',
    badgeBg: '#E9E1F5',
    songs: [
      {
        id: 'cp-1',
        title: 'Floating Cloud Meditation',
        artist: 'Celestial Sound',
        durationFormatted: '3:45',
        durationMillis: 225000,
        localAsset: singingBowlAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_65bead5677.mp3?filename=floating-clouds-ambient-10250.mp3',
        description: 'Light ethereal pads creating a sense of weightless serenity.',
      },
      {
        id: 'cp-2',
        title: 'Tibetan Singing Bowl',
        artist: 'Pure Mind',
        durationFormatted: '3:15',
        durationMillis: 195000,
        localAsset: singingBowlAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2021/04/08/audio_27c95e1ee2.mp3?filename=tibetan-singing-bowl-meditation-4184.mp3',
        description: 'Rich metallic overtone resonance used for deep relaxation.',
      },
      {
        id: 'cp-3',
        title: 'Whispering Chimes',
        artist: 'Zephyr Strings',
        durationFormatted: '3:30',
        durationMillis: 210000,
        localAsset: windChimesAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_40b2ff85e3.mp3?filename=whispering-wind-chimes-11117.mp3',
        description: 'Soft harmonic chimes bringing stillness to busy thoughts.',
      },
      {
        id: 'cp-4',
        title: 'Deep Still Waters',
        artist: 'Infinite Calm',
        durationFormatted: '3:00',
        durationMillis: 180000,
        localAsset: singingBowlAudio,
        remoteUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_27cb5e5812.mp3?filename=deep-still-waters-tranquil-10659.mp3',
        description: 'Subtle water ripples and mellow drones for restful mindfulness.',
      },
    ],
  },
];

export interface LibrarySong extends MusicSong {
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  categoryAccent: string;
}

export interface CustomPlaylist extends MusicPlaylist {
  isCustom: true;
  createdAt: number;
}

// Flat list of all 16 available songs across the 4 mood playlists
export const ALL_LIBRARY_SONGS: LibrarySong[] = PLAYLISTS.flatMap((playlist) =>
  playlist.songs.map((song) => ({
    ...song,
    categoryId: playlist.id,
    categoryName: playlist.name,
    categoryEmoji: playlist.iconEmoji,
    categoryAccent: playlist.accentColor,
  }))
);

