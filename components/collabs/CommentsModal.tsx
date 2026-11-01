import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  PanResponder,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Send,
  MessageCircle,
  Heart,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { CommunityPost, PostComment, UserProfile } from '../../types/collabs';

interface CommentsModalProps {
  visible: boolean;
  post: CommunityPost | null;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
  currentUser?: UserProfile;
}

const QUICK_EMOJIS = ['❤️', '🙌', '✨', '🌱', '👏', '🔥', '🍵', '💯'];

export const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  post,
  onClose,
  onAddComment,
  currentUser,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);
  const SCREEN_HEIGHT = Dimensions.get('window').height;

  // Instagram-Style Height: Default spacious (74%), Expandable to (94%)
  const COLLAPSED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.74);
  const EXPANDED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.94);

  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});

  const sheetHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const isExpandedRef = useRef(isExpanded);
  isExpandedRef.current = isExpanded;

  // Reset state when opening/closing
  useEffect(() => {
    if (visible) {
      setIsExpanded(false);
      sheetHeight.setValue(COLLAPSED_HEIGHT);
      setCommentText('');
    }
  }, [visible]);

  // PanResponder on drag handle bar (Instagram-style drag up to expand, drag down to collapse/dismiss)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderMove: (_, gesture) => {
        const base = isExpandedRef.current ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
        const target = base - gesture.dy;
        if (target >= SCREEN_HEIGHT * 0.45 && target <= SCREEN_HEIGHT * 0.96) {
          sheetHeight.setValue(target);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -40) {
          // Dragged UP -> Expand to top
          setIsExpanded(true);
          Animated.spring(sheetHeight, {
            toValue: EXPANDED_HEIGHT,
            useNativeDriver: false,
            bounciness: 4,
          }).start();
        } else if (gesture.dy > 100 && !isExpandedRef.current) {
          // Dragged DOWN from normal -> Dismiss
          onClose();
        } else if (gesture.dy > 40 && isExpandedRef.current) {
          // Dragged DOWN from expanded -> Collapse to default
          setIsExpanded(false);
          Animated.spring(sheetHeight, {
            toValue: COLLAPSED_HEIGHT,
            useNativeDriver: false,
            bounciness: 4,
          }).start();
        } else {
          // Snap back to current state
          Animated.spring(sheetHeight, {
            toValue: isExpandedRef.current ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const toggleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    Animated.spring(sheetHeight, {
      toValue: next ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
      useNativeDriver: false,
      bounciness: 4,
    }).start();
  };

  if (!post) return null;

  const handleSend = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    onAddComment(post.id, trimmed);
    setCommentText('');
  };

  const handleEmojiPress = (emoji: string) => {
    setCommentText(prev => prev + emoji);
  };

  const handleToggleLikeComment = (commentId: string) => {
    setLikedCommentIds(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        {/* Backdrop Tap to Close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.dismissArea} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          {/* Animated Sheet Container with Dynamic Drag Height */}
          <Animated.View style={[styles.sheetContainer, { height: sheetHeight }, Shadows.lg]}>
            {/* Top Drag Handle Header (PanResponder Enabled) */}
            <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
              <View style={styles.handleBar} />

              <View style={styles.headerRow}>
                {/* Left: Expand / Collapse Toggle Button */}
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={toggleExpand}
                  activeOpacity={0.7}
                  accessibilityLabel={isExpanded ? 'Collapse comments' : 'Expand comments'}
                >
                  {isExpanded ? (
                    <ChevronDown size={18} color="#365B45" strokeWidth={2.4} />
                  ) : (
                    <ChevronUp size={18} color="#365B45" strokeWidth={2.4} />
                  )}
                  <Text style={styles.expandBtnText}>
                    {isExpanded ? 'Collapse' : 'Drag up'}
                  </Text>
                </TouchableOpacity>

                {/* Center: Title & Count */}
                <View style={styles.headerTitleWrap}>
                  <Text style={styles.headerTitle}>Comments</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{post.comments.length}</Text>
                  </View>
                </View>

                {/* Right: Close Button */}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                  accessibilityLabel="Close comments"
                >
                  <X size={18} color="#141E19" strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Scrollable Comments & Post Content (Spacious flex: 1) */}
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollInner}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Instagram-Style Original Post Caption (Pinned at top) */}
              <View style={styles.postCaptionRow}>
                <View style={styles.avatarWrap}>
                  {post.userAvatar ? (
                    <Image source={{ uri: post.userAvatar }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>{post.userInitials}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.captionTextCol}>
                  <View style={styles.captionMetaRow}>
                    <Text style={styles.captionAuthor}>{post.userName}</Text>
                    <Text style={styles.captionTime}>• {post.timeAgo}</Text>
                    {post.category && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{post.category}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.captionBody}>{post.content}</Text>
                </View>
              </View>

              {/* Subtle Divider */}
              <View style={styles.sectionDivider} />

              {/* Comments Feed List */}
              {post.comments.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <MessageCircle size={28} color="#365B45" strokeWidth={1.8} />
                  </View>
                  <Text style={styles.emptyTitle}>No comments yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Be the first to share your mindful thoughts and support! 🌱✨
                  </Text>
                </View>
              ) : (
                post.comments.map(c => {
                  const isLiked = !!likedCommentIds[c.id];
                  const isPostAuthor = c.userName === post.userName;

                  return (
                    <View key={c.id} style={styles.commentRow}>
                      {/* Commenter Avatar */}
                      <View style={styles.commentAvatarWrap}>
                        {c.userAvatar ? (
                          <Image source={{ uri: c.userAvatar }} style={styles.avatarImg} />
                        ) : (
                          <View style={styles.commentAvatarFallback}>
                            <Text style={styles.commentAvatarInitials}>
                              {c.userInitials || c.userName.slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Comment Body & Meta */}
                      <View style={styles.commentContentCol}>
                        <View style={styles.commentMetaRow}>
                          <Text style={styles.commentAuthor}>{c.userName}</Text>
                          {isPostAuthor && (
                            <View style={styles.authorBadge}>
                              <Text style={styles.authorBadgeText}>Author</Text>
                            </View>
                          )}
                          <Text style={styles.commentTimestamp}>• {c.timestamp}</Text>
                        </View>

                        <Text style={styles.commentText}>{c.text}</Text>

                        {/* Reply Action */}
                        <View style={styles.commentFooterRow}>
                          <TouchableOpacity
                            onPress={() => setCommentText(`@${c.userName} `)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.replyActionText}>Reply</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Instagram-Style Comment Like Heart */}
                      <TouchableOpacity
                        style={styles.commentLikeBtn}
                        onPress={() => handleToggleLikeComment(c.id)}
                        activeOpacity={0.7}
                      >
                        <Heart
                          size={15}
                          color={isLiked ? '#FF3B30' : '#8A958F'}
                          fill={isLiked ? '#FF3B30' : 'transparent'}
                          strokeWidth={2}
                        />
                        {isLiked && <Text style={styles.commentLikeCount}>1</Text>}
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Quick Emojis Bar (Instagram Signature Feature) */}
            <View style={styles.quickEmojisBar}>
              {QUICK_EMOJIS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiTouch}
                  onPress={() => handleEmojiPress(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bottom Fixed Comment Input Bar */}
            <View style={[styles.bottomInputRow, { paddingBottom: bottomInset }]}>
              {/* Current User Mini Avatar */}
              <View style={styles.inputUserAvatar}>
                {currentUser?.avatar ? (
                  <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.inputAvatarInitials}>
                    {currentUser?.initials || 'MA'}
                  </Text>
                )}
              </View>

              {/* Text Input Field */}
              <View style={styles.textInputWrap}>
                <TextInput
                  style={styles.commentTextInput}
                  placeholder={`Add a comment for ${post.userName}...`}
                  placeholderTextColor="#7B857F"
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={300}
                />
              </View>

              {/* Instagram-Style Post / Send Button */}
              <TouchableOpacity
                style={[
                  styles.postSubmitBtn,
                  !commentText.trim() && styles.postSubmitBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!commentText.trim()}
                activeOpacity={0.8}
              >
                <Send
                  size={15}
                  color={commentText.trim() ? Colors.white : '#8A9A8F'}
                  strokeWidth={2.4}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 25, 0.55)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  keyboardWrap: {
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },

  // Drag Handle Header
  dragHandleContainer: {
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5F1',
    backgroundColor: Colors.white,
  },
  handleBar: {
    width: 46,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D4DDD6',
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F1E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
  },
  expandBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#141E19',
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: '#E8F1E8',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#365B45',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll Content Area
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  // Instagram-Style Original Post Caption Row
  postCaptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: Spacing.sm,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F1E8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C8DEC9',
  },
  avatarFallbackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#365B45',
  },
  captionTextCol: {
    flex: 1,
  },
  captionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  captionAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#141E19',
  },
  captionTime: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  categoryBadge: {
    backgroundColor: '#E8F1E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#365B45',
  },
  captionBody: {
    fontSize: 14,
    color: '#29332E',
    lineHeight: 21,
  },

  // Section Divider
  sectionDivider: {
    height: 1,
    backgroundColor: '#F0F5F1',
    marginVertical: Spacing.md,
  },

  // Empty Comments State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: 8,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#141E19',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.mutedText,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: Spacing.xl,
  },

  // Comment Item Row
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  commentAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F1E8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2EFE4',
  },
  commentAvatarInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: '#365B45',
  },
  commentContentCol: {
    flex: 1,
    gap: 3,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#141E19',
  },
  authorBadge: {
    backgroundColor: '#DCE8DE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  authorBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#365B45',
  },
  commentTimestamp: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  commentText: {
    fontSize: 13,
    color: '#29332E',
    lineHeight: 19,
  },
  commentFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  replyActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7B857F',
  },

  // Like Heart on Comment
  commentLikeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 2,
  },
  commentLikeCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF3B30',
  },

  // Quick Reaction Emojis Bar
  quickEmojisBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    backgroundColor: '#FBFDFB',
    borderTopWidth: 1,
    borderTopColor: '#F0F5F1',
  },
  emojiTouch: {
    padding: 4,
  },
  emojiText: {
    fontSize: 20,
  },

  // Bottom Input Row
  bottomInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F5F1',
    gap: 10,
  },
  inputUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#C8DEC9',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputAvatarInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: '#365B45',
  },
  textInputWrap: {
    flex: 1,
    backgroundColor: '#F4F7F5',
    borderRadius: BorderRadius.round,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderWidth: 1,
    borderColor: '#E2ECE4',
  },
  commentTextInput: {
    fontSize: 13,
    color: '#141E19',
    maxHeight: 70,
  },
  postSubmitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#365B45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postSubmitBtnDisabled: {
    backgroundColor: '#E2E8E4',
  },
});

export default CommentsModal;
