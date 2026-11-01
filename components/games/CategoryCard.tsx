import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { GameCategory } from './types';

interface CategoryCardProps {
  category: GameCategory;
  isSelected: boolean;
  onSelect: () => void;
  width?: number | string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
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
        accessibilityLabel={`${category.name}, ${category.shortDesc}`}
        style={[
          styles.card,
          Shadows.sm,
          {
            backgroundColor: isSelected ? Colors.white : category.bgColor,
            borderColor: isSelected ? Colors.primaryDark : category.borderColor,
            borderWidth: isSelected ? 2 : 1.2,
          },
        ]}
      >
        {/* Selected Tick Mark Badge */}
        {isSelected && (
          <View style={styles.selectedTickBadge}>
            <Check size={11} color={Colors.white} strokeWidth={3} />
          </View>
        )}

        {/* Small Attractive Icon at the Top */}
        <View style={styles.iconCircle}>
          <Text style={styles.emojiText}>{category.emoji}</Text>
        </View>

        {/* Category Name & Short Description */}
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.categoryName,
              isSelected && styles.categoryNameSelected,
            ]}
            numberOfLines={1}
          >
            {category.name}
          </Text>
          <Text style={styles.shortDesc} numberOfLines={1}>
            {category.shortDesc}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    padding: 6,
  },
  card: {
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 114,
    justifyContent: 'space-between',
    position: 'relative',
    ...Platform.select({
      web: {
        transition: 'all 0.15s ease',
        cursor: 'pointer',
      },
    }),
  },
  selectedTickBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  emojiText: {
    fontSize: 18,
  },
  textContainer: {
    gap: 2,
  },
  categoryName: {
    ...Typography.h3,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.darkText,
  },
  categoryNameSelected: {
    color: Colors.primaryDark,
  },
  shortDesc: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
  },
});
