import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ArrowRight, Check } from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';
import { WORD_CATEGORIES, WordCategoryKey } from '../../../components/games/wordDetectiveData';

export default function WordDetectiveChooseCategoryScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 16);
  const bottomPadding = Math.max(insets.bottom, 24);

  const { width } = useWindowDimensions();

  // Read params: category (preserved on return) and parent page origin
  const params = useLocalSearchParams<{ category?: string; from?: string }>();
  const parentPage = params.from || '/heal-zone';
  const [selectedCategoryId, setSelectedCategoryId] = useState<WordCategoryKey>(
    (params.category as WordCategoryKey) || 'animals'
  );

  useEffect(() => {
    if (params.category) {
      setSelectedCategoryId(params.category as WordCategoryKey);
    }
  }, [params.category]);

  // Responsive layout
  const isDesktop = width >= 768;
  const contentMaxWidth = Math.min(width - 32, 680);
  const cardWidth = isDesktop ? '25%' : '50%';

  // Back button returning to Games Page
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({
        pathname: '/games',
        params: { from: parentPage },
      });
    }
  }, [parentPage]);

  // Handle hardware back press on Android
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => backHandler.remove();
  }, [handleBack]);

  const handleContinue = () => {
    router.push({
      pathname: '/games/word-detective/difficulty',
      params: {
        category: selectedCategoryId,
        from: parentPage,
      },
    });
  };

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={[styles.headerIconBtn, Shadows.sm]}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back to Games"
          >
            <ChevronLeft size={24} color={Colors.darkText} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>Word Detective 🔍</Text>
        <Text style={styles.subtitle}>
          Pick a category to explore hints and investigate mystery words.
        </Text>
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          {/* ALL 8 GAME CATEGORIES (2-COLUMN GRID) */}
          <View style={styles.categoryGrid}>
            {WORD_CATEGORIES.map((category) => {
              const isSelected = selectedCategoryId === category.id;
              return (
                <View key={category.id} style={[styles.cardWrapper, { width: cardWidth }]}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSelectedCategoryId(category.id)}
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

                    {/* Category Icon */}
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
                      <Text style={styles.categoryDesc} numberOfLines={2}>
                        {category.shortDesc}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* BOTTOM CONTINUE BUTTON */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.continueButton, Shadows.md]}
              onPress={handleContinue}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Continue to choose difficulty"
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <ArrowRight size={18} color={Colors.white} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heading: {
    ...Typography.h1,
    fontSize: 24,
    color: Colors.darkText,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodySmall,
    fontSize: 14,
    color: Colors.mutedText,
    lineHeight: 19,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginHorizontal: -6,
  },
  cardWrapper: {
    padding: 6,
  },
  card: {
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 124,
    position: 'relative',
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
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  emojiText: {
    fontSize: 22,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  categoryName: {
    ...Typography.h3,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkText,
    textAlign: 'center',
    marginBottom: 2,
  },
  categoryNameSelected: {
    color: Colors.primaryDark,
  },
  categoryDesc: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 14,
  },
  bottomSection: {
    width: '100%',
    marginTop: Spacing.lg,
    paddingHorizontal: 6,
  },
  continueButton: {
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  continueButtonText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
