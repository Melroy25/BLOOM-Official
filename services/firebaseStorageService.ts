/**
 * services/firebaseStorageService.ts
 * Production-ready Firebase Storage service for BLOOM community media uploads.
 * Handles React Native and Web local URIs, size/type validation, and cleanup.
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from './firebase';
import { Platform } from 'react-native';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadResult {
  downloadUrl: string;
  storagePath: string;
}

/**
 * Converts a local file or blob URI into a Blob for Firebase Storage upload.
 */
async function uriToBlob(uri: string): Promise<Blob> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return await response.blob();
  }

  // React Native environment
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function () {
      reject(new Error('Failed to read image from local storage.'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

/**
 * Uploads a community reflection photo to Firebase Storage.
 * Validates maximum file size (5MB).
 */
export async function uploadCommunityImage(
  uri: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  if (!userId) {
    throw new Error('Authentication required: Cannot upload image without user ID.');
  }

  // If already an HTTP/HTTPS remote URL (preset or external), return as-is
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return {
      downloadUrl: uri,
      storagePath: '',
    };
  }

  const blob = await uriToBlob(uri);

  // File size validation
  if (blob.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image exceeds the maximum allowed size of 5 MB.');
  }

  const fileExt = uri.includes('.png') ? 'png' : 'jpg';
  const storagePath = `community_posts/${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, blob, {
    contentType: fileExt === 'png' ? 'image/png' : 'image/jpeg',
    customMetadata: {
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
    },
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const progress = snapshot.bytesTransferred / snapshot.totalBytes;
          onProgress(progress);
        }
      },
      (error) => {
        console.warn('[FirebaseStorage] Upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            storagePath,
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Deletes a community reflection image from Firebase Storage.
 */
export async function deleteCommunityImage(storagePath: string): Promise<void> {
  if (!storagePath || storagePath.startsWith('http')) return;
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (err: any) {
    // If not found or permission error, log warning without crashing
    if (err?.code !== 'storage/object-not-found') {
      console.warn('[FirebaseStorage] Error deleting image:', err?.message || err);
    }
  }
}
