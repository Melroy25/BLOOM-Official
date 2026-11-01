import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Sparkles, Star } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

interface CircularGameOptionProps {
  onPress: () => void;
}

export const CircularGameOption: React.FC<CircularGameOptionProps> = ({ onPress }) => {
  const { width } = useWindowDimensions();

  // Responsive circle diameter: ~210-230px on typical phones
  const circleSize = Math.max(190, Math.min(Math.round(width * 0.56), 230));

  // Animations
  const pressScale = useRef(new Animated.Value(1)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;

  // Gentle, calm breathing pulse
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.028,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0.98,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breatheAnim]);

  const handlePressIn = () => {
    Animated.timing(pressScale, {
      toValue: 0.94,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* 1. Large Circular Game Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Memory Match, Find matching pairs at your own pace"
        accessibilityHint="Tap to start the Memory Matching game"
        style={styles.touchableWrapper}
      >
        <Animated.View
          style={[
            styles.animatedCircleWrapper,
            {
              transform: [{ scale: Animated.multiply(pressScale, breatheAnim) }],
            },
          ]}
        >
          {/* Outer glowing halo ring */}
          <LinearGradient
            colors={[
              'rgba(234, 229, 244, 0.95)',
              'rgba(224, 234, 245, 0.65)',
              'rgba(250, 248, 242, 0.2)',
            ]}
            style={[
              styles.outerGlowRing,
              {
                width: circleSize + 36,
                height: circleSize + 36,
                borderRadius: (circleSize + 36) / 2,
              },
            ]}
          >
            {/* Main Circle Body */}
            <LinearGradient
              colors={['#F0ECF8', '#EAE5F4', '#E0EAF5']}
              start={{ x: 0.1, y: 0.1 }}
              end={{ x: 0.9, y: 0.9 }}
              style={[
                styles.mainCircle,
                Shadows.lg,
                {
                  width: circleSize,
                  height: circleSize,
                  borderRadius: circleSize / 2,
                },
              ]}
            >
              {/* Glossy top highlights */}
              <View style={styles.glossHighlightLarge} />
              <View style={styles.glossHighlightSmall} />

              {/* Decorative floating star / sparkle accents */}
              <View style={styles.decoSparkleTopRight}>
                <Sparkles size={16} color="#B5A5DB" strokeWidth={2.2} />
              </View>
              <View style={styles.decoStarBottomLeft}>
                <Star size={13} color="#E8B86D" fill="#E8B86D" strokeWidth={1} />
              </View>

              {/* Central Illustration: Two matching blooming wellness cards */}
              <View style={styles.cardsIllustrationContainer}>
                {/* Back card (left tilt) */}
                <View style={[styles.miniCard, styles.backCard]}>
                  <Text style={styles.cardEmoji}>🌸</Text>
                </View>

                {/* Front card (right tilt) */}
                <View style={[styles.miniCard, styles.frontCard, Shadows.sm]}>
                  <Text style={styles.cardEmoji}>🌸</Text>
                  <View style={styles.matchedCheckDot}>
                    <Text style={styles.matchedCheckText}>✓</Text>
                  </View>
                </View>
              </View>

              {/* Badge */}
              <View style={styles.modeBadge}>
                <Sparkles size={11} color={Colors.primaryDark} strokeWidth={2.4} />
                <Text style={styles.modeBadgeText}>PAIR & HARMONIZE</Text>
              </View>
            </LinearGradient>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* 2. Title & Description directly beneath the circle */}
      <View style={styles.infoSection}>
        <Text style={styles.gameTitle}>Memory Match</Text>
        <Text style={styles.gameDescription}>
          Find matching pairs at your own pace.
        </Text>
      </View>

      {/* 3. Call-to-action button */}
      <TouchableOpacity
        style={[styles.playButton, Shadows.md]}
        onPress={onPress}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel="Play Game"
      >
        <Play size={16} color={Colors.white} fill={Colors.white} style={styles.playIcon} />
        <Text style={styles.playButtonText}>Play Game</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  touchableWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedCircleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlowRing: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(216, 208, 232, 0.45)',
  },
  mainCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    overflow: 'hidden',
    position: 'relative',
  },
  glossHighlightLarge: {
    position: 'absolute',
    top: 10,
    width: '68%',
    height: '34%',
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    transform: [{ rotate: '-14deg' }],
  },
  glossHighlightSmall: {
    position: 'absolute',
    top: 24,
    right: 28,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  decoSparkleTopRight: {
    position: 'absolute',
    top: 26,
    right: 32,
  },
  decoStarBottomLeft: {
    position: 'absolute',
    bottom: 34,
    left: 32,
  },
  cardsIllustrationContainer: {
    width: 110,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  miniCard: {
    width: 52,
    height: 68,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  backCard: {
    backgroundColor: '#E4DFEE',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    left: 18,
    top: 4,
    transform: [{ rotate: '-12deg' }],
  },
  frontCard: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#D8D0E8',
    right: 18,
    top: 8,
    transform: [{ rotate: '10deg' }],
  },
  cardEmoji: {
    fontSize: 24,
  },
  matchedCheckDot: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  matchedCheckText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(120, 155, 131, 0.35)',
    marginTop: 2,
  },
  modeBadgeText: {
    ...Typography.label,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  infoSection: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  gameTitle: {
    ...Typography.h2,
    fontSize: 24,
    color: Colors.darkText,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  gameDescription: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.mutedText,
    textAlign: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: BorderRadius.round,
    gap: 8,
  },
  playIcon: {
    marginLeft: 2,
  },
  playButtonText: {
    ...Typography.button,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
