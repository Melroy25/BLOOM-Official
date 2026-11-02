import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wind, Sparkles, BookOpen, Target, ArrowRight } from 'lucide-react-native';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { FontFamily } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';

interface QuickAccessSectionProps {
  onOpenHealBubble: () => void;
  onOpenAI: () => void;
  onOpenJournal: () => void;
  onOpenFocusMode: () => void;
}

export const QuickAccessSection: React.FC<QuickAccessSectionProps> = ({
  onOpenHealBubble,
  onOpenAI,
  onOpenJournal,
  onOpenFocusMode,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerWrap}>
        <Text style={[styles.sectionTitle, { color: colors.darkText }]}>Quick Access</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
          Your everyday tools, just a tap away.
        </Text>
      </View>

      {/* 2-Column Grid */}
      <View style={styles.grid}>
        {/* TILE 1: Heal Bubble */}
        <TouchableOpacity
          style={[
            styles.tileCard,
            Shadows.sm,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
          onPress={onOpenHealBubble}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Open Heal Bubble"
        >
          <View style={styles.topRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accentSoft }]}>
              <Wind size={20} color={colors.accent} strokeWidth={2} />
            </View>
            <ArrowRight size={14} color={colors.accent} strokeWidth={2.2} />
          </View>

          <View style={styles.textWrap}>
            <Text style={[styles.tileTitle, { color: colors.darkText }]}>Heal Bubble</Text>
            <Text style={[styles.tileDescription, { color: colors.mutedText }]} numberOfLines={2}>
              Breathe, relax and find your calm.
            </Text>
          </View>
        </TouchableOpacity>

        {/* TILE 2: Talk to BLOOM */}
        <TouchableOpacity
          style={[
            styles.tileCard,
            Shadows.sm,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
          onPress={onOpenAI}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Open AI companion"
        >
          <View style={styles.topRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#EAE5F4' }]}>
              <Sparkles size={20} color="#5A4A7A" strokeWidth={2} />
            </View>
            <ArrowRight size={14} color="#8A7B9B" strokeWidth={2.2} />
          </View>

          <View style={styles.textWrap}>
            <Text style={[styles.tileTitle, { color: colors.darkText }]}>Talk to BLOOM</Text>
            <Text style={[styles.tileDescription, { color: colors.mutedText }]} numberOfLines={2}>
              Your AI companion is here to listen.
            </Text>
          </View>
        </TouchableOpacity>

        {/* TILE 3: Write Journal */}
        <TouchableOpacity
          style={[
            styles.tileCard,
            Shadows.sm,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
          onPress={onOpenJournal}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Open journal"
        >
          <View style={styles.topRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#F7E5DA' }]}>
              <BookOpen size={20} color="#7A4C32" strokeWidth={2} />
            </View>
            <ArrowRight size={14} color="#A07255" strokeWidth={2.2} />
          </View>

          <View style={styles.textWrap}>
            <Text style={[styles.tileTitle, { color: colors.darkText }]}>Write Journal</Text>
            <Text style={[styles.tileDescription, { color: colors.mutedText }]} numberOfLines={2}>
              Write down your thoughts and feelings.
            </Text>
          </View>
        </TouchableOpacity>

        {/* TILE 4: Focus Mode */}
        <TouchableOpacity
          style={[
            styles.tileCard,
            Shadows.sm,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
          onPress={onOpenFocusMode}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Open focus mode"
        >
          <View style={styles.topRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0EAF5' }]}>
              <Target size={20} color="#2D5B7B" strokeWidth={2} />
            </View>
            <ArrowRight size={14} color="#5B87A8" strokeWidth={2.2} />
          </View>

          <View style={styles.textWrap}>
            <Text style={[styles.tileTitle, { color: colors.darkText }]}>Focus Mode</Text>
            <Text style={[styles.tileDescription, { color: colors.mutedText }]} numberOfLines={2}>
              Stay focused on what matters.
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  headerWrap: {
    marginBottom: Spacing.md,
    gap: 2,
  },
  sectionTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 13,
    fontWeight: '400',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  tileCard: {
    width: '48%',
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1,
    minHeight: 128,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    gap: 3,
    marginTop: 8,
  },
  tileTitle: {
    fontFamily: FontFamily.sansBold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tileDescription: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 11,
    lineHeight: 15,
  },
});
