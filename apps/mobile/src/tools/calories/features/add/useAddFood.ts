// State for the Add Food sheet: which restaurant, which way of ordering, the meal being built, and the last add (for Undo).
import { useState } from 'react';
import { byId, MENU, ORDERS, RESTAURANTS, type Restaurant } from '@/tools/calories/data/menu';
import { focus, pick, removeExtra, setHalf, startBuild, toParts, type Build } from '@/tools/calories/lib/builder';
import { countItem, recentOrders, totalKcal, type Order } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useBudget } from '@/tools/calories/store/derived';
import { useUi } from '@/tools/calories/store/ui';
import { success, tap, thud, warning } from '@/ui/haptics';

export const ALA_CARTE = 'À la carte';
export type Added = { order: Order; label: string; at: number };

export function useAddFood() {
  const { day, meal } = useUi();
  const entries = useApp(s => s.logs[day]);
  const logs = useApp(s => s.logs);
  const addFood = useApp(s => s.addFood);
  const undoFood = useApp(s => s.undoFood);
  const target = useBudget();
  const [restaurant, setRestaurantRaw] = useState<Restaurant>('cfa');
  const [orderName, setOrderRaw] = useState(ALA_CARTE);
  const [build, setBuild] = useState<Build | null>(null);
  const [query, setQuery] = useState('');
  const [added, setAdded] = useState<Added | null>(null);

  const orders = ORDERS[restaurant];
  const order = orders?.[orderName] ?? null;
  const items = MENU.filter(m => m.restaurant === restaurant && m.name.toLowerCase().includes(query.trim().toLowerCase()));

  const setRestaurant = (r: Restaurant) => { setRestaurantRaw(r); setOrderRaw(ALA_CARTE); setBuild(null); setQuery(''); };
  const setOrder = (name: string) => {
    setOrderRaw(name);
    const o = ORDERS[restaurant]?.[name];
    setBuild(o ? startBuild(o) : null);
  };

  // Every add goes through here: log it, buzz (a warning if it takes the day over target), and offer Undo.
  const add = (o: Order) => {
    addFood(day, { meal, ...o });
    const s = useApp.getState();
    (target != null && totalKcal(s.logs[day], s.shake) > target ? warning : success)();
    setAdded({ order: o, label: o.name ?? byId[o.parts[0].id]?.name ?? 'Food', at: Date.now() });
  };
  const comboName = `${restaurant === 'cfa' ? 'Chick-fil-A' : 'Panda'} ${orderName}`;

  return {
    restaurant, setRestaurant, orders, orderName, setOrder, order, build, query, setQuery, items, comboName, added,
    restaurants: Object.entries(RESTAURANTS) as [Restaurant, string][],
    recent: restaurant === 'shake' ? [] : recentOrders(logs, restaurant),
    loggedCount: (id: string) => countItem(entries, id),
    tapItem: (id: string) => {
      if (!build || !order) return add({ parts: [{ id, qty: 1 }] });
      tap();
      setBuild(pick(build, id, order.extras));
    },
    add,
    undo: () => {
      if (!added) return;
      thud();
      undoFood(day, { meal, ...added.order });
      setAdded(null);
    },
    dismissAdded: () => setAdded(null),
    focusSlot: (i: number) => build && setBuild(focus(build, i)),
    toggleHalf: (on: boolean) => build && setBuild(setHalf(build, on)),
    dropExtra: (i: number) => build && setBuild(removeExtra(build, i)),
    addBuild: () => {
      if (!build || !order) return;
      add({ name: comboName, parts: toParts(build) });
      setBuild(startBuild(order));
    },
  };
}
