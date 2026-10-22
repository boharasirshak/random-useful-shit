import { useState } from 'react';
import { Text, View } from 'react-native';
import { DAY_MS, ts } from '@/tools/calories/lib/dates';
import type { Projection } from '@/tools/calories/lib/projection';
import { Legend, LineChart, type Series } from '@/ui/LineChart';
import { Segmented } from '@/ui/Segmented';
import { nums, radius, space, type, useColors } from '@/ui/theme';

type Range = '1M' | '3M' | 'all';
// Window around today: mostly the past, a bit of what's ahead.
const WINDOW: Record<Range, [number, number] | null> = { '1M': [-30, 14], '3M': [-90, 45], all: null };
const n1 = (n: number) => Math.abs(n).toFixed(1);
const shortDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// Plan vs actual weight: three stats, the chart (drag to scrub), a range picker and toggleable legend.
export function WeightChart({ p, goal, today }: { p: Projection; goal: number; today: string }) {
  const c = useColors();
  const [range, setRange] = useState<Range>('3M');
  const [hidden, setHidden] = useState<string[]>([]);

  const win = WINDOW[range];
  const inWin = (pts: { x: number; y: number }[]) => (win ? pts.filter(pt => pt.x >= ts(today) + win[0] * DAY_MS && pt.x <= ts(today) + win[1] * DAY_MS) : pts);
  const lines: Series[] = [
    { points: inWin(p.past), color: c.tint, label: 'Plan' },
    { points: inWin(p.future), color: c.tint, dash: '6 5', label: 'Plan' },
    { points: inWin(p.trend), color: c.green, width: 3, label: 'Trend' },
    { points: inWin(p.weighIns), color: c.secondary, dots: true, label: 'Weigh-ins' },
  ];
  const xs = lines.flatMap(s => s.points.map(pt => pt.x));
  const goalLine = goal && xs.length ? [{ x: Math.min(...xs), y: goal }, { x: Math.max(...xs), y: goal }] : [];
  const series = [{ points: goalLine, color: c.red, dash: '2 5', width: 1.5, label: 'Goal' }, ...lines];
  const shown = series.filter(s => !hidden.includes(s.label!));

  const behind = p.vsPlan != null && p.vsPlan >= 0.5, ahead = p.vsPlan != null && p.vsPlan <= -0.5;
  const stat = (label: string, value: string, color = c.label) => (
    <View style={{ flex: 1 }}>
      <Text style={[type.footnote, { color: c.secondary }]}>{label}</Text>
      <Text style={[type.headline, nums, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );

  return (
    <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {stat('Goal by', !goal ? 'Set a goal' : p.goalDate ? shortDate(p.goalDate) : '2 yr+')}
        {stat('Trend', p.trendPerWeek == null ? '–' : `${p.trendPerWeek >= 0 ? '−' : '+'}${n1(p.trendPerWeek)} lb/wk`)}
        {stat(behind ? 'Behind plan' : ahead ? 'Ahead of plan' : 'vs Plan', p.vsPlan == null ? '–' : behind || ahead ? `${n1(p.vsPlan)} lb` : 'On plan',
          behind ? c.red : p.vsPlan != null ? c.green : c.label)}
      </View>
      <Segmented inline options={[['1M', '1 Month'], ['3M', '3 Months'], ['all', 'All']]} value={range} onChange={setRange} />
      <LineChart series={shown} unit=" lb" />
      <Legend series={series} hidden={hidden} onToggle={l => setHidden(h => (h.includes(l) ? h.filter(x => x !== l) : [...h, l]))} />
    </View>
  );
}
