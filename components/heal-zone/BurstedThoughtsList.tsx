import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, Clock, CheckCircle2, Wind } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { BurstedThought } from '../../data/healBubbleData';

interface BurstedThoughtsListProps {
  thoughts: BurstedThought[];
  onClearHistory?: () => void;
}

export const BurstedThoughtsList: React.FC<BurstedThoughtsListProps> = ({
  thoughts,
  onClearHistory,
}) => {
  return (
    <View style={styles.container}>
      {/* SECTION HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithBadge}>
          <Text style={styles.sectionTitle}>Bursted</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{thoughts.length}</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>Worries you let go of</Text>
      </View>

      {/* THOUGHTS LIST */}
      {thoughts.length === 0 ? (
        <View style={[styles.emptyCard, Shadows.sm]}>
          <View style={styles.emptyIconCircle}>
            <Wind size={22} color={Colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>No bursted thoughts yet</Text>
          <Text style={styles.emptySubtitle}>
            Type a worry in the box below to float it away and see your session history here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {thoughts.map(item => (
            <View key={item.id} style={[styles.card, Shadows.sm]}>
              {/* TOP ROW: THOUGHT TEXT & FEELING BADGE */}
              <View style={styles.cardTopRow}>
                <Text style={styles.thoughtText} numberOfLines={2}>
                  {item.thought}
                </Text>
                <View style={styles.feelingBadge}>
                  <Text style={styles.feelingEmoji}>{item.feelingEmoji}</Text>
                  <Text style={styles.feelingText}>{item.feeling}</Text>
                </View>
              </View>

              {/* BOTTOM ROW: DATE & DISSOLVED STATUS */}
              <View style={styles.cardBottomRow}>
                <View style={styles.timeWrapper}>
                  <Clock size={12} color={Colors.mutedText} strokeWidth={1.8} />
                  <Text style={styles.timeText}>
                    {item.date}, {item.time}
                  </Text>
                </View>
                <View style={styles.dissolvedTag}>
                  <Sparkles size={11} color={Colors.primary} strokeWidth={2} />
                  <Text style={styles.dissolvedTagText}>Dissolved</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.darkText,
  },
  countBadge: {
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  countText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  sectionSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
  },
  list: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  thoughtText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
    flex: 1,
    lineHeight: 20,
  },
  feelingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    gap: 4,
  },
  feelingEmoji: {
    fontSize: 12,
  },
  feelingText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 236, 233, 0.6)',
    paddingTop: Spacing.sm,
    marginTop: 2,
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
  },
  dissolvedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dissolvedTagText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: Spacing.lg,
  },
});
