import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  Menu,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  MessageSquare,
  X,
  ArrowRight,
  Play,
  Square,
  AlertCircle,
  Plus,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Copy,
  Check,
  RotateCcw,
  Globe,
  Settings,
  Edit2,
  Trash2,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography, FontFamily } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import {
  MascotState,
  ChatMessage,
  ChatAttachment,
  ConversationThread,
  RECENT_CHECK_INS,
  generateCompanionResponse,
  getFormattedTime,
} from '../../services/aiCompanionService';
import { speechService } from '../../services/speechService';
import { AnimatedMascot } from '../../components/ai/AnimatedMascot';
import { SidebarDrawer } from '../../components/ai/SidebarDrawer';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { sendAIMessage, regenerateAIMessage } from '../../services/geminiService';
import {
  SupportedLanguageCode,
  LanguagePreference,
  VoicePreference,
  SupportedLanguage,
  SpeechVoiceOption,
} from '../../types';
import { SUPPORTED_LANGUAGES_CATALOG } from '../../services/speechService';
import {
  getUserAIConversations,
  createAIConversation,
  getAIMessages,
  renameAIConversation,
  deleteAIConversation,
  updateUserPreferences,
} from '../../services/firestoreService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SAMPLE_VOICE_PROMPTS = [
  "I'm feeling anxious about finals",
  "Help me focus with a 20-min sprint",
  "Can we do a gentle breathing reset?",
  "How can I pace my study time today?",
];

