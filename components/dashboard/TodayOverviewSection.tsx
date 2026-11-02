import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, Clock, ShieldAlert, FileText, ArrowUpRight } from 'lucide-react-native';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { FontFamily } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';

interface TodayOverviewSectionProps {
  tasksDoneCount: number;
  totalTasksCount: number;
  screenTimeText?: string;
  onOpenTasks: () => void;
  onOpenSOS: () => void;
  onOpenReports: () => void;
}

export const TodayOverviewSection: React.FC<TodayOverviewSectionProps> = ({
  tasksDoneCount,
  totalTasksCount,
  screenTimeText = '0m',
  onOpenTasks,
  onOpenSOS,
  onOpenReports,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerWrap}>
        <Text style={[styles.sectionTitle, { color: colors.darkText }]}>Today's Overview</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
          A quick look at your day.
        </Text>
      </View>

      {/* 2-Column Grid */}
      <View style={styles.grid}>
        {/* TILE A: Tasks Done */}
        <TouchableOpacity
          style={[
            styles.tileCard,
            Shadows.sm,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
          onPress={onOpenTasks}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`Tasks Done: ${tasksDoneCount} of ${totalTasksCount} completed`}
        >
          <View style={styles.tileTopRow}>
            <View style={[styles.iconPill, { backgroundColor: colors.accentSoft }]}>
              <CheckCircle2 size={18} color={colors.accent} strokeWidth={2.2} />
            </View>
            <Text style={[styles.tileCategory, { color: colors.mutedText }]}>Tasks</Text>
          </View>

          <View style={styles.tileBottom}>
            <Text style={[styles.tileMetric, { color: colors.darkText }]}>
              {tasksDoneCount} / {totalTasksCount}
            </Text>
            <Text style={[styles.tileDesc, { color: colors.mutedText }]}>
              {totalTasksCount === 0
                ? 'No tasks for today'
                : tasksDoneCount === totalTasksCount
                ? 'All completed'
                : 'Tasks completed'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* TILE B: Screen Time */}
        <View
          style={[
            styles.tileCard,
            Shadows.sm,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
        >
          <View style={styles.tileTopRow}>
            <View style={[styles.iconPill, { backgroundColor: '#E0EAF5' }]}>
              <Clock size={18} color="#2D5B7B" strokeWidth={2.2} />
            </View>
            <Text style={[styles.tileCategory, { color: colors.mutedText }]}>Usage</Text>
          </View>

          <View style={styles.tileBottom}>
            <Text style={[styles.tileMetric, { color: colors.darkText }]}>
              {screenTimeText}
            </Text>
            <Text style={[styles.tileDesc, { color: colors.mutedText }]}>
              In-app active time
            </Text>
          </View>
        </View>

        {/* TILE C: SOS Signal */}
        <TouchableOpacity
          style={[
            styles.tileCard,
            Shadows.sm,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
          onPress={onOpenSOS}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Open SOS crisis resources"
        >
          <View style={styles.tileTopRow}>
            <View style={[styles.iconPill, { backgroundColor: '#FDECEC' }]}>
              <ShieldAlert size={18} color="#D9534F" strokeWidth={2.2} />
            </View>
            <View style={styles.arrowWrap}>
              <ArrowUpRight size={14} color="#D9534F" strokeWidth={2.2} />
            </View>
          </View>

          <View style={styles.tileBottom}>
            <Text style={[styles.tileMetric, { color: colors.darkText }]}>
              SOS Signal
            </Text>
            <Text style={[styles.tileDesc, { color: colors.mutedText }]}>
              Crisis & student help
            </Text>
          </View>
        </TouchableOpacity>

        {/* TILE D: Reports */}
        <TouchableOpacity
          style={[
            styles.tileCard,
            Shadows.sm,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
          onPress={onOpenReports}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Open wellness reports"
        >
          <View style={styles.tileTopRow}>
            <View style={[styles.iconPill, { backgroundColor: '#EAE5F4' }]}>
              <FileText size={18} color="#5A4A7A" strokeWidth={2.2} />
            </View>
            <View style={styles.arrowWrap}>
              <ArrowUpRight size={14} color="#5A4A7A" strokeWidth={2.2} />
            </View>
          </View>

          <View style={styles.tileBottom}>
            <Text style={[styles.tileMetric, { color: colors.darkText }]}>
              Reports
            </Text>
            <Text style={[styles.tileDesc, { color: colors.mutedText }]}>
              Weekly insights & PDF
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  headerWrap: {
    marginBottom: Spacing.md,
    gap: 2,
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
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  tileCard: {
    width: '48%',
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1,
    minHeight: 116,
    justifyContent: 'space-between',
  },
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowWrap: {
    padding: 2,
  },
  tileCategory: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tileBottom: {
    gap: 2,
    marginTop: 6,
  },
  tileMetric: {
    fontFamily: FontFamily.monoBold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  tileDesc: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 11,
    lineHeight: 15,
  },
});
