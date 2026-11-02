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
  runTransaction,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { deleteCommunityImage } from './firebaseStorageService';
import {
  UserProfile,
  OnboardingResponses,
  MoodEntryDocument,
  WellnessActivityDocument,
  BurstedThoughtDocument,
  TaskDocument,
  HabitDocument,
  GlobalPostDocument,
  PostCommentDocument,
  GlobalMessageDocument,
  AIConversationDocument,
  AIMessageDocument,
  WellnessReportDocument,
  LanguagePreference,
  VoicePreference,
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
  limitCount = 30
): Promise<MoodEntryDocument[]> {
  try {
    const colRef = collection(db, 'moodEntries');
    let snap;
    try {
      const q = query(
        colRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      snap = await getDocs(q);
    } catch {
      const fallbackQ = query(colRef, where('userId', '==', userId), limit(limitCount));
      snap = await getDocs(fallbackQ);
    }
    const entries = snap.docs.map((d) => ({ id: d.id, ...(d.data() as MoodEntryDocument) }));
    return entries.sort((a, b) => {
      const timeA = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('[Firestore] Error fetching mood entries:', err?.message || err);
    }
    return [];
  }
}

export async function addWellnessActivity(
  activity: Omit<WellnessActivityDocument, 'id' | 'completedAt'>
): Promise<string> {
  const colRef = collection(db, 'wellnessActivities');
  const docRef = await addDoc(colRef, {
    ...activity,
    completedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserWellnessActivities(
  userId: string,
  limitCount = 30
): Promise<WellnessActivityDocument[]> {
  try {
    const colRef = collection(db, 'wellnessActivities');
    const q = query(colRef, where('userId', '==', userId), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as WellnessActivityDocument) }));
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('[Firestore] Error fetching wellness activities:', err?.message || err);
    }
    return [];
  }
}

export async function addBurstedThought(entry: {
  userId: string;
  thought: string;
  feelingId: string;
  feelingLabel: string;
  feelingEmoji: string;
  customNote?: string;
  sessionDurationSeconds: number;
}): Promise<string> {
  const colRef = collection(db, 'burstedThoughts');
  const docRef = await addDoc(colRef, {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserBurstedThoughts(
  userId: string,
  limitCount = 30
): Promise<BurstedThoughtDocument[]> {
  try {
    const colRef = collection(db, 'burstedThoughts');
    const q = query(
      colRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    let snap;
    try {
      snap = await getDocs(q);
    } catch {
      const fallbackQ = query(colRef, where('userId', '==', userId), limit(limitCount));
      snap = await getDocs(fallbackQ);
    }
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as BurstedThoughtDocument) }));
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('[Firestore] Error fetching bursted thoughts:', err?.message || err);
    }
    return [];
  }
}


// ============================================================================
// 3. TASKS & HABITS SERVICES
// ============================================================================

export async function getUserTasks(userId: string): Promise<TaskDocument[]> {
  try {
    const colRef = collection(db, 'tasks');
    let snap;
    try {
      const q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
      snap = await getDocs(q);
    } catch {
      const fallbackQ = query(colRef, where('userId', '==', userId));
      snap = await getDocs(fallbackQ);
    }
    const tasks = snap.docs.map((d) => ({ id: d.id, ...(d.data() as TaskDocument) }));
    return tasks.sort((a, b) => {
      const timeA = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('[Firestore] Error fetching tasks:', err?.message || err);
    }
    return [];
  }
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

export async function updateHabit(
  habitId: string,
  updates: Partial<HabitDocument>
): Promise<void> {
  const habitRef = doc(db, 'habits', habitId);
  await updateDoc(habitRef, updates);
}

// ============================================================================
// 4. COLLABS & COMMUNITY POSTS
// ============================================================================

export async function getGlobalPosts(limitCount = 20): Promise<GlobalPostDocument[]> {
  try {
    const colRef = collection(db, 'globalPosts');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as GlobalPostDocument) }));
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('[Firestore] Error fetching global posts:', err?.message || err);
    }
    return [];
  }
}

