// Steps as a typical week (Mon–Sun), saved with the day it took effect.
// Editing adds a new version from today, so the plan for earlier days doesn't change.
import { shift } from './dates.ts';

export type StepWeek = { from: string; week: number[] }; // week[0] = Monday … week[6] = Sunday
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const weekAvg = (week: number[]) => Math.round(week.reduce((t, n) => t + n, 0) / week.length);

// Average steps of the week in effect on `day` (the first version also covers anything before it).
export function stepsOn(history: StepWeek[], day: string): number {
  let w = history[0];
  for (const h of history) if (h.from <= day) w = h;
  return w ? weekAvg(w.week) : 0;
}

// Save an edit: same-day edits replace today's version; otherwise a new version starts today.
export function editWeek(history: StepWeek[], today: string, week: number[]): StepWeek[] {
  const last = history[history.length - 1];
  if (last?.from === today) return [...history.slice(0, -1), { from: today, week }];
  return [...history, { from: today, week }];
}

// The days of a plan, from `start`, as steps per day (one lookup per day, done once).
export const stepsFrom = (history: StepWeek[], start: string, days: number) =>
  Array.from({ length: days + 1 }, (_, i) => stepsOn(history, shift(start, i)));
