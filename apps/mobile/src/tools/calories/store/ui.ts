// Screen state shared between tabs and the Add sheet. Not persisted.
import { create } from 'zustand';
import { today } from '@/tools/calories/lib/dates';
import { mealForHour, type Meal } from '@/tools/calories/lib/log';

type Ui = { day: string; meal: Meal; setDay: (day: string) => void; setMeal: (meal: Meal) => void };

export const useUi = create<Ui>()(set => ({
  day: today(),
  meal: mealForHour(new Date().getHours()),
  setDay: day => set({ day }),
  setMeal: meal => set({ meal }),
}));
