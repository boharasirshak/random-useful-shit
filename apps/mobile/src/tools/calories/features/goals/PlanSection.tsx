import { MIN_KCAL } from '@/tools/calories/lib/model';
import { useApp } from '@/tools/calories/store/app';
import { useBudget, useCurrentWeight, useMaintenance } from '@/tools/calories/store/derived';
import { Field } from '@/ui/Field';
import { Row } from '@/ui/Row';
import { Section } from '@/ui/Section';
import { RateSlider } from './RateSlider';

const fmt = (n: number) => Math.round(n).toLocaleString();

// Goal weight + how fast → what to eat per day. Saves as you type.
// floorRate: the slower lb/week you'll actually get when the target hits the safe minimum.
export function PlanSection({ floorRate }: { floorRate: number | null }) {
  const profile = useApp(s => s.profile);
  const { lb } = useCurrentWeight();
  const set = useApp(s => s.setProfile);
  const maint = useMaintenance();
  const target = useBudget();

  let footer = 'Fill in the Body tab to get your daily target.';
  if (maint != null && target != null) {
    footer = `${fmt(maint)} maintenance − ${fmt(maint - target)} deficit.`;
    if (target <= MIN_KCAL[profile.sex]) {
      footer = `Held at the ${fmt(MIN_KCAL[profile.sex])} kcal minimum: about ${floorRate == null ? 'less' : `${floorRate.toFixed(1)} lb`} a week.`;
    }
  }

  return (
    <Section header="Plan" footer={footer}>
      <Field label="Goal weight" value={profile.goal} onChange={goal => set({ goal })} unit="lb" decimals />
      <RateSlider rate={profile.rate} weight={lb || profile.weight || 180} onChange={rate => set({ rate })} />
      <Row title="Eat per day" value={target == null ? '–' : `${fmt(target)} kcal`} />
    </Section>
  );
}
