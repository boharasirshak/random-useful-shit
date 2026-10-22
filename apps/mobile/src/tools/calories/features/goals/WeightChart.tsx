import { useState } from 'react';
import { Text, View } from 'react-native';
import { DAY_MS, ts } from '@/tools/calories/lib/dates';
import type { Point } from '@/tools/calories/lib/model';
import type { Projection } from '@/tools/calories/lib/projection';
import { Legend, LineChart, type Series } from '@/ui/LineChart';
import { Segmented } from '@/ui/Segmented';
import { nums, radius, space, type, useColors } from '@/ui/theme';

type Graph = 'weight' | 'lost';
type Range = '1M' | '3M' | 'all';
// Window around today: mostly the past, a bit of what's ahead. "All" runs from the start to the goal (see below).
const WINDOW: Record<Exclude<Range, 'all'>, [number, number]> = { '1M': [-30, 14], '3M': [-90, 45] };
const n1 = (n: number) => Math.abs(n).toFixed(1);
const shortDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// One card, two graphs, picked with a switch (a swipe would fight the drag-to-scrub on the chart):
// Weight — plan vs actual weight; Lost — pounds lost so far, climbing toward the goal.
export function WeightChart({ p, goal, today }: { p: Projection; goal: number; today: string }) {
  const c = useColors();
  const [graph, setGraph] = useState<Graph>('weight');
  const [range, setRange] = useState<Range>('3M');
  const [toggled, setToggled] = useState<string[]>([]);

  // Visible window. "All" = plan start → goal day (at least a month out), so a 3-year plateau line can't squash everything.
  const now = ts(today);
  const from = range === 'all' ? -Infinity : now + WINDOW[range][0] * DAY_MS;
  const planEnd = p.future.length ? p.future[p.future.length - 1].x : now;
  const to = range === 'all' ? Math.max(planEnd, now + 30 * DAY_MS) : now + WINDOW[range][1] * DAY_MS;
  const inWin = (pts: Point[]) => pts.filter(pt => pt.x >= from && pt.x <= to);

  const start = p.past[0]?.y ?? p.future[0]?.y ?? 0; // weight the plan started from
  const lost = (pts: Point[]) => pts.map(pt => ({ x: pt.x, y: start - pt.y }));
  const lostNow = p.trend.length ? start - p.trend[p.trend.length - 1].y : 0;
  const toGo = goal ? Math.max(0, start - lostNow - goal) : null;

  const lines: Series[] = graph === 'weight' ? [
    { points: inWin(p.past), color: c.tint, label: 'Plan' },
    { points: inWin(p.future), color: c.tint, dash: '6 5', label: 'Plan' },
    { points: inWin(p.trend), color: c.green, width: 3, label: 'Trend' },
    { points: inWin(p.weighIns), color: c.secondary, dots: true, label: 'Weigh-ins' },
    { points: inWin(p.steady), color: c.orange, dash: '2 4', width: 1.5, label: 'Same kcal' },
  ] : [
    { points: inWin(lost(p.trend)), color: c.green, width: 3, fill: true, label: 'Lost' },
    { points: inWin(lost(p.past)), color: c.tint, label: 'Plan' },
    { points: inWin(lost(p.future)), color: c.tint, dash: '6 5', label: 'Plan' },
  ];
  const xs = lines.flatMap(s => s.points.map(pt => pt.x));
  const goalY = graph === 'weight' ? goal : start - goal;
  const goalLine = goal && xs.length ? [{ x: Math.min(...xs), y: goalY }, { x: Math.max(...xs), y: goalY }] : [];
  const series = [{ points: goalLine, color: c.red, dash: '2 5', width: 1.5, label: 'Goal' }, ...lines];
  // "Same kcal" (the plateau) starts hidden: it's context, not the plan. Tapping a chip flips it.
  const isShown = (l: string) => (l === 'Same kcal' ? toggled.includes(l) : !toggled.includes(l));
  const shown = series.filter(s => isShown(s.label!));

  const behind = p.vsPlan != null && p.vsPlan >= 0.5, ahead = p.vsPlan != null && p.vsPlan <= -0.5;
  const stat = (label: string, value: string, color = c.label) => (
    <View style={{ flex: 1 }}>
      <Text style={[type.footnote, { color: c.secondary }]}>{label}</Text>
      <Text style={[type.headline, nums, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );

  return (
    <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
      <Segmented inline options={[['weight', 'Weight'], ['lost', 'Lost']]} value={graph} onChange={setGraph} />
      {graph === 'weight' ? (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {stat(p.goalShift ? `Goal by (${p.goalShift > 0 ? '+' : '−'}${Math.abs(p.goalShift)}d)` : 'Goal by', !goal ? 'Set a goal' : p.goalDate ? shortDate(p.goalDate) : '2 yr+',
            p.goalShift ? (p.goalShift > 0 ? c.orange : c.green) : c.label)}
          {stat('Trend', p.trendPerWeek == null ? '–' : `${p.trendPerWeek >= 0 ? '−' : '+'}${n1(p.trendPerWeek)} lb/wk`)}
          {stat(behind ? 'Behind plan' : ahead ? 'Ahead of plan' : 'vs Plan', p.vsPlan == null ? '–' : behind || ahead ? `${n1(p.vsPlan)} lb` : 'On plan',
            behind ? c.red : p.vsPlan != null ? c.green : c.label)}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {stat('Lost so far', `${lostNow >= 0 ? '' : '+'}${n1(lostNow)} lb`, lostNow > 0 ? c.green : c.label)}
          {stat('To go', toGo == null ? 'Set a goal' : `${n1(toGo)} lb`)}
          {stat('Of the way', goal && start > goal ? `${Math.max(0, Math.min(100, Math.round((lostNow / (start - goal)) * 100)))}%` : '–')}
        </View>
      )}
      <LineChart series={shown} unit=" lb" />
      <Segmented inline options={[['1M', '1 Month'], ['3M', '3 Months'], ['all', 'All']]} value={range} onChange={setRange} />
      <Legend series={series} hidden={series.filter(s => !isShown(s.label!)).map(s => s.label!)} onToggle={l => setToggled(h => (h.includes(l) ? h.filter(x => x !== l) : [...h, l]))} />
    </View>
  );
}
