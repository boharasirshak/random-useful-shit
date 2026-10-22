import { byId } from '../data/menu.ts';

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
export const MEALS: Record<Meal, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks' };

export type Part = { id: string; qty: number }; // qty 0.5 = half portion
// One line in the log: a single item, or a combo (Panda Plate, Chick-fil-A Meal) when `name` is set.
export type Entry = { meal: Meal; name?: string; parts: Part[]; qty: number };
export type Logs = Record<string, Entry[]>;

export const mealForHour = (h: number): Meal => (h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snacks');

// Unknown ids count as 0 so a removed menu item never breaks old logs.
export const itemKcal = (id: string, shake: number) => {
  const item = byId[id];
  return item ? item.kcal ?? shake : 0;
};
export const entryKcal = (e: Entry, shake: number) => e.parts.reduce((t, p) => t + itemKcal(p.id, shake) * p.qty, 0);
export const totalKcal = (entries: Entry[] = [], shake: number) => entries.reduce((t, e) => t + entryKcal(e, shake) * e.qty, 0);

const sameLine = (a: Omit<Entry, 'qty'>, b: Omit<Entry, 'qty'>) =>
  a.meal === b.meal && a.name === b.name && JSON.stringify(a.parts) === JSON.stringify(b.parts);

// Adding an identical line bumps its quantity instead of duplicating it.
export function addEntry(entries: Entry[] = [], e: Omit<Entry, 'qty'>): Entry[] {
  const i = entries.findIndex(x => sameLine(x, e));
  if (i < 0) return [...entries, { ...e, qty: 1 }];
  return entries.map((x, j) => (j === i ? { ...x, qty: x.qty + 1 } : x));
}

export function stepEntry(entries: Entry[], index: number, by: number): Entry[] {
  return entries.map((x, i) => (i === index ? { ...x, qty: x.qty + by } : x)).filter(x => x.qty > 0);
}

// How many of an item were eaten that day, across all meals and combos.
export function countItem(entries: Entry[] = [], id: string) {
  return entries.reduce((t, e) => t + e.qty * e.parts.reduce((s, p) => s + (p.id === id ? p.qty : 0), 0), 0);
}
