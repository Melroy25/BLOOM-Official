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
  getAIMessages,
  subscribeToAIMessages,
} from './firestoreService';
import { generateCompanionResponse, ChatMessage, ChatAttachment } from './aiCompanionService';
import { UserProfile } from '../types';

// Production Cloudflare Worker Endpoint
const CLOUDFLARE_WORKER_URL = 'https://weathered-cell-4deb.melroyalmeida10.workers.dev/chat';

export type AIResponseSource = 'gemini' | 'offline_fallback';
export type AIErrorType = 'AUTH_ERROR' | 'RATE_LIMIT' | 'TIMEOUT' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'NONE';

export interface ExtendedChatMessage extends ChatMessage {
  source?: AIResponseSource;
  errorType?: AIErrorType;
}

export interface SendMessageOptions {
  conversationId: string;
  userId: string;
  userText: string;
  attachment?: ChatAttachment | null;
  userProfile?: UserProfile | null;
  history?: { role: 'user' | 'model'; parts: { text: string }[] }[];
  skipUserSave?: boolean;
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
 * 1. Persists the user message to Firestore (unless skipUserSave is true).
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
  skipUserSave = false,
}: SendMessageOptions): Promise<ExtendedChatMessage> {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Save User Message to Firestore (prevent duplicate if already persisted)
  if (!skipUserSave && conversationId && conversationId !== 'default' && !conversationId.startsWith('temp_')) {
    try {
      await saveAIMessage(conversationId, {
        conversationId,
        userId: userId || 'anonymous',
        sender: 'user',
        text: userText,
      });
    } catch (err) {
      console.warn('[GeminiService] Could not save user message to Firestore:', err);
    }
  }

  let aiResponseText = '';
  let errorType: AIErrorType = 'NONE';
  let source: AIResponseSource = 'gemini';

  // 2. Query Cloudflare Worker backend
  try {
    const currentUser = auth.currentUser;
    let idToken: string | null = null;

    if (currentUser) {
      try {
        idToken = await currentUser.getIdToken(false);
      } catch {
        // Retry with force refresh if token was expired
        try {
          idToken = await currentUser.getIdToken(true);
        } catch (tokErr) {
          console.warn('[GeminiService] Token refresh error:', tokErr);
        }
      }
    }

    if (idToken) {
      // Format context with user profile if available
      const profileContext = userProfile
        ? `[User Context: Name=${userProfile.fullName}, Mood=${userProfile.currentMood || 'Calm'}, Role=${userProfile.userType || 'Student'}, Goals=${(userProfile.wellnessGoals || []).join(', ')}]\n\n`
        : '';

      const contextualMessage = `${profileContext}${userText}`;

      // Format multi-turn conversation history for Worker (last 6 turns, non-empty text)
      const formattedHistory = (history || [])
        .slice(-6)
        .map((item) => ({
          role: item.role === 'model' ? 'model' : 'user',
          parts: [{ text: item.parts?.[0]?.text || '' }],
        }))
        .filter((item) => item.parts[0].text.trim().length > 0);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

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
          source = 'gemini';
        } else {
          errorType = 'SERVER_ERROR';
        }
      } else if (response.status === 401 || response.status === 403) {
        errorType = 'AUTH_ERROR';
        console.warn(`[GeminiService] Worker returned Auth error (${response.status})`);
      } else if (response.status === 429) {
        errorType = 'RATE_LIMIT';
        console.warn('[GeminiService] Worker rate limit exceeded (429)');
      } else {
        errorType = 'SERVER_ERROR';
        console.warn(`[GeminiService] Worker returned HTTP ${response.status}`);
      }
    } else {
      source = 'offline_fallback';
      console.info('[GeminiService] No Firebase Auth session active; using local mindful reflection engine.');
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      errorType = 'TIMEOUT';
      console.warn('[GeminiService] Request timed out (15s); using local mindful reflection fallback.');
    } else {
      errorType = 'NETWORK_ERROR';
      console.warn('[GeminiService] Network failure; using local mindful reflection fallback:', err?.message || err);
    }
    source = 'offline_fallback';
  }

  // 3. Construct response or trigger Bloom Mindful Reflection Engine fallback
  let aiChatMessage: ExtendedChatMessage;

  if (aiResponseText) {
    const emotion = detectEmotion(aiResponseText);
    aiChatMessage = {
      id: `ai_${Date.now()}`,
      sender: 'ai',
      text: aiResponseText,
      timestamp,
      emotion,
      quickReplies: ['Help me focus', 'Breathing reset', 'Study tips'],
      source: 'gemini',
      errorType: 'NONE',
    };
  } else {
    // Local Bloom Mindful Reflection Engine fallback
    const fallbackResponse = await generateCompanionResponse(userText, attachment || undefined);
    aiChatMessage = {
      ...fallbackResponse,
      source: 'offline_fallback',
      errorType,
    };
  }

  // 4. Save AI Response to Firestore
  if (conversationId && conversationId !== 'default' && !conversationId.startsWith('temp_')) {
    try {
      await saveAIMessage(conversationId, {
        conversationId,
        userId: userId || 'anonymous',
        sender: 'ai',
        text: aiChatMessage.text,
        emotion: aiChatMessage.emotion,
      });
    } catch (err) {
      console.warn('[GeminiService] Could not save AI response to Firestore:', err);
    }
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

/**
 * Fetches all messages for a given conversation.
 */
export async function getConversationMessages(conversationId: string) {
  return await getAIMessages(conversationId);
}

/**
 * Subscribes to real-time messages for a conversation.
 */
export { subscribeToAIMessages };
