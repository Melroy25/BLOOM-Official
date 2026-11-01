import AsyncStorage from '@react-native-async-storage/async-storage';
import { MusicSong, CustomPlaylist } from '../components/music/musicData';

export interface UserSong {
  id: string;
  userId: string;
  title: string;
  artist: string;
  durationFormatted: string;
  durationMillis: number;
  fileName: string;
  fileSizeFormatted: string;
  coverUrl?: string;
  createdAt: number;
}

const CURRENT_USER_ID = 'user_me';
const METADATA_STORAGE_KEY = `@bloom_user_music_metadata_${CURRENT_USER_ID}`;
const PLAYLISTS_STORAGE_KEY = `@bloom_user_playlists_${CURRENT_USER_ID}`;
const DB_NAME = 'BloomMusicStorageDB';
const DB_VERSION = 1;
const AUDIO_STORE_NAME = 'user_audio_files';

// Format bytes into readable string (e.g. "3.4 MB")
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Clean raw file name into a formatted song title
export const cleanFileNameToTitle = (fileName: string): string => {
  let base = fileName.replace(/\.[^/.]+$/, '');
  base = base.replace(/^(\d+[\s\.\-_]+)+/, '');
  base = base.replace(/[_\-]+/g, ' ');
  base = base.replace(/\s+/g, ' ').trim();
  if (!base) return 'Untitled Song';
  return base
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// Device audio file selector supporting multi-file upload
export const pickAudioFilesFromDevice = (): Promise<File[]> => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve([]);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*,.mp3,.wav,.m4a,.aac,.ogg';
    input.multiple = true;
    input.style.position = 'fixed';
    input.style.top = '-9999px';
    input.style.left = '-9999px';
    input.style.opacity = '0';

    let resolved = false;
    const cleanupAndResolve = (files: File[]) => {
      if (resolved) return;
      resolved = true;
      try {
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      } catch (e) {}
      resolve(files);
    };

    input.onchange = (e: any) => {
      const fileList: FileList = e.target.files;
      const files: File[] = [];
      if (fileList) {
        for (let i = 0; i < fileList.length; i++) {
          const item = fileList.item(i);
          if (item) files.push(item);
        }
      }
      cleanupAndResolve(files);
    };

    input.oncancel = () => {
      cleanupAndResolve([]);
    };

    document.body.appendChild(input);
    input.click();
  });
};

// Device album cover image selector
export const pickCoverImageFromDevice = async (): Promise<string | null> => {
  try {
    const ImagePicker = require('expo-image-picker');
    if (ImagePicker && ImagePicker.launchImageLibraryAsync) {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        return res.assets[0].uri;
      }
      if (res.canceled) return null;
    }
  } catch (e) {
    // Fallback to web file picker
  }

  if (typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.position = 'fixed';
      input.style.top = '-9999px';
      input.style.left = '-9999px';
      input.style.opacity = '0';

      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        try {
          if (input.parentNode) input.parentNode.removeChild(input);
        } catch (err) {}
        if (file) {
          const url = URL.createObjectURL(file);
          resolve(url);
        } else {
          resolve(null);
        }
      };

      input.oncancel = () => {
        try {
          if (input.parentNode) input.parentNode.removeChild(input);
        } catch (err) {}
        resolve(null);
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  return null;
};

// Format milliseconds into mm:ss
export const formatDuration = (millis: number): string => {
  if (!millis || isNaN(millis) || millis < 0) return '0:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// Open or initialize IndexedDB for persistent binary audio storage (Web)
const openAudioDB = (): Promise<IDBDatabase | null> => {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
          db.createObjectStore(AUDIO_STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
};

// In-memory audio blob cache for active playback and fallback
const activeBlobUrlCache = new Map<string, string>();
const inMemoryAudioBlobs = new Map<string, Blob>();

// In-memory metadata cache for fast synchronous access
let inMemoryMetadata: UserSong[] | null = null;

// Listeners for reactive updates
const listeners = new Set<() => void>();
const notify = () => {
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {}
  });
};

