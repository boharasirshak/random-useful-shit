// Meal builder: fill the slots of a Panda bowl/plate or a Chick-fil-A meal, in order.
import { byId, type Category, type Order } from '../data/menu.ts';
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

// Tap an item: fills the active slot if it fits, otherwise counts as an add-on (e.g. a sauce).
export function pick(b: Build, id: string, extras?: Category): Build {
  const category = byId[id]?.category;
  if (b.active != null && b.slots[b.active].category === category) {
    const slots = b.slots.map((s, i) => (i === b.active ? { ...s, id } : s));
    return { ...b, slots, active: firstEmpty(slots) };
  }
  if (category && category === extras) return { ...b, extras: [...b.extras, id] };
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
