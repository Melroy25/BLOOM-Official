import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer } from 'expo-audio';
import {
  ChevronLeft,
  Leaf,
  Plus,
  Heart,
  Wind,
  Clock,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Smile,
  Check,
  RotateCcw,
  Music,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing, BorderRadius } from '../constants/spacing';
import { Shadows } from '../constants/shadows';
import { FloatingParticles } from '../components/heal-zone/FloatingParticles';

// Audio URL for soothing 432Hz ambient Tibetan singing bowl chime (verified 200 OK)
const AMBIENT_AUDIO_URL =
  'https://raw.githubusercontent.com/remvze/moodist/main/public/sounds/things/singing-bowl.mp3';

// Step definition:
// 1: Initial State ("Create a Bubble")
// 2: Typing State (Input View)
// 3: Bursting Session (Pixel Thoughts 60-Second Meditation)
// 4: Post-Session Feedback Modal
type Step = 1 | 2 | 3 | 4;

interface FeedbackEmotion {
  id: string;
  label: string;
  emoji: string;
  subtitle: string;
}

const FEEDBACK_OPTIONS: FeedbackEmotion[] = [
  { id: 'happy', label: 'Happy', emoji: '😊', subtitle: 'Uplifted' },
  { id: 'calm', label: 'Calm', emoji: '🌿', subtitle: 'Centered' },
  { id: 'relieved', label: 'Relieved', emoji: '🕊️', subtitle: 'Unburdened' },
  { id: 'peaceful', label: 'Peaceful', emoji: '🧘', subtitle: 'At ease' },
];

const QUICK_TAGS = ['Overthinking', 'Stress', 'Gratitude', 'Floating'];

const getDynamicQuotes = (userThought: string) => {
  const clean = userThought.trim() || "today's worries";
  return [
    'Relax and watch your thought...',
    'Take a deep breath in...',
    '...and breathe out',
    `"${clean}" is carrying a lot right now`,
    `"${clean}"... it feels like it says everything`,
    'In the grand expanse of life, this will pass...',
  ];
};

