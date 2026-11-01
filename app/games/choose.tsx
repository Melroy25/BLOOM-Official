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
import { ChevronLeft, ArrowRight } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { GAME_CATEGORIES } from '../../components/games/types';
import { CategoryCard } from '../../components/games/CategoryCard';

export default function ChooseGameScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 16);
  const bottomPadding = Math.max(insets.bottom, 24);

  const { width } = useWindowDimensions();

  // Read params: category (preserved on return) and parent page origin
  const params = useLocalSearchParams<{ category?: string; from?: string }>();
  const parentPage = params.from || '/heal-zone';
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    params.category || 'animals'
  );

  useEffect(() => {
    if (params.category) {
      setSelectedCategoryId(params.category);
    }
  }, [params.category]);

  // Responsive widths
  const isDesktop = width >= 768;
  const contentMaxWidth = Math.min(width - 32, 680);
  const categoryCardWidth = isDesktop ? '25%' : '50%';

  // Back button returning to Games Page: pops stack or replaces with clean Games route
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
      pathname: '/games/difficulty',
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

        <Text style={styles.heading}>Choose Your Game 🎮</Text>
        <Text style={styles.subtitle}>
          Pick a world to explore and give your mind a little refresh.
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
            {GAME_CATEGORIES.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isSelected={selectedCategoryId === category.id}
                onSelect={() => setSelectedCategoryId(category.id)}
                width={categoryCardWidth}
              />
            ))}
          </View>

          {/* CONTINUE BUTTON */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.continueButton, Shadows.md]}
              onPress={handleContinue}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Continue to Choose Difficulty"
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heading: {
    ...Typography.h1,
    fontSize: 26,
    color: Colors.darkText,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.mutedText,
    lineHeight: 19,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  contentContainer: {
    width: '100%',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  actionSection: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryDark,
    paddingVertical: 14,
    paddingHorizontal: 44,
    borderRadius: BorderRadius.round,
    gap: 8,
    width: '100%',
    maxWidth: 300,
  },
  continueButtonText: {
    ...Typography.button,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
