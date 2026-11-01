import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
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
  ChevronRight,
} from 'lucide-react-native';
import { Spacing, BorderRadius } from '../constants/spacing';
import { Shadows } from '../constants/shadows';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const { colors, isDark } = useTheme();
  const { userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'thisWeek' | 'lastWeek'>('thisWeek');

  const handleExport = () => {
    Alert.alert(
      'Export Weekly Report',
      'A preview of your weekly wellness summary has been generated. PDF and CSV exports are scheduled for the next release.',
      [{ text: 'Got it' }]
    );
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
            {activeTab === 'thisWeek' ? 'Oct 26 – Nov 1, 2026' : 'Oct 19 – Oct 25, 2026'}
          </Text>
        </View>

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
                {activeTab === 'thisWeek' ? '86' : '78'}
                <Text style={[styles.scoreOutOf, { color: colors.mutedText }]}> / 100</Text>
              </Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: colors.lightSage }]}>
              <TrendingUp size={14} color={colors.primaryDark} strokeWidth={2.2} />
              <Text style={[styles.scoreBadgeText, { color: colors.primaryDark }]}>
                {activeTab === 'thisWeek' ? '+8% vs last week' : 'Stable'}
              </Text>
            </View>
          </View>

          {/* Score Bar */}
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: activeTab === 'thisWeek' ? '86%' : '78%',
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.scoreSummary, { color: colors.mutedText }]}>
            Status: <Text style={{ fontWeight: '700', color: colors.darkText }}>Balanced & Focused</Text>. Consistent reflection and focus habits kept stress levels low.
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
              {activeTab === 'thisWeek' ? '82%' : '71%'}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>Task Completion</Text>
            <Text style={[styles.kpiSub, { color: colors.primary }]}>
              {activeTab === 'thisWeek' ? '23 tasks done' : '17 tasks done'}
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
              {activeTab === 'thisWeek' ? '46m' : '58m'}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>Daily Avg App Time</Text>
            <Text style={[styles.kpiSub, { color: '#2D5B7B' }]}>Healthy usage</Text>
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
            <Text style={[styles.cardSubText, { color: colors.mutedText }]}>Past 7 days</Text>
          </View>

          {/* Mood breakdown bars */}
          <View style={styles.moodItem}>
            <View style={styles.moodLabelRow}>
              <Text style={[styles.moodName, { color: colors.darkText }]}>Calm / Peaceful</Text>
              <Text style={[styles.moodPercent, { color: colors.mutedText }]}>45%</Text>
            </View>
            <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.miniBarFill, { width: '45%', backgroundColor: '#789B83' }]} />
            </View>
          </View>

          <View style={styles.moodItem}>
            <View style={styles.moodLabelRow}>
              <Text style={[styles.moodName, { color: colors.darkText }]}>Happy / Energized</Text>
              <Text style={[styles.moodPercent, { color: colors.mutedText }]}>30%</Text>
            </View>
            <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.miniBarFill, { width: '30%', backgroundColor: '#F0C87D' }]} />
            </View>
          </View>

          <View style={styles.moodItem}>
            <View style={styles.moodLabelRow}>
              <Text style={[styles.moodName, { color: colors.darkText }]}>Stressed / Rushed</Text>
              <Text style={[styles.moodPercent, { color: colors.mutedText }]}>15%</Text>
            </View>
            <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.miniBarFill, { width: '15%', backgroundColor: '#E8B86D' }]} />
            </View>
          </View>

          <View style={styles.moodItem}>
            <View style={styles.moodLabelRow}>
              <Text style={[styles.moodName, { color: colors.darkText }]}>Tired / Low Energy</Text>
              <Text style={[styles.moodPercent, { color: colors.mutedText }]}>10%</Text>
            </View>
            <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.miniBarFill, { width: '10%', backgroundColor: '#A5AEA8' }]} />
            </View>
          </View>
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
            {userProfile?.fullName ? `${userProfile.fullName}, your` : 'Your'} highest focus streak was recorded on mid-week afternoons right after using Guided Breathing. Keeping study sessions to 25 minutes helped you complete 4 more goals than average!
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
    fontSize: 34,
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
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  scoreBadgeText: {
    fontSize: 11,
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
    lineHeight: 18,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.md,
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
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  kpiSub: {
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 16,
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
    lineHeight: 19,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
