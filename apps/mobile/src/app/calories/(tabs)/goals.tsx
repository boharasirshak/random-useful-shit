import { useMemo } from 'react';
import { History } from '@/tools/calories/features/goals/History';
import { PlanSection } from '@/tools/calories/features/goals/PlanSection';
import { WeighIns } from '@/tools/calories/features/goals/WeighIns';
import { WeightChart } from '@/tools/calories/features/goals/WeightChart';
import { HelpButton } from '@/tools/calories/features/faq/HelpButton';
import { today } from '@/tools/calories/lib/dates';
import { project } from '@/tools/calories/lib/projection';
import { profileReady, useApp } from '@/tools/calories/store/app';
import { Row } from '@/ui/Row';
import { Screen } from '@/ui/Screen';
import { Section } from '@/ui/Section';

// Goals: your plan (goal + lb/week → daily target), the plan vs your actual weight, weigh-ins, history.
export default function GoalsScreen() {
  const profile = useApp(s => s.profile);
  const weights = useApp(s => s.weights);
  const ready = profileReady(profile);
  const t = today();
  const projection = useMemo(() => (ready ? project(profile, weights, t) : null), [ready, profile, weights, t]);

  return (
    <Screen title="Goals" back="Apps" accessory={<HelpButton />}>
      <PlanSection floorRate={projection?.floored ? projection.lbPerWeek : null} />
      {projection ? <WeightChart p={projection} goal={profile.goal} today={t} /> : (
        <Section><Row title="Set up your Body tab first" subtitle="Your plan needs age, height and weight." /></Section>
      )}
      <WeighIns />
      <History />
    </Screen>
  );
}
