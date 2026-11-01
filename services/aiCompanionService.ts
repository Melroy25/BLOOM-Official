// AI Companion Service for BLOOM
// Provides student-wellness reflections, emotional intent analysis,
// and state-driven responses powered by Gemini AI with intelligent offline fallbacks.

export type MascotState =
  | 'IDLE'
  | 'HAPPY'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'COMFORTING'
  | 'ERROR';

export interface ChatAttachment {
  id: string;
  uri: string;
  name: string;
  type: 'image' | 'file';
  size?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  attachment?: ChatAttachment;
  emotion?: MascotState;
  steps?: { stepNumber: number; title: string; detail: string }[];
  showSprintWidget?: boolean;
  sprintTopic?: string;
  sprintMinutes?: number;
  quickReplies?: string[];
}

export interface ConversationThread {
  id: string;
  title: string;
  lastUpdated: string;
  messages: ChatMessage[];
}

export const INITIAL_SUGGESTIONS = [
  {
    id: 'stressed',
    title: "I'm feeling stressed",
    subtitle: 'Quick breathing & mindful reset',
    prompt: "I'm feeling stressed with my studies right now. Can we do a gentle calming reset?",
    icon: 'spa',
    emotion: 'COMFORTING' as MascotState,
  },
  {
    id: 'focus',
    title: 'Help me focus',
    subtitle: 'Start a 20-min pacing sprint',
    prompt: 'Help me stay focused. Can we set up a gentle 20-minute study sprint?',
    icon: 'timer',
    emotion: 'HAPPY' as MascotState,
  },
  {
    id: 'talk',
    title: "Let's talk",
    subtitle: 'Open, unhurried space for any thoughts',
    prompt: 'Can we just chat freely about what is on my mind today?',
    icon: 'chat',
    emotion: 'HAPPY' as MascotState,
  },
];

export const RECENT_CHECK_INS: ConversationThread[] = [
  {
    id: 'checkin-1',
    title: 'Exam stress & study pacing',
    lastUpdated: 'Today, 2:40 PM',
    messages: [
      {
        id: 'm1',
        sender: 'user',
        text: "I have two finals on Thursday and I'm feeling overwhelmed with where to start...",
        timestamp: '2:41 PM',
      },
      {
        id: 'm2',
        sender: 'ai',
        text: "Take a deep breath with me for a moment. It's completely normal to feel that rush when deadlines overlap.\n\nLet's break this down into bite-sized momentum:\n1. Pick just one topic for 20 minutes.\n2. Hide everything else.\n3. Celebrate your small win.",
        timestamp: '2:42 PM',
        emotion: 'COMFORTING',
        quickReplies: ['Review Bio notes', 'Try 3-min breathing', 'Build timetable'],
      },
    ],
  },
  {
    id: 'checkin-2',
    title: 'Mindful breathing check-in',
    lastUpdated: 'Yesterday, 8:15 PM',
    messages: [
      {
        id: 'm2-1',
        sender: 'user',
        text: 'Just finished a long study session and my head is buzzing.',
        timestamp: '8:15 PM',
      },
      {
        id: 'm2-2',
        sender: 'ai',
        text: 'You worked hard today. Let your shoulders drop away from your ears. Take a slow 4-count breath in... hold for 4... and exhale softly for 6.',
        timestamp: '8:16 PM',
        emotion: 'COMFORTING',
        quickReplies: ['Feeling lighter', 'Still tense', 'Going to sleep'],
      },
    ],
  },
];

