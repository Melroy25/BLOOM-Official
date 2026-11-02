/**
 * components/animations/CountUp.tsx
 * Precision metric count-up animation for genuine statistics and numbers.
 * Duration: 900ms with cubic ease-out: 1 - Math.pow(1 - t, 3).
 * Styled with JetBrains Mono.
 */

import React, { useEffect, useState, useRef } from 'react';
import { Text, TextStyle, StyleProp, AccessibilityInfo } from 'react-native';
import { FontFamily } from '../../constants/typography';
import { Motion } from '../../constants/motion';

interface CountUpProps {
  value: number | null | undefined;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
  fallback?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = Motion.durations.countUp,
  decimals = 0,
  prefix = '',
  suffix = '',
  style,
  fallback = '—',
}) => {
  // If no genuine data exists, never fabricate or animate zero
  if (value === null || value === undefined || isNaN(value)) {
    return (
      <Text style={[{ fontFamily: FontFamily.monoBold }, style]}>
        {fallback}
      </Text>
    );
  }

  const [displayValue, setDisplayValue] = useState<number>(value);
  const prevValueRef = useRef<number>(value);
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<any>(null);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = value;

    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    let isCancelled = false;

    const startAnimation = () => {
      startTimeRef.current = Date.now();

      const step = () => {
        if (isCancelled) return;
        const now = Date.now();
        const elapsed = now - (startTimeRef.current || now);
        const progress = Math.min(1, elapsed / duration);
        const easedProgress = Motion.countUpEaseOut(progress);

        const current = startVal + (endVal - startVal) * easedProgress;
        setDisplayValue(current);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          setDisplayValue(endVal);
          prevValueRef.current = endVal;
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    };

    // Fast synchronous path on web
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setDisplayValue(endVal);
        prevValueRef.current = endVal;
        return;
      }
      startAnimation();
      return () => {
        isCancelled = true;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (isCancelled) return;
        if (reduced) {
          setDisplayValue(endVal);
          prevValueRef.current = endVal;
          return;
        }
        startAnimation();
      })
      .catch(() => {
        if (!isCancelled) startAnimation();
      });

    return () => {
      isCancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [value, duration]);

  const formattedNumber = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toString();

  return (
    <Text style={[{ fontFamily: FontFamily.monoBold }, style]}>
      {prefix}
      {formattedNumber}
      {suffix}
    </Text>
  );
};
