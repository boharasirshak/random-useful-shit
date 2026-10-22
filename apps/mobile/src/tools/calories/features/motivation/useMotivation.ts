// Streak and awards for the current data, plus which awards haven't been celebrated yet.
import { useMemo } from 'react';
import { awards, type Award, type Kind } from '@/tools/calories/lib/awards';
import { today } from '@/tools/calories/lib/dates';
import { currentStreak, longestRun } from '@/tools/calories/lib/streak';
import { useApp } from '@/tools/calories/store/app';
import { useBudget } from '@/tools/calories/store/derived';

export const KIND_COLOR: Record<Kind, string> = { streak: '#FF9500', target: '#34C759', weight: '#007AFF' };
// The number stamped on each medal.
export const medalLabel = (a: Award) => (a.id === 'goal' ? '★' : String(a.need));

export function useMotivation() {
  const logs = useApp(s => s.logs);
  const done = useApp(s => s.done);
  const weights = useApp(s => s.weights);
  const shake = useApp(s => s.shake);
  const goal = useApp(s => s.profile.goal);
  const seen = useApp(s => s.seenAwards);
  const target = useBudget();
  const t = today();
  return useMemo(() => {
    const list = awards({ logs, done, weights, shake, target, goal, today: t });
    return {
      list,
      fresh: list.filter(a => a.earned && !seen.includes(a.id)),
      streak: currentStreak(done, t),
      longest: longestRun(Object.keys(done).filter(d => done[d]).sort()),
    };
  }, [logs, done, weights, shake, target, goal, seen, t]);
}
