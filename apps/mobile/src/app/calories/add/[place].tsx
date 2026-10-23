import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { RESTAURANTS, type Category, type Restaurant } from '@/tools/calories/data/menu';
import { AddBar } from '@/tools/calories/features/add/AddBar';
import { BuilderPanel } from '@/tools/calories/features/add/BuilderPanel';
import { MenuGrid } from '@/tools/calories/features/add/MenuGrid';
import { PlaceBadge } from '@/tools/calories/features/add/PlaceBadge';
import { ShakeCard } from '@/tools/calories/features/add/ShakeCard';
import { TopBar } from '@/tools/calories/features/add/TopBar';
import { useLogFood } from '@/tools/calories/features/add/useLogFood';
import { usePlaceMenu, type Filter } from '@/tools/calories/features/add/usePlaceMenu';
import { buildKcal, isDone } from '@/tools/calories/lib/builder';
import { MEALS } from '@/tools/calories/lib/log';
import { useBudget } from '@/tools/calories/store/derived';
import { useApp } from '@/tools/calories/store/app';
import { useUi } from '@/tools/calories/store/ui';
import { Chips } from '@/ui/Chips';
import { Section } from '@/ui/Section';
import { Stepper } from '@/ui/Stepper';
import { nums, space, type, useColors } from '@/ui/theme';
import { range, WheelRow } from '@/ui/WheelRow';

const CATEGORY: Record<Category, string> = { entree: 'Entrées', base: 'Bases', side: 'Sides', appetizer: 'Appetizers', drink: 'Drinks', sauce: 'Sauces', shake: 'Shake', custom: 'Custom' };
const ONE: Record<string, string> = { entree: 'entrée', base: 'base', side: 'side', drink: 'drink' };
const fmt = (n: number) => Math.round(n).toLocaleString();
const CUSTOM = range(1, 300).map(n => n * 10); // 10–3,000 kcal
const GRAMS = range(0, 300);
const MACROS = [['p', 'Protein'], ['c', 'Carbs'], ['f', 'Fat']] as const;

// Add Food, step 2: one place's menu. Order type and category are swipeable chips, so long menus stay tidy.
export default function PlaceMenu() {
  const { place: raw } = useLocalSearchParams<{ place: string }>();
  const place = (raw in RESTAURANTS ? raw : 'cfa') as Restaurant;
  const c = useColors();
  const meal = useUi(s => s.meal);
  const shake = useApp(s => s.shake);
  const { add } = useLogFood();
  const target = useBudget();
  const m = usePlaceMenu(place);
  const [custom, setCustom] = useState({ kcal: 300, p: 0, c: 0, f: 0 });
  // Calories, then any macros you set as 1 g parts (0 g ones left out).
  const customParts = [{ id: 'custom', qty: custom.kcal }, ...MACROS.map(([k]) => ({ id: `custom-${k}`, qty: custom[k] })).filter(p => p.qty)];
  const mealName = MEALS[meal];
  const active = m.build?.active != null ? m.build.slots[m.build.active].category : null;
  const picked = new Set(m.build ? [...m.build.slots.map(s => s.id), ...m.build.extras] : []);
  const next = m.build?.slots.find(s => !s.id);
  const shown = m.filter === 'all' ? m.categories : [m.filter];

  const action = place === 'shake'
    ? { title: `Add to ${mealName} · ${fmt(shake)} kcal`, onPress: () => add({ parts: [{ id: 'shake', qty: 1 }] }) }
    : place === 'custom'
      ? { title: `Add to ${mealName} · ${fmt(custom.kcal)} kcal`, onPress: () => add({ parts: customParts }) }
      : m.build
      ? isDone(m.build)
        ? { title: `Add to ${mealName}`, onPress: m.addBuild }
        : { title: `Pick ${next ? ONE[next.category] : 'items'}`, disabled: true, onPress: () => {} }
      : undefined;

  // While building: the running total as you pick, how much of today it is, and how many you're having.
  const total = m.build ? buildKcal(m.build, shake) * m.qty : 0;
  const summary = m.build && (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <View style={{ flex: 1 }}>
        <Text style={[type.headline, nums, { color: c.label }]}>{fmt(total)} kcal{isDone(m.build) ? '' : ' so far'}</Text>
        {target != null && <Text style={[type.footnote, nums, { color: total > target ? c.red : c.secondary }]}>{Math.round((total / target) * 100)}% of today’s {fmt(target)}</Text>}
      </View>
      <Text style={[type.subhead, { color: c.secondary }]}>Qty</Text>
      <Stepper value={m.qty} onStep={m.stepQty} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar back={mealName} title={m.name} badge={<PlaceBadge place={place} size={40} />} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: space.md, paddingBottom: space.xl, gap: space.lg, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
        {m.orders && <Chips options={Object.keys(m.orders).map(o => [o, o] as [string, string])} value={m.orderName} onChange={m.setOrder} />}

        {place === 'shake' ? (
          <ShakeCard />
        ) : place === 'custom' ? (
          <Section footer="For anything that isn’t on a menu. Protein, carbs and fat are optional.">
            <WheelRow label="Calories" startOpen wheels={[{ value: custom.kcal, options: CUSTOM, suffix: 'kcal', format: fmt, onChange: kcal => setCustom(s => ({ ...s, kcal })) }]} />
            {MACROS.map(([k, label]) => (
              <WheelRow key={k} label={label} wheels={[{ value: custom[k], options: GRAMS, suffix: 'g', onChange: g => setCustom(s => ({ ...s, [k]: g })) }]} />
            ))}
          </Section>
        ) : m.build && m.order ? (
          <>
            <BuilderPanel build={m.build} canHalf={m.order.slots.includes('base')} onFocus={m.focusSlot} onHalf={m.toggleHalf} onRemoveExtra={m.dropExtra} />
            {active
              ? <MenuGrid title={`Choose ${ONE[active]}`} items={m.items.filter(i => i.category === active)} onPick={m.tapItem} selected={id => picked.has(id)} />
              : <Text style={[type.subhead, { color: c.secondary, paddingHorizontal: space.xl }]}>All set. Tap a row to swap something.</Text>}
            {m.order.extras && (
              <MenuGrid title={`Add ${CATEGORY[m.order.extras].toLowerCase()} (optional)`} items={m.items.filter(i => i.category === m.order!.extras)}
                onPick={m.tapItem} badge={id => m.build!.extras.filter(x => x === id).length} />
            )}
          </>
        ) : (
          <>
            {m.categories.length > 1 && (
              <Chips options={[['all', 'All'] as [Filter, string], ...m.categories.map(k => [k, CATEGORY[k]] as [Filter, string])]} value={m.filter} onChange={m.setFilter} />
            )}
            {shown.map(k => <MenuGrid key={k} title={CATEGORY[k]} items={m.items.filter(i => i.category === k)} onPick={m.tapItem} badge={m.inMeal} />)}
          </>
        )}
      </ScrollView>
      <AddBar action={action} summary={summary || undefined} />
    </View>
  );
}
