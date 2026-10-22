// Streaks of closed days ("Done for the Day"), like Apple Fitness and Duolingo.
import { shift } from './dates.ts';

// Days in a row up to today. Today not closed yet doesn't break it; the streak counts back from yesterday.
export function currentStreak(done: Record<string, boolean>, today: string) {
  let day = done[today] ? today : shift(today, -1), n = 0;
  while (done[day]) { n++; day = shift(day, -1); }
  return n;
}

// Longest run of consecutive days where ok(day) holds, over the given sorted days.
export function longestRun(days: string[], ok: (day: string) => boolean = () => true) {
  let best = 0, run = 0, prev = '';
  for (const d of days) {
    if (!ok(d)) { run = 0; prev = ''; continue; }
    run = prev && shift(prev, 1) === d ? run + 1 : 1;
    prev = d;
    best = Math.max(best, run);
  }
  return best;
}
