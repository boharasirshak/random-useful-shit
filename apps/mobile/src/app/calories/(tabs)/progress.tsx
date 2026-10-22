import { useMemo } from 'react';
import { History } from '@/tools/calories/features/progress/History';
import { WeighIns } from '@/tools/calories/features/progress/WeighIns';
import { WeightChart } from '@/tools/calories/features/progress/WeightChart';
import { today } from '@/tools/calories/lib/dates';
import { project } from '@/tools/calories/lib/projection';
import { profileReady, useApp } from '@/tools/calories/store/app';
import { Row } from '@/ui/Row';
import { Screen } from '@/ui/Screen';
import { Section } from '@/ui/Section';

// Progress: actual vs predicted weight, weigh-ins, and daily history.
export default function ProgressScreen() {
  const { profile, logs, weights, shake } = useApp();
  const ready = profileReady(profile);
  const projection = useMemo(() => (ready ? project(profile, logs, weights, shake, today()) : null), [ready, profile, logs, weights, shake]);

  return (
    <Screen title="Progress" back="Apps">
      {projection ? <WeightChart p={projection} goal={profile.goal} /> : (
        <Section><Row title="Set up your Body tab first" subtitle="Your prediction needs age, height and weights." /></Section>
      )}
      <WeighIns />
      <History />
    </Screen>
  );
}
