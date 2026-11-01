import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle as SvgCircle } from 'react-native-svg';
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Moon,
  Activity,
  Wind,
  Plus,
  Sparkles,
  CheckCircle2,
  X,
  Play,
  Heart,
  Calendar,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WEEK_STRESS_BARS = [
  { day: 'Mon', score: 32 },
  { day: 'Tue', score: 28 },
  { day: 'Wed', score: 35 },
  { day: 'Thu', score: 24 },
  { day: 'Fri', score: 28 },
  { day: 'Sat', score: 18 },
  { day: 'Sun', score: 22 },
];

export default function TrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 20 : 16);

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);

  // Breathing trainer state
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathCount, setBreathCount] = useState(4);
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);

  // Biometric log state
  const [logSleepHours, setLogSleepHours] = useState('7.5');
  const [logStressRating, setLogStressRating] = useState('25');
  const [logNote, setLogNote] = useState('');

  // Start 3-min reset breathing
  const handleStartBreathing = () => {
    setShowBreathingModal(true);
    setIsBreathingRunning(true);
    let count = 4;
    setBreathPhase('Inhale');
    setBreathCount(4);

    const interval = setInterval(() => {
      count -= 1;
      if (count === 0) {
        setBreathPhase((prev) => {
          if (prev === 'Inhale') {
            count = 7;
            setBreathCount(7);
            return 'Hold';
          }
          if (prev === 'Hold') {
            count = 8;
            setBreathCount(8);
            return 'Exhale';
          }
          count = 4;
          setBreathCount(4);
          return 'Inhale';
        });
      } else {
        setBreathCount(count);
      }
    }, 1000);

    // Stop after 25s for demo
    setTimeout(() => {
      clearInterval(interval);
      setIsBreathingRunning(false);
    }, 25000);
  };

  const handleSaveLog = () => {
    setShowLogModal(false);
  };

  // SVG Wave Graph Dimensions
  const waveWidth = SCREEN_WIDTH - 48 - 40; // padding inside card
  const waveHeight = 90;

  return (
    <View style={styles.screen}>
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <View style={[styles.headerContainer, { paddingTop: topPadding }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color="#29332E" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.headerIndicator}>Tasks</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconCircle} activeOpacity={0.7}>
            <SlidersHorizontal size={18} color="#29332E" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>K</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Biometric Sync Active Banner ─────────────────────────── */}
        <View style={styles.syncTopRow}>
          <View style={styles.biometricBadge}>
            <View style={styles.liveGreenDot} />
            <Text style={styles.biometricText}>BIOMETRIC SYNC ACTIVE</Text>
          </View>

          <TouchableOpacity style={styles.dateFilterBadge}>
            <Text style={styles.dateFilterText}>Last 7 Days</Text>
            <ChevronRight size={13} color="#365B45" style={{ transform: [{ rotate: '90deg' }] }} />
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── 1. SLEEP SECTION ─────────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Moon size={20} color="#365B45" strokeWidth={2.2} />
            <Text style={styles.sectionHeading}>Sleep</Text>
          </View>
          <View style={styles.avgPillMint}>
            <Text style={styles.avgPillText}>7h 45m avg</Text>
          </View>
        </View>

        {/* Night Rest Cycles Card */}
        <View style={[styles.trackingCard, Shadows.sm]}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Night Rest Cycles</Text>
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityBadgeText}>92% Quality</Text>
            </View>
          </View>

          {/* Breakdown Pills */}
          <View style={styles.breakdownPillsRow}>
            <View style={styles.breakdownPill}>
              <Text style={styles.breakdownLabel}>Deep: </Text>
              <Text style={styles.breakdownValue}>1h 48m</Text>
            </View>
            <View style={styles.breakdownPill}>
              <Text style={styles.breakdownLabel}>REM: </Text>
              <Text style={styles.breakdownValue}>2h 12m</Text>
            </View>
            <View style={styles.breakdownPill}>
              <Text style={styles.breakdownLabel}>Light: </Text>
              <Text style={styles.breakdownValue}>3h 45m</Text>
            </View>
          </View>

          {/* Smooth Rest Cycle Wave Graph */}
          <View style={styles.waveGraphContainer}>
            <Svg width={waveWidth} height={waveHeight}>
              {/* Horizontal Reference Grid Lines */}
              <Line x1="0" y1="20" x2={waveWidth} y2="20" stroke="#E8ECE9" strokeWidth="1" strokeDasharray="4 4" />
              <Line x1="0" y1="50" x2={waveWidth} y2="50" stroke="#E8ECE9" strokeWidth="1" strokeDasharray="4 4" />
              <Line x1="0" y1="80" x2={waveWidth} y2="80" stroke="#E8ECE9" strokeWidth="1" />

              {/* Smooth Circadian Wave Path */}
              <Path
                d={`M 0 65 Q ${waveWidth * 0.15} 15, ${waveWidth * 0.3} 45 T ${waveWidth * 0.6} 20 T ${waveWidth * 0.85} 65 T ${waveWidth} 40`}
                fill="none"
                stroke="#365B45"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Peak Wave Dots */}
              <SvgCircle cx={waveWidth * 0.15} cy={28} r={4} fill="#789B83" />
              <SvgCircle cx={waveWidth * 0.6} cy={20} r={4} fill="#365B45" />
            </Svg>

            {/* Time labels below graph */}
            <View style={styles.timeAxisRow}>
              <Text style={styles.axisLabel}>11 PM</Text>
              <Text style={styles.axisLabel}>1 AM</Text>
              <Text style={styles.axisLabel}>3 AM</Text>
              <Text style={styles.axisLabel}>5 AM</Text>
              <Text style={styles.axisLabel}>7 AM</Text>
            </View>
          </View>

          {/* Circadian Stability Note */}
          <View style={styles.stabilityBox}>
            <Sparkles size={16} color="#365B45" strokeWidth={2} style={{ marginTop: 2 }} />
            <Text style={styles.stabilityText}>
              <Text style={{ fontWeight: '700', color: '#365B45' }}>Circadian Stability: </Text>
              Your sleep window remained steady within 18 minutes of your 11:00 PM target.
            </Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── 2. STRESS SECTION ────────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Activity size={20} color="#365B45" strokeWidth={2.2} />
            <Text style={styles.sectionHeading}>Stress</Text>
          </View>
          <View style={styles.avgPillMint}>
            <Text style={styles.avgPillText}>Low / Balanced</Text>
          </View>
        </View>

        {/* Daily Stress Rhythm Score Card */}
        <View style={[styles.trackingCard, Shadows.sm]}>
          <View style={styles.stressScoreTop}>
            <View>
              <Text style={styles.stressCardLabel}>Daily stress rhythm score</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <Text style={styles.stressScoreBig}>28</Text>
                <Text style={styles.stressScoreDenominator}>/ 100</Text>
              </View>
            </View>

            <View style={styles.calmBadge}>
              <Text style={styles.calmBadgeText}>Calm state</Text>
            </View>
          </View>

          {/* Weekly Average Navigation Header */}
          <View style={styles.weekNavHeader}>
            <Text style={styles.weekNavTitle}>Weekly Average</Text>
            <View style={styles.weekControls}>
              <TouchableOpacity style={styles.weekArrowBtn}>
                <ChevronLeft size={14} color="#365B45" strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={styles.weekRangeText}>Oct 19 - Oct 25</Text>
              <TouchableOpacity style={styles.weekArrowBtn}>
                <ChevronRight size={14} color="#365B45" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Mon–Sun Bar Chart */}
          <View style={styles.stressBarsContainer}>
            {WEEK_STRESS_BARS.map((item, idx) => {
              const heightPercent = Math.min(100, (item.score / 60) * 100);
              const isToday = item.day === 'Fri';

              return (
                <View key={idx} style={styles.barCol}>
                  <Text style={styles.barValText}>{item.score}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${heightPercent}%`,
                          backgroundColor: isToday ? '#365B45' : '#D9EEE5',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barDayText, isToday && styles.barDayTextToday]}>
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Study Break Insight Card */}
          <View style={styles.insightBox}>
            <Sparkles size={16} color="#365B45" strokeWidth={2} style={{ marginTop: 2 }} />
            <Text style={styles.insightText}>
              Cortisol peaks during midday study blocks. Taking a 5-minute eye rest at 2:00 PM kept sympathetic arousal low.
            </Text>
          </View>
        </View>

        {/* ── 3. Reset Breathing Banner ─────────────────────────────────── */}
        <View style={[styles.breathingBanner, Shadows.sm]}>
          <View style={styles.windIconCircle}>
            <Wind size={20} color="#365B45" strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.breathingBannerTitle}>3-Min Reset Breathing</Text>
            <Text style={styles.breathingBannerDesc}>
              Vagal nerve stimulation for sustained study focus.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.beginBtn}
            onPress={handleStartBreathing}
            activeOpacity={0.8}
          >
            <Text style={styles.beginBtnText}>Begin</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Floating Action Button (FAB) ───────────────────────────────── */}
      <TouchableOpacity
        style={[styles.fabButton, Shadows.md]}
        onPress={() => setShowLogModal(true)}
        activeOpacity={0.85}
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* ── Log Metrics Modal ──────────────────────────────────────────── */}
      <Modal
        visible={showLogModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Log Biometric Note</Text>
              <TouchableOpacity onPress={() => setShowLogModal(false)}>
                <X size={20} color="#7B857F" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>SLEEP DURATION (HOURS)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 7.5"
              placeholderTextColor="#7B857F"
              keyboardType="numeric"
              value={logSleepHours}
              onChangeText={setLogSleepHours}
            />

            <Text style={styles.inputLabel}>ESTIMATED STRESS RATING (0-100)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 28"
              placeholderTextColor="#7B857F"
              keyboardType="numeric"
              value={logStressRating}
              onChangeText={setLogStressRating}
            />

            <Text style={styles.inputLabel}>WELLNESS NOTE</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Felt restful after 10 PM screen cutoff"
              placeholderTextColor="#7B857F"
              value={logNote}
              onChangeText={setLogNote}
            />

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowLogModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveLog}
              >
                <Text style={styles.saveBtnText}>Save Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 3-Min Reset Breathing Modal ───────────────────────────────── */}
      <Modal
        visible={showBreathingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBreathingModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.breathingModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>4-7-8 Vagal Reset</Text>
              <TouchableOpacity onPress={() => setShowBreathingModal(false)}>
                <X size={20} color="#7B857F" />
              </TouchableOpacity>
            </View>

            <View style={styles.breathingOrbContainer}>
              <View style={styles.breathingOrb}>
                <Wind size={36} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.breathingPhaseText}>{breathPhase}</Text>
                <Text style={styles.breathingCountText}>{breathCount}</Text>
              </View>
            </View>

            <Text style={styles.breathingInstructions}>
              Inhale through nose for 4s, hold gently for 7s, exhale completely through mouth for 8s.
            </Text>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => setShowBreathingModal(false)}
            >
              <Text style={styles.saveBtnText}>Done</Text>
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
    backgroundColor: '#FAF8F2', // Off-white / Cream
  },
  headerContainer: {
    backgroundColor: '#FAF8F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIndicator: {
    fontSize: 17,
    fontWeight: '700',
    color: '#29332E',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D9EEE5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#789B83',
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: '#365B45',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 6,
  },

  // Top Biometric Sync Banner
  syncTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  biometricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    gap: 6,
  },
  liveGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#365B45',
  },
  biometricText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#365B45',
    letterSpacing: 0.8,
  },
  dateFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECE9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    gap: 4,
  },
  dateFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#29332E',
  },
  avgPillMint: {
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  avgPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },

  // Tracking Card
  trackingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#29332E',
  },
  qualityBadge: {
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  qualityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },

  // Breakdown Pills
  breakdownPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  breakdownPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F2',
    borderWidth: 1,
    borderColor: '#E8ECE9',
    borderRadius: BorderRadius.round,
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#7B857F',
    fontWeight: '600',
  },
  breakdownValue: {
    fontSize: 11,
    color: '#365B45',
    fontWeight: '700',
  },

  // Wave Graph
  waveGraphContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  timeAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  axisLabel: {
    fontSize: 10.5,
    color: '#7B857F',
    fontWeight: '500',
  },

  // Stability Box
  stabilityBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAF8F2',
    borderRadius: BorderRadius.md,
    padding: 12,
    gap: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  stabilityText: {
    flex: 1,
    fontSize: 12,
    color: '#29332E',
    lineHeight: 17,
  },

  // Stress Score Top
  stressScoreTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stressCardLabel: {
    fontSize: 13,
    color: '#7B857F',
    fontWeight: '600',
  },
  stressScoreBig: {
    fontSize: 34,
    fontWeight: '800',
    color: '#29332E',
    letterSpacing: -0.5,
  },
  stressScoreDenominator: {
    fontSize: 16,
    color: '#7B857F',
    fontWeight: '600',
  },
  calmBadge: {
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  calmBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },

  // Week Nav
  weekNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#E8ECE9',
    paddingTop: 12,
  },
  weekNavTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7B857F',
    letterSpacing: 0.5,
  },
  weekControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekArrowBtn: {
    padding: 4,
  },
  weekRangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },

  // Stress Bars
  stressBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 110,
    marginBottom: 16,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barValText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#7B857F',
    marginBottom: 4,
  },
  barTrack: {
    width: 22,
    height: 70,
    backgroundColor: '#FAF8F2',
    borderRadius: 11,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: 22,
    borderRadius: 11,
  },
  barDayText: {
    fontSize: 10.5,
    color: '#7B857F',
    marginTop: 6,
    fontWeight: '500',
  },
  barDayTextToday: {
    color: '#365B45',
    fontWeight: '800',
  },

  // Insight Box
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAF8F2',
    borderRadius: BorderRadius.md,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    color: '#29332E',
    lineHeight: 17,
  },

  // Reset Breathing Banner
  breathingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9EEE5',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#CDE5DB',
    gap: 12,
  },
  windIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#365B45',
  },
  breathingBannerDesc: {
    fontSize: 11.5,
    color: '#29332E',
    marginTop: 2,
  },
  beginBtn: {
    backgroundColor: '#365B45',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
  },
  beginBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Floating Action Button
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#365B45',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(41, 51, 46, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#29332E',
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#7B857F',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#FAF8F2',
    borderWidth: 1,
    borderColor: '#E8ECE9',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#29332E',
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.round,
    backgroundColor: '#FAF8F2',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7B857F',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.round,
    backgroundColor: '#365B45',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Breathing Modal Card
  breathingModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  breathingOrbContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingOrb: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#365B45',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#365B45',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  breathingPhaseText: {
    color: '#D9EEE5',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  breathingCountText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  breathingInstructions: {
    fontSize: 12.5,
    color: '#7B857F',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

