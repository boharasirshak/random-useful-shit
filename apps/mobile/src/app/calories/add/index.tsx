import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { byId, MENU, PLACES, type MenuItem, type Restaurant } from '@/tools/calories/data/menu';
import { AddBar } from '@/tools/calories/features/add/AddBar';
import { FoodRow } from '@/tools/calories/features/add/FoodRow';
import { MealTitle } from '@/tools/calories/features/add/MealTitle';
import { PlaceBadge } from '@/tools/calories/features/add/PlaceBadge';
import { SwipeRow } from '@/tools/calories/features/add/SwipeRow';
import { TopBar } from '@/tools/calories/features/add/TopBar';
import { useLogFood } from '@/tools/calories/features/add/useLogFood';
import { countOrder, entryKcal, isCustom, orderKey, recentOrders, type Order } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useCatalog } from '@/tools/calories/store/catalog';
import { useUi } from '@/tools/calories/store/ui';
import { tap } from '@/ui/haptics';
import { Heading } from '@/ui/Heading';
import { hairline, radius, space, type, useColors } from '@/ui/theme';

// Shake and custom first, then the chains A–Z, then the store and home.
const KIND_ORDER = { app: 0, fast: 1, store: 2, home: 3 };
const PLACE_LIST = (Object.values(PLACES).sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || (a.kind === 'app' ? 0 : a.name.localeCompare(b.name))).map(p => p.id)) as Restaurant[];
const placeName = (id: Restaurant) => PLACES[id]?.name ?? id;
const RECENT = 3; // shown until you tap Show More
const RECENT_MAX = 20;
const mainId = (o: Order) => (o.parts.find(p => byId[p.id]?.category !== 'base') ?? o.parts[0]).id;
const detail = (o: Order) => o.parts.map(p => byId[p.id]?.name).filter(Boolean).join(', ');

