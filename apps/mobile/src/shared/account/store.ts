// Who's signed in on this device and how sync is going. The session token itself lives in the keychain (shared/api.ts).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type User = { id: string; anonymous: boolean; email?: string | null; name?: string | null };

type State = {
  user: User | null;
  sync: boolean; // on by default whenever a server is set up
  lastSync: number | null;
  syncing: boolean;
  error: string | null;
  set: (patch: Partial<Omit<State, 'set'>>) => void;
};

export const useAccount = create<State>()(
  persist(
    set => ({ user: null, sync: true, lastSync: null, syncing: false, error: null, set: patch => set(patch) }),
    { name: 'account', storage: createJSONStorage(() => AsyncStorage), partialize: s => ({ user: s.user, sync: s.sync, lastSync: s.lastSync }) },
  ),
);
