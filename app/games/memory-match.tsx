import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  ScrollView,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  RotateCcw,
  Clock,
  Heart,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { FloatingParticles } from '../../components/heal-zone/FloatingParticles';
import { MemoryCard } from '../../components/games/MemoryCard';
import { GameCompletionModal } from '../../components/games/GameCompletionModal';
import {
  MemoryCardData,
  GAME_CATEGORIES,
  DIFFICULTY_CONFIGS,
  DifficultyLevel,
} from '../../components/games/types';

// Helper to generate and Fisher-Yates shuffle cards based on selected category & difficulty
const createShuffledDeck = (symbolsList: string[], pairsCount: number): MemoryCardData[] => {
  const chosenSymbols = symbolsList.slice(0, pairsCount);
  const deck: MemoryCardData[] = [];
  let idCounter = 0;

  chosenSymbols.forEach((symbol, pairIndex) => {
    // Two cards for each symbol
    deck.push({
      id: idCounter++,
      pairId: pairIndex,
      symbol,
      isMatched: false,
    });
    deck.push({
      id: idCounter++,
      pairId: pairIndex,
      symbol,
      isMatched: false,
    });
  });

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }

  return deck;
};

// Format elapsed seconds to MM:SS
const formatTimer = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function MemoryMatchScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 24);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Read URL search params from Choose Game screen
  const params = useLocalSearchParams<{
    category?: string;
    difficulty?: DifficultyLevel;
    from?: string;
  }>();
  const parentPage = params.from || '/heal-zone';

  // Resolve Category (fallback to animals)
  const categoryConfig =
    GAME_CATEGORIES.find((c) => c.id === params.category) || GAME_CATEGORIES[0];

  // Resolve Difficulty (fallback to medium)
  const difficultyLevel: DifficultyLevel =
    params.difficulty && DIFFICULTY_CONFIGS[params.difficulty]
      ? params.difficulty
      : 'medium';
  const difficultyConfig = DIFFICULTY_CONFIGS[difficultyLevel];
  const totalPairs = difficultyConfig.pairs;

  // Responsive Grid Calculations:
  // Easy: 8 cards (4 cols x 2 rows)
  // Medium: 16 cards (4 cols x 4 rows)
  // Hard: 24 cards (4 cols x 6 rows on mobile, 6 cols x 4 rows on desktop/tablet)
  const isWide = windowWidth >= 640;
  const numCols = isWide && difficultyConfig.totalCards === 24 ? 6 : 4;
  const numRows = Math.ceil(difficultyConfig.totalCards / numCols);
  const maxContentWidth = Math.min(windowWidth - 32, isWide ? 620 : 420);
  const colGap = 8;
  const cardWidth = Math.floor((maxContentWidth - (numCols - 1) * colGap) / numCols);
  const cardHeight = Math.min(
    Math.round(cardWidth * 1.25),
    Math.round((windowHeight * 0.52) / numRows)
  );

  // Game state
  const [cards, setCards] = useState<MemoryCardData[]>(() =>
    createShuffledDeck(categoryConfig.symbols, totalPairs)
  );
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairCount, setMatchedPairCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Re-initialize cards if route params change
  useEffect(() => {
    setCards(createShuffledDeck(categoryConfig.symbols, totalPairs));
    setSelectedIndices([]);
    setMoves(0);
    setMatchedPairCount(0);
    setIsLocked(false);
    setTimerSeconds(0);
    setIsTimerActive(false);
    setIsGameOver(false);
  }, [categoryConfig.id, totalPairs]);

  // Refs for timer and mismatch timeout to avoid duplicate intervals / memory leaks
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer Effect
  useEffect(() => {
    if (isTimerActive && !isGameOver) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isTimerActive, isGameOver]);

  // Clean up mismatch timeout on unmount
  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) {
        clearTimeout(flipTimeoutRef.current);
        flipTimeoutRef.current = null;
      }
    };
  }, []);

  // Card Press Handler implementing all game rules
  const handleCardPress = useCallback(
    (index: number) => {
      // Ignore if locked, already matched, already flipped, or already 2 selected
      if (isLocked) return;
      if (cards[index].isMatched) return;
      if (selectedIndices.includes(index)) return;
      if (selectedIndices.length >= 2) return;

      // Start timer on the first card selection
      if (!isTimerActive && !isGameOver) {
        setIsTimerActive(true);
      }

      // First card of the pair
      if (selectedIndices.length === 0) {
        setSelectedIndices([index]);
        return;
      }

      // Second card of the pair
      if (selectedIndices.length === 1) {
        const firstIndex = selectedIndices[0];
        const secondIndex = index;

        // Increment move counter once per valid pair attempt
        setMoves((prev) => prev + 1);
        setSelectedIndices([firstIndex, secondIndex]);

        // Check if matching pair
        if (cards[firstIndex].symbol === cards[secondIndex].symbol) {
          // Symbols match -> keep both visible and mark matched
          setCards((prevCards) =>
            prevCards.map((c, i) =>
              i === firstIndex || i === secondIndex ? { ...c, isMatched: true } : c
            )
          );
          setSelectedIndices([]);

          setMatchedPairCount((prevMatches) => {
            const nextMatches = prevMatches + 1;

            // Ensure final pair triggers completion state
            if (nextMatches === totalPairs) {
              // Stop timer when all pairs have been matched
              setIsTimerActive(false);
              // Slight delay so user sees the final match before completion modal shows
              setTimeout(() => {
                setIsGameOver(true);
              }, 450);
            }
            return nextMatches;
          });
        } else {
          // If symbols do not match, wait ~800ms before hiding them again
          setIsLocked(true);
          flipTimeoutRef.current = setTimeout(() => {
            setSelectedIndices([]);
            setIsLocked(false);
            flipTimeoutRef.current = null;
          }, 800);
        }
      }
    },
    [cards, selectedIndices, isLocked, isTimerActive, isGameOver, totalPairs]
  );

  // Restart button reshuffles cards and resets all states
  const handleRestart = useCallback(() => {
    if (flipTimeoutRef.current) {
      clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setIsLocked(false);
    setIsTimerActive(false);
    setTimerSeconds(0);
    setMoves(0);
    setMatchedPairCount(0);
    setSelectedIndices([]);
    setIsGameOver(false);
    setCards(createShuffledDeck(categoryConfig.symbols, totalPairs));
  }, [categoryConfig.symbols, totalPairs]);

  // Header Back Button returning to Choose Difficulty:
  // Pops stack to reveal existing Difficulty screen, or replaces cleanly
  const handleBackToDifficulty = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({
        pathname: '/games/difficulty',
        params: {
          category: categoryConfig.id,
          from: parentPage,
        },
      });
    }
  }, [categoryConfig.id, parentPage]);

  // Handle hardware back press on Android
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackToDifficulty();
      return true;
    });
    return () => backHandler.remove();
  }, [handleBackToDifficulty]);

  // Modal Action: Choose Another Game
  // Unwinds back to Choose Your Game without duplicate history entries
  const handleBackToChooseGame = useCallback(() => {
    if (router.canDismiss()) {
      router.dismissTo({
        pathname: '/games/choose',
        params: {
          category: categoryConfig.id,
          from: parentPage,
        },
      });
    } else {
      router.replace({
        pathname: '/games/choose',
        params: {
          category: categoryConfig.id,
          from: parentPage,
        },
      });
    }
  }, [categoryConfig.id, parentPage]);

  // Modal Action: Back to Games Overview
  // Unwinds back to Games hub without duplicate history entries
  const handleBackToGames = useCallback(() => {
    if (router.canDismiss()) {
      router.dismissTo({
        pathname: '/games',
        params: {
          from: parentPage,
        },
      });
    } else {
      router.replace({
        pathname: '/games',
        params: {
          from: parentPage,
        },
      });
    }
  }, [parentPage]);

  return (
    <View style={styles.screen}>
      <FloatingParticles />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerTopRow}>
          {/* Back button returning to Choose Difficulty */}
          <TouchableOpacity
            style={[styles.headerIconBtn, Shadows.sm]}
            onPress={handleBackToDifficulty}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back to Choose Difficulty"
          >
            <ChevronLeft size={24} color={Colors.darkText} strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{categoryConfig.name}</Text>
            {/* World & Difficulty badge */}
            <View style={styles.metaBadgesRow}>
              <View
                style={[
                  styles.categoryPill,
                  { backgroundColor: categoryConfig.bgColor, borderColor: categoryConfig.borderColor },
                ]}
              >
                <Text style={styles.categoryPillText}>
                  {categoryConfig.emoji} {categoryConfig.name}
                </Text>
              </View>
              <View
                style={[
                  styles.difficultyPill,
                  { borderColor: difficultyConfig.accentColor },
                ]}
              >
                <Text
                  style={[
                    styles.difficultyPillText,
                    { color: difficultyConfig.accentColor },
                  ]}
                >
                  {difficultyConfig.emoji} {difficultyConfig.title}
                </Text>
              </View>
            </View>
          </View>

          {/* Restart Button in Header */}
          <TouchableOpacity
            style={[styles.headerIconBtn, Shadows.sm]}
            onPress={handleRestart}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Restart game"
          >
            <RotateCcw size={19} color={Colors.primaryDark} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {/* STATS BAR: Moves, Matches, Timer */}
        <View style={[styles.statsBar, Shadows.sm]}>
          {/* Moves counter */}
          <View style={styles.statItem}>
            <View style={styles.statIconBadge}>
              <CheckCircle2 size={13} color={Colors.primaryDark} strokeWidth={2.4} />
            </View>
            <View>
              <Text style={styles.statLabel}>MOVES</Text>
              <Text style={styles.statValue}>{moves}</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          {/* Matched pairs counter */}
          <View style={styles.statItem}>
            <View style={[styles.statIconBadge, { backgroundColor: '#FBECEE' }]}>
              <Heart size={13} color="#C46D82" strokeWidth={2.4} />
            </View>
            <View>
              <Text style={styles.statLabel}>MATCHED</Text>
              <Text style={styles.statValue}>
                {matchedPairCount} / {totalPairs}
              </Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          {/* Elapsed timer */}
          <View style={styles.statItem}>
            <View style={[styles.statIconBadge, { backgroundColor: '#ECE9F4' }]}>
              <Clock size={13} color="#5A4E80" strokeWidth={2.4} />
            </View>
            <View>
              <Text style={styles.statLabel}>TIME</Text>
              <Text style={styles.statValue}>{formatTimer(timerSeconds)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* GAME BOARD GRID */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.gridContainer, { width: maxContentWidth }]}>
          {cards.map((card, index) => {
            const isFlipped = selectedIndices.includes(index);
            return (
              <MemoryCard
                key={card.id}
                symbol={card.symbol}
                isFlipped={isFlipped}
                isMatched={card.isMatched}
                isLocked={isLocked}
                onPress={() => handleCardPress(index)}
                width={cardWidth}
                height={cardHeight}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* GAME COMPLETION MODAL */}
      <GameCompletionModal
        visible={isGameOver}
        moves={moves}
        timeFormatted={formatTimer(timerSeconds)}
        totalPairs={totalPairs}
        celebrationEmoji={categoryConfig.emoji}
        categoryName={categoryConfig.name}
        onPlayAgain={handleRestart}
        onChooseAnotherGame={handleBackToChooseGame}
        onBackToGames={handleBackToGames}
      />
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
    paddingBottom: Spacing.sm,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.darkText,
    textAlign: 'center',
  },
  metaBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  categoryPillText: {
    ...Typography.label,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.darkText,
  },
  difficultyPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    backgroundColor: Colors.white,
  },
  difficultyPillText: {
    ...Typography.label,
    fontSize: 10,
    fontWeight: '700',
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
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  statIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.lightSage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.mutedText,
    letterSpacing: 0.6,
  },
  statValue: {
    ...Typography.stat,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkText,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.border,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
