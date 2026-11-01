import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Check, Lightbulb } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { WordDifficultyConfig } from './wordDetectiveData';

interface WordDifficultyCardProps {
  config: WordDifficultyConfig;
  isSelected: boolean;
  onSelect: () => void;
  width?: number | string;
}

export const WordDifficultyCard: React.FC<WordDifficultyCardProps> = ({
  config,
  isSelected,
  onSelect,
  width,
}) => {
  return (
    <View style={[styles.wrapper, width ? { width } : null]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onSelect}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${config.title} difficulty, ${config.hintsText}`}
        style={[
          styles.card,
          Shadows.sm,
          {
            backgroundColor: isSelected ? Colors.white : config.bgColor,
            borderColor: isSelected ? Colors.primaryDark : 'rgba(0, 0, 0, 0.08)',
            borderWidth: isSelected ? 2 : 1.2,
          },
        ]}
      >
        {/* Left: Icon Circle */}
        <View style={styles.iconCircle}>
          <Text style={styles.emojiText}>{config.emoji}</Text>
        </View>

        {/* Middle: Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: isSelected ? Colors.darkText : config.accentColor },
              ]}
            >
              {config.title}
            </Text>
            {/* Pill: Number of Hints */}
            <View
              style={[
                styles.pill,
                {
                  borderColor: config.accentColor,
                  backgroundColor: isSelected ? config.bgColor : Colors.white,
                },
              ]}
            >
              <Lightbulb size={11} color={config.accentColor} strokeWidth={2.4} />
              <Text style={[styles.pillText, { color: config.accentColor }]}>
                {config.hintsText}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{config.description}</Text>
        </View>

        {/* Right: Check Circle when selected */}
        <View
          style={[
            styles.checkCircle,
            isSelected && styles.checkCircleSelected,
          ]}
        >
          {isSelected && <Check size={13} color={Colors.white} strokeWidth={3} />}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.xl,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  emojiText: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  title: {
    ...Typography.h3,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  pillText: {
    ...Typography.label,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  description: {
    ...Typography.bodySmall,
    fontSize: 12.5,
    color: Colors.mutedText,
    lineHeight: 16,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkCircleSelected: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
});
