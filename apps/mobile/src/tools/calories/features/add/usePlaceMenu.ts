// State for one place's menu: how you're ordering (à la carte or a plate/meal), the meal being built, and the category filter.
// Kept in the store (and saved), so a half-built plate is still there after going back, closing the sheet or relaunching.
// Editing a logged plate works on its own copy instead, so it never touches that draft; saving swaps the logged line.
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { extrasOf, itemsOf, ORDERS, PLACES, type Category, type Restaurant } from '@/tools/calories/data/menu';
import { focus, fromParts, pick, removeExtra, setHalf, startBuild, toParts, type Build } from '@/tools/calories/lib/builder';
import { countItem, type Entry } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useCatalog } from '@/tools/calories/store/catalog';
import { useUi, type PlaceState } from '@/tools/calories/store/ui';
import { tap } from '@/ui/haptics';
import { useLogFood } from './useLogFood';

export const ALA_CARTE = 'À la carte';
export type Filter = Category | 'all';

// "Panda Plate", "Chick-fil-A Meal", "McDonald's Meal": the logged line's name. Panda keeps its short form: old logs use it.
const comboOf = (place: Restaurant, orderName: string) => `${place === 'panda' ? 'Panda' : PLACES[place]?.name ?? place} ${orderName}`;

// A logged plate back as builder state: which order it was (from its name), its slots, and how many.
function editState(place: Restaurant, e: Entry): PlaceState {
  const orderName = Object.keys(ORDERS[place] ?? {}).find(n => comboOf(place, n) === e.name) ?? ALA_CARTE;
  const order = ORDERS[place]?.[orderName];
  return { orderName, build: order ? fromParts(order, e.parts) : null, filter: 'all', qty: e.qty };
}

export function usePlaceMenu(place: Restaurant, edit?: { index: number; entry: Entry }) {
  const { day, meal } = useUi();
  const entries = useApp(s => s.logs[day]);
  const editFood = useApp(s => s.editFood);
  const { add } = useLogFood();
  const stored = useUi(s => s.places[place]);
  const setStored = useUi(s => s.setPlace);
  const [draft, setDraft] = useState(() => (edit ? editState(place, edit.entry) : null));
  const { orderName = ALA_CARTE, build = null, filter = 'all', qty = 1 } = draft ?? stored ?? {};
  const update = (patch: Partial<PlaceState>) => (draft ? setDraft({ ...draft, ...patch }) : setStored(place, patch));
  const setBuild = (b: Build | null) => update({ build: b });
  const setFilter = (f: Filter) => update({ filter: f });

  const orders = ORDERS[place];
  const order = orders?.[orderName] ?? null;
  const version = useCatalog(s => s.version); // the downloaded catalog arriving adds items
  const items = useMemo(() => itemsOf(place), [place, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const comboName = comboOf(place, orderName);

  return {
    name: PLACES[place]?.name ?? place, orders, orderName, order, build, items, filter, setFilter, qty,
    stepQty: (by: number) => update({ qty: Math.min(9, Math.max(1, qty + by)) }),
    categories: [...new Set(items.map(m => m.category))],
    setOrder: (name: string) => {
      const o = ORDERS[place]?.[name];
      update({ orderName: name, build: o ? startBuild(o) : null, qty: draft ? qty : 1 });
    },
    // How many of an item are already in this meal (tiles show a green ✓ with the count).
    inMeal: (id: string) => countItem((entries ?? []).filter(e => e.meal === meal), id),
    tapItem: (id: string) => {
      if (!build || !order) return add({ parts: [{ id, qty: 1 }] });
      tap();
      setBuild(pick(build, id, extrasOf(order)));
    },
    focusSlot: (i: number) => build && setBuild(focus(build, i)),
    toggleHalf: (on: boolean) => build && setBuild(setHalf(build, on)),
    dropExtra: (i: number) => build && setBuild(removeExtra(build, i)),
    addBuild: () => {
      if (!build || !order) return;
      if (edit) {
        editFood(day, edit.index, { ...edit.entry, name: comboName, parts: toParts(build), qty });
        return router.back();
      }
      add({ name: comboName, parts: toParts(build) }, qty);
      update({ build: startBuild(order), qty: 1 });
    },
  };
}
