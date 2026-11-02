import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Check, Plus, Trash2, Edit3, X, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { FontFamily } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';
import { TaskDocument } from '../../types';

interface DailyGoalsSectionProps {
  tasks: TaskDocument[];
  isLoading?: boolean;
  onToggleTask: (taskId: string, currentCompleted: boolean) => Promise<void>;
  onAddTask: (title: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onEditTask?: (taskId: string, newTitle: string) => Promise<void>;
}

export const DailyGoalsSection: React.FC<DailyGoalsSectionProps> = ({
  tasks,
  isLoading = false,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onEditTask,
}) => {
  const { colors, isDark } = useTheme();

  // Create Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCreateSubmit = async () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    setIsAdding(true);
    try {
      await onAddTask(trimmed);
      setNewTaskTitle('');
      setCreateModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not add goal.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenEdit = (task: TaskDocument) => {
    if (!task.id) return;
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!editingTaskId || !editTaskTitle.trim()) return;
    setIsEditing(true);
    try {
      if (onEditTask) {
        await onEditTask(editingTaskId, editTaskTitle.trim());
      }
      setEditModalVisible(false);
      setEditingTaskId(null);
      setEditTaskTitle('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not edit goal.');
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.darkText }]}>Daily Goals</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
            Small actions. Meaningful progress.
          </Text>
        </View>

        {totalCount > 0 && (
          <View style={[styles.progressBadge, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.progressBadgeText, { color: colors.primaryDark }]}>
              {completedCount} of {totalCount}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar (if tasks exist) */}
      {totalCount > 0 && (
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${completionPercent}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
          <Text style={[styles.percentLabel, { color: colors.primaryDark }]}>
            {completionPercent}%
          </Text>
        </View>
      )}

      {/* Tasks List */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Syncing goals...
          </Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: colors.border, backgroundColor: colors.white }]}>
          <Sparkles size={28} color={colors.primary} strokeWidth={1.8} />
          <Text style={[styles.emptyTitle, { color: colors.darkText }]}>
            No daily goals yet
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedText }]}>
            Add a small action for today to start building your streak.
          </Text>
        </View>
      ) : (
        <View style={styles.tasksList}>
          {tasks.map((task) => {
            const taskId = task.id || task.title;
            return (
              <View
                key={taskId}
                style={[
                  styles.taskItem,
                  Shadows.sm,
                  {
                    backgroundColor: task.completed ? colors.lightSage : colors.white,
                    borderColor: task.completed ? colors.primary + '35' : colors.border,
                  },
                ]}
              >
                {/* Checkbox */}
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    {
                      borderColor: task.completed ? colors.primary : colors.mutedText,
                      backgroundColor: task.completed ? colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => task.id && onToggleTask(task.id, task.completed)}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: task.completed }}
                  accessibilityLabel={task.title}
                >
                  {task.completed && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </TouchableOpacity>

                {/* Task Title */}
                <TouchableOpacity
                  style={styles.taskTextCol}
                  onPress={() => task.id && onToggleTask(task.id, task.completed)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.taskTitle,
                      { color: task.completed ? colors.mutedText : colors.darkText },
                      task.completed && styles.taskTitleCompleted,
                    ]}
                  >
                    {task.title}
                  </Text>
                </TouchableOpacity>

                {/* Actions: Edit & Delete */}
                <View style={styles.actionsRow}>
                  {onEditTask && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleOpenEdit(task)}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                      <Edit3 size={15} color={colors.mutedText} strokeWidth={1.8} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => task.id && onDeleteTask(task.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <Trash2 size={15} color="#D98B8B" strokeWidth={1.8} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Bottom Button: + Create Task */}
      <TouchableOpacity
        style={[
          styles.createTaskBtn,
          Shadows.sm,
          { backgroundColor: colors.white, borderColor: colors.primary },
        ]}
        onPress={() => setCreateModalVisible(true)}
        activeOpacity={0.8}
      >
        <Plus size={16} color={colors.primaryDark} strokeWidth={2.4} />
        <Text style={[styles.createTaskBtnText, { color: colors.primaryDark }]}>
          Create Task
        </Text>
      </TouchableOpacity>

      {/* CREATE TASK MODAL */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, Shadows.lg, { backgroundColor: colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.darkText }]}>
                New Daily Goal
              </Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={20} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.background, color: colors.darkText, borderColor: colors.border },
              ]}
              placeholder="e.g. Walk for 20 minutes"
              placeholderTextColor={colors.lightText}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
              maxLength={80}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedText }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  { backgroundColor: colors.primary },
                  !newTaskTitle.trim() && { opacity: 0.5 },
                ]}
                onPress={handleCreateSubmit}
                disabled={isAdding || !newTaskTitle.trim()}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Add Goal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT TASK MODAL */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, Shadows.lg, { backgroundColor: colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.darkText }]}>
                Edit Goal
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={20} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.background, color: colors.darkText, borderColor: colors.border },
              ]}
              placeholder="Goal title"
              placeholderTextColor={colors.lightText}
              value={editTaskTitle}
              onChangeText={setEditTaskTitle}
              autoFocus
              maxLength={80}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedText }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  { backgroundColor: colors.primary },
                  !editTaskTitle.trim() && { opacity: 0.5 },
                ]}
                onPress={handleEditSubmit}
                disabled={isEditing || !editTaskTitle.trim()}
              >
                {isEditing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  progressBadgeText: {
    fontFamily: FontFamily.monoBold,
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentLabel: {
    fontFamily: FontFamily.monoBold,
    fontSize: 11,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
  loadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 12,
  },
  emptyBox: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyDesc: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 12,
    textAlign: 'center',
  },
  tasksList: {
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskTextCol: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    padding: 2,
  },
  createTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    marginTop: Spacing.md,
  },
  createTaskBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 25, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
