import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  SlidersHorizontal,
  Clock,
  Sparkles,
  CheckCircle2,
  Plus,
  BookOpen,
  X,
  AlertCircle,
  Calendar,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AssignmentItem {
  id: string;
  courseCode: string;
  courseColor: string;
  title: string;
  description: string;
  dueDateLabel: string;
  estimatedHours: string;
  status: 'pending' | 'completed';
}

const INITIAL_ASSIGNMENTS: AssignmentItem[] = [
  {
    id: 'asg-1',
    courseCode: 'PSYCH 101',
    courseColor: '#789B83',
    title: 'Cognitive Biases & Memory Retrieval Research Essay',
    description: 'Literature review comparing working memory span across digital environments.',
    dueDateLabel: 'Due tmr',
    estimatedHours: '~3 hrs needed',
    status: 'pending',
  },
  {
    id: 'asg-2',
    courseCode: 'MATH 204',
    courseColor: '#365B45',
    title: 'Multivariable Calculus Problem Set #4: Vector Fields',
    description: 'Line integrals, Green’s Theorem, and divergence derivations.',
    dueDateLabel: 'Due on Oct 24',
    estimatedHours: '~2.5 hrs needed',
    status: 'pending',
  },
  {
    id: 'asg-3',
    courseCode: 'ECOLOGY LAB 110',
    courseColor: '#789B83',
    title: 'Riparian Biodiversity Sampling Field Report',
    description: 'Statistical analysis of macroinvertebrate taxa richness and water quality indices.',
    dueDateLabel: 'Due Friday',
    estimatedHours: '~4 hrs needed',
    status: 'pending',
  },
  {
    id: 'asg-4',
    courseCode: 'CS 301',
    courseColor: '#365B45',
    title: 'Dynamic Programming & Memoization Lab Test',
    description: 'Knapsack 0/1 implementation and matrix chain multiplication.',
    dueDateLabel: 'Submitted Oct 18',
    estimatedHours: 'Completed',
    status: 'completed',
  },
  {
    id: 'asg-5',
    courseCode: 'ENG 105',
    courseColor: '#789B83',
    title: 'Modernist Poetry Explication Analysis',
    description: 'Comparative analysis of Eliot and H.D.',
    dueDateLabel: 'Submitted Oct 16',
    estimatedHours: 'Completed',
    status: 'completed',
  },
];

