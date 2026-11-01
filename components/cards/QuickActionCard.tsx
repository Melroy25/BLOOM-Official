import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
}

function toPascalCase(str: string): string {
  return str.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, description, icon, color, onPress }) => {
  const IconComponent = (LucideIcons as any)[toPascalCase(icon)] || LucideIcons.HelpCircle;

  return (
    <TouchableOpacity style={[styles.container, Shadows.sm]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <IconComponent size={22} color={Colors.primaryDark} strokeWidth={1.5} />
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <Text style={styles.description} numberOfLines={1}>{description}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '48%',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    ...Typography.caption,
    color: Colors.mutedText,
  },
});
