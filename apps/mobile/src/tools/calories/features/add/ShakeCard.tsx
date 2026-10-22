import { View } from 'react-native';
import { Thumb } from '@/tools/calories/features/Thumb';
import { useApp } from '@/tools/calories/store/app';
import { Field } from '@/ui/Field';
import { Section } from '@/ui/Section';
import { space } from '@/ui/theme';

// The morning protein shake: set its calories once. Adding it is in the bottom bar.
export function ShakeCard() {
  const { shake, setShake } = useApp();
  return (
    <>
      <View style={{ paddingHorizontal: space.lg, alignItems: 'center' }}>
        <Thumb id="shake" size={96} radius={22} />
      </View>
      <Section header="Protein shake" footer="Saved for next time. Change it if your recipe changes.">
        <Field label="Calories per shake" value={shake} onChange={setShake} unit="kcal" />
      </Section>
    </>
  );
}