// Add Food, step 1: search everything, re-add a recent order, or pick a place.
// Built to scale: with many places this list gets favorites + A–Z, and search stays the fast path.
export default function AddHome() {
  const c = useColors();
  const { meal, setMeal } = useUi();
  const logs = useApp(s => s.logs);
  const day = useUi(s => s.day);
  const favorites = useApp(s => s.favorites);
  const toggleFavorite = useApp(s => s.toggleFavorite);
  const shake = useApp(s => s.shake);
  const { add } = useLogFood();
  const query = useUi(s => s.query);
  const setQuery = useUi(s => s.setQuery);
  const q = query.trim().toLowerCase();
  const version = useCatalog(s => s.version); // eslint-disable-line @typescript-eslint/no-unused-vars -- re-run the search once the downloaded catalog loads
  // Every word typed must appear in the name, brand or place ("kirkland chicken", "mcd fries").
  const words = q.split(/\s+/).filter(Boolean);
  const starts = (m: MenuItem) => (m.name.toLowerCase().startsWith(q) ? 1 : 0);
  const results = q ? MENU.filter(m => m.restaurant !== 'custom').filter(m => {
    const hay = `${m.name} ${m.brand ?? ''} ${placeName(m.restaurant)}`.toLowerCase();
    return words.every(w => hay.includes(w));
  }).sort((a, b) => starts(b) - starts(a)).slice(0, 40) : [];
  const favKeys = new Set(favorites.map(orderKey));
  const hidden = useUi(s => s.hiddenRecents);
  const hideRecent = useUi(s => s.hideRecent);
  const [moreRecents, setMoreRecents] = useState(false);
  const allRecents = recentOrders(logs, undefined, RECENT_MAX + favorites.length + hidden.length).filter(o => !favKeys.has(orderKey(o)) && !hidden.includes(orderKey(o))).slice(0, RECENT_MAX);
  const recents = moreRecents ? allRecents : allRecents.slice(0, RECENT);
  const mealEntries = (logs[day] ?? []).filter(e => e.meal === meal);
  // One row for any order: + becomes ✓ once it's in this meal, ♥ pins it to Favorites.
  const row = (o: Order, key: string | number, subtitle?: string, onRemove?: () => void) => (
    <FoodRow key={key} onRemove={onRemove} thumb={mainId(o)} title={o.name ?? byId[o.parts[0].id]?.name ?? 'Food'} subtitle={subtitle ?? (o.name && !isCustom(o) ? detail(o) : undefined)}
      kcal={entryKcal({ ...o, meal, qty: 1 }, shake)} count={countOrder(mealEntries, o)}
      fav={favKeys.has(orderKey(o))} onFav={() => toggleFavorite(o)} onAdd={() => add(o)} />
  );

  const card = (children: React.ReactNode[]) => (
    <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, overflow: 'hidden' }}>
      {children.map((ch, i) => <Fragment key={i}>{i > 0 && <View style={{ height: hairline, backgroundColor: c.separator, marginLeft: 72 }} />}{ch}</Fragment>)}
    </View>
  );
  const header = (t: string) => <View style={{ paddingBottom: space.sm }}><Heading title={t} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={<MealTitle meal={meal} onChange={setMeal} large />} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: space.md, paddingBottom: space.xl, gap: space.lg, width: '100%', maxWidth: 720, alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={{ marginHorizontal: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: c.fill, borderRadius: radius.md, paddingHorizontal: space.md }}>
          <Ionicons name="search" size={18} color={c.secondary} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search all food" placeholderTextColor={c.secondary} clearButtonMode="while-editing"
            autoCorrect={false} returnKeyType="search" accessibilityLabel="Search all food" style={[type.body, { flex: 1, color: c.label, paddingVertical: 9 }]} />
        </View>

        {q ? (
          results.length ? card(results.map(m => row({ parts: [{ id: m.id, qty: 1 }] }, m.id, [m.brand, placeName(m.restaurant)].filter(Boolean).join(' · ')))) : <Text style={[type.subhead, { color: c.secondary, textAlign: 'center', padding: space.xl }]}>Nothing matches “{query}”.</Text>
        ) : (
          <>
            {favorites.length > 0 && <View>{header('Favorites')}{card(favorites.map(o => row(o, orderKey(o))))}</View>}
            {recents.length > 0 && <View>{header('Recent')}{card([
              // Swipe right to add, left to take it off Recent.
              ...recents.map(o => <SwipeRow key={orderKey(o)} onAdd={() => add(o)} onRemove={() => hideRecent(orderKey(o), true)}>{row(o, orderKey(o), undefined, () => hideRecent(orderKey(o), true))}</SwipeRow>),
              ...(allRecents.length > RECENT ? [
                <Pressable key="more" onPress={() => { tap(); setMoreRecents(m => !m); }} accessibilityRole="button"
                  style={({ pressed }) => ({ paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: pressed ? c.fill : 'transparent' })}>
                  <Text style={[type.body, { color: c.tint }]}>{moreRecents ? 'Show Less' : 'Show More'}</Text>
                </Pressable>,
              ] : []),
            ])}</View>}
            <View>
              {header('Places')}
              {card(PLACE_LIST.map(p => (
                <Pressable key={p} onPress={() => { tap(); router.push({ pathname: '/calories/add/[place]', params: { place: p } }); }} accessibilityRole="button"
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm, minHeight: 60, backgroundColor: pressed ? c.fill : 'transparent' })}>
                  <PlaceBadge place={p} />
                  <View style={{ flex: 1 }}>
                    <Text style={[type.body, { color: c.label }]}>{placeName(p)}</Text>
                    <Text style={[type.footnote, { color: c.secondary }]}>{p === 'shake' ? `${shake} kcal per shake` : p === 'custom' ? 'Any amount' : `${MENU.filter(m => m.restaurant === p).length} items`}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={c.tertiary} />
                </Pressable>
              )))}
            </View>
          </>
        )}
      </ScrollView>
      <AddBar />
    </View>
  );
}

