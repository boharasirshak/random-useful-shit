// Persisted app data (profile, food logs, weigh-ins). Saved on-device with AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AppData } from '@/tools/calories/lib/backup';
import { addEntry, removeEntry, stepEntry, type Entry } from '@/tools/calories/lib/log';
import type { Profile } from '@/tools/calories/lib/model';

export const EMPTY_PROFILE: Profile = { sex: 'm', age: 0, ft: 0, in: 0, weight: 0, goal: 0, rate: 1, steps: 0, exercise: 0, bf: 0 };
export const profileReady = (p: Profile) => p.age > 0 && p.ft > 0 && p.weight > 0;
// Older saves and backups predate newer profile fields.
const withDefaults = (d: AppData): AppData => ({ ...d, done: d.done ?? {}, profile: { ...EMPTY_PROFILE, ...d.profile } });

type State = AppData & {
  lastBackup: string | null;
  setProfile: (patch: Partial<Profile>) => void;
  setShake: (kcal: number) => void;
  addFood: (day: string, entry: Omit<Entry, 'qty'>) => void;
  stepFood: (day: string, index: number, by: number) => void;
  undoFood: (day: string, entry: Omit<Entry, 'qty'>) => void;
  setWeight: (day: string, lb: number) => void;
  removeWeight: (day: string) => void;
  setDone: (day: string, done: boolean) => void;
  restore: (data: AppData) => void;
  markBackedUp: (iso: string) => void;
};

export const useApp = create<State>()(
  persist(
    set => ({
      profile: EMPTY_PROFILE,
      shake: 160,
      logs: {},
      weights: {},
      done: {},
      lastBackup: null,
      setProfile: patch => set(s => ({ profile: { ...s.profile, ...patch } })),
      setShake: shake => set({ shake }),
      addFood: (day, entry) => set(s => ({ logs: { ...s.logs, [day]: addEntry(s.logs[day], entry) } })),
      stepFood: (day, index, by) => set(s => ({ logs: { ...s.logs, [day]: stepEntry(s.logs[day] ?? [], index, by) } })),
      undoFood: (day, entry) => set(s => ({ logs: { ...s.logs, [day]: removeEntry(s.logs[day], entry) } })),
      setWeight: (day, lb) => set(s => ({ weights: { ...s.weights, [day]: lb } })),
      removeWeight: day => set(s => {
        const { [day]: _, ...weights } = s.weights;
        return { weights };
      }),
      setDone: (day, done) => set(s => ({ done: { ...s.done, [day]: done } })),
      restore: data => set(withDefaults(data)),
      markBackedUp: lastBackup => set({ lastBackup }),
    }),
    { name: 'calorie-tracker', storage: createJSONStorage(() => AsyncStorage), version: 3, migrate: s => withDefaults(s as AppData) },
  ),
);

export const appData = (s: AppData): AppData => ({ profile: s.profile, shake: s.shake, logs: s.logs, weights: s.weights, done: s.done });

// True once saved data has loaded from disk, so screens never flash empty data.
export const useHydrated = () =>
  useSyncExternalStore(useApp.persist.onFinishHydration, useApp.persist.hasHydrated, () => false);
