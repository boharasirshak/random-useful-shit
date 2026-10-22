// "Sign in with Google" just to get a Drive token. No server: the app talks to Google directly.
// Web uses the token (implicit) flow; iOS/Android use code + PKCE with their own client IDs.
import { exchangeCodeAsync, makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import { Platform } from 'react-native';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

// Set these in apps/mobile/.env (see README → Google Drive backup).
const clientId = Platform.select({
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
}) ?? '';

const web = Platform.OS === 'web';
// Native: Google's reversed-client-id scheme, e.g. com.googleusercontent.apps.123-abc:/oauthredirect
const redirectUri = web ? makeRedirectUri() : `${clientId.split('.').reverse().join('.')}:/oauthredirect`;

export function useGoogleDriveToken() {
  const [request, , promptAsync] = useAuthRequest(
    { clientId, redirectUri, scopes: [SCOPE], responseType: web ? ResponseType.Token : ResponseType.Code, usePKCE: !web },
    discovery,
  );

  async function getToken(): Promise<string> {
    const res = await promptAsync();
    if (res.type !== 'success') throw new Error(res.type === 'error' ? res.error?.message ?? 'Sign-in failed' : 'Sign-in cancelled');
    if (web) return res.params.access_token;
    const tokens = await exchangeCodeAsync(
      { clientId, redirectUri, code: res.params.code, extraParams: { code_verifier: request?.codeVerifier ?? '' } },
      discovery,
    );
    return tokens.accessToken;
  }

  return { configured: !!clientId, ready: !!request, getToken };
}