export function getFormattedTime(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Maps user input text to an emotional expression for the mascot
 */
export function detectEmotionFromContext(text: string): MascotState {
  const lower = text.toLowerCase();

  if (
    lower.includes('stress') ||
    lower.includes('anxious') ||
    lower.includes('overwhelm') ||
    lower.includes('scared') ||
    lower.includes('tired') ||
    lower.includes('sad') ||
    lower.includes('panic') ||
    lower.includes('calm') ||
    lower.includes('breath')
  ) {
    return 'COMFORTING';
  }

  if (
    lower.includes('hello') ||
    lower.includes('hey') ||
    lower.includes('hi') ||
    lower.includes('happy') ||
    lower.includes('yay') ||
    lower.includes('great') ||
    lower.includes('good') ||
    lower.includes('awesome') ||
    lower.includes('thank')
  ) {
    return 'HAPPY';
  }

  if (
    lower.includes('why') ||
    lower.includes('how') ||
    lower.includes('what') ||
    lower.includes('think') ||
    lower.includes('focus') ||
    lower.includes('plan')
  ) {
    return 'THINKING';
  }

  return 'IDLE';
}

/**
 * Calls Gemini API if an API key is available in environment
 */
async function callGeminiApi(prompt: string): Promise<string | null> {
  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    (typeof window !== 'undefined' && (window as any).EXPO_PUBLIC_GEMINI_API_KEY);

  if (!apiKey) return null;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const systemPrompt =
      "You are Bloom, a warm, calm, empathetic mindful AI companion for students. You help students manage academic stress, study overwhelm, focus, and mindful breathing. Keep responses encouraging, concise (2-3 sentences), warm, and soothing. Avoid emojis or markdown asterisks because your response is also spoken aloud.";

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nStudent says: "${prompt}"` }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 160,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      console.warn('[Gemini API] Response not ok:', response.status);
      return null;
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText && candidateText.trim().length > 0) {
      return candidateText.trim();
    }
  } catch (err) {
    console.warn('[Gemini API] Request exception:', err);
  }

  return null;
}

/**
 * Generates companion response with emotional metadata
 */
export async function generateCompanionResponse(
  userText: string,
  attachment?: ChatAttachment
): Promise<ChatMessage> {
  const time = getFormattedTime();
  const id = 'msg-' + Date.now();
  const lower = userText.toLowerCase();

  // If user uploaded an attachment (ChatGPT-like file/image understanding)
  if (attachment) {
    const isImg = attachment.type === 'image';
    const filename = attachment.name;

    const promptText = userText.trim()
      ? `User attached ${isImg ? 'an image' : 'a file'} named "${filename}" with message: "${userText}"`
      : `User shared ${isImg ? 'an image' : 'a file'} named "${filename}". Please review and provide a warm mindful study breakdown.`;

    const geminiText = await callGeminiApi(promptText);
    if (geminiText) {
      return {
        id,
        sender: 'ai',
        text: geminiText,
        timestamp: time,
        emotion: 'HAPPY',
        quickReplies: ['Break this down step-by-step', 'Create a 15-min focus plan', 'Looks good!'],
      };
    }

    return {
      id,
      sender: 'ai',
      text: userText.trim()
        ? `I received your ${isImg ? 'image' : 'file'} "${filename}". Let's tackle "${userText}" together at your own natural pace.`
        : `I've opened your ${isImg ? 'study image' : 'document'} "${filename}". Take a deep breath with me—we can break this topic down into easy bite-sized chunks so you feel confident and calm.`,
      timestamp: time,
      emotion: 'HAPPY',
      steps: [
        {
          stepNumber: 1,
          title: 'Review key terms & main idea',
          detail: 'Skim the core headings without stress.',
        },
        {
          stepNumber: 2,
          title: 'Summarize 1 concept in your own words',
          detail: 'Active recall helps memory solidify naturally.',
        },
        {
          stepNumber: 3,
          title: 'Take a 5-minute hydration break',
          detail: 'Give your mind time to absorb the material.',
        },
      ],
      quickReplies: ['Explain key points', 'Start 20-min sprint', 'Check my understanding'],
    };
  }

  // 1. Try Gemini API if configured
  const geminiText = await callGeminiApi(userText);
  if (geminiText) {
    const emotion = detectEmotionFromContext(geminiText + ' ' + userText);
    return {
      id,
      sender: 'ai',
      text: geminiText,
      timestamp: time,
      emotion: emotion === 'IDLE' ? 'HAPPY' : emotion,
      quickReplies: ['Help me focus', 'Mindful breathing', 'Thank you!'],
    };
  }

  // 2. Intelligent companion reflection engine (offline / fallback)
  await new Promise((resolve) => setTimeout(resolve, 800));

  // If user asks about focus / sprint / timer
  if (
    lower.includes('focus') ||
    lower.includes('sprint') ||
    lower.includes('timer') ||
    lower.includes('25-min') ||
    lower.includes('20-min')
  ) {
    const topicMatch = userText.match(/(?:on|about|for)\s+([a-zA-Z0-9\s]+?)(?:\?|\.|$)/i);
    const topic = topicMatch ? topicMatch[1].trim() : 'Focus Sprint';

    return {
      id,
      sender: 'ai',
      text: `Starting your gentle 20-minute focus sprint on ${topic}. I will keep your space serene and quiet so you can find your flow.`,
      timestamp: time,
      emotion: 'HAPPY',
      showSprintWidget: true,
      sprintTopic: topic.length > 24 ? topic.substring(0, 24) + '...' : topic,
      sprintMinutes: 20,
      quickReplies: ['Need a break', 'Finished early', 'Add 5 mins'],
    };
  }

  // If user asks about stress / overwhelm / anxiety
  if (
    lower.includes('stress') ||
    lower.includes('overwhelm') ||
    lower.includes('anxious') ||
    lower.includes('reset') ||
    lower.includes('tired')
  ) {
    return {
      id,
      sender: 'ai',
      text: "Take a slow, deep breath with me right now. You don't have to carry every deadline at once. Drop your shoulders, take a sip of cool water, and pick just one small task for 15 minutes.",
      timestamp: time,
      emotion: 'COMFORTING',
      steps: [
        {
          stepNumber: 1,
          title: 'Unclench your jaw & drop shoulders',
          detail: 'Release the subtle physical tension.',
        },
        {
          stepNumber: 2,
          title: 'Pick just one 15-minute slice',
          detail: 'Everything else can pause without failing.',
        },
        {
          stepNumber: 3,
          title: 'Drink a sip of cool water',
          detail: 'Ground your senses in the present room.',
        },
      ],
      quickReplies: ['Start 15-min sprint', 'Try 3-min breathing', 'Just chat'],
    };
  }

  // If user asks about breathing
  if (lower.includes('breath') || lower.includes('meditat') || lower.includes('calm')) {
    return {
      id,
      sender: 'ai',
      text: "Let's do a soothing box-breath together. Inhale gently for 4... hold peacefully for 4... exhale smoothly for 4... and rest empty for 4. Feel that gentle lightness returning?",
      timestamp: time,
      emotion: 'COMFORTING',
      quickReplies: ['Repeat breath', "I'm ready to study", 'Feeling calmer'],
    };
  }

  // Greetings
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return {
      id,
      sender: 'ai',
      text: "Hey there! I'm Bloom, your mindful companion. I'm right here with you whenever you need to reflect, plan your studies, or simply take a breather.",
      timestamp: time,
      emotion: 'HAPPY',
      quickReplies: ['Help me focus', "I'm feeling stressed", "Let's talk"],
    };
  }

  // Default friendly mindful response
  return {
    id,
    sender: 'ai',
    text: "Thank you for sharing that with me. Studying and growing works best when you take things one step at a time at your own natural pace. What would feel most helpful to focus on next?",
    timestamp: time,
    emotion: 'HAPPY',
    quickReplies: ['Help me prioritize', 'Start a focus sprint', 'Tips to unwind'],
  };
}
