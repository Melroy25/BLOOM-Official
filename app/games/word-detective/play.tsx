import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  useWindowDimensions,
  Animated,
  BackHandler,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  Send,
  HelpCircle,
  Trophy,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';
import { FloatingParticles } from '../../../components/heal-zone/FloatingParticles';
import {
  WORD_CATEGORIES,
  WORD_DIFFICULTY_CONFIGS,
  WORD_BANK,
  WordItem,
  WordDifficultyLevel,
  WordCategoryKey,
} from '../../../components/games/wordDetectiveData';
import { WordDetectiveCompletionModal } from '../../../components/games/WordDetectiveCompletionModal';

// Fisher-Yates shuffle helper
const shuffleArray = <T,>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Normalize word for fair comparison
const normalizeGuess = (str: string): string => {
  return str
    .trim()
    .toUpperCase()
    .replace(/^THE\s+|^A\s+|^AN\s+/, '')
    .replace(/[^A-Z]/g, '');
};

const WORDS_PER_ROUND = 10;

export default function WordDetectivePlayScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 20 : 12);
  const naturalBottomMargin = Math.max(insets.bottom, 12);

  const { width } = useWindowDimensions();
  const contentMaxWidth = Math.min(width - 24, 500);

  // Read route parameters
  const params = useLocalSearchParams<{
    category?: string;
    difficulty?: WordDifficultyLevel;
    from?: string;
  }>();

  const categoryId = (params.category as WordCategoryKey) || 'animals';
  const difficultyLevel: WordDifficultyLevel =
    params.difficulty && WORD_DIFFICULTY_CONFIGS[params.difficulty]
      ? params.difficulty
      : 'easy';
  const parentPage = params.from || '/heal-zone';

  const categoryConfig =
    WORD_CATEGORIES.find((c) => c.id === categoryId) || WORD_CATEGORIES[0];
  const difficultyConfig = WORD_DIFFICULTY_CONFIGS[difficultyLevel];
  const maxHints = difficultyConfig.maxHints;

  // Generate 10-word session deck
  const sessionWords = useMemo(() => {
    const categoryWords = WORD_BANK.filter((w) => w.category === categoryId);
    const matchedDifficultyWords = categoryWords.filter(
      (w) => w.difficulty === difficultyLevel
    );
    const otherDifficultyWords = categoryWords.filter(
      (w) => w.difficulty !== difficultyLevel
    );

    const pool = [
      ...shuffleArray(matchedDifficultyWords),
      ...shuffleArray(otherDifficultyWords),
    ];

    if (pool.length < WORDS_PER_ROUND) {
      const extraWords = WORD_BANK.filter((w) => w.category !== categoryId);
      pool.push(...shuffleArray(extraWords));
    }

    return pool.slice(0, WORDS_PER_ROUND);
  }, [categoryId, difficultyLevel]);

  // Round Game States
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [hintsRevealed, setHintsRevealed] = useState(1);
  const [guessInput, setGuessInput] = useState('');
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);
  const [attemptsOnCurrentWord, setAttemptsOnCurrentWord] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [isWordRevealed, setIsWordRevealed] = useState(false);
  const [isRoundCompleted, setIsRoundCompleted] = useState(false);

  // Animations
  const feedbackFade = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<any>(null);

  const currentWord: WordItem = sessionWords[currentWordIndex] || sessionWords[0];

  // Reset per-word states when index changes
  const resetForNextWord = useCallback((nextIndex: number) => {
    setCurrentWordIndex(nextIndex);
    setHintsRevealed(1);
    setGuessInput('');
    setIsCurrentCorrect(false);
    setFeedbackMessage(null);
    setFeedbackType(null);
    setAttemptsOnCurrentWord(0);
    setIsWordRevealed(false);
    feedbackFade.setValue(0);
  }, [feedbackFade]);

  // Restart full round
  const handleRestartRound = useCallback(() => {
    setScore(0);
    setSolvedCount(0);
    setTotalAttempts(0);
    setIsRoundCompleted(false);
    resetForNextWord(0);
  }, [resetForNextWord]);

  // Trigger error shake animation
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // Submit player guess
  const handleSubmitGuess = () => {
    if (!guessInput.trim() || isCurrentCorrect || isWordRevealed) return;

    const normalizedPlayerGuess = normalizeGuess(guessInput);
    const target = normalizeGuess(currentWord.word);

    setTotalAttempts((prev) => prev + 1);
    setAttemptsOnCurrentWord((prev) => prev + 1);

    const isMatch =
      normalizedPlayerGuess === target ||
      normalizedPlayerGuess === target + 'S' ||
      normalizedPlayerGuess + 'S' === target;

    if (isMatch) {
      const hintPenalty = (hintsRevealed - 1) * 15;
      const attemptBonus = attemptsOnCurrentWord === 0 ? 20 : 0;
      const wordScore = Math.max(40, 100 - hintPenalty + attemptBonus);

      setScore((prev) => prev + wordScore);
      setSolvedCount((prev) => prev + 1);
      setIsCurrentCorrect(true);
      setFeedbackType('success');
      setFeedbackMessage('🎉 Amazing! You guessed it correctly!');

      Animated.timing(feedbackFade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      setFeedbackType('error');
      setFeedbackMessage('Not quite! Try again.');
      triggerShake();

      Animated.timing(feedbackFade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  };

  // Reveal another hint gradually
  const handleGetAnotherHint = () => {
    if (hintsRevealed < maxHints) {
      setHintsRevealed((prev) => prev + 1);
    }
  };

  // Give up / reveal word
  const handleRevealWord = () => {
    setIsWordRevealed(true);
    setFeedbackType('error');
    setFeedbackMessage(`The mystery word was: "${currentWord.displayWord}"`);
    Animated.timing(feedbackFade, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Advance to next word
  const handleNextWord = () => {
    if (currentWordIndex + 1 < WORDS_PER_ROUND) {
      resetForNextWord(currentWordIndex + 1);
    } else {
      setIsRoundCompleted(true);
    }
  };

  // Header Back Button returning to Choose Difficulty
  const handleBackToDifficulty = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({
        pathname: '/games/word-detective/difficulty',
        params: {
          category: categoryId,
          difficulty: difficultyLevel,
          from: parentPage,
        },
      });
    }
  }, [categoryId, difficultyLevel, parentPage]);

  // Handle hardware back press on Android
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackToDifficulty();
      return true;
    });
    return () => backHandler.remove();
  }, [handleBackToDifficulty]);

  // Modal Action: Choose Another Category
  const handleBackToChooseCategory = useCallback(() => {
    if (router.canDismiss()) {
      router.dismissTo({
        pathname: '/games/word-detective/choose',
        params: {
          category: categoryId,
          from: parentPage,
        },
      });
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

  // Modal Action: Back to Games Overview
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

  // Progress percentage (10% to 100%)
  const progressPercent = Math.round(((currentWordIndex + 1) / WORDS_PER_ROUND) * 100);

  // Dynamic calculation for letter boxes to GUARANTEE all letters fit on ONE row
  const wordLength = currentWord.word.length;
  const availableRowWidth = contentMaxWidth - 28; // minus card padding
  const letterGap = wordLength > 9 ? 3 : wordLength > 6 ? 4 : 6;
  const calculatedBoxWidth = Math.max(
    22,
    Math.min(38, Math.floor((availableRowWidth - (wordLength - 1) * letterGap) / wordLength))
  );
  const calculatedBoxHeight = Math.round(calculatedBoxWidth * 1.22);
  const calculatedFontSize = Math.max(12, Math.min(18, Math.round(calculatedBoxWidth * 0.52)));

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FloatingParticles />

      {/* TOP HEADER - COMPACT & ALIGNED */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerTopRow}>
          {/* Back button */}
          <TouchableOpacity
            style={[styles.headerIconBtn, Shadows.sm]}
            onPress={handleBackToDifficulty}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Back to Choose Difficulty"
          >
            <ChevronLeft size={22} color={Colors.darkText} strokeWidth={2.4} />
          </TouchableOpacity>

          {/* Badges: Category & Difficulty */}
          <View style={styles.headerBadgesRow}>
            <View
              style={[
                styles.categoryPill,
                {
                  backgroundColor: categoryConfig.bgColor,
                  borderColor: categoryConfig.borderColor,
                },
              ]}
            >
              <Text style={styles.categoryPillText} numberOfLines={1}>
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

          {/* Restart Round Button */}
          <TouchableOpacity
            style={[styles.headerIconBtn, Shadows.sm]}
            onPress={handleRestartRound}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Restart 10-word round"
          >
            <RotateCcw size={17} color={Colors.primaryDark} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {/* PROGRESS & STATS SECTION - CLEAN & COMPACT */}
        <View style={[styles.statsBar, Shadows.sm]}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>WORD</Text>
            <Text style={styles.statValue}>
              {currentWordIndex + 1}
              <Text style={styles.statSubText}>/{WORDS_PER_ROUND}</Text>
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>SCORE</Text>
            <View style={styles.scoreRow}>
              <Trophy size={11} color="#E8B86D" strokeWidth={2.4} />
              <Text style={styles.statValue}>{score} pts</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ATTEMPTS</Text>
            <Text style={styles.statValue}>{attemptsOnCurrentWord}</Text>
          </View>
        </View>

        {/* Progress track bar integrated right under stats */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* MAIN GAME SCROLL CONTENT - COMPACT & BALANCED */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: naturalBottomMargin },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          {/* CARD 1: SECRET WORD CARD (COMPACT & SINGLE-ROW ALIGNED) */}
          <View style={[styles.mysteryWordCard, Shadows.sm]}>
            <View style={styles.mysteryCardHeader}>
              <View
                style={[
                  styles.mysteryBadge,
                  (isCurrentCorrect || isWordRevealed) && styles.mysteryBadgeSolved,
                ]}
              >
                {isCurrentCorrect ? (
                  <CheckCircle2 size={11} color={Colors.primaryDark} strokeWidth={2.4} />
                ) : (
                  <Sparkles size={11} color="#5A4E80" strokeWidth={2.4} />
                )}
                <Text
                  style={[
                    styles.mysteryBadgeText,
                    (isCurrentCorrect || isWordRevealed) && styles.mysteryBadgeTextSolved,
                  ]}
                >
                  {isCurrentCorrect
                    ? 'SOLVED!'
                    : isWordRevealed
                    ? 'REVEALED'
                    : 'SECRET WORD'}
                </Text>
              </View>
              <Text style={styles.letterCountText}>
                {currentWord.word.length} Letters
              </Text>
            </View>

            {/* Letter Slots - Single Aligned Row */}
            <View style={[styles.letterSlotsRow, { gap: letterGap }]}>
              {currentWord.word.split('').map((char, index) => {
                const isRevealed = isCurrentCorrect || isWordRevealed;
                return (
                  <View
                    key={index}
                    style={[
                      styles.letterBox,
                      {
                        width: calculatedBoxWidth,
                        height: calculatedBoxHeight,
                      },
                      isRevealed && styles.letterBoxRevealed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.letterText,
                        { fontSize: calculatedFontSize },
                        isRevealed && styles.letterTextRevealed,
                      ]}
                    >
                      {isRevealed ? char : '•'}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Educational Fun Fact on Win */}
            {(isCurrentCorrect || isWordRevealed) && currentWord.funFact && (
              <View style={styles.funFactBox}>
                <Text style={styles.funFactText}>
                  💡 <Text style={styles.boldText}>Did you know?</Text> {currentWord.funFact}
                </Text>
              </View>
            )}
          </View>

          {/* CARD 2: DETECTIVE CLUES CARD (CLEAN & CENTERED HINT BUTTON) */}
          <View style={[styles.hintsCard, Shadows.sm]}>
            <View style={styles.hintsCardHeader}>
              <View style={styles.hintsHeaderLeft}>
                <View style={styles.hintIconCircle}>
                  <Lightbulb size={13} color="#E8B86D" strokeWidth={2.4} />
                </View>
                <Text style={styles.hintsTitle}>Detective Clues</Text>
              </View>
              <View style={styles.hintsCounterPill}>
                <Text style={styles.hintsCounterText}>
                  Hint {hintsRevealed} of {maxHints}
                </Text>
              </View>
            </View>

            {/* Clue body */}
            <View style={styles.hintsList}>
              {currentWord.hints.slice(0, hintsRevealed).map((hintText, idx) => (
                <View key={idx} style={styles.hintBubble}>
                  <View style={styles.hintBubbleHeader}>
                    <Text style={styles.hintBubbleBadgeText}>CLUE {idx + 1}</Text>
                  </View>
                  <Text style={styles.hintBubbleText}>{hintText}</Text>
                </View>
              ))}
            </View>

            {/* Centered Get Another Hint Button */}
            {!isCurrentCorrect && !isWordRevealed && (
              <View style={styles.hintActionRow}>
                {hintsRevealed < maxHints ? (
                  <TouchableOpacity
                    style={styles.anotherHintBtn}
                    onPress={handleGetAnotherHint}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Get another hint"
                  >
                    <Lightbulb size={12} color="#5A4E80" strokeWidth={2.2} />
                    <Text style={styles.anotherHintBtnText}>
                      Get Another Hint ({maxHints - hintsRevealed} left)
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.maxHintsUsedBadge}>
                    <Text style={styles.maxHintsUsedText}>
                      ✓ All available clues unlocked
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* CARD 3: GUESS INPUT CARD (REDESIGNED PROPER ROUNDED CARD) */}
          {!isCurrentCorrect && !isWordRevealed ? (
            <Animated.View
              style={[
                styles.inputCard,
                Shadows.sm,
                { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              <View style={styles.inputCardHeader}>
                <Text style={styles.inputLabel}>WHAT IS YOUR GUESS?</Text>
                <Text style={styles.inputSubHint}>Case-insensitive</Text>
              </View>

              {/* WHATSAPP-STYLE INPUT COMPOSER ROW */}
              <View style={styles.composerRow}>
                {/* Rounded Pill Input Container */}
                <View style={[styles.pillInputContainer, Shadows.sm]}>
                  <TouchableOpacity
                    style={styles.hintIconBtn}
                    onPress={handleGetAnotherHint}
                    disabled={hintsRevealed >= maxHints}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Get hint"
                  >
                    <Lightbulb
                      size={18}
                      color={hintsRevealed < maxHints ? '#E8B86D' : Colors.lightText}
                      strokeWidth={2.2}
                    />
                  </TouchableOpacity>

                  <TextInput
                    ref={inputRef}
                    style={styles.pillTextInput}
                    placeholder="Type your guess..."
                    placeholderTextColor={Colors.lightText}
                    value={guessInput}
                    onChangeText={(text) => {
                      setGuessInput(text);
                      if (feedbackMessage) setFeedbackMessage(null);
                    }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmitGuess}
                  />
                </View>

                {/* Separate Circular Dark Green Send Button */}
                <TouchableOpacity
                  style={[
                    styles.circularSendBtn,
                    Shadows.sm,
                    !guessInput.trim() && styles.circularSendBtnDisabled,
                  ]}
                  onPress={handleSubmitGuess}
                  disabled={!guessInput.trim()}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel="Submit Guess"
                >
                  <Send size={18} color={Colors.white} strokeWidth={2.4} style={styles.sendIconOffset} />
                </TouchableOpacity>
              </View>

              {/* Feedback Alert if incorrect */}
              {feedbackMessage && feedbackType === 'error' && (
                <View style={styles.feedbackAlertError}>
                  <AlertCircle size={13} color="#C46D4B" strokeWidth={2.2} />
                  <Text style={styles.feedbackTextError}>{feedbackMessage}</Text>
                </View>
              )}

              {/* Reveal word option placed neatly below input */}
              <TouchableOpacity
                style={styles.revealWordLink}
                onPress={handleRevealWord}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Reveal Word"
              >
                <Eye size={12} color={Colors.mutedText} strokeWidth={2} />
                <Text style={styles.revealWordLinkText}>Stuck? Reveal the Word</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            /* SUCCESS OR REVEALED STATE ACTION CARD */
            <View style={[styles.successCard, Shadows.sm]}>
              <View
                style={[
                  styles.successBanner,
                  isCurrentCorrect ? styles.successBannerWin : styles.successBannerReveal,
                ]}
              >
                {isCurrentCorrect ? (
                  <CheckCircle2 size={18} color={Colors.primaryDark} strokeWidth={2.4} />
                ) : (
                  <HelpCircle size={18} color="#5A4E80" strokeWidth={2.4} />
                )}
                <Text
                  style={[
                    styles.successBannerText,
                    isCurrentCorrect ? styles.successTextWin : styles.successTextReveal,
                  ]}
                >
                  {feedbackMessage}
                </Text>
              </View>

              {/* NEXT WORD BUTTON */}
              <TouchableOpacity
                style={[styles.nextWordBtn, Shadows.sm]}
                onPress={handleNextWord}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={
                  currentWordIndex + 1 === WORDS_PER_ROUND
                    ? 'See Complete Results'
                    : 'Proceed to Next Word'
                }
              >
                <Text style={styles.nextWordBtnText}>
                  {currentWordIndex + 1 === WORDS_PER_ROUND
                    ? 'See Final Results 🏆'
                    : 'Next Mystery Word'}
                </Text>
                <ArrowRight size={16} color={Colors.white} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ROUND COMPLETION MODAL */}
      <WordDetectiveCompletionModal
        visible={isRoundCompleted}
        score={score}
        solvedCount={solvedCount}
        totalWords={WORDS_PER_ROUND}
        totalAttempts={totalAttempts}
        categoryName={categoryConfig.name}
        categoryEmoji={categoryConfig.emoji}
        onPlayAgain={handleRestartRound}
        onChooseAnotherCategory={handleBackToChooseCategory}
        onBackToGames={handleBackToGames}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: '100%',
    backgroundColor: Colors.background,
    alignSelf: 'center',
    flexGrow: 0,
    flexShrink: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 4,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    maxWidth: 140,
  },
  categoryPillText: {
    ...Typography.label,
    fontSize: 10.5,
    color: Colors.darkText,
    fontWeight: '700',
  },
  difficultyPill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.round,
    borderWidth: 1.2,
    backgroundColor: Colors.white,
  },
  difficultyPillText: {
    ...Typography.label,
    fontSize: 10,
    fontWeight: '800',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    ...Typography.label,
    fontSize: 8.5,
    color: Colors.mutedText,
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  statValue: {
    ...Typography.stat,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkText,
  },
  statSubText: {
    fontSize: 10,
    color: Colors.mutedText,
    fontWeight: '400',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statDivider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.border,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#E8ECE9',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryDark,
    borderRadius: 1.5,
  },
  scrollView: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: 6,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  // Mystery Word Card
  mysteryWordCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  mysteryCardHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  mysteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4EFFB',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.round,
  },
  mysteryBadgeSolved: {
    backgroundColor: '#E8F1E8',
  },
  mysteryBadgeText: {
    ...Typography.label,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#5A4E80',
    letterSpacing: 0.5,
  },
  mysteryBadgeTextSolved: {
    color: Colors.primaryDark,
  },
  letterCountText: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.mutedText,
    fontWeight: '600',
  },
  letterSlotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 2,
  },
  letterBox: {
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.cream,
    borderWidth: 1.2,
    borderColor: '#D8DFD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBoxRevealed: {
    backgroundColor: '#E8F1E8',
    borderColor: Colors.primaryDark,
  },
  letterText: {
    fontWeight: '700',
    color: Colors.mutedText,
  },
  letterTextRevealed: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  funFactBox: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.lightSage,
    width: '100%',
  },
  funFactText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.primaryDark,
    lineHeight: 15,
  },
  boldText: {
    fontWeight: '700',
  },
  // Hints Card
  hintsCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hintsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hintsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FDF6E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintsTitle: {
    ...Typography.h3,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.darkText,
  },
  hintsCounterPill: {
    backgroundColor: '#F4EFFB',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  hintsCounterText: {
    ...Typography.label,
    fontSize: 9.5,
    color: '#5A4E80',
    fontWeight: '700',
  },
  hintsList: {
    gap: 6,
    marginBottom: 4,
  },
  hintBubble: {
    backgroundColor: '#FAF9FC',
    borderRadius: BorderRadius.md,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EAE5F4',
  },
  hintBubbleHeader: {
    marginBottom: 2,
  },
  hintBubbleBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#5A4E80',
    letterSpacing: 0.5,
  },
  hintBubbleText: {
    ...Typography.body,
    fontSize: 12.5,
    color: Colors.darkText,
    lineHeight: 17,
  },
  hintActionRow: {
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anotherHintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.round,
    backgroundColor: '#F4EFFB',
    borderWidth: 1,
    borderColor: '#E2D8F2',
  },
  anotherHintBtnText: {
    ...Typography.button,
    fontSize: 11.5,
    color: '#5A4E80',
    fontWeight: '700',
  },
  maxHintsUsedBadge: {
    paddingVertical: 2,
  },
  maxHintsUsedText: {
    ...Typography.caption,
    fontSize: 10.5,
    color: Colors.mutedText,
    fontStyle: 'italic',
  },
  // Guess Input Card
  inputCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.mutedText,
    letterSpacing: 0.5,
  },
  inputSubHint: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.lightText,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  pillInputContainer: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2DBD0',
    paddingLeft: 12,
    paddingRight: 14,
  },
  hintIconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  pillTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 14.5,
    fontWeight: '600',
    color: Colors.darkText,
    paddingVertical: 0,
    outlineStyle: 'none' as any,
  },
  circularSendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularSendBtnDisabled: {
    opacity: 0.45,
  },
  sendIconOffset: {
    marginLeft: 2,
    marginTop: -1,
  },
  feedbackAlertError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FDF3EE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F7DFD2',
  },
  feedbackTextError: {
    ...Typography.caption,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#C46D4B',
  },
  revealWordLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
    paddingVertical: 4,
  },
  revealWordLinkText: {
    ...Typography.caption,
    fontSize: 11.5,
    color: Colors.mutedText,
    fontWeight: '500',
  },
  // Success Card
  successCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.lg,
    marginBottom: 10,
  },
  successBannerWin: {
    backgroundColor: Colors.lightSage,
    borderWidth: 1,
    borderColor: '#D4E6D9',
  },
  successBannerReveal: {
    backgroundColor: '#F4EFFB',
    borderWidth: 1,
    borderColor: '#E2D8F2',
  },
  successBannerText: {
    ...Typography.h3,
    fontSize: 13.5,
    fontWeight: '700',
  },
  successTextWin: {
    color: Colors.primaryDark,
  },
  successTextReveal: {
    color: '#5A4E80',
  },
  nextWordBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    width: '100%',
  },
  nextWordBtnText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: 14.5,
    fontWeight: '700',
  },
});
