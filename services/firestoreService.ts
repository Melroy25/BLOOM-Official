// Centralized Firestore Services for BLOOM
// Handles Users, Onboarding, Mood Entries, Tasks, Habits,
// Collabs / Bloom Circle, Global Messages, and AI Conversations.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  UserProfile,
  OnboardingResponses,
  MoodEntryDocument,
  TaskDocument,
  HabitDocument,
  GlobalPostDocument,
  PostCommentDocument,
  GlobalMessageDocument,
  AIConversationDocument,
  AIMessageDocument,
} from '../types';

// ============================================================================
// 1. USER PROFILE & ONBOARDING SERVICES
// ============================================================================

/**
 * Creates or overwrites a user profile document using the Firebase Auth UID.
 */
export async function createUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const now = serverTimestamp();

  const profileData: Partial<UserProfile> = {
    uid,
    fullName: data.fullName || 'Bloom Member',
    email: data.email || '',
    photoURL: data.photoURL || null,
    username: data.username || `bloomer_${uid.slice(0, 6)}`,
    onboardingCompleted: data.onboardingCompleted ?? false,
    userType: data.userType || 'student',
    currentMood: data.currentMood || 'Calm',
    wellnessGoals: data.wellnessGoals || ['Mindful balance'],
    whyUsingBloom: data.whyUsingBloom || ['Mental wellness'],
    helpImprove: data.helpImprove || ['Focus and daily habits'],
    notificationPreferences: data.notificationPreferences || {
      dailyReminders: true,
      streakAlerts: true,
      communityUpdates: true,
    },
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(userRef, profileData, { merge: true });
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('[Firestore] Profile write:', err?.message || err);
    }
  }
}

/**
 * Reads a user profile by UID.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return null;
    }
    return snap.data() as UserProfile;
  } catch (error: any) {
    if (error?.code !== 'permission-denied') {
      console.warn('[Firestore] Error fetching user profile:', error?.message || error);
    }
    return null;
  }
}

/**
 * Updates partial user profile fields.
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Completes the BLOOM onboarding flow and saves responses to user's document.
 */
export async function completeOnboarding(
  uid: string,
  responses: OnboardingResponses
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await setDoc(
    userRef,
    {
      uid,
      fullName: responses.fullName.trim() || 'Bloom Member',
      currentMood: responses.currentMood,
      whyUsingBloom: responses.reasons,
      userType: responses.userType,
      wellnessGoals: responses.wellnessGoals,
      helpImprove: responses.improvements,
      onboardingCompleted: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Subscribes to real-time updates for a user's profile.
 */
export function subscribeToUserProfile(
  uid: string,
  onUpdate: (profile: UserProfile | null) => void
): Unsubscribe {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as UserProfile);
      } else {
        onUpdate(null);
      }
    },
    (error: any) => {
      if (error?.code !== 'permission-denied') {
        console.warn('[Firestore] Profile subscription error:', error?.message || error);
      }
      onUpdate(null);
    }
  );
}

// ============================================================================
// 2. MOOD TRACKING SERVICES
// ============================================================================

export async function addMoodEntry(
  entry: Omit<MoodEntryDocument, 'createdAt'>
): Promise<string> {
  const colRef = collection(db, 'moodEntries');
  const docRef = await addDoc(colRef, {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserMoodEntries(
  userId: string,
  limitCount = 14
): Promise<MoodEntryDocument[]> {
  const colRef = collection(db, 'moodEntries');
  const q = query(
    colRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as MoodEntryDocument) }));
}

// ============================================================================
// 3. TASKS & HABITS SERVICES
// ============================================================================

export async function getUserTasks(userId: string): Promise<TaskDocument[]> {
  const colRef = collection(db, 'tasks');
  const q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as TaskDocument) }));
}

export async function addTask(
  task: Omit<TaskDocument, 'createdAt' | 'updatedAt'>
): Promise<string> {
  const colRef = collection(db, 'tasks');
  const docRef = await addDoc(colRef, {
    ...task,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTask(
  taskId: string,
  updates: Partial<TaskDocument>
): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);
  await deleteDoc(taskRef);
}

export async function getUserHabits(userId: string): Promise<HabitDocument[]> {
  const colRef = collection(db, 'habits');
  const q = query(colRef, where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as HabitDocument) }));
}

export async function addHabit(
  habit: Omit<HabitDocument, 'createdAt'>
): Promise<string> {
  const colRef = collection(db, 'habits');
  const docRef = await addDoc(colRef, {
    ...habit,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ============================================================================
// 4. GLOBAL POSTS & BLOOM CIRCLE SERVICES
// ============================================================================

export async function getGlobalPosts(limitCount = 20): Promise<GlobalPostDocument[]> {
  try {
    const colRef = collection(db, 'globalPosts');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as GlobalPostDocument) }));
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('[Firestore] Error fetching posts:', err?.message || err);
    }
    return [];
  }
}