export async function createGlobalPost(
  post: Omit<GlobalPostDocument, 'id' | 'createdAt' | 'likesCount' | 'commentsCount' | 'likedByUids'>
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

export async function toggleLikePost(postId: string, userId: string, currentlyLiked: boolean): Promise<void> {
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

export async function getPostComments(postId: string): Promise<PostCommentDocument[]> {
  try {
    const colRef = collection(db, 'postComments');
    const q = query(colRef, where('postId', '==', postId), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as PostCommentDocument) }));
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('[Firestore] Error fetching post comments:', err?.message || err);
    }
    return [];
  }
}

export async function addPostComment(
  comment: Omit<PostCommentDocument, 'id' | 'createdAt'>
): Promise<string> {
  const colRef = collection(db, 'postComments');
  const docRef = await addDoc(colRef, {
    ...comment,
    createdAt: serverTimestamp(),
  });

  // Increment comments count on post
  const postRef = doc(db, 'globalPosts', comment.postId);
  await updateDoc(postRef, {
    commentsCount: increment(1),
  });

  return docRef.id;
}

// ============================================================================
// 5. GLOBAL MESSAGES & COMMUNITY LIVE CHAT
// ============================================================================

export function subscribeToGlobalMessages(
  onUpdate: (messages: GlobalMessageDocument[]) => void
): Unsubscribe {
  try {
    const colRef = collection(db, 'globalMessages');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as GlobalMessageDocument) }));
        onUpdate(msgs.reverse());
      },
      (error) => {
        console.warn('[Firestore] Global messages subscription error:', error);
      }
    );
  } catch (_) {
    return () => {};
  }
}

