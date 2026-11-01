import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Pause, RotateCcw, VolumeX, Sparkles } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface StudySprintCardProps {
  topic?: string;
  initialMinutes?: number;
}

export function StudySprintCard({ topic = 'Focus Sprint', initialMinutes = 20 }: StudySprintCardProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60 - 18); // start slightly into sprint like in mockup
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (secondsRemaining === 0) {
      setIsActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining]);

  const toggleTimer = () => {
    setIsActive((prev) => !prev);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsRemaining(initialMinutes * 60);
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const totalSeconds = initialMinutes * 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - secondsRemaining) / totalSeconds) * 100));

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.topicBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.topicText} numberOfLines={1}>
            {topic}
          </Text>
        </View>
        <Text style={styles.untilText}>20-min sprint</Text>
      </View>

      {/* Countdown and Controls */}
      <View style={styles.timerRow}>
        <View style={styles.timeDisplay}>
          <Text style={styles.countdown}>{timeFormatted}</Text>
          <Text style={styles.remainingLabel}>remaining</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.primaryControlButton}
            onPress={toggleTimer}
            activeOpacity={0.8}
            accessibilityLabel={isActive ? 'Pause timer' : 'Start timer'}
          >
            {isActive ? (
              <Pause size={16} color={Colors.white} strokeWidth={2.2} />
            ) : (
              <Play size={16} color={Colors.white} strokeWidth={2.2} style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryControlButton}
            onPress={resetTimer}
            activeOpacity={0.8}
            accessibilityLabel="Reset timer"
          >
            <RotateCcw size={14} color={Colors.darkText} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={styles.supportMode}>
          <VolumeX size={13} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.supportModeText}>Silent support mode</Text>
        </View>
        <View style={styles.focusPill}>
          <Sparkles size={11} color={Colors.primaryDark} strokeWidth={2} />
          <Text style={styles.focusPillText}>Breathe & focus</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F3F9F4',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(91, 142, 125, 0.15)',
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  topicText: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontSize: 13,
  },
  untilText: {
    ...Typography.caption,
    color: Colors.mutedText,
    fontSize: 11,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  countdown: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.darkText,
    letterSpacing: -0.5,
  },
  remainingLabel: {
    ...Typography.caption,
    color: Colors.mutedText,
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryControlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryControlButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E6EFE8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E1ECE3',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  supportMode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  supportModeText: {
    ...Typography.caption,
    color: Colors.mutedText,
    fontSize: 11,
  },
  focusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  focusPillText: {
    ...Typography.caption,
    color: Colors.primaryDark,
    fontWeight: '600',
    fontSize: 11,
  },
});
