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
import { ChevronLeft, Play, Sparkles } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import {
  GAME_CATEGORIES,
  DIFFICULTY_CONFIGS,
  DifficultyLevel,
} from '../../components/games/types';
import { DifficultyCard } from '../../components/games/DifficultyCard';
import { GameInstructionsCard } from '../../components/games/GameInstructionsCard';

export default function ChooseDifficultyScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 16);
  const bottomPadding = Math.max(insets.bottom, 24);

  const { width } = useWindowDimensions();

  // Read selected category and parent page from route params
  const params = useLocalSearchParams<{ category?: string; from?: string }>();
  const categoryId = params.category || 'animals';
  const parentPage = params.from || '/heal-zone';
  const currentCategory =
    GAME_CATEGORIES.find((c) => c.id === categoryId) || GAME_CATEGORIES[0];

  // Difficulty selection state (defaults to medium)
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');

  // Responsive widths
  const isDesktop = width >= 768;
  const contentMaxWidth = Math.min(width - 32, 540);

  // Back button returning to Choose Category: pops stack (preserving selection state) or replaces cleanly
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({
        pathname: '/games/choose',
        params: {
          category: categoryId,
          from: parentPage,
        },
      });
    }
  }, [categoryId, parentPage]);

  // Handle hardware back press on Android
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => backHandler.remove();
  }, [handleBack]);

  const handleStartGame = () => {
    router.push({
      pathname: '/games/memory-match',
      params: {
        category: categoryId,
        difficulty: selectedDifficulty,
        from: parentPage,
      },
    });
  };

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerTopRow}>
          {/* Back button returning to Category selection */}
          <TouchableOpacity
            style={[styles.headerIconBtn, Shadows.sm]}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back to Category selection"
          >
            <ChevronLeft size={24} color={Colors.darkText} strokeWidth={2.4} />
          </TouchableOpacity>

          {/* Selected Category Pill Badge */}
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: currentCategory.bgColor, borderColor: currentCategory.borderColor },
            ]}
          >
            <Text style={styles.categoryBadgeText}>
              {currentCategory.emoji} {currentCategory.name}
            </Text>
          </View>
        </View>

        <Text style={styles.heading}>Choose Your Difficulty</Text>
        <Text style={styles.subtitle}>
          Select the challenge that feels right for you.
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
          {/* THREE SEPARATE ATTRACTIVE DIFFICULTY CARDS */}
          <View style={styles.difficultyContainer}>
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => (
              <DifficultyCard
                key={level}
                config={DIFFICULTY_CONFIGS[level]}
                isSelected={selectedDifficulty === level}
                onSelect={() => setSelectedDifficulty(level)}
                layout={isDesktop ? 'vertical' : 'horizontal'}
                width={isDesktop ? '33.33%' : '100%'}
              />
            ))}
          </View>

          {/* INSTRUCTIONS CARD */}
          <View style={styles.instructionsWrapper}>
            <GameInstructionsCard />
          </View>

          {/* START GAME BUTTON */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.startButton, Shadows.md]}
              onPress={handleStartGame}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Start Memory Match Game"
            >
              <Text style={styles.startButtonText}>Start Game</Text>
              <Play size={17} color={Colors.white} fill={Colors.white} style={styles.playIcon} />
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
    justifyContent: 'space-between',
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
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  categoryBadgeText: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.darkText,
    letterSpacing: 0.4,
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
    paddingTop: Spacing.xs,
  },
  contentContainer: {
    width: '100%',
  },
  difficultyContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  instructionsWrapper: {
    marginTop: Spacing.sm,
  },
  actionSection: {
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  startButton: {
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
  startButtonText: {
    ...Typography.button,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  playIcon: {
    marginLeft: 2,
  },
});