// Load song metadata from localStorage (Web) and AsyncStorage (Native iOS/Android & Web)
const loadMetadataList = (): UserSong[] => {
  if (inMemoryMetadata !== null) {
    return inMemoryMetadata;
  }

  // 1. Try synchronous localStorage for instant web render
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const raw = globalThis.localStorage.getItem(METADATA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          inMemoryMetadata = parsed.filter((s) => s.userId === CURRENT_USER_ID);
          return inMemoryMetadata;
        }
      }
    }
  } catch (e) {}

  // 2. Asynchronously load from React Native AsyncStorage (Native iOS/Android + Web fallback)
  try {
    AsyncStorage.getItem(METADATA_STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            inMemoryMetadata = parsed.filter((s) => s.userId === CURRENT_USER_ID);
            notify();
          }
        } catch (err) {}
      }
    }).catch(() => {});
  } catch (e) {}

  inMemoryMetadata = [];
  return inMemoryMetadata;
};

// Save song metadata to localStorage and AsyncStorage
const saveMetadataList = (songs: UserSong[]) => {
  inMemoryMetadata = songs;

  // 1. Web localStorage
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      globalThis.localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(songs));
    }
  } catch (e) {}

  // 2. React Native AsyncStorage (Works on iOS, Android & Web)
  try {
    AsyncStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(songs)).catch(() => {});
  } catch (e) {}
};

// Detect audio duration from a File/Blob using an HTML Audio element if available
export const detectAudioDuration = (blob: Blob): Promise<number> => {
  return new Promise((resolve) => {
    if (typeof Audio === 'undefined' || typeof URL === 'undefined') {
      resolve(180000); // 3:00 default fallback
      return;
    }
    try {
      const tempUrl = URL.createObjectURL(blob);
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = tempUrl;

      const cleanup = () => {
        try {
          URL.revokeObjectURL(tempUrl);
        } catch (e) {}
      };

      audio.onloadedmetadata = () => {
        const durationSec = audio.duration;
        cleanup();
        if (isFinite(durationSec) && durationSec > 0) {
          resolve(Math.round(durationSec * 1000));
        } else {
          resolve(180000);
        }
      };

      audio.onerror = () => {
        cleanup();
        resolve(180000);
      };

      // Timeout safety after 4 seconds
      setTimeout(() => {
        cleanup();
        resolve(180000);
      }, 4000);
    } catch (e) {
      resolve(180000);
    }
  });
};

