import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomPlaylist, MusicPlaylist, PLAYLISTS } from './musicData';

const STORAGE_KEY = '@bloom_custom_playlists_v1';

const DEFAULT_CUSTOM_PLAYLISTS: CustomPlaylist[] = [];

// In-memory cache (works across all platforms)
let inMemoryPlaylists: CustomPlaylist[] = [];
let isInitialized = false;
const listeners = new Set<() => void>();

const hydrateSongs = (rawPlaylists: any[]): CustomPlaylist[] => {
  return rawPlaylists.map((item: any) => ({
    ...item,
    songs: (item.songs || []).map((s: any) => {
      const matchedSong = PLAYLISTS.flatMap((p) => p.songs).find((libSong) => libSong.id === s.id);
      return matchedSong || s;
    }),
  }));
};

const loadFromStorage = (): CustomPlaylist[] => {
  // 1. Try synchronous localStorage (Web)
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const raw = globalThis.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return hydrateSongs(parsed);
        }
      }
    }
  } catch (e) {}

  // 2. Asynchronously load from AsyncStorage (Native iOS/Android + Web fallback)
  try {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            inMemoryPlaylists = hydrateSongs(parsed);
            notifyListeners();
          }
        } catch (err) {}
      }
    }).catch(() => {});
  } catch (e) {}

  return DEFAULT_CUSTOM_PLAYLISTS;
};

const saveToStorage = (playlists: CustomPlaylist[]) => {
  // 1. Save to Web localStorage
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
    }
  } catch (e) {}

  // 2. Save to React Native AsyncStorage (Native iOS/Android + Web)
  try {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(playlists)).catch(() => {});
  } catch (e) {}
};

const ensureInitialized = () => {
  if (!isInitialized) {
    inMemoryPlaylists = loadFromStorage();
    isInitialized = true;
  }
};

const notifyListeners = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {}
  });
};

export const CustomPlaylistStore = {
  getCustomPlaylists(): CustomPlaylist[] {
    ensureInitialized();
    return [...inMemoryPlaylists];
  },

  getPlaylistById(id: string): MusicPlaylist | CustomPlaylist | undefined {
    ensureInitialized();
    // 1. Check standard 4 mood categories
    const standard = PLAYLISTS.find((p) => p.id === id);
    if (standard) return standard;

    // 2. Check custom playlists
    return inMemoryPlaylists.find((p) => p.id === id);
  },

  saveCustomPlaylist(playlist: CustomPlaylist) {
    ensureInitialized();
    const existingIndex = inMemoryPlaylists.findIndex((p) => p.id === playlist.id);
    if (existingIndex !== -1) {
      inMemoryPlaylists[existingIndex] = playlist;
    } else {
      inMemoryPlaylists = [playlist, ...inMemoryPlaylists];
    }
    saveToStorage(inMemoryPlaylists);
    notifyListeners();
  },

  deleteCustomPlaylist(id: string) {
    ensureInitialized();
    inMemoryPlaylists = inMemoryPlaylists.filter((p) => p.id !== id);
    saveToStorage(inMemoryPlaylists);
    notifyListeners();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
