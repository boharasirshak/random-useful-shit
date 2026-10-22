import { Text, View } from 'react-native';
import { useApp } from '@/tools/calories/store/app';
import { Field } from '@/ui/Field';
import { Section } from '@/ui/Section';
import { Segmented } from '@/ui/Segmented';
import { space, type, useColors } from '@/ui/theme';
import { range, WheelRow } from '@/ui/WheelRow';

const AGES = range(13, 90), FEET = range(4, 7), INCHES = range(0, 11), STEPS = range(0, 60).map(i => i * 500);

// Who you are and how much you move. Saves as you go.
export function ProfileSections() {
  const c = useColors();
  const profile = useApp(s => s.profile);
  const set = useApp(s => s.setProfile);
  return (
    <Section header="Profile">
      <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg }}>
        <Text style={[type.body, { color: c.label, flex: 1 }]}>Sex</Text>
        <View style={{ width: 170 }}>
          <Segmented inline options={[['m', 'Male'], ['f', 'Female']]} value={profile.sex} onChange={sex => set({ sex })} />
        </View>
      </View>
      <WheelRow label="Age" wheels={[{ value: profile.age, options: AGES, suffix: 'yr', onChange: age => set({ age }) }]} />
      <WheelRow label="Height" wheels={[
        { value: profile.ft, options: FEET, suffix: 'ft', onChange: ft => set({ ft }) },
        { value: profile.in, options: INCHES, suffix: 'in', onChange: inches => set({ in: inches }) },
      ]} />
      <Field label="Starting weight" value={profile.weight} onChange={weight => set({ weight })} unit="lb" decimals />
    </Section>
  );
}

// Your usual day of moving, plus body fat.
export function ActivitySection() {
  const profile = useApp(s => s.profile);
  const set = useApp(s => s.setProfile);
  return (
    <Section header="Activity" footer="Set your usual day. Leave body fat empty to estimate it.">
      <WheelRow label="Daily steps" wheels={[{ value: profile.steps, options: STEPS, suffix: 'steps', format: n => n.toLocaleString(), onChange: steps => set({ steps }) }]} />
      <Field label="Workouts" value={profile.exercise} onChange={exercise => set({ exercise })} unit="kcal/day" />
      <Field label="Body fat" value={profile.bf} onChange={bf => set({ bf })} unit="%" placeholder="Estimate" decimals />
    </Section>
  );
}
