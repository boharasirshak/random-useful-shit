// Offline-first sync for every tool's store. Watches each store, stamps changed records with the time of the edit,
// and when online sends them to the server and takes back anything newer from other devices (last write wins per record).
// The algorithm is in core.ts (tested); this file wires it to the stores, storage, network and app lifecycle.
// Tools don't call anything: they list which fields sync in src/tools/sync.ts.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { AppState, Platform } from 'react-native';
import { api, ApiError, getToken, setToken, syncBlocked } from '@/shared/api';
import { useAccount, type User } from '@/shared/account/store';
import { firstMeta, resend, stamp, syncSide, type Meta, type Side, type SyncOut } from './core';
import type { Spec } from './records';

// A persisted Zustand store (method syntax so any store's own state type fits).
type Store = {
  getState(): object;
  setState(patch: object): void;
  subscribe(fn: (s: object, prev: object) => void): () => void;
  persist: { hasHydrated(): boolean; onFinishHydration(fn: () => void): () => void };
};
export type Synced = { tool: string; spec: Spec; store: Store };
export type Session = { token: string; user: User; merged: boolean };
type State = Record<string, unknown>;

const AFTER_EDIT = 4_000; // batch a burst of edits into one sync
const EVERY = 5 * 60_000; // while open, pick up other devices' changes

const sides = new Map<string, Side>();
let applying = false; // changes coming from the server aren't new edits
let running: Promise<void> | null = null;
let again = false;
let timer: ReturnType<typeof setTimeout> | undefined;

const metaKey = (tool: string) => `sync:${tool}`;
const save = (tool: string) => AsyncStorage.setItem(metaKey(tool), JSON.stringify(sides.get(tool)?.meta));
const hydrated = (s: Store) => new Promise<void>(r => (s.persist.hasHydrated() ? r() : s.persist.onFinishHydration(r)));

async function track({ tool, spec, store }: Synced) {
  await hydrated(store);
  const saved = await AsyncStorage.getItem(metaKey(tool));
  const get = () => store.getState() as State;
  const meta: Meta = saved ? JSON.parse(saved) : firstMeta(get(), spec);
  sides.set(tool, { spec, meta, get, set: patch => store.setState(patch) });
  if (!saved) save(tool);
  store.subscribe((next, prev) => {
    if (!applying && stamp(meta, prev as State, next as State, spec, Date.now())) { save(tool); soon(); }
  });
}

function apply(side: Side, patch: State) {
  applying = true;
  try { side.set(patch); } finally { applying = false; }
}

function resendAll() {
  for (const [tool, side] of sides) { resend(side.meta, side.get(), side.spec); save(tool); }
}

const device = () => (Platform.OS === 'web' ? 'Web' : Device.modelName ?? Platform.OS).slice(0, 100);

async function run() {
  if (syncBlocked || !useAccount.getState().sync || !sides.size) return;
  const set = useAccount.getState().set;
  set({ syncing: true });
  try {
    if (!(await getToken())) {
      const s = await api<Session>('/auth/anonymous', { body: { device: device() }, auth: false });
      await setToken(s.token);
      set({ user: s.user });
      resendAll();
    }
    for (const [tool, side] of sides)
      await syncSide(side, body => api<SyncOut>(`/sync/${tool}`, { body }), p => apply(side, p), () => save(tool));
    set({ lastSync: Date.now(), error: null });
  } catch (e) {
    const err = e as ApiError;
    if (err.status === 401) { // signed out elsewhere or account deleted: a new anonymous account next time
      await setToken(null);
      set({ user: null });
    }
    set({ error: err.status === 0 ? 'Offline. Will sync when you’re back.' : err.message });
  } finally {
    set({ syncing: false });
  }
}

// Sync now (or right after the one in flight).
export function syncNow(): Promise<void> {
  if (running) { again = true; return running; }
  running = run().finally(() => {
    running = null;
    if (again) { again = false; syncNow(); }
  });
  return running;
}

function soon() {
  clearTimeout(timer);
  timer = setTimeout(syncNow, AFTER_EDIT);
}

// Once, at app start: watch every tool, then sync on open, on coming back to the app, when the browser goes
// online, a few seconds after edits, and every few minutes while open.
export async function startSync(list: Synced[]) {
  if (syncBlocked || sides.size) return;
  await Promise.all(list.map(track));
  syncNow();
  AppState.addEventListener('change', s => { if (s === 'active') syncNow(); });
  if (Platform.OS === 'web') window.addEventListener('online', () => syncNow());
  setInterval(() => { if (AppState.currentState === 'active') syncNow(); }, EVERY);
}

// Signed in with Google. A different account than before (or none) means this device's data has to go up again.
export async function signedIn(s: Session) {
  const before = useAccount.getState().user;
  await setToken(s.token);
  useAccount.getState().set({ user: s.user, sync: true, error: null });
  if (s.merged || !before || before.id !== s.user.id) resendAll();
  await syncNow();
}

// Signed out or account deleted: stop, and keep everything on the device ready to go up again if sync is turned back on.
export async function signedOut() {
  clearTimeout(timer);
  await setToken(null);
  useAccount.getState().set({ user: null, sync: false, lastSync: null, error: null });
  resendAll();
}
