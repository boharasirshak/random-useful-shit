import { useMemo } from 'react';
import { History } from '@/tools/calories/features/goals/History';
import { PlanSection } from '@/tools/calories/features/goals/PlanSection';
import { WeighIns } from '@/tools/calories/features/goals/WeighIns';
import { WeightChart } from '@/tools/calories/features/goals/WeightChart';
import { today } from '@/tools/calories/lib/dates';
import { project } from '@/tools/calories/lib/projection';
import { profileReady, useApp } from '@/tools/calories/store/app';
import { Row } from '@/ui/Row';
import { Screen } from '@/ui/Screen';
import { Section } from '@/ui/Section';

// Goals: your plan (goal + lb/week → daily target), the plan vs your actual weight, weigh-ins, history.
export default function GoalsScreen() {
  const { profile, logs, weights, shake } = useApp();
  const ready = profileReady(profile);
  const projection = useMemo(() => (ready ? project(profile, logs, weights, shake, today()) : null), [ready, profile, logs, weights, shake]);

  return (
    <Screen title="Goals" back="Apps">
      <PlanSection />
      {projection ? <WeightChart p={projection} goal={profile.goal} /> : (
        <Section><Row title="Set up your Body tab first" subtitle="Your plan needs age, height and weight." /></Section>
      )}
      <WeighIns />
      <History />
    </Screen>
  );
}
