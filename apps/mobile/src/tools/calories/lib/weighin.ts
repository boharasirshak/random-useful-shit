// What to say after a weigh-in: the change since last time, a new low, and the weigh-in streak. Kind either way.
import { shift } from './dates.ts';
import { totalSodium, type Logs } from './log.ts';
import { LB } from './model.ts';
import { currentStreak } from './streak.ts';

export type WeighInNews = { delta: number | null; newLow: boolean; streak: number; line: string };

// Same day → same line, but it varies day to day so it doesn't feel canned.
const pick = (lines: string[], day: string) => lines[[...day].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7) % lines.length];

export function weighInNews(weights: Record<string, number>, day: string): WeighInNews {
  const days = Object.keys(weights).sort();
  const before = days.filter(d => d < day);
  const lb = weights[day];
  const prev = before.length ? weights[before[before.length - 1]] : null;
  const delta = prev == null || lb == null ? null : Math.round((lb - prev) * 10) / 10;
  const newLow = lb != null && before.length > 0 && lb < Math.min(...before.map(d => weights[d]));
  const streak = currentStreak(d => weights[d] != null, day);
  const d = delta == null ? '' : Math.abs(delta).toFixed(1);
  const line = delta == null ? 'First one logged. Every trend starts with a single dot.'
    : newLow ? pick(['Lowest weight yet. That’s the plan working.', 'New low! Screenshot-worthy.', 'A new low. Remember this feeling.'], day)
    : delta < 0 ? pick([`Down ${d} lb. The trend likes this.`, `−${d} lb. Small steps, real progress.`, `${d} lb lighter than last time. Keep it rolling.`], day)
    : delta === 0 ? 'Right where you were. The trend smooths out the noise.'
    : pick([`Up ${d} lb. Water, salt, life. The trend is what counts.`, `+${d} lb today, totally normal. One day isn’t a trend.`, `Up ${d} lb. Weigh in tomorrow; it usually evens out.`], day);
  return { delta, newLow, streak, line };
}

// The next round-number weight below you (every 5 lb), and how far along you are from the one before it.
export function milestone(current: number, goal: number) {
  if (goal && current <= goal) return null;
  const next = Math.max(Math.ceil(current / 5) * 5 - 5, goal || 0);
  const from = next + 5;
  return { next, toGo: current - next, progress: Math.min(1, Math.max(0, (from - current) / (from - next))) };
}

// Salt bloat: water your body is holding on to because of recent salty days, in lb, on the morning of `day`.
// Your body keeps fluid at ~3.2 g sodium per litre, so sodium kept over the usual holds water with it, and the
// kidneys clear about half of what's left each day. Days with nothing logged count as usual.
// ponytail: fixed 2,300 mg "usual" and 50%/day clearance; per-person baseline from their own average if this feels off.
export const NA_USUAL = 2300;
export function saltWater(logs: Logs, day: string) {
  let kept = 0; // mg
  for (let i = 7; i >= 1; i--) {
    const entries = logs[shift(day, -i)];
    const na = entries?.length ? totalSodium(entries) : NA_USUAL;
    kept = Math.max(0, (kept + na - NA_USUAL) / 2);
  }
  return kept / 3220 / LB; // 3,220 mg per litre, 1 L = 1 kg
}
