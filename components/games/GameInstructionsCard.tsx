import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HelpCircle } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

export const GameInstructionsCard: React.FC = () => {
  const steps = [
    'Flip two cards at a time to reveal their symbols.',
    'Find and match all identical pairs.',
    'Remember the positions of previously flipped cards.',
    'Match all pairs to complete the game.',
  ];

  return (
    <View style={[styles.card, Shadows.sm]}>
      <View style={styles.header}>
        <HelpCircle size={15} color={Colors.primaryDark} strokeWidth={2.4} />
        <Text style={styles.title}>How to Play</Text>
      </View>

      <View style={styles.list}>
        {steps.map((text, idx) => (
          <View key={idx} style={styles.item}>
            <View style={styles.dot} />
            <Text style={styles.itemText}>{text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.darkText,
  },
  list: {
    gap: 7,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primaryDark,
  },
  itemText: {
    ...Typography.bodySmall,
    fontSize: 12.5,
    color: Colors.darkText,
    flex: 1,
    lineHeight: 17,
  },
});
