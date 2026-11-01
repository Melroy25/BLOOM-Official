// Centralized Gemini AI Companion Service for BLOOM
// Connects to the secure Cloudflare Worker backend proxy (POST /chat)
// keeping the Gemini API key strictly server-side while using Firebase Auth tokens.
// Features Firestore conversation persistence and offline reflection engine fallbacks.

import { auth } from './firebase';
import {
  saveAIMessage,
  createAIConversation,
  deleteAIConversation,
  getUserAIConversations,
} from './firestoreService';
import { generateCompanionResponse, ChatMessage, ChatAttachment } from './aiCompanionService';
import { UserProfile } from '../types';

// Production Cloudflare Worker Endpoint
const CLOUDFLARE_WORKER_URL = 'https://weathered-cell-4deb.melroyalmeida10.workers.dev/chat';

export interface SendMessageOptions {
  conversationId: string;
  userId: string;
  userText: string;
  attachment?: ChatAttachment | null;
  userProfile?: UserProfile | null;
  history?: { role: 'user' | 'model'; parts: { text: string }[] }[];
}

/**
 * Detects an emotional mascot state from AI response text
 */
function detectEmotion(text: string): ChatMessage['emotion'] {
  const lower = text.toLowerCase();
  if (
    lower.includes('breathe') ||
    lower.includes('calm') ||
    lower.includes('gentle') ||
    lower.includes('rest') ||
    lower.includes('pause') ||
    lower.includes('peace')
  ) {
    return 'COMFORTING';
  }
  if (
    lower.includes('great') ||
    lower.includes('flow') ||
    lower.includes('sprint') ||
    lower.includes('focus') ||
    lower.includes('wonderful') ||
    lower.includes('well done')
  ) {
    return 'HAPPY';
  }
  return 'HAPPY';
}

/**
 * Sends a message to the Bloom AI Cloudflare Worker backend.
 * 1. Persists the user message to Firestore.
 * 2. Authenticates with Firebase Auth ID token and sends request to Cloudflare Worker.
 * 3. Falls back seamlessly to Bloom Mindful Reflection Engine if offline or error occurs.
 * 4. Persists the AI response to Firestore.
 */
export async function sendAIMessage({
  conversationId,
  userId,
  userText,
  attachment,
  userProfile,
  history = [],
}: SendMessageOptions): Promise<ChatMessage> {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Save User Message to Firestore
  try {
    await saveAIMessage(conversationId, {
      conversationId,
      userId,
      sender: 'user',
      text: userText,
    });
  } catch (err) {
    console.warn('[GeminiService] Could not save user message to Firestore:', err);
  }

  let aiResponseText = '';

  // 2. Query Cloudflare Worker backend
  try {
    const currentUser = auth.currentUser;
    const idToken = currentUser ? await currentUser.getIdToken() : null;

    if (idToken) {
      // Format context with user profile if available
      const profileContext = userProfile
        ? `[User Context: Name=${userProfile.fullName}, Mood=${userProfile.currentMood || 'Calm'}, Role=${userProfile.userType || 'Student'}, Goals=${(userProfile.wellnessGoals || []).join(', ')}]\n\n`
        : '';

      const contextualMessage = `${profileContext}${userText}`;

      // Format multi-turn conversation history for Worker
      const formattedHistory = (history || []).slice(-6).map((item) => ({
        role: item.role === 'model' ? 'model' : 'user',
        parts: item.parts && item.parts.length > 0 ? item.parts : [{ text: '' }],
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const response = await fetch(CLOUDFLARE_WORKER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: contextualMessage,
          history: formattedHistory,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.reply && typeof data.reply === 'string') {
          aiResponseText = data.reply.trim();
        }
      } else {
        const errText = await response.text();
        console.warn(`[GeminiService] Worker returned HTTP ${response.status}:`, errText);
      }
    } else {
      console.info('[GeminiService] No Firebase Auth token available; using Bloom local engine.');
    }
  } catch (err: any) {
    console.warn('[GeminiService] Cloudflare Worker request failed; falling back:', err?.message || err);
  }

  // 3. Construct response or trigger Bloom Mindful Reflection Engine fallback
  let aiChatMessage: ChatMessage;

  if (aiResponseText) {
    const emotion = detectEmotion(aiResponseText);
    aiChatMessage = {
      id: `ai_${Date.now()}`,
      sender: 'ai',
      text: aiResponseText,
      timestamp,
      emotion,
      quickReplies: ['Help me focus', 'Breathing reset', 'Study tips'],
    };
  } else {
    // Local Bloom Mindful Reflection Engine
    aiChatMessage = await generateCompanionResponse(userText, attachment || undefined);
  }

  // 4. Save AI Response to Firestore
  try {
    await saveAIMessage(conversationId, {
      conversationId,
      userId,
      sender: 'ai',
      text: aiChatMessage.text,
      emotion: aiChatMessage.emotion,
    });
  } catch (err) {
    console.warn('[GeminiService] Could not save AI response to Firestore:', err);
  }

  return aiChatMessage;
}

/**
 * Creates a new AI conversation in Firestore.
 */
export async function startNewConversation(
  userId: string,
  title = 'Mindful Reflection'
): Promise<string> {
  return await createAIConversation(userId, title);
}

/**
 * Deletes an AI conversation by ID.
 */
export async function removeConversation(conversationId: string): Promise<void> {
  await deleteAIConversation(conversationId);
}

/**
 * Fetches all past conversations for the current user.
 */
export async function getPastConversations(userId: string) {
  return await getUserAIConversations(userId);
}
