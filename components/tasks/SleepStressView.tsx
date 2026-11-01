import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Moon,
  Activity,
  Heart,
  Wind,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  Plus,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { SleepState, StressState } from '../../types/tasks';
import {
  getBackendSleep,
  updateBackendSleep,
  getBackendStress,
  updateBackendStress,
} from '../../services/bloomBackend';

interface Props {
  initialTab?: 'sleep' | 'stress';
  onBack?: () => void;
}

export default function SleepStressView({ initialTab = 'sleep', onBack }: Props) {
  const [subView, setSubView] = useState<'sleep' | 'stress'>(initialTab);
  const [sleepState, setSleepState] = useState<SleepState | null>(null);
  const [stressState, setStressState] = useState<StressState | null>(null);
  const [loading, setLoading] = useState(true);

  // Manual Log Sleep Modal
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [manualBedtime, setManualBedtime] = useState('23:15');
  const [manualWakeTime, setManualWakeTime] = useState('07:30');
  const [manualQuality, setManualQuality] = useState(4); // 1-5

  // Breathing Exercise (4-7-8 Technique)
  const [breathActive, setBreathActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathSeconds, setBreathSeconds] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Stress Questionnaire Modal
  const [showStressModal, setShowStressModal] = useState(false);
  const [stressAnswers, setStressAnswers] = useState<number[]>([1, 2, 1, 2]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sl, st] = await Promise.all([getBackendSleep(), getBackendStress()]);
      setSleepState(sl);
      setStressState(st);
    } finally {
      setLoading(false);
    }
  };

  // 4-7-8 Breathing Engine
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (breathActive) {
      timer = setInterval(() => {
        setBreathSeconds((prev) => {
          if (prev <= 1) {
            if (breathPhase === 'Inhale') {
              setBreathPhase('Hold');
              return 7;
            } else if (breathPhase === 'Hold') {
              setBreathPhase('Exhale');
              return 8;
            } else {
              setBreathPhase('Inhale');
              setCompletedCycles((c) => c + 1);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [breathActive, breathPhase]);

  const handleResetBreathing = () => {
    setBreathActive(false);
    setBreathPhase('Inhale');
    setBreathSeconds(4);
  };

  // Save Manual Sleep
  const handleSaveSleep = async () => {
    const [bH, bM] = manualBedtime.split(':').map(Number);
    const [wH, wM] = manualWakeTime.split(':').map(Number);
    let totalMinutes = (wH * 60 + wM) - (bH * 60 + bM);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const hours = Number((totalMinutes / 60).toFixed(1));
    const score = Math.min(100, Math.round((hours / 8) * 70 + manualQuality * 6));

    const updated = await updateBackendSleep({
      actualSleepHours: hours,
      circadianConsistencyScore: score,
      sleepEfficiencyPercent: Math.min(96, Math.round(75 + manualQuality * 4)),
      remMinutes: Math.round(totalMinutes * 0.22),
      deepMinutes: Math.round(totalMinutes * 0.20),
      lightMinutes: Math.round(totalMinutes * 0.58),
    });
    setSleepState(updated);
    setShowSleepModal(false);
  };

  // Save Stress Check
  const handleSaveStressCheck = async () => {
    const sum = stressAnswers.reduce((a, b) => a + b, 0);
    const score = Math.round((sum / 12) * 100);
    const updated = await updateBackendStress(score, stressAnswers);
    setStressState(updated);
    setShowStressModal(false);
  };

  // Toggle Health Connect
  const handleToggleHealthConnect = async () => {
    if (!sleepState) return;
    const updated = await updateBackendSleep({
      healthConnectAuthorized: !sleepState.healthConnectAuthorized,
    });
    setSleepState(updated);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back Button */}
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={18} color={Colors.primaryDark} strokeWidth={2.5} />
          <Text style={styles.backButtonText}>Back to All 13 Modules</Text>
        </TouchableOpacity>
      )}

      {/* Sub Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, subView === 'sleep' && styles.tabBtnActive]}
          onPress={() => setSubView('sleep')}
          activeOpacity={0.8}
        >
          <Moon size={16} color={subView === 'sleep' ? Colors.primaryDark : Colors.mutedText} />
          <Text style={[styles.tabText, subView === 'sleep' && styles.tabTextActive]}>
            Sleep Tracking 🌙
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, subView === 'stress' && styles.tabBtnActive]}
          onPress={() => setSubView('stress')}
          activeOpacity={0.8}
        >
          <Activity size={16} color={subView === 'stress' ? Colors.primaryDark : Colors.mutedText} />
          <Text style={[styles.tabText, subView === 'stress' && styles.tabTextActive]}>
            Stress & HRV 💓
          </Text>
        </TouchableOpacity>
      </View>

      {loading || !sleepState || !stressState ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
      ) : subView === 'sleep' ? (
        /* Sleep Tracking View */
        <View style={styles.sectionCol}>
          {/* Sleep Score Banner */}
          <View style={[styles.card, Shadows.md]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircle}>
                <Moon size={22} color={Colors.primaryDark} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.cardTitle}>Circadian Sleep Score</Text>
                <Text style={styles.cardSubtitle}>
                  Actual: {sleepState.actualSleepHours} hrs • Target: 8h 00m
                </Text>
              </View>
              <View style={styles.scorePill}>
                <Text style={styles.scoreNumber}>{sleepState.circadianConsistencyScore}</Text>
                <Text style={styles.scoreLabel}>/100</Text>
              </View>
            </View>

            {/* Architecture Bars */}
            <Text style={styles.archTitle}>
              Sleep Architecture ({Math.floor(sleepState.actualSleepHours)}h{' '}
              {Math.round((sleepState.actualSleepHours % 1) * 60)}m)
            </Text>
            <View style={styles.archBar}>
              <View style={[styles.archSegment, { width: '22%', backgroundColor: '#7A68A7' }]} />
              <View style={[styles.archSegment, { width: '20%', backgroundColor: '#365B45' }]} />
              <View style={[styles.archSegment, { width: '58%', backgroundColor: '#A8C5B2' }]} />
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#7A68A7' }]} />
                <Text style={styles.legendText}>REM ({sleepState.remMinutes}m)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#365B45' }]} />
                <Text style={styles.legendText}>Deep ({sleepState.deepMinutes}m)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#A8C5B2' }]} />
                <Text style={styles.legendText}>Light ({sleepState.lightMinutes}m)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logSleepBtn}
              onPress={() => setShowSleepModal(true)}
              activeOpacity={0.8}
            >
              <Plus size={15} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.logSleepBtnText}>+ Log Last Night Sleep Manually</Text>
            </TouchableOpacity>
          </View>

          {/* Screen Time & Melatonin Correlation Warning */}
          <View style={[styles.correlationCard, Shadows.sm]}>
            <View style={styles.correlationHeader}>
              <AlertCircle size={20} color="#D49438" strokeWidth={2} />
              <Text style={styles.correlationTitle}>Screen Time vs. Sleep Quality Alert</Text>
            </View>
            <Text style={styles.correlationBody}>
              Late evening screen exposure detected (1h 15m past 10:00 PM). Blue photon wavelength
              delayed natural melatonin release by 35 minutes and reduced deep restorative REM sleep.
            </Text>
            <View style={styles.adviceTag}>
              <Text style={styles.adviceTagText}>
                💡 Recommendation: Activate Bloom Bedtime Mode 45 minutes before sleep to restore 100% REM efficiency.
              </Text>
            </View>
          </View>

          {/* Android Health Connect Sleep Authorization */}
          <View style={[styles.card, Shadows.sm]}>
            <View style={styles.cardHeaderRow}>
              <ShieldCheck size={22} color={Colors.primaryDark} strokeWidth={2} />
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.cardTitle}>Android Health Connect Sync</Text>
                <Text style={styles.cardSubtitle}>Authorized SleepSessionRecord API</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  sleepState.healthConnectAuthorized ? styles.toggleBtnActive : styles.toggleBtnInactive,
                ]}
                onPress={handleToggleHealthConnect}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    sleepState.healthConnectAuthorized ? styles.toggleTextActive : styles.toggleTextInactive,
                  ]}
                >
                  {sleepState.healthConnectAuthorized ? 'AUTHORIZED' : 'LINK SYNC'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        /* Stress & HRV Tracking View */
        <View style={styles.sectionCol}>
          {/* Stress Score Card */}
          <View style={[styles.card, Shadows.md]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFF4E8' }]}>
                <Activity size={22} color="#D49438" strokeWidth={2} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.cardTitle}>Autonomic Stress Level</Text>
                <Text style={styles.cardSubtitle}>{stressState.level}</Text>
              </View>
              <View style={styles.scorePill}>
                <Text style={[styles.scoreNumber, { color: '#D49438' }]}>{stressState.score}</Text>
                <Text style={styles.scoreLabel}>/100</Text>
              </View>
            </View>

            <View style={styles.stressMetricsRow}>
              <View style={styles.stressMetric}>
                <Text style={styles.metricVal}>{stressState.estimatedHrvMs} ms</Text>
                <Text style={styles.metricLabel}>RMSSD HRV</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.stressMetric}>
                <Text style={styles.metricVal}>68 bpm</Text>
                <Text style={styles.metricLabel}>Resting Pulse</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.stressMetric}>
                <Text style={styles.metricVal}>Vagal Active</Text>
                <Text style={styles.metricLabel}>Nervous State</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkinBtn}
              onPress={() => setShowStressModal(true)}
              activeOpacity={0.8}
            >
              <Sparkles size={16} color={Colors.white} strokeWidth={2} />
              <Text style={styles.checkinBtnText}>Take 1-Min Stress Self-Check</Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Vagal Breathing Exercise (4-7-8 Method) */}
          <View style={[styles.card, styles.breathingCard, Shadows.md]}>
            <View style={styles.breathingHeader}>
              <Wind size={22} color={Colors.primaryDark} strokeWidth={2} />
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.cardTitle}>Vagal Nerve Calming (4-7-8 Method)</Text>
                <Text style={styles.cardSubtitle}>
                  Lowers academic heart rate & resets cortisol
                </Text>
              </View>
            </View>

            {/* Visual Animated Breathing Orb */}
            <View style={styles.orbContainer}>
              <View
                style={[
                  styles.breathingOrb,
                  breathPhase === 'Inhale'
                    ? styles.orbInhale
                    : breathPhase === 'Hold'
                    ? styles.orbHold
                    : styles.orbExhale,
                ]}
              >
                <Text style={styles.breathPhaseText}>{breathPhase}</Text>
                <Text style={styles.breathSecondsText}>{breathSeconds}s</Text>
              </View>
            </View>

            <Text style={styles.cycleNotice}>
              Cycles Completed: <Text style={{ fontWeight: '700' }}>{completedCycles}</Text>
            </Text>

            {/* Controls */}
            <View style={styles.breathControls}>
              <TouchableOpacity
                style={[styles.breathActionBtn, breathActive ? styles.btnPause : styles.btnStart]}
                onPress={() => setBreathActive(!breathActive)}
                activeOpacity={0.8}
              >
                {breathActive ? (
                  <Pause size={18} color={Colors.white} strokeWidth={2} />
                ) : (
                  <Play size={18} color={Colors.white} strokeWidth={2} />
                )}
                <Text style={styles.breathActionText}>
                  {breathActive ? 'Pause Exercise' : 'Start 4-7-8 Breathing'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.breathResetBtn}
                onPress={handleResetBreathing}
                activeOpacity={0.8}
              >
                <RotateCcw size={18} color={Colors.darkText} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Manual Sleep Modal */}
      <Modal visible={showSleepModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Night Sleep</Text>
              <TouchableOpacity onPress={() => setShowSleepModal(false)}>
                <X size={20} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Bedtime (HH:mm) *</Text>
            <TextInput
              style={styles.textInput}
              value={manualBedtime}
              onChangeText={setManualBedtime}
            />

            <Text style={styles.inputLabel}>Wake-up Time (HH:mm) *</Text>
            <TextInput
              style={styles.textInput}
              value={manualWakeTime}
              onChangeText={setManualWakeTime}
            />

            <Text style={styles.inputLabel}>Sleep Quality (1 to 5 Stars)</Text>
            <View style={styles.qualityRow}>
              {[1, 2, 3, 4, 5].map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.qualityPill, manualQuality === q && styles.qualityPillActive]}
                  onPress={() => setManualQuality(q)}
                >
                  <Text style={[styles.qualityText, manualQuality === q && styles.qualityTextActive]}>
                    {'⭐'.repeat(q)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={handleSaveSleep}
              activeOpacity={0.8}
            >
              <Text style={styles.submitModalBtnText}>Save & Calculate Score</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Stress Assessment Modal */}
      <Modal visible={showStressModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>PSS Stress Self-Check</Text>
              <TouchableOpacity onPress={() => setShowStressModal(false)}>
                <X size={20} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Rate how often you felt this way over the past 48 hours:
            </Text>

            {[
              'Felt unable to control important academic tasks',
              'Felt nervous and overwhelmed by syllabus deadlines',
              'Felt confident about your ability to handle coursework',
              'Felt that difficulties were piling up too high',
            ].map((q, idx) => (
              <View key={idx} style={styles.questionBox}>
                <Text style={styles.questionText}>{q}</Text>
                <View style={styles.scaleRow}>
                  {['Never (0)', 'Sometimes (1)', 'Fairly Often (2)', 'Very Often (3)'].map(
                    (opt, val) => (
                      <TouchableOpacity
                        key={val}
                        style={[
                          styles.scaleBtn,
                          stressAnswers[idx] === val && styles.scaleBtnActive,
                        ]}
                        onPress={() => {
                          const updated = [...stressAnswers];
                          updated[idx] = val;
                          setStressAnswers(updated);
                        }}
                      >
                        <Text
                          style={[
                            styles.scaleText,
                            stressAnswers[idx] === val && styles.scaleTextActive,
                          ]}
                        >
                          {val}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={handleSaveStressCheck}
              activeOpacity={0.8}
            >
              <Text style={styles.submitModalBtnText}>Calculate Real Stress Score</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  backButtonText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontSize: 13,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.lightSage,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  tabTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  sectionCol: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 15,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.mutedText,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.cream,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  scoreLabel: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  archTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.darkText,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  archBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: Colors.cream,
    marginBottom: Spacing.sm,
  },
  archSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.caption,
    fontSize: 11,
  },
  logSleepBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logSleepBtnText: {
    ...Typography.button,
    fontSize: 13,
  },
  correlationCard: {
    backgroundColor: '#FFF8EC',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FBE2B5',
  },
  correlationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  correlationTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: '#9C6819',
    fontSize: 14,
  },
  correlationBody: {
    ...Typography.bodySmall,
    color: Colors.darkText,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  adviceTag: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  adviceTagText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.darkText,
  },
  toggleBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  toggleBtnActive: {
    backgroundColor: Colors.lightSage,
  },
  toggleBtnInactive: {
    backgroundColor: Colors.cream,
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: Colors.primaryDark,
  },
  toggleTextInactive: {
    color: Colors.mutedText,
  },
  stressMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.lg,
  },
  stressMetric: {
    alignItems: 'center',
  },
  metricVal: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 15,
  },
  metricLabel: {
    ...Typography.caption,
    fontSize: 10,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  checkinBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkinBtnText: {
    ...Typography.button,
    fontSize: 13,
  },
  breathingCard: {
    alignItems: 'center',
  },
  breathingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  orbContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  breathingOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  orbInhale: {
    backgroundColor: '#D9EEE5',
    transform: [{ scale: 1.15 }],
  },
  orbHold: {
    backgroundColor: '#EAE5F4',
    transform: [{ scale: 1.15 }],
  },
  orbExhale: {
    backgroundColor: '#F7E5DA',
    transform: [{ scale: 0.95 }],
  },
  breathPhaseText: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontSize: 16,
  },
  breathSecondsText: {
    ...Typography.h1,
    fontSize: 28,
    color: Colors.primaryDark,
  },
  cycleNotice: {
    ...Typography.caption,
    color: Colors.mutedText,
    marginBottom: Spacing.md,
  },
  breathControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  breathActionBtn: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  btnStart: {
    backgroundColor: Colors.primary,
  },
  btnPause: {
    backgroundColor: '#D49438',
  },
  breathActionText: {
    ...Typography.button,
    fontSize: 14,
  },
  breathResetBtn: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    ...Typography.h2,
    fontSize: 18,
  },
  modalSubtitle: {
    ...Typography.caption,
    color: Colors.mutedText,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 4,
    marginTop: Spacing.xs,
  },
  textInput: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Typography.body,
    fontSize: 14,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.md,
  },
  qualityPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qualityPillActive: {
    backgroundColor: Colors.lightSage,
    borderColor: Colors.primary,
  },
  qualityText: {
    fontSize: 10,
  },
  qualityTextActive: {
    fontWeight: '700',
  },
  questionBox: {
    marginBottom: Spacing.sm,
  },
  questionText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 4,
  },
  scaleRow: {
    flexDirection: 'row',
    gap: 4,
  },
  scaleBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scaleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  scaleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  scaleTextActive: {
    color: Colors.white,
  },
  submitModalBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitModalBtnText: {
    ...Typography.button,
  },
});
