import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import {
  Heart,
  MessageCircle,
  Share2,
  Lock,
  MoreVertical,
  Trash2,
  Flag,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { Shadows } from '../../../constants/shadows';
import { CommunityPost } from '../../../types/collabs';

interface PostsTabProps {
  posts: CommunityPost[];
  onOpenCreatePost: () => void;
  onToggleLike: (postId: string) => void;
  onToggleBookmark?: (postId: string) => void;
  onOpenComments: (post: CommunityPost) => void;
  onSharePost?: (post: CommunityPost) => void;
  currentUserInitials?: string;
  currentUserId?: string;
  onDeletePost?: (postId: string) => void;
  onReportPost?: (postId: string, reason?: string) => void;
}

export const PostsTab: React.FC<PostsTabProps> = ({
  posts,
  onOpenCreatePost,
  onToggleLike,
  onOpenComments,
  onSharePost,
  currentUserInitials = 'BM',
  currentUserId,
  onDeletePost,
  onReportPost,
}) => {
  const handlePostMenu = (post: CommunityPost) => {
    const isOwner = currentUserId && (post.userId === currentUserId || (post as any).authorUid === currentUserId);

    if (Platform.OS === 'web') {
      if (isOwner) {
        if (window.confirm('Delete Reflection?\nAre you sure you want to delete this reflection?')) {
          onDeletePost?.(post.id);
        }
      } else {
        const reason = window.prompt('Report Reflection\nPlease state the reason for reporting this post:');
        if (reason && reason.trim()) {
          onReportPost?.(post.id, reason.trim());
        }
      }
      return;
    }

    if (isOwner) {
      Alert.alert(
        'Delete Reflection',
        'Are you sure you want to delete this reflection? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDeletePost?.(post.id),
          },
        ]
      );
    } else {
      Alert.alert(
        'Report Reflection',
        'Would you like to report this post for inappropriate content or community guideline violations?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Report Post',
            style: 'destructive',
            onPress: () => onReportPost?.(post.id, 'Inappropriate or harmful content'),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Social Feed List */}
      <View style={styles.feedList}>
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Sparkles size={28} color="#365B45" strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>No community reflections yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to share your mindful wins, study reflections, and healthy habits with the Bloom Sanctuary! 🌱
            </Text>
            <TouchableOpacity
              style={styles.emptyCreateBtn}
              onPress={onOpenCreatePost}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyCreateBtnText}>Share a Reflection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map(post => {
            const isOwner = currentUserId && (post.userId === currentUserId || (post as any).authorUid === currentUserId);

            return (
              <View key={post.id} style={styles.postCard}>
                {/* Header: Avatar, Username, Timestamp, Actions */}
                <View style={styles.postHeader}>
                  <View style={styles.authorRow}>
                    <View style={styles.authorAvatar}>
                      {post.userAvatar ? (
                        <Image
                          source={{ uri: post.userAvatar }}
                          style={styles.avatarImg}
                        />
                      ) : (
                        <Text style={styles.authorAvatarText}>
                          {post.userInitials || (post.userName ? post.userName.slice(0, 2).toUpperCase() : 'BM')}
                        </Text>
                      )}
                    </View>
                    <View>
                      <Text style={styles.authorName}>{post.userName}</Text>
                      <Text style={styles.authorHandle}>
                        {post.userHandle} • {post.timeAgo}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.headerRightWrap}>
                    <View style={styles.badgeGroup}>
                      {post.isPrivate && (
                        <View style={styles.privatePill}>
                          <Lock size={10} color="#8E583A" strokeWidth={2.4} />
                          <Text style={styles.privatePillText}>Private</Text>
                        </View>
                      )}
                      {post.category ? (
                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryPillText}>{post.category}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* 3-Dots Post Action Menu */}
                    <TouchableOpacity
                      style={styles.postMenuBtn}
                      onPress={() => handlePostMenu(post)}
                      activeOpacity={0.7}
                      accessibilityLabel="Post options"
                    >
                      <MoreVertical size={16} color={Colors.mutedText} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Text Body */}
                <Text style={styles.postText}>{post.content}</Text>

                {/* Optional Image */}
                {post.growthCard?.imageUrl ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: post.growthCard.imageUrl }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                    {post.growthCard.badgeLabel ? (
                      <View style={styles.imageCaptionBar}>
                        <Text style={styles.imageCaptionText}>
                          {post.growthCard.badgeLabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : post.image ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: post.image }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}

                {/* Actions Footer: Like, Comment, Share */}
                <View style={styles.postActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => onToggleLike(post.id)}
                    activeOpacity={0.7}
                  >
                    <Heart
                      size={18}
                      color={post.isLiked ? '#D98B8B' : Colors.mutedText}
                      fill={post.isLiked ? '#D98B8B' : 'transparent'}
                    />
                    {post.likesVisible !== false ? (
                      <Text
                        style={[
                          styles.actionText,
                          post.isLiked && styles.actionTextLiked,
                        ]}
                      >
                        {post.likesCount}
                      </Text>
                    ) : null}
                  </TouchableOpacity>

                  {post.commentsEnabled !== false ? (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => onOpenComments(post)}
                      activeOpacity={0.7}
                    >
                      <MessageCircle size={18} color={Colors.mutedText} />
                      <Text style={styles.actionText}>
                        {post.commentsCount}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.actionBtnDisabled}>
                      <MessageCircle size={18} color="#C5D0C9" />
                      <Text style={styles.actionTextDisabled}>Off</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.actionIconOnly}
                    onPress={() => onSharePost?.(post)}
                    activeOpacity={0.7}
                  >
                    <Share2 size={16} color={Colors.mutedText} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  feedList: {
    gap: 12,
  },
  emptyContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE9',
    gap: 10,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#141E19',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyCreateBtn: {
    marginTop: 10,
    backgroundColor: '#365B45',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.round,
  },
  emptyCreateBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  postCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    padding: Spacing.md,
    gap: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F1E8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  authorAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#365B45',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#141E19',
  },
  authorHandle: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  headerRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDF1E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  privatePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E583A',
  },
  categoryPill: {
    backgroundColor: '#E8F1E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#365B45',
  },
  postMenuBtn: {
    padding: 4,
    marginLeft: 2,
  },
  postText: {
    fontSize: 14,
    color: '#29332E',
    lineHeight: 20,
  },
  imageContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#E8ECE9',
  },
  postImage: {
    width: '100%',
    height: 180,
  },
  imageCaptionBar: {
    backgroundColor: '#E8F1E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  imageCaptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#365B45',
  },
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F1',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionBtnDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    opacity: 0.6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  actionTextLiked: {
    color: '#D98B8B',
  },
  actionTextDisabled: {
    fontSize: 12,
    color: '#8E9993',
    fontWeight: '500',
  },
  actionIconOnly: {
    marginLeft: 'auto',
    padding: 2,
  },
});
