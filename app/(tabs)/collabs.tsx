import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
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

// Firebase & Auth Services
import { auth } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import {
  getPublicChallenges,
  joinChallenge as joinChallengeService,
  leaveChallenge as leaveChallengeService,
} from '../../services/challengeService';
import {
  getUserFriends,
  getIncomingFriendRequests,
  getSentFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriendRelationship,
  getDiscoverUsers,
  getUserJoinedChallengesCount,
  getFirestoreCommunityPosts,
  createFirestorePost,
  toggleFirestorePostLike,
  addFirestorePostComment,
  deleteFirestorePostComment,
  deleteFirestorePost,
  reportFirestorePost,
  subscribeToGlobalChatMessages,
  sendFirestoreChatMessage,
  createFirestoreChatPoll,
  voteFirestoreChatPoll,
  toggleFirestoreChatReaction,
  deleteFirestoreChatMessage,
  updateUserProfile,
} from '../../services/firestoreService';
import { uploadCommunityImage } from '../../services/firebaseStorageService';

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
  const { user, userProfile, refreshProfile } = useAuth();

  // Main Screen Navigation State
  const [currentScreen, setCurrentScreen] = useState<CircleScreenView>('landing');

  // Dynamic user profile derived from authenticated user
  const [userChallengesCount, setUserChallengesCount] = useState<number>(0);

  // Lists & State (Zero Mock Data: Initialized to Empty Arrays)
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<UserProfile[]>([]);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [discussions, setDiscussions] = useState<TrendingDiscussion[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  // Authenticated Current User State
  const currentInitials = (userProfile?.fullName || user?.displayName || 'BM')
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: user?.uid || 'anon',
    name: userProfile?.fullName || user?.displayName || 'Bloom Member',
    handle: `@${userProfile?.username || (user?.email ? user.email.split('@')[0] : 'member')}`,
    avatar: userProfile?.photoURL || user?.photoURL || '',
    initials: currentInitials,
    bio: userProfile?.bio || 'Flourishing in my mindful study space 🌱',
    streak: (userProfile as any)?.streakCount || 1,
    challengesJoined: 0,
    postsCount: 0,
    friendsCount: 0,
    isOnline: true,
    isFriend: false,
    visibility: 'public',
    tags: userProfile?.wellnessGoals || ['Mindfulness', 'Focus'],
    badges: [
      { id: 'b1', name: 'Mindful Member', icon: '🌱', description: 'Active Bloom circle participant' },
    ],
  });

  // Keep currentUser synced with auth updates
  useEffect(() => {
    if (userProfile || user) {
      const initials = (userProfile?.fullName || user?.displayName || 'BM')
        .split(' ')
        .map(p => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      setCurrentUser(prev => ({
        ...prev,
        id: user?.uid || prev.id,
        name: userProfile?.fullName || user?.displayName || prev.name,
        handle: `@${userProfile?.username || (user?.email ? user.email.split('@')[0] : prev.handle.replace('@', ''))}`,
        avatar: userProfile?.photoURL || user?.photoURL || prev.avatar,
        initials,
        bio: userProfile?.bio || prev.bio,
        friendsCount: friends.length,
        challengesJoined: userChallengesCount,
      }));
    }
  }, [userProfile, user, friends.length, userChallengesCount]);

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
  // FIRESTORE DATA SYNCHRONIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    const currentUid = user?.uid || auth.currentUser?.uid || currentUser.id || 'bloom_guest';

    async function loadSocialData() {
      try {
        if (user?.uid) {
          // 1. Load friends from Firestore
          const firestoreFriends = await getUserFriends(currentUid);
          if (isMounted) {
            if (firestoreFriends.length > 0) {
              const mappedFriends: UserProfile[] = firestoreFriends.map(f => ({
                id: f.friendUid,
                name: f.name || 'Bloom Member',
                handle: f.handle?.startsWith('@') ? f.handle : `@${f.handle || 'member'}`,
                avatar: f.avatar || '',
                initials: (f.name || 'BM')
                  .split(' ')
                  .map(p => p[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2),
                bio: f.bio || 'Bloom circle friend 🌱',
                streak: 1,
                challengesJoined: 0,
                postsCount: 0,
                friendsCount: 0,
                isOnline: true,
                isFriend: true,
                friendshipStatus: 'friends',
                badges: [],
              }));
              setFriends(mappedFriends);
            } else {
              setFriends([]);
            }
          }

          // 2. Load incoming friend requests from Firestore
          const firestoreRequests = await getIncomingFriendRequests(currentUid);
          if (isMounted) {
            const mappedRequests: UserProfile[] = firestoreRequests.map(r => ({
              id: r.id,
              name: r.senderName || 'Bloom Member',
              handle: r.senderUsername?.startsWith('@') ? r.senderUsername : `@${r.senderUsername || 'member'}`,
              avatar: r.senderAvatar || '',
              initials: (r.senderName || 'BM')
                .split(' ')
                .map(p => p[0])
                .join('')
                .toUpperCase()
                .slice(0, 2),
              bio: r.senderBio || 'Invited you to connect 🌱',
              streak: 1,
              challengesJoined: 0,
              postsCount: 0,
              friendsCount: 0,
              isOnline: false,
              isFriend: false,
              friendshipStatus: 'pending_received',
              mutualInfo: 'Invited you to connect',
              badges: [],
            }));
            setRequests(mappedRequests);
          }

          // 3. Load outgoing requests to exclude from Discover
          const sentRequests = await getSentFriendRequests(currentUid);
          const excludeUids = [
            ...firestoreFriends.map(f => f.friendUid),
            ...firestoreRequests.map(r => r.senderUid),
            ...sentRequests.map(s => s.receiverUid),
          ];

          // 4. Load Discover Users from Firestore
          const discoverUsers = await getDiscoverUsers(currentUid, excludeUids);
          if (isMounted) {
            setSuggestions(discoverUsers);
          }

          // 5. Load User Challenges count
          const count = await getUserJoinedChallengesCount(currentUid);
          if (isMounted) {
            setUserChallengesCount(count);
          }
        }

        // 6. Load Public Challenges from Firestore (Always loaded for community discovery)
        const publicChallenges = await getPublicChallenges('All', '', 'popular', currentUid);
        if (isMounted) {
          setChallenges(publicChallenges);
        }

        // 7. Load Community Posts from Firestore (Always loaded for community feed)
        const firestorePosts = await getFirestoreCommunityPosts(currentUid);
        if (isMounted) {
          setPosts(firestorePosts);
        }
      } catch (err) {
        console.warn('[Collabs] Error loading social data:', err);
      }
    }

    loadSocialData();

    // 8. Subscribe to Global Chat messages (Live onSnapshot for everyone)
    const unsubscribeChat = subscribeToGlobalChatMessages(currentUid, (msgs) => {
      if (isMounted) {
        setChatMessages(msgs);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeChat();
    };
  }, [user?.uid]);

  // --------------------------------------------------------------------------
  // USER PROFILE ACTIONS
  // --------------------------------------------------------------------------
  const handleSaveProfile = useCallback(async (updated: Partial<UserProfile>) => {
    setCurrentUser(prev => ({ ...prev, ...updated }));
    if (user?.uid) {
      try {
        await updateUserProfile(user.uid, {
          fullName: updated.name,
          username: updated.handle?.replace('@', ''),
          bio: updated.bio,
          photoURL: updated.avatar,
        });
        await refreshProfile();
        showToast('Profile updated successfully 🌱');
      } catch (err: any) {
        console.warn('[Collabs] Error updating profile:', err);
        showToast('Profile updated locally');
      }
    } else {
      showToast('Profile updated successfully 🌱');
    }
  }, [user?.uid, refreshProfile, showToast]);

  // --------------------------------------------------------------------------
  // CHALLENGES ACTIONS
  // --------------------------------------------------------------------------
  const handleToggleJoinChallenge = useCallback(async (id: string) => {
    const targetChallenge = challenges.find(c => c.id === id);
    const nextJoined = targetChallenge ? !targetChallenge.isJoined : true;

    setChallenges(prev =>
      prev.map(c => {
        if (c.id === id) {
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
              : Math.max(0, c.participantsCount - 1),
            participantsText: nextJoined
              ? `${(c.participantsCount + 1).toLocaleString()} joined`
              : `${Math.max(0, c.participantsCount - 1).toLocaleString()} joined`,
          };
        }
        return c;
      })
    );

    setUserChallengesCount(prev => (nextJoined ? prev + 1 : Math.max(0, prev - 1)));

    if (user?.uid) {
      try {
        if (nextJoined) {
          await joinChallengeService(id, {
            uid: user.uid,
            name: currentUser.name,
            avatar: currentUser.avatar,
          });
        } else {
          await leaveChallengeService(id, user.uid);
        }
      } catch (err) {
        console.warn('[Collabs] Error toggling challenge participation:', err);
      }
    }
  }, [challenges, user?.uid, currentUser, showToast]);

  // --------------------------------------------------------------------------
  // GLOBAL CHAT ACTIONS
  // --------------------------------------------------------------------------
  const handleSendChatMessage = useCallback(async (
    text: string,
    media?: {
      image?: string;
      video?: string;
      fileDoc?: { name: string; size: string };
      audioNote?: { duration: string };
    }
  ) => {
    const activeUid = user?.uid || auth.currentUser?.uid || currentUser.id || 'guest_' + Date.now().toString(36);

    // Optimistic local message insertion for immediate real-time response
    const newMsg: ChatMessage = {
      id: 'chat-' + Date.now(),
      senderId: activeUid,
      senderName: currentUser.name || 'Bloom Member',
      senderHandle: currentUser.handle || '@bloom',
      senderInitials: currentInitials,
      text,
      timestamp: 'Just now',
      isMe: true,
      image: media?.image,
      video: media?.video,
      fileDoc: media?.fileDoc,
      audioNote: media?.audioNote,
      reactions: {},
    };

    setChatMessages((prev) => [...prev, newMsg]);

    try {
      await sendFirestoreChatMessage({
        senderId: activeUid,
        senderName: currentUser.name,
        senderHandle: currentUser.handle,
        text,
        image: media?.image,
        video: media?.video,
        fileDoc: media?.fileDoc,
        audioNote: media?.audioNote,
      });
    } catch (err: any) {
      console.warn('[Collabs] Error sending chat message:', err);
      showToast('Message posted locally');
    }
  }, [currentUser, user?.uid, currentInitials, showToast]);

  const handleClearChat = useCallback(() => {
    setChatMessages([]);
    showToast('Chat view cleared 🧹');
  }, [showToast]);

  const handleDeleteMessageFromAll = useCallback(() => {
    setChatMessages([]);
    showToast('Messages view reset');
  }, [showToast]);

  const handleDeleteSingleMessage = useCallback(async (messageId: string) => {
    if (!user?.uid) return;
    try {
      await deleteFirestoreChatMessage(messageId, user.uid);
      setChatMessages(prev => prev.filter(m => m.id !== messageId));
      showToast('Message deleted 🗑️');
    } catch (err: any) {
      showToast(err?.message || 'Could not delete message');
    }
  }, [user?.uid, showToast]);

  const handleVotePoll = useCallback(async (messageId: string, optionId: string) => {
    if (!user?.uid) {
      showToast('Please sign in to vote');
      return;
    }

    // Optimistic UI update
    setChatMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId && msg.poll) {
          if (msg.poll.userVotedOptionId) return msg; // Prevent duplicate vote
          const options = msg.poll.options.map(opt => {
            if (opt.id === optionId) {
              return { ...opt, votes: opt.votes + 1 };
            }
            return opt;
          });
          return {
            ...msg,
            poll: {
              ...msg.poll,
              options,
              totalVotes: msg.poll.totalVotes + 1,
              userVotedOptionId: optionId,
            },
          };
        }
        return msg;
      })
    );

    try {
      await voteFirestoreChatPoll(messageId, user.uid, optionId);
      showToast('Vote recorded! 📊✨');
    } catch (err) {
      console.warn('[Collabs] Error recording vote:', err);
    }
  }, [user?.uid, showToast]);

  const handleReactChatMessage = useCallback(async (messageId: string, emoji: string) => {
    if (!user?.uid) {
      showToast('Please sign in to react');
      return;
    }

    try {
      await toggleFirestoreChatReaction(messageId, user.uid, emoji);
    } catch (err) {
      console.warn('[Collabs] Error toggling reaction:', err);
    }
  }, [user?.uid, showToast]);

  const handleCreatePoll = useCallback(async (question: string, optionsText: string[]) => {
    if (!user?.uid) {
      showToast('Please sign in to create a poll');
      return;
    }

    try {
      await createFirestoreChatPoll({
        authorUid: user.uid,
        authorName: currentUser.name,
        authorHandle: currentUser.handle,
        question,
        options: optionsText,
      });
      showToast('Community poll created! 📊');
    } catch (err) {
      console.warn('[Collabs] Error creating poll:', err);
      showToast('Could not create poll');
    }
  }, [currentUser, user?.uid, showToast]);

  // --------------------------------------------------------------------------
  // POSTS & COMMENTS ACTIONS
  // --------------------------------------------------------------------------
  const handleToggleLikePost = useCallback(async (postId: string) => {
    if (!user?.uid) {
      showToast('Please sign in to like reflections');
      return;
    }

    let nextLiked = false;
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          nextLiked = !p.isLiked;
          return {
            ...p,
            isLiked: nextLiked,
            likesCount: nextLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );

    try {
      await toggleFirestorePostLike(postId, user.uid, nextLiked);
    } catch (err) {
      console.warn('[Collabs] Error toggling like:', err);
    }
  }, [user?.uid, showToast]);

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
    async (
      content: string,
      category: string = 'Wellness',
      imageUri?: string,
      isPrivate?: boolean,
      likesVisible: boolean = true,
      commentsEnabled: boolean = true
    ) => {
      const activeUid = user?.uid || auth.currentUser?.uid || currentUser.id || 'guest_' + Date.now().toString(36);

      let uploadedImageUrl: string | undefined = undefined;
      let storagePath: string | undefined = undefined;

      // Handle image upload if a local photo was selected
      if (imageUri) {
        if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
          uploadedImageUrl = imageUri;
        } else {
          showToast('Uploading reflection image... 📷');
          try {
            const uploadRes = await uploadCommunityImage(imageUri, activeUid);
            uploadedImageUrl = uploadRes.downloadUrl;
            storagePath = uploadRes.storagePath;
          } catch (e) {
            console.warn('[Collabs] Photo upload error, using local URI:', e);
            uploadedImageUrl = imageUri;
          }
        }
      }

      let docId = 'post_' + Date.now();
      try {
        docId = await createFirestorePost({
          userId: activeUid,
          userName: currentUser.name,
          userHandle: currentUser.handle,
          userAvatar: currentUser.avatar,
          category,
          content,
          image: uploadedImageUrl,
          imagePath: storagePath,
          isPrivate,
          likesVisible,
          commentsEnabled,
        });
      } catch (err) {
        console.warn('[Collabs] Error creating post in Firestore:', err);
      }

      const newPost: CommunityPost = {
        id: docId,
        userId: activeUid,
        userName: currentUser.name,
        userHandle: currentUser.handle,
        userAvatar: currentUser.avatar,
        userInitials: currentUser.initials,
        timeAgo: 'Just now',
        category,
        content,
        image: uploadedImageUrl,
        isPrivate,
        likesVisible,
        commentsEnabled,
        likesCount: 0,
        isLiked: false,
        commentsCount: 0,
        comments: [],
        sharesCount: 0,
      };

      setPosts(prev => [newPost, ...prev]);
      showToast(isPrivate ? 'Private reflection saved! 🔒' : 'Reflection shared with community! 🌱');
    },
    [currentUser, user?.uid, showToast]
  );

  const handleDeletePost = useCallback(async (postId: string) => {
    if (!user?.uid) return;
    try {
      await deleteFirestorePost(postId, user.uid);
      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Reflection deleted 🗑️');
    } catch (err: any) {
      showToast(err?.message || 'Could not delete post');
    }
  }, [user?.uid, showToast]);

  const handleReportPost = useCallback(async (postId: string, reason = 'Inappropriate content') => {
    if (!user?.uid) return;
    try {
      await reportFirestorePost(postId, user.uid, reason);
      showToast('Report submitted. Thank you for keeping Bloom mindful 🌿');
    } catch (err: any) {
      showToast('Could not submit report');
    }
  }, [user?.uid, showToast]);

  const handleAddComment = useCallback(
    async (postId: string, text: string) => {
      if (!user?.uid) {
        showToast('Please sign in to comment');
        return;
      }

      const newComment: PostComment = {
        id: `c_${Date.now()}`,
        userId: user.uid,
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

      try {
        await addFirestorePostComment(postId, {
          userId: user.uid,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          text,
        });
      } catch (err) {
        console.warn('[Collabs] Error adding comment to Firestore:', err);
      }
    },
    [currentUser, user?.uid, showToast]
  );

  const handleDeleteComment = useCallback(
    async (postId: string, commentId: string) => {
      if (!user?.uid) return;
      try {
        await deleteFirestorePostComment(postId, commentId, user.uid);
        setPosts(prev =>
          prev.map(p => {
            if (p.id === postId) {
              const updated = (p.comments || []).filter(c => c.id !== commentId);
              return {
                ...p,
                comments: updated,
                commentsCount: Math.max(0, updated.length),
              };
            }
            return p;
          })
        );
        setActiveCommentsPost(prev => {
          if (prev && prev.id === postId) {
            const updated = (prev.comments || []).filter(c => c.id !== commentId);
            return {
              ...prev,
              comments: updated,
              commentsCount: Math.max(0, updated.length),
            };
          }
          return prev;
        });
        showToast('Comment removed 🗑️');
      } catch (err: any) {
        showToast(err?.message || 'Could not delete comment');
      }
    },
    [user?.uid, showToast]
  );

  const handleOpenComments = useCallback((post: CommunityPost) => {
    setActiveCommentsPost(post);
    setCommentsVisible(true);
  }, []);

  const handleOpenDiscussionComments = useCallback((disc: TrendingDiscussion) => {
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
  const handleAcceptRequest = useCallback(async (requestId: string) => {
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

    if (user?.uid) {
      try {
        await acceptFriendRequest(
          requestId,
          {
            uid: accepted.id,
            name: accepted.name,
            username: accepted.handle.replace('@', ''),
            avatar: accepted.avatar,
            bio: accepted.bio,
          },
          {
            uid: user.uid,
            name: currentUser.name,
            username: currentUser.handle.replace('@', ''),
            avatar: currentUser.avatar,
            bio: currentUser.bio,
          }
        );
      } catch (err) {
        console.warn('[Collabs] Error accepting friend request:', err);
      }
    }
    showToast(`${accepted.name} added to your circle! 🌱`);
  }, [requests, user?.uid, currentUser, showToast]);

  const handleDeclineRequest = useCallback(async (requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
    if (user?.uid) {
      try {
        await declineFriendRequest(requestId);
      } catch (err) {
        console.warn('[Collabs] Error declining request:', err);
      }
    }
    showToast('Invitation declined');
  }, [user?.uid, showToast]);

  const handleAddFriend = useCallback(async (userId: string) => {
    const target = suggestions.find(s => s.id === userId);
    if (target) {
      if (user?.uid) {
        try {
          await sendFriendRequest(
            {
              uid: user.uid,
              name: currentUser.name,
              username: currentUser.handle.replace('@', ''),
              avatar: currentUser.avatar,
              bio: currentUser.bio,
            },
            userId
          );
        } catch (err) {
          console.warn('[Collabs] Error sending friend request:', err);
        }
      }
      showToast(`Request sent to ${target.name}! 🌱`);
    }
  }, [suggestions, user?.uid, currentUser, showToast]);

  const handleOpenFriendChat = useCallback((friend: UserProfile) => {
    setSelectedFriend(friend);
    setFriendChatVisible(true);
  }, []);

  const handleOpenFriendProfile = useCallback((friend: UserProfile) => {
    setSelectedFriend(friend);
    setFriendProfileVisible(true);
  }, []);

  const handleRemoveFriend = useCallback(async (friendId: string) => {
    setFriends(prev => prev.filter(f => f.id !== friendId));
    if (user?.uid) {
      try {
        await removeFriendRelationship(user.uid, friendId);
      } catch (err) {
        console.warn('[Collabs] Error removing friend:', err);
      }
    }
    showToast('Friend removed from circle');
  }, [user?.uid, showToast]);

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
          currentUserId={user?.uid}
          onDeletePost={handleDeletePost}
          onReportPost={handleReportPost}
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
        currentUser={currentUser}
        onSubmit={handleCreatePost}
      />

      {/* MODAL: COMMENTS */}
      <CommentsModal
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        post={activeCommentsPost}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        currentUser={currentUser}
      />

      {/* FLOATING SUCCESS TOAST */}
      {toastMessage && (
        <View style={[styles.floatingToast, Shadows.md]}>
          <CheckCircle2 size={16} color="#365B45" strokeWidth={2.4} />
          <Text style={styles.floatingToastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  floatingToast: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8F1E8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
  },
  floatingToastText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#365B45',
  },
});
