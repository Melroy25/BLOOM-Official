# BLOOM Cloudflare Worker (Gemini AI Proxy)

This worker serves as the secure backend proxy between the BLOOM mobile/web app and the Google Gemini API.
It ensures that the `GEMINI_API_KEY` is kept strictly server-side while verifying Firebase Auth ID tokens.

## Deployment Steps

1. Install wrangler (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. Log into Cloudflare:
   ```bash
   npx wrangler login
   ```

3. Set your Google Gemini API key as a Cloudflare Worker secret:
   ```bash
   npx wrangler secret put GEMINI_API_KEY
   ```
   Paste your Google AI Studio API key (`AIza...`) when prompted.

4. Deploy the worker:
   ```bash
   npx wrangler deploy
   ```

5. Verify worker health:
   ```bash
   curl https://<your-worker-subdomain>.workers.dev/health
   ```
   Expected response:
   ```json
   {
     "status": "online",
     "service": "BLOOM AI API",
     "health": "healthy",
     "geminiKeyConfigured": true,
     "model": "gemini-1.5-flash"
   }
   ```
