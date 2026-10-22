import { Text, View } from 'react-native';
import { today } from '@/tools/calories/lib/dates';
import { useApp } from '@/tools/calories/store/app';
import { DateRow } from '@/ui/DateRow';
import { Field } from '@/ui/Field';
import { Section } from '@/ui/Section';
import { Segmented } from '@/ui/Segmented';
import { space, type, useColors } from '@/ui/theme';
import { range, WheelRow } from '@/ui/WheelRow';

const FEET = range(4, 7), INCHES = range(0, 11);

// Who you are and how much you move. Saves as you go.
export function ProfileSections() {
  const c = useColors();
  const profile = useApp(s => s.profile);
  const set = useApp(s => s.setProfile);
  const setDob = useApp(s => s.setDob);
  // No birthday yet (older saves have only an age): start the picker near the right year.
  const dob = profile.dob ?? `${new Date().getFullYear() - (profile.age || 30)}-01-01`;
  return (
    <Section header="Profile">
      <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg }}>
        <Text style={[type.body, { color: c.label, flex: 1 }]}>Sex</Text>
        <View style={{ width: 170 }}>
          <Segmented inline options={[['m', 'Male'], ['f', 'Female']]} value={profile.sex} onChange={sex => set({ sex })} />
        </View>
      </View>
      <DateRow label="Birthday" value={dob} max={today()} note={profile.dob ? `${profile.age} yr` : undefined} onChange={setDob} />
      <WheelRow label="Height" wheels={[
        { value: profile.ft, options: FEET, suffix: 'ft', onChange: ft => set({ ft }) },
        { value: profile.in, options: INCHES, suffix: 'in', onChange: inches => set({ in: inches }) },
      ]} />
      <Field label="Start weight" value={profile.weight} onChange={weight => set({ weight })} unit="lb" decimals />
    </Section>
  );
}

// Workouts and body fat. Steps have their own weekly section.
export function ActivitySection() {
  const profile = useApp(s => s.profile);
  const set = useApp(s => s.setProfile);
  return (
    <Section header="Activity">
      <Field label="Workouts" value={profile.exercise} onChange={exercise => set({ exercise })} unit="kcal/day" />
      <Field label="Body fat" value={profile.bf} onChange={bf => set({ bf })} unit="%" placeholder="Estimate" decimals />
    </Section>
  );
}
