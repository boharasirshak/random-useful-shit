// Everything Unrot keeps, on-device with AsyncStorage. With sync on, most of it also goes to the server (src/tools/sync.ts).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { review, saveNew, type Saved } from '@/tools/unrot/lib/feed';
import { learn, seed, type Model, type Signal } from '@/tools/unrot/lib/model';
import type { Card } from '@/tools/unrot/lib/types';

const dayKey = (t = new Date()) => `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`;

type Data = {
  model: Model;
  topics: string[]; // picked on the welcome screen
  welcomed: boolean;
  coached: boolean; // has seen the gesture hints
  seen: Record<string, number>; // id → last shown
  hidden: string[]; // swiped left
  liked: Record<string, number>; // id → when
  saved: Record<string, Saved>;
  limit: number; // cards a day before "That's enough for today"; 0 = no limit
  today: { day: string; count: number; extra: number };
};

type State = Data & {
  welcome: (topics: string[]) => void;
  setTopics: (topics: string[]) => void;
  setCoached: (v?: boolean) => void;
  signal: (card: Card, s: Signal) => void;
  toggleLike: (card: Card) => void;
  toggleSave: (card: Card) => void;
  hide: (card: Card) => Model; // returns the model from before, for undo
  unhide: (id: string, model: Model) => void;
  reviewed: (id: string, remembered: boolean) => void;
  shown: (id: string) => void;
  keepGoing: () => void;
  setLimit: (n: number) => void;
  resetTaste: () => void;
  clearHistory: () => void;
};

export const useUnrot = create<State>()(
  persist(
    (set, get) => ({
      model: seed([]),
      topics: [],
      welcomed: false,
      coached: false,
      seen: {},
      hidden: [],
      liked: {},
      saved: {},
      limit: 25,
      today: { day: dayKey(), count: 0, extra: 0 },
      // Picked topics seed the biases; a model already learned (e.g. restored) keeps what it knows.
      welcome: topics => set(s => ({ topics, welcomed: true, model: s.model.n ? s.model : seed(topics) })),
      setTopics: topics => set(s => {
        const b = { ...s.model.b };
        for (const t of topics) if (!s.topics.includes(t)) b[t] = Math.max(b[t] ?? 0, 1);
        for (const t of s.topics) if (!topics.includes(t)) b[t] = Math.min(b[t] ?? 0, 0);
        return { topics, model: { ...s.model, b } };
      }),
      setCoached: (coached = true) => set({ coached }),
      signal: (card, s) => set(st => ({ model: learn(st.model, card, s) })),
      toggleLike: card => set(s => {
        if (s.liked[card.id]) {
          const { [card.id]: _, ...liked } = s.liked;
          return { liked };
        }
        return { liked: { ...s.liked, [card.id]: Date.now() }, model: learn(s.model, card, 'like') };
      }),
      toggleSave: card => set(s => {
        if (s.saved[card.id]) {
          const { [card.id]: _, ...saved } = s.saved;
          return { saved };
        }
        return { saved: { ...s.saved, [card.id]: saveNew(Date.now()) }, model: learn(s.model, card, 'save') };
      }),
      hide: card => {
        const before = get().model;
        set(s => ({ hidden: [...s.hidden, card.id], model: learn(s.model, card, 'hide') }));
        return before;
      },
      unhide: (id, model) => set(s => ({ hidden: s.hidden.filter(h => h !== id), model })),
      reviewed: (id, remembered) => set(s => (s.saved[id] ? { saved: { ...s.saved, [id]: review(s.saved[id], remembered, Date.now()) } } : {})),
      // Counts toward today's limit; a new day starts the count again.
      shown: id => set(s => {
        const d = dayKey();
        const today = s.today.day === d ? s.today : { day: d, count: 0, extra: 0 };
        return { seen: { ...s.seen, [id]: Date.now() }, today: { ...today, count: today.count + 1 } };
      }),
      keepGoing: () => set(s => ({ today: { ...s.today, extra: s.today.extra + 10 } })),
      setLimit: limit => set({ limit }),
      resetTaste: () => set(s => ({ model: seed(s.topics) })),
      clearHistory: () => set({ seen: {}, hidden: [] }),
    }),
    // v2: the anonymous sync code went away; accounts sync everything now.
    { name: 'unrot', storage: createJSONStorage(() => AsyncStorage), version: 2,
      migrate: saved => {
        const { sync: _s, code: _c, syncedAt: _a, ...rest } = saved as Data & { sync?: boolean; code?: string; syncedAt?: number };
        return rest as Data;
      } },
  ),
);

// Today's count, reading a stale day as zero.
export const todayCount = (t: Data['today']) => (t.day === dayKey() ? t : { day: dayKey(), count: 0, extra: 0 });

export const useUnrotHydrated = () =>
  useSyncExternalStore(useUnrot.persist.onFinishHydration, useUnrot.persist.hasHydrated, () => false);
