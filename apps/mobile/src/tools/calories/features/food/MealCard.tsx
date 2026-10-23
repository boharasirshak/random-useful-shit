import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Fragment } from 'react';
import { Pressable, Text, View } from 'react-native';
import { byId } from '@/tools/calories/data/menu';
import { Thumb } from '@/tools/calories/features/Thumb';
import { entryKcal, isCustom, MEAL_SHARE, MEALS, totalKcal, type Entry, type Meal } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useBudget } from '@/tools/calories/store/derived';
import { useUi } from '@/tools/calories/store/ui';
import { tap, thud } from '@/ui/haptics';
import { Stepper } from '@/ui/Stepper';
import { hairline, nums, radius, space, type, useColors } from '@/ui/theme';

const fmt = (n: number) => Math.round(n).toLocaleString();
const name = (id: string) => byId[id]?.name ?? 'Removed item';
const qtyLabel = (q: number) => (q === 0.5 ? '½ ' : q !== 1 ? `${q}× ` : '');
// The photo for a line: the first non-base part (the entrée, not the rice).
const mainPart = (e: Entry) => e.parts.find(p => byId[p.id]?.category !== 'base') ?? e.parts[0];
const ICON: Record<Meal, { icon: ComponentProps<typeof Ionicons>['name']; color: string }> = {
  breakfast: { icon: 'cafe', color: '#FF9500' },
  lunch: { icon: 'sunny', color: '#FFB800' },
  dinner: { icon: 'moon', color: '#5856D6' },
  snacks: { icon: 'ice-cream', color: '#FF2D55' },
};

// One meal as a card: its share of the day's target ("320 / 790"), a round +, then what you ate with steppers.
export function MealCard({ meal }: { meal: Meal }) {
  const c = useColors();
  const { day, setMeal } = useUi();
  const shake = useApp(s => s.shake);
  const all = useApp(s => s.logs[day]);
  const stepFood = useApp(s => s.stepFood);
  const target = useBudget();
  const lines = (all ?? []).map((e, index) => ({ e, index })).filter(({ e }) => e.meal === meal);
  const eaten = totalKcal(lines.map(l => l.e), shake);
  const goal = target == null ? null : target * MEAL_SHARE[meal];
  const open = () => { tap(); setMeal(meal); router.push('/calories/add'); };

  return (
    <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, overflow: 'hidden' }}>
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`Add to ${MEALS[meal]}`}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: pressed ? c.fill : 'transparent' })}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: ICON[meal].color + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={ICON[meal].icon} size={20} color={ICON[meal].color} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text style={[type.headline, { color: c.label }]}>{MEALS[meal]}</Text>
            <Text style={[type.footnote, nums, { color: c.secondary }]}>{fmt(eaten)}{goal == null ? '' : ` / ${fmt(goal)}`} kcal</Text>
          </View>
          {goal != null && (
            <View style={{ height: 4, borderRadius: 2, backgroundColor: c.fill, overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, (eaten / goal) * 100)}%`, height: '100%', borderRadius: 2, backgroundColor: eaten > goal ? c.red : ICON[meal].color }} />
            </View>
          )}
        </View>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="add" size={22} color="#fff" />
        </View>
      </Pressable>

      {lines.map(({ e, index }) => (
        <Fragment key={index}>
          <View style={{ height: hairline, backgroundColor: c.separator, marginLeft: 64 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: space.sm }}>
            <Thumb id={mainPart(e).id} size={40} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[type.subhead, { color: c.label, fontWeight: '500' }]} numberOfLines={1}>{e.name ?? name(e.parts[0].id)}</Text>
              <Text style={[type.caption, nums, { color: c.secondary }]} numberOfLines={1}>
                {e.name && !isCustom(e) ? e.parts.map(p => qtyLabel(p.qty) + name(p.id)).join(' · ') : `${fmt(entryKcal(e, shake))} kcal each`}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={[type.subhead, nums, { color: c.label, fontWeight: '600' }]}>{fmt(entryKcal(e, shake) * e.qty)}</Text>
              <Stepper value={e.qty} onStep={by => { if (e.qty + by <= 0) thud(); stepFood(day, index, by); }} />
            </View>
          </View>
        </Fragment>
      ))}
    </View>
  );
}
