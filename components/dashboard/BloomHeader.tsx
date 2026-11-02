import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings } from 'lucide-react-native';
import { Spacing } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { FontFamily } from '../../constants/typography';
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
      {/* Top Row: 3D Leaf Mascot + "Bloom" Brand Title + Subtitle & Settings Button */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          {/* 3D Leaf Mascot Badge */}
          <View
            style={[
              styles.mascotBadge,
              Shadows.sm,
              { backgroundColor: colors.white, borderColor: colors.border },
            ]}
          >
            <Image
              source={require('../../assets/images/bloom-mascot-hd.png')}
              style={styles.mascotImg}
              resizeMode="contain"
            />
          </View>

          <View style={styles.brandTextWrap}>
            <Text style={[styles.brandTitle, { color: colors.darkText }]}>Bloom</Text>
            <Text style={[styles.brandSubtitle, { color: colors.mutedText }]}>
              Your everyday companion for mental growth
            </Text>
          </View>
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
        <Text style={[styles.motivationalText, { color: colors.mutedText }]}>
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
    marginBottom: Spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 10,
  },
  mascotBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  mascotImg: {
    width: 34,
    height: 34,
  },
  brandTextWrap: {
    flex: 1,
  },
  brandTitle: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 1,
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
    gap: 2,
    marginTop: 4,
  },
  greetingText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  motivationalText: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 13.5,
    fontWeight: '400',
    lineHeight: 19,
  },
});
