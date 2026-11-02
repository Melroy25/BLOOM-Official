import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  date: string;
  time: string;
  wordCount: number;
  tags: string[];
  category: 'all' | 'pinned' | 'recent' | 'study';
  isPinned?: boolean;
  callout?: string;
  checklist?: ChecklistItem[];
  updatedAt: number;
  userId?: string;
}

export const initialDocuments: DocumentItem[] = [];

let documentsStore: DocumentItem[] = [];
const listeners = new Set<() => void>();

export const getDocuments = (): DocumentItem[] => documentsStore;

export const getDocumentById = (id: string): DocumentItem | undefined =>
  documentsStore.find((d) => d.id === id);

export const addDocument = async (newDoc: DocumentItem): Promise<void> => {
  const uid = auth.currentUser?.uid;
  documentsStore = [newDoc, ...documentsStore.filter((d) => d.id !== newDoc.id)];
  listeners.forEach((l) => l());

  if (uid) {
    try {
      const docRef = doc(db, 'documents', newDoc.id);
      await setDoc(docRef, {
        ...newDoc,
        userId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[Documents] Error saving document to Firestore:', err);
    }
  }
};

export const updateDocument = async (
  id: string,
  updates: Partial<DocumentItem>
): Promise<void> => {
  documentsStore = documentsStore.map((d) =>
    d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
  );
  listeners.forEach((l) => l());

  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const docRef = doc(db, 'documents', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[Documents] Error updating document in Firestore:', err);
    }
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  documentsStore = documentsStore.filter((d) => d.id !== id);
  listeners.forEach((l) => l());

  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const docRef = doc(db, 'documents', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[Documents] Error deleting document in Firestore:', err);
    }
  }
};

export const useDocumentsStore = (): DocumentItem[] => {
  const [docs, setDocs] = useState<DocumentItem[]>(documentsStore);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setDocs(documentsStore);
      return;
    }

    const colRef = collection(db, 'documents');
    const q = query(colRef, where('userId', '==', uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: DocumentItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || 'Untitled',
            content: data.content || '',
            date: data.date || '',
            time: data.time || '',
            wordCount: data.wordCount || 0,
            tags: data.tags || [],
            category: data.category || 'recent',
            isPinned: !!data.isPinned,
            callout: data.callout,
            checklist: data.checklist || [],
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
            userId: data.userId,
          };
        });

        fetched.sort((a, b) => b.updatedAt - a.updatedAt);
        documentsStore = fetched;
        setDocs(fetched);
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          console.warn('[Documents] Firestore subscription error:', error);
        }
      }
    );

    const memoryHandler = () => setDocs([...documentsStore]);
    listeners.add(memoryHandler);

    return () => {
      unsubscribe();
      listeners.delete(memoryHandler);
    };
  }, []);

  return docs;
};
