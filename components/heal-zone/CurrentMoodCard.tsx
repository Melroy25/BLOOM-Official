import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Sparkles } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

interface CurrentMoodCardProps {
  moodEmoji: string;
  moodName: string;
  lastLoggedTime?: string;
  onLogMoodPress: () => void;
}

export const CurrentMoodCard: React.FC<CurrentMoodCardProps> = ({
  moodEmoji,
  moodName,
  lastLoggedTime = 'Today, 8:45 AM',
  onLogMoodPress,
}) => {
  return (
    <View style={[styles.card, Shadows.md]}>
      {/* Top Tag */}
      <View style={styles.topRow}>
        <View style={styles.tag}>
          <Sparkles size={13} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.tagText}>YOUR CURRENT MOOD</Text>
        </View>
        <Text style={styles.timeText}>{lastLoggedTime}</Text>
      </View>

      {/* Main Content Row */}
      <View style={styles.contentRow}>
        <View style={styles.emojiContainer}>
          <Text style={styles.emojiText}>{moodEmoji}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.moodLabel}>{moodName}</Text>
          <Text style={styles.questionText}>How are you feeling today?</Text>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.logButton, Shadows.sm]}
        onPress={onLogMoodPress}
        activeOpacity={0.82}
      >
        <Plus size={18} color={Colors.white} strokeWidth={2.5} />
        <Text style={styles.logButtonText}>Log Mood</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.lightSage,
    marginBottom: Spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightSage,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    gap: 4,
  },
  tagText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  timeText: {
    ...Typography.caption,
    color: Colors.lightText,
    fontSize: 11,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emojiContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  emojiText: {
    fontSize: 34,
  },
  textContainer: {
    flex: 1,
  },
  moodLabel: {
    ...Typography.h2,
    fontSize: 24,
    color: Colors.darkText,
    marginBottom: 2,
  },
  questionText: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    fontSize: 13,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    gap: 8,
  },
  logButtonText: {
    ...Typography.button,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
