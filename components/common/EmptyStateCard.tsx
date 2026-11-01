import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import * as LucideIcons from 'lucide-react-native';

interface EmptyStateCardProps {
  icon: string;
  title: string;
  description: string;
  color?: string;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({ icon, title, description, color = Colors.primary }) => {
  const IconComponent = (LucideIcons as any)[toPascalCase(icon)] || LucideIcons.HelpCircle;
  
  return (
    <View style={[styles.container, Shadows.md]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <IconComponent size={32} color={color} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

function toPascalCase(str: string): string {
  return str.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...Typography.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
  },
});
