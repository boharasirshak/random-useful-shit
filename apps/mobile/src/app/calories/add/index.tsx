import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { byId, MENU, RESTAURANTS, type Restaurant } from '@/tools/calories/data/menu';
import { AddBar } from '@/tools/calories/features/add/AddBar';
import { FoodRow } from '@/tools/calories/features/add/FoodRow';
import { MealTitle } from '@/tools/calories/features/add/MealTitle';
import { PlaceBadge } from '@/tools/calories/features/add/PlaceBadge';
import { TopBar } from '@/tools/calories/features/add/TopBar';
import { useLogFood } from '@/tools/calories/features/add/useLogFood';
import { countOrder, entryKcal, orderKey, recentOrders, type Order } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useUi } from '@/tools/calories/store/ui';
import { tap } from '@/ui/haptics';
import { Heading } from '@/ui/Heading';
import { hairline, radius, space, type, useColors } from '@/ui/theme';

const PLACES = Object.keys(RESTAURANTS) as Restaurant[];
const RECENT = 5;
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
  const results = q ? MENU.filter(m => m.name.toLowerCase().includes(q) || RESTAURANTS[m.restaurant].toLowerCase().includes(q)).slice(0, 40) : [];
  const favKeys = new Set(favorites.map(orderKey));
  const recents = recentOrders(logs, undefined, RECENT + favorites.length).filter(o => !favKeys.has(orderKey(o))).slice(0, RECENT);
  const mealEntries = (logs[day] ?? []).filter(e => e.meal === meal);
  // One row for any order: + becomes ✓ once it's in this meal, ♥ pins it to Favorites.
  const row = (o: Order, key: string | number, subtitle?: string) => (
    <FoodRow key={key} thumb={mainId(o)} title={o.name ?? byId[o.parts[0].id]?.name ?? 'Food'} subtitle={subtitle ?? (o.name ? detail(o) : undefined)}
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
          results.length ? card(results.map(m => row({ parts: [{ id: m.id, qty: 1 }] }, m.id, RESTAURANTS[m.restaurant]))) : <Text style={[type.subhead, { color: c.secondary, textAlign: 'center', padding: space.xl }]}>Nothing matches “{query}”.</Text>
        ) : (
          <>
            {favorites.length > 0 && <View>{header('Favorites')}{card(favorites.map(o => row(o, orderKey(o))))}</View>}
            {recents.length > 0 && <View>{header('Recent')}{card(recents.map(o => row(o, orderKey(o))))}</View>}
            <View>
              {header('Places')}
              {card(PLACES.map(p => (
                <Pressable key={p} onPress={() => { tap(); router.push({ pathname: '/calories/add/[place]', params: { place: p } }); }} accessibilityRole="button"
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm, minHeight: 60, backgroundColor: pressed ? c.fill : 'transparent' })}>
                  <PlaceBadge place={p} />
                  <View style={{ flex: 1 }}>
                    <Text style={[type.body, { color: c.label }]}>{RESTAURANTS[p]}</Text>
                    <Text style={[type.footnote, { color: c.secondary }]}>{p === 'shake' ? `${shake} kcal per shake` : `${MENU.filter(m => m.restaurant === p).length} items`}</Text>
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

