import { byId, type Restaurant } from '../data/menu.ts';

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
export const MEALS: Record<Meal, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks' };

export type Part = { id: string; qty: number }; // qty 0.5 = half portion
// One line in the log: a single item, or a combo (Panda Plate, Chick-fil-A Meal) when `name` is set.
export type Entry = { meal: Meal; name?: string; parts: Part[]; qty: number };
export type Logs = Record<string, Entry[]>;

// How a day's target splits across meals, for the per-meal "320 / 790" on Food.
export const MEAL_SHARE: Record<Meal, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snacks: 0.1 };

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

// A day is closed once its eating is final: marked "Done for the Day", or any earlier day with food logged.
// Today stays open (and counts live everywhere) until midnight, when it closes on its own.
export const isClosed = (logs: Logs, done: Record<string, boolean>, today: string) => (day: string) =>
  !!done[day] || (day < today && (logs[day]?.length ?? 0) > 0);
export const closedDays = (logs: Logs, done: Record<string, boolean>, today: string) =>
  [...new Set([...Object.keys(done), ...Object.keys(logs)])].filter(isClosed(logs, done, today)).sort();

// Undo one add: lowers the matching line by one (removing it at zero).
export function removeEntry(entries: Entry[] = [], e: Omit<Entry, 'qty'>): Entry[] {
  const i = entries.findIndex(x => sameLine(x, e));
  return i < 0 ? entries : stepEntry(entries, i, -1);
}

export type Order = Omit<Entry, 'qty' | 'meal'>; // what you ate, regardless of meal
// Custom calories: `name` is what you typed, not a combo, so its parts (kcal and grams) aren't worth listing.
export const isCustom = (o: Order) => o.parts[0]?.id === 'custom';
// Identity of an order: same name and same parts = same order.
export const orderKey = (o: Order) => (o.name ?? '') + JSON.stringify(o.parts);

// How many of this exact order are in a list of entries (e.g. one meal).
export const countOrder = (entries: Entry[], o: Order) => entries.filter(e => orderKey(e) === orderKey(o)).reduce((t, e) => t + e.qty, 0);

// Your latest distinct orders (plates count as one order), newest first. Optionally from one restaurant only.
export function recentOrders(logs: Logs, restaurant?: Restaurant, limit = 8): Order[] {
  const seen = new Set<string>(), out: Order[] = [];
  for (const day of Object.keys(logs).sort().reverse()) {
    for (const e of [...logs[day]].reverse()) {
      const key = orderKey(e);
      if (seen.has(key) || (restaurant && byId[e.parts[0]?.id]?.restaurant !== restaurant)) continue;
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

// Grams of protein, carbs and fat. The shake uses what you set: its protein, and the rest of its calories split
// evenly between carbs and fat (energy-wise), which is close for most protein shakes.
export type Macros = { p: number; c: number; f: number };
export function itemMacros(id: string, shake: number, shakeProtein: number): Macros {
  const m = byId[id];
  if (!m) return { p: 0, c: 0, f: 0 };
  if (m.kcal == null) {
    const rest = Math.max(0, shake - shakeProtein * 4) / 2;
    return { p: shakeProtein, c: rest / 4, f: rest / 9 };
  }
  return { p: m.p ?? 0, c: m.c ?? 0, f: m.f ?? 0 };
}
export function totalMacros(entries: Entry[] = [], shake: number, shakeProtein: number): Macros {
  const t = { p: 0, c: 0, f: 0 };
  for (const e of entries) for (const part of e.parts) {
    const m = itemMacros(part.id, shake, shakeProtein), n = part.qty * e.qty;
    t.p += m.p * n; t.c += m.c * n; t.f += m.f * n;
  }
  return t;
}

// Sodium in mg. The shake and custom calories have none on record.
export const totalSodium = (entries: Entry[] = []) =>
  entries.reduce((t, e) => t + e.qty * e.parts.reduce((s, p) => s + (byId[p.id]?.na ?? 0) * p.qty, 0), 0);
