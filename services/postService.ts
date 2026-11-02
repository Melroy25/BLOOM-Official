import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  getFirestoreCommunityPosts,
  createFirestorePost,
  toggleFirestorePostLike,
  addFirestorePostComment,
  deleteFirestorePost,
} from './firestoreService';

export interface CreatePostPayload {
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
}

/**
 * Fetch global community reflections with multi-level fallback
 * to prevent any uncaught Firebase permissions or index errors.
 */
export async function getCommunityPosts(currentUserId?: string): Promise<any[]> {
  try {
    const uid = currentUserId || auth.currentUser?.uid;
    return await getFirestoreCommunityPosts(uid);
  } catch (error) {
    console.warn('[PostService] Error getting community posts:', error);
    return [];
  }
}

/**
 * Create a new global reflection post in Firestore with guaranteed fields
 */
export async function createCommunityPost(post: CreatePostPayload): Promise<string> {
  const verifiedUid = post.userId || auth.currentUser?.uid;
  if (!verifiedUid) {
    throw new Error('You must be signed in to share a community post.');
  }

  const payload = {
    ...post,
    userId: verifiedUid,
    content: (post.content || '').trim(),
    userName: post.userName || auth.currentUser?.displayName || 'Bloom Member',
    userHandle: post.userHandle || '@member',
    category: post.category || 'Mindfulness',
  };

  try {
    return await createFirestorePost(payload);
  } catch (error: any) {
    console.warn('[PostService] Error creating community post in globalPosts:', error);
    // Fallback to 'posts' collection if globalPosts rejected
    try {
      const colRef = collection(db, 'posts');
      const docRef = await addDoc(colRef, {
        authorUid: verifiedUid,
        userId: verifiedUid,
        authorName: payload.userName,
        userName: payload.userName,
        authorHandle: payload.userHandle,
        userHandle: payload.userHandle,
        authorAvatar: payload.userAvatar || '',
        category: payload.category,
        content: payload.content,
        image: payload.image || null,
        imagePath: payload.imagePath || null,
        isPrivate: payload.isPrivate ?? false,
        likesVisible: payload.likesVisible ?? true,
        commentsEnabled: payload.commentsEnabled ?? true,
        likesCount: 0,
        likedByUids: [],
        commentsCount: 0,
        comments: [],
        sharesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (fallbackError: any) {
      console.warn('[PostService] Fallback posts creation also failed:', fallbackError);
      throw fallbackError;
    }
  }
}

export {
  toggleFirestorePostLike as togglePostLike,
  addFirestorePostComment as addPostComment,
  deleteFirestorePost as deletePost,
};