export async function createGlobalPost(
  post: Omit<GlobalPostDocument, 'createdAt' | 'likesCount' | 'commentsCount'>
): Promise<string> {
  const colRef = collection(db, 'globalPosts');
  const docRef = await addDoc(colRef, {
    ...post,
    likesCount: 0,
    commentsCount: 0,
    likedByUids: [],
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function toggleLikePost(
  postId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<void> {
  const postRef = doc(db, 'globalPosts', postId);
  if (currentlyLiked) {
    await updateDoc(postRef, {
      likedByUids: arrayRemove(userId),
      likesCount: increment(-1),
    });
  } else {
    await updateDoc(postRef, {
      likedByUids: arrayUnion(userId),
      likesCount: increment(1),
    });
  }
}

export async function addPostComment(
  postId: string,
  comment: Omit<PostCommentDocument, 'createdAt'>
): Promise<string> {
  const colRef = collection(db, 'postComments');
  const docRef = await addDoc(colRef, {
    ...comment,
    postId,
    createdAt: serverTimestamp(),
  });

  // Increment comment count on post
  const postRef = doc(db, 'globalPosts', postId);
  await updateDoc(postRef, {
    commentsCount: increment(1),
  });

  return docRef.id;
}

// ============================================================================
// 5. GLOBAL MESSAGES (COMMUNITY LIVE CHAT)
// ============================================================================

export function subscribeToGlobalMessages(
  onUpdate: (messages: GlobalMessageDocument[]) => void,
  messageLimit = 50
): Unsubscribe {
  const colRef = collection(db, 'globalMessages');
  const q = query(colRef, orderBy('createdAt', 'asc'), limit(messageLimit));

  return onSnapshot(
    q,
    (snap) => {
      const messages = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as GlobalMessageDocument),
      }));
      onUpdate(messages);
    },
    (error: any) => {
      if (error?.code !== 'permission-denied') {
        console.warn('[Firestore] Global messages subscription error:', error?.message || error);
      }
    }
  );
}

export async function sendGlobalMessage(
  message: Omit<GlobalMessageDocument, 'createdAt'>
): Promise<string> {
  const colRef = collection(db, 'globalMessages');
  const docRef = await addDoc(colRef, {
    ...message,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ============================================================================
// 6. AI CONVERSATIONS & MESSAGES
// ============================================================================

export async function getUserAIConversations(
  userId: string
): Promise<AIConversationDocument[]> {
  const colRef = collection(db, 'aiConversations');
  const q = query(
    colRef,
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      title: data.title,
      lastMessageSnippet: data.lastMessageSnippet,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });
}

export async function createAIConversation(
  userId: string,
  title: string
): Promise<string> {
  const colRef = collection(db, 'aiConversations');
  const docRef = await addDoc(colRef, {
    userId,
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteAIConversation(conversationId: string): Promise<void> {
  const convRef = doc(db, 'aiConversations', conversationId);
  await deleteDoc(convRef);
  // Optional: delete submessages if desired
}

export async function saveAIMessage(
  conversationId: string,
  message: Omit<AIMessageDocument, 'id' | 'createdAt'>
): Promise<string> {
  const messagesColRef = collection(db, 'aiConversations', conversationId, 'messages');
  const docRef = await addDoc(messagesColRef, {
    ...message,
    conversationId,
    createdAt: serverTimestamp(),
  });

  // Update snippet on parent conversation
  const convRef = doc(db, 'aiConversations', conversationId);
  await updateDoc(convRef, {
    lastMessageSnippet: message.text.slice(0, 60),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export function subscribeToAIMessages(
  conversationId: string,
  onUpdate: (messages: AIMessageDocument[]) => void
): Unsubscribe {
  const messagesColRef = collection(db, 'aiConversations', conversationId, 'messages');
  const q = query(messagesColRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snap) => {
      const msgs: AIMessageDocument[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          conversationId: data.conversationId || conversationId,
          userId: data.userId || '',
          sender: data.sender || 'user',
          text: data.text || '',
          emotion: data.emotion,
          createdAt: data.createdAt,
        };
      });
      onUpdate(msgs);
    },
    (error) => {
      console.warn('[Firestore] AI messages subscription error:', error);
    }
  );
}

// ============================================================================
// 6. FRIENDS & SOCIAL GRAPH SERVICES
// ============================================================================

export interface FriendDocument {
  id?: string;
  userId: string;
  friendUid: string;
  name: string;
  handle: string;
  avatar?: string;
  initials?: string;
  bio?: string;
  createdAt: any;
}

export async function getUserFriends(userId: string): Promise<FriendDocument[]> {
  try {
    const colRef = collection(db, 'friends');
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as FriendDocument) }));
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('[Firestore] Error fetching friends:', err?.message || err);
    }
    return [];
  }
}

export async function addFriendToFirestore(
  userId: string,
  friendUid: string,
  friendData: { name: string; handle: string; avatar?: string; bio?: string }
): Promise<string> {
  const colRef = collection(db, 'friends');
  const docRef = await addDoc(colRef, {
    userId,
    friendUid,
    name: friendData.name,
    handle: friendData.handle,
    avatar: friendData.avatar || '',
    bio: friendData.bio || 'Bloom member 🌱',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function removeFriendFromFirestore(friendDocId: string): Promise<void> {
  const docRef = doc(db, 'friends', friendDocId);
  await deleteDoc(docRef);
}

export async function getCommunityMembers(currentUserId: string, limitCount = 10): Promise<UserProfile[]> {
  try {
    const colRef = collection(db, 'users');
    const q = query(colRef, limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs
      .filter((d) => d.id !== currentUserId)
      .map((d) => d.data() as UserProfile);
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('[Firestore] Error fetching community members:', err?.message || err);
    }
    return [];
  }
}

export async function setUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp(),
    });
  } catch (_) {}
}

export function subscribeToOnlineUsers(
  onUpdate: (users: UserProfile[]) => void
): Unsubscribe {
  try {
    const colRef = collection(db, 'users');
    const q = query(colRef, where('isOnline', '==', true), limit(20));
    return onSnapshot(
      q,
      (snap) => {
        const users = snap.docs.map((d) => d.data() as UserProfile);
        onUpdate(users);
      },
      () => {
        onUpdate([]);
      }
    );
  } catch (_) {
    return () => {};
  }
}
