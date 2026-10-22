import { Text, View } from 'react-native';
import { useApp } from '@/tools/calories/store/app';
import { Field } from '@/ui/Field';
import { Section } from '@/ui/Section';
import { Segmented } from '@/ui/Segmented';
import { space, type, useColors } from '@/ui/theme';

// Who you are and how much you move. Saves as you type.
export function ProfileSections() {
  const c = useColors();
  const profile = useApp(s => s.profile);
  const set = useApp(s => s.setProfile);
  return (
    <>
      <Section header="Profile">
        <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg }}>
          <Text style={[type.body, { color: c.label, flex: 1 }]}>Sex</Text>
          <View style={{ width: 170 }}>
            <Segmented inline options={[['m', 'Male'], ['f', 'Female']]} value={profile.sex} onChange={sex => set({ sex })} />
          </View>
        </View>
        <Field label="Age" value={profile.age} onChange={age => set({ age })} unit="yr" />
        <Field label="Height" value={profile.ft} onChange={ft => set({ ft })} unit="ft" />
        <Field label="Inches" value={profile.in} onChange={inches => set({ in: inches })} unit="in" decimals />
        <Field label="Starting weight" value={profile.weight} onChange={weight => set({ weight })} unit="lb" decimals />
      </Section>
      <Section header="Activity" footer="Steps and workouts set your daily burn. Leave body fat empty to estimate it from your BMI.">
        <Field label="Daily steps" value={profile.steps} onChange={steps => set({ steps })} placeholder="e.g. 7000" />
        <Field label="Workouts" value={profile.exercise} onChange={exercise => set({ exercise })} unit="kcal/day" />
        <Field label="Body fat" value={profile.bf} onChange={bf => set({ bf })} unit="%" placeholder="Estimate" decimals />
      </Section>
    </>
  );
}
