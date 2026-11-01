import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Share2, Sparkles } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { CommunityPost } from '../../types/collabs';
import { ProfileAvatar } from '../common/ProfileAvatar';

interface CommunityPostCardProps {
  post: CommunityPost;
  onLike: (postId: string) => void;
  onCommentPress: (post: CommunityPost) => void;
  onSharePress: (post: CommunityPost) => void;
  onUserPress: (userId: string) => void;
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({
  post,
  onLike,
  onCommentPress,
  onSharePress,
  onUserPress,
}) => {
  return (
    <View style={[styles.card, Shadows.sm]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => onUserPress(post.userId)}
          activeOpacity={0.7}
        >
          <ProfileAvatar name={post.userName} size={40} />
          <View style={styles.nameContainer}>
            <View style={styles.nameWithBadge}>
              <Text style={styles.userName}>{post.userName}</Text>
            </View>
            <View style={styles.handleTimeRow}>
              <Text style={styles.userHandle}>{post.userHandle}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.timeAgo}>{post.timeAgo}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Category Pill */}
        <View style={styles.categoryBadge}>
          <Sparkles size={10} color={Colors.primaryDark} strokeWidth={2} />
          <Text style={styles.categoryText}>{post.category}</Text>
        </View>
      </View>

      {/* Post Text */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Optional Gradient Media Card */}
      {post.gradientColors && (
        <LinearGradient
          colors={post.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mediaPlaceholder}
        >
          <Sparkles size={20} color={Colors.primary} strokeWidth={1.5} />
          <Text style={styles.mediaTag}>🌱 Bloom Growth Moment</Text>
        </LinearGradient>
      )}

      {/* Action Row */}
      <View style={styles.actionsRow}>
        {/* Like Button */}
        <TouchableOpacity
          style={[styles.actionBtn, post.isLiked && styles.likedBtn]}
          onPress={() => onLike(post.id)}
          activeOpacity={0.7}
        >
          <Heart
            size={18}
            color={post.isLiked ? Colors.error : Colors.mutedText}
            fill={post.isLiked ? Colors.error : 'none'}
            strokeWidth={1.8}
          />
          <Text style={[styles.actionCount, post.isLiked && styles.likedText]}>
            {post.likesCount}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onCommentPress(post)}
          activeOpacity={0.7}
        >
          <MessageCircle size={18} color={Colors.mutedText} strokeWidth={1.8} />
          <Text style={styles.actionCount}>{post.commentsCount}</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onSharePress(post)}
          activeOpacity={0.7}
        >
          <Share2 size={17} color={Colors.mutedText} strokeWidth={1.8} />
          <Text style={styles.actionCount}>{post.sharesCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 15,
    color: Colors.darkText,
  },
  handleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userHandle: {
    ...Typography.caption,
    color: Colors.mutedText,
    fontSize: 12,
  },
  dot: {
    fontSize: 10,
    color: Colors.lightText,
    marginHorizontal: 4,
  },
  timeAgo: {
    ...Typography.caption,
    color: Colors.lightText,
    fontSize: 11,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightSage,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    gap: 4,
  },
  categoryText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  content: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.darkText,
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  mediaPlaceholder: {
    height: 72,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    flexDirection: 'row',
    gap: 8,
  },
  mediaTag: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 236, 233, 0.6)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  likedBtn: {
    opacity: 1,
  },
  actionCount: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 12,
    color: Colors.mutedText,
  },
  likedText: {
    color: Colors.error,
  },
});
