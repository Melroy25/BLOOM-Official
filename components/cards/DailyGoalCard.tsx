import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface DailyGoalCardProps {
  title: string;
  icon: string;
  completed: boolean;
  onToggle: () => void;
}

function toPascalCase(str: string): string {
  return str.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({ title, icon, completed, onToggle }) => {
  const IconComponent = (LucideIcons as any)[toPascalCase(icon)] || LucideIcons.Circle;

  return (
    <TouchableOpacity
      style={[styles.container, completed && styles.completedContainer]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconBg, completed && styles.completedIconBg]}>
          <IconComponent size={16} color={completed ? Colors.white : Colors.primary} strokeWidth={1.8} />
        </View>
        <Text style={[styles.title, completed && styles.completedTitle]}>{title}</Text>
      </View>
      <View style={[styles.checkbox, completed && styles.checkedBox]}>
        {completed && <Check size={14} color={Colors.white} strokeWidth={2.5} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completedContainer: {
    backgroundColor: Colors.lightSage,
    borderColor: Colors.primary + '30',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  completedIconBg: {
    backgroundColor: Colors.primary,
  },
  title: {
    ...Typography.body,
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: Colors.mutedText,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  checkedBox: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
