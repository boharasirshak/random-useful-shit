// Screen state shared between tabs and the Add Food screens. Not persisted.
import { create } from 'zustand';
import { today } from '@/tools/calories/lib/dates';
import { mealForHour, type Meal, type Order } from '@/tools/calories/lib/log';

// The last thing added, so "Added … Undo" can show on whichever Add Food page you're on.
export type Added = { order: Order; label: string; at: number };

type Ui = {
  day: string;
  meal: Meal;
  added: Added | null;
  setDay: (day: string) => void;
  setMeal: (meal: Meal) => void;
  setAdded: (added: Added | null) => void;
};

export const useUi = create<Ui>()(set => ({
  day: today(),
  meal: mealForHour(new Date().getHours()),
  added: null,
  setDay: day => set({ day }),
  setMeal: meal => set({ meal }),
  setAdded: added => set({ added }),
}));
