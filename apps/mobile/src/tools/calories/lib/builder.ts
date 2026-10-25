// Meal builder: fill the slots of a Panda bowl/plate or a Chick-fil-A meal, in order.
import { byId, extrasOf, type Category, type Order } from '../data/menu.ts';
import { itemKcal, type Part } from './log.ts';

export type Slot = { category: Category; qty: number; id: string | null };
export type Build = { slots: Slot[]; extras: string[]; active: number | null; half: boolean };

const firstEmpty = (slots: Slot[]) => {
  const i = slots.findIndex(s => !s.id);
  return i < 0 ? null : i;
};

export const startBuild = (order: NonNullable<Order>): Build => ({
  slots: order.slots.map(category => ({ category, qty: 1, id: null })),
  extras: [],
  active: 0,
  half: false,
});

// Tap an item: fills the active slot if it fits, otherwise counts as an add-on (a sauce, a topping).
export function pick(b: Build, id: string, extras: Category[] = []): Build {
  const category = byId[id]?.category;
  if (b.active != null && b.slots[b.active].category === category) {
    const slots = b.slots.map((s, i) => (i === b.active ? { ...s, id } : s));
    return { ...b, slots, active: firstEmpty(slots) };
  }
  if (category && extras.includes(category)) return { ...b, extras: [...b.extras, id] };
  return b;
}

export const focus = (b: Build, index: number): Build => ({ ...b, active: index });
export const removeExtra = (b: Build, index: number): Build => ({ ...b, extras: b.extras.filter((_, i) => i !== index) });

// Panda lets you split the base half & half.
export function setHalf(b: Build, on: boolean): Build {
  if (on === b.half) return b;
  const i = b.slots.findIndex(s => s.category === 'base');
  if (i < 0) return b;
  const slots = [...b.slots];
  if (on) slots.splice(i, 1, { category: 'base', qty: 0.5, id: slots[i].id }, { category: 'base', qty: 0.5, id: null });
  else slots.splice(i, 2, { category: 'base', qty: 1, id: slots[i].id });
  return { ...b, slots, half: on, active: firstEmpty(slots) };
}

export const isDone = (b: Build) => b.slots.every(s => s.id);

// The other way round, to edit a logged plate: refill the slots from its parts, the rest are add-ons.
// Two halves of the same base were merged into one part, so they come back as a whole base.
export function fromParts(order: NonNullable<Order>, parts: Part[]): Build {
  const left = parts.map(p => ({ ...p }));
  const take = (category: Category, qty: number) => {
    const p = left.find(x => x.qty >= qty && byId[x.id]?.category === category);
    if (!p) return null;
    p.qty -= qty;
    return p.id;
  };
  let b = startBuild(order);
  if (parts.some(p => p.qty % 1 && byId[p.id]?.category === 'base')) b = setHalf(b, true);
  const slots = b.slots.map(s => ({ ...s, id: take(s.category, s.qty) }));
  const extras = left.flatMap(p => (extrasOf(order).includes(byId[p.id]?.category as Category) ? Array<string>(Math.floor(p.qty)).fill(p.id) : []));
  return { ...b, slots, extras, active: firstEmpty(slots) };
}

export function toParts(b: Build): Part[] {
  const parts: Part[] = [];
  for (const { id, qty } of [...b.slots, ...b.extras.map(id => ({ id, qty: 1 }))]) {
    if (!id) continue;
    const p = parts.find(x => x.id === id);
    if (p) p.qty += qty;
    else parts.push({ id, qty });
  }
  return parts;
}

export const buildKcal = (b: Build, shake: number) => toParts(b).reduce((t, p) => t + itemKcal(p.id, shake) * p.qty, 0);
