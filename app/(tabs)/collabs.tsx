import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';

// Screen Views
import { BloomCircleLanding } from '../../components/collabs/BloomCircleLanding';
import { GlobalCircleScreen } from '../../components/collabs/GlobalCircleScreen';
import { MyCircleScreen } from '../../components/collabs/MyCircleScreen';

// Modals
import { EditProfileModal } from '../../components/collabs/modals/EditProfileModal';
import { ShareProfileModal } from '../../components/collabs/modals/ShareProfileModal';
import { FriendChatModal } from '../../components/collabs/modals/FriendChatModal';
import { FriendProfileModal } from '../../components/collabs/modals/FriendProfileModal';
import { CreatePostModal } from '../../components/collabs/CreatePostModal';
import { CommentsModal } from '../../components/collabs/CommentsModal';

// Mock Data & Types
import {
  currentUserProfile as initialUser,
  sampleFriends as initialFriends,
  sampleRequests as initialRequests,
  sampleDiscover as initialDiscover,
  initialChallenges,
  trendingDiscussions as initialDiscussions,
  initialGlobalChatMessages,
  initialCommunityPosts,
} from '../../data/collabsMockData';
import {
  CircleScreenView,
  UserProfile,
  Challenge,
  TrendingDiscussion,
  ChatMessage,
  CommunityPost,
  PollOption,
  PostComment,
} from '../../types/collabs';