export async function sendGlobalMessage(
  msg: Omit<GlobalMessageDocument, 'id' | 'createdAt'>
): Promise<string> {
  const colRef = collection(db, 'globalMessages');
  const docRef = await addDoc(colRef, {
    ...msg,
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
  const currentUid = auth.currentUser?.uid || userId;
  try {
    const colRef = collection(db, 'aiConversations');
    let snap;
    try {
      const q = query(
        colRef,
        where('userId', '==', currentUid),
        orderBy('updatedAt', 'desc')
      );
      snap = await getDocs(q);
    } catch {
      const fallbackQ = query(colRef, where('userId', '==', currentUid));
      snap = await getDocs(fallbackQ);
    }

    if ((!snap || snap.empty) && currentUid && currentUid !== 'anonymous') {
      try {
        const userColRef = collection(db, 'users', currentUid, 'aiConversations');
        snap = await getDocs(userColRef);
      } catch {}
    }

    const docs = (snap?.docs || []).map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId || currentUid,
        title: data.title || 'Mindful Reflection',
        lastMessageSnippet: data.lastMessageSnippet || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });
    return docs.sort((a, b) => {
      const timeA = (a.updatedAt as any)?.toMillis ? (a.updatedAt as any).toMillis() : new Date(a.updatedAt || 0).getTime();
      const timeB = (b.updatedAt as any)?.toMillis ? (b.updatedAt as any).toMillis() : new Date(b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('[Firestore] Error getting AI conversations:', err?.message || err);
    }
    return [];
  }
}

export async function createAIConversation(
  userId: string,
  title: string
): Promise<string> {
  const currentUid = auth.currentUser?.uid || userId;
  const colRef = collection(db, 'aiConversations');
  const docRef = await addDoc(colRef, {
    userId: currentUid,
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Mirror in users/{userId}/aiConversations for strict UID-scoped subcollection rules
  if (currentUid && currentUid !== 'anonymous') {
    try {
      const userColRef = collection(db, 'users', currentUid, 'aiConversations');
      const userDocRef = doc(userColRef, docRef.id);
      await setDoc(userDocRef, {
        userId: currentUid,
        title,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {}
  }

  return docRef.id;
}

export async function deleteAIConversation(conversationId: string): Promise<void> {
  const convRef = doc(db, 'aiConversations', conversationId);
  await deleteDoc(convRef);
  const currentUid = auth.currentUser?.uid;
  if (currentUid) {
    try {
      await deleteDoc(doc(db, 'users', currentUid, 'aiConversations', conversationId));
    } catch {}
  }
}

export async function renameAIConversation(conversationId: string, newTitle: string): Promise<void> {
  const convRef = doc(db, 'aiConversations', conversationId);
  await updateDoc(convRef, {
    title: newTitle,
    updatedAt: serverTimestamp(),
  });
  const currentUid = auth.currentUser?.uid;
  if (currentUid) {
    try {
      await updateDoc(doc(db, 'users', currentUid, 'aiConversations', conversationId), {
        title: newTitle,
        updatedAt: serverTimestamp(),
      });
    } catch {}
  }
}

export async function saveAIMessage(
  conversationId: string,
  message: Omit<AIMessageDocument, 'id' | 'createdAt'>
): Promise<string> {
  const currentUid = auth.currentUser?.uid || message.userId || 'anonymous';
  const effectiveMessage = {
    ...message,
    userId: currentUid,
    conversationId,
    createdAt: serverTimestamp(),
  };

  const messagesColRef = collection(db, 'aiConversations', conversationId, 'messages');
  const docRef = await addDoc(messagesColRef, effectiveMessage);

  // Sync to users/{userId}/aiConversations/{conversationId}/messages
  if (currentUid && currentUid !== 'anonymous') {
    try {
      const userSubCol = collection(db, 'users', currentUid, 'aiConversations', conversationId, 'messages');
      await setDoc(doc(userSubCol, docRef.id), effectiveMessage);
    } catch {}
  }

  // Update snippet on parent conversation
  try {
    const convRef = doc(db, 'aiConversations', conversationId);
    await updateDoc(convRef, {
      lastMessageSnippet: message.text.slice(0, 60),
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    // If parent conversation was not created yet, proceed gracefully
  }

  return docRef.id;
}

export async function getAIMessages(conversationId: string): Promise<AIMessageDocument[]> {
  try {
    const messagesColRef = collection(db, 'aiConversations', conversationId, 'messages');
    let snap;
    try {
      const q = query(messagesColRef, orderBy('createdAt', 'asc'));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(messagesColRef);
    }
    const msgs = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        conversationId: data.conversationId || conversationId,
        userId: data.userId || '',
        sender: data.sender || 'user',
        text: data.text || '',
        emotion: data.emotion,
        createdAt: data.createdAt,
      } as AIMessageDocument;
    });
    return msgs.sort((a, b) => {
      const timeA = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : new Date(b.createdAt || 0).getTime();
      return timeA - timeB;
    });
  } catch (err) {
    console.warn('[Firestore] Error fetching AI messages:', err);
    return [];
  }
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
// 7. FRIENDS & SOCIAL GRAPH SERVICES
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

export interface FriendRequestItem {
  id: string;
  senderUid: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  senderBio?: string;
  receiverUid: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
}

export async function getIncomingFriendRequests(userId: string): Promise<FriendRequestItem[]> {
  try {
    const colRef = collection(db, 'friendRequests');
    const q = query(
      colRef,
      where('receiverUid', '==', userId),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        senderUid: data.senderUid || '',
        senderName: data.senderName || 'Bloom Member',
        senderUsername: data.senderUsername || 'member',
        senderAvatar: data.senderAvatar || data.senderPhotoURL || '',
        senderBio: data.senderBio || 'Bloom member 🌱',
        receiverUid: data.receiverUid || userId,
        status: data.status || 'pending',
        createdAt: data.createdAt,
      };
    });
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('[Firestore] getIncomingFriendRequests error:', err?.message || err);
    }
    return [];
  }
}

export async function getSentFriendRequests(userId: string): Promise<FriendRequestItem[]> {
  try {
    const colRef = collection(db, 'friendRequests');
    const q = query(
      colRef,
      where('senderUid', '==', userId),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        senderUid: data.senderUid || userId,
        senderName: data.senderName || '',
        senderUsername: data.senderUsername || '',
        senderAvatar: data.senderAvatar || '',
        receiverUid: data.receiverUid || '',
        status: data.status || 'pending',
        createdAt: data.createdAt,
      };
    });
  } catch (err: any) {
    return [];
  }
}

export async function sendFriendRequest(
  sender: { uid: string; name: string; username: string; avatar?: string; bio?: string },
  receiverUid: string
): Promise<string> {
  const colRef = collection(db, 'friendRequests');
  const docRef = await addDoc(colRef, {
    senderUid: sender.uid,
    senderName: sender.name,
    senderUsername: sender.username,
    senderAvatar: sender.avatar || '',
    senderBio: sender.bio || 'Bloom member 🌱',
    receiverUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function acceptFriendRequest(
  requestId: string,
  sender: { uid: string; name: string; username: string; avatar?: string; bio?: string },
  receiver: { uid: string; name: string; username: string; avatar?: string; bio?: string }
): Promise<void> {
  try {
    const reqRef = doc(db, 'friendRequests', requestId);
    await updateDoc(reqRef, { status: 'accepted', updatedAt: serverTimestamp() });
  } catch (_) {}

  const friendsCol = collection(db, 'friends');
  await addDoc(friendsCol, {
    userId: receiver.uid,
    friendUid: sender.uid,
    name: sender.name,
    handle: sender.username.startsWith('@') ? sender.username : `@${sender.username}`,
    avatar: sender.avatar || '',
    bio: sender.bio || 'Bloom member 🌱',
    createdAt: serverTimestamp(),
  });

  await addDoc(friendsCol, {
    userId: sender.uid,
    friendUid: receiver.uid,
    name: receiver.name,
    handle: receiver.username.startsWith('@') ? receiver.username : `@${receiver.username}`,
    avatar: receiver.avatar || '',
    bio: receiver.bio || 'Bloom member 🌱',
    createdAt: serverTimestamp(),
  });
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  try {
    const reqRef = doc(db, 'friendRequests', requestId);
    await updateDoc(reqRef, { status: 'declined', updatedAt: serverTimestamp() });
  } catch (_) {}
}

export async function removeFriendRelationship(userId: string, friendUid: string): Promise<void> {
  try {
    const colRef = collection(db, 'friends');
    const q1 = query(colRef, where('userId', '==', userId), where('friendUid', '==', friendUid));
    const snap1 = await getDocs(q1);
    snap1.docs.forEach(async (d) => {
      await deleteDoc(d.ref);
    });

    const q2 = query(colRef, where('userId', '==', friendUid), where('friendUid', '==', userId));
    const snap2 = await getDocs(q2);
    snap2.docs.forEach(async (d) => {
      await deleteDoc(d.ref);
    });
  } catch (err) {
    console.warn('[Firestore] Error removing friend:', err);
  }
}

export async function getDiscoverUsers(
  currentUserId: string,
  excludeUids: string[] = []
): Promise<any[]> {
  try {
    const colRef = collection(db, 'users');
    const q = query(colRef, limit(30));
    const snap = await getDocs(q);

    const allExclude = new Set([currentUserId, ...excludeUids]);
    const discovered: any[] = [];

    snap.docs.forEach((d) => {
      if (allExclude.has(d.id)) return;
      const data = d.data();
      const fullName = data.fullName || data.name || 'Bloom Member';
      const username = data.username || data.handle || `user_${d.id.slice(0, 5)}`;
      const initials = fullName
        .split(' ')
        .map((p: string) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      discovered.push({
        id: d.id,
        name: fullName,
        handle: username.startsWith('@') ? username : `@${username}`,
        avatar: data.photoURL || data.avatar || '',
        initials,
        bio: data.bio || data.userType || 'Mindful Student 🌱',
        streak: data.streakCount || 1,
        challengesJoined: 0,
        postsCount: 0,
        friendsCount: 0,
        isOnline: data.isOnline ?? false,
        isFriend: false,
        friendshipStatus: 'none',
        mutualInfo: data.userType ? `${data.userType.charAt(0).toUpperCase() + data.userType.slice(1)} • Campus peer` : 'Campus peer',
        tags: data.wellnessGoals || ['Mindfulness'],
        badges: [],
      });
    });

    return discovered;
  } catch (err: any) {
    console.warn('[Firestore] getDiscoverUsers error:', err);
    return [];
  }
}

export async function getUserJoinedChallengesCount(userId: string): Promise<number> {
  try {
    const colRef = collection(db, 'challengeParticipants');
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.size;
  } catch {
    return 0;
  }
}

export async function getFirestoreCommunityPosts(currentUserId?: string): Promise<any[]> {
  try {
    // Check globalPosts first (official collection in firestore.rules), fallback to posts
    let colRef = collection(db, 'globalPosts');
    let snap;
    try {
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(30));
      snap = await getDocs(q);
    } catch (e1) {
      try {
        colRef = collection(db, 'posts');
        const q = query(colRef, orderBy('createdAt', 'desc'), limit(30));
        snap = await getDocs(q);
      } catch (e2) {
        try {
          snap = await getDocs(query(collection(db, 'globalPosts'), limit(30)));
        } catch (e3) {
          return [];
        }
      }
    }

    if (snap.empty) {
      return [];
    }

    return snap.docs.map((d) => {
      const data = d.data();
      const likedBy = Array.isArray(data.likedByUids) ? data.likedByUids : [];
      const isLiked = currentUserId ? likedBy.includes(currentUserId) : false;
      const initials = (data.authorName || data.userName || 'BM')
        .split(' ')
        .map((p: string) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      let timeAgo = 'Just now';
      if (data.createdAt) {
        const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const diffMs = Date.now() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) timeAgo = 'Just now';
        else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
        else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
        else if (diffDays < 7) timeAgo = `${diffDays}d ago`;
        else timeAgo = date.toLocaleDateString();
      }

      return {
        id: d.id,
        userId: data.authorUid || data.userId || '',
        authorUid: data.authorUid || data.userId || '',
        userName: data.authorName || data.userName || 'Bloom Member',
        userHandle: data.authorHandle || data.userHandle || (data.authorUsername ? `@${data.authorUsername}` : '@member'),
        userAvatar: data.authorAvatar || data.userAvatar || data.authorPhotoURL || '',
        userInitials: initials,
        timeAgo,
        category: data.category || 'Wellness',
        content: data.content || '',
        image: data.image || data.imageUri || undefined,
        imagePath: data.imagePath || undefined,
        isPrivate: data.isPrivate ?? false,
        likesVisible: data.likesVisible ?? true,
        commentsEnabled: data.commentsEnabled ?? true,
        likesCount: typeof data.likesCount === 'number' ? data.likesCount : likedBy.length,
        isLiked,
        likedByUids: likedBy,
        commentsCount: typeof data.commentsCount === 'number' ? data.commentsCount : 0,
        comments: Array.isArray(data.comments) ? data.comments : [],
        sharesCount: data.sharesCount || 0,
        createdAt: data.createdAt,
      };
    });
  } catch (err) {
    console.warn('[Firestore] getFirestoreCommunityPosts error:', err);
    return [];
  }
}

export async function createFirestorePost(post: {
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar?: string;
  category: string;
  content: string;
  image?: string;
  imagePath?: string;
  isPrivate?: boolean;
  likesVisible?: boolean;
  commentsEnabled?: boolean;
}): Promise<string> {
  const colRef = collection(db, 'globalPosts');
  const docRef = await addDoc(colRef, {
    authorUid: post.userId,
    userId: post.userId,
    authorName: post.userName,
    userName: post.userName,
    authorHandle: post.userHandle,
    userHandle: post.userHandle,
    authorAvatar: post.userAvatar || '',
    userAvatar: post.userAvatar || '',
    category: post.category,
    content: post.content.trim(),
    image: post.image || null,
    imagePath: post.imagePath || null,
    isPrivate: post.isPrivate ?? false,
    likesVisible: post.likesVisible ?? true,
    commentsEnabled: post.commentsEnabled ?? true,
    likesCount: 0,
    likedByUids: [],
    commentsCount: 0,
    comments: [],
    sharesCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function toggleFirestorePostLike(postId: string, userId: string, nextLiked: boolean): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      let postRef = doc(db, 'globalPosts', postId);
      let snap = await transaction.get(postRef);
      if (!snap.exists()) {
        postRef = doc(db, 'posts', postId);
        snap = await transaction.get(postRef);
        if (!snap.exists()) return;
      }

      const data = snap.data();
      const likedBy: string[] = Array.isArray(data.likedByUids) ? data.likedByUids : [];
      const isCurrentlyLiked = likedBy.includes(userId);

      let updatedLikedBy: string[];
      if (nextLiked && !isCurrentlyLiked) {
        updatedLikedBy = [...likedBy, userId];
      } else if (!nextLiked && isCurrentlyLiked) {
        updatedLikedBy = likedBy.filter((uid) => uid !== userId);
      } else {
        return; // Prevent duplicate like actions
      }

      transaction.update(postRef, {
        likedByUids: updatedLikedBy,
        likesCount: updatedLikedBy.length,
      });
    });
  } catch (err) {
    console.warn('[Firestore] toggleLike error:', err);
  }
}

export async function addFirestorePostComment(postId: string, comment: {
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
}): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      let postRef = doc(db, 'globalPosts', postId);
      let snap = await transaction.get(postRef);
      if (!snap.exists()) {
        postRef = doc(db, 'posts', postId);
        snap = await transaction.get(postRef);
        if (!snap.exists()) return;
      }

      const data = snap.data();
      const currentComments = Array.isArray(data.comments) ? data.comments : [];
      const initials = (comment.userName || 'BM')
        .split(' ')
        .map((p: string) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const newComment = {
        id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: comment.userId,
        authorUid: comment.userId,
        userName: comment.userName,
        userAvatar: comment.userAvatar || '',
        userInitials: initials,
        text: comment.text.trim(),
        timestamp: 'Just now',
        createdAt: new Date().toISOString(),
      };

      const updatedComments = [...currentComments, newComment];
      transaction.update(postRef, {
        comments: updatedComments,
        commentsCount: updatedComments.length,
      });
    });
  } catch (err) {
    console.warn('[Firestore] addComment error:', err);
  }
}

export async function deleteFirestorePostComment(postId: string, commentId: string, userId: string): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      let postRef = doc(db, 'globalPosts', postId);
      let snap = await transaction.get(postRef);
      if (!snap.exists()) {
        postRef = doc(db, 'posts', postId);
        snap = await transaction.get(postRef);
        if (!snap.exists()) return;
      }

      const data = snap.data();
      const currentComments = Array.isArray(data.comments) ? data.comments : [];
      const target = currentComments.find((c: any) => c.id === commentId);
      if (!target) return;

      if (target.userId !== userId && target.authorUid !== userId) {
        throw new Error('Permission denied: You can only delete your own comment.');
      }

      const updatedComments = currentComments.filter((c: any) => c.id !== commentId);
      transaction.update(postRef, {
        comments: updatedComments,
        commentsCount: Math.max(0, updatedComments.length),
      });
    });
  } catch (err) {
    console.warn('[Firestore] deleteComment error:', err);
  }
}

