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
import {
  ChevronLeft,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Sparkles,
  BookOpen,
  X,
  Play,
  Pause,
  RotateCcw,
  ClipboardList,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TaskItem {
  id: string;
  title: string;
  courseTag: string;
  timestamp: string;
  completed: boolean;
  type: 'daily' | 'weekly';
}

const INITIAL_DAILY_TASKS: TaskItem[] = [
  {
    id: 'dt-1',
    title: 'Read Bio Chapter 4: Cellular Respiration',
    courseTag: 'Biology 101',
    timestamp: '10:30 AM',
    completed: true,
    type: 'daily',
  },
  {
    id: 'dt-2',
    title: 'Calculus problem set #3 derivations',
    courseTag: 'MATH 204',
    timestamp: '1:15 PM',
    completed: true,
    type: 'daily',
  },
  {
    id: 'dt-3',
    title: 'Review Psychology flashcards (Memory systems)',
    courseTag: 'PSYCH 101',
    timestamp: '3:45 PM',
    completed: true,
    type: 'daily',
  },
  {
    id: 'dt-4',
    title: 'Draft Chemistry titration lab observation summary',
    courseTag: 'CHEM 220',
    timestamp: '5:00 PM',
    completed: false,
    type: 'daily',
  },
];

const INITIAL_WEEKLY_TASKS: TaskItem[] = [
  {
    id: 'wt-1',
    title: 'Complete Algorithms Term Project Phase 1 (Graph traversal)',
    courseTag: 'CS 301',
    timestamp: 'Due Friday',
    completed: false,
    type: 'weekly',
  },
  {
    id: 'wt-2',
    title: 'Write Literature Review Draft for Behavioral Psychology',
    courseTag: 'PSYCH 101',
    timestamp: 'Due Thursday',
    completed: true,
    type: 'weekly',
  },
  {
    id: 'wt-3',
    title: 'Prepare Midterm Comprehensive Study Guide for Macroeconomics',
    courseTag: 'ECON 102',
    timestamp: 'Due Sunday',
    completed: false,
    type: 'weekly',
  },
];

export default function StudentTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 20 : 16);

  // Active tab: 'daily' or 'weekly'
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  // Task lists
  const [dailyTasks, setDailyTasks] = useState<TaskItem[]>(INITIAL_DAILY_TASKS);
  const [weeklyTasks, setWeeklyTasks] = useState<TaskItem[]>(INITIAL_WEEKLY_TASKS);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);

  // New task form state
  const [newTaskName, setNewTaskName] = useState('');
  const [newCourseTag, setNewCourseTag] = useState('');
  const [newTaskType, setNewTaskType] = useState<'daily' | 'weekly'>('daily');
  const [newTimeEstimate, setNewTimeEstimate] = useState('45m');

  // Focus Mode Timer State
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusActive, setFocusActive] = useState(false);

  const toggleTask = (id: string, type: 'daily' | 'weekly') => {
    if (type === 'daily') {
      setDailyTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
    } else {
      setWeeklyTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
    }
  };

  const handleCreateTask = () => {
    if (!newTaskName.trim()) return;
    const item: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskName.trim(),
      courseTag: newCourseTag.trim() || (newTaskType === 'daily' ? 'General Study' : 'Major Milestone'),
      timestamp: newTaskType === 'daily' ? 'Today' : 'This Week',
      completed: false,
      type: newTaskType,
    };

    if (newTaskType === 'daily') {
      setDailyTasks((prev) => [item, ...prev]);
    } else {
      setWeeklyTasks((prev) => [item, ...prev]);
    }

    setNewTaskName('');
    setNewCourseTag('');
    setShowAddModal(false);
  };

  // Calculations for Rhythm card
  const completedDailyCount = dailyTasks.filter((t) => t.completed).length;
  const totalDailyCount = dailyTasks.length;
  const dailyProgressPercent = totalDailyCount > 0 ? Math.round((completedDailyCount / totalDailyCount) * 100) : 75;

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
          <Text style={styles.headerTitle}>Tasks</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.assignmentsShortcutBtn}
            onPress={() => router.push('/tasks/assignments' as any)}
            activeOpacity={0.8}
          >
            <ClipboardList size={15} color="#365B45" strokeWidth={2.2} />
            <Text style={styles.assignmentsShortcutText}>Assignments</Text>
          </TouchableOpacity>

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
        {/* ── Segmented Top Controls ────────────────────────────────────── */}
        <View style={styles.controlsRow}>
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                activeTab === 'daily' && styles.segmentBtnActive,
              ]}
              onPress={() => setActiveTab('daily')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTab === 'daily' && styles.segmentTextActive,
                ]}
              >
                Daily Task
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                activeTab === 'weekly' && styles.segmentBtnActive,
              ]}
              onPress={() => setActiveTab('weekly')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTab === 'weekly' && styles.segmentTextActive,
                ]}
              >
                Week Task
              </Text>
            </TouchableOpacity>
          </View>

          {/* Focus Mode Shortcut Pill */}
          <TouchableOpacity
            style={styles.focusModePill}
            onPress={() => setShowFocusModal(true)}
            activeOpacity={0.8}
          >
            <Flame size={14} color="#F97316" strokeWidth={2.5} />
            <Text style={styles.focusModeText}>Focus Mode</Text>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── DAILY TASK TAB VIEW ───────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'daily' ? (
          <>
            {/* Today's Rhythm Progress Card */}
            <View style={[styles.rhythmCard, Shadows.sm]}>
              <View style={styles.rhythmHeaderRow}>
                <Text style={styles.rhythmHeading}>Today's Rhythm</Text>
                <View style={styles.rhythmBadge}>
                  <Text style={styles.rhythmBadgeText}>
                    {completedDailyCount} of {totalDailyCount} completed
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.rhythmProgressTrack}>
                <View
                  style={[
                    styles.rhythmProgressBar,
                    { width: `${dailyProgressPercent}%` },
                  ]}
                />
              </View>

              <Text style={styles.rhythmPaceNote}>
                Steady pace maintained today. Focus stamina remains strong.
              </Text>

              <View style={styles.breathingReminderBox}>
                <Sparkles size={14} color="#365B45" strokeWidth={2.2} />
                <Text style={styles.breathingReminderText}>
                  Breathing pause recommended (2 min) before next block.
                </Text>
              </View>
            </View>

            {/* Quiet Inspiration Banner */}
            <View style={[styles.inspirationBanner, Shadows.sm]}>
              <Text style={styles.inspirationQuote}>
                "One thoughtful step at a time."
              </Text>
              <Text style={styles.inspirationSubtitle}>
                Calm academic focus — Study Sanctuary
              </Text>
            </View>

            {/* Active Tasks Section Heading */}
            <View style={styles.tasksSectionHeader}>
              <Text style={styles.tasksHeading}>
                Active Tasks ({dailyTasks.length} items)
              </Text>
            </View>

            {/* Daily Task Cards List */}
            <View style={styles.taskListContainer}>
              {dailyTasks.map((task) => (
                <View key={task.id} style={[styles.taskCard, Shadows.sm]}>
                  {/* Left Checkbox */}
                  <TouchableOpacity
                    style={styles.taskCheckTouch}
                    onPress={() => toggleTask(task.id, 'daily')}
                    activeOpacity={0.7}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={22} color="#6AAF7D" strokeWidth={2.4} />
                    ) : (
                      <Circle size={22} color="#7B857F" strokeWidth={1.8} />
                    )}
                  </TouchableOpacity>

                  {/* Middle Description & Course */}
                  <View style={styles.taskContentCol}>
                    <Text
                      style={[
                        styles.taskTitleText,
                        task.completed && styles.taskTitleCompleted,
                      ]}
                    >
                      {task.title}
                    </Text>

                    <View style={styles.taskMetaRow}>
                      <View style={styles.courseTagPill}>
                        <Text style={styles.courseTagText}>{task.courseTag}</Text>
                      </View>
                      <View style={styles.timeTagRow}>
                        <Clock size={11} color="#7B857F" />
                        <Text style={styles.timeTagText}>{task.timestamp}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          /* ═══════════════════════════════════════════════════════════════ */
          /* ── WEEK TASK TAB VIEW ───────────────────────────────────────── */
          /* ═══════════════════════════════════════════════════════════════ */
          <>
            {/* Weekly Overview Card */}
            <View style={[styles.rhythmCard, Shadows.sm]}>
              <View style={styles.rhythmHeaderRow}>
                <Text style={styles.rhythmHeading}>Weekly Milestones</Text>
                <View style={styles.rhythmBadge}>
                  <Text style={styles.rhythmBadgeText}>
                    {weeklyTasks.filter((t) => t.completed).length} of {weeklyTasks.length} done
                  </Text>
                </View>
              </View>

              <View style={styles.rhythmProgressTrack}>
                <View
                  style={[
                    styles.rhythmProgressBar,
                    {
                      width: `${
                        weeklyTasks.length > 0
                          ? Math.round(
                              (weeklyTasks.filter((t) => t.completed).length /
                                weeklyTasks.length) *
                                100
                            )
                          : 0
                      }%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.rhythmPaceNote}>
                Major coursework milestones prioritized for this semester cycle.
              </Text>
            </View>

            {/* Weekly Tasks Section Heading */}
            <View style={styles.tasksSectionHeader}>
              <Text style={styles.tasksHeading}>
                Weekly Tasks ({weeklyTasks.length} major items)
              </Text>
            </View>

            {/* Weekly Task Cards List (hiding all daily micro-tasks) */}
            <View style={styles.taskListContainer}>
              {weeklyTasks.map((task) => (
                <View key={task.id} style={[styles.taskCard, Shadows.sm]}>
                  <TouchableOpacity
                    style={styles.taskCheckTouch}
                    onPress={() => toggleTask(task.id, 'weekly')}
                    activeOpacity={0.7}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={22} color="#6AAF7D" strokeWidth={2.4} />
                    ) : (
                      <Circle size={22} color="#7B857F" strokeWidth={1.8} />
                    )}
                  </TouchableOpacity>

                  <View style={styles.taskContentCol}>
                    <Text
                      style={[
                        styles.taskTitleText,
                        task.completed && styles.taskTitleCompleted,
                      ]}
                    >
                      {task.title}
                    </Text>

                    <View style={styles.taskMetaRow}>
                      <View style={styles.courseTagPill}>
                        <Text style={styles.courseTagText}>{task.courseTag}</Text>
                      </View>
                      <View style={styles.timeTagRow}>
                        <Clock size={11} color="#7B857F" />
                        <Text style={styles.timeTagText}>{task.timestamp}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Floating Action Button (FAB) ───────────────────────────────── */}
      <TouchableOpacity
        style={[styles.fabButton, Shadows.md]}
        onPress={() => {
          setNewTaskType(activeTab);
          setShowAddModal(true);
        }}
        activeOpacity={0.85}
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* ── Add New Task Modal ─────────────────────────────────────────── */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add Student Task</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={20} color="#7B857F" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>TASK DESCRIPTION</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Read Bio Chapter 4 or Draft Essay"
              placeholderTextColor="#7B857F"
              value={newTaskName}
              onChangeText={setNewTaskName}
            />

            <Text style={styles.inputLabel}>COURSE / SUBJECT CODE</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Biology 101 or MATH 204"
              placeholderTextColor="#7B857F"
              value={newCourseTag}
              onChangeText={setNewCourseTag}
            />

            <Text style={styles.inputLabel}>TASK TYPE</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  newTaskType === 'daily' && styles.toggleBtnActive,
                ]}
                onPress={() => setNewTaskType('daily')}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    newTaskType === 'daily' && styles.toggleBtnTextActive,
                  ]}
                >
                  Daily Task (Micro)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  newTaskType === 'weekly' && styles.toggleBtnActive,
                ]}
                onPress={() => setNewTaskType('weekly')}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    newTaskType === 'weekly' && styles.toggleBtnTextActive,
                  ]}
                >
                  Week Task (Milestone)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreateTask}
              >
                <Text style={styles.saveBtnText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Focus Mode Modal (Feature 9) ──────────────────────────────── */}
      <Modal
        visible={showFocusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFocusModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.focusModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Flame size={20} color="#F97316" strokeWidth={2.2} />
                <Text style={styles.modalTitle}>Focus Session</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFocusModal(false)}>
                <X size={20} color="#7B857F" />
              </TouchableOpacity>
            </View>

            <Text style={styles.focusModalDesc}>
              Deep study Pomodoro block. Mutes distracting notifications.
            </Text>

            <Text style={styles.focusTimerDigits}>
              {Math.floor(focusSeconds / 60).toString().padStart(2, '0')}:
              {(focusSeconds % 60).toString().padStart(2, '0')}
            </Text>

            <View style={styles.focusButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.focusStartBtn,
                  focusActive ? { backgroundColor: '#7B857F' } : { backgroundColor: '#365B45' },
                ]}
                onPress={() => setFocusActive(!focusActive)}
              >
                {focusActive ? (
                  <Pause size={16} color="#FFFFFF" />
                ) : (
                  <Play size={16} color="#FFFFFF" />
                )}
                <Text style={styles.focusStartText}>
                  {focusActive ? 'Pause' : 'Start Focus'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.focusResetBtn}
                onPress={() => {
                  setFocusActive(false);
                  setFocusSeconds(25 * 60);
                }}
              >
                <RotateCcw size={16} color="#365B45" />
                <Text style={styles.focusResetText}>Reset</Text>
              </TouchableOpacity>
            </View>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#29332E',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  assignmentsShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    gap: 5,
  },
  assignmentsShortcutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
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
    paddingTop: 8,
  },

  // Segmented Controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.round,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  segmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
  },
  segmentBtnActive: {
    backgroundColor: '#365B45',
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#7B857F',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  focusModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECE9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    gap: 6,
  },
  focusModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F97316',
  },

  // Rhythm Card
  rhythmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  rhythmHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rhythmHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#29332E',
  },
  rhythmBadge: {
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  rhythmBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },
  rhythmProgressTrack: {
    height: 8,
    backgroundColor: '#FAF8F2',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  rhythmProgressBar: {
    height: '100%',
    backgroundColor: '#789B83',
    borderRadius: 4,
  },
  rhythmPaceNote: {
    fontSize: 12,
    color: '#7B857F',
    lineHeight: 16,
    marginBottom: 10,
  },
  breathingReminderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F2',
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  breathingReminderText: {
    fontSize: 11.5,
    color: '#365B45',
    fontWeight: '600',
  },

  // Inspiration Banner
  inspirationBanner: {
    backgroundColor: '#D9EEE5',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#CDE5DB',
    alignItems: 'center',
  },
  inspirationQuote: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
    color: '#365B45',
    textAlign: 'center',
    marginBottom: 4,
  },
  inspirationSubtitle: {
    fontSize: 11,
    color: '#789B83',
    fontWeight: '500',
  },

  // Active Tasks
  tasksSectionHeader: {
    marginBottom: 12,
  },
  tasksHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#29332E',
  },
  taskListContainer: {
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  taskCheckTouch: {
    paddingRight: 12,
  },
  taskContentCol: {
    flex: 1,
  },
  taskTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#29332E',
    marginBottom: 6,
    lineHeight: 18,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#7B857F',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  courseTagPill: {
    backgroundColor: '#FAF8F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  courseTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#365B45',
  },
  timeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    fontSize: 11,
    color: '#7B857F',
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
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.round,
    backgroundColor: '#FAF8F2',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  toggleBtnActive: {
    backgroundColor: '#D9EEE5',
    borderColor: '#789B83',
  },
  toggleBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7B857F',
  },
  toggleBtnTextActive: {
    color: '#365B45',
    fontWeight: '700',
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

  // Focus Modal
  focusModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  focusModalDesc: {
    fontSize: 12.5,
    color: '#7B857F',
    textAlign: 'center',
    marginBottom: 16,
  },
  focusTimerDigits: {
    fontSize: 52,
    fontWeight: '800',
    color: '#F97316',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 12,
  },
  focusButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 10,
  },
  focusStartBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.round,
    gap: 6,
  },
  focusStartText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  focusResetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9EEE5',
    paddingVertical: 12,
    borderRadius: BorderRadius.round,
    gap: 6,
  },
  focusResetText: {
    color: '#365B45',
    fontSize: 13,
    fontWeight: '700',
  },
});

