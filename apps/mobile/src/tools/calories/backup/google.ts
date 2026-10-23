// "Sign in with Google" just to get a Drive token. No server: the app talks to Google directly.
// Web uses the token (implicit) flow; iOS/Android use code + PKCE with their own client IDs.
import { exchangeCodeAsync, ResponseType, useAuthRequest } from 'expo-auth-session';
import { clientId, discovery, redirectUri, web } from '@/shared/google';

const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

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
