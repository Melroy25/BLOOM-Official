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
  ClipboardList,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle,
  Circle,
  AlertCircle,
  BookOpen,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  ChevronLeft,
  CheckSquare,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { Assignment, AssignmentPriority } from '../../types/tasks';
import { calculateDueCountdown, DEMO_CLASSROOM_COURSES } from '../../services/classroomService';
import { generateAIStudyBreakdown } from '../../services/aiWellnessService';
import {
  getBackendAssignments,
  saveBackendAssignment,
  toggleBackendAssignmentStatus,
  deleteBackendAssignment,
  getRelativeDate,
} from '../../services/bloomBackend';

interface Props {
  onBack?: () => void;
}

export default function AssignmentTracker({ onBack }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'due_soon' | 'pending' | 'completed'>('all');
  const [syncingClassroom, setSyncingClassroom] = useState(false);
  const [classroomConnected, setClassroomConnected] = useState(true);
  const [expandedAiPlanId, setExpandedAiPlanId] = useState<string | null>(null);
  const [generatingAiId, setGeneratingAiId] = useState<string | null>(null);

  // Manual Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState(DEMO_CLASSROOM_COURSES[0].name);
  const [newDueDate, setNewDueDate] = useState(getRelativeDate(1));
  const [newDueTime, setNewDueTime] = useState('23:59');
  const [newPriority, setNewPriority] = useState<AssignmentPriority>('high');
  const [newPoints, setNewPoints] = useState('100');
  const [newDescription, setNewDescription] = useState('');

  // Inline Quick Add state
  const [inlineTitle, setInlineTitle] = useState('');

  const handleQuickInlineAdd = async () => {
    if (!inlineTitle.trim()) return;
    const newAssignment: Assignment = {
      id: `asg-man-${Date.now()}`,
      title: inlineTitle.trim(),
      course: 'General Coursework',
      courseColor: Colors.primary,
      dueDate: getRelativeDate(1),
      dueTime: '23:59',
      priority: 'high',
      status: 'pending',
      source: 'manual',
      points: 100,
      reminderActive: true,
      createdAt: new Date().toISOString(),
    };
    const updated = await saveBackendAssignment(newAssignment);
    setAssignments(updated);
    setInlineTitle('');
  };

  // Initial load from backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getBackendAssignments();
      setAssignments(data);
    } finally {
      setLoading(false);
    }
  };

  // Toggle submitted status
  const handleToggleStatus = async (id: string) => {
    const updated = await toggleBackendAssignmentStatus(id);
    setAssignments(updated);
  };

  // Delete assignment
  const handleDelete = async (id: string) => {
    const updated = await deleteBackendAssignment(id);
    setAssignments(updated);
  };

  // Sync from Google Classroom
  const handleSyncClassroom = async () => {
    setSyncingClassroom(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      const freshAssignment: Assignment = {
        id: `asg-gc-${Date.now()}`,
        title: 'Neural Networks: Backpropagation Math Problem Set',
        course: 'CS 301: Algorithms & Data Structures',
        courseColor: '#6AAF7D',
        dueDate: getRelativeDate(2),
        dueTime: '23:59',
        priority: 'high',
        status: 'pending',
        source: 'google_classroom',
        points: 80,
        description: 'Synced live from Google Classroom: Gradient descent derivations and loss curves.',
        classroomLink: 'https://classroom.google.com',
        reminderActive: true,
        createdAt: new Date().toISOString(),
      };
      const updated = await saveBackendAssignment(freshAssignment);
      setAssignments(updated);
      setClassroomConnected(true);
    } finally {
      setSyncingClassroom(false);
    }
  };

  // Generate AI study breakdown
  const handleGenerateAiPlan = async (assignment: Assignment) => {
    setGeneratingAiId(assignment.id);
    try {
      const countdown = calculateDueCountdown(assignment.dueDate, assignment.dueTime);
      const plan = await generateAIStudyBreakdown(
        assignment.title,
        assignment.course,
        countdown.hoursRemaining
      );
      const updatedAssignment = { ...assignment, aiStudyPlan: plan };
      const updatedList = await saveBackendAssignment(updatedAssignment);
      setAssignments(updatedList);
      setExpandedAiPlanId(assignment.id);
    } finally {
      setGeneratingAiId(null);
    }
  };

  // Add Assignment Manually
  const handleSaveManualAssignment = async () => {
    if (!newTitle.trim()) return;

    const newAssignment: Assignment = {
      id: `asg-man-${Date.now()}`,
      title: newTitle.trim(),
      course: newCourse,
      courseColor: Colors.primary,
      dueDate: newDueDate,
      dueTime: newDueTime,
      priority: newPriority,
      status: 'pending',
      source: 'manual',
      points: parseInt(newPoints, 10) || 100,
      description: newDescription.trim() || undefined,
      reminderActive: true,
      createdAt: new Date().toISOString(),
    };

    const updated = await saveBackendAssignment(newAssignment);
    setAssignments(updated);
    setShowAddModal(false);
    setNewTitle('');
    setNewDescription('');
  };

  // Filter logic
  const filteredAssignments = assignments.filter((item) => {
    if (filter === 'completed') return item.status === 'submitted';
    if (filter === 'pending') return item.status === 'pending';
    if (filter === 'due_soon') {
      const countdown = calculateDueCountdown(item.dueDate, item.dueTime);
      return item.status === 'pending' && (countdown.isToday || countdown.isTomorrow || countdown.isOverdue);
    }
    return true;
  });

  const urgentCount = assignments.filter((a) => {
    const cd = calculateDueCountdown(a.dueDate, a.dueTime);
    return a.status === 'pending' && (cd.isToday || cd.isOverdue);
  }).length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Back Navigation Bar */}
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={18} color={Colors.primaryDark} strokeWidth={2.5} />
          <Text style={styles.backButtonText}>Back to All 13 Modules</Text>
        </TouchableOpacity>
      )}

      {/* Google Classroom & Email Sync Status Bar */}
      <View style={[styles.syncCard, Shadows.sm]}>
        <View style={styles.syncHeaderRow}>
          <View style={styles.classroomBadge}>
            <BookOpen size={16} color={Colors.primaryDark} strokeWidth={2} />
            <Text style={styles.classroomBadgeText}>
              {classroomConnected ? 'Google Classroom: Synced' : 'Classroom Disconnected'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.syncIconButton}
            onPress={handleSyncClassroom}
            disabled={syncingClassroom}
            activeOpacity={0.7}
          >
            {syncingClassroom ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <RefreshCw size={14} color={Colors.primary} strokeWidth={2} />
            )}
            <Text style={styles.syncBtnLabel}>Sync Now</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.syncSubtitle}>
          Real-time coursework synchronizer linked with university domain and submission deadlines.
        </Text>

        <View style={styles.actionBtnRow}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={16} color={Colors.white} strokeWidth={2.5} />
            <Text style={styles.addBtnText}>+ Add Assignment Manually</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Urgent Alert Banner (if any assignment due today/overdue) */}
      {urgentCount > 0 && (
        <View style={[styles.urgentBanner, Shadows.sm]}>
          <AlertCircle size={20} color={Colors.error} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.urgentTitle}>Deadlines Requiring Action Today</Text>
            <Text style={styles.urgentText}>
              You have {urgentCount} assignment(s) with imminent submission deadlines.
            </Text>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {[
          { key: 'all', label: `All (${assignments.length})` },
          { key: 'due_soon', label: `Due Soon (${urgentCount})` },
          { key: 'pending', label: `Pending (${assignments.filter((a) => a.status === 'pending').length})` },
          { key: 'completed', label: `Submitted (${assignments.filter((a) => a.status === 'submitted').length})` },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterPill, filter === tab.key && styles.filterPillActive]}
            onPress={() => setFilter(tab.key as any)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.filterPillText, filter === tab.key && styles.filterPillTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Inline Quick Add Input */}
      <View style={[styles.inlineInputCard, Shadows.sm]}>
        <TextInput
          style={styles.inlineTextInput}
          placeholder="Type new assignment title and press Add..."
          placeholderTextColor={Colors.mutedText}
          value={inlineTitle}
          onChangeText={setInlineTitle}
          onSubmitEditing={handleQuickInlineAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.inlineAddBtn, !inlineTitle.trim() && styles.inlineAddBtnDisabled]}
          onPress={handleQuickInlineAdd}
          disabled={!inlineTitle.trim()}
          activeOpacity={0.8}
        >
          <Plus size={16} color={Colors.white} strokeWidth={2.5} />
          <Text style={styles.inlineAddBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Assignment Cards List */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
      ) : (
        <View style={styles.list}>
          {filteredAssignments.map((item) => {
            const countdown = calculateDueCountdown(item.dueDate, item.dueTime);
            const isAiExpanded = expandedAiPlanId === item.id;
            const isGeneratingAi = generatingAiId === item.id;

            return (
              <View key={item.id} style={[styles.card, Shadows.sm]}>
                <View style={styles.cardHeader}>
                  <View style={styles.courseTagBox}>
                    <View style={[styles.courseColorDot, { backgroundColor: item.courseColor }]} />
                    <Text style={styles.courseNameText} numberOfLines={1}>
                      {item.course}
                    </Text>
                  </View>

                  {/* Priority & Source Badge */}
                  <View style={styles.tagGroup}>
                    <View
                      style={[
                        styles.sourceTag,
                        {
                          backgroundColor:
                            item.source === 'google_classroom' ? '#E8F1E8' : '#FAF8F2',
                        },
                      ]}
                    >
                      <Text style={styles.sourceTagText}>
                        {item.source === 'google_classroom' ? 'Classroom' : 'Manual'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.priorityBadge,
                        {
                          backgroundColor:
                            item.priority === 'high'
                              ? '#FBE8E8'
                              : item.priority === 'medium'
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
                              item.priority === 'high'
                                ? Colors.error
                                : item.priority === 'medium'
                                ? Colors.warning
                                : Colors.primaryDark,
                          },
                        ]}
                      >
                        {item.priority.toUpperCase()}
                      </Text>
                    </View>

                    {/* Delete button */}
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={13} color={Colors.mutedText} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text
                  style={[
                    styles.assignmentTitle,
                    item.status === 'submitted' && styles.titleSubmitted,
                  ]}
                >
                  {item.title}
                </Text>

                {item.description ? (
                  <Text style={styles.assignmentDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                {/* Deadline & Countdown Pill */}
                <View style={[styles.countdownPill, { backgroundColor: countdown.badgeColor }]}>
                  <Clock size={13} color={countdown.badgeTextColor} strokeWidth={2} />
                  <Text style={[styles.countdownText, { color: countdown.badgeTextColor }]}>
                    {countdown.displayText}
                  </Text>
                </View>

                {/* Bottom Action Row */}
                <View style={styles.bottomRow}>
                  {/* Complete / Checkbox */}
                  <TouchableOpacity
                    style={styles.checkboxBtn}
                    onPress={() => handleToggleStatus(item.id)}
                    activeOpacity={0.7}
                  >
                    {item.status === 'submitted' ? (
                      <CheckCircle size={20} color={Colors.success} strokeWidth={2.2} />
                    ) : (
                      <Circle size={20} color={Colors.mutedText} strokeWidth={1.5} />
                    )}
                    <Text
                      style={[
                        styles.statusText,
                        item.status === 'submitted' && { color: Colors.success, fontWeight: '700' },
                      ]}
                    >
                      {item.status === 'submitted' ? 'Submitted ✓' : 'Mark Done'}
                    </Text>
                  </TouchableOpacity>

                  {/* AI Study Breakdown Button */}
                  <TouchableOpacity
                    style={styles.aiBreakdownBtn}
                    onPress={() => {
                      if (item.aiStudyPlan) {
                        setExpandedAiPlanId(isAiExpanded ? null : item.id);
                      } else {
                        handleGenerateAiPlan(item);
                      }
                    }}
                    activeOpacity={0.7}
                    disabled={isGeneratingAi}
                  >
                    {isGeneratingAi ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Sparkles size={14} color={Colors.primary} strokeWidth={2} />
                    )}
                    <Text style={styles.aiBreakdownText}>
                      {item.aiStudyPlan
                        ? isAiExpanded
                          ? 'Hide Plan'
                          : 'View AI Plan'
                        : '✨ AI Study Plan'}
                    </Text>
                    {item.aiStudyPlan &&
                      (isAiExpanded ? (
                        <ChevronUp size={14} color={Colors.primary} />
                      ) : (
                        <ChevronDown size={14} color={Colors.primary} />
                      ))}
                  </TouchableOpacity>
                </View>

                {/* Expanded AI Study Plan Section */}
                {isAiExpanded && item.aiStudyPlan && (
                  <View style={styles.aiPlanContainer}>
                    <View style={styles.aiPlanHeader}>
                      <Sparkles size={15} color={Colors.primary} strokeWidth={2} />
                      <Text style={styles.aiPlanTitle}>AI Milestone Study Schedule</Text>
                    </View>
                    <Text style={styles.aiPlanSummary}>{item.aiStudyPlan.summary}</Text>

                    <View style={styles.studyStepsList}>
                      {item.aiStudyPlan.recommendedBreakdown.map((step, idx) => (
                        <View key={idx} style={styles.studyStepItem}>
                          <CheckSquare
                            size={15}
                            color={step.done ? Colors.success : Colors.mutedText}
                            strokeWidth={2}
                          />
                          <Text
                            style={[
                              styles.stepTitle,
                              step.done && { textDecorationLine: 'line-through', color: Colors.mutedText },
                            ]}
                          >
                            {step.title}
                          </Text>
                          <Text style={styles.stepDuration}>{step.duration}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Manual Assignment Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Assignment</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={20} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Assignment Title *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Distributed Systems Lab 3"
                placeholderTextColor={Colors.lightText}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.inputLabel}>Course / Subject</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. CS 301 Data Structures"
                placeholderTextColor={Colors.lightText}
                value={newCourse}
                onChangeText={setNewCourse}
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: Spacing.sm }}>
                  <Text style={styles.inputLabel}>Due Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newDueDate}
                    onChangeText={setNewDueDate}
                  />
                </View>
                <View style={{ width: 100 }}>
                  <Text style={styles.inputLabel}>Time (HH:mm)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newDueTime}
                    onChangeText={setNewDueTime}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Priority Level</Text>
              <View style={styles.prioritySelectorRow}>
                {(['low', 'medium', 'high'] as AssignmentPriority[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.pSelectorPill,
                      newPriority === p && {
                        backgroundColor:
                          p === 'high' ? '#FBE8E8' : p === 'medium' ? '#FBF0DF' : '#E8F1E8',
                        borderColor:
                          p === 'high' ? Colors.error : p === 'medium' ? Colors.warning : Colors.primary,
                      },
                    ]}
                    onPress={() => setNewPriority(p)}
                  >
                    <Text
                      style={[
                        styles.pSelectorText,
                        newPriority === p && { fontWeight: '700', color: Colors.darkText },
                      ]}
                    >
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Description / Instructions</Text>
              <TextInput
                style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Key requirements or links..."
                placeholderTextColor={Colors.lightText}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveManualAssignment}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSubmitText}>Save Assignment to Hub</Text>
              </TouchableOpacity>
            </ScrollView>
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
  syncCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  syncHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  classroomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightSage,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    gap: 6,
  },
  classroomBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  syncIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncBtnLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.primary,
  },
  syncSubtitle: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  actionBtnRow: {
    flexDirection: 'row',
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addBtnText: {
    ...Typography.button,
    fontSize: 14,
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4F4',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F5C6C6',
    gap: Spacing.sm,
  },
  urgentTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.error,
  },
  urgentText: {
    ...Typography.caption,
    color: Colors.darkText,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.mutedText,
    fontSize: 11,
  },
  filterPillTextActive: {
    color: Colors.white,
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
  list: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  courseTagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  courseColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  courseNameText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.darkText,
  },
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.mutedText,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 3,
    marginLeft: 2,
  },
  assignmentTitle: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  titleSubmitted: {
    textDecorationLine: 'line-through',
    color: Colors.mutedText,
  },
  assignmentDesc: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    gap: 6,
    marginBottom: Spacing.md,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  checkboxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.darkText,
  },
  aiBreakdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightSage,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    gap: 4,
  },
  aiBreakdownText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  aiPlanContainer: {
    marginTop: Spacing.md,
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  aiPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiPlanTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  aiPlanSummary: {
    ...Typography.caption,
    color: Colors.darkText,
    marginBottom: Spacing.sm,
  },
  studyStepsList: {
    gap: Spacing.xs,
  },
  studyStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  stepTitle: {
    flex: 1,
    ...Typography.caption,
    color: Colors.darkText,
    fontSize: 12,
  },
  stepDuration: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
    fontSize: 11,
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
    maxHeight: '85%',
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
  modalInput: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
  },
  prioritySelectorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  pSelectorPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  pSelectorText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  modalSubmitText: {
    ...Typography.button,
  },
});
