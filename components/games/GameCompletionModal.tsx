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
import { Sparkles, RotateCcw, ArrowLeft, Heart, Clock, CheckCircle2, Compass } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

interface GameCompletionModalProps {
  visible: boolean;
  moves: number;
  timeFormatted: string;
  totalPairs: number;
  celebrationEmoji?: string;
  categoryName?: string;
  onPlayAgain: () => void;
  onChooseAnotherGame: () => void;
  onBackToGames: () => void;
}

export const GameCompletionModal: React.FC<GameCompletionModalProps> = ({
  visible,
  moves,
  timeFormatted,
  totalPairs = 6,
  celebrationEmoji = '🌸',
  categoryName,
  onPlayAgain,
  onChooseAnotherGame,
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

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            Shadows.lg,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Top Decorative Celebration Ring */}
          <View style={styles.celebrationCircleOuter}>
            <View style={styles.celebrationCircleInner}>
              <Text style={styles.celebrationEmoji}>{celebrationEmoji}</Text>
            </View>
            <View style={styles.sparkleBadge}>
              <Sparkles size={14} color="#E8B86D" fill="#E8B86D" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Beautiful!</Text>
          <Text style={styles.subtitle}>You found every pair.</Text>

          {/* Calming Wellness Note */}
          <Text style={styles.note}>
            {categoryName ? `You explored ${categoryName} with calm focus.` : 'A moment of stillness and focus for your mind.'} Well done.
          </Text>

          {/* Stats Summary Cards */}
          <View style={styles.statsRow}>
            {/* Moves */}
            <View style={styles.statBox}>
              <View style={styles.statIconWrapper}>
                <CheckCircle2 size={16} color={Colors.primaryDark} strokeWidth={2.2} />
              </View>
              <Text style={styles.statValue}>{moves}</Text>
              <Text style={styles.statLabel}>MOVES</Text>
            </View>

            {/* Time Taken */}
            <View style={styles.statBox}>
              <View style={styles.statIconWrapper}>
                <Clock size={16} color="#5A4E80" strokeWidth={2.2} />
              </View>
              <Text style={styles.statValue}>{timeFormatted}</Text>
              <Text style={styles.statLabel}>TIME</Text>
            </View>

            {/* Pairs Matched */}
            <View style={styles.statBox}>
              <View style={styles.statIconWrapper}>
                <Heart size={16} color="#B55B75" strokeWidth={2.2} />
              </View>
              <Text style={styles.statValue}>{totalPairs} / {totalPairs}</Text>
              <Text style={styles.statLabel}>PAIRS</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* 1. Play Again Button */}
            <TouchableOpacity
              style={[styles.primaryButton, Shadows.sm]}
              onPress={onPlayAgain}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Play Again"
            >
              <RotateCcw size={18} color={Colors.white} strokeWidth={2.2} />
              <Text style={styles.primaryButtonText}>Play Again</Text>
            </TouchableOpacity>

            {/* 2. Choose Another Game Button */}
            <TouchableOpacity
              style={[styles.secondaryButton, Shadows.sm]}
              onPress={onChooseAnotherGame}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Choose Another Game"
            >
              <Compass size={17} color={Colors.primaryDark} strokeWidth={2.2} />
              <Text style={styles.secondaryButtonText}>Choose Another Game</Text>
            </TouchableOpacity>

            {/* 3. Back to Games Hub */}
            <TouchableOpacity
              style={styles.textButton}
              onPress={onBackToGames}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back to Games Overview"
            >
              <ArrowLeft size={14} color={Colors.mutedText} strokeWidth={2} />
              <Text style={styles.textButtonText}>Back to Games Overview</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(41, 51, 46, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  celebrationCircleOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.lightSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  celebrationCircleInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FAF8F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.mint,
  },
  celebrationEmoji: {
    fontSize: 30,
  },
  sparkleBadge: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F7E5DA',
  },
  title: {
    ...Typography.h2,
    fontSize: 24,
    color: Colors.darkText,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryDark,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  note: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 18,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#FAF8F2',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    ...Typography.stat,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkText,
  },
  statLabel: {
    ...Typography.label,
    fontSize: 9.5,
    color: Colors.mutedText,
    marginTop: 2,
  },
  actionsContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryDark,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
    gap: 8,
    width: '100%',
  },
  primaryButtonText: {
    ...Typography.button,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lavender,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
    gap: 8,
    width: '100%',
  },
  secondaryButtonText: {
    ...Typography.button,
    fontSize: 14,
    fontWeight: '700',
    color: '#5A4E80',
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  textButtonText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedText,
  },
});
