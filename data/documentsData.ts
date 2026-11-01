import { useState, useEffect } from 'react';

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
}

export const initialDocuments: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Daily Gratitude',
    content:
      'Today was surprisingly calm. I took time to breathe between lectures, sat in the campus garden, and noticed the autumn leaves falling.\n\nThree simple things that brought warmth today:\n1. A warm cup of chamomile tea before morning study.\n2. A friendly smile from a classmate in the library.\n3. The quiet 15 minutes of uninterrupted reading at sunset.',
    date: 'October 24',
    time: '9:42 AM',
    wordCount: 142,
    tags: ['✨ Gratitude', 'Reflection'],
    category: 'pinned',
    isPinned: true,
    callout: 'Gratitude turns what we have into enough. Keep noticing the small anchors of peace.',
    checklist: [
      { id: 'c1', text: 'Drink 2L of water today', done: true },
      { id: 'c2', text: '10-minute mindful breathing break', done: true },
      { id: 'c3', text: 'Evening gratitude journaling', done: false },
    ],
    updatedAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'doc-2',
    title: 'Exam Reflection',
    content:
      'Preparing for the upcoming assessments taught me that consistency matters more than last-minute cramming. I managed to review 3 modules with box-breathing breaks.\n\nKey takeaways:\n- Active recall works 10x better than passive re-reading.\n- 5-minute movement breaks keep energy levels steady.',
    date: 'October 23',
    time: '3:15 PM',
    wordCount: 98,
    tags: ['Study Logs', 'Reflection'],
    category: 'study',
    isPinned: true,
    callout: 'Your pace is yours to honor. Progress over perfection every single day.',
    checklist: [
      { id: 'c4', text: 'Complete Chapter 4 practice test', done: true },
      { id: 'c5', text: 'Summarize economics lecture notes', done: false },
    ],
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'doc-3',
    title: 'Morning Thoughts',
    content:
      'Woke up at 6:30 AM feeling refreshed. The early morning stillness is so restorative before notifications start rolling in.\n\nToday I choose to focus on single-tasking rather than juggling multiple browser tabs at once.',
    date: 'October 22',
    time: '7:10 AM',
    wordCount: 75,
    tags: ['Recent', 'Morning'],
    category: 'recent',
    isPinned: false,
    callout: 'Start each morning with clarity, not hurry.',
    checklist: [
      { id: 'c6', text: 'Morning stretch & sunlight', done: true },
      { id: 'c7', text: 'Plan top 3 daily priorities', done: true },
    ],
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'doc-4',
    title: 'Goals & Intentions',
    content:
      'Monthly wellness focus:\n- Prioritize 8 hours of sleep per night.\n- Maintain screen time under 3 hours daily.\n- Join 2 group wellness challenges with friends.\n- Complete assignments 24 hours prior to deadline.',
    date: 'October 20',
    time: '11:20 AM',
    wordCount: 64,
    tags: ['Study Logs', 'Goals'],
    category: 'study',
    isPinned: false,
    callout: 'Goals give direction, but habits create the destination.',
    checklist: [
      { id: 'c8', text: 'Set phone bedtime schedule', done: true },
      { id: 'c9', text: 'Sign up for community challenge', done: false },
    ],
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'doc-5',
    title: 'Unsent Letter',
    content:
      'Writing this down to let go of unresolved frustration. You do not have to carry what was never meant for you to hold onto.\n\nForgiving does not mean forgetting; it means liberating your own mental bandwidth for things that truly matter.',
    date: 'October 18',
    time: '8:45 PM',
    wordCount: 88,
    tags: ['Recent', 'Healing'],
    category: 'recent',
    isPinned: false,
    callout: 'Release what no longer serves your growth and inner peace.',
    checklist: [],
    updatedAt: Date.now() - 86400000 * 6,
  },
];

// Reactive in-memory store for instant state synchronization across screens
let documentsStore: DocumentItem[] = [...initialDocuments];
const listeners = new Set<() => void>();

export const getDocuments = (): DocumentItem[] => documentsStore;

export const getDocumentById = (id: string): DocumentItem | undefined =>
  documentsStore.find(doc => doc.id === id);

export const addDocument = (newDoc: DocumentItem): void => {
  documentsStore = [newDoc, ...documentsStore];
  listeners.forEach(listener => listener());
};

export const updateDocument = (
  id: string,
  updates: Partial<DocumentItem>
): void => {
  documentsStore = documentsStore.map(doc =>
    doc.id === id
      ? {
          ...doc,
          ...updates,
          updatedAt: Date.now(),
        }
      : doc
  );
  listeners.forEach(listener => listener());
};

export const deleteDocument = (id: string): void => {
  documentsStore = documentsStore.filter(doc => doc.id !== id);
  listeners.forEach(listener => listener());
};

export const useDocumentsStore = (): DocumentItem[] => {
  const [docs, setDocs] = useState<DocumentItem[]>(documentsStore);

  useEffect(() => {
    const handler = () => setDocs([...documentsStore]);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return docs;
};
