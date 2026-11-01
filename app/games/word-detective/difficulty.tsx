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
import { ChevronLeft, Play, Sparkles, HelpCircle } from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';
import {
  WORD_CATEGORIES,
  WORD_DIFFICULTY_CONFIGS,
  WordDifficultyLevel,
  WordCategoryKey,
} from '../../../components/games/wordDetectiveData';
import { WordDifficultyCard } from '../../../components/games/WordDifficultyCard';

export default function WordDetectiveChooseDifficultyScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 16);
  const bottomPadding = Math.max(insets.bottom, 24);

  const { width } = useWindowDimensions();

  // Read selected category and parent page from route params
  const params = useLocalSearchParams<{ category?: string; from?: string }>();
  const categoryId = (params.category as WordCategoryKey) || 'animals';
  const parentPage = params.from || '/heal-zone';
  const currentCategory =
    WORD_CATEGORIES.find((c) => c.id === categoryId) || WORD_CATEGORIES[0];

  // Difficulty selection state (defaults to easy for a welcoming start)
  const [selectedDifficulty, setSelectedDifficulty] = useState<WordDifficultyLevel>('easy');

  // Responsive widths
  const contentMaxWidth = Math.min(width - 32, 540);

  // Back button returning to Choose Category: pops stack (preserving selection state) or replaces cleanly
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({
        pathname: '/games/word-detective/choose',
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
      pathname: '/games/word-detective/play',
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
          Select the challenge level and available mystery clues.
        </Text>
      </View>

      {/* MAIN CONTENT AREA */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          {/* THREE DIFFICULTY CARDS */}
          <View style={styles.difficultyList}>
            {(['easy', 'medium', 'hard'] as WordDifficultyLevel[]).map((level) => {
              const config = WORD_DIFFICULTY_CONFIGS[level];
              return (
                <WordDifficultyCard
                  key={config.id}
                  config={config}
                  isSelected={selectedDifficulty === config.id}
                  onSelect={() => setSelectedDifficulty(config.id)}
                />
              );
            })}
          </View>

          {/* HOW TO PLAY INSTRUCTIONS CARD */}
          <View style={[styles.instructionsCard, Shadows.sm]}>
            <View style={styles.instructionsHeader}>
              <View style={styles.instructionsIconBadge}>
                <HelpCircle size={15} color={Colors.primaryDark} strokeWidth={2.4} />
              </View>
              <Text style={styles.instructionsTitle}>How Word Detective Works</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>1.</Text>
              <Text style={styles.instructionText}>
                Read the initial hint for the hidden mystery word.
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>2.</Text>
              <Text style={styles.instructionText}>
                Need extra help? Click <Text style={styles.boldText}>Get Another Hint</Text> up to your difficulty limit.
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>3.</Text>
              <Text style={styles.instructionText}>
                Type your guess and submit. Complete 10 words to master the case!
              </Text>
            </View>
          </View>

          {/* BOTTOM START GAME BUTTON */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.startButton, Shadows.md]}
              onPress={handleStartGame}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Start Word Detective Game"
            >
              <Play size={18} color={Colors.white} fill={Colors.white} style={styles.playIcon} />
              <Text style={styles.startButtonText}>Start Word Detective</Text>
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
    marginBottom: Spacing.md,
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
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  categoryBadgeText: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.darkText,
    fontWeight: '700',
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  difficultyList: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  instructionsCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm + 2,
  },
  instructionsIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.lightSage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsTitle: {
    ...Typography.label,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  instructionBullet: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    lineHeight: 18,
    width: 14,
  },
  instructionText: {
    ...Typography.bodySmall,
    fontSize: 12.5,
    color: Colors.darkText,
    lineHeight: 18,
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  bottomSection: {
    width: '100%',
  },
  startButton: {
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
  playIcon: {
    marginRight: 2,
  },
  startButtonText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
