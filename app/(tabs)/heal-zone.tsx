import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import Svg, { Path } from 'react-native-svg';
import {
  CheckCircle2,
  ChevronLeft,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Play,
  Clock,
  Wind,
  Gamepad2,
  Music,
  RotateCcw,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { MoodTrendChart } from '../../components/heal-zone/MoodTrendChart';
import {
  FeatureDetailModal,
  FeatureDetail,
} from '../../components/heal-zone/FeatureDetailModal';
import {
  initial7DayChart,
  initial30DayChart,
} from '../../data/mockData';
import { MoodChartPoint } from '../../types';

// Types and data for dynamic mood selection
type MoodName = 'Calm' | 'Happy' | 'Peaceful' | 'Tired' | 'Stressed';

interface MoodItem {
  id: string;
  name: MoodName;
  emoji: string;
  score: number;
  quote: string;
}

const MOOD_DATA: Record<MoodName, { emoji: string; score: number; quote: string }> = {
  Calm: {
    emoji: '😌',
    score: 3.5,
    quote: 'Peace comes from within. Do not seek it without.',
  },
  Happy: {
    emoji: '😊',
    score: 4.0,
    quote: 'Your joy lights up the space around you.',
  },
  Peaceful: {
    emoji: '🌿',
    score: 3.8,
    quote: 'Your mind is in harmony today. Cherish this stillness.',
  },
  Tired: {
    emoji: '😴',
    score: 2.0,
    quote: 'Resting is productive. Give yourself permission to pause.',
  },
  Stressed: {
    emoji: '😣',
    score: 1.5,
    quote: 'Take a deep breath. You are stronger than this moment.',
  },
};

const MOOD_LIST: MoodItem[] = [
  { id: 'calm', name: 'Calm', ...MOOD_DATA.Calm },
  { id: 'happy', name: 'Happy', ...MOOD_DATA.Happy },
  { id: 'peaceful', name: 'Peaceful', ...MOOD_DATA.Peaceful },
  { id: 'tired', name: 'Tired', ...MOOD_DATA.Tired },
  { id: 'stressed', name: 'Stressed', ...MOOD_DATA.Stressed },
];

// Reusable Botanical Bloom Logo Mark matching brand emblem
const BloomLogoMark = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C12 2 8 8 8 13C8 16.5 10 19 12 21C14 19 16 16.5 16 13C16 8 12 2 12 2Z"
      stroke="#29332E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.5 12C6.5 10.5 3 11 2 14C3.5 16.5 6.5 17 9 15.5"
      stroke="#29332E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15.5 12C17.5 10.5 21 11 22 14C20.5 16.5 17.5 17 15 15.5"
      stroke="#29332E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function HealZoneScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 20);

  // Dynamic Mood State (null = State A: horizontal selector, string = State B: transformed card)
  const [selectedMood, setSelectedMood] = useState<MoodName | null>(null);

  // Mood chart data state (preserved for 7-day and 30-day line charts)
  const [sevenDayChart, setSevenDayChart] =
    useState<MoodChartPoint[]>(initial7DayChart);
  const [thirtyDayChart, setThirtyDayChart] =
    useState<MoodChartPoint[]>(initial30DayChart);

  // Toast confirmation state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Feature Detail Modal state (for Card 3 & Card 4)
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetail | null>(
    null
  );

  // 1-Minute Focus Session Modal State
  const [isFocusModalVisible, setIsFocusModalVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);

  // Audio player for ambient singing bowl / rain
  const player = useAudioPlayer(require('../../assets/audio/singing-bowl.mp3'));

  // Center Breathing Bubble Animation (Scale 0.85 -> 1.35)
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);

  // 1-Minute Box Breathing Session Timer & Cycle Logic
  // Box breathing is 4-4-4-4 (16s cycle: Inhale 4s, Hold 4s, Exhale 4s, Rest 4s)
  const elapsed = 60 - secondsRemaining;
  const cycleSecond = elapsed % 16;

  let currentPhase: 'Inhale' | 'Hold' | 'Exhale' | 'Rest' = 'Inhale';
  let phaseInstruction = 'Inhale slowly...';
  let phaseTimeLeft = 4 - (cycleSecond % 4);

  if (cycleSecond < 4) {
    currentPhase = 'Inhale';
    phaseInstruction = 'Inhale deeply...';
  } else if (cycleSecond < 8) {
    currentPhase = 'Hold';
    phaseInstruction = 'Hold gently...';
  } else if (cycleSecond < 12) {
    currentPhase = 'Exhale';
    phaseInstruction = 'Release out...';
  } else {
    currentPhase = 'Rest';
    phaseInstruction = 'Rest and center...';
  }

  // Handle Box Breathing scale animation transitions
  useEffect(() => {
    if (!isFocusModalVisible || isSessionCompleted) return;

    if (cycleSecond === 0) {
      // Inhale: expand to 1.35 over 4s
      Animated.timing(scaleAnim, {
        toValue: 1.35,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (cycleSecond === 4) {
      // Hold: remain expanded
      scaleAnim.setValue(1.35);
    } else if (cycleSecond === 8) {
      // Exhale: contract to 0.85 over 4s
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (cycleSecond === 12) {
      // Rest: remain contracted
      scaleAnim.setValue(0.85);
    }
  }, [cycleSecond, isFocusModalVisible, isSessionCompleted, scaleAnim]);

  // Main 1-second interval countdown timer
  useEffect(() => {
    if (isFocusModalVisible && !isSessionCompleted) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsSessionCompleted(true);
            try {
              player.pause();
            } catch (e) {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFocusModalVisible, isSessionCompleted, player]);

  // Start Focus Session
  const handleStartFocusSession = () => {
    setSecondsRemaining(60);
    setIsSessionCompleted(false);
    scaleAnim.setValue(1);
    setIsFocusModalVisible(true);

    try {
      if (!isAudioMuted) {
        player.seekTo(0);
        player.play();
      }
    } catch (e) {
      // Graceful audio playback fallback
    }
  };

  // End Focus Session Early or Close
  const handleEndFocusSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFocusModalVisible(false);
    setSecondsRemaining(60);
    setIsSessionCompleted(false);
    scaleAnim.setValue(1);

    try {
      player.pause();
    } catch (e) {}
  };

  // Toggle Audio Mute
  const handleToggleAudio = () => {
    setIsAudioMuted(prev => {
      const nextMuted = !prev;
      try {
        if (nextMuted) {
          player.pause();
        } else {
          player.play();
        }
      } catch (e) {}
      return nextMuted;
    });
  };

  // Format MM:SS Countdown
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(
    seconds
  ).padStart(2, '0')}`;

  // Handle Mood selection from horizontal bar
  const handleSelectMood = useCallback((mood: MoodItem) => {
    setSelectedMood(mood.name);

    // Update 7-day chart's latest reading with the selected mood
    setSevenDayChart(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          score: mood.score,
          mood: mood.name,
          emoji: mood.emoji,
        };
      }
      return updated;
    });

    // Confirmation Toast
    setToastMessage(`Mood logged: ${mood.emoji} ${mood.name}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1 — TOP NAVIGATION BAR & HEADER */}
        <View style={styles.topNavBar}>
          <View style={styles.navLeft}>
            <View style={[styles.bloomLogoCircle, Shadows.sm]}>
              <BloomLogoMark />
            </View>
            <Text style={styles.bloomNavTitle}>Bloom</Text>
          </View>
        </View>

        {/* SCREEN TITLE (Clean "Heal Zone" without pre-header text) */}
        <View style={styles.titleSection}>
          <Text style={styles.headerTitle}>Heal Zone</Text>
          <Text style={styles.headerSubtitle}>
            Your safe space for healing and self-care.
          </Text>
        </View>

        {/* Confirmation Toast */}
        {toastMessage && (
          <View style={[styles.toastContainer, Shadows.md]}>
            <CheckCircle2 size={18} color={Colors.primaryDark} strokeWidth={2} />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* SECTION 2 — DAILY QUOTE HERO BANNER */}
        <View style={styles.heroQuoteSection}>
          <View style={[styles.heroQuoteCard, Shadows.sm]}>
            <View style={styles.quoteEmojiBadge}>
              <Text style={styles.quoteEmoji}>✨</Text>
            </View>
            <View style={styles.quoteTextContainer}>
              <Text style={styles.quoteText}>
                "Growth happens one calm breath at a time."
              </Text>
              <Text style={styles.quoteAuthor}>— Daily Whisper</Text>
            </View>
          </View>
        </View>

        {/* SECTION 3 — 2x2 FEATURE CARDS GRID */}
        <View style={styles.gridSection}>
          <View style={styles.gridRow}>
            {/* CARD 1 — HEAL WITH ME */}
            <TouchableOpacity
              style={[styles.featureCard, Shadows.sm]}
              onPress={() => router.push('/heal-bubble')}
              activeOpacity={0.82}
            >
              <View style={[styles.cardIconCircle, { backgroundColor: Colors.lightSage }]}>
                <Text style={styles.cardEmoji}>🧘</Text>
              </View>
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Heal with me
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  Breathe, relax and find your calm
                </Text>
              </View>
            </TouchableOpacity>

            {/* CARD 2 — DIARY / DOCS */}
            <TouchableOpacity
              style={[styles.featureCard, Shadows.sm]}
              onPress={() => router.push('/documents')}
              activeOpacity={0.82}
            >
              <View style={[styles.cardIconCircle, { backgroundColor: Colors.peach }]}>
                <Text style={styles.cardEmoji}>📖</Text>
              </View>
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Diary / Docs
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  Your personal space to write
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            {/* CARD 3 — PLAY WITH ME */}
            <TouchableOpacity
              style={[styles.featureCard, Shadows.sm]}
              onPress={() => router.push('/games')}
              activeOpacity={0.82}
            >
              <View style={[styles.cardIconCircle, { backgroundColor: Colors.lavender }]}>
                <Text style={styles.cardEmoji}>🎮</Text>
              </View>
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Play with me
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  Relaxing mindfulness games
                </Text>
              </View>
            </TouchableOpacity>

            {/* CARD 4 — RELAX WITH ME */}
            <TouchableOpacity
              style={[styles.featureCard, Shadows.sm]}
              onPress={() => router.push('/music')}
              activeOpacity={0.82}
            >
              <View style={[styles.cardIconCircle, { backgroundColor: Colors.softBlue }]}>
                <Text style={styles.cardEmoji}>🎵</Text>
              </View>
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Relax with me
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  Calming playlists and sounds
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 4 — DYNAMIC MOOD SELECTION & TRANSFORMATION CARD */}
        {selectedMood === null ? (
          /* STATE A: Horizontal Scrollable Mood Selector */
          <View style={styles.moodSection}>
            <View style={styles.moodSectionHeader}>
              <Text style={styles.sectionTitle}>Select your mood</Text>
              <View style={styles.scrollIndicatorPill}>
                <Text style={styles.scrollIndicatorText}>📜 scroll</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moodScrollContent}
            >
              {MOOD_LIST.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.moodCard, Shadows.sm]}
                  onPress={() => handleSelectMood(item)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.moodEmoji}>{item.emoji}</Text>
                  <Text style={styles.moodName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          /* STATE B: Transformed Personalized Mood Card */
          <View style={styles.loggedMoodSection}>
            <View style={[styles.loggedMoodCard, Shadows.sm]}>
              <View style={styles.loggedMoodLeft}>
                <View style={styles.loggedEmojiCircle}>
                  <Text style={styles.loggedEmoji}>
                    {MOOD_DATA[selectedMood].emoji}
                  </Text>
                </View>
              </View>

              <View style={styles.loggedMoodCenter}>
                <View style={styles.loggedTitleRow}>
                  <Text style={styles.loggedMoodTitle}>{selectedMood}</Text>
                  <View style={styles.loggedBadge}>
                    <Text style={styles.loggedBadgeText}>Logged</Text>
                  </View>
                </View>
                <Text style={styles.loggedMoodQuote}>
                  "{MOOD_DATA[selectedMood].quote}"
                </Text>
              </View>

              <TouchableOpacity
                style={styles.changeMoodBtn}
                onPress={() => setSelectedMood(null)}
                activeOpacity={0.7}
              >
                <RotateCcw size={14} color={Colors.primaryDark} strokeWidth={2.2} />
                <Text style={styles.changeMoodText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SECTION 5 — FOCUS WITH ME CARD (WITH 1-MIN POP-UP TRIGGER) */}
        <View style={styles.focusSection}>
          <View style={[styles.focusCard, Shadows.md]}>
            <View style={styles.focusTopRow}>
              <View style={styles.focusBadge}>
                <Wind size={16} color={Colors.primaryDark} strokeWidth={2.2} />
                <Text style={styles.focusBadgeText}>1-MIN PRACTICE</Text>
              </View>
              <View style={styles.focusTimeTag}>
                <Clock size={12} color={Colors.mutedText} strokeWidth={2} />
                <Text style={styles.focusTimeText}>60 secs</Text>
              </View>
            </View>

            <Text style={styles.focusTitle}>Focus with me</Text>
            <Text style={styles.focusSubtitle}>
              Clear your mind, release stress, and regain steady attention with guided box breathing.
            </Text>

            <TouchableOpacity
              style={styles.focusButton}
              onPress={handleStartFocusSession}
              activeOpacity={0.85}
            >
              <Play size={16} color={Colors.white} fill={Colors.white} />
              <Text style={styles.focusButtonText}>Start a session</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 6 — MOOD TRENDS 7-DAY GRAPH (AT THE END OF THE PAGE) */}
        <View style={styles.chartSection}>
          <MoodTrendChart
            sevenDayData={sevenDayChart}
            thirtyDayData={thirtyDayChart}
          />
        </View>

        {/* BOTTOM SPACING TO ENSURE UNIMPEDED SCROLL PAST TAB BAR */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* 1-MINUTE FOCUS SESSION POP-UP MODAL */}
      <Modal
        visible={isFocusModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleEndFocusSession}
      >
        <View
          style={[
            styles.modalScreen,
            { paddingTop: topPadding, paddingBottom: bottomPadding },
          ]}
        >
          {/* MODAL HEADER */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={handleEndFocusSession}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ChevronLeft size={22} color={Colors.darkText} strokeWidth={2.4} />
              <Text style={styles.modalBackText}>Focus</Text>
            </TouchableOpacity>

            <View style={styles.boxBreathingPill}>
              <Text style={styles.boxBreathingText}>Box Breathing • 4-4-4-4</Text>
            </View>

            <View style={styles.timerBadge}>
              <Clock size={12} color={Colors.primaryDark} strokeWidth={2.2} />
              <Text style={styles.timerBadgeText}>{formattedCountdown}</Text>
            </View>
          </View>

          {/* VISUAL STEP PROGRESS LINE (PHASE BAR) */}
          <View style={styles.phaseBarContainer}>
            <View style={styles.phaseStepsRow}>
              {(['Inhale', 'Hold', 'Exhale', 'Rest'] as const).map(step => {
                const isActive = currentPhase === step && !isSessionCompleted;
                return (
                  <View
                    key={step}
                    style={[
                      styles.phaseStepPill,
                      isActive && styles.phaseStepPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.phaseStepText,
                        isActive && styles.phaseStepTextActive,
                      ]}
                    >
                      {step}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Step Progress Line */}
            <View style={styles.phaseLineBg}>
              <View
                style={[
                  styles.phaseLineFill,
                  {
                    width: isSessionCompleted
                      ? '100%'
                      : `${Math.min(100, ((cycleSecond + 1) / 16) * 100)}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* CENTER EXPANDING/CONTRACTING BREATHING BUBBLE */}
          <View style={styles.centerBubbleContainer}>
            <Animated.View
              style={[
                styles.breathingOuterRing,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <View style={styles.breathingMiddleRing}>
                <View style={styles.breathingCore}>
                  <Sparkles
                    size={20}
                    color={Colors.primary}
                    strokeWidth={2}
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={styles.breathingPhaseText}>
                    {isSessionCompleted ? 'Done ✨' : phaseInstruction}
                  </Text>
                  {!isSessionCompleted && (
                    <Text style={styles.breathingCounterText}>
                      {phaseTimeLeft}s
                    </Text>
                  )}
                </View>
              </View>
            </Animated.View>

            {/* Post-session celebratory text */}
            {isSessionCompleted && (
              <View style={styles.completionBanner}>
                <Text style={styles.completionTitle}>Session Complete! ✨</Text>
                <Text style={styles.completionSubtitle}>
                  You've reclaimed 1 full minute of mindful focus. Carry this calm forward.
                </Text>
              </View>
            )}
          </View>

          {/* AUDIO BADGE PILL BUTTON */}
          <View style={styles.audioBadgeRow}>
            <TouchableOpacity
              style={[
                styles.audioBadgePill,
                Shadows.sm,
                isAudioMuted && styles.audioBadgePillMuted,
              ]}
              onPress={handleToggleAudio}
              activeOpacity={0.8}
            >
              {isAudioMuted ? (
                <VolumeX size={16} color={Colors.mutedText} strokeWidth={2} />
              ) : (
                <Volume2 size={16} color={Colors.primaryDark} strokeWidth={2.2} />
              )}
              <Text
                style={[
                  styles.audioBadgeText,
                  isAudioMuted && styles.audioBadgeTextMuted,
                ]}
              >
                🌲 Forest Rain {isAudioMuted ? '(Muted)' : '(Playing)'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ACTION BUTTON — END SESSION EARLY */}
          <View style={styles.modalBottomActions}>
            <TouchableOpacity
              style={styles.endSessionBtn}
              onPress={handleEndFocusSession}
              activeOpacity={0.8}
            >
              <X size={16} color={Colors.mutedText} strokeWidth={2.4} />
              <Text style={styles.endSessionText}>
                {isSessionCompleted ? 'Close Session' : 'End Session early'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Feature Detail Modal for Cards 3 & 4 */}
      <FeatureDetailModal
        visible={!!selectedFeature}
        feature={selectedFeature}
        onClose={() => setSelectedFeature(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.massive,
  },

  // 1. Top Navigation Bar & Header
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bloomLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bloomNavTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.darkText,
    letterSpacing: 0.4,
  },
  titleSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h1,
    fontSize: 30,
    color: Colors.darkText,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.mutedText,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightSage,
    marginHorizontal: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  toastText: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.primaryDark,
  },

  // 2. Daily Quote Hero Banner
  heroQuoteSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  heroQuoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(41, 51, 46, 0.05)',
    gap: 12,
  },
  quoteEmojiBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteEmoji: {
    fontSize: 20,
  },
  quoteTextContainer: {
    flex: 1,
  },
  quoteText: {
    ...Typography.body,
    fontSize: 13.5,
    fontStyle: 'italic',
    color: Colors.darkText,
    lineHeight: 19,
    fontWeight: '500',
  },
  quoteAuthor: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '700',
    marginTop: 2,
  },

  // 3. 2x2 Feature Cards Grid
  gridSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  featureCard: {
    width: '48%',
    minHeight: 146,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(41, 51, 46, 0.05)',
  },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  cardEmoji: {
    fontSize: 22,
  },
  cardTextContent: {
    marginTop: Spacing.md,
  },
  cardTitle: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 15.5,
    color: Colors.darkText,
    marginBottom: 3,
  },
  cardSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
    lineHeight: 16,
  },

  // 4. Dynamic Mood Selection & Transformed Card
  moodSection: {
    marginBottom: Spacing.xl,
  },
  moodSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.darkText,
  },
  scrollIndicatorPill: {
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  scrollIndicatorText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  moodScrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: 10,
  },
  moodCard: {
    width: 90,
    height: 98,
    backgroundColor: Colors.white,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  moodName: {
    ...Typography.caption,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.darkText,
  },

  // State B: Transformed Logged Mood Card
  loggedMoodSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  loggedMoodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(41, 51, 46, 0.05)',
    gap: 14,
  },
  loggedMoodLeft: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loggedEmojiCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(120, 155, 131, 0.3)',
  },
  loggedEmoji: {
    fontSize: 28,
  },
  loggedMoodCenter: {
    flex: 1,
  },
  loggedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  loggedMoodTitle: {
    ...Typography.h3,
    fontSize: 16.5,
    fontWeight: '700',
    color: Colors.darkText,
  },
  loggedBadge: {
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  loggedBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  loggedMoodQuote: {
    ...Typography.body,
    fontSize: 12.5,
    fontStyle: 'italic',
    color: Colors.mutedText,
    lineHeight: 17,
  },
  changeMoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  changeMoodText: {
    ...Typography.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primaryDark,
  },

  // 5. Focus with Me Card Styles
  focusSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  focusCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(41, 51, 46, 0.05)',
  },
  focusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  focusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  focusBadgeText: {
    ...Typography.caption,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  focusTimeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  focusTimeText: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.mutedText,
  },
  focusTitle: {
    ...Typography.h2,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 6,
  },
  focusSubtitle: {
    ...Typography.body,
    fontSize: 13.5,
    color: Colors.mutedText,
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },
  focusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.round,
    gap: 8,
  },
  focusButtonText: {
    ...Typography.button,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },

  // 6. Mood Trends 7-Day Graph Section
  chartSection: {
    marginBottom: Spacing.md,
  },

  // 1-Minute Focus Modal Styles
  modalScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  modalBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingRight: 8,
  },
  modalBackText: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkText,
  },
  boxBreathingPill: {
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
  },
  boxBreathingText: {
    ...Typography.caption,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timerBadgeText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },

  // Phase Bar Styles
  phaseBarContainer: {
    paddingHorizontal: Spacing.xxl,
    marginVertical: Spacing.md,
  },
  phaseStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  phaseStepPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(232, 236, 233, 0.6)',
  },
  phaseStepPillActive: {
    backgroundColor: Colors.primary,
  },
  phaseStepText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  phaseStepTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  phaseLineBg: {
    height: 4,
    backgroundColor: 'rgba(232, 236, 233, 0.8)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  phaseLineFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  // Center Breathing Bubble Styles
  centerBubbleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  breathingOuterRing: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(120, 155, 131, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingMiddleRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(120, 155, 131, 0.26)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingCore: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingHorizontal: 12,
  },
  breathingPhaseText: {
    ...Typography.h2,
    fontSize: 16.5,
    fontWeight: '700',
    color: Colors.darkText,
    textAlign: 'center',
  },
  breathingCounterText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 4,
  },
  completionBanner: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  completionTitle: {
    ...Typography.h2,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  completionSubtitle: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Audio Badge Styles
  audioBadgeRow: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  audioBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  audioBadgePillMuted: {
    backgroundColor: Colors.cream,
  },
  audioBadgeText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  audioBadgeTextMuted: {
    color: Colors.mutedText,
    fontWeight: '600',
  },

  // Modal Bottom Actions
  modalBottomActions: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  endSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(232, 236, 233, 0.7)',
  },
  endSessionText: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mutedText,
  },
});
