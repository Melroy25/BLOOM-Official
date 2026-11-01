import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  BackHandler,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Gamepad2, Sparkles, Search, Brain } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { FloatingParticles } from '../../components/heal-zone/FloatingParticles';
import { GameHubCard } from '../../components/games/GameHubCard';

export default function GamesSelectionScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 20 : 24);

  const { width } = useWindowDimensions();
  const contentMaxWidth = Math.min(width - 32, 560);

  // Read previous page if passed, fallback to /heal-zone
  const params = useLocalSearchParams<{ from?: string }>();
  const parentPage = params.from || '/heal-zone';

  // Navigate to GAME 1: Word Detective
  const handleOpenWordDetective = () => {
    router.push({
      pathname: '/games/word-detective/choose',
      params: { from: parentPage },
    });
  };

  // Navigate to GAME 2: Memory Match
  const handleOpenMemoryMatch = () => {
    router.push({
      pathname: '/games/choose',
      params: { from: parentPage },
    });
  };

  // Back button MUST always return to the parent page (e.g. Heal Zone),
  // NEVER pop back into any games child screen
  const handleBack = useCallback(() => {
    router.replace(parentPage as any);
  }, [parentPage]);

  // Handle hardware back press on Android
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => backHandler.remove();
  }, [handleBack]);

  return (
    <View style={styles.screen}>
      {/* Calm ambient floating particles in the background */}
      <FloatingParticles />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerTopRow}>
          {/* Back button returning to Heal Zone */}
          <TouchableOpacity
            style={[styles.headerIconBtn, Shadows.sm]}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back to Heal Zone"
          >
            <ChevronLeft size={24} color={Colors.darkText} strokeWidth={2.4} />
          </TouchableOpacity>

          {/* Subdued category pill */}
          <View style={styles.headerCategoryPill}>
            <Gamepad2 size={13} color="#5A4E80" strokeWidth={2.2} />
            <Text style={styles.headerCategoryText}>MINDFUL REFRESH</Text>
          </View>

          {/* Decorative right icon to balance header */}
          <View style={[styles.headerIconBtn, styles.headerRightDeco]}>
            <Sparkles size={18} color="#B5A5DB" strokeWidth={2} />
          </View>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.headerTextContainer}>
          <Text style={styles.pageTitle}>Games</Text>
          <Text style={styles.pageSubtitle}>
            Take a little break for your mind.
          </Text>
        </View>
      </View>

      {/* MAIN CONTENT AREA */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.cardsContainer, { maxWidth: contentMaxWidth }]}>
          {/* GAME 1: WORD DETECTIVE */}
          <GameHubCard
            title="Word Detective"
            emoji="🔍"
            badgeText="MYSTERY & CLUES"
            badgeIcon={<Search size={12} color="#5A4E80" strokeWidth={2.4} />}
            badgeColor="#5A4E80"
            badgeBg="#F4EFFB"
            description="A little hint, a mystery word and a fun challenge for your mind!"
            illustrationType="word-detective"
            tags={['8 Categories', 'Progressive Hints', '3 Difficulties']}
            buttonText="Play Game"
            onPress={handleOpenWordDetective}
          />

          {/* GAME 2: MEMORY MATCH */}
          <GameHubCard
            title="Memory Match"
            emoji="🧠"
            badgeText="FOCUS & HARMONY"
            badgeIcon={<Brain size={12} color="#365B45" strokeWidth={2.4} />}
            badgeColor="#365B45"
            badgeBg="#E8F1E8"
            description="Find matching pairs and test your memory at your own pace."
            illustrationType="memory-match"
            tags={['8 Categories', 'Card Matching', '3 Difficulties']}
            buttonText="Play Game"
            onPress={handleOpenMemoryMatch}
          />
        </View>

        {/* Bottom subtle calm tip */}
        <View style={styles.bottomFootnote}>
          <Text style={styles.bottomFootnoteText}>
            No stressful timers or penalties. Just simple, relaxing moments of focus.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(234, 229, 244, 0.65)',
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(181, 165, 219, 0.4)',
  },
  headerCategoryText: {
    ...Typography.label,
    fontSize: 10.5,
    color: '#5A4E80',
    letterSpacing: 0.8,
  },
  headerRightDeco: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  headerTextContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },
  pageTitle: {
    ...Typography.h1,
    fontSize: 28,
    color: Colors.darkText,
    marginBottom: 4,
  },
  pageSubtitle: {
    ...Typography.subtitle,
    fontSize: 15,
    color: Colors.mutedText,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  cardsContainer: {
    width: '100%',
    gap: 20,
  },
  bottomFootnote: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  bottomFootnoteText: {
    ...Typography.caption,
    fontSize: 12.5,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
