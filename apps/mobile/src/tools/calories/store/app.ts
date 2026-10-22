// Persisted app data (profile, food logs, weigh-ins). Saved on-device with AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AppData } from '@/tools/calories/lib/backup';
import { addEntry, stepEntry, type Entry } from '@/tools/calories/lib/log';
import type { Profile } from '@/tools/calories/lib/model';

export const EMPTY_PROFILE: Profile = { sex: 'm', age: 0, ft: 0, in: 0, weight: 0, goal: 0, steps: 0, exercise: 0, bf: 0 };
export const profileReady = (p: Profile) => p.age > 0 && p.ft > 0 && p.weight > 0 && p.goal > 0;

type State = AppData & {
  lastBackup: string | null;
  setProfile: (patch: Partial<Profile>) => void;
  setShake: (kcal: number) => void;
  addFood: (day: string, entry: Omit<Entry, 'qty'>) => void;
  stepFood: (day: string, index: number, by: number) => void;
  setWeight: (day: string, lb: number) => void;
  removeWeight: (day: string) => void;
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
      lastBackup: null,
      setProfile: patch => set(s => ({ profile: { ...s.profile, ...patch } })),
      setShake: shake => set({ shake }),
      addFood: (day, entry) => set(s => ({ logs: { ...s.logs, [day]: addEntry(s.logs[day], entry) } })),
      stepFood: (day, index, by) => set(s => ({ logs: { ...s.logs, [day]: stepEntry(s.logs[day] ?? [], index, by) } })),
      setWeight: (day, lb) => set(s => ({ weights: { ...s.weights, [day]: lb } })),
      removeWeight: day => set(s => {
        const { [day]: _, ...weights } = s.weights;
        return { weights };
      }),
      restore: data => set(data),
      markBackedUp: lastBackup => set({ lastBackup }),
    }),
    { name: 'calorie-tracker', storage: createJSONStorage(() => AsyncStorage), version: 1 },
  ),
);

export const appData = (s: AppData): AppData => ({ profile: s.profile, shake: s.shake, logs: s.logs, weights: s.weights });

// True once saved data has loaded from disk, so screens never flash empty data.
export const useHydrated = () =>
  useSyncExternalStore(useApp.persist.onFinishHydration, useApp.persist.hasHydrated, () => false);
