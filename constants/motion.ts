/**
 * constants/motion.ts
 * Wharf / The Creator Signature Motion System for BLOOM.
 * Centralizes easing curves, durations, and animation configurations.
 */

import { Easing } from 'react-native';

/**
 * The Signature Easing Curve: cubic-bezier(0.22, 1, 0.36, 1)
 * A smooth, physical ease-out deceleration curve with natural momentum.
 */
export const SIGNATURE_EASING_BEZIER: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const Motion = {
  // Signature bezier easing function for React Native Animated / Reanimated
  easing: Easing.bezier(0.22, 1, 0.36, 1),

  // Standard cubic ease-out for count-up numbers: 1 - Math.pow(1 - t, 3)
  countUpEaseOut: (t: number) => 1 - Math.pow(1 - t, 3),

  // Standard web CSS easing string
  cssEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',

  // Durations (in ms)
  durations: {
    tap: 150,          // Tactile press response
    enter: 250,        // Fast entrance
    screenTransition: 250, // Screen enter
    screenExit: 150,   // Screen exit
    cardGrid: 350,     // Card grid cascade
    cascade: 400,      // Staggered screen cascade
    countUp: 900,      // Number counter duration
  },

  // Stagger entrance delays (in ms)
  staggerDelays: {
    header: 0,
    badges: 60,
    mainCards: 120,
    charts: 180,
    remaining: 220,
    gridInterval: 40,
    maxListCap: 400,   // Prevent long lists from lagging
  },

  // Transforms
  transforms: {
    hoverLift: -2,     // 2px lift on web hover
    pressScaleButton: 0.97, // 0.97 scale on button press
    pressScaleCard: 0.985,  // 0.985 subtle scale on card press
    entranceOffsetY: 16,    // 16px vertical offset on cascade entrance
    gridOffsetY: 12,        // 12px vertical offset on grid entrance
  },
};
