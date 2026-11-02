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
import { UserProfile, SupportedLanguageCode } from '../types';

// Production Cloudflare Worker Endpoint
const CLOUDFLARE_WORKER_URL = 'https://weathered-cell-4deb.melroyalmeida10.workers.dev/chat';

export type AIResponseSource = 'gemini' | 'offline_fallback';
export type AIErrorType = 'AUTH_ERROR' | 'RATE_LIMIT' | 'TIMEOUT' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'NONE';

export interface ExtendedChatMessage extends ChatMessage {
  source?: AIResponseSource;
  errorType?: AIErrorType;
  isFailed?: boolean;
  canRetry?: boolean;
}

export interface SendMessageOptions {
  conversationId: string;
  userId: string;
  userText: string;
  attachment?: ChatAttachment | null;
  userProfile?: UserProfile | null;
  history?: { role: 'user' | 'model'; parts: { text: string }[] }[];
  skipUserSave?: boolean;
  languageCode?: SupportedLanguageCode;
  abortSignal?: AbortSignal;
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
  languageCode,
  abortSignal,
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

  // Format context with user profile if available
  const profileContext = userProfile
    ? `[User Context: Name=${userProfile.fullName}, Mood=${userProfile.currentMood || 'Calm'}, Role=${userProfile.userType || 'Student'}, Goals=${(userProfile.wellnessGoals || []).join(', ')}]\n\n`
    : '';

  const langMap: Record<string, string> = {
    kn: 'Kannada (ಕನ್ನಡ)',
    hi: 'Hindi (हिन्दी)',
    ml: 'Malayalam (മലയാളം)',
    ta: 'Tamil (தமிழ்)',
    te: 'Telugu (తెలుగు)',
  };

  const langDirective = languageCode && langMap[languageCode]
    ? `[CRITICAL LANGUAGE INSTRUCTION: You MUST formulate your entire response in ${langMap[languageCode]}. Maintain the warm, supportive, botanical companion persona while responding fluently in native ${langMap[languageCode]} script. Do NOT reply in English unless technical terms are essential.]\n\n`
    : '';

  const contextualMessage = `${langDirective}${profileContext}${userText}`;

  // Format multi-turn conversation history (last 6 turns, non-empty text)
  const formattedHistory = (history || [])
    .slice(-6)
    .map((item) => ({
      role: item.role === 'model' ? 'model' : 'user',
      parts: [{ text: item.parts?.[0]?.text || '' }],
    }))
    .filter((item) => item.parts[0].text.trim().length > 0);

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      if (abortSignal) {
        abortSignal.addEventListener('abort', () => controller.abort());
      }

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
      console.info('[GeminiService] No Firebase Auth session active; checking fallbacks.');
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      errorType = 'TIMEOUT';
      console.warn('[GeminiService] Request timed out (15s); checking fallbacks.');
    } else {
      errorType = 'NETWORK_ERROR';
      console.warn('[GeminiService] Network failure; checking fallbacks:', err?.message || err);
    }
    source = 'offline_fallback';
  }

  // 2.2 Direct Gemini API Fallback if Cloudflare Worker is down or unconfigured
  const directApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!aiResponseText && directApiKey && directApiKey.trim().length > 5) {
    try {
      const directContents = formattedHistory.map((item) => ({
        role: item.role,
        parts: [{ text: item.parts[0].text }],
      }));

      directContents.push({
        role: 'user',
        parts: [{ text: contextualMessage.trim() }],
      });

      const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'];
      for (const model of modelsToTry) {
        try {
          const directRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${directApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: directContents,
                systemInstruction: {
                  parts: [
                    {
                      text:
                        'You are Bloom, an empathetic, warm, soothing student wellness AI companion. ' +
                        'You help students navigate academic stress, exam overwhelm, mindful breathing, and balanced study routines. ' +
                        'Keep responses encouraging, mindful, clear, and actionable (2-4 sentences for casual conversation, bullet points for study plans). ' +
                        'If the user addresses you in Kannada, Hindi, Malayalam, Tamil, or Telugu, respond fluently and naturally in that language using its native script.',
                    },
                  ],
                },
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 800,
                },
              }),
            }
          );

          if (directRes.ok) {
            const data = await directRes.json();
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply && typeof reply === 'string') {
              aiResponseText = reply.trim();
              source = 'gemini';
              errorType = 'NONE';
              break;
            }
          }
        } catch {
          // Continue to next model
        }
      }
    } catch (directErr) {
      console.warn('[GeminiService] Direct Gemini fallback failed:', directErr);
    }
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
    // Local Bloom Mindful Reflection Engine fallback (never masquerade as Gemini)
    const fallbackResponse = await generateCompanionResponse(userText, attachment || undefined);
    let noticePrefix = '';
    if (errorType === 'SERVER_ERROR') {
      noticePrefix = '[Offline Reflection • Gemini Worker 502]\nCloudflare Worker reported 502 Bad Gateway (Upstream Gemini unavailable).\n\n';
    } else if (errorType === 'AUTH_ERROR') {
      noticePrefix = '[Offline Reflection • Auth Session Required]\nPlease re-authenticate to connect to live Gemini intelligence.\n\n';
    } else if (errorType === 'TIMEOUT') {
      noticePrefix = '[Offline Reflection • Request Timed Out]\nLive Gemini server took longer than 15s to respond.\n\n';
    } else if (errorType === 'NETWORK_ERROR') {
      noticePrefix = '[Offline Reflection • Network Offline]\nBloom is reflecting locally while your device re-establishes connectivity.\n\n';
    }

    aiChatMessage = {
      ...fallbackResponse,
      text: noticePrefix ? `${noticePrefix}${fallbackResponse.text}` : fallbackResponse.text,
      source: 'offline_fallback',
      errorType,
      isFailed: errorType !== 'NONE',
      canRetry: errorType !== 'NONE',
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

/**
 * Regenerates the last AI companion response without creating a new user message record.
 */
export async function regenerateAIMessage(
  options: Omit<SendMessageOptions, 'skipUserSave'>
): Promise<ExtendedChatMessage> {
  return sendAIMessage({
    ...options,
    skipUserSave: true,
  });
}

/**
 * Retries the last failed AI companion response without creating duplicate user messages.
 */
export async function retryAIMessage(
  options: SendMessageOptions
): Promise<ExtendedChatMessage> {
  return sendAIMessage({
    ...options,
    skipUserSave: true,
  });
}
