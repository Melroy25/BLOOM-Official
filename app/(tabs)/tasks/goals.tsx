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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  SlidersHorizontal,
  HelpCircle,
  Plus,
  Flame,
  CheckCircle2,
  Sparkles,
  BookOpen,
  X,
  Target,
  Leaf,
  ChevronRight,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';
import { getBackendHabits, saveBackendTask } from '../../../services/bloomBackend';
import { HabitItem } from '../../../types/tasks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GoalCardData {
  id: string;
  category: string;
  categoryColor: string;
  title: string;
  description: string;
  progressPercent: number;
  streakDays: number;
  checkedInToday: boolean;
}

const INITIAL_GOALS: GoalCardData[] = [
  {
    id: 'g-1',
    category: 'COURSEWORK & READING',
    categoryColor: '#789B83',
    title: 'Read 20 pages of course literature daily',
    description: 'Deep analytical reading before noon lectures.',
    progressPercent: 65,
    streakDays: 6,
    checkedInToday: true,
  },
  {
    id: 'g-2',
    category: 'MINDFUL RECOVERY',
    categoryColor: '#365B45',
    title: 'Morning sunlight & hydration pause (15 mins)',
    description: 'Synchronizes circadian cortisol rhythm naturally.',
    progressPercent: 80,
    streakDays: 7,
    checkedInToday: false,
  },
];

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 20 : 16);

  const [goals, setGoals] = useState<GoalCardData[]>(INITIAL_GOALS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // New goal form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Coursework' | 'Wellness' | 'Reading' | 'Routine'>('Coursework');
  const [newTarget, setNewTarget] = useState('Daily 20m');

  const handleToggleCheckIn = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const nextChecked = !g.checkedInToday;
          const nextStreak = nextChecked ? g.streakDays + 1 : Math.max(0, g.streakDays - 1);
          const nextProgress = nextChecked
            ? Math.min(100, g.progressPercent + 15)
            : Math.max(0, g.progressPercent - 15);
          return {
            ...g,
            checkedInToday: nextChecked,
            streakDays: nextStreak,
            progressPercent: nextProgress,
          };
        }
        return g;
      })
    );
  };

  const handleCreateGoal = () => {
    if (!newTitle.trim()) return;
    const newGoal: GoalCardData = {
      id: `goal-${Date.now()}`,
      category: newCategory.toUpperCase(),
      categoryColor: '#789B83',
      title: newTitle.trim(),
      description: newTarget,
      progressPercent: 20,
      streakDays: 1,
      checkedInToday: true,
    };
    setGoals((prev) => [newGoal, ...prev]);
    setNewTitle('');
    setShowAddModal(false);
  };

  const completedCount = goals.filter((g) => g.checkedInToday).length;
  const consistencyScore = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 40;

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
        {/* ── Subheader Title Row ──────────────────────────────────────── */}
        <View style={styles.subheaderRow}>
          <Text style={styles.screenTitle}>Goals</Text>
          <TouchableOpacity onPress={() => setShowInfoModal(true)} style={{ marginLeft: 6 }}>
            <HelpCircle size={20} color="#789B83" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* ── 1. Habit Consistency Score Card ──────────────────────────── */}
        <View style={[styles.consistencyCard, Shadows.sm]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionLabel}>Habit consistency score</Text>
            <View style={styles.percentBadge}>
              <Text style={styles.percentBadgeText}>{consistencyScore}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${consistencyScore}%` }]} />
          </View>

          <Text style={styles.consistencySubtext}>
            {goals.length} active goals progressing steadily this week.
          </Text>
        </View>

        {/* ── 2. Gentle Observation Banner ─────────────────────────────── */}
        <View style={[styles.observationBanner, Shadows.sm]}>
          <View style={styles.obsIconBox}>
            <Sparkles size={18} color="#365B45" strokeWidth={2.2} />
          </View>
          <Text style={styles.observationText}>
            <Text style={{ fontWeight: '700', color: '#365B45' }}>Gentle Observation: </Text>
            Consistent morning pauses set the neurological tone for steady academic focus throughout the day.
          </Text>
        </View>

        {/* ── 3. Active Goals Section ──────────────────────────────────── */}
        <View style={styles.goalsSectionHeader}>
          <Text style={styles.sectionTitle}>Active Goals ({goals.length} ongoing)</Text>
          <TouchableOpacity>
            <Text style={styles.archiveLink}>View archive &gt;</Text>
          </TouchableOpacity>
        </View>

        {/* Goal Cards List */}
        <View style={styles.goalCardsList}>
          {goals.map((goal) => (
            <View key={goal.id} style={[styles.goalCard, Shadows.sm]}>
              {/* Category Tag */}
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{goal.category}</Text>
              </View>

              {/* Title & Description */}
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.goalDesc}>{goal.description}</Text>

              {/* Progress Bar */}
              <View style={styles.goalProgressRow}>
                <View style={styles.goalProgressTrack}>
                  <View style={[styles.goalProgressBar, { width: `${goal.progressPercent}%` }]} />
                </View>
                <Text style={styles.goalProgressNumber}>{goal.progressPercent}%</Text>
              </View>

              {/* Footer: Streak Badge & Check In Button */}
              <View style={styles.goalFooterRow}>
                <View style={styles.streakBadge}>
                  <Flame size={14} color="#365B45" strokeWidth={2.5} />
                  <Text style={styles.streakText}>{goal.streakDays} days streak</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.checkInBtn,
                    goal.checkedInToday && styles.checkInBtnActive,
                  ]}
                  onPress={() => handleToggleCheckIn(goal.id)}
                  activeOpacity={0.8}
                >
                  {goal.checkedInToday ? (
                    <CheckCircle2 size={15} color="#FFFFFF" strokeWidth={2.5} />
                  ) : (
                    <Plus size={15} color="#365B45" strokeWidth={2.5} />
                  )}
                  <Text
                    style={[
                      styles.checkInBtnText,
                      goal.checkedInToday && styles.checkInBtnTextActive,
                    ]}
                  >
                    {goal.checkedInToday ? 'Checked In' : 'Check In'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── 4. Bottom Botanical Journal Quote Banner ─────────────────── */}
        <View style={[styles.botanicalCard, Shadows.sm]}>
          <View style={styles.botanicalTopRow}>
            <Leaf size={18} color="#789B83" strokeWidth={2} />
            <Text style={styles.botanicalHeader}>STUDY SANCTUARY JOURNAL</Text>
          </View>
          <Text style={styles.botanicalQuote}>
            "Like bamboo growing in stillness, daily habits deepen unseen roots before breaking ground."
          </Text>
          <Text style={styles.botanicalAuthor}>— Mindful Student Edition</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── 5. Floating Action Button (FAB) ────────────────────────────── */}
      <TouchableOpacity
        style={[styles.fabButton, Shadows.md]}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.85}
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* ── Add Goal Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add New Goal</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={20} color="#7B857F" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>GOAL OBJECTIVE</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Read 20 pages of course literature"
              placeholderTextColor="#7B857F"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.inputLabel}>CATEGORY</Text>
            <View style={styles.categoryChipsRow}>
              {(['Coursework', 'Wellness', 'Reading', 'Routine'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    newCategory === cat && styles.catChipActive,
                  ]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      newCategory === cat && styles.catChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>TARGET FREQUENCY / DURATION</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Daily 20m before lectures"
              placeholderTextColor="#7B857F"
              value={newTarget}
              onChangeText={setNewTarget}
            />

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreateGoal}
              >
                <Text style={styles.saveBtnText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.infoModalCard}>
            <Text style={styles.modalTitle}>Goals & Habit Science</Text>
            <Text style={styles.infoModalText}>
              In Bloom, habit streaks reinforce neurological dopamine pathways for study consistency without toxic urgency. Daily check-ins build long-term academic resilience.
            </Text>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.saveBtnText}>Understood</Text>
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

  subheaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#29332E',
    letterSpacing: -0.4,
  },

  // Consistency Card
  consistencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#29332E',
  },
  percentBadge: {
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  percentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#FAF8F2',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#789B83',
    borderRadius: 4,
  },
  consistencySubtext: {
    fontSize: 12,
    color: '#7B857F',
  },

  // Gentle Observation Banner
  observationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9EEE5',
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#CDE5DB',
    gap: 12,
  },
  obsIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  observationText: {
    flex: 1,
    fontSize: 12.5,
    color: '#29332E',
    lineHeight: 18,
  },

  // Active Goals
  goalsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#29332E',
  },
  archiveLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#789B83',
  },
  goalCardsList: {
    gap: 12,
    marginBottom: 20,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    marginBottom: 8,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#365B45',
    letterSpacing: 0.5,
  },
  goalTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#29332E',
    marginBottom: 4,
  },
  goalDesc: {
    fontSize: 12,
    color: '#7B857F',
    lineHeight: 16,
    marginBottom: 12,
  },
  goalProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  goalProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#FAF8F2',
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalProgressBar: {
    height: '100%',
    backgroundColor: '#365B45',
    borderRadius: 3,
  },
  goalProgressNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
    minWidth: 32,
    textAlign: 'right',
  },
  goalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#E8ECE9',
    paddingTop: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  checkInBtnActive: {
    backgroundColor: '#365B45',
  },
  checkInBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#365B45',
  },
  checkInBtnTextActive: {
    color: '#FFFFFF',
  },

  // Botanical Journal Card
  botanicalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  botanicalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  botanicalHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#789B83',
    letterSpacing: 0.8,
  },
  botanicalQuote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#29332E',
    lineHeight: 19,
    marginBottom: 6,
  },
  botanicalAuthor: {
    fontSize: 11,
    color: '#7B857F',
    fontWeight: '500',
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

  // Modal Styles
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
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    backgroundColor: '#FAF8F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  catChipActive: {
    backgroundColor: '#D9EEE5',
    borderColor: '#789B83',
  },
  catChipText: {
    fontSize: 11.5,
    color: '#7B857F',
    fontWeight: '600',
  },
  catChipTextActive: {
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

  infoModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  infoModalText: {
    fontSize: 13.5,
    color: '#29332E',
    lineHeight: 20,
    marginVertical: 16,
  },
});

