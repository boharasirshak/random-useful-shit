import { Text, View } from 'react-native';
import { longDate } from '@/tools/calories/lib/dates';
import type { Projection } from '@/tools/calories/lib/projection';
import { Legend, LineChart, type Series } from '@/ui/LineChart';
import { radius, space, type, useColors } from '@/ui/theme';

const n1 = (n: number) => Math.abs(n).toFixed(1);
const fmt = (n: number) => Math.round(n).toLocaleString();

// Your plan vs your actual weight on one chart, with a plain-English readout.
export function WeightChart({ p, goal }: { p: Projection; goal: number }) {
  const c = useColors();
  const xs = [...p.weighIns, ...p.past, ...p.future].map(pt => pt.x);
  const goalLine = goal && xs.length ? [{ x: Math.min(...xs), y: goal }, { x: Math.max(...xs), y: goal }] : [];
  const series: Series[] = [
    { points: goalLine, color: c.red, dash: '2 5', width: 1.5, label: 'Goal' },
    { points: p.past, color: c.tint, label: 'Plan' },
    { points: p.future, color: c.tint, dash: '6 5' },
    { points: p.trend, color: c.green, width: 3, label: 'Actual trend' },
    { points: p.weighIns, color: c.secondary, dots: true, label: 'Weigh-ins' },
  ];

  let readout = `Eating ${fmt(p.target)} kcal/day, you'd lose about ${n1(p.lbPerWeek)} lb/week. `
    + (!goal ? 'Set a goal weight to get a date.' : p.goalDate ? `Goal around ${longDate(p.goalDate)}.` : 'Not reaching your goal within two years at this rate.');
  if (p.avg != null) readout += ` You've averaged ${fmt(p.avg)} kcal/day.`;
  if (p.trendPerWeek != null && p.vsPlan != null) {
    readout += ` Actual trend: ${n1(p.trendPerWeek)} lb/week, `
      + (Math.abs(p.vsPlan) < 0.5 ? 'right on plan.'
        : p.vsPlan < 0 ? `${n1(p.vsPlan)} lb ahead of plan.` : `${n1(p.vsPlan)} lb behind plan.`);
  }

  return (
    <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
      <Text style={[type.subhead, { color: c.label, lineHeight: 21 }]}>{readout}</Text>
      <LineChart series={series} />
      <Legend series={series} />
      <Text style={[type.caption, { color: c.secondary }]}>
        Plan = eating your target every day from your first weigh-in, run through an energy-balance model (Hall, NIH): early water/glycogen drop, fat vs lean loss, and a slowing metabolism. Dashed = still ahead.
      </Text>
    </View>
  );
}
