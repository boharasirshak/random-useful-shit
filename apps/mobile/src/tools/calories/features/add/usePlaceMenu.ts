// State for one place's menu: how you're ordering (à la carte or a plate/meal), the meal being built, and the category filter.
import { useState } from 'react';
import { MENU, ORDERS, RESTAURANTS, type Category, type Restaurant } from '@/tools/calories/data/menu';
import { focus, pick, removeExtra, setHalf, startBuild, toParts, type Build } from '@/tools/calories/lib/builder';
import { countItem } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useUi } from '@/tools/calories/store/ui';
import { tap } from '@/ui/haptics';
import { useLogFood } from './useLogFood';

export const ALA_CARTE = 'À la carte';
export type Filter = Category | 'all';

export function usePlaceMenu(place: Restaurant) {
  const { day, meal } = useUi();
  const entries = useApp(s => s.logs[day]);
  const { add } = useLogFood();
  const [orderName, setOrderRaw] = useState(ALA_CARTE);
  const [build, setBuild] = useState<Build | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [qty, setQty] = useState(1);

  const orders = ORDERS[place];
  const order = orders?.[orderName] ?? null;
  const items = MENU.filter(m => m.restaurant === place);
  const comboName = `${place === 'cfa' ? 'Chick-fil-A' : RESTAURANTS[place].split(' ')[0]} ${orderName}`;

  return {
    name: RESTAURANTS[place], orders, orderName, order, build, items, filter, setFilter, qty,
    stepQty: (by: number) => setQty(q => Math.min(9, Math.max(1, q + by))),
    categories: [...new Set(items.map(m => m.category))],
    setOrder: (name: string) => {
      setOrderRaw(name);
      const o = ORDERS[place]?.[name];
      setBuild(o ? startBuild(o) : null);
      setQty(1);
    },
    // How many of an item are already in this meal (tiles show a green ✓ with the count).
    inMeal: (id: string) => countItem((entries ?? []).filter(e => e.meal === meal), id),
    tapItem: (id: string) => {
      if (!build || !order) return add({ parts: [{ id, qty: 1 }] });
      tap();
      setBuild(pick(build, id, order.extras));
    },
    focusSlot: (i: number) => build && setBuild(focus(build, i)),
    toggleHalf: (on: boolean) => build && setBuild(setHalf(build, on)),
    dropExtra: (i: number) => build && setBuild(removeExtra(build, i)),
    addBuild: () => {
      if (!build || !order) return;
      add({ name: comboName, parts: toParts(build) }, qty);
      setBuild(startBuild(order));
      setQty(1);
    },
  };
}
