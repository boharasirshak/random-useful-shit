// Screen state shared between tabs and the Add Food screens. Only the Add Food drafts (builders, custom food) and hidden recents are saved.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Category, Restaurant } from '@/tools/calories/data/menu';
import type { Build } from '@/tools/calories/lib/builder';
import { today } from '@/tools/calories/lib/dates';
import { mealForHour, type Meal, type Order } from '@/tools/calories/lib/log';

// The last thing added, so "Added … Undo" can show on whichever Add Food page you're on.
export type Added = { order: Order; label: string; at: number };
// Where you are on one place's menu: order type, the plate being built, category filter, how many.
export type PlaceState = { orderName: string; build: Build | null; filter: Category | 'all'; qty: number };
// The Custom food form, kept until it's added so closing Add Food by accident doesn't lose it.
export type CustomFood = { name: string; kcal: number; p: number; c: number; f: number };
export const NEW_CUSTOM: CustomFood = { name: '', kcal: 300, p: 0, c: 0, f: 0 };

type Ui = {
  day: string;
  pinned: boolean; // you picked a day yourself; otherwise `day` follows the clock
  meal: Meal;
  added: Added | null;
  query: string; // Add Food search
  places: Partial<Record<Restaurant, PlaceState>>;
  custom: CustomFood;
  hiddenRecents: string[]; // orderKeys swiped out of Recent; adding one again brings it back
  setDay: (day: string) => void;
  rollover: () => void; // midnight passed (or the app came back): move an unpinned day to today
  setMeal: (meal: Meal) => void;
  setAdded: (added: Added | null) => void;
  setQuery: (query: string) => void;
  setPlace: (place: Restaurant, patch: Partial<PlaceState>) => void;
  setCustom: (patch: Partial<CustomFood> | null) => void; // null: back to a blank form
  hideRecent: (key: string, hidden: boolean) => void;
};

export const useUi = create<Ui>()(
  persist(
    set => ({
      day: today(),
      pinned: false,
      meal: mealForHour(new Date().getHours()),
      added: null,
      query: '',
      places: {},
      custom: NEW_CUSTOM,
      hiddenRecents: [],
      setDay: day => set({ day, pinned: day !== today() }),
      rollover: () => set(s => (!s.pinned && s.day !== today() ? { day: today(), meal: mealForHour(new Date().getHours()) } : {})),
      setMeal: meal => set({ meal }),
      setAdded: added => set({ added }),
      setQuery: query => set({ query }),
      setPlace: (place, patch) => set(s => ({ places: { ...s.places, [place]: { orderName: 'À la carte', build: null, filter: 'all', qty: 1, ...s.places[place], ...patch } } })),
      hideRecent: (key, hidden) => set(s => ({ hiddenRecents: [...s.hiddenRecents.filter(k => k !== key), ...(hidden ? [key] : [])] })),
      setCustom: patch => set(s => ({ custom: patch ? { ...s.custom, ...patch } : NEW_CUSTOM })),
    }),
    { name: 'calorie-ui', storage: createJSONStorage(() => AsyncStorage), partialize: s => ({ places: s.places, custom: s.custom, hiddenRecents: s.hiddenRecents }) },
  ),
);
