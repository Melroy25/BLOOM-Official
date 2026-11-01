import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  View,
} from 'react-native';
import { Sparkles, Check } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

interface MemoryCardProps {
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  isLocked: boolean;
  onPress: () => void;
  width: number;
  height: number;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  symbol,
  isFlipped,
  isMatched,
  isLocked,
  onPress,
  width,
  height,
}) => {
  const animatedValue = useRef(new Animated.Value(isFlipped || isMatched ? 1 : 0)).current;
  const matchPulseAnim = useRef(new Animated.Value(1)).current;

  // Handle flip animation
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFlipped || isMatched ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isFlipped, isMatched, animatedValue]);

  // Handle celebration pulse on match
  useEffect(() => {
    if (isMatched) {
      Animated.sequence([
        Animated.timing(matchPulseAnim, {
          toValue: 1.12,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(matchPulseAnim, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isMatched, matchPulseAnim]);

  // Interpolations for card flip
  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const scaleInterpolate = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.94, 1],
  });

  const isRevealed = isFlipped || isMatched;
  const isDisabled = isRevealed || isLocked;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={
        isRevealed ? `Card showing ${symbol}` : 'Hidden card, tap to flip'
      }
      accessibilityState={{ disabled: isDisabled, selected: isRevealed }}
      style={[styles.touchable, { width, height }]}
    >
      <Animated.View
        style={[
          styles.cardContainer,
          Shadows.sm,
          {
            width,
            height,
            transform: [
              { scale: Animated.multiply(scaleInterpolate, matchPulseAnim) },
            ],
          },
        ]}
      >
        {/* FACE DOWN (BACK OF CARD) */}
        <Animated.View
          pointerEvents={isRevealed ? 'none' : 'auto'}
          style={[
            styles.face,
            styles.faceDown,
            {
              opacity: backInterpolate,
            },
          ]}
        >
          <View style={styles.backPatternInner}>
            <Sparkles size={20} color="#9EAAB5" strokeWidth={1.8} />
          </View>
        </Animated.View>

        {/* FACE UP (FRONT OF CARD - SYMBOL) */}
        <Animated.View
          pointerEvents={isRevealed ? 'auto' : 'none'}
          style={[
            styles.face,
            styles.faceUp,
            isMatched && styles.faceUpMatched,
            {
              opacity: frontInterpolate,
            },
          ]}
        >
          <Text style={styles.symbolText}>{symbol}</Text>
          {isMatched && (
            <View style={styles.matchedCheckBadge}>
              <Check size={10} color={Colors.white} strokeWidth={3} />
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    margin: 4,
  },
  cardContainer: {
    borderRadius: BorderRadius.lg,
    position: 'relative',
  },
  face: {
    ...StyleSheet.absoluteFill,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  faceDown: {
    backgroundColor: '#EDEBF4',
    borderWidth: 1.5,
    borderColor: '#DFD8EC',
  },
  backPatternInner: {
    width: '74%',
    height: '74%',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(181, 165, 219, 0.4)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  faceUp: {
    backgroundColor: Colors.white,
    borderWidth: 1.8,
    borderColor: '#C8BDE1',
  },
  faceUpMatched: {
    backgroundColor: '#E8F5EE',
    borderColor: '#82BCA0',
  },
  symbolText: {
    fontSize: 28,
  },
  matchedCheckBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
