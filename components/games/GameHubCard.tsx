import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Sparkles, Star, Search, Brain } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

interface GameHubCardProps {
  title: string;
  emoji: string;
  badgeText: string;
  badgeIcon: React.ReactNode;
  badgeColor: string;
  badgeBg: string;
  description: string;
  illustrationType: 'word-detective' | 'memory-match';
  tags: string[];
  buttonText?: string;
  onPress: () => void;
}

export const GameHubCard: React.FC<GameHubCardProps> = ({
  title,
  emoji,
  badgeText,
  badgeIcon,
  badgeColor,
  badgeBg,
  description,
  illustrationType,
  tags,
  buttonText = 'Play Game',
  onPress,
}) => {
  const { width } = useWindowDimensions();
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(pressScale, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: pressScale }] }]}>
      <View style={[styles.card, Shadows.md]}>
        {/* Top Header Badge */}
        <View style={styles.topRow}>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            {badgeIcon}
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>READY TO PLAY</Text>
          </View>
        </View>

        {/* Visual Illustration Area */}
        <View style={styles.illustrationWrapper}>
          {illustrationType === 'word-detective' ? (
            <LinearGradient
              colors={['#F9F3EE', '#F4EFFB', '#ECE6F6']}
              start={{ x: 0.1, y: 0.1 }}
              end={{ x: 0.9, y: 0.9 }}
              style={styles.illustrationCanvas}
            >
              {/* Decorative floating sparkle accents */}
              <View style={styles.decoSparkleTopRight}>
                <Sparkles size={16} color="#B5A5DB" strokeWidth={2.2} />
              </View>
              <View style={styles.decoStarBottomLeft}>
                <Star size={13} color="#E8B86D" fill="#E8B86D" strokeWidth={1} />
              </View>

              {/* Floating letter tiles */}
              <View style={[styles.floatingLetterTile, styles.letterTileA, Shadows.sm]}>
                <Text style={styles.floatingLetterText}>A</Text>
              </View>
              <View style={[styles.floatingLetterTile, styles.letterTileQuestion, Shadows.sm]}>
                <Text style={styles.floatingLetterText}>?</Text>
              </View>
              <View style={[styles.floatingLetterTile, styles.letterTileZ, Shadows.sm]}>
                <Text style={styles.floatingLetterText}>Z</Text>
              </View>

              {/* Central Detective Glass & Mystery Card */}
              <View style={[styles.detectiveCenterTile, Shadows.md]}>
                <View style={styles.detectiveIconCircle}>
                  <Search size={26} color="#5A4E80" strokeWidth={2.5} />
                </View>
                <View style={styles.detectiveBadgeMini}>
                  <Text style={styles.detectiveBadgeMiniText}>MYSTERY WORD</Text>
                </View>
              </View>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={['#F0ECF8', '#EAE5F4', '#E0EAF5']}
              start={{ x: 0.1, y: 0.1 }}
              end={{ x: 0.9, y: 0.9 }}
              style={styles.illustrationCanvas}
            >
              {/* Decorative floating accents */}
              <View style={styles.decoSparkleTopRight}>
                <Sparkles size={16} color="#B5A5DB" strokeWidth={2.2} />
              </View>
              <View style={styles.decoStarBottomLeft}>
                <Star size={13} color="#E8B86D" fill="#E8B86D" strokeWidth={1} />
              </View>

              {/* Central Matching Cards */}
              <View style={styles.memoryCardsContainer}>
                {/* Back card (tilted left) */}
                <View style={[styles.memoryMiniCard, styles.memoryBackCard]}>
                  <Text style={styles.memoryCardEmoji}>🌸</Text>
                </View>

                {/* Front card (tilted right) */}
                <View style={[styles.memoryMiniCard, styles.memoryFrontCard, Shadows.sm]}>
                  <Text style={styles.memoryCardEmoji}>🌸</Text>
                  <View style={styles.matchedCheckDot}>
                    <Text style={styles.matchedCheckText}>✓</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Content Section: Title & Description */}
        <View style={styles.contentSection}>
          <Text style={styles.gameTitle}>
            {title} {emoji}
          </Text>
          <Text style={styles.gameDescription}>{description}</Text>

          {/* Tags / Features row */}
          <View style={styles.tagsRow}>
            {tags.map((tag, idx) => (
              <View key={idx} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.playButton, Shadows.sm]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`${buttonText} - ${title}`}
        >
          <Play size={16} color={Colors.white} fill={Colors.white} style={styles.playIcon} />
          <Text style={styles.playButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
  },
  badgeText: {
    ...Typography.label,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6AAF7D',
  },
  statusText: {
    ...Typography.label,
    fontSize: 9.5,
    color: Colors.mutedText,
    letterSpacing: 0.5,
  },
  illustrationWrapper: {
    width: '100%',
    height: 140,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  illustrationCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  decoSparkleTopRight: {
    position: 'absolute',
    top: 10,
    right: 14,
    opacity: 0.8,
  },
  decoStarBottomLeft: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    opacity: 0.85,
  },
  // Word detective illustration items
  floatingLetterTile: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8DFF5',
  },
  letterTileA: {
    top: 18,
    left: 36,
    transform: [{ rotate: '-12deg' }],
  },
  letterTileQuestion: {
    top: 24,
    right: 42,
    transform: [{ rotate: '15deg' }],
  },
  letterTileZ: {
    bottom: 16,
    right: 68,
    transform: [{ rotate: '-8deg' }],
  },
  floatingLetterText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5A4E80',
  },
  detectiveCenterTile: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2D8F2',
  },
  detectiveIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4EFFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  detectiveBadgeMini: {
    backgroundColor: '#EAE5F4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  detectiveBadgeMiniText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#5A4E80',
    letterSpacing: 0.5,
  },
  // Memory match illustration items
  memoryCardsContainer: {
    width: 100,
    height: 72,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryMiniCard: {
    width: 52,
    height: 64,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#D4E0D9',
  },
  memoryBackCard: {
    left: 10,
    transform: [{ rotate: '-10deg' }],
    backgroundColor: '#FAF7FC',
    borderColor: '#DDD6EC',
  },
  memoryFrontCard: {
    right: 10,
    transform: [{ rotate: '8deg' }],
    backgroundColor: Colors.white,
    borderColor: Colors.primaryLight,
  },
  memoryCardEmoji: {
    fontSize: 24,
  },
  matchedCheckDot: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  matchedCheckText: {
    color: Colors.white,
    fontSize: 9.5,
    fontWeight: '800',
  },
  contentSection: {
    marginBottom: Spacing.lg,
  },
  gameTitle: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.darkText,
    marginBottom: 6,
  },
  gameDescription: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mutedText,
    marginBottom: Spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.round,
  },
  tagText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  playButton: {
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.xl,
    paddingVertical: 13,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playIcon: {
    marginRight: 2,
  },
  playButtonText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
