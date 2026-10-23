// Persisted Reader data: the library and the voice settings. Book text lives in files (see lib/files.ts).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_VOICE, type Voice } from '@/tools/reader/lib/models';

export type Book = { id: string; title: string; count: number; index: number; added: string; opened: string };

type State = {
  books: Record<string, Book>;
  voice: Voice;
  rate: number;
  addBook: (b: Omit<Book, 'index' | 'added' | 'opened'>) => void;
  removeBook: (id: string) => void;
  touch: (id: string) => void;
  setIndex: (id: string, index: number) => void;
  setVoice: (voice: Voice) => void;
  setRate: (rate: number) => void;
};

export const useReader = create<State>()(
  persist(
    set => ({
      books: {},
      voice: DEFAULT_VOICE,
      rate: 1,
      addBook: b => set(s => {
        const now = new Date().toISOString();
        return { books: { ...s.books, [b.id]: { ...b, index: 0, added: now, opened: now } } };
      }),
      removeBook: id => set(s => {
        const { [id]: _, ...books } = s.books;
        return { books };
      }),
      touch: id => set(s => (s.books[id] ? { books: { ...s.books, [id]: { ...s.books[id], opened: new Date().toISOString() } } } : {})),
      setIndex: (id, index) => set(s => (s.books[id] && s.books[id].index !== index ? { books: { ...s.books, [id]: { ...s.books[id], index } } } : {})),
      setVoice: voice => set({ voice }),
      setRate: rate => set({ rate }),
    }),
    { name: 'reader', storage: createJSONStorage(() => AsyncStorage), version: 1 },
  ),
);

export const useReaderHydrated = () =>
  useSyncExternalStore(useReader.persist.onFinishHydration, useReader.persist.hasHydrated, () => false);
