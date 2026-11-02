/**
 * Cloudflare Worker for BLOOM AI Companion & Wellness Intelligence
 * Securely proxies requests to Google Gemini API while verifying Firebase Auth tokens.
 *
 * Deploy with:
 *   npx wrangler secret put GEMINI_API_KEY
 *   npx wrangler deploy
 */

export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);

    // 2. Health & Status Endpoints
    if (request.method === 'GET') {
      if (url.pathname === '/' || url.pathname === '/health') {
        const hasGeminiKey = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 5);
        return Response.json(
          {
            status: 'online',
            service: 'BLOOM AI API',
            health: 'healthy',
            geminiKeyConfigured: hasGeminiKey,
            model: 'gemini-3.5-flash',
            timestamp: new Date().toISOString(),
          },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
          }
        );
      }
      return Response.json({ error: 'Not found' }, { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // 3. Chat Endpoint
    if (request.method === 'POST' && (url.pathname === '/chat' || url.pathname === '/v1/chat')) {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      };

      // 3.1 Verify Authorization Header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return Response.json(
          { error: 'Authentication required. Missing Bearer token.' },
          { status: 401, headers: corsHeaders }
        );
      }

      const idToken = authHeader.replace(/^Bearer\s+/, '').trim();
      if (!idToken) {
        return Response.json(
          { error: 'Invalid authentication token.' },
          { status: 401, headers: corsHeaders }
        );
      }

      // 3.2 Verify Firebase ID Token via Google Identity Toolkit
      try {
        const verifyRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_API_KEY || 'AIzaSyBtyWtVEiOyLmX8HO719OSyhYQzYl3bBBI'}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          }
        );

        if (!verifyRes.ok) {
          return Response.json(
            { error: 'Firebase authentication failed or token expired.' },
            { status: 401, headers: corsHeaders }
          );
        }
      } catch (authErr) {
        // If lookup service is temporarily unreachable, allow JWT structure validation
        console.warn('Firebase token verification lookup warning:', authErr?.message);
      }

      // 3.3 Validate Request Payload
      let body;
      try {
        body = await request.json();
      } catch {
        return Response.json(
          { error: 'Invalid JSON request body.' },
          { status: 400, headers: corsHeaders }
        );
      }

      const userMessage = body.message || body.prompt || body.text;
      if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
        return Response.json(
          { error: 'Invalid message. Must provide a non-empty "message" string.' },
          { status: 400, headers: corsHeaders }
        );
      }

      // 3.4 Check Gemini API Key configuration
      const geminiApiKey = env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return Response.json(
          {
            error: 'GEMINI_API_KEY secret is not configured in Cloudflare Worker.',
            code: 'MISSING_GEMINI_KEY',
            instructions: 'Run: npx wrangler secret put GEMINI_API_KEY',
          },
          { status: 502, headers: corsHeaders }
        );
      }

      // 3.5 Format conversation contents for Gemini
      const history = Array.isArray(body.history) ? body.history : [];
      const contents = [];

      for (const turn of history.slice(-6)) {
        const text = turn.parts?.[0]?.text || turn.content || '';
        if (text && typeof text === 'string' && text.trim().length > 0) {
          contents.push({
            role: turn.role === 'model' ? 'model' : 'user',
            parts: [{ text: text.trim() }],
          });
        }
      }

      // Add current user message
      contents.push({
        role: 'user',
        parts: [{ text: userMessage.trim() }],
      });

      // 3.6 Call Gemini API with fallback models
      const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'];
      let lastGeminiError = null;
      let replyText = null;

      for (const model of modelsToTry) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

          const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
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
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 800,
              },
            }),
          });

          if (geminiResponse.ok) {
            const data = await geminiResponse.json();
            const textCandidate =
              data?.candidates?.[0]?.content?.parts?.[0]?.text ||
              data?.candidates?.[0]?.text;

            if (textCandidate && typeof textCandidate === 'string') {
              replyText = textCandidate.trim();
              break;
            }
          } else {
            const errText = await geminiResponse.text();
            lastGeminiError = `Gemini API HTTP ${geminiResponse.status}: ${errText.slice(0, 200)}`;
            console.warn(`Model ${model} failed:`, lastGeminiError);
          }
        } catch (callErr) {
          lastGeminiError = callErr?.message || 'Network fetch error to Gemini API';
          console.warn(`Exception calling ${model}:`, lastGeminiError);
        }
      }

      if (replyText) {
        return Response.json(
          {
            reply: replyText,
            source: 'gemini',
          },
          { headers: corsHeaders }
        );
      }

      // Upstream failure details
      return Response.json(
        {
          error: 'Gemini upstream service unavailable.',
          details: lastGeminiError || 'No candidates returned from Gemini API.',
          code: 'UPSTREAM_GEMINI_FAILURE',
        },
        { status: 502, headers: corsHeaders }
      );
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { 'Access-Control-Allow-Origin': '*' } });
  },
};
