import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  Animated,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Quote,
  Hourglass,
  CheckSquare,
  Moon,
  Target,
  Sparkles,
  ArrowRight,
  Plus,
  CheckCircle2,
  Circle,
  X,
  User,
  HeartPulse,
  Flame,
  AlertOctagon,
  Watch,
  Layout,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';
import AssignmentTracker from '../../../components/tasks/AssignmentTracker';
import StudentTasksView from '../../../components/tasks/StudentTasksView';
import SleepStressView from '../../../components/tasks/SleepStressView';
import SafetyHardwareView from '../../../components/tasks/SafetyHardwareView';
import {
  getBackendTasks,
  saveBackendTask,
  toggleBackendTask,
} from '../../../services/bloomBackend';
import { StudentTask } from '../../../types/tasks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 10 Curated Student Wellness Quotes
const WELLNESS_QUOTES = [
  'Small daily efforts compound into lifelong clarity and calm.',
  'Rest is not a reward for work; it is a prerequisite for presence.',
  'Breathe through the semester. Focus on progress over perfection.',
  'Gentle boundaries with your screen protect your deepest creativity.',
  'One mindful step today prepares you for a peaceful tomorrow.',
  'Your worth is not measured by the speed of your productivity.',
  'Honor your natural biorhythms—sleep is your greatest academic ally.',
  'Create pockets of quiet in a loud, digital world.',
  'Curiosity blossoms when the mind is well-rested.',
  'Be kind to your pace; growth happens beneath the surface first.',
];

