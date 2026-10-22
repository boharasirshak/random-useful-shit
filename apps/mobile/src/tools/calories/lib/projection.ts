// Turns logs + weigh-ins into the Progress chart series and the summary numbers.
import { DAY_MS, daysBetween, shift, ts } from './dates.ts';
import { totalKcal, type Logs } from './log.ts';
import { simulate, trend, type Point, type Profile } from './model.ts';

export type Projection = {
  weighIns: Point[];
  trend: Point[];
  past: Point[]; // model, up to today (driven by what you logged)
  future: Point[]; // model, today onward at your average intake
  avg: number | null; // kcal/day used for the future
  lbPerWeek: number | null; // model's expected rate over the next 2 weeks
  goalDate: number | null;
  trendPerWeek: number | null; // actual trend over the last 2 weeks
  vsModel: number | null; // trend minus model at the last weigh-in (negative = ahead of plan)
};

export function project(p: Profile, logs: Logs, weights: Record<string, number>, shake: number, today: string): Projection {
  const weighIns = Object.entries(weights).sort().map(([d, lb]) => ({ x: ts(d), y: lb }));
  const smooth = trend(weighIns);
  const days = Object.keys(logs).filter(d => logs[d].length).sort();
  // Today is still in progress, so leave it out of the average unless it's all there is.
  const done = days.filter(d => d !== today);
  const sample = done.length ? done : days;
  const avg = sample.length ? sample.reduce((t, d) => t + totalKcal(logs[d], shake), 0) / sample.length : null;

  const empty = { weighIns, trend: smooth, past: [], future: [], avg, lbPerWeek: null, goalDate: null, trendPerWeek: null, vsModel: null };
  if (avg === null) return empty;

  const start = [Object.keys(weights).sort()[0], days[0]].filter(Boolean).sort()[0];
  const elapsed = Math.max(0, daysBetween(start, today));
  const lbs = simulate(weights[start] ?? p.weight, p, elapsed + 365, i => {
    const d = shift(start, i);
    return d < today && logs[d]?.length ? totalKcal(logs[d], shake) : avg;
  });
  let end = lbs.findIndex((y, i) => i > elapsed && y <= p.goal);
  const reached = end >= 0;
  if (!reached) end = lbs.length - 1;
  const pts = lbs.slice(0, end + 1).map((y, i) => ({ x: ts(start) + i * DAY_MS, y }));

  let trendPerWeek = null, vsModel = null;
  if (smooth.length > 1) {
    const last = smooth[smooth.length - 1], back = smooth[Math.max(0, smooth.length - 15)];
    trendPerWeek = (back.y - last.y) / ((last.x - back.x) / DAY_MS / 7);
    vsModel = last.y - lbs[Math.round((last.x - ts(start)) / DAY_MS)];
  }

  return {
    ...empty,
    past: pts.slice(0, elapsed + 1),
    future: pts.slice(elapsed),
    lbPerWeek: (lbs[elapsed] - lbs[Math.min(elapsed + 14, lbs.length - 1)]) / 2,
    goalDate: reached ? pts[pts.length - 1].x : null,
    trendPerWeek,
    vsModel,
  };
}
