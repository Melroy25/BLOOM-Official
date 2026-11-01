import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParticleData {
  id: number;
  startX: number;
  startY: number;
  size: number;
  color: string;
  opacity: number;
  driftRange: number;
  duration: number;
  delay: number;
}

// Color palette: Gold (#E8B86D), White (#FFFFFF), and Sage Green (#789B83)
const PARTICLE_COLORS = ['#E8B86D', '#FFFFFF', '#789B83', '#E8F1E8'];

const PARTICLES: ParticleData[] = [
  { id: 1, startX: 0.12, startY: 0.15, size: 6, color: '#E8B86D', opacity: 0.65, driftRange: 24, duration: 4200, delay: 0 },
  { id: 2, startX: 0.28, startY: 0.22, size: 4, color: '#FFFFFF', opacity: 0.75, driftRange: 18, duration: 3800, delay: 400 },
  { id: 3, startX: 0.75, startY: 0.18, size: 7, color: '#789B83', opacity: 0.55, driftRange: 28, duration: 5000, delay: 800 },
  { id: 4, startX: 0.86, startY: 0.28, size: 5, color: '#E8B86D', opacity: 0.6, driftRange: 20, duration: 4500, delay: 200 },
  { id: 5, startX: 0.18, startY: 0.45, size: 8, color: '#FFFFFF', opacity: 0.7, driftRange: 32, duration: 5200, delay: 600 },
  { id: 6, startX: 0.82, startY: 0.48, size: 6, color: '#789B83', opacity: 0.5, driftRange: 26, duration: 4800, delay: 1000 },
  { id: 7, startX: 0.1, startY: 0.65, size: 5, color: '#E8B86D', opacity: 0.65, driftRange: 22, duration: 4100, delay: 300 },
  { id: 8, startX: 0.25, startY: 0.72, size: 7, color: '#FFFFFF', opacity: 0.7, driftRange: 30, duration: 5500, delay: 700 },
  { id: 9, startX: 0.72, startY: 0.68, size: 4, color: '#789B83', opacity: 0.55, driftRange: 18, duration: 3900, delay: 100 },
  { id: 10, startX: 0.88, startY: 0.75, size: 6, color: '#E8B86D', opacity: 0.6, driftRange: 24, duration: 4600, delay: 900 },
  { id: 11, startX: 0.45, startY: 0.12, size: 5, color: '#FFFFFF', opacity: 0.6, driftRange: 20, duration: 4300, delay: 500 },
  { id: 12, startX: 0.55, startY: 0.82, size: 7, color: '#789B83', opacity: 0.5, driftRange: 26, duration: 5100, delay: 1100 },
  { id: 13, startX: 0.35, startY: 0.35, size: 4, color: '#E8B86D', opacity: 0.7, driftRange: 16, duration: 3700, delay: 350 },
  { id: 14, startX: 0.65, startY: 0.4, size: 6, color: '#FFFFFF', opacity: 0.65, driftRange: 22, duration: 4400, delay: 750 },
];

const SingleParticle: React.FC<{ particle: ParticleData }> = ({ particle }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(particle.opacity)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -particle.driftRange,
            duration: particle.duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: Math.min(particle.opacity + 0.25, 0.95),
            duration: particle.duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: particle.driftRange * 0.8,
            duration: particle.duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: Math.max(particle.opacity - 0.25, 0.2),
            duration: particle.duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const timer = setTimeout(() => {
      loop.start();
    }, particle.delay);

    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [particle, translateY, opacityAnim]);

  const left = particle.startX * SCREEN_WIDTH;
  const top = particle.startY * SCREEN_HEIGHT;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left,
          top,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: particle.color,
          opacity: opacityAnim,
          transform: [{ translateY }],
          shadowColor: particle.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: particle.size,
          elevation: 1,
        },
      ]}
    />
  );
};

export const FloatingParticles: React.FC = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map(p => (
        <SingleParticle key={p.id} particle={p} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
});
