import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Quote, Leaf } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

interface QuoteCardProps {
  text: string;
  author: string;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ text, author }) => {
  return (
    <View style={[styles.container, Shadows.md]}>
      <View style={styles.decorTop}>
        <View style={styles.quoteIconBg}>
          <Quote size={16} color={Colors.primary} strokeWidth={2} />
        </View>
        <View style={styles.leafDecor}>
          <Leaf size={18} color={Colors.primary} strokeWidth={1.5} style={{ opacity: 0.4 }} />
        </View>
      </View>
      <Text style={styles.quoteText}>{text}</Text>
      <View style={styles.footer}>
        <View style={styles.divider} />
        <Text style={styles.author}>— {author}</Text>
      </View>
      <View style={styles.botanicalDecor}>
        <Leaf size={40} color={Colors.lightSage} strokeWidth={1} style={{ opacity: 0.3, transform: [{ rotate: '45deg' }] }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.lightSage,
    overflow: 'hidden',
    position: 'relative',
  },
  decorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  quoteIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafDecor: {
    opacity: 0.6,
  },
  quoteText: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.primaryDark,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  divider: {
    width: 24,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
    marginRight: Spacing.sm,
    opacity: 0.4,
  },
  author: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  botanicalDecor: {
    position: 'absolute',
    bottom: -5,
    right: -5,
  },
});
