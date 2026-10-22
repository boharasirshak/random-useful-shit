import { Text, View } from 'react-native';
import { totalKcal, totalMacros } from '@/tools/calories/lib/log';
import { macroTargets } from '@/tools/calories/lib/model';
import { useApp } from '@/tools/calories/store/app';
import { useBudget, useCurrentWeight } from '@/tools/calories/store/derived';
import { useUi } from '@/tools/calories/store/ui';
import { Ring } from '@/ui/Ring';
import { nums, radius, space, type, useColors } from '@/ui/theme';

// Activity-ring colors, one per thing you're tracking.
const COLOR = { kcal: '#FF375F', p: '#30D158', c: '#64D2FF', f: '#BF5AF2' };
const SIZE = 150, STROKE = 13, GAP = 3;
const fmt = (n: number) => Math.round(n).toLocaleString();

// The day at a glance, Apple Fitness style: rings for calories, protein and carbs, calories left in the middle,
// and the numbers (plus fat) beside them.
export function DayRing() {
  const c = useColors();
  const day = useUi(s => s.day);
  const entries = useApp(s => s.logs[day]);
  const shake = useApp(s => s.shake);
  const shakeProtein = useApp(s => s.shakeProtein);
  const goal = useApp(s => s.profile.goal);
  const { lb } = useCurrentWeight();
  const target = useBudget();
  const eaten = totalKcal(entries, shake);
  const m = totalMacros(entries, shake, shakeProtein);
  const t = target == null ? null : macroTargets(target, goal || lb);
  const left = target == null ? null : target - eaten;

  const rings = [
    { key: 'kcal', value: eaten, of: target },
    { key: 'p', value: m.p, of: t?.p ?? null },
    { key: 'c', value: m.c, of: t?.c ?? null },
  ] as const;
  const center = (
    <View style={{ alignItems: 'center' }}>
      <Text style={[type.headline, nums, { color: left != null && left < 0 ? c.red : c.label, fontSize: 20 }]} numberOfLines={1} adjustsFontSizeToFit>
        {left == null ? '–' : fmt(Math.abs(left))}
      </Text>
      <Text style={[type.caption, { color: c.secondary }]}>{left != null && left < 0 ? 'over' : 'left'}</Text>
    </View>
  );
  // Nest the rings: each sits inside the last.
  const nested = rings.reduceRight<React.ReactNode>((inner, r, i) => (
    <Ring key={r.key} size={SIZE - i * 2 * (STROKE + GAP)} stroke={STROKE} progress={r.of ? r.value / r.of : 0} color={COLOR[r.key]}>{inner}</Ring>
  ), center);

  const row = (key: keyof typeof COLOR, label: string, value: number, of: number | null, unit: string) => (
    <View key={key}>
      <Text style={[type.footnote, { color: COLOR[key], fontWeight: '600' }]}>{label}</Text>
      <Text style={[type.subhead, nums, { color: c.label }]}>
        <Text style={{ fontWeight: '700' }}>{fmt(value)}</Text>
        <Text style={{ color: c.secondary }}>{of == null ? '' : ` / ${fmt(of)}`}{unit}</Text>
      </Text>
    </View>
  );

  return (
    <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
      {nested}
      <View style={{ flex: 1, gap: space.sm }}>
        {row('kcal', 'Calories', eaten, target, '')}
        {row('p', 'Protein', m.p, t?.p ?? null, ' g')}
        {row('c', 'Carbs', m.c, t?.c ?? null, ' g')}
        {row('f', 'Fat', m.f, t?.f ?? null, ' g')}
      </View>
    </View>
  );
}
