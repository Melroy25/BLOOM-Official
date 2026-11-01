import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

interface StatisticCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  progress?: number;
}

function toPascalCase(str: string): string {
  return str.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

export const StatisticCard: React.FC<StatisticCardProps> = ({ label, value, icon, color, progress }) => {
  const IconComponent = (LucideIcons as any)[toPascalCase(icon)] || LucideIcons.HelpCircle;

  return (
    <View style={[styles.container, Shadows.sm]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <IconComponent size={20} color={color} strokeWidth={1.8} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {progress !== undefined && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
        </View>
      )}
    </View>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    ...Typography.stat,
    marginBottom: 2,
  },
  label: {
    ...Typography.statLabel,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
