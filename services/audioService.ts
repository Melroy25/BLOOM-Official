import { Audio, AVPlaybackStatus } from 'expo-av';

/**
 * AudioService:
 * Unified audio playback service built on expo-av for Expo Go compatibility.
 * Provides easy play, pause, toggle, and volume control for ambient sounds
 * and music relaxation tracks.
 */
class AudioService {
  private sound: Audio.Sound | null = null;
  private currentUriOrAsset: any = null;
  private isPlaying = false;
  private volume = 1.0;

  /**
   * Configure global audio mode for playback
   */
  async init(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (e) {
      console.warn('[AudioService] Failed to set audio mode:', e);
    }
  }

  /**
   * Load and play an audio asset or remote URI
   */
  async play(
    source: any,
    options: { isLooping?: boolean; volume?: number; onStatusUpdate?: (status: AVPlaybackStatus) => void } = {}
  ): Promise<boolean> {
    try {
      await this.init();

      // If already playing the same source, unpause
      if (this.sound && this.currentUriOrAsset === source) {
        await this.sound.playAsync();
        this.isPlaying = true;
        return true;
      }

      // Stop and unload existing instance
      await this.unload();

      this.volume = options.volume ?? 1.0;
      const initialStatus = {
        shouldPlay: true,
        isLooping: !!options.isLooping,
        volume: this.volume,
        progressUpdateIntervalMillis: 250,
      };

      const sourceObj = typeof source === 'string' ? { uri: source } : source;
      const { sound } = await Audio.Sound.createAsync(
        sourceObj,
        initialStatus,
        (status) => {
          if (status.isLoaded) {
            this.isPlaying = status.isPlaying;
          }
          options.onStatusUpdate?.(status);
        }
      );

      this.sound = sound;
      this.currentUriOrAsset = source;
      this.isPlaying = true;
      return true;
    } catch (error) {
      console.warn('[AudioService] Playback error:', error);
      this.isPlaying = false;
      return false;
    }
  }

  /**
   * Pause the currently playing sound
   */
  async pause(): Promise<void> {
    try {
      if (this.sound && this.isPlaying) {
        await this.sound.pauseAsync();
        this.isPlaying = false;
      }
    } catch (e) {
      console.warn('[AudioService] Pause error:', e);
    }
  }

  /**
   * Toggle between play and pause
   */
  async togglePlayPause(source?: any): Promise<boolean> {
    if (this.isPlaying && this.sound) {
      await this.pause();
      return false;
    }
    if (source) {
      return await this.play(source);
    }
    if (this.sound) {
      await this.sound.playAsync();
      this.isPlaying = true;
      return true;
    }
    return false;
  }

  /**
   * Stop and reset playback to beginning
   */
  async stop(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.setPositionAsync(0);
        this.isPlaying = false;
      }
    } catch (e) {
      console.warn('[AudioService] Stop error:', e);
    }
  }

  /**
   * Unload sound instance from memory
   */
  async unload(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
        this.currentUriOrAsset = null;
        this.isPlaying = false;
      }
    } catch (e) {
      // ignore unload error
    }
  }

  /**
   * Get active playback state
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioService = new AudioService();
export default audioService;
