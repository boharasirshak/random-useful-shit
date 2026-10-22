import { bmr, bodyFatPct, LB, maintenance, NEAT_BASE, stepKcal, TEF } from '@/tools/calories/lib/model';
import { profileReady, useApp } from '@/tools/calories/store/app';
import { useCurrentWeight } from '@/tools/calories/store/derived';
import { Row } from '@/ui/Row';
import { Section } from '@/ui/Section';
import { useColors } from '@/ui/theme';

const fmt = (n: number) => Math.round(n).toLocaleString();

// Where your daily calories go, adding up to maintenance (TDEE).
export function BurnSection() {
  const c = useColors();
  const p = useApp(s => s.profile);
  const { lb } = useCurrentWeight();
  if (!profileReady(p)) return (
    <Section header="Daily burn">
      <Row title="Fill in your profile above" subtitle="Age, height and starting weight." />
    </Section>
  );

  const kg = lb * LB, B = bmr(kg, p), T = maintenance(kg, p);
  const bf = bodyFatPct(kg, p);
  return (
    <Section header="Daily burn"
      footer={`At ${lb} lb, ${bf.toFixed(0)}% body fat${p.bf ? '' : ' (estimated)'}.`}>
      <Row title="Resting (BMR)" value={fmt(B)} />
      <Row title="Daily living" value={fmt(NEAT_BASE * B)} />
      <Row title={`Walking (${p.steps.toLocaleString()} steps)`} value={fmt(stepKcal(kg, p))} />
      <Row title="Workouts" value={fmt(p.exercise)} />
      <Row title="Digesting food" value={fmt(TEF * T)} />
      <Row title="Maintenance (TDEE)" value={`${fmt(T)} kcal`} valueColor={c.label} />
    </Section>
  );
}
