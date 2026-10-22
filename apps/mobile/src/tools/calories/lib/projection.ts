// Turns the plan, logs and weigh-ins into the Goals chart series and the summary numbers.
import { DAY_MS, daysBetween, ts } from './dates.ts';
import { totalKcal, type Logs } from './log.ts';
import { LB, maintenance, MIN_KCAL, planDeficit, planIntake, simulate, trend, type Point, type Profile } from './model.ts';

export type Projection = {
  weighIns: Point[];
  trend: Point[];
  past: Point[]; // plan, start → today
  future: Point[]; // plan, today → goal
  target: number; // kcal/day to eat now
  floored: boolean; // target was raised to the safe minimum
  avg: number | null; // what you've actually eaten, kcal/day
  lbPerWeek: number; // plan's rate over the next 2 weeks
  goalDate: number | null;
  trendPerWeek: number | null; // actual trend over the last 2 weeks
  vsPlan: number | null; // trend minus plan at the last weigh-in (negative = ahead of plan)
};

export function project(p: Profile, logs: Logs, weights: Record<string, number>, shake: number, today: string): Projection {
  const weighIns = Object.entries(weights).sort().map(([d, lb]) => ({ x: ts(d), y: lb }));
  const smooth = trend(weighIns);
  const days = Object.keys(logs).filter(d => logs[d].length).sort();
  // Today is still in progress, so leave it out of the average unless it's all there is.
  const done = days.filter(d => d !== today);
  const sample = done.length ? done : days;
  const avg = sample.length ? sample.reduce((t, d) => t + totalKcal(logs[d], shake), 0) / sample.length : null;

  // The plan starts at your first weigh-in (or today, at your starting weight) and eats the target every day.
  // The target is recalculated from the plan's own weight each day, like you'd do in real life.
  const start = Object.keys(weights).sort()[0] ?? today;
  const elapsed = Math.max(0, daysBetween(start, today));
  const lbs = simulate(weights[start] ?? p.weight, p, elapsed + 730, (_, lb) => planIntake(lb * LB, p));
  let end = p.goal ? lbs.findIndex((y, i) => i >= elapsed && y <= p.goal) : -1;
  const reached = end >= 0;
  if (!reached) end = lbs.length - 1;
  const pts = lbs.slice(0, end + 1).map((y, i) => ({ x: ts(start) + i * DAY_MS, y }));

  const nowLb = weighIns.length ? weighIns[weighIns.length - 1].y : p.weight;
  const target = planIntake(nowLb * LB, p);

  let trendPerWeek = null, vsPlan = null;
  if (smooth.length > 1) {
    const last = smooth[smooth.length - 1], back = smooth[Math.max(0, smooth.length - 15)];
    trendPerWeek = (back.y - last.y) / ((last.x - back.x) / DAY_MS / 7);
    vsPlan = last.y - lbs[Math.round((last.x - ts(start)) / DAY_MS)];
  }

  return {
    weighIns,
    trend: smooth,
    past: pts.slice(0, elapsed + 1),
    future: pts.slice(elapsed),
    target,
    floored: maintenance(nowLb * LB, p) - planDeficit(nowLb * LB, p) < MIN_KCAL[p.sex],
    avg,
    lbPerWeek: (lbs[elapsed] - lbs[Math.min(elapsed + 14, lbs.length - 1)]) / 2,
    goalDate: reached ? pts[pts.length - 1].x : null,
    trendPerWeek,
    vsPlan,
  };
}
