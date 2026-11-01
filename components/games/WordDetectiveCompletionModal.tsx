import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import {
  Sparkles,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  Trophy,
  Compass,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

interface WordDetectiveCompletionModalProps {
  visible: boolean;
  score: number;
  solvedCount: number;
  totalWords: number;
  totalAttempts: number;
  categoryName?: string;
  categoryEmoji?: string;
  onPlayAgain: () => void;
  onChooseAnotherCategory: () => void;
  onBackToGames: () => void;
}

export const WordDetectiveCompletionModal: React.FC<WordDetectiveCompletionModalProps> = ({
  visible,
  score,
  solvedCount,
  totalWords = 10,
  totalAttempts,
  categoryName = 'Mystery',
  categoryEmoji = '🔍',
  onPlayAgain,
  onChooseAnotherCategory,
  onBackToGames,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible, opacityAnim, scaleAnim]);

  if (!visible) return null;

  const accuracyPercent =
    totalAttempts > 0
      ? Math.min(100, Math.round((solvedCount / totalAttempts) * 100))
      : 100;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onBackToGames}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            Shadows.lg,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Top Decorative Icon */}
          <View style={styles.celebrationBadgeContainer}>
            <View style={styles.celebrationOuterGlow}>
              <View style={styles.celebrationInnerCircle}>
                <Text style={styles.celebrationEmoji}>🕵️‍♂️</Text>
              </View>
            </View>
            <View style={styles.sparkleDeco}>
              <Sparkles size={20} color="#E8B86D" strokeWidth={2.4} />
            </View>
          </View>

          {/* Heading and Category Tag */}
          <View style={styles.headerBlock}>
            <View style={styles.categoryBadgePill}>
              <Text style={styles.categoryBadgeText}>
                {categoryEmoji} {categoryName.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.title}>Word Detective Master!</Text>
            <Text style={styles.subtitle}>
              You completed all {totalWords} mystery words with curious focus.
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsCard}>
            <View style={styles.statColumn}>
              <View style={styles.statIconBadge}>
                <Trophy size={16} color="#E8B86D" strokeWidth={2.4} />
              </View>
              <Text style={styles.statNumber}>{score}</Text>
              <Text style={styles.statLabel}>POINTS</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statColumn}>
              <View style={styles.statIconBadge}>
                <CheckCircle2 size={16} color={Colors.primaryDark} strokeWidth={2.4} />
              </View>
              <Text style={styles.statNumber}>
                {solvedCount}/{totalWords}
              </Text>
              <Text style={styles.statLabel}>SOLVED</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statColumn}>
              <View style={styles.statIconBadge}>
                <Sparkles size={16} color="#5A4E80" strokeWidth={2.4} />
              </View>
              <Text style={styles.statNumber}>{accuracyPercent}%</Text>
              <Text style={styles.statLabel}>ACCURACY</Text>
            </View>
          </View>

          {/* Mindful Praise */}
          <View style={styles.mindfulNoteContainer}>
            <Text style={styles.mindfulNoteText}>
              "A sharp mind in a calm state can solve any mystery with patience."
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Primary Action: Play Again */}
            <TouchableOpacity
              style={[styles.primaryBtn, Shadows.md]}
              onPress={onPlayAgain}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Play round again"
            >
              <RotateCcw size={18} color={Colors.white} strokeWidth={2.4} />
              <Text style={styles.primaryBtnText}>Play Again</Text>
            </TouchableOpacity>

            {/* Secondary Action: Choose Another Category */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onChooseAnotherCategory}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Choose another category"
            >
              <Compass size={17} color={Colors.primaryDark} strokeWidth={2.2} />
              <Text style={styles.secondaryBtnText}>Choose Another Category</Text>
            </TouchableOpacity>

            {/* Tertiary Action: Back to Games Overview */}
            <TouchableOpacity
              style={styles.tertiaryBtn}
              onPress={onBackToGames}
              activeOpacity={0.65}
              accessibilityRole="button"
              accessibilityLabel="Back to Games overview"
            >
              <ArrowLeft size={15} color={Colors.mutedText} strokeWidth={2.2} />
              <Text style={styles.tertiaryBtnText}>Back to Games Overview</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 42, 34, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl + 8,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  celebrationBadgeContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  celebrationOuterGlow: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#F4EFFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationInnerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2D8F2',
  },
  celebrationEmoji: {
    fontSize: 34,
  },
  sparkleDeco: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  categoryBadgePill: {
    backgroundColor: '#F0F6F2',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#D8E8DD',
  },
  categoryBadgeText: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.primaryDark,
    letterSpacing: 0.6,
  },
  title: {
    ...Typography.h2,
    fontSize: 22,
    color: Colors.darkText,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.mutedText,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
    lineHeight: 18,
  },
  statsCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statNumber: {
    ...Typography.h3,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.darkText,
  },
  statLabel: {
    ...Typography.label,
    fontSize: 9.5,
    color: Colors.mutedText,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: Colors.border,
  },
  mindfulNoteContainer: {
    backgroundColor: Colors.lightSage,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  mindfulNoteText: {
    ...Typography.caption,
    color: Colors.primaryDark,
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 11.5,
    lineHeight: 16,
  },
  buttonsContainer: {
    width: '100%',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.xl,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#F4EFFB',
    borderRadius: BorderRadius.xl,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: '#E2D8F2',
  },
  secondaryBtnText: {
    ...Typography.button,
    color: '#5A4E80',
    fontSize: 14,
    fontWeight: '600',
  },
  tertiaryBtn: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tertiaryBtnText: {
    ...Typography.caption,
    color: Colors.mutedText,
    fontSize: 12.5,
    fontWeight: '500',
  },
});
