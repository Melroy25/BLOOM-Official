import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  TrendingUp,
  Sparkles,
  MessageCircle,
  ArrowUpRight,
  ArrowRight,
  Plus,
  MoreVertical,
  Eraser,
  Trash2,
  BellOff,
  Bell,
  Search,
  Info,
  Users,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import {
  Challenge,
  ChatMessage,
  CommunityPost,
  TrendingDiscussion,
} from '../../types/collabs';
import { TrendingTab } from './global/TrendingTab';
import { GlobalChatTab } from './global/GlobalChatTab';
import { PostsTab } from './global/PostsTab';

export type GlobalCircleView = 'landing' | 'trends' | 'posts' | 'chat';

interface GlobalCircleScreenProps {
  onBackToLanding: () => void;
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
  challenges: Challenge[];
  onToggleJoinChallenge: (id: string) => void;
  discussions: TrendingDiscussion[];
  onOpenDiscussionComments: (discussion: TrendingDiscussion) => void;
  chatMessages: ChatMessage[];
  onSendChatMessage: (
    text: string,
    media?: {
      image?: string;
      video?: string;
      fileDoc?: { name: string; size: string };
      audioNote?: { duration: string };
    }
  ) => void;
  onVotePoll?: (messageId: string, optionId: string) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  onCreatePoll?: (question: string, options: string[]) => void;
  onClearChat?: () => void;
  onDeleteMessageFromAll?: () => void;
  onDeleteSingleMessage?: (messageId: string) => void;
  posts: CommunityPost[];
  onOpenCreatePost: () => void;
  onToggleLikePost: (postId: string) => void;
  onToggleBookmarkPost?: (postId: string) => void;
  onOpenComments: (post: CommunityPost) => void;
  onSharePost?: (post: CommunityPost) => void;
  currentUserInitials?: string;
  onlineMembers?: any[];
}

