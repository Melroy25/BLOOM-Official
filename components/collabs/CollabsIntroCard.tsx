import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Users, Heart } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

export const CollabsIntroCard: React.FC = () => {
  return (
    <View style={[styles.container, Shadows.sm]}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Sparkles size={12} color={Colors.primary} strokeWidth={2.2} />
          <Text style={styles.badgeText}>BLOOM COMMUNITY</Text>
        </View>
        <View style={styles.iconPair}>
          <Users size={16} color={Colors.primary} strokeWidth={1.8} />
          <Heart size={14} color={Colors.warning} strokeWidth={2} />
        </View>
      </View>

      <Text style={styles.title}>Better together.</Text>
      <Text style={styles.description}>
        Connect with people, share your journey and grow together. You never have to walk the path alone.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.lightSage,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(120, 155, 131, 0.2)',
    marginBottom: Spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    gap: 4,
  },
  badgeText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.6,
  },
  iconPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.7,
  },
  title: {
    ...Typography.h3,
    fontSize: 18,
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
});
