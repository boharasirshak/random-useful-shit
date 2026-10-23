// Awards, Apple Fitness style: computed from your data, never stored, so they can't drift.
// Only which ones you've already seen is saved (to celebrate new ones once).
import { closedDays, totalKcal, type Logs } from './log.ts';
import { longestRun } from './streak.ts';

export type Kind = 'streak' | 'target' | 'weight';
export type Award = { id: string; title: string; detail: string; kind: Kind; have: number; need: number; earned: boolean };

type Stats = { closed: number; longest: number; under: number; perfect: number; weighIns: number; lost: number; atGoal: number };
const DEFS: [string, string, string, Kind, keyof Stats, number][] = [
  ['first-day', 'First Day', 'Close out your first day.', 'streak', 'closed', 1],
  ['streak-3', 'Three-Peat', 'Close 3 days in a row.', 'streak', 'longest', 3],
  ['streak-7', 'Week Strong', 'Close 7 days in a row.', 'streak', 'longest', 7],
  ['streak-30', 'Month Master', 'Close 30 days in a row.', 'streak', 'longest', 30],
  ['streak-100', 'Century', 'Close 100 days in a row.', 'streak', 'longest', 100],
  ['under-10', 'On Target', 'Finish 10 days at or under target.', 'target', 'under', 10],
  ['under-50', 'Dialed In', 'Finish 50 days at or under target.', 'target', 'under', 50],
  ['perfect-week', 'Perfect Week', '7 days in a row, all at or under target.', 'target', 'perfect', 7],
  ['weigh-1', 'First Weigh-in', 'Log your weight once.', 'weight', 'weighIns', 1],
  ['weigh-30', 'Scale Regular', 'Log your weight 30 times.', 'weight', 'weighIns', 30],
  ['lost-5', '5 lb Down', 'Lose 5 lb from your first weigh-in.', 'weight', 'lost', 5],
  ['lost-10', '10 lb Down', 'Lose 10 lb from your first weigh-in.', 'weight', 'lost', 10],
  ['lost-25', '25 lb Down', 'Lose 25 lb from your first weigh-in.', 'weight', 'lost', 25],
  ['goal', 'Goal Weight', 'Reach your goal weight.', 'weight', 'atGoal', 1],
];

type Input = { logs: Logs; done: Record<string, boolean>; weights: Record<string, number>; shake: number; target: number | null; goal: number; today: string };

export function awards({ logs, done, weights, shake, target, goal, today }: Input): Award[] {
  const finished = closedDays(logs, done, today);
  const okDay = (d: string) => target != null && totalKcal(logs[d], shake) <= target;
  const w = Object.keys(weights).sort();
  const first = w.length ? weights[w[0]] : 0, last = w.length ? weights[w[w.length - 1]] : 0;
  const stats: Stats = {
    closed: finished.length,
    longest: longestRun(finished),
    under: finished.filter(okDay).length,
    perfect: longestRun(finished, okDay),
    weighIns: w.length,
    lost: Math.max(0, Math.floor(first - last)),
    atGoal: goal > 0 && w.length > 0 && last <= goal ? 1 : 0,
  };
  return DEFS.map(([id, title, detail, kind, stat, need]) => ({ id, title, detail, kind, have: Math.min(stats[stat], need), need, earned: stats[stat] >= need }));
}
