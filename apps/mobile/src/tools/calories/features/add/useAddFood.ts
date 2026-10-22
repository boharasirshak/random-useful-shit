// State for the Add Food sheet: which restaurant, which way of ordering, and the meal being built.
import { useState } from 'react';
import { MENU, ORDERS, RESTAURANTS, type Restaurant } from '@/tools/calories/data/menu';
import { focus, pick, removeExtra, setHalf, startBuild, toParts, type Build } from '@/tools/calories/lib/builder';
import { countItem } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useUi } from '@/tools/calories/store/ui';
import { success, tap } from '@/ui/haptics';

export const ALA_CARTE = 'À la carte';

export function useAddFood() {
  const { day, meal } = useUi();
  const entries = useApp(s => s.logs[day]);
  const addFood = useApp(s => s.addFood);
  const [restaurant, setRestaurantRaw] = useState<Restaurant>('cfa');
  const [orderName, setOrderRaw] = useState(ALA_CARTE);
  const [build, setBuild] = useState<Build | null>(null);
  const [query, setQuery] = useState('');

  const orders = ORDERS[restaurant];
  const order = orders?.[orderName] ?? null;
  const items = MENU.filter(m => m.restaurant === restaurant && m.name.toLowerCase().includes(query.trim().toLowerCase()));

  const setRestaurant = (r: Restaurant) => { setRestaurantRaw(r); setOrderRaw(ALA_CARTE); setBuild(null); setQuery(''); };
  const setOrder = (name: string) => {
    setOrderRaw(name);
    const o = ORDERS[restaurant]?.[name];
    setBuild(o ? startBuild(o) : null);
  };

  const addSingle = (id: string) => { success(); addFood(day, { meal, parts: [{ id, qty: 1 }] }); };
  const comboName = `${restaurant === 'cfa' ? 'Chick-fil-A' : 'Panda'} ${orderName}`;

  return {
    restaurant, setRestaurant, orders, orderName, setOrder, order, build, query, setQuery, items, comboName,
    restaurants: Object.entries(RESTAURANTS) as [Restaurant, string][],
    loggedCount: (id: string) => countItem(entries, id),
    tapItem: (id: string) => {
      if (!build || !order) return addSingle(id);
      tap();
      setBuild(pick(build, id, order.extras));
    },
    addSingle,
    focusSlot: (i: number) => build && setBuild(focus(build, i)),
    toggleHalf: (on: boolean) => build && setBuild(setHalf(build, on)),
    dropExtra: (i: number) => build && setBuild(removeExtra(build, i)),
    addBuild: () => {
      if (!build || !order) return;
      success();
      addFood(day, { meal, name: comboName, parts: toParts(build) });
      setBuild(startBuild(order));
    },
  };
}