export default function HealBubbleScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 20);

  // Flow State
  const [step, setStep] = useState<Step>(1);

  // User input text
  const [thoughtText, setThoughtText] = useState('');

  // Step 3: Timer & Meditation values
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [mindfulIndex, setMindfulIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const webAudioRef = useRef<any>(null);

  // Official Expo SDK 58 Audio Player Hook
  const player = useAudioPlayer(require('../assets/audio/singing-bowl.mp3'));

  // Step 4: Feedback state
  const [selectedEmotion, setSelectedEmotion] = useState<FeedbackEmotion | null>(
    FEEDBACK_OPTIONS[1] // Default to "Calm"
  );
  const [customNote, setCustomNote] = useState('');
  const [savedSessionsCount, setSavedSessionsCount] = useState(0);

  // Animations
  const breatheAnim = useRef(new Animated.Value(1)).current; // Gentle breathing pulse
  const shrinkAnim = useRef(new Animated.Value(1)).current; // 60s bubble shrink
  const bubbleOpacityAnim = useRef(new Animated.Value(1)).current;
  const rhythmAnim = useRef(new Animated.Value(1)).current; // 4s breathing rhythm bar
  const quoteOpacityAnim = useRef(new Animated.Value(1)).current; // Smooth quote transition

  // Smooth quote fade-in when quote index changes
  useEffect(() => {
    quoteOpacityAnim.setValue(0);
    Animated.timing(quoteOpacityAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.sin),
      useNativeDriver: true,
    }).start();
  }, [mindfulIndex, quoteOpacityAnim]);

  // ==========================================
  // SCREEN 1: GENTLE BREATHING ANIMATION
  // ==========================================
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (step === 1) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, {
            toValue: 1.05,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnim, {
            toValue: 0.96,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    }
    return () => loop?.stop();
  }, [step, breatheAnim]);

  // ==========================================
  // SCREEN 3: 60-SECOND BURSTING & AUDIO
  // ==========================================
  useEffect(() => {
    let timerInterval: ReturnType<typeof setInterval> | null = null;
    let cycleInterval: ReturnType<typeof setInterval> | null = null;
    let rhythmLoop: Animated.CompositeAnimation | null = null;

    if (step === 3) {
      setSecondsRemaining(60);
      setMindfulIndex(0);
      shrinkAnim.setValue(1);
      bubbleOpacityAnim.setValue(1);

      // Start 60-second smooth shrink animation
      Animated.parallel([
        Animated.timing(shrinkAnim, {
          toValue: 0.05,
          duration: 60000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(bubbleOpacityAnim, {
          toValue: 0.1,
          duration: 60000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();

      // Countdown timer every second
      timerInterval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            if (timerInterval) clearInterval(timerInterval);
            if (cycleInterval) clearInterval(cycleInterval);
            setTimeout(() => {
              finishSession();
            }, 50);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Dynamic quotes engine cycling every 3.5 seconds
      const dynamicQuotes = getDynamicQuotes(thoughtText);
      cycleInterval = setInterval(() => {
        setMindfulIndex(prev => (prev + 1) % dynamicQuotes.length);
      }, 3500);

      // 4-second breathing rhythm animation (inhale 4s / exhale 4s)
      rhythmLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(rhythmAnim, {
            toValue: 1.15,
            duration: 4000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rhythmAnim, {
            toValue: 0.95,
            duration: 4000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      rhythmLoop.start();

      // Start Ambient Audio
      startAudio();
    } else {
      pauseAudio();
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      if (cycleInterval) clearInterval(cycleInterval);
      rhythmLoop?.stop();
      pauseAudio();
    };
  }, [step, isMuted]);

  // Audio Handler: Native via expo-audio player + Web HTML5 fallback
  const startAudio = () => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).Audio) {
        if (!webAudioRef.current) {
          const audio = new (window as any).Audio(AMBIENT_AUDIO_URL);
          audio.loop = true;
          audio.volume = isMuted ? 0 : 0.8;
          webAudioRef.current = audio;
          audio.play().catch(() => {});
        } else {
          webAudioRef.current.volume = isMuted ? 0 : 0.8;
          webAudioRef.current.play().catch(() => {});
        }
      }
      player.loop = true;
      player.volume = isMuted ? 0 : 0.85;
      player.play();
    } catch {
      // safe
    }
  };

  const pauseAudio = () => {
    try {
      if (webAudioRef.current) {
        webAudioRef.current.pause();
      }
      player.pause();
    } catch {
      // safe
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      if (webAudioRef.current) {
        webAudioRef.current.volume = nextMuted ? 0 : 0.8;
      }
      player.volume = nextMuted ? 0 : 0.85;
      if (!nextMuted && !player.playing) {
        player.play();
      }
    } catch {
      // safe
    }
  };

  // Complete/skip session early
  const finishSession = () => {
    shrinkAnim.stopAnimation();
    bubbleOpacityAnim.stopAnimation();
    pauseAudio();
    setStep(4);
  };

  // Save feedback and return
  const handleSaveFeedback = () => {
    setSavedSessionsCount(prev => prev + 1);
    // Reset state and return to Screen 1
    setStep(1);
    setThoughtText('');
    setCustomNote('');
  };

  const handleSkipFeedback = () => {
    setStep(1);
    setThoughtText('');
    setCustomNote('');
  };

  // Format timer MM:SS
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ==========================================
  // RENDER SCREEN 1: INITIAL STATE ("Create a Bubble")
  // ==========================================
  if (step === 1) {
    return (
      <View style={[styles.screen, { paddingTop: topPadding }]}>
        <FloatingParticles />
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={24} color={Colors.darkText} strokeWidth={2.4} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Heal Bubble</Text>

          <View style={styles.headerIconBtn}>
            <Leaf size={20} color={Colors.primary} strokeWidth={2.2} />
          </View>
        </View>

        {/* Center: Large glowing circle with concentric gradient ring */}
        <View style={styles.screen1Center}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setStep(2)}
            style={styles.circleTouchable}
          >
            {/* Outer Concentric Gradient Ring */}
            <LinearGradient
              colors={['rgba(232, 241, 232, 0.95)', 'rgba(217, 238, 229, 0.4)', 'rgba(250, 248, 242, 0.1)']}
              style={styles.outerGlowRing}
            >
              {/* Animated Glowing Breathing Bubble */}
              <Animated.View
                style={[
                  styles.innerCircleBubble,
                  Shadows.lg,
                  { transform: [{ scale: breatheAnim }] },
                ]}
              >
                {/* Bubble highlight reflection */}
                <View style={styles.bubbleHighlight} />
                <View style={styles.bubbleHighlightSmall} />

                <View style={styles.circlePlusWrapper}>
                  <Plus size={18} color={Colors.primaryDark} strokeWidth={2.8} />
                </View>

                <Text style={styles.circleBoldTitle}>create a bubble</Text>
                <Text style={styles.circleSubtitle}>
                  Tap to pour your thoughts into the bubble
                </Text>
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Bottom Area: Small green pill badge and subtitle */}
        <View style={[styles.screen1Bottom, { paddingBottom: bottomPadding }]}>
          <View style={styles.deepBreathPill}>
            <Wind size={14} color={Colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.deepBreathText}>Deep breath in...</Text>
          </View>
          <Text style={styles.tranquilSubtitle}>
            A tranquil space with no judgment
          </Text>
        </View>
      </View>
    );
  }

  // ==========================================
  // RENDER SCREEN 2: TYPING STATE (Input View)
  // ==========================================
  if (step === 2) {
    return (
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.screen, { paddingTop: topPadding }]}>
          <FloatingParticles />
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setStep(1)}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ChevronLeft size={24} color={Colors.darkText} strokeWidth={2.4} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Heal Bubble</Text>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                Keyboard.dismiss();
                setStep(3);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Center: Floating White Input Card */}
          <ScrollView
            style={styles.inputScroll}
            contentContainerStyle={styles.inputScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.floatingInputCard, Shadows.md]}>
              <View style={styles.inputCardHeader}>
                <View style={styles.presentMomentPill}>
                  <Text style={styles.presentMomentText}>PRESENT MOMENT</Text>
                </View>
                <View style={styles.heartWrapper}>
                  <Heart size={16} color={Colors.primary} strokeWidth={2.2} />
                </View>
              </View>

              <TextInput
                style={styles.multiLineInput}
                placeholder="Letting go of today's worries..."
                placeholderTextColor={Colors.lightText}
                value={thoughtText}
                onChangeText={setThoughtText}
                multiline
                numberOfLines={6}
                autoFocus
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Quick Tags Bar & Bottom Submit */}
          <View style={[styles.typingBottomArea, { paddingBottom: bottomPadding }]}>
            <Text style={styles.quickTagsLabel}>Quick tags:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickTagsScroll}
            >
              {QUICK_TAGS.map((tag, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickTagChip}
                  onPress={() => {
                    setThoughtText(prev =>
                      prev ? `${prev} • ${tag}` : `Worrying about ${tag.toLowerCase()}`
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickTagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.primaryActionBtn, Shadows.sm]}
              onPress={() => {
                Keyboard.dismiss();
                setStep(3);
              }}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryActionBtnText}>Release when ready</Text>
              <ArrowRight size={18} color={Colors.white} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ==========================================
  // RENDER SCREEN 3: BURSTING SESSION (60-SECOND MEDITATION)
  // ==========================================
  if (step === 3) {
    const activeQuotes = getDynamicQuotes(thoughtText);
    const activeQuote = activeQuotes[mindfulIndex % activeQuotes.length];

    return (
      <View style={[styles.screen, { paddingTop: topPadding }]}>
        <FloatingParticles />
        {/* Header with Countdown Timer */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => {
              pauseAudio();
              setStep(1);
            }}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={Colors.darkText} strokeWidth={2.4} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Heal Bubble</Text>

          {/* Top-Right Timer Pill */}
          <View style={styles.timerPill}>
            <Clock size={13} color={Colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.timerText}>{formatTimer(secondsRemaining)}</Text>
          </View>
        </View>

        {/* Center: Dynamic Quote Above + Shrinking Bubble */}
        <View style={styles.screen3Center}>
          {/* Dynamic Mindfulness Text Cycling Above the Bubble */}
          <Animated.View style={[styles.mindfulTopSection, { opacity: quoteOpacityAnim }]}>
            <Text style={styles.dynamicMindfulQuote}>{activeQuote}</Text>
          </Animated.View>

          {/* Shrinking Bubble */}
          <View style={styles.shrinkArena}>
            <Animated.View
              style={[
                styles.shrinkingBubble,
                Shadows.md,
                {
                  transform: [{ scale: shrinkAnim }],
                  opacity: bubbleOpacityAnim,
                },
              ]}
            >
              <View style={styles.bubbleHighlight} />
              <Text style={styles.shrinkWorryText} numberOfLines={3}>
                "{thoughtText.trim() ? thoughtText : "Letting go of today's worries"}"
              </Text>
              <Text style={styles.shrinkSubtitle}>
                Releasing into the air... exhale slowly
              </Text>
            </Animated.View>
          </View>
        </View>

        {/* Bottom Section: Sound Status & Action Bar */}
        <View style={[styles.screen3Bottom, { paddingBottom: bottomPadding }]}>
          {/* Sound Status Bar */}
          <View style={[styles.soundStatusBar, Shadows.sm]}>
            <View style={styles.soundStatusLeft}>
              <Music size={16} color={Colors.primary} strokeWidth={2.2} />
              <Text style={styles.soundStatusText} numberOfLines={1}>
                Chime sound playing • 432Hz Healing Frequency
              </Text>
            </View>

            <TouchableOpacity
              style={styles.muteBtn}
              onPress={toggleMute}
              activeOpacity={0.7}
            >
              {isMuted ? (
                <VolumeX size={18} color={Colors.mutedText} strokeWidth={2} />
              ) : (
                <Volume2 size={18} color={Colors.primaryDark} strokeWidth={2.2} />
              )}
            </TouchableOpacity>
          </View>

          {/* Hold to finish release button */}
          <TouchableOpacity
            style={[styles.primaryActionBtn, Shadows.sm]}
            onPress={finishSession}
            activeOpacity={0.82}
          >
            <Sparkles size={18} color={Colors.white} strokeWidth={2.2} />
            <Text style={styles.primaryActionBtnText}>Hold to finish release</Text>
          </TouchableOpacity>

          {/* Breathing Rhythm Exhale Indicator */}
          <Animated.View
            style={[
              styles.breathingRhythmRow,
              { transform: [{ scale: rhythmAnim }] },
            ]}
          >
            <Wind size={14} color={Colors.primary} strokeWidth={2.2} />
            <Text style={styles.breathingRhythmText}>
              Breathing rhythm • Exhale (4s)
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ==========================================
  // RENDER SCREEN 4: POST-SESSION FEEDBACK MODAL
  // ==========================================
  return (
    <View style={styles.screen}>
      <FloatingParticles />
      <Modal
        visible={step === 4}
        transparent
        animationType="slide"
        onRequestClose={handleSkipFeedback}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.bottomSheetCard, Shadows.lg, { paddingBottom: bottomPadding }]}>
            {/* Sheet Handle */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalLeafIcon}>
                <Leaf size={20} color={Colors.primaryDark} strokeWidth={2.2} />
              </View>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>How are you feeling now?</Text>
                <Text style={styles.modalSubtitle}>
                  Acknowledge your present state after releasing your thought
                </Text>
              </View>
            </View>

            {/* 2x2 Grid Options */}
            <View style={styles.emotionsGrid}>
              {FEEDBACK_OPTIONS.map(item => {
                const isSelected = selectedEmotion?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.emotionCard,
                      isSelected && styles.emotionCardSelected,
                    ]}
                    onPress={() => setSelectedEmotion(item)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.emotionCardTop}>
                      <Text style={styles.emotionEmoji}>{item.emoji}</Text>
                      {isSelected && (
                        <View style={styles.selectedCheckBadge}>
                          <Check size={12} color={Colors.white} strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.emotionLabel,
                        isSelected && styles.emotionLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.emotionSubtitle}>({item.subtitle})</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Note Bar */}
            <View style={styles.customNoteBar}>
              <Smile size={16} color={Colors.mutedText} strokeWidth={2} />
              <TextInput
                style={styles.customNoteInput}
                placeholder="Other emotion or note..."
                placeholderTextColor={Colors.lightText}
                value={customNote}
                onChangeText={setCustomNote}
              />
              <TouchableOpacity
                style={styles.writeBtn}
                onPress={() => Keyboard.dismiss()}
                activeOpacity={0.75}
              >
                <Text style={styles.writeBtnText}>Write</Text>
              </TouchableOpacity>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[styles.primaryActionBtn, Shadows.sm, { marginTop: Spacing.md }]}
              onPress={handleSaveFeedback}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryActionBtnText}>Complete Session</Text>
              <ArrowRight size={18} color={Colors.white} strokeWidth={2.4} />
            </TouchableOpacity>

            {/* Skip for now text link */}
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkipFeedback}
              activeOpacity={0.7}
            >
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.darkText,
    fontWeight: '700',
  },
  doneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.lightSage,
    borderRadius: BorderRadius.round,
  },
  doneBtnText: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },

  // SCREEN 1 STYLES
  screen1Center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerGlowRing: {
    width: 290,
    height: 290,
    borderRadius: 145,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  innerCircleBubble: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  bubbleHighlight: {
    position: 'absolute',
    top: 18,
    left: 36,
    width: 50,
    height: 24,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    transform: [{ rotate: '-32deg' }],
  },
  bubbleHighlightSmall: {
    position: 'absolute',
    top: 45,
    left: 26,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  circlePlusWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  circleBoldTitle: {
    ...Typography.h2,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkText,
    textTransform: 'lowercase',
    marginBottom: 6,
  },
  circleSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: Spacing.md,
  },
  screen1Bottom: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  deepBreathPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.lightSage,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  deepBreathText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  tranquilSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
  },

  // SCREEN 2 STYLES
  inputScroll: {
    flex: 1,
  },
  inputScrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  floatingInputCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 220,
  },
  inputCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  presentMomentPill: {
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  presentMomentText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.8,
  },
  heartWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multiLineInput: {
    ...Typography.body,
    fontSize: 16,
    color: Colors.darkText,
    lineHeight: 24,
    minHeight: 130,
  },
  typingBottomArea: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.background,
  },
  quickTagsLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
    marginBottom: 6,
    fontWeight: '600',
  },
  quickTagsScroll: {
    gap: 8,
    marginBottom: Spacing.lg,
  },
  quickTagChip: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
  },
  quickTagText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkText,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: BorderRadius.round,
    gap: 8,
    width: '100%',
  },
  primaryActionBtnText: {
    ...Typography.button,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },

  // SCREEN 3 STYLES
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  timerText: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  screen3Center: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  shrinkArena: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shrinkingBubble: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    overflow: 'hidden',
  },
  shrinkWorryText: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkText,
    textAlign: 'center',
    marginBottom: 8,
  },
  shrinkSubtitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mindfulTopSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    minHeight: 56,
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  dynamicMindfulQuote: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryDark,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  screen3Bottom: {
    paddingHorizontal: Spacing.xl,
    gap: 12,
  },
  soundStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  soundStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  soundStatusText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.darkText,
    fontWeight: '600',
    flex: 1,
  },
  muteBtn: {
    padding: 6,
  },
  breathingRhythmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  breathingRhythmText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
    fontWeight: '500',
  },

  // SCREEN 4: POST-SESSION FEEDBACK MODAL
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(41, 51, 46, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  modalLeafIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.darkText,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
    lineHeight: 16,
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  emotionCard: {
    width: '48%',
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  emotionCardSelected: {
    backgroundColor: Colors.lightSage,
    borderColor: Colors.primary,
  },
  emotionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  emotionEmoji: {
    fontSize: 24,
  },
  selectedCheckBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emotionLabel: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkText,
  },
  emotionLabelSelected: {
    color: Colors.primaryDark,
  },
  emotionSubtitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
  },
  customNoteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  customNoteInput: {
    flex: 1,
    ...Typography.caption,
    fontSize: 12,
    color: Colors.darkText,
  },
  writeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.lightSage,
    borderRadius: BorderRadius.round,
  },
  writeBtnText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipBtnText: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.mutedText,
    fontWeight: '600',
  },
});
