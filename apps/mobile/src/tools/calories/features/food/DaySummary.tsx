import { Text, View } from 'react-native';
import { totalKcal } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useBudget } from '@/tools/calories/store/derived';
import { useUi } from '@/tools/calories/store/ui';
import { nums, radius, space, type, useColors } from '@/ui/theme';

const fmt = (n: number) => Math.round(n).toLocaleString();

// Eaten / Target / Left for the selected day, with a progress bar.
export function DaySummary() {
  const c = useColors();
  const day = useUi(s => s.day);
  const eaten = useApp(s => totalKcal(s.logs[day], s.shake));
  const budget = useBudget();
  const left = budget == null ? null : budget - eaten;
  const over = left != null && left < 0;

  const stat = (label: string, value: string, color = c.label) => (
    <View style={{ flex: 1 }}>
      <Text style={[type.footnote, { color: c.secondary }]}>{label}</Text>
      <Text style={[type.title2, nums, { color }]}>{value}</Text>
    </View>
  );

  return (
    <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
      <View style={{ flexDirection: 'row' }}>
        {stat('Eaten', fmt(eaten))}
        {stat('Target', budget == null ? '–' : fmt(budget))}
        {stat(over ? 'Over' : 'Left', left == null ? '–' : fmt(Math.abs(left)), left == null ? c.secondary : over ? c.red : c.green)}
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: c.fill, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${budget ? Math.min(100, (eaten / budget) * 100) : 0}%`, backgroundColor: over ? c.red : c.green, borderRadius: 3 }} />
      </View>
      {budget == null && <Text style={[type.footnote, { color: c.secondary }]}>Fill in the Body tab to get your daily target.</Text>}
    </View>
  );
}