export const UserMusicStorage = {
  CURRENT_USER_ID,

  // Get all uploaded songs for the current user
  getUserSongs(): UserSong[] {
    return loadMetadataList();
  },

  // Save a new audio file and its metadata
  async saveSong(
    fileBlob: Blob,
    info: {
      title: string;
      artist?: string;
      coverUrl?: string;
      durationMillis?: number;
      fileName: string;
      fileSize: number;
    }
  ): Promise<UserSong> {
    const songId = `user_song_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const durationMs = info.durationMillis || (await detectAudioDuration(fileBlob));

    const newSong: UserSong = {
      id: songId,
      userId: CURRENT_USER_ID,
      title: info.title.trim() || 'Untitled Song',
      artist: info.artist?.trim() || 'Unknown Artist',
      durationFormatted: formatDuration(durationMs),
      durationMillis: durationMs,
      fileName: info.fileName,
      fileSizeFormatted: formatFileSize(info.fileSize),
      coverUrl: info.coverUrl,
      createdAt: Date.now(),
    };

    // 1. Store binary/blob in persistent IndexedDB storage (Web) or memory cache
    inMemoryAudioBlobs.set(songId, fileBlob);
    try {
      const db = await openAudioDB();
      if (db) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
          const store = tx.objectStore(AUDIO_STORE_NAME);
          store.put({ id: songId, blob: fileBlob });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      }
    } catch (e) {
      // IndexedDB write fallback non-fatal
    }

    // 2. Cache active object URL or native file URI for immediate playback
    if ((fileBlob as any)?.uri) {
      activeBlobUrlCache.set(songId, (fileBlob as any).uri);
    } else if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      try {
        const blobUrl = URL.createObjectURL(fileBlob);
        activeBlobUrlCache.set(songId, blobUrl);
      } catch (e) {}
    }

    // 3. Save metadata to dual storage (localStorage + AsyncStorage)
    const currentList = loadMetadataList();
    const updatedList = [newSong, ...currentList];
    saveMetadataList(updatedList);

    notify();
    return newSong;
  },

  // Update song metadata
  updateSong(songId: string, updates: Partial<UserSong>): UserSong | null {
    const currentList = loadMetadataList();
    const index = currentList.findIndex((s) => s.id === songId);
    if (index === -1) return null;

    const updated: UserSong = {
      ...currentList[index],
      ...updates,
      title: updates.title !== undefined ? updates.title.trim() : currentList[index].title,
      artist: updates.artist !== undefined ? updates.artist.trim() : currentList[index].artist,
    };

    currentList[index] = updated;
    saveMetadataList(currentList);
    notify();
    return updated;
  },

  // Delete song and its persistent audio blob
  async deleteSong(songId: string): Promise<void> {
    // 1. Revoke cached object URL
    if (activeBlobUrlCache.has(songId)) {
      try {
        URL.revokeObjectURL(activeBlobUrlCache.get(songId)!);
      } catch (e) {}
      activeBlobUrlCache.delete(songId);
    }
    inMemoryAudioBlobs.delete(songId);

    // 2. Remove from IndexedDB
    try {
      const db = await openAudioDB();
      if (db) {
        const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
        tx.objectStore(AUDIO_STORE_NAME).delete(songId);
      }
    } catch (e) {}

    // 3. Remove metadata from dual storage
    const currentList = loadMetadataList();
    const filtered = currentList.filter((s) => s.id !== songId);
    saveMetadataList(filtered);

    notify();
  },

  // Retrieve a playable URL for an uploaded song
  getAudioUriCached(songId: string): string | null {
    return activeBlobUrlCache.get(songId) || null;
  },

  async getAudioUriForSong(songId: string): Promise<string | null> {
    if (activeBlobUrlCache.has(songId)) {
      return activeBlobUrlCache.get(songId)!;
    }

    // Check in-memory blob
    if (inMemoryAudioBlobs.has(songId) && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      try {
        const url = URL.createObjectURL(inMemoryAudioBlobs.get(songId)!);
        activeBlobUrlCache.set(songId, url);
        return url;
      } catch (e) {}
    }

    // Load from IndexedDB
    try {
      const db = await openAudioDB();
      if (db) {
        const blob: Blob | null = await new Promise((resolve) => {
          const tx = db.transaction(AUDIO_STORE_NAME, 'readonly');
          const store = tx.objectStore(AUDIO_STORE_NAME);
          const req = store.get(songId);
          req.onsuccess = () => resolve(req.result ? req.result.blob : null);
          req.onerror = () => resolve(null);
        });

        if (blob && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          inMemoryAudioBlobs.set(songId, blob);
          const url = URL.createObjectURL(blob);
          activeBlobUrlCache.set(songId, url);
          return url;
        }
      }
    } catch (e) {}

    return null;
  },

  // Convert a UserSong into a playable MusicSong for the music player
  async toMusicSong(userSong: UserSong): Promise<MusicSong> {
    const audioUri = await this.getAudioUriForSong(userSong.id);
    return {
      id: userSong.id,
      title: userSong.title,
      artist: userSong.artist || 'My Upload',
      durationFormatted: userSong.durationFormatted,
      durationMillis: userSong.durationMillis,
      localAsset: null,
      remoteUrl: audioUri || undefined,
      description: `From your music library • ${userSong.fileSizeFormatted}`,
    };
  },

  // Subscribe to changes in the user's music library
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
