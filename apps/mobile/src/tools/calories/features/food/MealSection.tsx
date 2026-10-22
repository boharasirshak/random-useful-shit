import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { byId } from '@/tools/calories/data/menu';
import { entryKcal, MEALS, totalKcal, type Entry, type Meal } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useUi } from '@/tools/calories/store/ui';
import { Row } from '@/ui/Row';
import { Section } from '@/ui/Section';
import { Stepper } from '@/ui/Stepper';
import { Thumb } from '@/tools/calories/features/Thumb';
import { nums, type, useColors } from '@/ui/theme';

const fmt = (n: number) => Math.round(n).toLocaleString();
const name = (id: string) => byId[id]?.name ?? 'Removed item';
const qtyLabel = (q: number) => (q === 0.5 ? '½ ' : q !== 1 ? `${q}× ` : '');

// The photo for a line: the first non-base part (the entrée, not the rice).
const mainPart = (e: Entry) => e.parts.find(p => byId[p.id]?.category !== 'base') ?? e.parts[0];

// One meal of the day: its lines with steppers, then "Add Food".
export function MealSection({ meal }: { meal: Meal }) {
  const c = useColors();
  const { day, setMeal } = useUi();
  const shake = useApp(s => s.shake);
  const all = useApp(s => s.logs[day]);
  const stepFood = useApp(s => s.stepFood);
  const lines = (all ?? []).map((e, index) => ({ e, index })).filter(({ e }) => e.meal === meal);
  const subtotal = totalKcal(lines.map(l => l.e), shake);

  return (
    <Section header={MEALS[meal]} right={lines.length ? `${fmt(subtotal)} kcal` : undefined}>
      {lines.map(({ e, index }) => (
        <Row
          key={index}
          left={<Thumb id={mainPart(e).id} size={40} />}
          title={e.name ?? name(e.parts[0].id)}
          subtitle={e.name ? e.parts.map(p => qtyLabel(p.qty) + name(p.id)).join(' · ') : `${fmt(entryKcal(e, shake))} kcal each`}
          right={
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={[type.subhead, nums, { color: c.label, fontWeight: '600' }]}>{fmt(entryKcal(e, shake) * e.qty)}</Text>
              <Stepper value={e.qty} onStep={by => stepFood(day, index, by)} />
            </View>
          }
        />
      ))}
      <Row
        title="Add Food"
        tint
        left={<Ionicons name="add-circle-outline" size={22} color={c.tint} />}
        onPress={() => { setMeal(meal); router.push('/calories/add'); }}
      />
    </Section>
  );
}
