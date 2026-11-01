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
import { DifficultyConfig } from './types';

interface DifficultyCardProps {
  config: DifficultyConfig;
  isSelected: boolean;
  onSelect: () => void;
  width?: number | string;
  layout?: 'horizontal' | 'vertical';
}

export const DifficultyCard: React.FC<DifficultyCardProps> = ({
  config,
  isSelected,
  onSelect,
  width,
  layout = 'horizontal',
}) => {
  if (layout === 'horizontal') {
    return (
      <View style={[styles.wrapperHorizontal, width ? { width } : null]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onSelect}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
          accessibilityLabel={`${config.title} difficulty, ${config.pairsText}, ${config.cardsText}`}
          style={[
            styles.cardHorizontal,
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
          <View style={styles.contentHorizontal}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  isSelected && styles.titleSelected,
                ]}
              >
                {config.title}
              </Text>
              <View
                style={[
                  styles.pillLabel,
                  isSelected && styles.pillLabelSelected,
                ]}
              >
                <Text
                  style={[
                    styles.pillLabelText,
                    isSelected && styles.pillLabelTextSelected,
                  ]}
                >
                  {config.pairsText} • {config.cardsText}
                </Text>
              </View>
            </View>
            <Text style={styles.description} numberOfLines={1}>
              {config.description}
            </Text>
          </View>

          {/* Right: Selected Tick Mark or Empty Placeholder for alignment */}
          <View style={styles.tickContainer}>
            {isSelected ? (
              <View style={styles.selectedTickBadge}>
                <Check size={11} color={Colors.white} strokeWidth={3} />
              </View>
            ) : (
              <View style={styles.unselectedRadioCircle} />
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Vertical layout for desktop / wider viewports
  return (
    <View style={[styles.wrapperVertical, width ? { width } : null]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onSelect}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${config.title} difficulty, ${config.pairsText}, ${config.cardsText}`}
        style={[
          styles.cardVertical,
          Shadows.sm,
          {
            backgroundColor: isSelected ? Colors.white : config.bgColor,
            borderColor: isSelected ? Colors.primaryDark : 'rgba(0, 0, 0, 0.08)',
            borderWidth: isSelected ? 2 : 1.2,
          },
        ]}
      >
        {/* Selected Tick Mark Badge */}
        {isSelected && (
          <View style={styles.selectedTickBadgeTop}>
            <Check size={11} color={Colors.white} strokeWidth={3} />
          </View>
        )}

        <View style={styles.iconCircle}>
          <Text style={styles.emojiText}>{config.emoji}</Text>
        </View>

        <Text
          style={[
            styles.title,
            isSelected && styles.titleSelected,
          ]}
        >
          {config.title}
        </Text>

        <View style={[styles.pillLabel, isSelected && styles.pillLabelSelected]}>
          <Text
            style={[
              styles.pillLabelText,
              isSelected && styles.pillLabelTextSelected,
            ]}
          >
            {config.pairsText} • {config.cardsText}
          </Text>
        </View>

        <Text style={styles.descriptionVertical} numberOfLines={2}>
          {config.description}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Horizontal layout styles (stacked on mobile)
  wrapperHorizontal: {
    width: '100%',
    paddingVertical: 5,
  },
  cardHorizontal: {
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
    height: 84,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: {
        transition: 'all 0.15s ease',
        cursor: 'pointer',
      },
    }),
  },
  contentHorizontal: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tickContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },

  // Vertical layout styles (side-by-side on desktop)
  wrapperVertical: {
    padding: 6,
  },
  cardVertical: {
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 16,
    height: 156,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    ...Platform.select({
      web: {
        transition: 'all 0.15s ease',
        cursor: 'pointer',
      },
    }),
  },
  selectedTickBadgeTop: {
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

  // Shared styles
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  emojiText: {
    fontSize: 20,
  },
  title: {
    ...Typography.h3,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkText,
    letterSpacing: 0.5,
  },
  titleSelected: {
    color: Colors.primaryDark,
  },
  pillLabel: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  pillLabelSelected: {
    backgroundColor: Colors.lightSage,
    borderColor: 'rgba(54, 91, 69, 0.25)',
  },
  pillLabelText: {
    ...Typography.label,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mutedText,
  },
  pillLabelTextSelected: {
    color: Colors.primaryDark,
  },
  description: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.mutedText,
    lineHeight: 16,
  },
  descriptionVertical: {
    ...Typography.bodySmall,
    fontSize: 11.5,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 15,
  },
  selectedTickBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
