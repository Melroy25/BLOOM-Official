import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import {
  Clock,
  Users,
  Check,
  Flame,
  Award,
  ArrowRight,
  TrendingUp,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { Challenge } from '../../types/collabs';

interface ChallengeCardProps {
  challenge: Challenge;
  onPress: (challenge: Challenge) => void;
  onJoinToggle?: (challengeId: string) => void;
  compact?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onPress,
  onJoinToggle,
  compact = false,
}) => {
  const isJoined = challenge.isJoined ?? false;
  const participantCount = challenge.participantsCount || 0;

  // Fallback image if coverImageUrl is missing
  const coverSource = challenge.coverImageUrl
    ? { uri: challenge.coverImageUrl }
    : {
        uri: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=70',
      };

  return (
    <TouchableOpacity
      style={[styles.card, Shadows.sm, compact && styles.compactCard]}
      onPress={() => onPress(challenge)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`View ${challenge.title} details`}
    >
      {/* 1. COMPACT LANDSCAPE COVER IMAGE (Aspect ratio ~16:5, Height 86px) */}
      <View style={styles.imageContainer}>
        <Image
          source={coverSource}
          style={styles.coverImage}
          resizeMode="cover"
        />

        {/* Floating Category & Badges on Image */}
        <View style={styles.imageBadgeOverlay}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {challenge.category}
            </Text>
          </View>

          {challenge.isTrending ? (
            <View style={styles.trendingBadge}>
              <Flame size={11} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.trendingBadgeText}>Trending</Text>
            </View>
          ) : challenge.isPopular ? (
            <View style={[styles.trendingBadge, { backgroundColor: '#365B45' }]}>
              <Award size={11} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.trendingBadgeText}>Popular</Text>
            </View>
          ) : null}
        </View>

        {isJoined && (
          <View style={styles.joinedBadgeOnCover}>
            <Check size={11} color="#FFFFFF" strokeWidth={2.6} />
            <Text style={styles.joinedBadgeText}>Joined</Text>
          </View>
        )}
      </View>

      {/* 2. CARD CONTENT AREA */}
      <View style={styles.contentWrap}>
        {/* Title & Duration */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {challenge.title}
          </Text>
        </View>

        {/* Duration Subtitle: e.g. Fitness · 90 Days */}
        <Text style={styles.subMeta}>
          {challenge.category} · {challenge.duration || `${challenge.durationDays || 30} Days`}
        </Text>

        {/* Short Description */}
        <Text style={styles.description} numberOfLines={2}>
          {challenge.shortDescription || challenge.description}
        </Text>

        {/* Footer Meta Row: Participants & Action */}
        <View style={styles.footerRow}>
          <View style={styles.metaLeft}>
            <View style={styles.participantPill}>
              <Users size={12} color="#365B45" strokeWidth={2} />
              <Text style={styles.participantText}>
                {participantCount.toLocaleString()} participants
              </Text>
            </View>

            {challenge.creatorName && (
              <Text style={styles.creatorText} numberOfLines={1}>
                by {challenge.creatorName}
              </Text>
            )}
          </View>

          {/* Action CTA */}
          <View style={styles.ctaRow}>
            {isJoined ? (
              <View style={styles.joinedStatusBtn}>
                <Check size={12} color="#365B45" strokeWidth={2.4} />
                <Text style={styles.joinedStatusText}>Active</Text>
              </View>
            ) : (
              <View style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>View</Text>
                <ArrowRight size={13} color="#365B45" strokeWidth={2.2} />
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  compactCard: {
    width: Math.min(SCREEN_WIDTH * 0.78, 300),
    marginRight: Spacing.md,
    marginBottom: 0,
  },
  imageContainer: {
    width: '100%',
    height: 86, // Landscape 16:5 ratio for compact elegance
    backgroundColor: '#E8F1E8',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: BorderRadius.lg - 1,
    borderTopRightRadius: BorderRadius.lg - 1,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageBadgeOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#365B45',
    letterSpacing: 0.2,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E88B5D',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  trendingBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  joinedBadgeOnCover: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#365B45',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  joinedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contentWrap: {
    padding: Spacing.md,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#141E19',
    letterSpacing: -0.2,
  },
  subMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#789B83',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: Colors.mutedText,
    lineHeight: 16,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F1',
  },
  metaLeft: {
    flex: 1,
    gap: 2,
  },
  participantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#365B45',
  },
  creatorText: {
    fontSize: 10,
    color: Colors.mutedText,
  },
  ctaRow: {
    alignItems: 'flex-end',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F1E8',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
  },
  viewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },
  joinedStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D9EEE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  joinedStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },
});
