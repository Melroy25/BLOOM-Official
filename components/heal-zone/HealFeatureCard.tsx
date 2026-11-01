import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

interface HealFeatureCardProps {
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  backgroundColor: string;
  iconBgColor: string;
  iconColor: string;
  onPress: () => void;
}

export const HealFeatureCard: React.FC<HealFeatureCardProps> = ({
  title,
  subtitle,
  Icon,
  backgroundColor,
  iconBgColor,
  iconColor,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor }, Shadows.sm]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={[styles.iconWrapper, { backgroundColor: iconBgColor }]}>
        <Icon size={24} color={iconColor} strokeWidth={2} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 148,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(41, 51, 46, 0.04)',
  },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  textContainer: {
    marginTop: Spacing.md,
  },
  title: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.darkText,
    marginBottom: 3,
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
    lineHeight: 16,
  },
});
