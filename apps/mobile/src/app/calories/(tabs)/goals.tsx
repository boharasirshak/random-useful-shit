import { useMemo } from 'react';
import { History } from '@/tools/calories/features/goals/History';
import { PlanSection } from '@/tools/calories/features/goals/PlanSection';
import { WeightChart } from '@/tools/calories/features/goals/WeightChart';
import { HelpButton } from '@/tools/calories/features/faq/HelpButton';
import { today } from '@/tools/calories/lib/dates';
import { closedDays, totalKcal } from '@/tools/calories/lib/log';
import { project } from '@/tools/calories/lib/projection';
import { profileReady, useApp } from '@/tools/calories/store/app';
import { Row } from '@/ui/Row';
import { Screen } from '@/ui/Screen';
import { Section } from '@/ui/Section';

// Goals: plan vs actual (or pounds lost), the plan settings, and daily history. Weighing in has its own tab.
export default function GoalsScreen() {
  const profile = useApp(s => s.profile);
  const weights = useApp(s => s.weights);
  const stepWeeks = useApp(s => s.stepWeeks);
  const logs = useApp(s => s.logs);
  const done = useApp(s => s.done);
  const shake = useApp(s => s.shake);
  const ready = profileReady(profile);
  const t = today();
  // Closed days count with what you actually ate, so over/under days bend the plan.
  const projection = useMemo(() => {
    if (!ready) return null;
    const eaten = Object.fromEntries(closedDays(logs, done, t).map(d => [d, totalKcal(logs[d], shake)]));
    return project(profile, weights, t, stepWeeks, eaten);
  }, [ready, profile, weights, t, stepWeeks, logs, done, shake]);

  return (
    <Screen title="Goals" back="Apps" accessory={<HelpButton />}>
      {projection ? <WeightChart p={projection} goal={profile.goal} today={t} /> : (
        <Section><Row title="Set up your Body tab first" subtitle="Your plan needs your birthday, height and weight." /></Section>
      )}
      <PlanSection floorRate={projection?.floored ? projection.lbPerWeek : null} />
      <History />
    </Screen>
  );
}
