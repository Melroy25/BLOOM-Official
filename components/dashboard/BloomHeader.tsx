import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings } from 'lucide-react-native';
import { Spacing } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { useTheme } from '../../context/ThemeContext';

interface BloomHeaderProps {
  userName: string;
  onSettingsPress?: () => void;
  greeting?: string;
  subtitle?: string;
}

const MOTIVATIONAL_MESSAGES = [
  'Every small step counts. Keep growing.',
  'Take a breath. You are doing better than you think.',
  'Focus on progress, not perfection.',
  'One day at a time.',
];

export const BloomHeader: React.FC<BloomHeaderProps> = ({
  userName,
  onSettingsPress,
  greeting: customGreeting,
  subtitle: customSubtitle,
}) => {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const { colors } = useTheme();

  // Dynamic Time-Based Greeting
  const greeting = useMemo(() => {
    if (customGreeting) return customGreeting;
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [customGreeting]);

  // Motivational message selection (deterministic for the day)
  const motivationalMessage = useMemo(() => {
    if (customSubtitle) return customSubtitle;
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const index = Math.abs(dayOfYear) % MOTIVATIONAL_MESSAGES.length;
    return MOTIVATIONAL_MESSAGES[index];
  }, [customSubtitle]);

  // Clean first name or display name without emojis
  const cleanName = useMemo(() => {
    const raw = (userName || 'Friend').trim();
    // Remove any trailing or embedded emojis
    return raw.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim() || 'Friend';
  }, [userName]);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Top Row: Wordmark & Settings Button */}
      <View style={styles.topRow}>
        <View style={styles.logoWrap}>
          <Text style={[styles.logoText, { color: colors.primaryDark }]}>BLOOM</Text>
        </View>

        {onSettingsPress && (
          <TouchableOpacity
            style={[
              styles.settingsBtn,
              Shadows.sm,
              { backgroundColor: colors.white, borderColor: colors.border },
            ]}
            onPress={onSettingsPress}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Open Settings"
          >
            <Settings size={20} color={colors.primaryDark} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Greeting Section */}
      <View style={styles.greetingWrap}>
        <Text style={[styles.greetingText, { color: colors.darkText }]}>
          {greeting}, {cleanName}
        </Text>
        <Text style={[styles.subtitleText, { color: colors.mutedText }]}>
          {motivationalMessage}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 3,
  },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  greetingWrap: {
    gap: 4,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
});
