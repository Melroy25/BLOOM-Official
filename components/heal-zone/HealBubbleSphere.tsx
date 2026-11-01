import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Sparkles, Wind, RotateCcw, Heart, Check } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { feelingOptions, FeelingOption } from '../../data/healBubbleData';
import { FloatingParticles } from './FloatingParticles';

const getDynamicPhrases = (thought: string | null) => {
  const clean = thought?.trim() || "today's worries";
  return [
    'Relax and watch your thought...',
    'Take a deep breath in...',
    '...and breathe out',
    `"${clean}" is carrying a lot right now`,
    `"${clean}"... it feels like it says everything`,
    'In the grand expanse of life, this will pass...',
  ];
};

interface HealBubbleSphereProps {
  activeThought: string | null;
  onBurstComplete: (thought: string, feeling: string, feelingEmoji: string) => void;
  onReset: () => void;
  onSelectSuggestion?: (suggestion: string) => void;
  suggestions?: string[];
}

const MINDFUL_PHRASES = [
  'Take a slow, deep breath in...',
  'Observe this worry without judgment...',
  'In the grand expanse of life, this will pass...',
  'Exhale gently and release the weight...',
  'Dissolving into calm...',
];

export const HealBubbleSphere: React.FC<HealBubbleSphereProps> = ({
  activeThought,
  onBurstComplete,
  onReset,
  onSelectSuggestion,
  suggestions = [],
}) => {
  // Phase: 'idle' | 'dissolving' | 'bursted'
  const [phase, setPhase] = useState<'idle' | 'dissolving' | 'bursted'>('idle');
  const [mindfulIndex, setMindfulIndex] = useState(0);
  const [selectedFeeling, setSelectedFeeling] = useState<FeelingOption | null>(null);

  // Animated values
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const shrinkScaleAnim = useRef(new Animated.Value(1)).current;
  const bubbleOpacityAnim = useRef(new Animated.Value(1)).current;
  const burstScaleAnim = useRef(new Animated.Value(0.5)).current;
  const burstOpacityAnim = useRef(new Animated.Value(0)).current;
  const rippleScale1 = useRef(new Animated.Value(1)).current;
  const rippleScale2 = useRef(new Animated.Value(1)).current;

  // Subtle breathing loop when idle
  useEffect(() => {
    let breatheLoop: Animated.CompositeAnimation | null = null;
    let rippleLoop1: Animated.CompositeAnimation | null = null;
    let rippleLoop2: Animated.CompositeAnimation | null = null;

    if (phase === 'idle') {
      shrinkScaleAnim.setValue(1);
      bubbleOpacityAnim.setValue(1);
      burstOpacityAnim.setValue(0);
      burstScaleAnim.setValue(0.5);

      breatheLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, {
            toValue: 1.06,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnim, {
            toValue: 0.96,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      breatheLoop.start();

      rippleLoop1 = Animated.loop(
        Animated.sequence([
          Animated.timing(rippleScale1, {
            toValue: 1.14,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rippleScale1, {
            toValue: 1.0,
            duration: 2400,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      rippleLoop1.start();

      rippleLoop2 = Animated.loop(
        Animated.sequence([
          Animated.timing(rippleScale2, {
            toValue: 1.24,
            duration: 3200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rippleScale2, {
            toValue: 1.0,
            duration: 3200,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      rippleLoop2.start();
    }

    return () => {
      breatheLoop?.stop();
      rippleLoop1?.stop();
      rippleLoop2?.stop();
    };
  }, [phase, breatheAnim, rippleScale1, rippleScale2, shrinkScaleAnim, bubbleOpacityAnim, burstOpacityAnim, burstScaleAnim]);

  // Handle new active thought: trigger soothing shrinking animation
  useEffect(() => {
    if (activeThought && activeThought.trim().length > 0) {
      setPhase('dissolving');
      setMindfulIndex(0);
      setSelectedFeeling(null);

      const dynamicPhrases = getDynamicPhrases(activeThought);
      // Cycle phrases every 3.5 seconds while dissolving
      const phraseInterval = setInterval(() => {
        setMindfulIndex(prev => (prev + 1) % dynamicPhrases.length);
      }, 3500);

      // Smooth shrinking and dissolve animation (Pixel thoughts effect)
      Animated.parallel([
        Animated.timing(shrinkScaleAnim, {
          toValue: 0.15,
          duration: 6500,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(bubbleOpacityAnim, {
          toValue: 0,
          duration: 6500,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        clearInterval(phraseInterval);
        if (finished) {
          triggerBurst();
        }
      });

      return () => {
        clearInterval(phraseInterval);
      };
    } else {
      setPhase('idle');
    }
  }, [activeThought]);

  const triggerBurst = () => {
    setPhase('bursted');
    // Pop/burst wave animation
    burstScaleAnim.setValue(0.3);
    burstOpacityAnim.setValue(0.9);

    Animated.parallel([
      Animated.timing(burstScaleAnim, {
        toValue: 1.4,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(burstOpacityAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBurstNow = () => {
    shrinkScaleAnim.stopAnimation();
    bubbleOpacityAnim.stopAnimation();
    shrinkScaleAnim.setValue(0.1);
    bubbleOpacityAnim.setValue(0);
    triggerBurst();
  };

  const handleSelectFeeling = (option: FeelingOption) => {
    setSelectedFeeling(option);
    if (activeThought) {
      onBurstComplete(activeThought, option.label, option.emoji);
    }
    // Return to idle after logging
    setTimeout(() => {
      setPhase('idle');
      onReset();
    }, 700);
  };

  const handleRestart = () => {
    setPhase('idle');
    onReset();
  };

  const currentPhrases = getDynamicPhrases(activeThought);

  return (
    <View style={styles.container}>
      <FloatingParticles />
      {/* BUBBLE ARENA */}
      <View style={styles.arena}>
        {/* Ripple Outer Rings */}
        {phase === 'idle' && (
          <>
            <Animated.View
              style={[
                styles.rippleRing,
                styles.rippleRing2,
                { transform: [{ scale: rippleScale2 }] },
              ]}
            />
            <Animated.View
              style={[
                styles.rippleRing,
                styles.rippleRing1,
                { transform: [{ scale: rippleScale1 }] },
              ]}
            />
          </>
        )}

        {/* Burst Expansion Wave */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.burstWave,
            {
              transform: [{ scale: burstScaleAnim }],
              opacity: burstOpacityAnim,
            },
          ]}
        />

        {/* MAIN INTERACTIVE BUBBLE */}
        {phase !== 'bursted' && (
          <Animated.View
            style={[
              styles.bubble,
              Shadows.lg,
              {
                transform: [
                  { scale: phase === 'dissolving' ? shrinkScaleAnim : breatheAnim },
                ],
                opacity: phase === 'dissolving' ? bubbleOpacityAnim : 1,
              },
            ]}
          >
            {/* Bubble reflection highlight */}
            <View style={styles.bubbleHighlight} />
            <View style={styles.bubbleHighlightSmall} />

            {phase === 'idle' ? (
              <View style={styles.idleContent}>
                <View style={styles.idleIconCircle}>
                  <Wind size={26} color={Colors.primary} strokeWidth={2.2} />
                </View>
                <Text style={styles.bubbleTitle}>Create a Bubble</Text>
                <Text style={styles.bubbleSubtitle}>
                  Put your worry into the bubble and watch it gently dissolve away.
                </Text>
              </View>
            ) : (
              <View style={styles.dissolvingContent}>
                <Text style={styles.activeThoughtText} numberOfLines={4}>
                  "{activeThought}"
                </Text>
                <View style={styles.dissolvingBadge}>
                  <Sparkles size={13} color={Colors.primaryDark} strokeWidth={2} />
                  <Text style={styles.dissolvingText}>Dissolving</Text>
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {/* BURSTED STATE - POST RESOLUTION & FEELING SELECTOR */}
        {phase === 'bursted' && (
          <View style={[styles.burstedCard, Shadows.md]}>
            <View style={styles.burstedIconWrapper}>
              <Sparkles size={28} color={Colors.primary} strokeWidth={2.2} />
            </View>
            <Text style={styles.burstedHeading}>Thought Dissolved</Text>
            <Text style={styles.burstedSubtext}>
              Your worry has floated into the cosmos. How do you feel right now?
            </Text>

            {/* Feeling Selection Options */}
            <View style={styles.feelingOptionsGrid}>
              {feelingOptions.map(option => {
                const isSelected = selectedFeeling?.id === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.feelingChip,
                      isSelected && styles.feelingChipSelected,
                    ]}
                    onPress={() => handleSelectFeeling(option)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.feelingEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.feelingLabel,
                        isSelected && styles.feelingLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Check size={14} color={Colors.primaryDark} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.anotherBubbleBtn}
              onPress={handleRestart}
              activeOpacity={0.75}
            >
              <RotateCcw size={15} color={Colors.mutedText} strokeWidth={2} />
              <Text style={styles.anotherBubbleText}>Create Another Bubble</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* MINDFUL GUIDANCE PHRASE DURING DISSOLVING */}
      {phase === 'dissolving' && (
        <View style={styles.mindfulGuideContainer}>
          <Text style={styles.mindfulPhraseText}>
            {currentPhrases[mindfulIndex % currentPhrases.length]}
          </Text>
          <TouchableOpacity
            style={styles.burstNowBtn}
            onPress={handleBurstNow}
            activeOpacity={0.7}
          >
            <Sparkles size={13} color={Colors.primaryDark} strokeWidth={2} />
            <Text style={styles.burstNowText}>Burst Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* QUICK SUGGESTIONS WHEN IDLE */}
      {phase === 'idle' && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Or tap a common worry:</Text>
          <View style={styles.suggestionsList}>
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionChip}
                onPress={() => onSelectSuggestion && onSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  arena: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: Spacing.sm,
  },
  rippleRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
  },
  rippleRing1: {
    width: 236,
    height: 236,
    borderColor: 'rgba(120, 155, 131, 0.22)',
    backgroundColor: 'rgba(232, 241, 232, 0.35)',
  },
  rippleRing2: {
    width: 270,
    height: 270,
    borderColor: 'rgba(120, 155, 131, 0.12)',
    backgroundColor: 'rgba(232, 241, 232, 0.18)',
  },
  burstWave: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 999,
    backgroundColor: 'rgba(232, 241, 232, 0.85)',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  bubble: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  bubbleHighlight: {
    position: 'absolute',
    top: 14,
    left: 28,
    width: 44,
    height: 22,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    transform: [{ rotate: '-35deg' }],
  },
  bubbleHighlightSmall: {
    position: 'absolute',
    top: 36,
    left: 20,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  idleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  bubbleTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.darkText,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 4,
  },
  bubbleSubtitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: Spacing.xs,
  },
  dissolvingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  activeThoughtText: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  dissolvingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.lightSage,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  dissolvingText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  burstedCard: {
    width: '94%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  burstedIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  burstedHeading: {
    ...Typography.h3,
    fontSize: 17,
    color: Colors.darkText,
    marginBottom: 2,
  },
  burstedSubtext: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  feelingOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 7,
    marginBottom: Spacing.md,
    width: '100%',
  },
  feelingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  feelingChipSelected: {
    backgroundColor: Colors.lightSage,
    borderColor: Colors.primary,
  },
  feelingEmoji: {
    fontSize: 13,
  },
  feelingLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.darkText,
  },
  feelingLabelSelected: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  anotherBubbleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
  },
  anotherBubbleText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.mutedText,
    fontWeight: '600',
  },
  mindfulGuideContainer: {
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xl,
  },
  mindfulPhraseText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.primaryDark,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  burstNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.lightSage,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  burstNowText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  suggestionsContainer: {
    marginTop: Spacing.xs,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing.lg,
  },
  suggestionsTitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.mutedText,
    marginBottom: 6,
    fontWeight: '500',
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  suggestionChip: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
  },
  suggestionText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.darkText,
  },
});
