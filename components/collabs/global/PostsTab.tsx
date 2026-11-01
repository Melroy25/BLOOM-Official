import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Heart,
  MessageCircle,
  Share2,
  Lock,
} from 'lucide-react-native';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/spacing';
import { CommunityPost } from '../../../types/collabs';

interface PostsTabProps {
  posts: CommunityPost[];
  onOpenCreatePost: () => void;
  onToggleLike: (postId: string) => void;
  onToggleBookmark?: (postId: string) => void;
  onOpenComments: (post: CommunityPost) => void;
  onSharePost?: (post: CommunityPost) => void;
  currentUserInitials?: string;
}

export const PostsTab: React.FC<PostsTabProps> = ({
  posts,
  onOpenCreatePost,
  onToggleLike,
  onOpenComments,
  onSharePost,
  currentUserInitials = 'MA',
}) => {
  return (
    <View style={styles.container}>
      {/* Social Feed List */}
      <View style={styles.feedList}>
        {posts.map(post => {
          return (
            <View key={post.id} style={styles.postCard}>
              {/* Header: Avatar, Username, Timestamp */}
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
                        {post.userInitials}
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
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  // Create Post Bar
  createPostBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    gap: 10,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#365B45',
  },
  createPostPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: Colors.mutedText,
  },
  // Feed List
  feedList: {
    gap: 12,
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
