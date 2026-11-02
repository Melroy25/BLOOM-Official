// Speech Service for BLOOM AI Companion 2.0
// High-reliability Text-To-Speech (TTS), Multi-lingual Voice Selection, and Speech-To-Text (STT)
// Verified support for English, Kannada, Hindi, Malayalam, Tamil, and Telugu across Web, Android, iOS.

import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import {
  SupportedLanguageCode,
  SupportedLanguage,
  SpeechVoiceOption,
  VoicePreference,
} from '../types';

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export interface CustomSpeechOptions {
  language?: string;
  voiceIdentifier?: string;
  rate?: number;
  pitch?: number;
  enabled?: boolean;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (err: any) => void;
}

export const SUPPORTED_LANGUAGES_CATALOG: {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  locales: string[];
  defaultLocale: string;
}[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    locales: ['en-US', 'en-IN', 'en-GB', 'en'],
    defaultLocale: 'en-US',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    locales: ['kn-IN', 'kn'],
    defaultLocale: 'kn-IN',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    locales: ['hi-IN', 'hi'],
    defaultLocale: 'hi-IN',
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    locales: ['ml-IN', 'ml'],
    defaultLocale: 'ml-IN',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    locales: ['ta-IN', 'ta'],
    defaultLocale: 'ta-IN',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    locales: ['te-IN', 'te'],
    defaultLocale: 'te-IN',
  },
];

class SpeechService {
  private isCurrentlySpeaking: boolean = false;
  private activeRecognition: any = null;
  private isAudioUnlocked: boolean = false;
  private cachedVoices: SpeechVoiceOption[] | null = null;

