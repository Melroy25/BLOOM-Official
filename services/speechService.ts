// Speech Service for BLOOM AI Companion
// High-reliability Text-To-Speech (TTS) and Speech-To-Text (STT)
// Works across Web, Android, iOS, and Expo Go

import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

class SpeechService {
  private isCurrentlySpeaking: boolean = false;
  private activeRecognition: any = null;
  private isAudioUnlocked: boolean = false;
  private stopTimeout: any = null;

  constructor() {
    // Warm up Web Speech Synthesis voices if on web
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices();
        if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
          window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
          };
        }
      } catch {}
    }
  }

  /**
   * Unlock browser audio playback on user gesture
   */
  public unlockAudio(): void {
    if (this.isAudioUnlocked) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        // Speak a silent micro-utterance to unlock audio policy in Chrome/Safari
        const silentUtterance = new SpeechSynthesisUtterance(' ');
        silentUtterance.volume = 0.01;
        silentUtterance.rate = 10;
        window.speechSynthesis.speak(silentUtterance);
        this.isAudioUnlocked = true;
      } catch {}
    } else {
      this.isAudioUnlocked = true;
    }
  }

  /**
   * Speak given text aloud with guaranteed playback and error resilience
   */
  public async speak(
    text: string,
    onStart?: () => void,
    onDone?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    try {
      // 1. Clean markdown, emojis, asterisks for natural speech
      const cleanText = text
        .replace(/[🌱✨⏱️🌸🌿💬🎙️❤️⭐]/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#+/g, '')
        .replace(/`+/g, '')
        .replace(/\n+/g, '. ')
        .trim();

      if (!cleanText) {
        onDone?.();
        return;
      }

      // 2. Stop any previous speech
      await this.stopSpeaking();

      // Brief delay to allow native and browser audio threads to clear previous utterance
      await new Promise((resolve) => setTimeout(resolve, 80));

      this.isCurrentlySpeaking = true;

      // Web platform custom resilient driver (bypasses Expo-Speech web quirks and Chrome GC bug)
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.pitch = 1.12; // Friendly companion pitch
        utterance.rate = 0.96;  // Calm, relaxed student pacing
        utterance.volume = 1.0;

        // Choose best natural voice if available
        const voices = window.speechSynthesis.getVoices() || [];
        const preferredVoice = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('Jenny') ||
              v.name.includes('Google US') ||
              v.name.includes('Zira') ||
              v.name.includes('Aria'))
        ) || voices.find((v) => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
          this.isCurrentlySpeaking = true;
          onStart?.();
        };

        utterance.onend = () => {
          this.isCurrentlySpeaking = false;
          (window as any).__bloomActiveUtterance = null;
          onDone?.();
        };

        utterance.onerror = (e) => {
          // 'canceled' or 'interrupted' is normal when user taps pause
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            console.warn('[BLOOM Speech] Web synthesis error:', e);
            onError?.(e);
          }
          this.isCurrentlySpeaking = false;
          (window as any).__bloomActiveUtterance = null;
          onDone?.();
        };

        // Pin to window to prevent Chrome Garbage Collector from cutting speech early
        (window as any).__bloomActiveUtterance = utterance;

        window.speechSynthesis.speak(utterance);
      } else {
        // Native Android / iOS via expo-speech
        Speech.speak(cleanText, {
          language: 'en-US',
          pitch: 1.08,
          rate: 0.95,
          onStart: () => {
            this.isCurrentlySpeaking = true;
            onStart?.();
          },
          onDone: () => {
            this.isCurrentlySpeaking = false;
            onDone?.();
          },
          onStopped: () => {
            this.isCurrentlySpeaking = false;
            onDone?.();
          },
          onError: (err: any) => {
            console.warn('[BLOOM Speech] Native speech error:', err);
            this.isCurrentlySpeaking = false;
            onError?.(err);
          },
        });
      }
    } catch (error) {
      console.warn('[BLOOM Speech] speak() exception:', error);
      this.isCurrentlySpeaking = false;
      onError?.(error);
    }
  }

  /**
   * Stop any current speech playback
   */
  public async stopSpeaking(): Promise<void> {
    try {
      this.isCurrentlySpeaking = false;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        (window as any).__bloomActiveUtterance = null;
      }
      await Speech.stop();
    } catch {
      // Silent catch
    }
  }

  /**
   * Check if speech is currently playing
   */
  public isSpeaking(): boolean {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.speaking || this.isCurrentlySpeaking;
    }
    return this.isCurrentlySpeaking;
  }

  /**
   * Start capturing speech from microphone
   */
  public startListening(callbacks: SpeechRecognitionCallbacks): boolean {
    this.unlockAudio();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        callbacks.onError?.('Web Speech API is not supported in this browser. Please use Chrome or Edge.');
        return false;
      }

      try {
        if (this.activeRecognition) {
          try {
            this.activeRecognition.stop();
          } catch {}
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          callbacks.onStart?.();
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript || '';
          callbacks.onResult?.(transcript);
        };

        recognition.onerror = (event: any) => {
          callbacks.onError?.(event.error || 'Microphone error');
        };

        recognition.onend = () => {
          this.activeRecognition = null;
          callbacks.onEnd?.();
        };

        this.activeRecognition = recognition;
        recognition.start();
        return true;
      } catch (err: any) {
        callbacks.onError?.(err?.message || 'Could not start speech recognition');
        return false;
      }
    } else {
      // Mobile Expo Go mode
      callbacks.onError?.('MOBILE_EXPO_GO_VOICE');
      return false;
    }
  }

  /**
   * Stop active speech recognition
   */
  public stopListening(): void {
    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch {}
      this.activeRecognition = null;
    }
  }
}

export const speechService = new SpeechService();
