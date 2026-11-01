import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle2, Target, Sparkles } from 'lucide-react-native';
import { Spacing, BorderRadius } from '../constants/spacing';
import { Shadows } from '../constants/shadows';
import { useTheme } from '../context/ThemeContext';

const FOCUS_PRESETS = [15, 25, 45, 60]; // minutes

export default function FocusModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const { colors, isDark } = useTheme();

  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isActive && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsActive(false);
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, secondsRemaining]);

  const handleSelectPreset = (mins: number) => {
    if (isActive) return;
    setSelectedMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsCompleted(false);
  };

  const handleToggleTimer = () => {
    if (isCompleted) {
      setSecondsRemaining(selectedMinutes * 60);
      setIsCompleted(false);
      setIsActive(true);
      return;
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsCompleted(false);
    setSecondsRemaining(selectedMinutes * 60);
  };

  const handleEndEarly = () => {
    Alert.alert('End Focus Session', 'Are you sure you want to end this session early?', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'End Session',
        style: 'destructive',
        onPress: () => {
          handleReset();
          router.back();
        },
      },
    ]);
  };

  const minutesDisplay = String(Math.floor(secondsRemaining / 60)).padStart(2, '0');
  const secondsDisplay = String(secondsRemaining % 60).padStart(2, '0');
  const progressRatio = 1 - secondsRemaining / (selectedMinutes * 60);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.headerRow, { paddingTop: topPadding + 4 }]}>
        <TouchableOpacity
          style={[
            styles.circleBtn,
            Shadows.sm,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.darkText} strokeWidth={2.2} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.darkText }]}>Focus Mode</Text>

        <View style={{ width: 42 }} />
      </View>

      <View style={styles.contentWrap}>
        {/* Preset Selector */}
        <View style={styles.presetsWrap}>
          <Text style={[styles.presetsTitle, { color: colors.mutedText }]}>
            Session Duration
          </Text>
          <View style={styles.presetsRow}>
            {FOCUS_PRESETS.map((mins) => {
              const isSelected = selectedMinutes === mins;
              return (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.presetPill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.white,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleSelectPreset(mins)}
                  disabled={isActive}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.presetPillText,
                      { color: isSelected ? '#FFFFFF' : colors.darkText },
                    ]}
                  >
                    {mins}m
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Circular Display */}
        <View style={styles.timerCenterWrap}>
          <View
            style={[
              styles.timerRing,
              Shadows.lg,
              {
                backgroundColor: colors.white,
                borderColor: isCompleted ? '#6AAF7D' : colors.primary,
              },
            ]}
          >
            {isCompleted ? (
              <View style={styles.completionWrap}>
                <CheckCircle2 size={48} color="#6AAF7D" strokeWidth={2} />
                <Text style={[styles.completionTitle, { color: colors.darkText }]}>
                  Session Complete!
                </Text>
                <Text style={[styles.completionDesc, { color: colors.mutedText }]}>
                  Great job focusing for {selectedMinutes} minutes.
                </Text>
              </View>
            ) : (
              <>
                <Target size={26} color={colors.primary} strokeWidth={1.8} style={{ opacity: 0.7 }} />
                <Text style={[styles.digitsText, { color: colors.darkText }]}>
                  {minutesDisplay}:{secondsDisplay}
                </Text>
                <Text style={[styles.statusText, { color: colors.mutedText }]}>
                  {isActive ? 'Deep Focus Session' : 'Paused'}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.smallControlBtn, { borderColor: colors.border, backgroundColor: colors.white }]}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <RotateCcw size={18} color={colors.mutedText} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mainActionBtn,
              Shadows.md,
              { backgroundColor: colors.primary },
            ]}
            onPress={handleToggleTimer}
            activeOpacity={0.85}
          >
            {isActive ? (
              <Pause size={24} color="#FFFFFF" strokeWidth={2.4} />
            ) : (
              <Play size={24} color="#FFFFFF" strokeWidth={2.4} style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallControlBtn, { borderColor: colors.border, backgroundColor: colors.white }]}
            onPress={handleEndEarly}
            activeOpacity={0.7}
          >
            <Text style={[styles.endText, { color: colors.mutedText }]}>End</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  presetsWrap: {
    alignItems: 'center',
    gap: 10,
  },
  presetsTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  presetPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timerCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerRing: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  digitsText: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  completionWrap: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  completionDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: Spacing.xl,
  },
  smallControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  mainActionBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
