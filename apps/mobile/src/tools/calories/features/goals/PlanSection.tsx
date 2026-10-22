import { Text, View } from 'react-native';
import { MIN_KCAL } from '@/tools/calories/lib/model';
import { useApp } from '@/tools/calories/store/app';
import { useBudget, useMaintenance } from '@/tools/calories/store/derived';
import { Field } from '@/ui/Field';
import { Row } from '@/ui/Row';
import { Section } from '@/ui/Section';
import { Segmented } from '@/ui/Segmented';
import { space, type, useColors } from '@/ui/theme';

const RATES = ['0.5', '1', '1.5', '2'] as const;
const fmt = (n: number) => Math.round(n).toLocaleString();

// Goal weight + how fast → what to eat per day. Saves as you type.
export function PlanSection() {
  const c = useColors();
  const profile = useApp(s => s.profile);
  const set = useApp(s => s.setProfile);
  const maint = useMaintenance();
  const target = useBudget();

  let footer = 'Fill in the Body tab to get your daily target.';
  if (maint != null && target != null) {
    footer = `Maintenance ${fmt(maint)} − ${fmt(maint - target)} kcal deficit, sized by the energy model. Recalculated as your weight changes.`;
    if (target <= MIN_KCAL[profile.sex]) {
      footer += ` Raised to ${fmt(MIN_KCAL[profile.sex])}, the usual safe minimum, so you'll lose a bit slower than that.`;
    }
  }

  return (
    <Section header="Plan" footer={footer}>
      <Field label="Goal weight" value={profile.goal} onChange={goal => set({ goal })} unit="lb" decimals />
      <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.md }}>
        <Text style={[type.body, { color: c.label, flex: 1 }]}>Lose per week</Text>
        <View style={{ width: 200 }}>
          <Segmented inline options={RATES.map(r => [r, `${r} lb`] as [string, string])} value={String(profile.rate)} onChange={r => set({ rate: Number(r) })} />
        </View>
      </View>
      <Row title="Eat per day" value={target == null ? '–' : `${fmt(target)} kcal`} />
    </Section>
  );
}
