// Turns the plan and weigh-ins into the Goals chart series and the summary numbers.
import { DAY_MS, daysBetween, shift, ts } from './dates.ts';
import { LB, maintenance, MIN_KCAL, planDeficit, planIntake, simulate, trend, type Point, type Profile } from './model.ts';
import { stepsFrom, type StepWeek } from './steps.ts';

export type Projection = {
  weighIns: Point[];
  trend: Point[];
  past: Point[]; // plan, start → today
  future: Point[]; // plan, today → goal
  target: number; // kcal/day to eat now
  floored: boolean; // target was raised to the safe minimum
  lbPerWeek: number; // plan's rate over the next 2 weeks (only differs from p.rate when floored or early on)
  goalDate: number | null;
  trendPerWeek: number | null; // actual trend over the last 2 weeks
  vsPlan: number | null; // trend minus plan at the last weigh-in (negative = ahead of plan)
  balance: number; // kcal over (+) or under (−) target, summed over closed days
  steady: Point[]; // plateau: keep eating today's target forever from today, never lowering it
  plateauLb: number; // where that levels off
  goalShift: number | null; // days the goal date moved because of closed days (+ = later)
};

// steps: the dated step weeks. Each plan day uses the week in effect then, so editing steps today leaves the past alone.
// eaten: kcal actually eaten on closed days. Those days use what you ate instead of the target, so the line bends with reality.
export function project(p: Profile, weights: Record<string, number>, today: string, steps: StepWeek[] = [], eaten: Record<string, number> = {}): Projection {
  const weighIns = Object.entries(weights).sort().map(([d, lb]) => ({ x: ts(d), y: lb }));
  const smooth = trend(weighIns);

  // The plan starts at your first weigh-in (or today, at your starting weight) and eats the target every day.
  // The target is recalculated from the plan's own weight each day, like you'd do in real life.
  const start = Object.keys(weights).sort()[0] ?? today;
  const elapsed = Math.max(0, daysBetween(start, today));
  const days = elapsed + 730;
  const perDay = steps.length ? stepsFrom(steps, start, days) : null;
  const on = (i: number) => (perDay ? { ...p, steps: perDay[i] } : p);
  // Closed days feed the model a 7-day average of what you ate, so one big dinner doesn't make the water-weight part
  // of the line zigzag. The over/under balance still uses each day's exact number.
  const ate = Array.from({ length: elapsed + 1 }, (_, i) => eaten[shift(start, i)]);
  const weekAvg = ate.map((v, i) => {
    if (v == null) return undefined;
    const week = ate.slice(Math.max(0, i - 6), i + 1).filter((x): x is number => x != null);
    return week.reduce((a, b) => a + b, 0) / week.length;
  });
  const run = (actual: boolean) => {
    let balance = 0;
    const lbs = simulate(weights[start] ?? p.weight, on(0), days, (i, lb) => {
      const target = planIntake(lb * LB, on(i));
      if (!actual || i > elapsed || ate[i] == null) return target;
      balance += ate[i]! - target;
      return weekAvg[i]!;
    }, perDay ? i => perDay[i] : undefined);
    const end = p.goal ? lbs.findIndex((y, i) => i >= elapsed && y <= p.goal) : -1;
    return { lbs, balance, end };
  };
  const { lbs, balance, end: found } = run(true);
  // The same plan as if every day had hit the target, to say how far closed days moved the goal date.
  const ideal = Object.keys(eaten).length ? run(false).end : found;
  const reached = found >= 0;
  const end = reached ? found : lbs.length - 1;
  const pts = lbs.slice(0, end + 1).map((y, i) => ({ x: ts(start) + i * DAY_MS, y }));

  const nowLb = weighIns.length ? weighIns[weighIns.length - 1].y : p.weight;
  const now = on(elapsed);
  const target = planIntake(nowLb * LB, now);

  // The plateau: same calories every day from today. Weight falls, burn falls with it, and the two meet.
  const level = simulate(lbs[elapsed], now, 1095, () => target, perDay ? () => perDay[elapsed] : undefined);
  const steady = level.filter((_, i) => i % 7 === 0).map((y, i) => ({ x: ts(today) + i * 7 * DAY_MS, y }));

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
    floored: maintenance(nowLb * LB, now) - planDeficit(nowLb * LB, now) < MIN_KCAL[p.sex],
    lbPerWeek: (lbs[elapsed] - lbs[Math.min(elapsed + 14, lbs.length - 1)]) / 2,
    goalDate: reached ? pts[pts.length - 1].x : null,
    trendPerWeek,
    vsPlan,
    balance,
    steady,
    plateauLb: level[level.length - 1],
    goalShift: reached && ideal >= 0 ? found - ideal : null,
  };
}
