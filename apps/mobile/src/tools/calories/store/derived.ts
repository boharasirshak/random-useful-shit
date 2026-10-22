// Numbers several screens need: current weight and daily budget.
import { LB, maintenance } from '@/tools/calories/lib/model';
import { profileReady, useApp } from './app';

export function useCurrentWeight() {
  const weights = useApp(s => s.weights);
  const start = useApp(s => s.profile.weight);
  const days = Object.keys(weights).sort();
  const day = days[days.length - 1];
  return day ? { lb: weights[day], day } : { lb: start, day: null };
}

// Maintenance calories at your latest weight; null until the profile is filled in.
export function useBudget() {
  const profile = useApp(s => s.profile);
  const { lb } = useCurrentWeight();
  return profileReady(profile) ? maintenance(lb * LB, profile) : null;
}