// Reusable Botanical Bloom Logo Mark
const BloomLogoMark = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C12 2 8 8 8 13C8 16.5 10 19 12 21C14 19 16 16.5 16 13C16 8 12 2 12 2Z"
      stroke="#365B45"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.5 12C6.5 10.5 3 11 2 14C3.5 16.5 6.5 17 9 15.5"
      stroke="#365B45"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15.5 12C17.5 10.5 21 11 22 14C20.5 16.5 17.5 17 15 15.5"
      stroke="#365B45"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const GlobalCircleScreen: React.FC<GlobalCircleScreenProps> = ({
  onBackToLanding,
  challenges,
  onToggleJoinChallenge,
  discussions,
  onOpenDiscussionComments,
  chatMessages,
  onSendChatMessage,
  onVotePoll,
  onReactMessage,
  onCreatePoll,
  onClearChat,
  onDeleteMessageFromAll,
  onDeleteSingleMessage,
  posts,
  onOpenCreatePost,
  onToggleLikePost,
  onToggleBookmarkPost,
  onOpenComments,
  onSharePost,
  currentUserInitials = 'MA',
  onlineMembers = [],
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);
  const [currentView, setCurrentView] = useState<GlobalCircleView>('landing');

  // WhatsApp-style Chat Menu & Action States
  const [chatMenuVisible, setChatMenuVisible] = useState(false);
  const [isChatMuted, setIsChatMuted] = useState(false);
  const [clearChatConfirmVisible, setClearChatConfirmVisible] = useState(false);
  const [deleteAllConfirmVisible, setDeleteAllConfirmVisible] = useState(false);
  const [chatInfoVisible, setChatInfoVisible] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Handle header back button
  const handleBack = () => {
    if (currentView !== 'landing') {
      setCurrentView('landing');
    } else {
      onBackToLanding();
    }
  };

  // Header Title based on active view
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'trends':
        return 'Global Trends';
      case 'posts':
        return 'Global Posts';
      case 'chat':
        return 'Global Chat';
      default:
        return 'Global Circle';
    }
  };

  // Subtitle based on active view
  const getHeaderSubtitle = () => {
    switch (currentView) {
      case 'trends':
        return 'Discover. Challenge. Grow together.';
      case 'posts':
        return 'Student reflections';
      case 'chat':
        const liveCount = onlineMembers.length;
        if (isChatMuted) return 'Notifications muted 🔕';
        if (liveCount === 0) return '0 members online ⚪';
        if (liveCount === 1) return '1 member online 🟢';
        return `${liveCount} members online 🟢`;
      default:
        return 'Community & trending';
    }
  };

  return (
    <View style={styles.container}>
      {/* Floating Header Bar (Seamless on light sage background, matches Bloom Circle Landing) */}
      <View style={[styles.headerRow, { paddingTop: topInset + 4 }]}>
        <TouchableOpacity
          style={[styles.headerCircleBtn, Shadows.sm]}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityLabel={
            currentView === 'landing' ? 'Back to Bloom Circle' : 'Back to Global Circle Hub'
          }
        >
          <ArrowLeft size={20} color="#141E19" strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
          <Text style={styles.headerSubtitle}>{getHeaderSubtitle()}</Text>
        </View>

        {currentView === 'trends' ? (
          <TouchableOpacity
            style={[styles.headerCircleBtn, Shadows.sm]}
            onPress={() => router.push('/challenge/create' as any)}
            activeOpacity={0.7}
            accessibilityLabel="Create Challenge"
          >
            <Plus size={22} color="#365B45" strokeWidth={2.4} />
          </TouchableOpacity>
        ) : currentView === 'posts' ? (
          <TouchableOpacity
            style={[styles.headerCircleBtn, Shadows.sm]}
            onPress={onOpenCreatePost}
            activeOpacity={0.7}
            accessibilityLabel="Create Post"
          >
            <Plus size={22} color="#365B45" strokeWidth={2.4} />
          </TouchableOpacity>
        ) : currentView === 'chat' ? (
          <TouchableOpacity
            style={[styles.headerCircleBtn, Shadows.sm]}
            onPress={() => setChatMenuVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="Chat Options"
          >
            <MoreVertical size={20} color="#365B45" strokeWidth={2.4} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.headerCircleBtn, Shadows.sm]}>
            <BloomLogoMark />
          </View>
        )}
      </View>

      {/* VIEW 1: GLOBAL CIRCLE LANDING HUB (Enlarged Soft Floating Tiles Filling Space) */}
      {currentView === 'landing' && (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.landingScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SOFT FLOATING TILES CONTAINER (ENLARGED & SPACIOUS) */}
          <View style={styles.tilesContainer}>
            {/* ROW 1: TWO-COLUMN GRID (Large Global Trends & Large Global Posts) */}
            <View style={styles.tilesRow}>
              {/* TILE 1: GLOBAL TRENDS (ENLARGED) */}
              <TouchableOpacity
                style={[styles.tileCard, styles.trendsTile, Shadows.sm]}
                onPress={() => setCurrentView('trends')}
                activeOpacity={0.8}
                accessibilityLabel="Open Global Trends"
              >
                {/* Top Row: Large Circular White Icon + Navigation Arrow */}
                <View style={styles.tileHeaderRow}>
                  <View style={[styles.iconCircle, Shadows.sm]}>
                    <TrendingUp size={26} color="#17638A" strokeWidth={2.2} />
                  </View>
                  <View style={[styles.arrowPill, { backgroundColor: 'rgba(23, 99, 138, 0.14)' }]}>
                    <ArrowUpRight size={18} color="#17638A" strokeWidth={2.4} />
                  </View>
                </View>

                {/* Tile Content */}
                <View style={styles.tileBody}>
                  <Text style={styles.tileTitle}>Global Trends</Text>
                  <Text style={styles.tileDesc}>
                    Join viral wellness challenges, daily student habits, and community quests.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* TILE 2: GLOBAL POSTS (ENLARGED) */}
              <TouchableOpacity
                style={[styles.tileCard, styles.postsTile, Shadows.sm]}
                onPress={() => setCurrentView('posts')}
                activeOpacity={0.8}
                accessibilityLabel="Open Global Posts"
              >
                {/* Top Row: Large Circular White Icon + Navigation Arrow */}
                <View style={styles.tileHeaderRow}>
                  <View style={[styles.iconCircle, Shadows.sm]}>
                    <Sparkles size={26} color="#5A4A7A" strokeWidth={2.2} />
                  </View>
                  <View style={[styles.arrowPill, { backgroundColor: 'rgba(90, 74, 122, 0.14)' }]}>
                    <ArrowUpRight size={18} color="#5A4A7A" strokeWidth={2.4} />
                  </View>
                </View>

                {/* Tile Content */}
                <View style={styles.tileBody}>
                  <Text style={styles.tileTitle}>Global Posts</Text>
                  <Text style={styles.tileDesc}>
                    Share mindful reflections, daily milestones, and stories from campus life.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* ROW 2: FULL-WIDTH WIDE TILE (Large Global Chat) */}
            <TouchableOpacity
              style={[styles.wideTileCard, styles.chatTile, Shadows.sm]}
              onPress={() => setCurrentView('chat')}
              activeOpacity={0.8}
              accessibilityLabel="Open Global Chat"
            >
              {/* Large Circular Icon */}
              <View style={[styles.iconCircleWide, Shadows.sm]}>
                <MessageCircle size={28} color="#8A4E31" strokeWidth={2.2} />
              </View>

              {/* Main Content */}
              <View style={styles.wideTileBody}>
                <Text style={styles.wideTileTitle}>Global Chat</Text>
                <Text style={styles.wideTileDesc}>
                  Real-time discussions, study sprints, and supportive campus talk with students worldwide.
                </Text>
              </View>

              {/* Right Arrow Navigation Indicator */}
              <View style={[styles.arrowCircleWide, Shadows.sm]}>
                <ArrowRight size={20} color="#8A4E31" strokeWidth={2.2} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* VIEW 2: DEDICATED GLOBAL TRENDS SCREEN */}
      {currentView === 'trends' && (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.dedicatedScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TrendingTab
            challenges={challenges}
            onToggleJoinChallenge={onToggleJoinChallenge}
            onOpenCreateChallenge={() => router.push('/challenge/create' as any)}
            discussions={discussions}
            onOpenDiscussionComments={onOpenDiscussionComments}
          />
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* VIEW 3: DEDICATED GLOBAL POSTS SCREEN */}
      {currentView === 'posts' && (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.dedicatedScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <PostsTab
            posts={posts}
            onOpenCreatePost={onOpenCreatePost}
            onToggleLike={onToggleLikePost}
            onToggleBookmark={onToggleBookmarkPost}
            onOpenComments={onOpenComments}
            onSharePost={onSharePost}
            currentUserInitials={currentUserInitials}
          />
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* VIEW 4: DEDICATED GLOBAL CHAT SCREEN */}
      {currentView === 'chat' && (
        <View style={styles.chatDedicatedContainer}>
          <GlobalChatTab
            messages={chatMessages}
            onSendMessage={onSendChatMessage}
            onVotePoll={onVotePoll}
            onReactMessage={onReactMessage}
            onCreatePoll={onCreatePoll}
            onDeleteSingleMessage={onDeleteSingleMessage}
            isSearchActive={isSearchActive}
            onCloseSearch={() => setIsSearchActive(false)}
          />
        </View>
      )}

      {/* WHATSAPP-STYLE 3-DOTS OVERLAY MENU */}
      <Modal
        visible={chatMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChatMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.chatMenuOverlay}
          activeOpacity={1}
          onPress={() => setChatMenuVisible(false)}
        >
          <View
            style={[
              styles.chatMenuCard,
              { top: topInset + 54 },
              Shadows.lg,
            ]}
          >
            {/* Search */}
            <TouchableOpacity
              style={styles.chatMenuItem}
              onPress={() => {
                setChatMenuVisible(false);
                setIsSearchActive(true);
              }}
              activeOpacity={0.7}
            >
              <Search size={17} color="#29332E" strokeWidth={2} />
              <Text style={styles.chatMenuItemText}>Search in chat</Text>
            </TouchableOpacity>

            {/* Mute Notifications */}
            <TouchableOpacity
              style={styles.chatMenuItem}
              onPress={() => {
                setChatMenuVisible(false);
                setIsChatMuted(prev => !prev);
              }}
              activeOpacity={0.7}
            >
              {isChatMuted ? (
                <Bell size={17} color="#29332E" strokeWidth={2} />
              ) : (
                <BellOff size={17} color="#29332E" strokeWidth={2} />
              )}
              <Text style={styles.chatMenuItemText}>
                {isChatMuted ? 'Unmute notifications' : 'Mute notifications'}
              </Text>
            </TouchableOpacity>

            {/* Clear Chat */}
            <TouchableOpacity
              style={styles.chatMenuItem}
              onPress={() => {
                setChatMenuVisible(false);
                setClearChatConfirmVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Eraser size={17} color="#D9534F" strokeWidth={2} />
              <Text style={[styles.chatMenuItemText, { color: '#D9534F' }]}>
                Clear chat
              </Text>
            </TouchableOpacity>

            {/* Delete message from all */}
            <TouchableOpacity
              style={styles.chatMenuItem}
              onPress={() => {
                setChatMenuVisible(false);
                setDeleteAllConfirmVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Trash2 size={17} color="#D9534F" strokeWidth={2} />
              <Text style={[styles.chatMenuItemText, { color: '#D9534F' }]}>
                Delete message from all
              </Text>
            </TouchableOpacity>

            {/* Group info & guidelines */}
            <TouchableOpacity
              style={[styles.chatMenuItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                setChatMenuVisible(false);
                setChatInfoVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Info size={17} color="#29332E" strokeWidth={2} />
              <Text style={styles.chatMenuItemText}>Group info & guidelines</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* CLEAR CHAT CONFIRMATION MODAL */}
      <Modal
        visible={clearChatConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setClearChatConfirmVisible(false)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={[styles.dialogCard, Shadows.lg]}>
            <View style={styles.dialogIconBg}>
              <Eraser size={24} color="#D9534F" strokeWidth={2} />
            </View>
            <Text style={styles.dialogTitle}>Clear this chat?</Text>
            <Text style={styles.dialogDesc}>
              Messages will be cleared from your screen. You can continue sending mindful notes anytime.
            </Text>
            <View style={styles.dialogBtnRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setClearChatConfirmVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogDestructiveBtn}
                onPress={() => {
                  setClearChatConfirmVisible(false);
                  onClearChat?.();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogDestructiveText}>Clear Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE ALL CONFIRMATION MODAL */}
      <Modal
        visible={deleteAllConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteAllConfirmVisible(false)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={[styles.dialogCard, Shadows.lg]}>
            <View style={styles.dialogIconBg}>
              <Trash2 size={24} color="#D9534F" strokeWidth={2} />
            </View>
            <Text style={styles.dialogTitle}>Delete messages for all?</Text>
            <Text style={styles.dialogDesc}>
              This will delete all messages for all participants in the Global Chat community.
            </Text>
            <View style={styles.dialogBtnRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setDeleteAllConfirmVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogDestructiveBtn}
                onPress={() => {
                  setDeleteAllConfirmVisible(false);
                  onDeleteMessageFromAll?.();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogDestructiveText}>Delete for All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* GROUP INFO MODAL */}
      <Modal
        visible={chatInfoVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setChatInfoVisible(false)}
      >
        <View style={styles.infoModalBackdrop}>
          <View style={[styles.infoModalCard, Shadows.lg]}>
            <View style={styles.infoModalHeader}>
              <View style={styles.infoAvatarCircle}>
                <Sparkles size={24} color="#365B45" strokeWidth={2} />
              </View>
              <Text style={styles.infoModalTitle}>Global Student Circle</Text>
              <Text style={styles.infoModalSubtitle}>Live Bloom Community</Text>
            </View>

            <View style={styles.infoRulesBox}>
              <Text style={styles.infoRulesTitle}>COMMUNITY GUIDELINES</Text>
              <Text style={styles.infoRuleItem}>🌱 Practice kindness and mutual encouragement</Text>
              <Text style={styles.infoRuleItem}>🍵 Share study tips, habits, and peaceful reflections</Text>
              <Text style={styles.infoRuleItem}>✨ Zero tolerance for spam, harassment, or harsh speech</Text>
              <Text style={styles.infoRuleItem}>🔒 Keep private personal information safe</Text>
            </View>

            <TouchableOpacity
              style={styles.infoCloseBtn}
              onPress={() => setChatInfoVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.infoCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F1E8', // Light sage greenish background
  },
  // Floating Header Bar (Seamless on light sage background)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  titleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#141E19',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 2,
    fontWeight: '500',
  },

  scrollArea: {
    flex: 1,
  },
  landingScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  dedicatedScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  chatDedicatedContainer: {
    flex: 1,
  },

  // SOFT FLOATING TILES (ENLARGED & SPACIOUS)
  tilesContainer: {
    gap: 16,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 14,
  },

  // Rounded-Square Tile Base (Trends & Posts - Enlarged)
  tileCard: {
    flex: 1,
    borderRadius: 26,
    padding: Spacing.xl,
    minHeight: 250,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  trendsTile: {
    backgroundColor: '#E0EFFB', // Fresh luminous sky blue (pops with high contrast against the #E8F1E8 sage screen)
    borderColor: '#C4E0F7',
  },
  postsTile: {
    backgroundColor: '#EFEBF8', // Soft pastel lavender
    borderColor: '#DDD6EC',
  },
  tileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBody: {
    marginTop: Spacing.lg,
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#141E19',
    marginBottom: 6,
  },
  tileDesc: {
    fontSize: 13,
    color: '#4A5850',
    lineHeight: 19,
  },

  // Full-Width Wide Tile (Global Chat - Enlarged)
  wideTileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    padding: Spacing.xl,
    minHeight: 130,
    borderWidth: 1,
  },
  chatTile: {
    backgroundColor: '#FCEFE6', // Soft pastel peach
    borderColor: '#F5DDD0',
  },
  iconCircleWide: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideTileBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  wideTileTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#141E19',
    marginBottom: 4,
  },
  wideTileDesc: {
    fontSize: 13,
    color: '#6E4F3E',
    lineHeight: 19,
  },
  arrowCircleWide: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dedicated View Switcher Bar
  switcherBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.round,
    padding: 3,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  switcherBarChat: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.round,
    padding: 3,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: '#DCE8DE',
  },
  switcherChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
  },
  switcherChipActive: {
    backgroundColor: '#E8F1E8',
  },
  switcherChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  switcherChipTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#365B45',
  },

  // WhatsApp-Style 3-Dots Menu Overlay
  chatMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  chatMenuCard: {
    position: 'absolute',
    right: 18,
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E8ECE9',
  },
  chatMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F3F1',
  },
  chatMenuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#29332E',
  },

  // WhatsApp-Style Confirmation Dialog
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 25, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  dialogIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FDE8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#141E19',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogDesc: {
    fontSize: 13,
    color: '#55655B',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F0F3F1',
    alignItems: 'center',
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#55655B',
  },
  dialogDestructiveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#D9534F',
    alignItems: 'center',
  },
  dialogDestructiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Group Info Modal
  infoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 25, 0.45)',
    justifyContent: 'flex-end',
  },
  infoModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  infoModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  infoAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F1E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#141E19',
  },
  infoModalSubtitle: {
    fontSize: 13,
    color: '#55655B',
    marginTop: 3,
  },
  infoRulesBox: {
    backgroundColor: '#F7FAF8',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8F1E8',
  },
  infoRulesTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#365B45',
    marginBottom: 2,
  },
  infoRuleItem: {
    fontSize: 13,
    color: '#29332E',
    lineHeight: 18,
  },
  infoCloseBtn: {
    backgroundColor: '#365B45',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  infoCloseBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default GlobalCircleScreen;
