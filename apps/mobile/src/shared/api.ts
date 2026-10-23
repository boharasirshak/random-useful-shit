// The shared server (apps/server). Everything still works offline without it; set EXPO_PUBLIC_API_URL to turn it on.
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

export const API = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const KEY = 'rus.session';

type TokenStore = { get: () => Promise<string | null>; set: (v: string | null) => Promise<void> };
// Phones keep the session token in the keychain / keystore; browsers only have localStorage. An app built before
// expo-secure-store was added has no keychain module, so sync stays off until it's rebuilt (never a plain-text fallback).
function tokenStore(): TokenStore | null {
  if (Platform.OS === 'web')
    return { get: async () => localStorage.getItem(KEY), set: async v => (v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY)) };
  if (!requireOptionalNativeModule('ExpoSecureStore')) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded only when this build has the module
  const S = require('expo-secure-store') as typeof import('expo-secure-store');
  return { get: () => S.getItemAsync(KEY), set: v => (v ? S.setItemAsync(KEY, v) : S.deleteItemAsync(KEY)) };
}
const store = tokenStore();

// Why sync can't run on this build, if it can't.
export const syncBlocked = !API ? 'No server is set up (EXPO_PUBLIC_API_URL).' : !store ? 'Rebuild the app to turn on sync: it needs the keychain module.' : null;

let token: string | null | undefined;
export async function getToken() {
  if (token === undefined) token = (await store?.get()) ?? null;
  return token;
}
export async function setToken(t: string | null) {
  token = t;
  await store?.set(t);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// JSON in, JSON out, with the session token unless auth: false. Network failures throw ApiError(0).
export async function api<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  if (!API) throw new ApiError(0, 'No server is set up');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = init.auth === false ? null : await getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { method: init.method ?? (init.body === undefined ? 'GET' : 'POST'), headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
  } catch {
    throw new ApiError(0, 'Offline');
  }
  if (!res.ok) {
    let detail: unknown = `Server said ${res.status}`;
    try { detail = (await res.json()).detail ?? detail; } catch { /* not JSON */ }
    throw new ApiError(res.status, typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
