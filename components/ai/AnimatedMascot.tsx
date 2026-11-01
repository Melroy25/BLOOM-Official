import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { MascotState } from '../../services/aiCompanionService';

interface AnimatedMascotProps {
  state: MascotState;
  onTap?: () => void;
  size?: number;
}

const TAP_AFFIRMATIONS = [
  "I'm right here with you ✨",
  "Take a slow, gentle breath 🌿",
  "You're doing great, take your time 🌸",
  "One step at a time, you've got this 💫",
  "Peace begins with a deep exhale 🌙",
];

export function AnimatedMascot({ state = 'IDLE', onTap, size = 260 }: AnimatedMascotProps) {
  const [tapBubbleText, setTapBubbleText] = useState<string | null>(null);
  const isTapAnimating = useRef(false);

  // Animated values
  const floatAnim = useRef(new Animated.Value(0)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const haloScaleAnim = useRef(new Animated.Value(1)).current;
  const haloOpacityAnim = useRef(new Animated.Value(0.75)).current;
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;
  const orbitalTiltAnim = useRef(new Animated.Value(0)).current;
  const sparkleOpacity1 = useRef(new Animated.Value(0.4)).current;
  const sparkleOpacity2 = useRef(new Animated.Value(0.7)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleTranslate = useRef(new Animated.Value(10)).current;

  // Track active animation loops
  const activeLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Sparkle ambient twinkling loops with staggered phases
  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleOpacity1, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacity1, {
          toValue: 0.25,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );

    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleOpacity2, {
          toValue: 0.2,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacity2, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    );

    loop1.start();
    loop2.start();

    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [sparkleOpacity1, sparkleOpacity2]);

  // Gentle orbital ring sway
  useEffect(() => {
    const orbitalLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbitalTiltAnim, {
          toValue: 1,
          duration: 4500,
          useNativeDriver: true,
        }),
        Animated.timing(orbitalTiltAnim, {
          toValue: 0,
          duration: 4500,
          useNativeDriver: true,
        }),
      ])
    );
    orbitalLoop.start();
    return () => orbitalLoop.stop();
  }, [orbitalTiltAnim]);

  // State-driven animation controller
  useEffect(() => {
    if (activeLoopRef.current) {
      activeLoopRef.current.stop();
      activeLoopRef.current = null;
    }

    tiltAnim.setValue(0);

    if (state === 'IDLE') {
      const loop = Animated.parallel([
        // Gentle floating
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: -14,
              duration: 2600,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 2600,
              useNativeDriver: true,
            }),
          ])
        ),
        // Soft breathing expansion
        Animated.loop(
          Animated.sequence([
            Animated.timing(breathAnim, {
              toValue: 1.045,
              duration: 2600,
              useNativeDriver: true,
            }),
            Animated.timing(breathAnim, {
              toValue: 0.98,
              duration: 2600,
              useNativeDriver: true,
            }),
          ])
        ),
        // Subtle glow pulse
        Animated.loop(
          Animated.sequence([
            Animated.timing(haloScaleAnim, {
              toValue: 1.12,
              duration: 2600,
              useNativeDriver: true,
            }),
            Animated.timing(haloScaleAnim, {
              toValue: 0.95,
              duration: 2600,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(haloOpacityAnim, {
              toValue: 0.9,
              duration: 2600,
              useNativeDriver: true,
            }),
            Animated.timing(haloOpacityAnim, {
              toValue: 0.6,
              duration: 2600,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
      activeLoopRef.current = loop;
      loop.start();
    } else if (state === 'HAPPY') {
      // Gentle happy animation after successful interaction
      const loop = Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: -18,
              duration: 520,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 520,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(tiltAnim, {
              toValue: 0.05,
              duration: 260,
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: -0.05,
              duration: 260,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(haloScaleAnim, {
              toValue: 1.2,
              duration: 520,
              useNativeDriver: true,
            }),
            Animated.timing(haloScaleAnim, {
              toValue: 1.0,
              duration: 520,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
      activeLoopRef.current = loop;
      loop.start();
    } else if (state === 'LISTENING') {
      // Listening animation while microphone is active
      const loop = Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: -8,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(tiltAnim, {
              toValue: 0.04,
              duration: 750,
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: -0.02,
              duration: 750,
              useNativeDriver: true,
            }),
          ])
        ),
        // Radiating pulse rings
        Animated.loop(
          Animated.sequence([
            Animated.timing(ring1Anim, {
              toValue: 1,
              duration: 1400,
              useNativeDriver: true,
            }),
            Animated.timing(ring1Anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.delay(700),
            Animated.timing(ring2Anim, {
              toValue: 1,
              duration: 1400,
              useNativeDriver: true,
            }),
            Animated.timing(ring2Anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
      activeLoopRef.current = loop;
      loop.start();
    } else if (state === 'THINKING') {
      // Thinking animation while waiting for AI response
      const loop = Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: -11,
              duration: 1800,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 1800,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(tiltAnim, {
              toValue: -0.04,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: 0.04,
              duration: 1200,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(haloScaleAnim, {
              toValue: 1.16,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(haloScaleAnim, {
              toValue: 0.96,
              duration: 1200,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
      activeLoopRef.current = loop;
      loop.start();
    } else if (state === 'SPEAKING') {
      // Speaking animation while voice audio is playing
      const loop = Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: 1.055,
              duration: 280,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0.965,
              duration: 280,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: -12,
              duration: 560,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 560,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(haloScaleAnim, {
              toValue: 1.22,
              duration: 560,
              useNativeDriver: true,
            }),
            Animated.timing(haloScaleAnim, {
              toValue: 1.0,
              duration: 560,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
      activeLoopRef.current = loop;
      loop.start();
    } else if (state === 'COMFORTING') {
      // Slow, deep breathing mindful cycle
      const loop = Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(breathAnim, {
              toValue: 1.08,
              duration: 3800,
              useNativeDriver: true,
            }),
            Animated.timing(breathAnim, {
              toValue: 0.96,
              duration: 3800,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: -15,
              duration: 3800,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 3800,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
      activeLoopRef.current = loop;
      loop.start();
    }

    return () => {
      if (activeLoopRef.current) {
        activeLoopRef.current.stop();
      }
    };
  }, [state, floatAnim, breathAnim, bounceAnim, tiltAnim, haloScaleAnim, haloOpacityAnim, ring1Anim, ring2Anim]);

  // Small bounce when tapped
  const handleTap = () => {
    if (isTapAnimating.current) return;
    isTapAnimating.current = true;

    const affirmation = TAP_AFFIRMATIONS[Math.floor(Math.random() * TAP_AFFIRMATIONS.length)];
    setTapBubbleText(affirmation);

    Animated.sequence([
      Animated.spring(bounceAnim, {
        toValue: 1.18,
        friction: 3,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(bubbleOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(bubbleTranslate, {
        toValue: 0,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    onTap?.();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(bubbleOpacity, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(bubbleTranslate, {
          toValue: 10,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTapBubbleText(null);
        isTapAnimating.current = false;
      });
    }, 2400);
  };

  // State-specific soft botanical halo color
  const getHaloBg = () => {
    switch (state) {
      case 'LISTENING':
        return 'rgba(217, 238, 229, 0.85)'; // mint
      case 'THINKING':
        return 'rgba(224, 234, 245, 0.85)'; // pale blue
      case 'SPEAKING':
        return 'rgba(168, 197, 178, 0.55)'; // light sage
      case 'HAPPY':
        return 'rgba(247, 229, 218, 0.8)';  // peach
      case 'COMFORTING':
        return 'rgba(232, 241, 232, 0.85)'; // gentle sage
      default:
        return 'rgba(234, 229, 244, 0.72)'; // soft lavender halo on cream
    }
  };

  return (
    <View style={[styles.container, { width: size * 1.45, height: size * 1.45 }]}>
      {/* Floating Gentle Affirmation on tap */}
      {tapBubbleText && (
        <Animated.View
          style={[
            styles.speechBubble,
            Shadows.md,
            {
              opacity: bubbleOpacity,
              transform: [{ translateY: bubbleTranslate }],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.speechBubbleText}>{tapBubbleText}</Text>
          <View style={styles.speechBubbleArrow} />
        </Animated.View>
      )}

      {/* Listening Wave Rings (Radiating sage green pulse) */}
      {state === 'LISTENING' && (
        <>
          <Animated.View
            style={[
              styles.waveRing,
              {
                width: size * 1.35,
                height: size * 1.35,
                borderRadius: (size * 1.35) / 2,
                opacity: ring1Anim.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0.65, 0.35, 0],
                }),
                transform: [
                  {
                    scale: ring1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1.42],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.waveRing,
              {
                width: size * 1.35,
                height: size * 1.35,
                borderRadius: (size * 1.35) / 2,
                opacity: ring2Anim.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0.65, 0.35, 0],
                }),
                transform: [
                  {
                    scale: ring2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1.42],
                    }),
                  },
                ],
              },
            ]}
          />
        </>
      )}

      {/* Outer Subtle Botanical Circular Halo */}
      <Animated.View
        style={[
          styles.outerHalo,
          {
            width: size * 1.35,
            height: size * 1.35,
            borderRadius: (size * 1.35) / 2,
            opacity: haloOpacityAnim,
            transform: [{ scale: haloScaleAnim }],
            backgroundColor: getHaloBg(),
          },
        ]}
      />

      {/* Inner Soft Mint Glow */}
      <Animated.View
        style={[
          styles.innerGlow,
          {
            width: size * 1.08,
            height: size * 1.08,
            borderRadius: (size * 1.08) / 2,
            transform: [{ scale: breathAnim }],
            backgroundColor:
              state === 'LISTENING'
                ? 'rgba(217, 238, 229, 0.75)'
                : state === 'HAPPY'
                ? 'rgba(247, 229, 218, 0.65)'
                : 'rgba(217, 238, 229, 0.55)',
          },
        ]}
      />

      {/* Gentle Orbital Ring */}
      <Animated.View
        style={[
          styles.orbitalRing,
          {
            width: size * 1.38,
            height: size * 0.55,
            borderRadius: (size * 1.38) / 2,
            transform: [
              {
                rotate: orbitalTiltAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['-16deg', '-12deg'],
                }),
              },
              { scale: breathAnim },
            ],
          },
        ]}
        pointerEvents="none"
      />

      {/* Floating Sparkles around Mascot (Harmonized botanical tones) */}
      <Animated.View
        style={[
          styles.sparkleItem,
          {
            top: size * 0.12,
            left: size * 0.14,
            opacity: sparkleOpacity1,
          },
        ]}
        pointerEvents="none"
      >
        <Sparkles size={16} color={Colors.primary} strokeWidth={1.8} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sparkleItem,
          {
            top: size * 0.08,
            right: size * 0.16,
            opacity: sparkleOpacity2,
          },
        ]}
        pointerEvents="none"
      >
        <Sparkles size={18} color="#4A90E2" strokeWidth={2} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sparkleItem,
          {
            bottom: size * 0.18,
            left: size * 0.16,
            opacity: sparkleOpacity2,
          },
        ]}
        pointerEvents="none"
      >
        <Sparkles size={14} color={Colors.success} strokeWidth={1.8} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sparkleItem,
          {
            bottom: size * 0.15,
            right: size * 0.18,
            opacity: sparkleOpacity1,
          },
        ]}
        pointerEvents="none"
      >
        <Sparkles size={17} color="#9F8EC4" strokeWidth={1.8} />
      </Animated.View>

      {/* Center Interactive Mascot Button */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handleTap}
        style={styles.touchTarget}
        accessibilityLabel="Interactive BLOOM Cloud Mascot"
      >
        <Animated.View
          style={[
            styles.mascotTransformWrapper,
            {
              transform: [
                { translateY: floatAnim },
                { scale: Animated.multiply(breathAnim, bounceAnim) },
                {
                  rotate: tiltAnim.interpolate({
                    inputRange: [-0.1, 0, 0.1],
                    outputRange: ['-6deg', '0deg', '6deg'],
                  }),
                },
              ],
            },
          ]}
        >
          {/* High-Resolution Glossy Mascot Image */}
          <Image
            source={require('../../assets/images/bloom-mascot-hd.png')}
            style={[styles.mascotImage, { width: size, height: size }]}
            resizeMode="contain"
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  touchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  mascotTransformWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImage: {
    zIndex: 5,
  },
  outerHalo: {
    position: 'absolute',
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(120, 155, 131, 0.18)',
  },
  innerGlow: {
    position: 'absolute',
    zIndex: 3,
    borderWidth: 1,
    borderColor: 'rgba(120, 155, 131, 0.12)',
  },
  orbitalRing: {
    position: 'absolute',
    zIndex: 2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(120, 155, 131, 0.32)',
  },
  waveRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.primary,
    zIndex: 4,
  },
  sparkleItem: {
    position: 'absolute',
    zIndex: 6,
  },
  speechBubble: {
    position: 'absolute',
    top: -30,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    zIndex: 30,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  speechBubbleText: {
    ...Typography.bodySmall,
    color: Colors.darkText,
    fontWeight: '600',
    fontSize: 13,
  },
  speechBubbleArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 6,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.white,
  },
});