export default function AssignmentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 20 : 16);

  const [assignments, setAssignments] = useState<AssignmentItem[]>(INITIAL_ASSIGNMENTS);
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');

  const STORAGE_KEY = '@bloom_assignments_list';

  // Load persisted assignments on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw: string | null) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAssignments(parsed);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Helper to persist assignments
  const persistAssignments = async (newList: AssignmentItem[]) => {
    setAssignments(newList);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch {}
  };

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState('PSYCH 101');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('Due tmr');
  const [newHours, setNewHours] = useState('~2 hrs needed');

  const pendingList = assignments.filter((a) => a.status === 'pending');
  const completedList = assignments.filter((a) => a.status === 'completed');

  const handleToggleDone = (id: string) => {
    const updated: AssignmentItem[] = assignments.map((a) => {
      if (a.id === id) {
        const nextStatus: 'pending' | 'completed' =
          a.status === 'pending' ? 'completed' : 'pending';
        return { ...a, status: nextStatus };
      }
      return a;
    });
    persistAssignments(updated);
  };

  const handleCreateAssignment = () => {
    if (!newTitle.trim()) return;
    const newItem: AssignmentItem = {
      id: `asg-${Date.now()}`,
      courseCode: newCourse.trim() || 'General Coursework',
      courseColor: '#789B83',
      title: newTitle.trim(),
      description: newDesc.trim() || 'Assigned academic milestone.',
      dueDateLabel: newDueDate.trim() || 'Upcoming',
      estimatedHours: newHours.trim() || '~2 hrs needed',
      status: 'pending',
    };
    const updated = [newItem, ...assignments];
    persistAssignments(updated);
    setNewTitle('');
    setNewDesc('');
    setShowAddModal(false);
  };

  const displayList = filter === 'pending' ? pendingList : completedList;

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
        {/* ── Subheader Title Row ──────────────────────────────────────── */}
        <View style={styles.subheaderRow}>
          <Text style={styles.screenTitle}>Assignments</Text>
        </View>

        {/* ── 1. Top Summary Banner ────────────────────────────────────── */}
        <View style={[styles.summaryBanner, Shadows.sm]}>
          <Sparkles size={18} color="#365B45" strokeWidth={2.2} style={{ marginTop: 2 }} />
          <Text style={styles.summaryBannerText}>
            Pace yourself today — Three assignments requiring focused care (60%).
          </Text>
        </View>

        {/* ── 2. Status Filter Toggle Pills ─────────────────────────────── */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === 'pending' && styles.filterPillActive,
            ]}
            onPress={() => setFilter('pending')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === 'pending' && styles.filterPillTextActive,
              ]}
            >
              Pending ({pendingList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === 'completed' && styles.filterPillActive,
            ]}
            onPress={() => setFilter('completed')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === 'completed' && styles.filterPillTextActive,
              ]}
            >
              Completed ({completedList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. Assignment Cards List ──────────────────────────────────── */}
        <View style={styles.assignmentsList}>
          {displayList.map((item) => (
            <View key={item.id} style={[styles.assignmentCard, Shadows.sm]}>
              {/* Top Row: Course Code & Urgency Badge */}
              <View style={styles.cardTopRow}>
                <View style={styles.coursePill}>
                  <Text style={styles.coursePillText}>{item.courseCode}</Text>
                </View>

                <View
                  style={[
                    styles.urgencyPill,
                    item.status === 'completed'
                      ? styles.urgencyPillCompleted
                      : item.dueDateLabel.includes('tmr')
                      ? styles.urgencyPillUrgent
                      : styles.urgencyPillNormal,
                  ]}
                >
                  <Text
                    style={[
                      styles.urgencyPillText,
                      item.status === 'completed'
                        ? styles.urgencyTextCompleted
                        : item.dueDateLabel.includes('tmr')
                        ? styles.urgencyTextUrgent
                        : styles.urgencyTextNormal,
                    ]}
                  >
                    {item.dueDateLabel}
                  </Text>
                </View>
              </View>

              {/* Assignment Title & Description */}
              <Text style={styles.assignmentTitle}>{item.title}</Text>
              <Text style={styles.assignmentDesc}>{item.description}</Text>

              {/* Footer: Time Needed & Mark as Done */}
              <View style={styles.cardFooterRow}>
                <View style={styles.timeEstimateRow}>
                  <Clock size={13} color="#7B857F" />
                  <Text style={styles.timeEstimateText}>{item.estimatedHours}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.doneBtn,
                    item.status === 'completed' && styles.doneBtnCompleted,
                  ]}
                  onPress={() => handleToggleDone(item.id)}
                  activeOpacity={0.8}
                >
                  {item.status === 'completed' ? (
                    <>
                      <CheckCircle2 size={14} color="#365B45" strokeWidth={2.5} />
                      <Text style={styles.doneBtnTextCompleted}>Done</Text>
                    </>
                  ) : (
                    <Text style={styles.doneBtnText}>Mark as done</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── 4. Study Sanctuary Tip Banner (Bottom Card) ──────────────── */}
        <View style={[styles.tipBanner, Shadows.sm]}>
          <View style={styles.tipTopRow}>
            <BookOpen size={16} color="#789B83" strokeWidth={2} />
            <Text style={styles.tipHeader}>STUDY SANCTUARY TIP</Text>
          </View>
          <Text style={styles.tipBody}>
            Tackle deep analytical assignments during peak morning cognitive hours and save light reading for evening wind-down.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Floating Action Button (FAB) ───────────────────────────────── */}
      <TouchableOpacity
        style={[styles.fabButton, Shadows.md]}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.85}
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* ── Add New Assignment Modal ───────────────────────────────────── */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add New Assignment</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={20} color="#7B857F" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>ASSIGNMENT TITLE</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Cognitive Psychology Research Essay"
              placeholderTextColor="#7B857F"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.inputLabel}>COURSE CODE</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. PSYCH 101 or MATH 204"
              placeholderTextColor="#7B857F"
              value={newCourse}
              onChangeText={setNewCourse}
            />

            <Text style={styles.inputLabel}>DESCRIPTION</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Chapter 4 synthesis problem set"
              placeholderTextColor="#7B857F"
              value={newDesc}
              onChangeText={setNewDesc}
            />

            <View style={styles.dualInputsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>DUE DATE</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Due tmr"
                  placeholderTextColor="#7B857F"
                  value={newDueDate}
                  onChangeText={setNewDueDate}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>TIME NEEDED</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. ~3 hrs needed"
                  placeholderTextColor="#7B857F"
                  value={newHours}
                  onChangeText={setNewHours}
                />
              </View>
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
                onPress={handleCreateAssignment}
              >
                <Text style={styles.saveBtnText}>Create Assignment</Text>
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

  subheaderRow: {
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#29332E',
    letterSpacing: -0.4,
  },

  // Summary Banner
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9EEE5',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#CDE5DB',
    gap: 10,
  },
  summaryBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#365B45',
    lineHeight: 18,
  },

  // Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  filterPillActive: {
    backgroundColor: '#365B45',
    borderColor: '#365B45',
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#7B857F',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Assignment Cards List
  assignmentsList: {
    gap: 14,
    marginBottom: 20,
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  coursePill: {
    backgroundColor: '#FAF8F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  coursePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#365B45',
    letterSpacing: 0.5,
  },
  urgencyPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  urgencyPillNormal: {
    backgroundColor: '#D9EEE5',
  },
  urgencyPillUrgent: {
    backgroundColor: '#F7E5DA',
  },
  urgencyPillCompleted: {
    backgroundColor: '#FAF8F2',
  },
  urgencyPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  urgencyTextNormal: {
    color: '#365B45',
  },
  urgencyTextUrgent: {
    color: '#C25454',
  },
  urgencyTextCompleted: {
    color: '#789B83',
  },
  assignmentTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#29332E',
    marginBottom: 4,
    lineHeight: 20,
  },
  assignmentDesc: {
    fontSize: 12.5,
    color: '#7B857F',
    lineHeight: 17,
    marginBottom: 14,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#E8ECE9',
    paddingTop: 12,
  },
  timeEstimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeEstimateText: {
    fontSize: 11.5,
    color: '#7B857F',
    fontWeight: '500',
  },
  doneBtn: {
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  doneBtnCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F2',
    gap: 4,
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#365B45',
  },
  doneBtnTextCompleted: {
    fontSize: 12,
    fontWeight: '700',
    color: '#365B45',
  },

  // Study Sanctuary Tip
  tipBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  tipTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tipHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#789B83',
    letterSpacing: 0.8,
  },
  tipBody: {
    fontSize: 12.5,
    color: '#29332E',
    lineHeight: 18,
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
  dualInputsRow: {
    flexDirection: 'row',
    gap: 10,
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
});

