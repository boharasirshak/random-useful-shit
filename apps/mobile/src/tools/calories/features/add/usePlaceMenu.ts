// State for one place's menu: how you're ordering (à la carte or a plate/meal), the meal being built, and the category filter.
// Kept in the store (and saved), so a half-built plate is still there after going back, closing the sheet or relaunching.
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
  const saved = useUi(s => s.places[place]);
  const setPlace = useUi(s => s.setPlace);
  const { orderName = ALA_CARTE, build = null, filter = 'all', qty = 1 } = saved ?? {};
  const setBuild = (b: Build | null) => setPlace(place, { build: b });
  const setFilter = (f: Filter) => setPlace(place, { filter: f });

  const orders = ORDERS[place];
  const order = orders?.[orderName] ?? null;
  const items = MENU.filter(m => m.restaurant === place);
  const comboName = `${place === 'cfa' ? 'Chick-fil-A' : RESTAURANTS[place].split(' ')[0]} ${orderName}`;

  return {
    name: RESTAURANTS[place], orders, orderName, order, build, items, filter, setFilter, qty,
    stepQty: (by: number) => setPlace(place, { qty: Math.min(9, Math.max(1, qty + by)) }),
    categories: [...new Set(items.map(m => m.category))],
    setOrder: (name: string) => {
      const o = ORDERS[place]?.[name];
      setPlace(place, { orderName: name, build: o ? startBuild(o) : null, qty: 1 });
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
      setPlace(place, { build: startBuild(order), qty: 1 });
    },
  };
}
