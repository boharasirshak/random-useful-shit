import { View } from 'react-native';
import { useApp } from '@/tools/calories/store/app';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { Section } from '@/ui/Section';
import { Thumb } from '@/tools/calories/features/Thumb';
import { space } from '@/ui/theme';

// The morning protein shake: set its calories once, add it with one tap.
export function ShakeCard({ addLabel, onAdd }: { addLabel: string; onAdd: () => void }) {
  const { shake, setShake } = useApp();
  return (
    <>
      <View style={{ paddingHorizontal: space.lg, alignItems: 'center' }}>
        <Thumb id="shake" size={120} radius={24} />
      </View>
      <Section header="Protein shake" footer="Saved for next time. Change it if your recipe changes.">
        <Field label="Calories per shake" value={shake} onChange={setShake} unit="kcal" />
      </Section>
      <View style={{ paddingHorizontal: space.lg }}>
        <Button title={addLabel} onPress={onAdd} />
      </View>
    </>
  );
}
