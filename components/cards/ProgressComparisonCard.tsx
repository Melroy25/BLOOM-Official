import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, AlertCircle, Clock, Zap, ListChecks, Sun, Mountain, Monitor, Coffee, Leaf, TreePine } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { ProgressData } from '../../types';

interface ProgressComparisonCardProps {
  beforeData: ProgressData;
  afterData: ProgressData;
}

const BeforeIllustration = () => (
  <View style={styles.illustrationContainer}>
    <LinearGradient
      colors={['#F9E4D4', '#E8CBB8', '#C9A992']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.illustrationBg}
    >
      <View style={styles.skyBefore}>
        <Sun size={32} color="#E08C5D" strokeWidth={1.5} />
      </View>
      <View style={styles.deskScene}>
        <Monitor size={36} color="#5D4B3C" strokeWidth={1.6} />
        <Coffee size={20} color="#7D5B3C" strokeWidth={1.6} style={{ marginLeft: 12 }} />
      </View>
      <Text style={styles.illustrationLabelBefore}>Messy desk · Scattered thoughts</Text>
    </LinearGradient>
  </View>
);

const AfterIllustration = () => (
  <View style={styles.illustrationContainer}>
    <LinearGradient
      colors={['#D2EBE4', '#A8D8C8', '#78B29C']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.illustrationBg}
    >
      <View style={styles.skyAfter}>
        <Sun size={32} color="#FCE588" strokeWidth={1.8} />
      </View>
      <View style={styles.landscapeScene}>
        <Mountain size={38} color="#2A5C43" strokeWidth={1.6} />
        <TreePine size={28} color="#1D4430" strokeWidth={1.6} style={{ marginLeft: 6 }} />
        <Leaf size={22} color="#457A5D" strokeWidth={1.6} style={{ marginLeft: 6 }} />
      </View>
      <Text style={styles.illustrationLabelAfter}>Calm mountains · Focused mind</Text>
    </LinearGradient>
  </View>
);

const StatRow = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <View style={styles.statRow}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Icon size={16} color={color} strokeWidth={1.8} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

export const ProgressComparisonCard: React.FC<ProgressComparisonCardProps> = ({ beforeData, afterData }) => {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before');
  const data = activeTab === 'before' ? beforeData : afterData;
  const isBefore = activeTab === 'before';

  return (
    <View style={[styles.container, Shadows.md]}>
      {/* Segmented Toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleButton, isBefore && styles.toggleActive]}
          onPress={() => setActiveTab('before')}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, isBefore && styles.toggleTextActive]}>Before</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, !isBefore && styles.toggleActiveAfter]}
          onPress={() => setActiveTab('after')}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, !isBefore && styles.toggleTextActive]}>After</Text>
        </TouchableOpacity>
      </View>

      {/* Card Title */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{isBefore ? 'Before' : 'After'}</Text>
        <Text style={styles.cardSubtitle}>{isBefore ? 'Unfocused & Busy' : 'Focused & Productive'}</Text>
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        </View>
      </View>

      {/* Illustration */}
      {isBefore ? <BeforeIllustration /> : <AfterIllustration />}

      {/* Status Badge */}
      <View style={[styles.statusBadge, isBefore ? styles.statusBefore : styles.statusAfter]}>
        {isBefore ? (
          <AlertCircle size={18} color={Colors.warning} strokeWidth={2} />
        ) : (
          <CheckCircle size={18} color={Colors.success} strokeWidth={2} />
        )}
        <View style={styles.statusText}>
          <Text style={styles.statusTitle}>{isBefore ? 'Low Productivity' : 'High Productivity'}</Text>
          <Text style={styles.statusDesc}>{data.message}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.overviewLabel}>Today's Overview</Text>
        <StatRow
          icon={ListChecks}
          label="Tasks Completed"
          value={data.tasksCompleted}
          color={isBefore ? Colors.warning : Colors.success}
        />
        <StatRow
          icon={Clock}
          label="Focus Time"
          value={data.focusTime}
          color={isBefore ? Colors.warning : Colors.primary}
        />
        <StatRow
          icon={Zap}
          label="Energy Level"
          value={data.energyLevel}
          color={isBefore ? Colors.warning : Colors.success}
        />
      </View>

      {/* Sample Data Notice */}
      <Text style={styles.sampleNotice}>✦ Sample progress illustration</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  toggle: {
    flexDirection: 'row',
    margin: Spacing.lg,
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.round,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.round,
  },
  toggleActive: {
    backgroundColor: Colors.peach,
  },
  toggleActiveAfter: {
    backgroundColor: Colors.lightSage,
  },
  toggleText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  toggleTextActive: {
    color: Colors.darkText,
  },
  cardHeader: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.h2,
  },
  cardSubtitle: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    marginTop: 2,
  },
  dateBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: Colors.cream,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  dateText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  illustrationContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  illustrationBg: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  skyBefore: {
    marginBottom: Spacing.md,
  },
  skyAfter: {
    marginBottom: Spacing.md,
  },
  deskScene: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  landscapeScene: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  illustrationLabelBefore: {
    ...Typography.caption,
    color: '#5D4B3C',
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  illustrationLabelAfter: {
    ...Typography.caption,
    color: '#1D4430',
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  statusBefore: {
    backgroundColor: Colors.peach + '60',
  },
  statusAfter: {
    backgroundColor: Colors.lightSage,
  },
  statusText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  statusTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  statusDesc: {
    ...Typography.caption,
    marginTop: 1,
  },
  statsSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  overviewLabel: {
    ...Typography.label,
    marginBottom: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statLabel: {
    ...Typography.body,
    flex: 1,
  },
  statValue: {
    ...Typography.body,
    fontWeight: '700',
  },
  sampleNotice: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.lightText,
    paddingBottom: Spacing.lg,
    fontSize: 11,
  },
});
