import { router } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MENU, type Category } from '@/tools/calories/data/menu';
import { AddBar } from '@/tools/calories/features/add/AddBar';
import { BuilderPanel } from '@/tools/calories/features/add/BuilderPanel';
import { MealTitle } from '@/tools/calories/features/add/MealTitle';
import { MenuGrid } from '@/tools/calories/features/add/MenuGrid';
import { RecentStrip } from '@/tools/calories/features/add/RecentStrip';
import { ShakeCard } from '@/tools/calories/features/add/ShakeCard';
import { useAddFood } from '@/tools/calories/features/add/useAddFood';
import { buildKcal, isDone } from '@/tools/calories/lib/builder';
import { MEALS } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useUi } from '@/tools/calories/store/ui';
import { Segmented } from '@/ui/Segmented';
import { radius, space, type, useColors } from '@/ui/theme';

const SECTIONS: [Category, string][] = [
  ['entree', 'Entrées'], ['base', 'Bases'], ['side', 'Sides'], ['appetizer', 'Appetizers & soup'], ['drink', 'Drinks'], ['sauce', 'Sauces'],
];
const label = (cat: Category) => SECTIONS.find(s => s[0] === cat)![1];
const SLOT = { entree: 'entrée', base: 'base', side: 'side', drink: 'drink' } as Record<string, string>;
const fmt = (n: number) => Math.round(n).toLocaleString();

// Sheet for adding food to a meal: recent orders, à la carte, or build a plate/meal step by step.
export default function AddFood() {
  const c = useColors();
  const { meal, setMeal } = useUi();
  const shake = useApp(s => s.shake);
  const a = useAddFood();
  const mealName = MEALS[meal];
  const active = a.build?.active != null ? a.build.slots[a.build.active].category : null;
  const picked = new Set(a.build ? [...a.build.slots.map(s => s.id), ...a.build.extras] : []);
  const next = a.build?.slots.find(s => !s.id);

  const action = a.restaurant === 'shake'
    ? { title: `Add to ${mealName} · ${fmt(shake)} kcal`, onPress: () => a.add({ parts: [{ id: 'shake', qty: 1 }] }) }
    : a.build
      ? isDone(a.build)
        ? { title: `Add to ${mealName} · ${fmt(buildKcal(a.build, shake))} kcal`, onPress: a.addBuild }
        : { title: `Pick ${next ? SLOT[next.category] : 'items'}`, disabled: true, onPress: () => {} }
      : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm }}>
        <MealTitle meal={meal} onChange={setMeal} />
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/calories'))} hitSlop={10} accessibilityRole="button">
          <Text style={[type.headline, { color: c.tint }]}>Done</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: space.lg, paddingTop: space.xs, paddingBottom: space.xl, width: '100%', maxWidth: 720, alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={{ gap: space.sm }}>
          <Segmented options={a.restaurants} value={a.restaurant} onChange={a.setRestaurant} />
          {a.orders && <Segmented options={Object.keys(a.orders).map(o => [o, o] as [string, string])} value={a.orderName} onChange={a.setOrder} />}
        </View>

        {a.restaurant === 'shake' ? (
          <ShakeCard />
        ) : a.build && a.order ? (
          <>
            <BuilderPanel build={a.build} canHalf={a.order.slots.includes('base')}
              onFocus={a.focusSlot} onHalf={a.toggleHalf} onRemoveExtra={a.dropExtra} />
            {active
              ? <MenuGrid title={`Choose ${SLOT[active]}`} items={MENU.filter(m => m.restaurant === a.restaurant && m.category === active)}
                  onPick={a.tapItem} selected={id => picked.has(id)} />
              : <Text style={[type.subhead, { color: c.secondary, paddingHorizontal: space.xl }]}>All set. Tap a row to swap something.</Text>}
            {a.order.extras && (
              <MenuGrid title={`Add ${label(a.order.extras).toLowerCase()} (optional)`} items={MENU.filter(m => m.restaurant === a.restaurant && m.category === a.order!.extras)}
                onPick={a.tapItem} badge={id => a.build!.extras.filter(x => x === id).length} />
            )}
          </>
        ) : (
          <>
            <TextInput value={a.query} onChangeText={a.setQuery} placeholder="Search menu" placeholderTextColor={c.secondary} clearButtonMode="while-editing"
              autoCorrect={false} accessibilityLabel="Search menu" returnKeyType="search"
              style={[type.body, { color: c.label, backgroundColor: c.fill, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 8, marginHorizontal: space.lg }]} />
            {!a.query && <RecentStrip orders={a.recent} onAdd={a.add} />}
            {SECTIONS.map(([cat, title]) => (
              <MenuGrid key={cat} title={title} items={a.items.filter(m => m.category === cat)} onPick={a.tapItem} badge={a.loggedCount} />
            ))}
          </>
        )}
      </ScrollView>

      <AddBar action={action} added={a.added} meal={mealName} onUndo={a.undo} onDismiss={a.dismissAdded} />
    </View>
  );
}