export default function TasksMainHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 20 : 16);

  // Quote Ticker Automated Rightward Movement State
  const [quoteIdx, setQuoteIdx] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Active detail modal for Student Tasks, Sleep, Habits
  const [activeDetailModule, setActiveDetailModule] = useState<
    'student_task' | 'sleep' | 'habits' | 'more' | null
  >(null);

  // Quick tasks list & typing input
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [quickInput, setQuickInput] = useState('');
  const [pendingCount, setPendingCount] = useState(3);

  // Load local tasks and real-time assignment counts
  useEffect(() => {
    getBackendTasks().then(setTasks);

    AsyncStorage.getItem('@bloom_assignments_list').then((raw: string | null) => {
      if (raw) {
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const pending = list.filter((a: any) => a.status === 'pending');
            setPendingCount(pending.length);
          }
        } catch {}
      }
    });
  }, [activeDetailModule]);

  // Automated quote ticker: moves automatically to the right side every 4.5 seconds
  useEffect(() => {
    let isMounted = true;

    const timer = setInterval(() => {
      // 1. Slide quote out to the right (+50) with fade out
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 50,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!isMounted) return;
        // 2. Advance to next quote
        setQuoteIdx((prev) => (prev + 1) % WELLNESS_QUOTES.length);
        // 3. Reset position to left (-50)
        translateX.setValue(-50);
        // 4. Slide in smoothly from left towards right (0) with fade in
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 4500);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [translateX, fadeAnim]);

  // Quick Add task
  const handleQuickAdd = async () => {
    if (!quickInput.trim()) return;
    const newTask: StudentTask = {
      id: `st-${Date.now()}`,
      title: quickInput.trim(),
      period: 'daily',
      category: 'Study',
      priority: 'high',
      completed: false,
      timeEstimateMinutes: 30,
      createdAt: new Date().toISOString(),
    };
    const updated = await saveBackendTask(newTask);
    setTasks(updated);
    setQuickInput('');
  };

  const handleToggleTask = async (id: string) => {
    const updated = await toggleBackendTask(id);
    setTasks(updated);
  };

  // 2x2 Card Width calculation
  const cardWidth = (SCREEN_WIDTH - Spacing.xl * 2 - 14) / 2;

  return (
    <View style={styles.screen}>
      {/* ── 1. Top Header ─────────────────────────────────────────────── */}
      <View style={[styles.headerContainer, { paddingTop: topPadding }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#29332E" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tasks</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerFilterBtn}
            activeOpacity={0.7}
            onPress={() => setActiveDetailModule('more')}
          >
            <SlidersHorizontal size={18} color="#29332E" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileAvatar}
            activeOpacity={0.7}
            onPress={() => router.push('/ai')}
          >
            <Text style={styles.avatarInitial}>K</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 2. Top Rotating Quote Ticker Card ────────────────────────── */}
        <View style={[styles.quoteCardContainer, Shadows.sm]}>
          {/* Left Circular Quote Badge */}
          <View style={styles.quoteIconBadge}>
            <Quote size={18} color="#365B45" strokeWidth={2.4} />
          </View>

          {/* Middle Animated Quote Text Moving Automatically to the Right */}
          <Animated.View
            style={[
              styles.quoteTextWrap,
              {
                opacity: fadeAnim,
                transform: [{ translateX }],
              },
            ]}
          >
            <Text style={styles.quoteText}>
              "{WELLNESS_QUOTES[quoteIdx]}"
            </Text>
          </Animated.View>

          {/* Right Automated Status Pill (No manual pressing needed) */}
          <View style={styles.quoteAutoPill}>
            <View style={styles.autoPulsingDot} />
            <Text style={styles.quoteAutoText}>
              {quoteIdx + 1}/{WELLNESS_QUOTES.length}
            </Text>
          </View>
        </View>

        {/* ── 3. 2x2 Dashboard Grid Cards ──────────────────────────────── */}
        <View style={styles.gridSection}>
          <Text style={styles.sectionHeaderTitle}>Dashboard Overview</Text>

          <View style={styles.gridContainer}>
            {/* Card 1: Screen Time */}
            <TouchableOpacity
              style={[styles.gridCard, { width: cardWidth }, Shadows.sm]}
              activeOpacity={0.8}
              onPress={() => router.push('/tasks/screen-time' as any)}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#D9EEE5' }]}>
                  <Hourglass size={18} color="#365B45" strokeWidth={2.2} />
                </View>
                <View style={styles.cardBadgeMint}>
                  <Text style={styles.cardBadgeMintText}>4h 31m</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Screen Time</Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                Monitor usage & set limits
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardOpenLabel}>Open</Text>
                <ArrowRight size={13} color="#365B45" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            {/* Card 2: Student Task */}
            <TouchableOpacity
              style={[styles.gridCard, { width: cardWidth }, Shadows.sm]}
              activeOpacity={0.8}
              onPress={() => router.push('/tasks/student-task' as any)}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#D9EEE5' }]}>
                  <CheckSquare size={18} color="#365B45" strokeWidth={2.2} />
                </View>
                <View style={styles.cardBadgeMint}>
                  <Text style={styles.cardBadgeMintText}>{pendingCount} pending</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Student Task</Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                Assignments & daily to-dos
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardOpenLabel}>Open</Text>
                <ArrowRight size={13} color="#365B45" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            {/* Card 3: Sleep Tracking */}
            <TouchableOpacity
              style={[styles.gridCard, { width: cardWidth }, Shadows.sm]}
              activeOpacity={0.8}
              onPress={() => router.push('/tasks/tracking' as any)}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#D9EEE5' }]}>
                  <Moon size={18} color="#365B45" strokeWidth={2.2} />
                </View>
                <View style={styles.cardBadgeMint}>
                  <Text style={styles.cardBadgeMintText}>7h 45m</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Sleep Tracking</Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                Rest cycles & night patterns
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardOpenLabel}>Open</Text>
                <ArrowRight size={13} color="#365B45" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            {/* Card 4: Goals & Habits */}
            <TouchableOpacity
              style={[styles.gridCard, { width: cardWidth }, Shadows.sm]}
              activeOpacity={0.8}
              onPress={() => router.push('/tasks/goals' as any)}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#D9EEE5' }]}>
                  <Target size={18} color="#365B45" strokeWidth={2.2} />
                </View>
                <View style={styles.cardBadgeMint}>
                  <Text style={styles.cardBadgeMintText}>4 on track</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Goals & Habits</Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                Personal growth & milestones
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardOpenLabel}>Open</Text>
                <ArrowRight size={13} color="#365B45" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Assignments Quick Card Link ─────────────────────────────── */}
        <TouchableOpacity
          style={[styles.assignmentsCardLink, Shadows.sm]}
          onPress={() => router.push('/tasks/assignments' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.assignmentsLinkLeft}>
            <View style={styles.assignmentsIconCircle}>
              <CheckSquare size={18} color="#365B45" strokeWidth={2.2} />
            </View>
            <View>
              <Text style={styles.assignmentsLinkTitle}>Assignments & Course Deadlines</Text>
              <Text style={styles.assignmentsLinkSub}>
                {pendingCount} pending submissions • Next due tomorrow
              </Text>
            </View>
          </View>
          <ArrowRight size={16} color="#365B45" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* ── 4. Interactive Quick Task Typing Bar ─────────────────────── */}
        <View style={[styles.quickTaskCard, Shadows.sm]}>
          <Text style={styles.quickCardHeading}>Daily Action Checklist</Text>
          <View style={styles.inputInnerRow}>
            <TextInput
              style={styles.quickInput}
              placeholder="Type to add a coursework task..."
              placeholderTextColor="#7B857F"
              value={quickInput}
              onChangeText={setQuickInput}
              onSubmitEditing={handleQuickAdd}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.quickAddButton, !quickInput.trim() && { opacity: 0.5 }]}
              onPress={handleQuickAdd}
              disabled={!quickInput.trim()}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Quick list of today's tasks */}
          <View style={styles.quickTasksList}>
            {tasks.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.taskRowItem}
                onPress={() => handleToggleTask(item.id)}
                activeOpacity={0.7}
              >
                {item.completed ? (
                  <CheckCircle2 size={18} color="#6AAF7D" strokeWidth={2.2} />
                ) : (
                  <Circle size={18} color="#7B857F" strokeWidth={1.8} />
                )}
                <Text
                  style={[styles.taskItemLabel, item.completed && styles.taskItemLabelDone]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 5. Quick Access to Hardware & Safety ─────────────────────── */}
        <TouchableOpacity
          style={[styles.moreModulesBanner, Shadows.sm]}
          onPress={() => setActiveDetailModule('more')}
          activeOpacity={0.8}
        >
          <View style={styles.moreLeft}>
            <View style={styles.moreIconBox}>
              <HeartPulse size={18} color="#365B45" strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.moreTitle}>Hardware & Emergency Hub</Text>
              <Text style={styles.moreDesc}>SOS Signal, Smartwatch BLE & Health Connect</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#7B857F" />
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── 6. Floating AI Assistant Button (Bottom Right) ───────────── */}
      {/* TODO: Connect trigger to Keerthana's AI Companion module (Bloom/Home-AI) */}
      <TouchableOpacity
        style={[styles.floatingAiButton, Shadows.md]}
        activeOpacity={0.85}
        onPress={() => router.push('/ai')}
      >
        <View style={styles.aiGlowRing} />
        <View style={styles.aiInnerAvatar}>
          <Sparkles size={24} color="#FFFFFF" strokeWidth={2} />
        </View>
      </TouchableOpacity>

      {/* ── 7. Module Detail Modal (for Student Tasks, Sleep, Habits, SOS) ── */}
      <Modal
        visible={activeDetailModule !== null}
        animationType="slide"
        onRequestClose={() => setActiveDetailModule(null)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: topPadding }]}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActiveDetailModule(null)}
            >
              <ChevronLeft size={22} color="#29332E" strokeWidth={2.5} />
              <Text style={styles.modalCloseText}>Back to Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveDetailModule(null)}
              style={styles.closeIconCircle}
            >
              <X size={18} color="#29332E" />
            </TouchableOpacity>
          </View>

          {activeDetailModule === 'student_task' && (
            <AssignmentTracker onBack={() => setActiveDetailModule(null)} />
          )}

          {activeDetailModule === 'sleep' && (
            <SleepStressView initialTab="sleep" onBack={() => setActiveDetailModule(null)} />
          )}

          {activeDetailModule === 'habits' && (
            <StudentTasksView initialTab="habits" onBack={() => setActiveDetailModule(null)} />
          )}

          {activeDetailModule === 'more' && (
            <SafetyHardwareView initialTab="sos" onBack={() => setActiveDetailModule(null)} />
          )}
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
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#29332E', // Dark Slate
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerFilterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D9EEE5', // Soft Mint
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#789B83',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#365B45', // Dark Forest Green
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
  },

  // Quote Ticker Card
  quoteCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9EEE5', // Soft Mint Tint
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#CDE5DB',
  },
  quoteIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quoteTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#29332E',
    lineHeight: 18,
    fontWeight: '500',
  },
  quoteAutoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.round,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 5,
  },
  autoPulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#365B45',
  },
  quoteAutoText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#365B45',
  },

  // 2x2 Grid Section
  gridSection: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#29332E',
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  gridCard: {
    backgroundColor: '#FFFFFF', // Pure White
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeMint: {
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  cardBadgeMintText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#29332E',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: '#7B857F', // Muted Grey
    lineHeight: 16,
    minHeight: 32,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 10,
    gap: 4,
  },
  cardOpenLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#365B45',
  },

  // Quick Task Card
  quickTaskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  quickCardHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#29332E',
    marginBottom: 10,
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F2',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    marginBottom: 10,
  },
  quickInput: {
    flex: 1,
    fontSize: 13,
    color: '#29332E',
    paddingVertical: 4,
  },
  quickAddButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#365B45',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  quickTasksList: {
    gap: 8,
  },
  taskRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  taskItemLabel: {
    fontSize: 13,
    color: '#29332E',
    flex: 1,
  },
  taskItemLabelDone: {
    textDecorationLine: 'line-through',
    color: '#7B857F',
  },

  // More Modules Banner
  moreModulesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  moreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moreIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D9EEE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#29332E',
  },
  moreDesc: {
    fontSize: 11,
    color: '#7B857F',
    marginTop: 2,
  },

  // Assignments Quick Card Link
  assignmentsCardLink: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  assignmentsLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  assignmentsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D9EEE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentsLinkTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#29332E',
  },
  assignmentsLinkSub: {
    fontSize: 12,
    color: '#7B857F',
    marginTop: 2,
  },

  // Floating AI Assistant Button
  floatingAiButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#365B45',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  aiGlowRing: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: 'rgba(120, 155, 131, 0.4)',
  },
  aiInnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#789B83',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Container
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: '#FAF8F2',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECE9',
  },
  modalCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#29332E',
  },
  closeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
});

