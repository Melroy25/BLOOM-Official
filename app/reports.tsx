import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Share,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock,
  Smile,
  Download,
  Share2,
} from 'lucide-react-native';
import { Spacing, BorderRadius } from '../constants/spacing';
import { Shadows } from '../constants/shadows';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getUserTasks, getUserMoodEntries } from '../services/firestoreService';
import { loadWeeklyUsage, WeeklyUsageEntry } from '../services/storageService';
import { formatMinutes } from '../services/screenTimeService';
import { TaskDocument, MoodEntryDocument } from '../types';

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const { colors, isDark } = useTheme();
  const { user, userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'thisWeek' | 'lastWeek'>('thisWeek');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Real user data state
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntryDocument[]>([]);
  const [usageEntries, setUsageEntries] = useState<WeeklyUsageEntry[]>([]);

  // 1. Fetch live user data
  const loadReportsData = useCallback(async () => {
    try {
      const usage = await loadWeeklyUsage();
      setUsageEntries(usage);

      if (user?.uid) {
        const [fetchedTasks, fetchedMoods] = await Promise.all([
          getUserTasks(user.uid),
          getUserMoodEntries(user.uid, 60),
        ]);
        setTasks(fetchedTasks);
        setMoodEntries(fetchedMoods);
      }
    } catch (err) {
      console.warn('[ReportsScreen] Error loading real data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadReportsData();
  };

  // 2. Date ranges computation
  const dateRanges = useMemo(() => {
    const now = new Date();
    // This Week: last 7 days through today
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - 6);

    // Last Week: 7 to 13 days ago
    const lastWeekEnd = new Date(now);
    lastWeekEnd.setDate(now.getDate() - 7);
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 13);

    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return {
      thisWeek: `${fmt(thisWeekStart)} – ${fmt(now)}`,
      lastWeek: `${fmt(lastWeekStart)} – ${fmt(lastWeekEnd)}`,
      thisWeekStart,
      thisWeekEnd: now,
      lastWeekStart,
      lastWeekEnd,
    };
  }, []);

  // 3. Computed KPIs for active tab
  const computedStats = useMemo(() => {
    const isThisWeek = activeTab === 'thisWeek';
    const startDate = isThisWeek ? dateRanges.thisWeekStart : dateRanges.lastWeekStart;
    const endDate = isThisWeek ? dateRanges.thisWeekEnd : dateRanges.lastWeekEnd;

    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    // A. Tasks KPI
    // Count real tasks (if tasks have timestamps, filter; otherwise use all user tasks)
    const filteredTasks = tasks.filter((t) => {
      if (!t.createdAt) return isThisWeek;
      const tMs = (t.createdAt as any)?.toMillis ? (t.createdAt as any).toMillis() : new Date(t.createdAt).getTime();
      return tMs >= startMs && tMs <= endMs + 86400000;
    });

    // If filtered set is empty, fall back to current active tasks for this week
    const effectiveTasks = filteredTasks.length > 0 ? filteredTasks : isThisWeek ? tasks : [];
    const totalTasks = effectiveTasks.length;
    const completedTasks = effectiveTasks.filter((t) => t.completed).length;
    const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // B. Screen Time KPI (minutes from storageService loadWeeklyUsage)
    const usageInPeriod = usageEntries.filter((entry) => {
      const entryMs = new Date(entry.date).getTime();
      return entryMs >= startMs - 86400000 && entryMs <= endMs + 86400000;
    });

    const totalMinutes = usageInPeriod.reduce((sum, e) => sum + e.minutes, 0);
    const daysCounted = Math.max(usageInPeriod.length, 1);
    const avgDailyMinutes = Math.round(totalMinutes / daysCounted);

    // C. Mood Distribution
    const filteredMoods = moodEntries.filter((m) => {
      if (!m.createdAt) return isThisWeek;
      const mMs = (m.createdAt as any)?.toMillis ? (m.createdAt as any).toMillis() : new Date(m.createdAt).getTime();
      return mMs >= startMs - 86400000 && mMs <= endMs + 86400000;
    });

    const effectiveMoods = filteredMoods.length > 0 ? filteredMoods : isThisWeek ? moodEntries : [];
    const totalMoods = effectiveMoods.length;

    let calmCount = 0;
    let happyCount = 0;
    let stressedCount = 0;
    let tiredCount = 0;

    effectiveMoods.forEach((m) => {
      const mood = m.mood;
      if (mood === 'Calm') calmCount++;
      else if (mood === 'Happy' || mood === 'Excited') happyCount++;
      else if (mood === 'Stressed' || mood === 'Anxious') stressedCount++;
      else if (mood === 'Tired' || mood === 'Sad' || mood === 'Neutral') tiredCount++;
    });

    const calmPercent = totalMoods > 0 ? Math.round((calmCount / totalMoods) * 100) : 0;
    const happyPercent = totalMoods > 0 ? Math.round((happyCount / totalMoods) * 100) : 0;
    const stressedPercent = totalMoods > 0 ? Math.round((stressedCount / totalMoods) * 100) : 0;
    const tiredPercent = totalMoods > 0 ? Math.round((tiredCount / totalMoods) * 100) : 0;

    // D. Weekly Wellness Score Index (0 - 100)
    let wellnessScore = 75; // baseline
    if (totalTasks > 0) {
      wellnessScore += Math.round((taskPercent - 50) * 0.2);
    }
    if (totalMoods > 0) {
      const positiveRatio = (calmCount + happyCount) / totalMoods;
      wellnessScore += Math.round((positiveRatio - 0.5) * 20);
    }
    if (avgDailyMinutes > 0 && avgDailyMinutes <= 120) {
      wellnessScore += 5;
    } else if (avgDailyMinutes > 180) {
      wellnessScore -= 5;
    }
    wellnessScore = Math.max(40, Math.min(98, wellnessScore));

    return {
      totalTasks,
      completedTasks,
      taskPercent,
      avgDailyMinutes,
      totalMoods,
      calmPercent,
      happyPercent,
      stressedPercent,
      tiredPercent,
      wellnessScore,
    };
  }, [activeTab, dateRanges, tasks, usageEntries, moodEntries]);

  // 4. Share Weekly Report
  const handleExport = async () => {
    const periodLabel = activeTab === 'thisWeek' ? dateRanges.thisWeek : dateRanges.lastWeek;
    const summary = [
      `🌱 BLOOM Wellness Report (${periodLabel})`,
      `User: ${userProfile?.fullName || 'Bloom Member'}`,
      `Weekly Wellness Index: ${computedStats.wellnessScore}/100`,
      `Tasks Done: ${computedStats.completedTasks}/${computedStats.totalTasks} (${computedStats.taskPercent}%)`,
      `Avg Daily App Time: ${formatMinutes(computedStats.avgDailyMinutes)}`,
      `Mood Distribution: Calm ${computedStats.calmPercent}%, Happy ${computedStats.happyPercent}%, Stressed ${computedStats.stressedPercent}%, Tired ${computedStats.tiredPercent}%`,
      `Grow at your own pace with BLOOM 🌱`,
    ].join('\n');

    try {
      await Share.share({
        message: summary,
        title: 'My BLOOM Wellness Report',
      });
    } catch {
      Alert.alert('Report Summary', summary);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.white, borderColor: colors.border }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.darkText} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.darkText }]}>Wellness Reports</Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.white, borderColor: colors.border }]}
          onPress={handleExport}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Export report"
        >
          <Download size={18} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Period Selector */}
        <View style={[styles.periodToggle, { backgroundColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.periodBtn,
              activeTab === 'thisWeek' && [styles.periodBtnActive, { backgroundColor: colors.white }],
            ]}
            onPress={() => setActiveTab('thisWeek')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.periodBtnText,
                { color: activeTab === 'thisWeek' ? colors.primaryDark : colors.mutedText },
              ]}
            >
              This Week (Current)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodBtn,
              activeTab === 'lastWeek' && [styles.periodBtnActive, { backgroundColor: colors.white }],
            ]}
            onPress={() => setActiveTab('lastWeek')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.periodBtnText,
                { color: activeTab === 'lastWeek' ? colors.primaryDark : colors.mutedText },
              ]}
            >
              Last Week
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Subtitle */}
        <View style={styles.dateRow}>
          <Calendar size={14} color={colors.mutedText} strokeWidth={1.8} />
          <Text style={[styles.dateText, { color: colors.mutedText }]}>
            {activeTab === 'thisWeek' ? dateRanges.thisWeek : dateRanges.lastWeek}
          </Text>
        </View>

        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.mutedText, fontSize: 13 }}>
              Loading your verified wellness data...
            </Text>
          </View>
        ) : (
          <>
            {/* Overall Wellness Score Card */}
            <View
              style={[
                styles.scoreCard,
                Shadows.sm,
                { backgroundColor: colors.white, borderColor: colors.border },
              ]}
            >
              <View style={styles.scoreTop}>
                <View>
                  <Text style={[styles.scoreLabel, { color: colors.mutedText }]}>Weekly Wellness Index</Text>
                  <Text style={[styles.scoreValue, { color: colors.primaryDark }]}>
                    {computedStats.wellnessScore}
                    <Text style={[styles.scoreOutOf, { color: colors.mutedText }]}> / 100</Text>
                  </Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: colors.lightSage }]}>
                  <TrendingUp size={14} color={colors.primaryDark} strokeWidth={2.2} />
                  <Text style={[styles.scoreBadgeText, { color: colors.primaryDark }]}>
                    {activeTab === 'thisWeek' ? 'Active Period' : 'Archived'}
                  </Text>
                </View>
              </View>

              {/* Score Bar */}
              <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${computedStats.wellnessScore}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.scoreSummary, { color: colors.mutedText }]}>
                Status:{' '}
                <Text style={{ fontWeight: '700', color: colors.darkText }}>
                  {computedStats.wellnessScore >= 80
                    ? 'Balanced & Focused'
                    : computedStats.wellnessScore >= 60
                    ? 'Consistent Progress'
                    : 'Building Momentum'}
                </Text>
                . {computedStats.totalTasks > 0
                  ? `${computedStats.completedTasks} tasks completed across your daily wellness and study goals.`
                  : 'Establish your baseline by adding daily goals on the Home dashboard.'}
              </Text>
            </View>

            {/* 2-Column KPI Cards */}
            <View style={styles.kpiRow}>
              {/* KPI 1: Tasks Completion */}
              <View
                style={[
                  styles.kpiCard,
                  Shadows.sm,
                  { backgroundColor: colors.white, borderColor: colors.border },
                ]}
              >
                <View style={[styles.kpiIconWrap, { backgroundColor: '#E8F1E8' }]}>
                  <CheckCircle2 size={18} color="#365B45" strokeWidth={2.2} />
                </View>
                <Text style={[styles.kpiValue, { color: colors.darkText }]}>
                  {computedStats.totalTasks > 0 ? `${computedStats.taskPercent}%` : '0%'}
                </Text>
                <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>Task Completion</Text>
                <Text style={[styles.kpiSub, { color: colors.primary }]}>
                  {computedStats.totalTasks > 0
                    ? `${computedStats.completedTasks} of ${computedStats.totalTasks} done`
                    : 'No tasks logged'}
                </Text>
              </View>

              {/* KPI 2: Active Time */}
              <View
                style={[
                  styles.kpiCard,
                  Shadows.sm,
                  { backgroundColor: colors.white, borderColor: colors.border },
                ]}
              >
                <View style={[styles.kpiIconWrap, { backgroundColor: '#E0EAF5' }]}>
                  <Clock size={18} color="#2D5B7B" strokeWidth={2.2} />
                </View>
                <Text style={[styles.kpiValue, { color: colors.darkText }]}>
                  {computedStats.avgDailyMinutes > 0
                    ? formatMinutes(computedStats.avgDailyMinutes)
                    : '0m'}
                </Text>
                <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>Daily Avg App Time</Text>
                <Text style={[styles.kpiSub, { color: '#2D5B7B' }]}>
                  {computedStats.avgDailyMinutes > 0 && computedStats.avgDailyMinutes <= 120
                    ? 'Mindful usage'
                    : computedStats.avgDailyMinutes > 120
                    ? 'Higher usage'
                    : 'Tracking active'}
                </Text>
              </View>
            </View>

            {/* Mood Analytics Breakdown */}
            <View
              style={[
                styles.breakdownCard,
                Shadows.sm,
                { backgroundColor: colors.white, borderColor: colors.border },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleWrap}>
                  <Smile size={18} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.cardTitle, { color: colors.darkText }]}>Mood Distribution</Text>
                </View>
                <Text style={[styles.cardSubText, { color: colors.mutedText }]}>
                  {computedStats.totalMoods > 0 ? `${computedStats.totalMoods} entries` : 'No logs yet'}
                </Text>
              </View>

              {computedStats.totalMoods === 0 ? (
                <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                  <Text style={{ color: colors.mutedText, fontSize: 13, textAlign: 'center' }}>
                    No emotional check-ins logged for this timeframe.{'\n'}Log your mood in the Heal Zone to see your breakdown.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.moodItem}>
                    <View style={styles.moodLabelRow}>
                      <Text style={[styles.moodName, { color: colors.darkText }]}>Calm / Peaceful</Text>
                      <Text style={[styles.moodPercent, { color: colors.mutedText }]}>
                        {computedStats.calmPercent}%
                      </Text>
                    </View>
                    <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}>
                      <View style={[styles.miniBarFill, { width: `${computedStats.calmPercent}%`, backgroundColor: '#789B83' }]} />
                    </View>
                  </View>

                  <View style={styles.moodItem}>
                    <View style={styles.moodLabelRow}>
                      <Text style={[styles.moodName, { color: colors.darkText }]}>Happy / Energized</Text>
                      <Text style={[styles.moodPercent, { color: colors.mutedText }]}>
                        {computedStats.happyPercent}%
                      </Text>
                    </View>
                    <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}>
                      <View style={[styles.miniBarFill, { width: `${computedStats.happyPercent}%`, backgroundColor: '#F0C87D' }]} />
                    </View>
                  </View>

                  <View style={styles.moodItem}>
                    <View style={styles.moodLabelRow}>
                      <Text style={[styles.moodName, { color: colors.darkText }]}>Stressed / Rushed</Text>
                      <Text style={[styles.moodPercent, { color: colors.mutedText }]}>
                        {computedStats.stressedPercent}%
                      </Text>
                    </View>
                    <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}>
                      <View style={[styles.miniBarFill, { width: `${computedStats.stressedPercent}%`, backgroundColor: '#E8B86D' }]} />
                    </View>
                  </View>

                  <View style={styles.moodItem}>
                    <View style={styles.moodLabelRow}>
                      <Text style={[styles.moodName, { color: colors.darkText }]}>Tired / Low Energy</Text>
                      <Text style={[styles.moodPercent, { color: colors.mutedText }]}>
                        {computedStats.tiredPercent}%
                      </Text>
                    </View>
                    <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}>
                      <View style={[styles.miniBarFill, { width: `${computedStats.tiredPercent}%`, backgroundColor: '#A5AEA8' }]} />
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Personalized AI Insight Card */}
            <View
              style={[
                styles.insightCard,
                Shadows.sm,
                { backgroundColor: colors.lightSage, borderColor: colors.primary + '30' },
              ]}
            >
              <View style={styles.insightHeader}>
                <Sparkles size={18} color={colors.primaryDark} strokeWidth={2} />
                <Text style={[styles.insightTitle, { color: colors.primaryDark }]}>
                  BLOOM Weekly Insight
                </Text>
              </View>
              <Text style={[styles.insightText, { color: colors.darkText }]}>
                {userProfile?.fullName ? `${userProfile.fullName}, ` : 'Friend, '}
                {computedStats.taskPercent >= 70
                  ? 'you maintained strong consistency with your daily tasks this period! Regular check-ins in the Heal Zone reinforce mindful habits.'
                  : computedStats.totalTasks > 0
                  ? 'you made progress on your wellness goals. Remember that small daily steps compound into life-changing habits.'
                  : 'start tracking your daily wellness habits on the home screen to unlock deeper personalized insights!'}
              </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: colors.primary }]}
              onPress={handleExport}
              activeOpacity={0.85}
            >
              <Share2 size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.exportButtonText}>Share Weekly Summary</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.huge,
  },
  periodToggle: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: BorderRadius.round,
    marginBottom: Spacing.md,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.round,
  },
  periodBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  periodBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.lg,
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scoreCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  scoreTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scoreOutOf: {
    fontSize: 16,
    fontWeight: '400',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    gap: 4,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreSummary: {
    fontSize: 13,
    lineHeight: 19,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  kpiCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  kpiSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  breakdownCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubText: {
    fontSize: 12,
  },
  moodItem: {
    marginBottom: Spacing.md,
  },
  moodLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  moodName: {
    fontSize: 13,
    fontWeight: '500',
  },
  moodPercent: {
    fontSize: 12,
    fontWeight: '600',
  },
  miniBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  insightText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
