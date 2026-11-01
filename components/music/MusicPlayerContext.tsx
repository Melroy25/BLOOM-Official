import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { MusicPlaylist, MusicSong, PLAYLISTS } from './musicData';
import { UserMusicStorage } from '../../services/userMusicStorage';

interface MusicPlayerContextType {
  currentPlaylist: MusicPlaylist | null;
  currentSong: MusicSong | null;
  isPlaying: boolean;
  isLoading: boolean;
  positionMillis: number;
  durationMillis: number;
  error: string | null;
  playSong: (song: MusicSong, playlist: MusicPlaylist) => Promise<void>;
  playAll: (playlist: MusicPlaylist) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  seekTo: (positionMillis: number) => Promise<void>;
  stopPlayback: () => Promise<void>;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPlaylist, setCurrentPlaylist] = useState<MusicPlaylist | null>(null);
  const [currentSong, setCurrentSong] = useState<MusicSong | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const currentSongRef = useRef<MusicSong | null>(null);
  const currentPlaylistRef = useRef<MusicPlaylist | null>(null);

  // Sync refs with latest state for callback closures
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    currentPlaylistRef.current = currentPlaylist;
  }, [currentPlaylist]);

  // Configure Audio Mode on mount
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (err) {
        // Audio mode initialization warning non-fatal
      }
    };
    initAudio();

    // Clean up sound on provider unmount (e.g. leaving Music section)
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  // Playback status listener callback
  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setError(`Playback error: ${status.error}`);
        setIsPlaying(false);
        setIsLoading(false);
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setPositionMillis(status.positionMillis);
    setDurationMillis(status.durationMillis || (currentSongRef.current?.durationMillis ?? 180000));
    setIsLoading(false);

    // Auto-advance to next song on track completion
    if (status.didJustFinish) {
      playNext();
    }
  }, []);

  // Internal loader with automatic fallback to local audio asset
  const loadAndPlayTrack = async (song: MusicSong, playlist: MusicPlaylist) => {
    setIsLoading(true);
    setError(null);
    setCurrentSong(song);
    setCurrentPlaylist(playlist);
    setPositionMillis(0);
    setDurationMillis(song.durationMillis);

    // Clean up previous sound instance to ensure only ONE song plays at a time
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (e) {
        // ignore unload errors
      }
      soundRef.current = null;
    }

    let loadedSuccessfully = false;

    // Resolve audio URI (from remoteUrl or UserMusicStorage for user uploads)
    let audioUri = song.remoteUrl;
    if ((!audioUri || song.id.startsWith('user_song_')) && typeof UserMusicStorage !== 'undefined') {
      try {
        const resolved = await UserMusicStorage.getAudioUriForSong(song.id);
        if (resolved) {
          audioUri = resolved;
        }
      } catch (e) {}
    }

    // 1. Try audio URI (remote or user-uploaded blob/file)
    if (audioUri) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true, progressUpdateIntervalMillis: 250 },
          onPlaybackStatusUpdate
        );
        soundRef.current = sound;
        loadedSuccessfully = true;
        setIsPlaying(true);
        setIsLoading(false);
      } catch (remoteError) {
        // Fall back to bundled asset if applicable
      }
    }

    // 2. Fall back to local bundled asset if remote failed or is not configured
    if (!loadedSuccessfully && song.localAsset) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          song.localAsset,
          { shouldPlay: true, progressUpdateIntervalMillis: 250 },
          onPlaybackStatusUpdate
        );
        soundRef.current = sound;
        loadedSuccessfully = true;
        setIsPlaying(true);
        setIsLoading(false);
      } catch (localError: any) {
        setError('Could not load audio track. Please try again.');
        setIsPlaying(false);
        setIsLoading(false);
      }
    }
  };

  // Play a specific song within a playlist
  const playSong = useCallback(async (song: MusicSong, playlist: MusicPlaylist) => {
    // If the song is already loaded, toggle play/pause
    if (currentSongRef.current?.id === song.id && soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    await loadAndPlayTrack(song, playlist);
  }, [isPlaying]);

  // Play All: Starts from the first song in the playlist
  const playAll = useCallback(async (playlist: MusicPlaylist) => {
    if (playlist.songs.length === 0) return;
    await loadAndPlayTrack(playlist.songs[0], playlist);
  }, []);

  // Toggle Play / Pause for the currently active track
  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) {
      // If no song loaded yet, start the first playlist and first song
      const defaultPlaylist = currentPlaylistRef.current || PLAYLISTS[0];
      const defaultSong = defaultPlaylist.songs[0];
      await loadAndPlayTrack(defaultSong, defaultPlaylist);
      return;
    }

    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      setError('Unable to toggle playback');
    }
  }, [isPlaying]);

  // Skip to the next song in the active playlist
  const playNext = useCallback(async () => {
    const playlist = currentPlaylistRef.current;
    const song = currentSongRef.current;
    if (!playlist || playlist.songs.length === 0) return;

    let nextIndex = 0;
    if (song) {
      const currentIndex = playlist.songs.findIndex((s) => s.id === song.id);
      if (currentIndex !== -1) {
        nextIndex = (currentIndex + 1) % playlist.songs.length;
      }
    }

    await loadAndPlayTrack(playlist.songs[nextIndex], playlist);
  }, []);

  // Skip to previous song or restart current song
  const playPrevious = useCallback(async () => {
    const playlist = currentPlaylistRef.current;
    const song = currentSongRef.current;
    if (!playlist || playlist.songs.length === 0) return;

    // If current song has played for more than 3 seconds, seek back to 0
    if (positionMillis > 3000 && soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(0);
        setPositionMillis(0);
        return;
      } catch (e) {
        // fallback to loading previous
      }
    }

    let prevIndex = playlist.songs.length - 1;
    if (song) {
      const currentIndex = playlist.songs.findIndex((s) => s.id === song.id);
      if (currentIndex !== -1) {
        prevIndex = (currentIndex - 1 + playlist.songs.length) % playlist.songs.length;
      }
    }

    await loadAndPlayTrack(playlist.songs[prevIndex], playlist);
  }, [positionMillis]);

  // Seek position
  const seekTo = useCallback(async (targetMillis: number) => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(targetMillis);
      setPositionMillis(targetMillis);
    } catch (e) {
      // Seek error non-fatal
    }
  }, []);

  // Stop playback and unload audio
  const stopPlayback = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
    }
    setIsPlaying(false);
    setPositionMillis(0);
    setCurrentSong(null);
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentPlaylist,
        currentSong,
        isPlaying,
        isLoading,
        positionMillis,
        durationMillis,
        error,
        playSong,
        playAll,
        togglePlayPause,
        playNext,
        playPrevious,
        seekTo,
        stopPlayback,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = (): MusicPlayerContextType => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
