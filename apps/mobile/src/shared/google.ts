// Google OAuth setup shared by Drive backup (calories) and "Sign in with Google" (accounts).
// Web uses the implicit flow; iOS/Android use code + PKCE with their own client IDs.
import * as Crypto from 'expo-crypto';
import { exchangeCodeAsync, makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import { useState } from 'react';
import { Platform } from 'react-native';

export const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

// Set these in apps/mobile/.env (see README → Google Drive backup).
export const clientId = Platform.select({
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
}) ?? '';

export const web = Platform.OS === 'web';
// Native: Google's reversed-client-id scheme, e.g. com.googleusercontent.apps.123-abc:/oauthredirect
export const redirectUri = web ? makeRedirectUri() : `${clientId.split('.').reverse().join('.')}:/oauthredirect`;

// A Google ID token, which the server checks to know who you are.
export function useGoogleIdToken() {
  const [nonce] = useState(() => Crypto.randomUUID());
  const [request, , promptAsync] = useAuthRequest(
    { clientId, redirectUri, scopes: ['openid', 'email', 'profile'], responseType: web ? ResponseType.IdToken : ResponseType.Code, usePKCE: !web, extraParams: web ? { nonce } : undefined },
    discovery,
  );

  async function getIdToken(): Promise<string> {
    const res = await promptAsync();
    if (res.type !== 'success') throw new Error(res.type === 'error' ? res.error?.message ?? 'Sign-in failed' : 'Sign-in cancelled');
    if (web) return res.params.id_token;
    const tokens = await exchangeCodeAsync(
      { clientId, redirectUri, code: res.params.code, extraParams: { code_verifier: request?.codeVerifier ?? '' } },
      discovery,
    );
    if (!tokens.idToken) throw new Error('Google didn’t return an ID token');
    return tokens.idToken;
  }

  return { configured: !!clientId, ready: !!request, getIdToken };
}
