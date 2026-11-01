/**
 * googleAuthService.ts
 * Google OAuth 2.0 via expo-auth-session.
 *
 * Gracefully no-ops in Expo Go — OAuth requires a custom URI scheme (bloom://)
 * which Expo Go intercepts. All exports are safe to call in Expo Go and return
 * clear error states instead of crashing.
 *
 * Full OAuth requires a development build: npx expo run:android
 *
 * SETUP INSTRUCTIONS (at bottom of file)
 */
import { Platform } from 'react-native';
import { saveGoogleAuth, clearGoogleAuth, loadGoogleAuth, GoogleAuthData } from './storageService';

// ─── Safe dynamic imports ─────────────────────────────────────────────────────

type AuthSessionModule = typeof import('expo-auth-session');

let _authSession: AuthSessionModule | null = null;

function getAuthSession(): AuthSessionModule | null {
  if (_authSession) return _authSession;
  try {
    _authSession = require('expo-auth-session') as AuthSessionModule;
    return _authSession;
  } catch {
    return null;
  }
}

// Initialise web browser session completion safely
try {
  const wb = require('expo-web-browser');
  wb.maybeCompleteAuthSession();
} catch {}

// ─── Config ───────────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID_WEB =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? 'YOUR_GOOGLE_WEB_CLIENT_ID_HERE';

const GOOGLE_CLIENT_ID_ANDROID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? GOOGLE_CLIENT_ID_WEB;

const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
];

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// ─── Auth Request Hook ────────────────────────────────────────────────────────

/**
 * Returns a safe stub when expo-auth-session is unavailable (Expo Go).
 * Components should check isAvailable before calling promptAsync.
 */
export function useGoogleAuthRequest() {
  const authSession = getAuthSession();

  if (!authSession) {
    // Safe stub for Expo Go
    return {
      request: null,
      response: null,
      promptAsync: async () => ({ type: 'error' as const, error: null, url: '', params: {} }),
      redirectUri: '',
      isAvailable: false,
    };
  }

  const clientId =
    Platform.OS === 'android' ? GOOGLE_CLIENT_ID_ANDROID : GOOGLE_CLIENT_ID_WEB;
  const redirectUri = authSession.makeRedirectUri({ scheme: 'bloom' });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [request, response, promptAsync] = authSession.useAuthRequest(
    {
      clientId,
      scopes: SCOPES,
      redirectUri,
      responseType: authSession.ResponseType.Code,
      usePKCE: true,
    },
    GOOGLE_DISCOVERY
  );

  return { request, response, promptAsync, redirectUri, isAvailable: true };
}

// ─── Token exchange ───────────────────────────────────────────────────────────

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<{ accessToken: string; expiresIn: number } | null> {
  const authSession = getAuthSession();
  if (!authSession) return null;

  const clientId =
    Platform.OS === 'android' ? GOOGLE_CLIENT_ID_ANDROID : GOOGLE_CLIENT_ID_WEB;

  try {
    const result = await authSession.exchangeCodeAsync(
      { clientId, code, redirectUri, extraParams: { code_verifier: codeVerifier } },
      GOOGLE_DISCOVERY
    );
    return { accessToken: result.accessToken, expiresIn: result.expiresIn ?? 3600 };
  } catch {
    return null;
  }
}

// ─── User info ────────────────────────────────────────────────────────────────

export async function fetchGoogleUserInfo(
  accessToken: string
): Promise<{ email: string; name: string; id: string } | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { email: data.email ?? '', name: data.name ?? '', id: data.sub ?? '' };
  } catch {
    return null;
  }
}

// ─── Persist / load / clear ───────────────────────────────────────────────────

export async function persistGoogleAuth(
  accessToken: string,
  expiresIn: number,
  userInfo: { email: string; name: string; id: string }
): Promise<void> {
  await saveGoogleAuth({
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
    userEmail: userInfo.email,
    userName: userInfo.name,
    userId: userInfo.id,
  });
}

export async function getValidStoredToken(): Promise<GoogleAuthData | null> {
  const auth = await loadGoogleAuth();
  if (!auth) return null;
  if (Date.now() >= auth.expiresAt) {
    await clearGoogleAuth();
    return null;
  }
  return auth;
}

export async function revokeGoogleAccess(accessToken: string): Promise<void> {
  try {
    await fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`,
      { method: 'POST' }
    );
  } catch {}
  await clearGoogleAuth();
}

// ─── Config check ─────────────────────────────────────────────────────────────

export function isGoogleConfigured(): boolean {
  return (
    GOOGLE_CLIENT_ID_WEB !== 'YOUR_GOOGLE_WEB_CLIENT_ID_HERE' &&
    GOOGLE_CLIENT_ID_WEB.length > 10
  );
}

export function isOAuthAvailable(): boolean {
  return getAuthSession() !== null;
}

/*
 * ─── SETUP INSTRUCTIONS ───────────────────────────────────────────────────────
 *
 * Requires a development build (npx expo run:android) — does NOT work in Expo Go.
 *
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a project → Enable "Google Classroom API"
 * 3. Credentials → Create OAuth 2.0 Client ID (Web application)
 *    Redirect URI: https://auth.expo.io/@YOUR_EXPO_USERNAME/bloom
 * 4. Create another Client ID (Android), package: com.bloom.app
 * 5. Create .env.local at project root:
 *      EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=xxx.apps.googleusercontent.com
 *      EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=yyy.apps.googleusercontent.com
 * 6. Run: npx expo run:android
 * ─────────────────────────────────────────────────────────────────────────────
 */
