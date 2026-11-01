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
  ListChecks,
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  Flame,
  Target,
  Clock,
  Sparkles,
  X,
  BookOpen,
  Heart,
  Droplet,
  Sun,
  Moon,
  Trash2,
  ChevronLeft,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { StudentTask, HabitItem } from '../../types/tasks';
import {
  getBackendTasks,
  saveBackendTask,
  toggleBackendTask,
  deleteBackendTask,
  getBackendHabits,
  toggleBackendHabit,
  addBackendHabit,
} from '../../services/bloomBackend';

interface Props {
  initialTab?: 'daily' | 'weekly' | 'habits';
  onBack?: () => void;
}

export default function StudentTasksView({ initialTab = 'daily', onBack }: Props) {
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'weekly' | 'habits'>(initialTab);

  // Add Task Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<'Study' | 'Exam Prep' | 'Wellness' | 'Routine'>('Study');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskPeriod, setTaskPeriod] = useState<'daily' | 'weekly'>('daily');
  const [taskDuration, setTaskDuration] = useState('30');

  // Add Habit Modal
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitTarget, setHabitTarget] = useState('Daily consistency goal');

  // Inline Quick Add state
  const [inlineInputText, setInlineInputText] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [t, h] = await Promise.all([getBackendTasks(), getBackendHabits()]);
      setTasks(t);
      setHabits(h);
    } finally {
      setLoading(false);
    }
  };

  const handleInlineQuickAdd = async () => {
    if (!inlineInputText.trim()) return;
    if (activeSubTab === 'habits') {
      const updated = await addBackendHabit(inlineInputText.trim(), 'Daily consistency goal');
      setHabits(updated);
    } else {
      const newTask: StudentTask = {
        id: `st-${Date.now()}`,
        title: inlineInputText.trim(),
        period: activeSubTab === 'weekly' ? 'weekly' : 'daily',
        category: 'Study',
        priority: 'high',
        completed: false,
        timeEstimateMinutes: 30,
        createdAt: new Date().toISOString(),
      };
      const updated = await saveBackendTask(newTask);
      setTasks(updated);
    }
    setInlineInputText('');
  };

  // Toggle Task Completion
  const handleToggleTask = async (id: string) => {
    const updated = await toggleBackendTask(id);
    setTasks(updated);
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    const updated = await deleteBackendTask(id);
    setTasks(updated);
  };

  // Toggle Habit
  const handleToggleHabit = async (id: string) => {
    const updated = await toggleBackendHabit(id);
    setHabits(updated);
  };

  // Add Task Handler
  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;
    const newTask: StudentTask = {
      id: `st-${Date.now()}`,
      title: taskTitle.trim(),
      period: taskPeriod,
      category: taskCategory,
      priority: taskPriority,
      completed: false,
      timeEstimateMinutes: parseInt(taskDuration, 10) || 30,
      createdAt: new Date().toISOString(),
    };
    const updated = await saveBackendTask(newTask);
    setTasks(updated);
    setTaskTitle('');
    setShowAddModal(false);
  };

  // Add Habit Handler
  const handleAddHabit = async () => {
    if (!habitName.trim()) return;
    const updated = await addBackendHabit(habitName.trim(), habitTarget.trim());
    setHabits(updated);
    setHabitName('');
    setShowHabitModal(false);
  };

  // Calculations
  const dailyTasks = tasks.filter((t) => t.period === 'daily');
  const weeklyTasks = tasks.filter((t) => t.period === 'weekly');
  const completedDaily = dailyTasks.filter((t) => t.completed).length;
  const dailyPercent = dailyTasks.length > 0 ? Math.round((completedDaily / dailyTasks.length) * 100) : 0;

  const completedWeekly = weeklyTasks.filter((t) => t.completed).length;
  const weeklyPercent = weeklyTasks.length > 0 ? Math.round((completedWeekly / weeklyTasks.length) * 100) : 0;

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
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'daily' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('daily')}
          activeOpacity={0.8}
        >
          <Text style={[styles.subTabText, activeSubTab === 'daily' && styles.subTabTextActive]}>
            Daily Tasks ({completedDaily}/{dailyTasks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'weekly' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('weekly')}
          activeOpacity={0.8}
        >
          <Text style={[styles.subTabText, activeSubTab === 'weekly' && styles.subTabTextActive]}>
            Weekly Tasks ({completedWeekly}/{weeklyTasks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'habits' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('habits')}
          activeOpacity={0.8}
        >
          <Text style={[styles.subTabText, activeSubTab === 'habits' && styles.subTabTextActive]}>
            Habits & Goals 🔥
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Card */}
      <View style={[styles.progressCard, Shadows.sm]}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressCardTitle}>
            {activeSubTab === 'daily'
              ? "Today's Academic Pace"
              : activeSubTab === 'weekly'
              ? 'Weekly Pacing & Exam Milestones'
              : 'Habit Consistency Score'}
          </Text>
          <Text style={styles.progressPercentText}>
            {activeSubTab === 'daily'
              ? `${dailyPercent}%`
              : activeSubTab === 'weekly'
              ? `${weeklyPercent}%`
              : `${Math.round((habits.filter((h) => h.completedToday).length / habits.length) * 100)}%`}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${
                  activeSubTab === 'daily'
                    ? dailyPercent
                    : activeSubTab === 'weekly'
                    ? weeklyPercent
                    : Math.round((habits.filter((h) => h.completedToday).length / habits.length) * 100)
                }%`,
              },
            ]}
          />
        </View>

        <View style={styles.progressFooter}>
          <Text style={styles.progressFooterText}>
            {activeSubTab === 'daily'
              ? `${dailyTasks.length - completedDaily} tasks remaining for today.`
              : activeSubTab === 'weekly'
              ? `${weeklyTasks.length - completedWeekly} weekly items on schedule.`
              : `${habits.filter((h) => h.completedToday).length} of ${habits.length} daily habits checked.`}
          </Text>

          <TouchableOpacity
            style={styles.addTaskHeaderBtn}
            onPress={() => (activeSubTab === 'habits' ? setShowHabitModal(true) : setShowAddModal(true))}
            activeOpacity={0.7}
          >
            <Plus size={14} color={Colors.white} strokeWidth={2.5} />
            <Text style={styles.addTaskBtnText}>
              {activeSubTab === 'habits' ? 'Add Habit' : 'Add Task'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Inline Quick Typing Input */}
      <View style={[styles.inlineInputCard, Shadows.sm]}>
        <TextInput
          style={styles.inlineTextInput}
          placeholder={
            activeSubTab === 'daily'
              ? 'Type a daily task and press Add...'
              : activeSubTab === 'weekly'
              ? 'Type a weekly goal and press Add...'
              : 'Type a new daily habit and press Add...'
          }
          placeholderTextColor={Colors.mutedText}
          value={inlineInputText}
          onChangeText={setInlineInputText}
          onSubmitEditing={handleInlineQuickAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.inlineAddBtn, !inlineInputText.trim() && styles.inlineAddBtnDisabled]}
          onPress={handleInlineQuickAdd}
          disabled={!inlineInputText.trim()}
          activeOpacity={0.8}
        >
          <Plus size={16} color={Colors.white} strokeWidth={2.5} />
          <Text style={styles.inlineAddBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Task List / Habits List */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
      ) : activeSubTab !== 'habits' ? (
        <View style={styles.taskList}>
          {(activeSubTab === 'daily' ? dailyTasks : weeklyTasks).map((task) => (
            <View key={task.id} style={[styles.taskCard, Shadows.sm]}>
              <TouchableOpacity
                style={styles.taskLeftCol}
                onPress={() => handleToggleTask(task.id)}
                activeOpacity={0.7}
              >
                {task.completed ? (
                  <CheckCircle2 size={22} color={Colors.success} strokeWidth={2.2} />
                ) : (
                  <Circle size={22} color={Colors.mutedText} strokeWidth={1.5} />
                )}
              </TouchableOpacity>

              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <View style={styles.taskTagRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{task.category}</Text>
                  </View>
                  <View
                    style={[
                      styles.priorityPill,
                      {
                        backgroundColor:
                          task.priority === 'high'
                            ? '#FBE8E8'
                            : task.priority === 'medium'
                            ? '#FBF0DF'
                            : '#E8F1E8',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        {
                          color:
                            task.priority === 'high'
                              ? Colors.error
                              : task.priority === 'medium'
                              ? Colors.warning
                              : Colors.primaryDark,
                        },
                      ]}
                    >
                      {task.priority.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.timeTag}>
                    <Clock size={11} color={Colors.mutedText} />
                    <Text style={styles.timeText}>{task.timeEstimateMinutes}m</Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.taskTitle,
                    task.completed && styles.taskTitleCompleted,
                  ]}
                >
                  {task.title}
                </Text>
              </View>

              {/* Delete button */}
              <TouchableOpacity
                onPress={() => handleDeleteTask(task.id)}
                style={styles.deleteTaskBtn}
                activeOpacity={0.7}
              >
                <Trash2 size={15} color={Colors.mutedText} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        /* Habits & Goals Section */
        <View style={styles.habitsList}>
          {habits.map((habit) => (
            <View key={habit.id} style={[styles.habitCard, Shadows.sm]}>
              <View style={styles.habitTopRow}>
                <View style={styles.habitIconBox}>
                  {habit.icon === 'droplet' ? (
                    <Droplet size={18} color={Colors.primaryDark} strokeWidth={2} />
                  ) : habit.icon === 'book' ? (
                    <BookOpen size={18} color={Colors.primaryDark} strokeWidth={2} />
                  ) : habit.icon === 'moon' ? (
                    <Moon size={18} color={Colors.primaryDark} strokeWidth={2} />
                  ) : habit.icon === 'sun' ? (
                    <Sun size={18} color={Colors.primaryDark} strokeWidth={2} />
                  ) : (
                    <Heart size={18} color={Colors.primaryDark} strokeWidth={2} />
                  )}
                </View>

                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  <Text style={styles.habitTarget}>{habit.target}</Text>
                </View>

                {/* Streak Badge */}
                <View style={styles.streakBadge}>
                  <Flame size={14} color="#E8B86D" strokeWidth={2.5} />
                  <Text style={styles.streakCount}>{habit.streakDays}d</Text>
                </View>

                {/* Checkbox button */}
                <TouchableOpacity
                  style={styles.habitCheckBtn}
                  onPress={() => handleToggleHabit(habit.id)}
                  activeOpacity={0.7}
                >
                  {habit.completedToday ? (
                    <CheckCircle2 size={24} color={Colors.success} strokeWidth={2.2} />
                  ) : (
                    <Circle size={24} color={Colors.mutedText} strokeWidth={1.5} />
                  )}
                </TouchableOpacity>
              </View>

              {/* 7-Day Mini Consistency Tracker */}
              <View style={styles.historyRow}>
                <Text style={styles.historyLabel}>PAST 7 DAYS:</Text>
                <View style={styles.dotsRow}>
                  {habit.history.map((done, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.historyDot,
                        { backgroundColor: done ? Colors.primary : Colors.border },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Add Task Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Student Task</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={20} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Task Description *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Read Chapter 5 Notes & Formulas"
              placeholderTextColor={Colors.lightText}
              value={taskTitle}
              onChangeText={setTaskTitle}
            />

            <Text style={styles.inputLabel}>Queue Period</Text>
            <View style={styles.periodRow}>
              {(['daily', 'weekly'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.pPill, taskPeriod === p && styles.pPillActive]}
                  onPress={() => setTaskPeriod(p)}
                >
                  <Text style={[styles.pText, taskPeriod === p && styles.pTextActive]}>
                    {p === 'daily' ? 'Daily Task' : 'Weekly Task'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {(['Study', 'Exam Prep', 'Wellness', 'Routine'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, taskCategory === cat && styles.catPillActive]}
                  onPress={() => setTaskCategory(cat)}
                >
                  <Text style={[styles.catText, taskCategory === cat && styles.catTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Estimated Time (minutes)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={taskDuration}
              onChangeText={setTaskDuration}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAddTask}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>Create Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Habit Modal */}
      <Modal visible={showHabitModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Habit</Text>
              <TouchableOpacity onPress={() => setShowHabitModal(false)}>
                <X size={20} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Habit Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 20-min Morning Run"
              placeholderTextColor={Colors.lightText}
              value={habitName}
              onChangeText={setHabitName}
            />

            <Text style={styles.inputLabel}>Goal / Frequency</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Daily before class"
              placeholderTextColor={Colors.lightText}
              value={habitTarget}
              onChangeText={setHabitTarget}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAddHabit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>Save Habit & Start Streak</Text>
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
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabBtnActive: {
    backgroundColor: Colors.lightSage,
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  subTabTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressCardTitle: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 15,
  },
  progressPercentText: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.cream,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressFooterText: {
    ...Typography.caption,
    color: Colors.mutedText,
    flex: 1,
  },
  addTaskHeaderBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    alignItems: 'center',
    gap: 4,
  },
  addTaskBtnText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.white,
    fontSize: 11,
  },
  inlineInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  inlineTextInput: {
    flex: 1,
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.darkText,
    paddingVertical: 6,
  },
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  inlineAddBtnDisabled: {
    backgroundColor: Colors.mutedText,
    opacity: 0.5,
  },
  inlineAddBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  taskList: {
    gap: Spacing.sm,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
  },
  taskLeftCol: {
    padding: 4,
  },
  taskTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.mutedText,
  },
  priorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 10,
    color: Colors.mutedText,
  },
  taskTitle: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.mutedText,
  },
  deleteTaskBtn: {
    padding: 6,
    marginLeft: 4,
  },
  habitsList: {
    gap: Spacing.md,
  },
  habitCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  habitTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitName: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 14,
  },
  habitTarget: {
    ...Typography.caption,
    color: Colors.mutedText,
    fontSize: 11,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    gap: 2,
    marginRight: Spacing.sm,
  },
  streakCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D49438',
  },
  habitCheckBtn: {
    padding: 4,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  historyLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.mutedText,
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h2,
    fontSize: 20,
  },
  inputLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    ...Typography.body,
    fontSize: 14,
  },
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  pPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pPillActive: {
    backgroundColor: Colors.lightSage,
    borderColor: Colors.primary,
  },
  pText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  pTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  catPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  catTextActive: {
    color: Colors.white,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitBtnText: {
    ...Typography.button,
  },
});
