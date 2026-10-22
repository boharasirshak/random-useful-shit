import { byId, type Restaurant } from '../data/menu.ts';

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

// Undo one add: lowers the matching line by one (removing it at zero).
export function removeEntry(entries: Entry[] = [], e: Omit<Entry, 'qty'>): Entry[] {
  const i = entries.findIndex(x => sameLine(x, e));
  return i < 0 ? entries : stepEntry(entries, i, -1);
}

export type Order = Omit<Entry, 'qty' | 'meal'>; // what you ate, regardless of meal

// Your latest distinct orders from one restaurant (plates count as one order), newest first.
export function recentOrders(logs: Logs, restaurant: Restaurant, limit = 8): Order[] {
  const seen = new Set<string>(), out: Order[] = [];
  for (const day of Object.keys(logs).sort().reverse()) {
    for (const e of [...logs[day]].reverse()) {
      const key = (e.name ?? '') + JSON.stringify(e.parts);
      if (seen.has(key) || byId[e.parts[0]?.id]?.restaurant !== restaurant) continue;
      seen.add(key);
      out.push({ name: e.name, parts: e.parts });
      if (out.length === limit) return out;
    }
  }
  return out;
}

export function stepEntry(entries: Entry[], index: number, by: number): Entry[] {
  return entries.map((x, i) => (i === index ? { ...x, qty: x.qty + by } : x)).filter(x => x.qty > 0);
}

// How many of an item were eaten that day, across all meals and combos.
export function countItem(entries: Entry[] = [], id: string) {
  return entries.reduce((t, e) => t + e.qty * e.parts.reduce((s, p) => s + (p.id === id ? p.qty : 0), 0), 0);
}