export async function deleteFirestorePost(postId: string, userId: string): Promise<void> {
  let postRef = doc(db, 'globalPosts', postId);
  let snap = await getDoc(postRef);
  if (!snap.exists()) {
    postRef = doc(db, 'posts', postId);
    snap = await getDoc(postRef);
  }
  if (!snap.exists()) return;

  const data = snap.data();
  if (data.authorUid !== userId && data.userId !== userId) {
    throw new Error('Permission denied: You can only delete your own reflection.');
  }

  // Delete image from storage if uploaded
  if (data.imagePath) {
    await deleteCommunityImage(data.imagePath);
  }

  await deleteDoc(postRef);
}

export async function reportFirestorePost(postId: string, reporterUid: string, reason: string): Promise<string> {
  const colRef = collection(db, 'postReports');
  const docRef = await addDoc(colRef, {
    postId,
    reporterUid,
    reason: reason.trim(),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ============================================================================
// GLOBAL LIVE CHAT & POLLS SERVICES
// ============================================================================

export function subscribeToGlobalChatMessages(
  currentUserId: string,
  onUpdate: (messages: any[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  try {
    const colRef = collection(db, 'globalMessages');
    const q = query(colRef, orderBy('createdAt', 'asc'), limit(60));
    return onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs.map((d) => {
          const data = d.data();
          const senderUid = data.authorUid || data.senderId || '';
          const isMe = senderUid === currentUserId;

          let time = 'Just now';
          if (data.createdAt) {
            const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }

          // Reactions
          const reactions = data.reactions || {};
          const userReactions = data.userReactions || {};
          const myEmoji = userReactions[currentUserId];
          const myReactions = myEmoji ? [myEmoji] : [];

          // Poll Data
          let poll = undefined;
          if (data.pollData) {
            const p = data.pollData;
            poll = {
              id: p.id || d.id,
              question: p.question,
              options: Array.isArray(p.options) ? p.options : [],
              totalVotes: typeof p.totalVotes === 'number' ? p.totalVotes : 0,
              userVotedOptionId: p.voters ? p.voters[currentUserId] : undefined,
            };
          }

          return {
            id: d.id,
            senderId: senderUid,
            senderName: isMe ? 'You' : (data.authorName || data.senderName || 'Bloom Member'),
            senderHandle: data.authorHandle || data.senderHandle || '@member',
            senderInitials: (data.authorName || data.senderName || 'BM')
              .split(' ')
              .map((p: string) => p[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
            text: data.text || '',
            image: data.image || data.mediaUri || undefined,
            video: data.video || undefined,
            fileDoc: data.fileDoc || undefined,
            audioNote: data.audioNote || undefined,
            timestamp: time,
            isMe,
            reactions,
            myReactions,
            poll,
          };
        });
        onUpdate(msgs);
      },
      (error) => {
        console.warn('[Firestore] Global chat subscription error:', error?.message || error);
        onError?.(error);
      }
    );
  } catch (e) {
    onError?.(e);
    return () => {};
  }
}

export async function sendFirestoreChatMessage(message: {
  senderId: string;
  senderName: string;
  senderHandle?: string;
  text: string;
  image?: string;
  video?: string;
  fileDoc?: { name: string; size: string };
  audioNote?: { duration: string };
}): Promise<string> {
  const colRef = collection(db, 'globalMessages');
  const docRef = await addDoc(colRef, {
    authorUid: message.senderId,
    senderId: message.senderId,
    authorName: message.senderName,
    senderName: message.senderName,
    authorHandle: message.senderHandle || '@member',
    senderHandle: message.senderHandle || '@member',
    text: message.text.trim(),
    image: message.image || null,
    video: message.video || null,
    fileDoc: message.fileDoc || null,
    audioNote: message.audioNote || null,
    reactions: {},
    userReactions: {},
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function createFirestoreChatPoll(poll: {
  authorUid: string;
  authorName: string;
  authorHandle?: string;
  question: string;
  options: string[];
}): Promise<string> {
  const colRef = collection(db, 'globalMessages');
  const pollOptions = poll.options.map((optText, idx) => ({
    id: `opt_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    text: optText.trim(),
    votes: 0,
  }));

  const docRef = await addDoc(colRef, {
    authorUid: poll.authorUid,
    senderId: poll.authorUid,
    authorName: poll.authorName,
    senderName: poll.authorName,
    authorHandle: poll.authorHandle || '@member',
    senderHandle: poll.authorHandle || '@member',
    text: `📊 Community Poll: ${poll.question.trim()}`,
    pollData: {
      id: `poll_${Date.now()}`,
      question: poll.question.trim(),
      options: pollOptions,
      totalVotes: 0,
      voters: {},
    },
    reactions: { '📊': 1 },
    userReactions: { [poll.authorUid]: '📊' },
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function voteFirestoreChatPoll(messageId: string, userId: string, optionId: string): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const msgRef = doc(db, 'globalMessages', messageId);
      const snap = await transaction.get(msgRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const pollData = data.pollData;
      if (!pollData || !Array.isArray(pollData.options)) return;

      const voters = pollData.voters || {};
      if (voters[userId]) {
        // User has already voted in this poll (one vote per user enforcement)
        return;
      }

      const updatedOptions = pollData.options.map((opt: any) => {
        if (opt.id === optionId) {
          return { ...opt, votes: (opt.votes || 0) + 1 };
        }
        return opt;
      });

      const newTotal = (pollData.totalVotes || 0) + 1;
      const updatedVoters = { ...voters, [userId]: optionId };

      transaction.update(msgRef, {
        pollData: {
          ...pollData,
          options: updatedOptions,
          totalVotes: newTotal,
          voters: updatedVoters,
        },
      });
    });
  } catch (err) {
    console.warn('[Firestore] votePoll error:', err);
  }
}

export async function toggleFirestoreChatReaction(messageId: string, userId: string, emoji: string): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const msgRef = doc(db, 'globalMessages', messageId);
      const snap = await transaction.get(msgRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const reactions = { ...(data.reactions || {}) };
      const userReactions = { ...(data.userReactions || {}) };
      const currentEmoji = userReactions[userId];

      if (currentEmoji === emoji) {
        // User clicked same emoji -> Remove reaction
        reactions[emoji] = Math.max(0, (reactions[emoji] || 1) - 1);
        if (reactions[emoji] === 0) delete reactions[emoji];
        delete userReactions[userId];
      } else {
        // If user already had another reaction, decrement it
        if (currentEmoji && reactions[currentEmoji]) {
          reactions[currentEmoji] = Math.max(0, reactions[currentEmoji] - 1);
          if (reactions[currentEmoji] === 0) delete reactions[currentEmoji];
        }
        // Increment new reaction
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        userReactions[userId] = emoji;
      }

      transaction.update(msgRef, {
        reactions,
        userReactions,
      });
    });
  } catch (err) {
    console.warn('[Firestore] toggleReaction error:', err);
  }
}

export async function deleteFirestoreChatMessage(messageId: string, userId: string): Promise<void> {
  const msgRef = doc(db, 'globalMessages', messageId);
  const snap = await getDoc(msgRef);
  if (!snap.exists()) return;

  const data = snap.data();
  if (data.authorUid !== userId && data.senderId !== userId) {
    throw new Error('Permission denied: You can only delete your own chat message.');
  }

  await deleteDoc(msgRef);
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

// ============================================================================
// 15. WELLNESS REPORTS & USER PREFERENCES
// ============================================================================

export async function saveWellnessReport(report: WellnessReportDocument): Promise<string> {
  try {
    const colRef = collection(db, 'wellnessReports');
    const docRef = report.id ? doc(db, 'wellnessReports', report.id) : doc(colRef);
    const dataToSave = {
      ...report,
      id: docRef.id,
      generatedAt: report.generatedAt || serverTimestamp(),
    };
    await setDoc(docRef, dataToSave, { merge: true });
    return docRef.id;
  } catch (err: any) {
    console.warn('[Firestore] Error saving wellness report:', err?.message || err);
    throw err;
  }
}

export async function getUserWellnessReports(userId: string): Promise<WellnessReportDocument[]> {
  try {
    const colRef = collection(db, 'wellnessReports');
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    const reports = snap.docs.map((d) => ({ id: d.id, ...(d.data() as WellnessReportDocument) }));
    return reports.sort((a, b) => {
      const tA = (a.generatedAt as any)?.toMillis ? (a.generatedAt as any).toMillis() : new Date(a.generatedAt || 0).getTime();
      const tB = (b.generatedAt as any)?.toMillis ? (b.generatedAt as any).toMillis() : new Date(b.generatedAt || 0).getTime();
      return tB - tA;
    });
  } catch (err: any) {
    if (err?.code !== 'permission-denied') {
      console.warn('[Firestore] Error fetching wellness reports:', err?.message || err);
    }
    return [];
  }
}

export async function getWellnessReportById(reportId: string): Promise<WellnessReportDocument | null> {
  try {
    const docRef = doc(db, 'wellnessReports', reportId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as WellnessReportDocument) };
    }
    return null;
  } catch (err: any) {
    console.warn('[Firestore] Error fetching wellness report by ID:', err?.message || err);
    return null;
  }
}

export async function deleteWellnessReport(reportId: string): Promise<void> {
  try {
    const docRef = doc(db, 'wellnessReports', reportId);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.warn('[Firestore] Error deleting wellness report:', err?.message || err);
    throw err;
  }
}

export async function updateUserPreferences(
  userId: string,
  prefs: { languagePreference?: LanguagePreference; voicePreference?: VoicePreference }
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...prefs,
      updatedAt: serverTimestamp(),
    });
  } catch (err: any) {
    console.warn('[Firestore] Error updating user preferences:', err?.message || err);
    throw err;
  }
}

export async function getUserFocusSessions(userId: string): Promise<any[]> {
  try {
    const colRef = collection(db, 'focusSessions');
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}
