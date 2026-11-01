import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Smile, Clock } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { SectionHeader } from '../common/SectionHeader';
import { MoodEntry } from '../../types';

interface MoodHistorySectionProps {
  entries: MoodEntry[];
}

export const MoodHistorySection: React.FC<MoodHistorySectionProps> = ({ entries }) => {
  return (
    <View style={styles.container}>
      <SectionHeader
        title="Recent Mood History"
        subtitle="Your emotional journey over the past few days."
      />

      {entries.length === 0 ? (
        <View style={[styles.emptyContainer, Shadows.sm]}>
          <Smile size={32} color={Colors.primary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No Mood History Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap "+ Log Mood" above to log your first emotional check-in.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {entries.map((entry, index) => (
            <View
              key={entry.id || `${entry.mood}-${index}`}
              style={[
                styles.historyCard,
                index === 0 && styles.firstCard,
                Shadows.sm,
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>{entry.emoji}</Text>
                {index === 0 && (
                  <View style={styles.latestBadge}>
                    <Text style={styles.latestText}>LATEST</Text>
                  </View>
                )}
              </View>
              <Text style={styles.moodTitle} numberOfLines={1}>
                {entry.mood}
              </Text>
              <View style={styles.timeRow}>
                <Text style={styles.dateText}>{entry.date}</Text>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.timeText}>{entry.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xxl,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs,
    gap: 12,
  },
  historyCard: {
    width: 128,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  firstCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightSage + '40',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardEmoji: {
    fontSize: 28,
  },
  latestBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  latestText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  moodTitle: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 15,
    color: Colors.darkText,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
    fontWeight: '500',
  },
  dotSeparator: {
    fontSize: 10,
    color: Colors.lightText,
    marginHorizontal: 3,
  },
  timeText: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.lightText,
  },
  emptyContainer: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.darkText,
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...Typography.caption,
    color: Colors.mutedText,
    textAlign: 'center',
  },
});
