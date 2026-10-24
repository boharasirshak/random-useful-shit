// Persisted app data (profile, food logs, weigh-ins). Saved on-device with AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AppData } from '@/tools/calories/lib/backup';
import { addEntry, orderKey, removeEntry, stepEntry, type Entry, type Order } from '@/tools/calories/lib/log';
import { today } from '@/tools/calories/lib/dates';
import { ageOn, type Profile } from '@/tools/calories/lib/model';
import { DEFAULT_REMINDER, type Reminder } from '@/tools/calories/lib/reminder';
import { editWeek, weekAvg } from '@/tools/calories/lib/steps';

export const EMPTY_PROFILE: Profile = { sex: 'm', age: 0, ft: 0, in: 0, weight: 0, goal: 0, rate: 1, steps: 0, exercise: 0, bf: 0 };
export const profileReady = (p: Profile) => p.age > 0 && p.ft > 0 && p.weight > 0;
// Older saves and backups predate newer profile fields.
// Fills fields older saves lack, and keeps age current from the date of birth. Runs on every load.
const withDefaults = (d: AppData): AppData => {
  const profile = { ...EMPTY_PROFILE, ...d.profile };
  if (profile.dob) profile.age = ageOn(profile.dob, today());
  // Before step weeks existed there was one steps number; it becomes the first week, covering all past days.
  const stepWeeks = d.stepWeeks?.length ? d.stepWeeks : [{ from: '2000-01-01', week: Array(7).fill(profile.steps) }];
  return { ...d, shakeProtein: d.shakeProtein ?? 30, done: d.done ?? {}, stepWeeks, favorites: d.favorites ?? [], seenAwards: d.seenAwards ?? [], reminder: d.reminder ?? DEFAULT_REMINDER, profile };
};

type State = AppData & {
  lastBackup: string | null;
  setProfile: (patch: Partial<Profile>) => void;
  setShake: (kcal: number) => void;
  setShakeProtein: (g: number) => void;
  addFood: (day: string, entry: Omit<Entry, 'qty'>) => void;
  stepFood: (day: string, index: number, by: number) => void;
  editFood: (day: string, index: number, entry: Entry) => void; // swap one line for its edited version
  undoFood: (day: string, entry: Omit<Entry, 'qty'>) => void;
  setWeight: (day: string, lb: number) => void;
  removeWeight: (day: string) => void;
  setDone: (day: string, done: boolean) => void;
  setStepWeek: (week: number[]) => void;
  toggleFavorite: (order: Order) => void;
  setDob: (dob: string) => void;
  markAwardsSeen: (ids: string[]) => void;
  setReminder: (patch: Partial<Reminder>) => void;
  restore: (data: AppData) => void;
  markBackedUp: (iso: string) => void;
};

export const useApp = create<State>()(
  persist(
    set => ({
      profile: EMPTY_PROFILE,
      shake: 160,
      shakeProtein: 30,
      logs: {},
      weights: {},
      done: {},
      stepWeeks: [],
      favorites: [],
      seenAwards: [],
      reminder: DEFAULT_REMINDER,
      lastBackup: null,
      setProfile: patch => set(s => ({ profile: { ...s.profile, ...patch } })),
      setShake: shake => set({ shake }),
      setShakeProtein: shakeProtein => set({ shakeProtein }),
      addFood: (day, entry) => set(s => ({ logs: { ...s.logs, [day]: addEntry(s.logs[day], entry) } })),
      stepFood: (day, index, by) => set(s => ({ logs: { ...s.logs, [day]: stepEntry(s.logs[day] ?? [], index, by) } })),
      editFood: (day, index, entry) => set(s => ({ logs: { ...s.logs, [day]: (s.logs[day] ?? []).map((x, i) => (i === index ? entry : x)) } })),
      undoFood: (day, entry) => set(s => ({ logs: { ...s.logs, [day]: removeEntry(s.logs[day], entry) } })),
      setWeight: (day, lb) => set(s => ({ weights: { ...s.weights, [day]: lb } })),
      removeWeight: day => set(s => {
        const { [day]: _, ...weights } = s.weights;
        return { weights };
      }),
      setDone: (day, done) => set(s => ({ done: { ...s.done, [day]: done } })),
      // A new version from today; profile.steps follows the week's average so every screen agrees.
      setStepWeek: week => set(s => ({ stepWeeks: editWeek(s.stepWeeks, today(), week), profile: { ...s.profile, steps: weekAvg(week) } })),
      toggleFavorite: order => set(s => {
        const k = orderKey(order);
        return { favorites: s.favorites.some(f => orderKey(f) === k) ? s.favorites.filter(f => orderKey(f) !== k) : [order, ...s.favorites] };
      }),
      setDob: dob => set(s => ({ profile: { ...s.profile, dob, age: ageOn(dob, today()) } })),
      markAwardsSeen: ids => set(s => ({ seenAwards: [...new Set([...s.seenAwards, ...ids])] })),
      setReminder: patch => set(s => ({ reminder: { ...s.reminder, ...patch } })),
      restore: data => set(withDefaults(data)),
      markBackedUp: lastBackup => set({ lastBackup }),
    }),
    { name: 'calorie-tracker', storage: createJSONStorage(() => AsyncStorage), version: 8, migrate: s => withDefaults(s as AppData),
      merge: (saved, current) => ({ ...current, ...withDefaults({ ...current, ...(saved as AppData) }) }) },
  ),
);

export const appData = (s: AppData): AppData => ({ profile: s.profile, shake: s.shake, shakeProtein: s.shakeProtein, logs: s.logs, weights: s.weights, done: s.done, stepWeeks: s.stepWeeks, favorites: s.favorites, seenAwards: s.seenAwards, reminder: s.reminder });

// True once saved data has loaded from disk, so screens never flash empty data.
export const useHydrated = () =>
  useSyncExternalStore(useApp.persist.onFinishHydration, useApp.persist.hasHydrated, () => false);
