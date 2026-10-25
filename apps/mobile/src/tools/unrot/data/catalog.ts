// The cards: the newest catalog the server has sent, else the one bundled with the app.
// Kept in its own store so swiping (which saves the main store) never rewrites a few hundred KB of cards.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Card, Catalog } from '@/tools/unrot/lib/types';
import bundled from '../../../../../../packages/unrot-content/cards.json';

export const BUNDLED = bundled as Catalog;

// `base`: the bundled version when it was downloaded. A new app release ships newer cards, so it wins.
// `askOnLaunch`: check the published cards when Unrot opens and offer the download; `declined`: the version you said no to.
type State = { catalog: Catalog | null; base: string | null; askOnLaunch: boolean; declined: string | null; set: (c: Catalog) => void; setAsk: (on: boolean) => void; decline: (version: string) => void };
export const useCatalog = create<State>()(
  persist(set => ({
    catalog: null, base: null, askOnLaunch: true, declined: null,
    set: catalog => set({ catalog, base: BUNDLED.version }),
    setAsk: askOnLaunch => set({ askOnLaunch }),
    decline: declined => set({ declined }),
  }), { name: 'unrot-catalog', storage: createJSONStorage(() => AsyncStorage), partialize: s => ({ catalog: s.catalog, base: s.base, askOnLaunch: s.askOnLaunch, declined: s.declined }) }),
);

const pickCards = (s: State) => (s.catalog && s.base === BUNDLED.version ? s.catalog : BUNDLED);
export const useCards = (): Card[] => useCatalog(s => pickCards(s).cards);
export const getCards = (): Card[] => pickCards(useCatalog.getState()).cards;
export const catalogVersion = () => pickCards(useCatalog.getState()).version;