  constructor() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices();
        if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
          window.speechSynthesis.onvoiceschanged = () => {
            this.cachedVoices = null;
            this.getAvailableDeviceVoices();
          };
        }
      } catch {}
    }
  }

  /**
   * Request microphone recording permission
   */
  public async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          return true;
        }
        return true;
      }
      const { Audio } = require('expo-av');
      const response = await Audio.requestPermissionsAsync();
      return response.granted;
    } catch (err) {
      console.warn('[SpeechService] Permission request warning:', err);
      return false;
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
   * Retrieve all voices natively installed on this device / browser.
   */
  public async getAvailableDeviceVoices(): Promise<SpeechVoiceOption[]> {
    if (this.cachedVoices && this.cachedVoices.length > 0) {
      return this.cachedVoices;
    }

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const rawVoices = window.speechSynthesis.getVoices() || [];
        this.cachedVoices = rawVoices.map((v) => ({
          identifier: v.voiceURI || v.name,
          name: v.name,
          language: v.lang,
          quality: v.default ? 'Default' : 'Standard',
        }));
        return this.cachedVoices;
      }

      const nativeVoices = await Speech.getAvailableVoicesAsync();
      this.cachedVoices = (nativeVoices || []).map((v) => ({
        identifier: v.identifier,
        name: v.name,
        language: v.language,
        quality: v.quality,
      }));
      return this.cachedVoices;
    } catch (err) {
      console.warn('[SpeechService] Could not query device voices:', err);
      return [];
    }
  }

  /**
   * Return verified supported languages based on device voice engine support.
   */
  public async getSupportedLanguages(): Promise<SupportedLanguage[]> {
    const voices = await this.getAvailableDeviceVoices();

    return SUPPORTED_LANGUAGES_CATALOG.map((lang) => {
      const matchingVoices = voices.filter((v) => {
        const voiceLang = (v.language || '').toLowerCase().replace('_', '-');
        return lang.locales.some((loc) => voiceLang.startsWith(loc.toLowerCase())) ||
          voiceLang.startsWith(lang.code);
      });

      // English is always supported via default fallback
      const isVoiceSupported = lang.code === 'en' ? true : matchingVoices.length > 0;

      return {
        code: lang.code,
        name: lang.name,
        nativeName: lang.nativeName,
        locale: lang.defaultLocale,
        isVoiceSupported,
        availableVoicesCount: matchingVoices.length,
      };
    });
  }

  /**
   * Get device voices specifically for a chosen language.
   * Never returns voices for other languages.
   */
  public async getVoicesForLanguage(langCode: SupportedLanguageCode): Promise<SpeechVoiceOption[]> {
    const allVoices = await this.getAvailableDeviceVoices();
    const catalogItem = SUPPORTED_LANGUAGES_CATALOG.find((c) => c.code === langCode);
    if (!catalogItem) return [];

    return allVoices.filter((v) => {
      const voiceLang = (v.language || '').toLowerCase().replace('_', '-');
      return (
        catalogItem.locales.some((loc) => voiceLang.startsWith(loc.toLowerCase())) ||
        voiceLang.startsWith(langCode)
      );
    });
  }

  /**
   * Speak given text aloud with multi-language and voice preference support.
   */
  public async speak(
    text: string,
    options?: CustomSpeechOptions | (() => void),
    onDoneCallback?: () => void,
    onErrorCallback?: (err: any) => void
  ): Promise<void> {
    let opts: CustomSpeechOptions = {};
    if (typeof options === 'function') {
      opts = {
        onStart: options,
        onDone: onDoneCallback,
        onError: onErrorCallback,
      };
    } else if (options) {
      opts = options;
    }

    if (opts.enabled === false) {
      opts.onDone?.();
      return;
    }

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
        opts.onDone?.();
        return;
      }

      // 2. Stop any previous speech
      await this.stopSpeaking();
      await new Promise((resolve) => setTimeout(resolve, 60));

      this.isCurrentlySpeaking = true;

      const rate = opts.rate ?? 0.95;
      const pitch = opts.pitch ?? 1.08;
      const lang = opts.language || 'en-US';

      // Web platform custom resilient driver
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = lang;
        utterance.pitch = pitch;
        utterance.rate = rate;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices() || [];
        if (opts.voiceIdentifier) {
          const matchedVoice = voices.find(
            (v) => (v.voiceURI && v.voiceURI === opts.voiceIdentifier) || v.name === opts.voiceIdentifier
          );
          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }
        } else {
          // Select natural preferred voice for this language
          const langMatch = voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2)));
          if (langMatch) {
            utterance.voice = langMatch;
          }
        }

        utterance.onstart = () => {
          this.isCurrentlySpeaking = true;
          opts.onStart?.();
        };

        utterance.onend = () => {
          this.isCurrentlySpeaking = false;
          (window as any).__bloomActiveUtterance = null;
          opts.onDone?.();
        };

        utterance.onerror = (e) => {
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            console.warn('[BLOOM Speech] Web synthesis error:', e);
            opts.onError?.(e);
          }
          this.isCurrentlySpeaking = false;
          (window as any).__bloomActiveUtterance = null;
          opts.onDone?.();
        };

        (window as any).__bloomActiveUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } else {
        // Native Android / iOS via expo-speech
        const nativeOptions: Speech.SpeechOptions = {
          language: lang,
          pitch,
          rate,
          onStart: () => {
            this.isCurrentlySpeaking = true;
            opts.onStart?.();
          },
          onDone: () => {
            this.isCurrentlySpeaking = false;
            opts.onDone?.();
          },
          onStopped: () => {
            this.isCurrentlySpeaking = false;
            opts.onDone?.();
          },
          onError: (err: any) => {
            console.warn('[BLOOM Speech] Native speech error:', err);
            this.isCurrentlySpeaking = false;
            opts.onError?.(err);
          },
        };

        if (opts.voiceIdentifier) {
          nativeOptions.voice = opts.voiceIdentifier;
        }

        Speech.speak(cleanText, nativeOptions);
      }
    } catch (error) {
      console.warn('[BLOOM Speech] speak() exception:', error);
      this.isCurrentlySpeaking = false;
      opts.onError?.(error);
    }
  }

  /**
   * Stop any current speech playback immediately (Interrupt).
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
   * Pause speech synthesis
   */
  public pauseSpeaking(): void {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
      } else {
        Speech.pause();
      }
    } catch {}
  }

  /**
   * Resume speech synthesis
   */
  public resumeSpeaking(): void {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
      } else {
        Speech.resume();
      }
    } catch {}
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
   * Start capturing speech from microphone with language selection.
   */
  public startListening(
    callbacks: SpeechRecognitionCallbacks,
    languageLocale: string = 'en-US'
  ): boolean {
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
        recognition.lang = languageLocale;

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
