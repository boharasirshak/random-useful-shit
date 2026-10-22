import { Text, View } from 'react-native';
import { longDate } from '@/tools/calories/lib/dates';
import type { Projection } from '@/tools/calories/lib/projection';
import { Legend, LineChart, type Series } from '@/ui/LineChart';
import { radius, space, type, useColors } from '@/ui/theme';

const n1 = (n: number) => Math.abs(n).toFixed(1);

// Weigh-ins + actual trend + predicted curve on one chart, with a plain-English readout.
export function WeightChart({ p, goal }: { p: Projection; goal: number }) {
  const c = useColors();
  const xs = [...p.weighIns, ...p.past, ...p.future].map(pt => pt.x);
  const goalLine = xs.length ? [{ x: Math.min(...xs), y: goal }, { x: Math.max(...xs), y: goal }] : [];
  const series: Series[] = [
    { points: goalLine, color: c.red, dash: '2 5', width: 1.5, label: 'Goal' },
    { points: p.past, color: c.tint, label: 'Predicted' },
    { points: p.future, color: c.tint, dash: '6 5' },
    { points: p.trend, color: c.green, width: 3, label: 'Actual trend' },
    { points: p.weighIns, color: c.secondary, dots: true, label: 'Weigh-ins' },
  ];

  let readout = 'Log food and a weigh-in to see your prediction.';
  if (p.avg != null && p.lbPerWeek != null) {
    readout = `Eating about ${Math.round(p.avg).toLocaleString()} kcal/day, you should lose ${n1(p.lbPerWeek)} lb/week from here. `
      + (p.goalDate ? `Goal around ${longDate(p.goalDate)}.` : 'Not reaching your goal within a year at this rate.');
    if (p.trendPerWeek != null && p.vsModel != null) {
      readout += ` Your actual trend is ${n1(p.trendPerWeek)} lb/week, `
        + (Math.abs(p.vsModel) < 0.5 ? 'right on the prediction.'
          : p.vsModel < 0 ? `${n1(p.vsModel)} lb ahead of plan.` : `${n1(p.vsModel)} lb behind plan. Check portions or activity.`);
    }
  }

  return (
    <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
      <Text style={[type.subhead, { color: c.label, lineHeight: 21 }]}>{readout}</Text>
      <LineChart series={series} />
      <Legend series={series} />
      <Text style={[type.caption, { color: c.secondary }]}>
        Predicted uses your logged food with an energy-balance model (Hall, NIH): early water/glycogen drop, fat vs lean loss, and a slowing metabolism, so it flattens over time. Dashed = future at your average intake.
      </Text>
    </View>
  );
}