export default function CollabsScreen() {
  const router = useRouter();

  // Main Screen Navigation State
  const [currentScreen, setCurrentScreen] = useState<CircleScreenView>('landing');

  // User Profile
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialUser);

  // Lists & State
  const [friends, setFriends] = useState<UserProfile[]>(initialFriends);
  const [requests, setRequests] = useState<UserProfile[]>(initialRequests);
  const [suggestions, setSuggestions] = useState<UserProfile[]>(initialDiscover);
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [discussions, setDiscussions] = useState<TrendingDiscussion[]>(initialDiscussions);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialGlobalChatMessages);
  const [posts, setPosts] = useState<CommunityPost[]>(initialCommunityPosts);

  // Modals
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [shareProfileVisible, setShareProfileVisible] = useState(false);
  const [friendChatVisible, setFriendChatVisible] = useState(false);
  const [friendProfileVisible, setFriendProfileVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<UserProfile | null>(null);
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [activeCommentsPost, setActiveCommentsPost] = useState<CommunityPost | null>(null);

  // Floating Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // --------------------------------------------------------------------------
  // USER PROFILE ACTIONS
  // --------------------------------------------------------------------------
  const handleSaveProfile = useCallback((updated: Partial<UserProfile>) => {
    setCurrentUser(prev => ({ ...prev, ...updated }));
    showToast('Profile updated successfully 🌱');
  }, [showToast]);

  // --------------------------------------------------------------------------
  // CHALLENGES ACTIONS
  // --------------------------------------------------------------------------
  const handleToggleJoinChallenge = useCallback((id: string) => {
    setChallenges(prev =>
      prev.map(c => {
        if (c.id === id) {
          const nextJoined = !c.isJoined;
          showToast(
            nextJoined
              ? `Joined ${c.title}! ✨`
              : `Left ${c.title}`
          );
          return {
            ...c,
            isJoined: nextJoined,
            participantsCount: nextJoined
              ? c.participantsCount + 1
              : c.participantsCount - 1,
            participantsText: nextJoined
              ? `${((c.participantsCount + 1) / 1000).toFixed(1)}k joined`
              : `${((c.participantsCount - 1) / 1000).toFixed(1)}k joined`,
          };
        }
        return c;
      })
    );
  }, [showToast]);

  // --------------------------------------------------------------------------
  // GLOBAL CHAT ACTIONS
  // --------------------------------------------------------------------------
  const handleSendChatMessage = useCallback((
    text: string,
    media?: {
      image?: string;
      video?: string;
      fileDoc?: { name: string; size: string };
      audioNote?: { duration: string };
    }
  ) => {
    const userMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      senderId: currentUser.id,
      senderName: 'You',
      senderHandle: currentUser.handle,
      senderInitials: currentUser.initials,
      text,
      image: media?.image,
      video: media?.video,
      fileDoc: media?.fileDoc,
      audioNote: media?.audioNote,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setChatMessages(prev => [...prev, userMsg]);

    // Simulated peer auto-reply
    setTimeout(() => {
      const peerReplies = media?.image
        ? [
            "Love this photo! Beautiful study vibe 🌿📸",
            "Such a serene scene! Thanks for sharing with us. ✨",
            "This inspires me to tidy up my desk right now! 🙌",
          ]
        : media?.video
        ? [
            "What a relaxing video clip! Taking a deep breath now. 🍵",
            "So peaceful! Putting on some lofi beats to match. 🎧✨",
          ]
        : media?.fileDoc
        ? [
            "Thanks for sharing these study notes! Super helpful for finals. 📘✨",
            "Saving this guide right away! Appreciate the support. 🌿",
          ]
        : media?.audioNote
        ? [
            "Just listened to this breathing exercise — feeling much calmer. 🧘‍♀️💫",
            "This voice reset was just what I needed today. 🍵",
          ]
        : [
            "Love this mindful energy! Sending calm vibes your way. 🌿✨",
            "Small steps every day! Taking a 5-min breather right now too. 🍵",
            "Thanks for sharing! The campus feels much more peaceful today. 🙌",
          ];
      const randomText = peerReplies[Math.floor(Math.random() * peerReplies.length)];

      const peerMsg: ChatMessage = {
        id: `peer_${Date.now()}`,
        senderId: 'peer_sim',
        senderName: 'Chloe M.',
        senderHandle: '@chloem',
        senderInitials: 'CM',
        text: randomText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
      };

      setChatMessages(prev => [...prev, peerMsg]);
    }, 1200);
  }, [currentUser]);

  const handleClearChat = useCallback(() => {
    setChatMessages([]);
    showToast('Chat history cleared 🧹');
  }, [showToast]);

  const handleDeleteMessageFromAll = useCallback(() => {
    setChatMessages([]);
    showToast('Messages deleted for everyone 🗑️');
  }, [showToast]);

  const handleDeleteSingleMessage = useCallback((messageId: string) => {
    setChatMessages(prev => prev.filter(m => m.id !== messageId));
    showToast('Message deleted 🗑️');
  }, [showToast]);

  const handleVotePoll = useCallback((messageId: string, optionId: string) => {
    setChatMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId && msg.poll) {
          const prevVoted = msg.poll.userVotedOptionId;
          const options = msg.poll.options.map(opt => {
            if (opt.id === optionId) {
              return { ...opt, votes: prevVoted === optionId ? opt.votes : opt.votes + 1 };
            }
            if (opt.id === prevVoted) {
              return { ...opt, votes: Math.max(0, opt.votes - 1) };
            }
            return opt;
          });
          const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);
          return {
            ...msg,
            poll: {
              ...msg.poll,
              options,
              totalVotes,
              userVotedOptionId: optionId,
            },
          };
        }
        return msg;
      })
    );
    showToast('Vote recorded! 📊✨');
  }, [showToast]);

  const handleReactChatMessage = useCallback((messageId: string, emoji: string) => {
    setChatMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...(msg.reactions || {}) };
          const myReactions = [...(msg.myReactions || [])];
          const hasReacted = myReactions.includes(emoji);

          if (hasReacted) {
            reactions[emoji] = Math.max(0, (reactions[emoji] || 1) - 1);
            if (reactions[emoji] === 0) delete reactions[emoji];
            const nextMy = myReactions.filter(e => e !== emoji);
            return { ...msg, reactions, myReactions: nextMy };
          } else {
            reactions[emoji] = (reactions[emoji] || 0) + 1;
            myReactions.push(emoji);
            return { ...msg, reactions, myReactions };
          }
        }
        return msg;
      })
    );
  }, []);

  const handleCreatePoll = useCallback((question: string, optionsText: string[]) => {
    const pollOptions: PollOption[] = optionsText
      .filter(t => t.trim().length > 0)
      .map((t, idx) => ({
        id: `opt_${Date.now()}_${idx}`,
        text: t.trim(),
        votes: 0,
      }));

    const newPollMsg: ChatMessage = {
      id: `poll_${Date.now()}`,
      senderId: currentUser.id,
      senderName: 'You',
      senderHandle: currentUser.handle,
      senderInitials: currentUser.initials,
      text: `📊 Community Poll: ${question}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      poll: {
        id: `poll_obj_${Date.now()}`,
        question,
        options: pollOptions,
        totalVotes: 0,
      },
      reactions: { '📊': 1 },
      myReactions: ['📊'],
    };

    setChatMessages(prev => [...prev, newPollMsg]);
    showToast('Poll created in Global Chat! 📊');
  }, [currentUser, showToast]);

  // --------------------------------------------------------------------------
  // POSTS & COMMENTS ACTIONS
  // --------------------------------------------------------------------------
  const handleToggleLikePost = useCallback((postId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const nextLiked = !p.isLiked;
          return {
            ...p,
            isLiked: nextLiked,
            likesCount: nextLiked ? p.likesCount + 1 : p.likesCount - 1,
          };
        }
        return p;
      })
    );
  }, []);

  const handleToggleBookmarkPost = useCallback((postId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const nextBookmarked = !p.isBookmarked;
          showToast(nextBookmarked ? 'Saved to bookmarks 🔖' : 'Removed from bookmarks');
          return { ...p, isBookmarked: nextBookmarked };
        }
        return p;
      })
    );
  }, [showToast]);

  const handleCreatePost = useCallback(
    (
      content: string,
      category: string = 'Wellness',
      image?: string,
      isPrivate?: boolean,
      likesVisible: boolean = true,
      commentsEnabled: boolean = true
    ) => {
      const newPost: CommunityPost = {
        id: `post_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userHandle: currentUser.handle,
        userAvatar: currentUser.avatar,
        userInitials: currentUser.initials,
        timeAgo: 'Just now',
        category,
        content,
        image,
        isPrivate,
        likesVisible,
        commentsEnabled,
        likesCount: 1,
        isLiked: true,
        commentsCount: 0,
        comments: [],
        sharesCount: 0,
      };

      setPosts(prev => [newPost, ...prev]);
      showToast(isPrivate ? 'Private reflection saved! 🔒' : 'Reflection shared with community! 🌱');
    },
    [currentUser, showToast]
  );

  const handleAddComment = useCallback(
    (postId: string, text: string) => {
      const newComment: PostComment = {
        id: `c_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        userInitials: currentUser.initials,
        text,
        timestamp: 'Just now',
      };

      setPosts(prev =>
        prev.map(p => {
          if (p.id === postId) {
            const currentComments = Array.isArray(p.comments) ? p.comments : [];
            const updatedComments = [...currentComments, newComment];
            return {
              ...p,
              commentsCount: updatedComments.length,
              comments: updatedComments,
            };
          }
          return p;
        })
      );

      // Also update discussions if commenting on a trending discussion
      setDiscussions(prev =>
        prev.map(d => {
          if (d.id === postId) {
            const currentComments = Array.isArray(d.comments) ? d.comments : [];
            const updatedComments = [...currentComments, newComment];
            return {
              ...d,
              repliesCount: d.repliesCount + 1,
              comments: updatedComments,
            };
          }
          return d;
        })
      );

      // Keep activeCommentsPost synchronized safely
      setActiveCommentsPost(prev => {
        if (prev && prev.id === postId) {
          const currentComments = Array.isArray(prev.comments) ? prev.comments : [];
          const updatedComments = [...currentComments, newComment];
          return {
            ...prev,
            commentsCount: updatedComments.length,
            comments: updatedComments,
          };
        }
        return prev;
      });

      showToast('Comment added 💬');
    },
    [currentUser, showToast]
  );

  const handleOpenComments = useCallback((post: CommunityPost) => {
    setActiveCommentsPost(post);
    setCommentsVisible(true);
  }, []);

  const handleOpenDiscussionComments = useCallback((disc: TrendingDiscussion) => {
    // Transform discussion into post format for comments modal
    const discComments = Array.isArray(disc.comments) ? disc.comments : [];
    const discPost: CommunityPost = {
      id: disc.id,
      userId: 'disc_user',
      userName: 'Campus Discussion',
      userHandle: '@bloom_trending',
      userAvatar: '',
      userInitials: 'TD',
      timeAgo: disc.timeAgo,
      category: 'Wellness',
      content: `${disc.title}\n${disc.preview}`,
      likesCount: disc.repliesCount,
      isLiked: false,
      commentsCount: discComments.length,
      comments: discComments,
      sharesCount: 0,
    };
    setActiveCommentsPost(discPost);
    setCommentsVisible(true);
  }, []);

  // --------------------------------------------------------------------------
  // FRIENDS & REQUESTS ACTIONS
  // --------------------------------------------------------------------------
  const handleAcceptRequest = useCallback((requestId: string) => {
    const accepted = requests.find(r => r.id === requestId);
    if (!accepted) return;

    setRequests(prev => prev.filter(r => r.id !== requestId));
    setFriends(prev => [
      ...prev,
      {
        ...accepted,
        friendshipStatus: 'friends',
        isFriend: true,
        isOnline: true,
      },
    ]);
    showToast(`${accepted.name} added to your circle! 🌱`);
  }, [requests, showToast]);

  const handleDeclineRequest = useCallback((requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
    showToast('Invitation declined');
  }, [showToast]);

  const handleAddFriend = useCallback((userId: string) => {
    const target = suggestions.find(s => s.id === userId);
    if (target) {
      showToast(`Friend request sent to ${target.name} ✨`);
    }
  }, [suggestions, showToast]);

  const handleOpenFriendChat = useCallback((friend: UserProfile) => {
    setSelectedFriend(friend);
    setFriendChatVisible(true);
  }, []);

  const handleOpenFriendProfile = useCallback((friend: UserProfile) => {
    setSelectedFriend(friend);
    setFriendProfileVisible(true);
  }, []);

  const handleRemoveFriend = useCallback((friendId: string) => {
    setFriends(prev => prev.filter(f => f.id !== friendId));
    showToast('Friend removed from circle');
  }, [showToast]);

  return (
    <View style={styles.root}>
      {/* SCREEN 1: BLOOM CIRCLE LANDING */}
      {currentScreen === 'landing' && (
        <BloomCircleLanding
          onSelectScreen={setCurrentScreen}
          onBackPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(tabs)');
            }
          }}
          onLogoPress={() => showToast('Bloom Sanctuary 🌱')}
          pendingRequestsCount={requests.length}
          userInitials={currentUser.initials}
        />
      )}

      {/* SCREEN 2: GLOBAL CIRCLE */}
      {currentScreen === 'global' && (
        <GlobalCircleScreen
          onBackToLanding={() => setCurrentScreen('landing')}
          onSearchPress={() => showToast('Search filters active')}
          onNotificationsPress={() => showToast('Global activity updated')}
          challenges={challenges}
          onToggleJoinChallenge={handleToggleJoinChallenge}
          discussions={discussions}
          onOpenDiscussionComments={handleOpenDiscussionComments}
          chatMessages={chatMessages}
          onSendChatMessage={handleSendChatMessage}
          onVotePoll={handleVotePoll}
          onReactMessage={handleReactChatMessage}
          onCreatePoll={handleCreatePoll}
          onClearChat={handleClearChat}
          onDeleteMessageFromAll={handleDeleteMessageFromAll}
          onDeleteSingleMessage={handleDeleteSingleMessage}
          posts={posts}
          onOpenCreatePost={() => setCreatePostVisible(true)}
          onToggleLikePost={handleToggleLikePost}
          onToggleBookmarkPost={handleToggleBookmarkPost}
          onOpenComments={handleOpenComments}
          onSharePost={() => showToast('Post link copied to share! 🌿')}
          currentUserInitials={currentUser.initials}
        />
      )}

      {/* SCREEN 3: MY CIRCLE */}
      {currentScreen === 'my_circle' && (
        <MyCircleScreen
          onBackToLanding={() => setCurrentScreen('landing')}
          onSearchPress={() => showToast('Friend search active')}
          currentUser={currentUser}
          friends={friends}
          requests={requests}
          suggestions={suggestions}
          onOpenEditProfile={() => setEditProfileVisible(true)}
          onOpenShareProfile={() => setShareProfileVisible(true)}
          onOpenFriendChat={handleOpenFriendChat}
          onOpenFriendProfile={handleOpenFriendProfile}
          onRemoveFriend={handleRemoveFriend}
          onAcceptRequest={handleAcceptRequest}
          onDeclineRequest={handleDeclineRequest}
          onAddFriend={handleAddFriend}
          onOpenCreatePost={() => setCreatePostVisible(true)}
        />
      )}

      {/* MODAL: EDIT PROFILE */}
      <EditProfileModal
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
      />

      {/* MODAL: SHARE PROFILE */}
      <ShareProfileModal
        visible={shareProfileVisible}
        onClose={() => setShareProfileVisible(false)}
        currentUser={currentUser}
        onCopyLink={() => showToast('Invite link copied to clipboard! 📋✨')}
      />

      {/* MODAL: FRIEND CHAT */}
      <FriendChatModal
        visible={friendChatVisible}
        onClose={() => setFriendChatVisible(false)}
        friend={selectedFriend}
      />

      {/* MODAL: FRIEND PROFILE */}
      <FriendProfileModal
        visible={friendProfileVisible}
        onClose={() => setFriendProfileVisible(false)}
        friend={selectedFriend}
        onMessageFriend={handleOpenFriendChat}
      />

      {/* MODAL: CREATE POST */}
      <CreatePostModal
        visible={createPostVisible}
        onClose={() => setCreatePostVisible(false)}
        onSubmit={handleCreatePost}
        currentUser={currentUser}
      />

      {/* MODAL: COMMENTS */}
      <CommentsModal
        visible={commentsVisible}
        post={activeCommentsPost}
        onClose={() => {
          setCommentsVisible(false);
          setActiveCommentsPost(null);
        }}
        onAddComment={handleAddComment}
        currentUser={currentUser}
      />

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <View style={[styles.toastContainer, Shadows.lg]}>
          <CheckCircle2 size={16} color="#C6ECD0" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E8F1E8',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 95,
    alignSelf: 'center',
    backgroundColor: '#29332E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 999,
  },
  toastText: {
    color: '#E8F3EC',
    fontSize: 12,
    fontWeight: '600',
  },
});