export default function AICompanionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, userProfile } = useAuth();

  // Mode state: 'VOICE' = Bot speaking audio with prominent mascot; 'CHAT' = pure text chat stream
  const [companionMode, setCompanionMode] = useState<'VOICE' | 'CHAT'>('VOICE');

  // Voice Mode state
  const [mascotState, setMascotState] = useState<MascotState>('IDLE');
  const [isVoiceMode, setIsVoiceMode] = useState<boolean>(true); // Audio playback toggle
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceQuery, setVoiceQuery] = useState<string | null>(null);
  const [voiceResponseText, setVoiceResponseText] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Chat Mode state (threads and message stream)
  const [threads, setThreads] = useState<ConversationThread[]>(RECENT_CHECK_INS);
  const [activeThreadId, setActiveThreadId] = useState<string>('checkin-1');
  const [isChatTyping, setIsChatTyping] = useState<boolean>(false);
  const chatScrollRef = useRef<any>(null);

  // AbortController for Stop Generation
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  // Language & Voice Preferences State
  const [selectedLanguage, setSelectedLanguage] = useState<LanguagePreference>({
    code: 'en',
    name: 'English',
    nativeName: 'English',
    locale: 'en-US',
  });
  const [voicePreference, setVoicePreference] = useState<VoicePreference>({
    enabled: true,
    rate: 0.95,
    pitch: 1.08,
  });
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([]);
  const [availableVoices, setAvailableVoices] = useState<SpeechVoiceOption[]>([]);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(false);
  const [prefTab, setPrefTab] = useState<'LANGUAGE' | 'VOICE'>('LANGUAGE');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  // Rename & Delete state
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [renameTargetThread, setRenameTargetThread] = useState<ConversationThread | null>(null);
  const [renameInputText, setRenameInputText] = useState<string>('');

  // Copy toast state
  const [copyToastText, setCopyToastText] = useState<string | null>(null);

  // Load language & voice settings from userProfile
  useEffect(() => {
    if (userProfile?.languagePreference) {
      setSelectedLanguage(userProfile.languagePreference);
    }
    if (userProfile?.voicePreference) {
      setVoicePreference(userProfile.voicePreference);
    }
  }, [userProfile]);

  // Inspect verified device voice support
  useEffect(() => {
    let isMounted = true;
    async function loadVoices() {
      try {
        const langs = await speechService.getSupportedLanguages();
        if (isMounted) setSupportedLanguages(langs);
        const voices = await speechService.getVoicesForLanguage(selectedLanguage.code);
        if (isMounted) setAvailableVoices(voices);
      } catch (err) {
        console.warn('[AI Screen] Error querying voices:', err);
      }
    }
    loadVoices();
    return () => {
      isMounted = false;
    };
  }, [selectedLanguage.code]);

  // Load user conversations from Firestore when user changes
  useEffect(() => {
    let isMounted = true;
    async function loadUserConversations() {
      if (!user?.uid) return;
      try {
        const convDocs = await getUserAIConversations(user.uid);
        if (convDocs && convDocs.length > 0 && isMounted) {
          const loadedThreads: ConversationThread[] = convDocs.map((c) => {
            let updatedText = 'Recently';
            if (c.updatedAt) {
              const date = (c.updatedAt as any).toDate
                ? (c.updatedAt as any).toDate()
                : (c.updatedAt as any).toMillis
                ? new Date((c.updatedAt as any).toMillis())
                : new Date(c.updatedAt);
              updatedText = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return {
              id: c.id,
              title: c.title || 'Mindful Reflection',
              lastUpdated: updatedText,
              messages: [],
            };
          });

          const firstConvId = loadedThreads[0].id;
          const firstMsgs = await getAIMessages(firstConvId);
          if (firstMsgs && firstMsgs.length > 0 && isMounted) {
            loadedThreads[0].messages = firstMsgs.map((m) => {
              let time = 'Earlier';
              if (m.createdAt) {
                const date = (m.createdAt as any).toDate
                  ? (m.createdAt as any).toDate()
                  : (m.createdAt as any).toMillis
                  ? new Date((m.createdAt as any).toMillis())
                  : new Date(m.createdAt);
                time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
              return {
                id: m.id,
                sender: m.sender,
                text: m.text,
                timestamp: time,
                emotion: (m.emotion as MascotState) || 'HAPPY',
              };
            });
          }

          if (isMounted) {
            setThreads(loadedThreads);
            setActiveThreadId(firstConvId);
          }
        }
      } catch (e) {
        console.warn('[AI Screen] Could not load user conversations:', e);
      }
    }
    loadUserConversations();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Input & Attachment state (ChatGPT-like file/image upload)
  const [inputText, setInputText] = useState<string>('');
  const [selectedAttachment, setSelectedAttachment] = useState<ChatAttachment | null>(null);
  const [attachModalVisible, setAttachModalVisible] = useState<boolean>(false);

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Mobile voice modal (fallback for Expo Go)
  const [mobileVoiceModalVisible, setMobileVoiceModalVisible] = useState<boolean>(false);
  const [voiceWaveAnim] = useState(new Animated.Value(0.3));

  // Current active thread object for Chat mode
  const currentThread =
    threads.find((t) => t.id === activeThreadId) || threads[0] || {
      id: 'default',
      title: 'Mindful Chat',
      lastUpdated: 'Just now',
      messages: [],
    };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
      speechService.stopListening();
    };
  }, []);

  // Voice wave loop
  useEffect(() => {
    if (isListening || mobileVoiceModalVisible) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(voiceWaveAnim, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(voiceWaveAnim, {
            toValue: 0.3,
            duration: 380,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isListening, mobileVoiceModalVisible, voiceWaveAnim]);

  // Scroll to bottom when new messages arrive in Chat mode
  useEffect(() => {
    if (companionMode === 'CHAT') {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
    }
  }, [currentThread.messages, companionMode]);

  // -------------------------------------------------------------
  // File & Image Picker (ChatGPT style: Web file picker & presets)
  // -------------------------------------------------------------
  const handlePickAttachment = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.pdf,.doc,.docx,.txt';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const isImage = file.type.startsWith('image/');
          const reader = new FileReader();
          reader.onload = (event) => {
            const uri = event.target?.result as string;
            const sizeStr =
              file.size > 1024 * 1024
                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                : `${Math.round(file.size / 1024)} KB`;

            setSelectedAttachment({
              id: 'att-' + Date.now(),
              uri,
              name: file.name,
              type: isImage ? 'image' : 'file',
              size: sizeStr,
            });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      setAttachModalVisible(true);
    }
  };

  const handleSelectSampleAttachment = (type: 'image' | 'file') => {
    if (type === 'image') {
      setSelectedAttachment({
        id: 'sample-img-' + Date.now(),
        uri: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
        name: 'study-notes-diagram.png',
        type: 'image',
        size: '340 KB',
      });
    } else {
      setSelectedAttachment({
        id: 'sample-doc-' + Date.now(),
        uri: 'file://sample-study-notes.pdf',
        name: 'exam-study-summary.pdf',
        type: 'file',
        size: '1.2 MB',
      });
    }
    setAttachModalVisible(false);
  };

  // -------------------------------------------------------------
  // VOICE MODE PIPELINE: The bot speaks with real voice audio
  // -------------------------------------------------------------
  const processVoiceMessage = async (text: string, customAttachment?: ChatAttachment | null) => {
    const trimmed = text.trim();
    const attachment = customAttachment !== undefined ? customAttachment : selectedAttachment;
    if (!trimmed && !attachment) return;

    speechService.unlockAudio();
    await speechService.stopSpeaking();

    const queryDesc = trimmed || (attachment ? `Shared ${attachment.name}` : '');
    setVoiceQuery(queryDesc);
    setSelectedAttachment(null);
    setInputText('');
    setSpeechError(null);
    setMascotState('THINKING');

    let convId = activeThreadId;
    if (user?.uid && (convId.startsWith('checkin-') || convId === 'default' || convId.startsWith('temp-'))) {
      try {
        const title = trimmed ? (trimmed.length > 30 ? trimmed.substring(0, 30) + '...' : trimmed) : 'Voice Reflection';
        convId = await createAIConversation(user.uid, title);
        setActiveThreadId(convId);
      } catch (e) {
        console.warn('[AI Screen] Could not create thread for voice:', e);
      }
    }

    const time = getFormattedTime();
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: trimmed,
      attachment: attachment || undefined,
      timestamp: time,
    };

    const history = currentThread.messages.slice(-6).map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: m.text }],
    }));

    try {
      const controller = new AbortController();
      activeAbortControllerRef.current = controller;
      const response = await sendAIMessage({
        conversationId: convId,
        userId: user?.uid || 'anonymous',
        userText: trimmed,
        attachment: attachment || undefined,
        userProfile,
        history,
        languageCode: selectedLanguage.code,
        abortSignal: controller.signal,
      });

      setVoiceResponseText(response.text);

      setThreads((prevThreads) => {
        const exists = prevThreads.some((t) => t.id === convId);
        if (exists) {
          return prevThreads.map((t) => {
            if (t.id === convId) {
              return {
                ...t,
                lastUpdated: 'Just now',
                messages: [...t.messages, userMsg, response],
              };
            }
            return t;
          });
        }
        return [
          {
            id: convId,
            title: trimmed ? (trimmed.length > 30 ? trimmed.substring(0, 30) + '...' : trimmed) : 'Voice Reflection',
            lastUpdated: 'Just now',
            messages: [userMsg, response],
          },
          ...prevThreads,
        ];
      });

      if (isVoiceMode && voicePreference.enabled) {
        await speechService.speak(
          response.text,
          {
            language: selectedLanguage.locale,
            voiceIdentifier: voicePreference.voiceIdentifier,
            rate: voicePreference.rate,
            pitch: voicePreference.pitch,
            enabled: voicePreference.enabled,
            onStart: () => {
              setMascotState('SPEAKING');
            },
            onDone: () => {
              setMascotState('HAPPY');
              setTimeout(() => setMascotState('IDLE'), 2200);
            },
            onError: (err) => {
              console.warn('[AI Screen] Speech playback note:', err);
              setMascotState('HAPPY');
              setTimeout(() => setMascotState('IDLE'), 1800);
              setSpeechError('Audio tap required by browser. Tap replay.');
            },
          }
        );
      } else {
        setMascotState('HAPPY');
        setTimeout(() => setMascotState('IDLE'), 2200);
      }
    } catch {
      setVoiceResponseText("I'm right here with you. Take a gentle breath and let's take this one step at a time.");
      setMascotState('COMFORTING');
      setTimeout(() => setMascotState('IDLE'), 3200);
    }
  };

  // -------------------------------------------------------------
  // CHAT MODE PIPELINE: Pure text chat stream (quiet, no audio voice)
  // -------------------------------------------------------------
  const processChatMessage = async (text: string, customAttachment?: ChatAttachment | null) => {
    const trimmed = text.trim();
    const attachment = customAttachment !== undefined ? customAttachment : selectedAttachment;
    if (!trimmed && !attachment) return;

    const time = getFormattedTime();
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: trimmed,
      attachment: attachment || undefined,
      timestamp: time,
    };

    let targetConvId = activeThreadId;
    let isNewConv = false;
    let newTitle = '';

    if (user?.uid && (targetConvId.startsWith('checkin-') || targetConvId === 'default' || targetConvId.startsWith('temp-'))) {
      try {
        newTitle = trimmed ? (trimmed.length > 30 ? trimmed.substring(0, 30) + '...' : trimmed) : 'Mindful Reflection';
        targetConvId = await createAIConversation(user.uid, newTitle);
        isNewConv = true;
        setActiveThreadId(targetConvId);
      } catch (e) {
        console.warn('[AI Screen] Could not create Firestore conversation:', e);
      }
    }

    // Append user message immediately (optimistic UI)
    setThreads((prevThreads) => {
      const exists = prevThreads.some((t) => t.id === targetConvId || (isNewConv && t.id === activeThreadId));
      if (exists) {
        return prevThreads.map((t) => {
          if (t.id === targetConvId || (isNewConv && t.id === activeThreadId)) {
            return {
              ...t,
              id: targetConvId,
              title: isNewConv ? newTitle : t.title,
              lastUpdated: 'Just now',
              messages: [...t.messages, userMsg],
            };
          }
          return t;
        });
      }
      return [
        {
          id: targetConvId,
          title: newTitle || 'Mindful Reflection',
          lastUpdated: 'Just now',
          messages: [userMsg],
        },
        ...prevThreads,
      ];
    });

    setSelectedAttachment(null);
    setInputText('');
    setIsChatTyping(true);

    const history = currentThread.messages.slice(-6).map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: m.text }],
    }));

    try {
      const aiResponse = await sendAIMessage({
        conversationId: targetConvId,
        userId: user?.uid || 'anonymous',
        userText: trimmed,
        attachment: attachment || undefined,
        userProfile,
        history,
      });

      setThreads((prevThreads) =>
        prevThreads.map((t) => {
          if (t.id === targetConvId) {
            return {
              ...t,
              lastUpdated: 'Just now',
              messages: [...t.messages.filter((m) => m.id !== aiResponse.id), aiResponse],
            };
          }
          return t;
        })
      );
    } catch {
      const fallbackMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: "I'm right here with you. Take a slow, gentle breath and let's take this one step at a time.",
        timestamp: time,
        emotion: 'COMFORTING',
      };
      setThreads((prevThreads) =>
        prevThreads.map((t) => {
          if (t.id === targetConvId) {
            return {
              ...t,
              messages: [...t.messages, fallbackMsg],
            };
          }
          return t;
        })
      );
    } finally {
      setIsChatTyping(false);
    }
  };

  // Dispatch message based on active mode
  const handleSendMessage = (text: string) => {
    if (companionMode === 'VOICE') {
      processVoiceMessage(text);
    } else {
      processChatMessage(text);
    }
  };


  // Stop ongoing AI Generation
  const handleStopGeneration = () => {
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    setIsChatTyping(false);
    setMascotState('IDLE');
  };

  // Copy AI response text to clipboard
  const handleCopyMessage = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopyToastText('Copied response to clipboard');
      setTimeout(() => setCopyToastText(null), 2200);
    } catch {}
  };

  // Retry failed AI response
  const handleRetryMessage = async (failedMsg: ChatMessage) => {
    if (isChatTyping) return;
    const lastUserMsg = [...currentThread.messages].reverse().find((m) => m.sender === 'user');
    if (!lastUserMsg) return;

    setIsChatTyping(true);
    setMascotState('THINKING');
    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    try {
      const history = currentThread.messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.text }],
      }));

      const response = await sendAIMessage({
        conversationId: activeThreadId,
        userId: user?.uid || 'anonymous',
        userText: lastUserMsg.text,
        userProfile,
        history,
        languageCode: selectedLanguage.code,
        abortSignal: controller.signal,
        skipUserSave: true,
      });

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? {
                ...t,
                messages: t.messages.map((m) => (m.id === failedMsg.id ? response : m)),
              }
            : t
        )
      );
    } catch {
      // Handled inside sendAIMessage
    } finally {
      setIsChatTyping(false);
      setMascotState('IDLE');
    }
  };

  // Regenerate last AI response
  const handleRegenerateLastResponse = async () => {
    if (isChatTyping) return;
    const lastUserMsg = [...currentThread.messages].reverse().find((m) => m.sender === 'user');
    if (!lastUserMsg) return;

    setIsChatTyping(true);
    setMascotState('THINKING');
    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    try {
      const history = currentThread.messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.text }],
      }));

      const response = await regenerateAIMessage({
        conversationId: activeThreadId,
        userId: user?.uid || 'anonymous',
        userText: lastUserMsg.text,
        userProfile,
        history,
        languageCode: selectedLanguage.code,
        abortSignal: controller.signal,
      });

      setThreads((prev) =>
        prev.map((t) => (t.id === activeThreadId ? { ...t, messages: [...t.messages, response] } : t))
      );
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('[AI Screen] Regenerate error:', err);
      }
    } finally {
      setIsChatTyping(false);
      setMascotState('IDLE');
      activeAbortControllerRef.current = null;
    }
  };

  // Open Rename modal
  const handleOpenRename = (thread: ConversationThread) => {
    setRenameTargetThread(thread);
    setRenameInputText(thread.title);
    setIsRenameModalOpen(true);
  };

  // Save conversation title
  const handleSaveRename = async () => {
    if (!renameTargetThread || !renameInputText.trim()) return;
    const newTitle = renameInputText.trim();
    try {
      await renameAIConversation(renameTargetThread.id, newTitle);
      setThreads((prev) =>
        prev.map((t) => (t.id === renameTargetThread.id ? { ...t, title: newTitle } : t))
      );
    } catch (e) {
      console.warn('[AI Screen] Could not rename conversation:', e);
    } finally {
      setIsRenameModalOpen(false);
      setRenameTargetThread(null);
    }
  };

  // Delete conversation thread
  const handleDeleteThread = (thread: ConversationThread) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${thread.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAIConversation(thread.id);
              setThreads((prev) => {
                const remaining = prev.filter((t) => t.id !== thread.id);
                if (activeThreadId === thread.id && remaining.length > 0) {
                  setActiveThreadId(remaining[0].id);
                }
                return remaining;
              });
            } catch (e) {
              console.warn('[AI Screen] Could not delete conversation:', e);
            }
          },
        },
      ]
    );
  };

  // Save selected language to Firestore
  const handleSelectLanguage = async (lang: SupportedLanguage) => {
    const newPref: LanguagePreference = {
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      locale: lang.locale,
    };
    setSelectedLanguage(newPref);
    setIsLanguageModalOpen(false);

    try {
      const voices = await speechService.getVoicesForLanguage(lang.code);
      setAvailableVoices(voices);
      if (user?.uid) {
        await updateUserPreferences(user.uid, { languagePreference: newPref });
      }
    } catch (err) {
      console.warn('[AI Screen] Preference update error:', err);
    }
  };

  // Save voice settings to Firestore
  const handleUpdateVoicePreference = async (updated: Partial<VoicePreference>) => {
    const merged: VoicePreference = { ...voicePreference, ...updated };
    setVoicePreference(merged);
    if (user?.uid) {
      await updateUserPreferences(user.uid, { voicePreference: merged }).catch(() => {});
    }
  };

  // Toggle Microphone
  const handleToggleListening = () => {
    speechService.unlockAudio();

    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      setMascotState('IDLE');
      return;
    }

    speechService.stopSpeaking();
    setIsListening(true);
    setMascotState('LISTENING');

    const started = speechService.startListening({
      onStart: () => {
        setIsListening(true);
        setMascotState('LISTENING');
      },
      onResult: (transcript: string) => {
        setIsListening(false);
        if (transcript.trim()) {
          handleSendMessage(transcript);
        } else {
          setMascotState('IDLE');
        }
      },
      onError: (errorMsg: string) => {
        setIsListening(false);
        if (errorMsg === 'MOBILE_EXPO_GO_VOICE') {
          setMobileVoiceModalVisible(true);
          setMascotState('LISTENING');
        } else {
          setMascotState('IDLE');
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!started && Platform.OS !== 'web') {
      setIsListening(false);
      setMobileVoiceModalVisible(true);
      setMascotState('LISTENING');
    }
  };

  // Replay speech audio (Voice Mode)
  const handleReplaySpeech = async () => {
    if (!voiceResponseText) return;
    speechService.unlockAudio();
    setSpeechError(null);

    await speechService.speak(
      voiceResponseText,
      () => setMascotState('SPEAKING'),
      () => {
        setMascotState('HAPPY');
        setTimeout(() => setMascotState('IDLE'), 2000);
      },
      () => {
        setMascotState('IDLE');
        setSpeechError('Could not play audio. Tap again.');
      }
    );
  };

  // Stop speech playback
  const handleStopSpeech = async () => {
    await speechService.stopSpeaking();
    setMascotState('IDLE');
  };

  // Start a fresh chat
  const handleNewChat = async () => {
    speechService.stopSpeaking();
    let newId = 'chat-' + Date.now();
    if (user?.uid) {
      try {
        newId = await createAIConversation(user.uid, 'New Conversation');
      } catch (err) {
        console.warn('[AI Screen] Could not create new conversation in Firestore:', err);
      }
    }
    const newThread: ConversationThread = {
      id: newId,
      title: 'New Conversation',
      lastUpdated: 'Just now',
      messages: [
        {
          id: 'welcome-' + Date.now(),
          sender: 'ai',
          text: "Hello! I'm Bloom. I'm here to listen, help you reflect, or plan your study flow at your own pace.",
          timestamp: getFormattedTime(),
          quickReplies: ['Help me focus', "I'm feeling stressed", "Let's talk"],
        },
      ],
    };

    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setCompanionMode('CHAT');
    setSidebarOpen(false);
  };

  // Select a thread from drawer
  const handleSelectThread = async (thread: ConversationThread) => {
    speechService.stopSpeaking();
    setActiveThreadId(thread.id);
    setCompanionMode('CHAT');
    setSidebarOpen(false);

    if (
      thread.messages.length === 0 &&
      user?.uid &&
      !thread.id.startsWith('checkin-') &&
      !thread.id.startsWith('temp-')
    ) {
      try {
        const msgs = await getAIMessages(thread.id);
        if (msgs && msgs.length > 0) {
          const mappedMsgs: ChatMessage[] = msgs.map((m) => {
            let time = 'Earlier';
            if (m.createdAt) {
              const date = (m.createdAt as any).toDate
                ? (m.createdAt as any).toDate()
                : (m.createdAt as any).toMillis
                ? new Date((m.createdAt as any).toMillis())
                : new Date(m.createdAt);
              time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return {
              id: m.id,
              sender: m.sender,
              text: m.text,
              timestamp: time,
              emotion: (m.emotion as MascotState) || 'HAPPY',
            };
          });
          setThreads((prev) =>
            prev.map((t) => (t.id === thread.id ? { ...t, messages: mappedMsgs } : t))
          );
        }
      } catch (err) {
        console.warn('[AI Screen] Error fetching thread messages:', err);
      }
    }
  };

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);

  // Mascot display size for Voice Bot mode
  const mascotDisplaySize = Math.min(
    290,
    Math.max(220, Math.min(SCREEN_WIDTH * 0.65, SCREEN_HEIGHT * 0.36))
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header Bar */}
        <View style={[styles.topBar, { paddingTop: topInset }]}>
          <View style={styles.topBarContent}>
            {/* Left: Menu */}
            <TouchableOpacity
              style={[styles.topButton, Shadows.sm]}
              onPress={() => {
                speechService.unlockAudio();
                setSidebarOpen(true);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Open sidebar menu"
            >
              <Menu size={20} color={Colors.darkText} strokeWidth={2} />
            </TouchableOpacity>

            {/* Center: Mode Segmented Switcher (Voice Bot vs Text Chat) */}
            <View style={[styles.modeSegment, Shadows.sm]}>
              <TouchableOpacity
                style={[
                  styles.modeSegmentTab,
                  companionMode === 'VOICE' && styles.modeSegmentTabActive,
                ]}
                onPress={() => {
                  setCompanionMode('VOICE');
                }}
                activeOpacity={0.7}
              >
                <Radio
                  size={14}
                  color={companionMode === 'VOICE' ? Colors.primaryDark : Colors.mutedText}
                  strokeWidth={2.4}
                />
                <Text
                  style={[
                    styles.modeSegmentText,
                    companionMode === 'VOICE' && styles.modeSegmentTextActive,
                  ]}
                >
                  Voice Bot
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeSegmentTab,
                  companionMode === 'CHAT' && styles.modeSegmentTabActive,
                ]}
                onPress={() => {
                  speechService.stopSpeaking();
                  setCompanionMode('CHAT');
                }}
                activeOpacity={0.7}
              >
                <MessageSquare
                  size={14}
                  color={companionMode === 'CHAT' ? Colors.primaryDark : Colors.mutedText}
                  strokeWidth={2.2}
                />
                <Text
                  style={[
                    styles.modeSegmentText,
                    companionMode === 'CHAT' && styles.modeSegmentTextActive,
                  ]}
                >
                  Chat
                </Text>
              </TouchableOpacity>
            </View>

            {/* Right: Audio Toggle/New Chat + Dedicated Language & Voice Settings */}
            <View style={styles.topRightControls}>
              <TouchableOpacity
                style={[styles.topButton, Shadows.sm]}
                onPress={() => {
                  setPrefTab('LANGUAGE');
                  setIsLanguageModalOpen(true);
                }}
                activeOpacity={0.7}
                accessibilityLabel="Language and Voice Settings"
              >
                <Globe size={18} color={Colors.primaryDark} strokeWidth={2.2} />
              </TouchableOpacity>

              {companionMode === 'VOICE' ? (
                <TouchableOpacity
                  style={[
                    styles.topButton,
                    Shadows.sm,
                    isVoiceMode && styles.topButtonActive,
                    mascotState === 'SPEAKING' && styles.topButtonSpeaking,
                  ]}
                  onPress={() => {
                    speechService.unlockAudio();
                    if (mascotState === 'SPEAKING') {
                      handleStopSpeech();
                    } else {
                      const next = !isVoiceMode;
                      setIsVoiceMode(next);
                      if (!next) speechService.stopSpeaking();
                    }
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel={
                    mascotState === 'SPEAKING'
                      ? 'Stop speaking'
                      : isVoiceMode
                      ? 'Mute speech'
                      : 'Enable speech'
                  }
                >
                  {mascotState === 'SPEAKING' ? (
                    <Square size={13} color={Colors.error} fill={Colors.error} />
                  ) : isVoiceMode ? (
                    <Volume2 size={18} color={Colors.primaryDark} strokeWidth={2.2} />
                  ) : (
                    <VolumeX size={18} color={Colors.lightText} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.topButton, Shadows.sm]}
                  onPress={handleNewChat}
                  activeOpacity={0.7}
                  accessibilityLabel="New chat"
                >
                  <Plus size={18} color={Colors.primaryDark} strokeWidth={2.2} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* VIEW 1: AI COMPANION (VOICE BOT - Only the bot speaking)  */}
        {/* ========================================================= */}
        {companionMode === 'VOICE' ? (
          <View style={styles.voiceStage}>
            <View style={styles.mascotWrapper}>
              <AnimatedMascot
                state={mascotState}
                size={mascotDisplaySize}
                onTap={() => {
                  speechService.unlockAudio();
                  setMascotState('HAPPY');
                  setTimeout(() => setMascotState('IDLE'), 2400);
                }}
              />
            </View>

            {/* Clearly Identifiable Voice Bot Language & Voice Shortcut */}
            <TouchableOpacity
              style={styles.voiceModeLangShortcut}
              onPress={() => {
                setPrefTab('VOICE');
                setIsLanguageModalOpen(true);
              }}
              activeOpacity={0.8}
              accessibilityLabel="Change voice or language"
            >
              <Globe size={13} color={Colors.primaryDark} strokeWidth={2.2} />
              <Text style={styles.voiceModeLangShortcutText}>
                {selectedLanguage.nativeName} ({selectedLanguage.name}) • Voice Settings
              </Text>
              <Settings size={12} color={Colors.mutedText} />
            </TouchableOpacity>

            {/* Floating Speech Transcript Card (Active only when bot speaks) */}
            {voiceResponseText && (
              <View style={[styles.voiceResponseCard, Shadows.md]}>
                <View style={styles.voiceResponseHeader}>
                  <View style={styles.responseSpeakerTag}>
                    <Sparkles size={12} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.responseSpeakerText}>Bloom Speaking</Text>
                  </View>

                  <View style={styles.voiceAudioActions}>
                    {mascotState === 'SPEAKING' ? (
                      <TouchableOpacity
                        style={styles.voiceActionBtn}
                        onPress={handleStopSpeech}
                        activeOpacity={0.7}
                      >
                        <Square size={11} color={Colors.error} fill={Colors.error} />
                        <Text style={styles.voiceActionBtnText}>Pause</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.voiceActionBtn}
                        onPress={handleReplaySpeech}
                        activeOpacity={0.7}
                      >
                        <Play size={11} color={Colors.primary} fill={Colors.primary} />
                        <Text style={styles.voiceActionBtnText}>Replay</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.voiceDismissBtn}
                      onPress={() => setVoiceResponseText(null)}
                      activeOpacity={0.7}
                    >
                      <X size={13} color={Colors.mutedText} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  style={styles.voiceScroll}
                  contentContainerStyle={styles.voiceScrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  {voiceQuery && (
                    <Text style={styles.voiceQueryPreview}>
                      You: "{voiceQuery}"
                    </Text>
                  )}
                  <Text style={styles.voiceBodyText}>{voiceResponseText}</Text>
                </ScrollView>

                {speechError && (
                  <View style={styles.speechErrorRow}>
                    <AlertCircle size={12} color={Colors.error} />
                    <Text style={styles.speechErrorText}>{speechError}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          /* ========================================================= */
          /* VIEW 2: CHAT OPTION (TEXT CHAT - Only chat conversation)   */
          /* ========================================================= */
          <View style={styles.chatStage}>
            {/* Thread Header Banner */}
            <View style={styles.threadBanner}>
              <Text style={styles.threadBannerTitle} numberOfLines={1}>
                {currentThread.title}
              </Text>
              <Text style={styles.threadBannerSub}>{currentThread.lastUpdated}</Text>
            </View>

            {/* Scrollable Chat Stream */}
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {currentThread.messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.msgRow,
                      isUser ? styles.msgRowUser : styles.msgRowAI,
                    ]}
                  >
                    {/* Bloom Mini Avatar for AI messages */}
                    {!isUser && (
                      <View style={styles.msgAvatarWrapper}>
                        <Image
                          source={require('../../assets/images/bloom-mascot-hd.png')}
                          style={styles.msgAvatar}
                          resizeMode="contain"
                        />
                      </View>
                    )}

                    <View style={styles.msgBubbleWrapper}>
                      <View
                        style={[
                          styles.msgBubble,
                          isUser ? styles.msgBubbleUser : styles.msgBubbleAI,
                          !isUser && Shadows.sm,
                        ]}
                      >
                        {/* Attached Image or File (like ChatGPT) */}
                        {msg.attachment && (
                          <View style={styles.msgAttachmentContainer}>
                            {msg.attachment.type === 'image' ? (
                              <Image
                                source={{ uri: msg.attachment.uri }}
                                style={styles.attachedImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                style={[
                                  styles.attachedFileRow,
                                  isUser ? styles.attachedFileRowUser : styles.attachedFileRowAI,
                                ]}
                              >
                                <FileText
                                  size={22}
                                  color={isUser ? Colors.white : Colors.primaryDark}
                                />
                                <View style={styles.attachedFileInfo}>
                                  <Text
                                    style={[
                                      styles.attachedFileName,
                                      isUser && { color: Colors.white },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {msg.attachment.name}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.attachedFileSize,
                                      isUser && { color: 'rgba(255, 255, 255, 0.75)' },
                                    ]}
                                  >
                                    {msg.attachment.size}
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                        )}

                        {msg.text ? (
                          <Text
                            style={[
                              styles.msgText,
                              isUser ? styles.msgTextUser : styles.msgTextAI,
                            ]}
                          >
                            {msg.text}
                          </Text>
                        ) : null}

                        {/* Step breakdown cards if included in response */}
                        {msg.steps && msg.steps.length > 0 && (
                          <View style={styles.stepsList}>
                            {msg.steps.map((s) => (
                              <View key={s.stepNumber} style={styles.stepItem}>
                                <View style={styles.stepBadge}>
                                  <Text style={styles.stepBadgeNum}>{s.stepNumber}</Text>
                                </View>
                                <View style={styles.stepTextContainer}>
                                  <Text style={styles.stepTitle}>{s.title}</Text>
                                  <Text style={styles.stepDetail}>{s.detail}</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Study Sprint Widget if triggered */}
                        {msg.showSprintWidget && (
                          <View style={styles.sprintWidgetCard}>
                            <View style={styles.sprintWidgetHeader}>
                              <View style={styles.sprintWidgetIconBadge}>
                                <Sparkles size={16} color={Colors.primaryDark} />
                              </View>
                              <View style={styles.sprintWidgetInfo}>
                                <Text style={styles.sprintWidgetTitle}>{msg.sprintTopic || 'Focus Sprint'}</Text>
                                <Text style={styles.sprintWidgetSub}>{msg.sprintMinutes || 20} min gentle focus</Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              style={styles.sprintWidgetBtn}
                              onPress={() => router.push('/focus-mode')}
                              activeOpacity={0.8}
                            >
                              <Play size={13} color={Colors.white} fill={Colors.white} />
                              <Text style={styles.sprintWidgetBtnText}>Begin Sprint</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>

                      {/* Timestamp */}
                      <View style={styles.msgFooterRow}>
                        <Text
                          style={[
                            styles.msgTimestamp,
                            isUser ? styles.msgTimestampUser : styles.msgTimestampAI,
                          ]}
                        >
                          {msg.timestamp}
                        </Text>
                        {!isUser && (
                          <View style={styles.msgActionButtons}>
                            {msg.source === 'offline_fallback' && (
                              <View style={styles.offlineNoticeBadge}>
                                <Text style={styles.offlineNoticeBadgeText}>Offline Reflection</Text>
                              </View>
                            )}
                            <TouchableOpacity
                              style={styles.msgActionIconBtn}
                              onPress={() => handleCopyMessage(msg.text)}
                              activeOpacity={0.7}
                              accessibilityLabel="Copy response"
                            >
                              <Copy size={13} color={Colors.mutedText} strokeWidth={2} />
                            </TouchableOpacity>

                            {currentThread.messages[currentThread.messages.length - 1]?.id === msg.id && (
                              <TouchableOpacity
                                style={styles.msgActionIconBtn}
                                onPress={handleRegenerateLastResponse}
                                activeOpacity={0.7}
                                accessibilityLabel="Regenerate response"
                              >
                                <RotateCcw size={13} color={Colors.mutedText} strokeWidth={2} />
                              </TouchableOpacity>
                            )}

                            {(msg.isFailed || msg.canRetry) && (
                              <TouchableOpacity
                                style={[styles.msgActionIconBtn, { backgroundColor: '#FBEBEB', borderColor: '#F2B8B8', paddingHorizontal: 6 }]}
                                onPress={() => handleRetryMessage(msg)}
                                activeOpacity={0.7}
                                accessibilityLabel="Retry with Gemini"
                              >
                                <RotateCcw size={12} color="#C45A5A" strokeWidth={2.2} />
                                <Text style={styles.retryBtnText}>Retry</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>

                      {/* Quick Reply Suggestions */}
                      {msg.quickReplies && msg.quickReplies.length > 0 && (
                        <View style={styles.quickRepliesRow}>
                          {msg.quickReplies.map((reply, i) => (
                            <TouchableOpacity
                              key={i}
                              style={styles.quickReplyChip}
                              onPress={() => processChatMessage(reply)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>{reply}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Chat Thinking Indicator with Stop Button */}
              {isChatTyping && (
                <View style={[styles.msgRow, styles.msgRowAI]}>
                  <View style={styles.msgAvatarWrapper}>
                    <Image
                      source={require('../../assets/images/bloom-mascot-hd.png')}
                      style={styles.msgAvatar}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={[styles.msgBubble, styles.msgBubbleAI, styles.typingBubble, Shadows.sm]}>
                    <Text style={styles.typingText}>Bloom is reflecting...</Text>
                    <TouchableOpacity
                      style={styles.stopReflectingBtn}
                      onPress={() => activeAbortControllerRef.current?.abort()}
                      activeOpacity={0.7}
                    >
                      <Square size={10} color="#BA4A4A" fill="#BA4A4A" />
                      <Text style={styles.stopReflectingText}>Stop</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Bottom Message Composer */}
        <View
          style={[
            styles.composerBar,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          {/* Pending Attachment Chip Preview (ChatGPT Style) */}
          {selectedAttachment && (
            <View style={[styles.pendingAttachmentCard, Shadows.sm]}>
              <View style={styles.pendingAttachmentLeft}>
                {selectedAttachment.type === 'image' ? (
                  <Image
                    source={{ uri: selectedAttachment.uri }}
                    style={styles.pendingAttachmentThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.pendingAttachmentFileIcon}>
                    <FileText size={18} color={Colors.primaryDark} />
                  </View>
                )}
                <View style={styles.pendingAttachmentMeta}>
                  <Text style={styles.pendingAttachmentName} numberOfLines={1}>
                    {selectedAttachment.name}
                  </Text>
                  <Text style={styles.pendingAttachmentSize}>
                    {selectedAttachment.type === 'image' ? 'Image' : 'File'} • {selectedAttachment.size}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.pendingAttachmentCloseBtn}
                onPress={() => setSelectedAttachment(null)}
                activeOpacity={0.7}
                accessibilityLabel="Remove attachment"
              >
                <X size={14} color={Colors.mutedText} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.composerInner}>
            {/* Microphone Button (Voice check-in) */}
            <TouchableOpacity
              style={[
                styles.micBtn,
                Shadows.sm,
                isListening && styles.micBtnActive,
              ]}
              onPress={handleToggleListening}
              activeOpacity={0.85}
              accessibilityLabel={isListening ? 'Stop recording' : 'Voice check-in'}
            >
              {isListening ? (
                <MicOff size={20} color={Colors.white} strokeWidth={2.4} />
              ) : (
                <Mic size={20} color={Colors.white} strokeWidth={2.4} />
              )}
            </TouchableOpacity>

            {/* Text Input Housing */}
            <View style={[styles.inputHousing, Shadows.sm]}>
              {/* Attachment Button (Files/Images - like ChatGPT) */}
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={handlePickAttachment}
                activeOpacity={0.7}
                accessibilityLabel="Attach file or image"
              >
                <Paperclip size={18} color={Colors.mutedText} strokeWidth={2} />
              </TouchableOpacity>

              <TextInput
                style={styles.textInput}
                placeholder={
                  companionMode === 'VOICE'
                    ? 'Talk or whisper to Bloom...'
                    : 'Type a message to Bloom...'
                }
                placeholderTextColor={Colors.lightText}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSendMessage(inputText)}
                returnKeyType="send"
                enablesReturnKeyAutomatically={true}
              />

              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (inputText.trim().length > 0 || selectedAttachment !== null) && styles.sendBtnActive,
                ]}
                onPress={() => handleSendMessage(inputText)}
                disabled={inputText.trim().length === 0 && selectedAttachment === null}
                activeOpacity={0.8}
                accessibilityLabel="Send message"
              >
                <Send
                  size={15}
                  color={
                    inputText.trim().length > 0 || selectedAttachment !== null
                      ? Colors.white
                      : Colors.lightText
                  }
                  strokeWidth={2.4}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Sidebar Drawer - Topmost Layer */}
      <SidebarDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectVoiceMode={() => {
          setCompanionMode('VOICE');
        }}
        onSelectChatMode={() => {
          setCompanionMode('CHAT');
        }}
        onNewChat={handleNewChat}
        onSelectThread={handleSelectThread}
        onRenameThread={handleOpenRename}
        onDeleteThread={handleDeleteThread}
        onOpenPreferences={() => setIsLanguageModalOpen(true)}
        activeMode={companionMode}
        activeThreadId={activeThreadId}
        threads={threads}
        userProfile={userProfile}
      />

      {/* Attachment Option Sheet Modal (ChatGPT-like options) */}
      <Modal
        visible={attachModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAttachModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleGroup}>
                <Paperclip size={18} color={Colors.primary} strokeWidth={2.2} />
                <Text style={styles.modalTitle}>Attach to Bloom</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAttachModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Share study notes, diagrams, or documents with your mindful companion:
            </Text>

            <View style={styles.attachOptionList}>
              <TouchableOpacity
                style={styles.attachOptionCard}
                onPress={() => handleSelectSampleAttachment('image')}
                activeOpacity={0.7}
              >
                <View style={styles.attachOptionIcon}>
                  <ImageIcon size={20} color={Colors.primary} />
                </View>
                <View style={styles.attachOptionMeta}>
                  <Text style={styles.attachOptionTitle}>Study Diagram / Photo</Text>
                  <Text style={styles.attachOptionSub}>Attach an image or diagram</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachOptionCard}
                onPress={() => handleSelectSampleAttachment('file')}
                activeOpacity={0.7}
              >
                <View style={styles.attachOptionIcon}>
                  <FileText size={20} color={Colors.primary} />
                </View>
                <View style={styles.attachOptionMeta}>
                  <Text style={styles.attachOptionTitle}>Document / PDF Notes</Text>
                  <Text style={styles.attachOptionSub}>Attach study notes or summaries</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mobile Voice Input Modal Sheet (Expo Go Helper) */}
      <Modal
        visible={mobileVoiceModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setMobileVoiceModalVisible(false);
          setMascotState('IDLE');
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleGroup}>
                <Radio size={18} color={Colors.primary} strokeWidth={2.2} />
                <Text style={styles.modalTitle}>Voice Companion</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setMobileVoiceModalVisible(false);
                  setMascotState('IDLE');
                }}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select a thought to speak with Bloom — response will be spoken aloud:
            </Text>

            {/* Waveform indicator */}
            <View style={styles.waveformContainer}>
              <Animated.View
                style={[
                  styles.waveformBar,
                  { height: 32, transform: [{ scaleY: voiceWaveAnim }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.waveformBar,
                  { height: 50, transform: [{ scaleY: voiceWaveAnim }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.waveformBar,
                  { height: 26, transform: [{ scaleY: voiceWaveAnim }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.waveformBar,
                  { height: 44, transform: [{ scaleY: voiceWaveAnim }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.waveformBar,
                  { height: 30, transform: [{ scaleY: voiceWaveAnim }] },
                ]}
              />
            </View>

            {/* Quick Prompts */}
            <View style={styles.samplePromptsList}>
              {SAMPLE_VOICE_PROMPTS.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.samplePromptCard}
                  onPress={() => {
                    setMobileVoiceModalVisible(false);
                    handleSendMessage(p);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.samplePromptText}>"{p}"</Text>
                  <ArrowRight size={15} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
      {copyToastText && (
        <View style={styles.toastCard}>
          <Check size={14} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.toastText}>{copyToastText}</Text>
        </View>
      )}

      {/* Stop Generation Floating Pill */}
      {isChatTyping && (
        <View style={styles.stopGenerationWrapper}>
          <TouchableOpacity
            style={styles.stopGenerationBtn}
            onPress={handleStopGeneration}
            activeOpacity={0.8}
          >
            <Square size={13} color="#BA4A4A" fill="#BA4A4A" />
            <Text style={styles.stopGenerationText}>Stop generation</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* RENAME CONVERSATION MODAL */}
      <Modal
        visible={isRenameModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRenameModalOpen(false)}
      >
        <View style={styles.prefModalBackdrop}>
          <View style={styles.renameModalCard}>
            <Text style={styles.renameTitle}>Rename Conversation</Text>
            <TextInput
              style={styles.renameInput}
              value={renameInputText}
              onChangeText={setRenameInputText}
              placeholder="Enter new conversation title"
              autoFocus
            />
            <View style={styles.renameActions}>
              <TouchableOpacity
                style={styles.renameCancelBtn}
                onPress={() => setIsRenameModalOpen(false)}
              >
                <Text style={styles.renameCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.renameSaveBtn}
                onPress={handleSaveRename}
              >
                <Text style={styles.renameSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* UNIFIED LANGUAGE & VOICE PREFERENCES MODAL */}
      <Modal
        visible={isLanguageModalOpen || isVoiceModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsLanguageModalOpen(false);
          setIsVoiceModalOpen(false);
        }}
      >
        <View style={styles.prefModalBackdrop}>
          <View style={styles.prefModalSheet}>
            <View style={styles.prefHeader}>
              <View>
                <Text style={styles.prefTitle}>Language & Voice Settings</Text>
                <Text style={styles.prefSub}>
                  Configure multilingual responses, speech pacing, and device voices
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsLanguageModalOpen(false);
                  setIsVoiceModalOpen(false);
                }}
                style={styles.prefCloseBtn}
              >
                <X size={18} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            {/* Segmented Tabs: Language vs Voice */}
            <View style={styles.prefTabsRow}>
              <TouchableOpacity
                style={[styles.prefTabBtn, prefTab === 'LANGUAGE' && styles.prefTabBtnActive]}
                onPress={() => setPrefTab('LANGUAGE')}
                activeOpacity={0.8}
              >
                <Globe size={14} color={prefTab === 'LANGUAGE' ? Colors.primaryDark : Colors.mutedText} />
                <Text style={[styles.prefTabBtnText, prefTab === 'LANGUAGE' && styles.prefTabBtnTextActive]}>
                  Language ({selectedLanguage.nativeName})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.prefTabBtn, prefTab === 'VOICE' && styles.prefTabBtnActive]}
                onPress={() => setPrefTab('VOICE')}
                activeOpacity={0.8}
              >
                <Volume2 size={14} color={prefTab === 'VOICE' ? Colors.primaryDark : Colors.mutedText} />
                <Text style={[styles.prefTabBtnText, prefTab === 'VOICE' && styles.prefTabBtnTextActive]}>
                  Voice & Pacing
                </Text>
              </TouchableOpacity>
            </View>

            {prefTab === 'LANGUAGE' ? (
              <ScrollView style={{ maxHeight: 330, marginTop: 10 }}>
                {SUPPORTED_LANGUAGES_CATALOG.map((lang) => {
                  const isSelected = selectedLanguage.code === lang.code;
                  const suppInfo = supportedLanguages.find((s) => s.code === lang.code);
                  const hasVoice = suppInfo?.isVoiceSupported ?? (lang.code === 'en');

                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.langOptionCard,
                        isSelected && styles.langOptionCardActive,
                      ]}
                      onPress={() => {
                        handleSelectLanguage({
                          code: lang.code,
                          name: lang.name,
                          nativeName: lang.nativeName,
                          locale: lang.defaultLocale,
                          isVoiceSupported: hasVoice,
                          availableVoicesCount: suppInfo?.availableVoicesCount || 0,
                        });
                        setPrefTab('VOICE');
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.langOptionName,
                            isSelected && { color: Colors.primaryDark, fontWeight: '700' },
                          ]}
                        >
                          {lang.nativeName} ({lang.name})
                        </Text>
                        <Text style={styles.langOptionVoiceStatus}>
                          {hasVoice ? '✓ Voice & text companion active' : '• Text companion active (Voice engine optional)'}
                        </Text>
                      </View>
                      {isSelected && (
                        <Check size={18} color={Colors.primary} strokeWidth={2.4} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <ScrollView style={{ maxHeight: 340, marginTop: 10 }}>
                <View style={styles.voiceSectionRow}>
                  <Text style={styles.voiceSectionLabel}>Bot Spoken Responses</Text>
                  <TouchableOpacity
                    style={[
                      styles.togglePill,
                      voicePreference.enabled && styles.togglePillActive,
                    ]}
                    onPress={() => handleUpdateVoicePreference({ enabled: !voicePreference.enabled })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.togglePillText, voicePreference.enabled && { color: '#FFFFFF' }]}>
                      {voicePreference.enabled ? 'Enabled' : 'Muted'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.voiceSectionLabel, { marginTop: 12 }]}>Speaking Pacing & Speed</Text>
                <View style={styles.rateOptionsRow}>
                  {[
                    { label: '0.8x Gentle', rate: 0.8 },
                    { label: '1.0x Normal', rate: 1.0 },
                    { label: '1.2x Brisk', rate: 1.2 },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.label}
                      style={[
                        styles.rateBtn,
                        voicePreference.rate === opt.rate && styles.rateBtnActive,
                      ]}
                      onPress={() => handleUpdateVoicePreference({ rate: opt.rate })}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.rateBtnText,
                          voicePreference.rate === opt.rate && { color: Colors.primaryDark, fontWeight: '700' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.voiceSectionLabel, { marginTop: 12 }]}>
                  Device Voices for {selectedLanguage.name} ({selectedLanguage.nativeName})
                </Text>
                {availableVoices.length === 0 ? (
                  <View style={styles.noVoicesBox}>
                    <Text style={styles.noVoicesText}>
                      No specific device TTS voice package found for {selectedLanguage.name}. Default system voice will be used.
                    </Text>
                    <Text style={styles.noVoicesHelp}>
                      To install native device voices: Go to System Settings &gt; Accessibility / Languages &gt; Text-to-speech output &gt; Install voice data.
                    </Text>
                  </View>
                ) : (
                  availableVoices.map((v) => {
                    const isSelected = voicePreference.voiceIdentifier === v.identifier;
                    return (
                      <TouchableOpacity
                        key={v.identifier}
                        style={[
                          styles.voiceItemCard,
                          isSelected && styles.voiceItemCardActive,
                        ]}
                        onPress={() => handleUpdateVoicePreference({ voiceIdentifier: v.identifier, voiceName: v.name })}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.voiceItemName, isSelected && { color: Colors.primaryDark, fontWeight: '700' }]}>
                          {v.name}
                        </Text>
                        {isSelected && <Check size={16} color={Colors.primary} strokeWidth={2.4} />}
                      </TouchableOpacity>
                    );
                  })
                )}

                <TouchableOpacity
                  style={styles.testVoiceBtn}
                  onPress={() => {
                    const sampleGreetings: Record<string, string> = {
                      kn: 'ನಮಸ್ಕಾರ, ನಾನು ಬ್ಲೂಮ್. ನಿಮ್ಮ ಯೋಗಕ್ಷೇಮ ಸಹಚರ.',
                      hi: 'नमस्ते, मैं ब्लूम हूँ। आपका वेलनेस साथी।',
                      ml: 'നമസ്കാരം, ഞാൻ ബ്ലൂം. നിങ്ങളുടെ വെൽനസ് കൂട്ടുകാരൻ.',
                      ta: 'வணக்கம், நான் ப்ளூம். உங்கள் நல்வாழ்வு தோழன்.',
                      te: 'నమస్కారం, నేను బ్లూమ్. మీ వెల్నెస్ స్నేహితుడిని.',
                      en: 'Hello, I am Bloom. Your mindful student companion.',
                    };
                    speechService.speak(
                      sampleGreetings[selectedLanguage.code] || sampleGreetings.en,
                      {
                        language: selectedLanguage.locale,
                        voiceIdentifier: voicePreference.voiceIdentifier,
                        rate: voicePreference.rate,
                        pitch: voicePreference.pitch,
                        enabled: true,
                      }
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Volume2 size={15} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.testVoiceText}>Listen to Sample Voice ({selectedLanguage.nativeName})</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  voiceModeLangShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2EBE0',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: 'center',
  },
  voiceModeLangShortcutText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#204731',
  },
  prefTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#EAEFEA',
    borderRadius: 8,
    padding: 3,
    marginTop: 10,
    marginBottom: 4,
  },
  prefTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 6,
  },
  prefTabBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  prefTabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#617364',
  },
  prefTabBtnTextActive: {
    color: '#204731',
    fontWeight: '700',
  },
  noVoicesBox: {
    backgroundColor: '#F8FAF8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2EBE0',
    padding: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  noVoicesHelp: {
    fontSize: 10.5,
    color: '#7A8B7B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  offlineNoticeBadge: {
    backgroundColor: '#F0F4F0',
    borderWidth: 1,
    borderColor: '#D4E2D5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  offlineNoticeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#365B45',
  },
  stopReflectingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FBEBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10,
  },
  stopReflectingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BA4A4A',
  },
  retryBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#C45A5A',
    marginLeft: 3,
  },

  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2EBE0',
  },
  langPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  voicePrefBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2EBE0',
  },
  msgFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  msgActionButtons: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 4,
  },
  msgActionIconBtn: {
    padding: 3,
  },
  toastCard: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(32, 71, 49, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stopGenerationWrapper: {
    position: 'absolute',
    bottom: 84,
    alignSelf: 'center',
    zIndex: 999,
  },
  stopGenerationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0DDD5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stopGenerationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BA4A4A',
  },
  prefModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  prefModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  prefHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  prefTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.darkText,
  },
  prefSub: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 2,
  },
  prefCloseBtn: {
    padding: 4,
  },
  langOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2EBE0',
    marginBottom: 8,
  },
  langOptionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F3F7F2',
  },
  langOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkText,
  },
  langOptionVoiceStatus: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 2,
  },
  voiceSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#EBEBEB',
  },
  togglePillActive: {
    backgroundColor: Colors.primary,
  },
  togglePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666666',
  },
  rateOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  rateBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2EBE0',
    alignItems: 'center',
  },
  rateBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F3F7F2',
  },
  rateBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.darkText,
  },
  voiceItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2EBE0',
    marginBottom: 6,
  },
  voiceItemCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F3F7F2',
  },
  voiceItemName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.darkText,
  },
  noVoicesText: {
    fontSize: 12,
    color: Colors.mutedText,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  testVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  testVoiceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  renameModalCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 30,
    borderRadius: 14,
    padding: 20,
    alignSelf: 'center',
    width: '85%',
  },
  renameTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkText,
    marginBottom: 12,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#D4DDD3',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  renameCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  renameCancelText: {
    color: Colors.mutedText,
    fontWeight: '600',
  },
  renameSaveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  renameSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background, // Exact warm botanical cream #FAF8F2
  },
  keyboardContainer: {
    flex: 1,
  },
  topBar: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  topBarContent: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  topButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topButtonActive: {
    backgroundColor: Colors.lightSage,
    borderColor: Colors.primary,
  },
  topButtonSpeaking: {
    backgroundColor: Colors.peach,
    borderColor: Colors.error,
  },
  modeSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 9999,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeSegmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  modeSegmentTabActive: {
    backgroundColor: Colors.lightSage,
  },
  modeSegmentText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  modeSegmentTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // -------------------------
  // Voice Bot Mode Stage
  // -------------------------
  voiceStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  voiceResponseCard: {
    width: '100%',
    maxHeight: 180,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  voiceResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  responseSpeakerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 9999,
  },
  responseSpeakerText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  voiceAudioActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  voiceActionBtnText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  voiceDismissBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.lightSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  voiceScroll: {
    maxHeight: 120,
  },
  voiceScrollContent: {
    paddingVertical: 2,
  },
  voiceQueryPreview: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  voiceBodyText: {
    ...Typography.bodySmall,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.darkText,
  },
  speechErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  speechErrorText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.error,
  },

  // -------------------------
  // Chat Mode Stage
  // -------------------------
  chatStage: {
    flex: 1,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  threadBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: 'rgba(250, 248, 242, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  threadBannerTitle: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    flex: 1,
    marginRight: 8,
  },
  threadBannerSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
  },
  chatScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatScrollContent: {
    paddingTop: 14,
    paddingBottom: 24,
    gap: 12,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowAI: {
    justifyContent: 'flex-start',
    gap: 10,
  },
  msgAvatarWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  msgAvatar: {
    width: 26,
    height: 26,
  },
  msgBubbleWrapper: {
    maxWidth: '82%',
  },
  msgBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  msgBubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  msgBubbleAI: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  msgText: {
    ...Typography.body,
    fontSize: 13.5,
    lineHeight: 20,
  },
  msgTextUser: {
    color: Colors.white,
  },
  msgTextAI: {
    color: Colors.darkText,
  },
  msgTimestamp: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 10,
    color: Colors.mutedText,
    marginTop: 3,
  },
  msgTimestampUser: {
    textAlign: 'right',
    marginRight: 4,
  },
  msgTimestampAI: {
    marginLeft: 4,
  },

  // Attached files & images in chat bubbles
  msgAttachmentContainer: {
    marginBottom: 8,
  },
  attachedImage: {
    width: 200,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#E8ECE9',
  },
  attachedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
  },
  attachedFileRowUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  attachedFileRowAI: {
    backgroundColor: '#F3F6F4',
  },
  attachedFileInfo: {
    flex: 1,
  },
  attachedFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkText,
  },
  attachedFileSize: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 1,
  },

  stepsList: {
    marginTop: 10,
    gap: 6,
    backgroundColor: '#F7FAF8',
    padding: 10,
    borderRadius: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.lightSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeNum: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  stepDetail: {
    fontSize: 11,
    color: Colors.darkText,
    marginTop: 1,
  },
  quickRepliesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  quickReplyChip: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  quickReplyText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  typingBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  typingText: {
    ...Typography.caption,
    fontSize: 11,
    fontStyle: 'italic',
    color: Colors.mutedText,
  },

  // -------------------------
  // Bottom Composer Bar & Attachments
  // -------------------------
  composerBar: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  pendingAttachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 8,
    borderRadius: 14,
    marginBottom: 8,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  pendingAttachmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pendingAttachmentThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E8ECE9',
  },
  pendingAttachmentFileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.lightSage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingAttachmentMeta: {
    flex: 1,
  },
  pendingAttachmentName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkText,
  },
  pendingAttachmentSize: {
    fontSize: 10,
    color: Colors.mutedText,
    marginTop: 1,
  },
  pendingAttachmentCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F6F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  composerInner: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  micBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnActive: {
    backgroundColor: Colors.error,
  },
  inputHousing: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 9999,
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  attachBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  textInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 13,
    color: Colors.darkText,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: Colors.primary,
  },

  // Modal Sheet & Attachment Picker
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubtitle: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.mutedText,
    lineHeight: 18,
    marginBottom: 16,
  },
  attachOptionList: {
    gap: 10,
    marginBottom: 16,
  },
  attachOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: Colors.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  attachOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachOptionMeta: {
    flex: 1,
  },
  attachOptionTitle: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  attachOptionSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 1,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    marginBottom: 16,
  },
  waveformBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  samplePromptsList: {
    gap: 8,
    marginBottom: 12,
  },
  samplePromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cream,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sprintWidgetCard: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#F3F8F4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4E5D8',
  },
  sprintWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sprintWidgetIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sprintWidgetInfo: {
    flex: 1,
  },
  sprintWidgetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkText,
  },
  sprintWidgetSub: {
    fontSize: 11,
    color: Colors.mutedText,
    marginTop: 1,
  },
  sprintWidgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  sprintWidgetBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  samplePromptText: {
    ...Typography.bodySmall,
    color: Colors.darkText,
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
});
