import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from 'react-native';
import { nice, today } from '@/tools/calories/lib/dates';
import { useApp } from '@/tools/calories/store/app';
import { Field } from '@/ui/Field';
import { Row } from '@/ui/Row';
import { Section } from '@/ui/Section';
import { useColors } from '@/ui/theme';

// Today's weight (type it in) and the list of past weigh-ins.
export function WeighIns() {
  const c = useColors();
  const weights = useApp(s => s.weights);
  const setWeight = useApp(s => s.setWeight);
  const removeWeight = useApp(s => s.removeWeight);
  const t = today();
  const past = Object.keys(weights).filter(d => d !== t).sort().reverse();

  return (
    <Section header="Weigh-ins" footer="Weigh in the same time each day, ideally in the morning.">
      <Field label="Today" value={weights[t] ?? 0} unit="lb" decimals placeholder="Weight"
        onChange={lb => (lb > 0 ? setWeight(t, lb) : removeWeight(t))} />
      {past.slice(0, 30).map(d => (
        <Row key={d} title={nice(d)} value={`${weights[d]} lb`}
          right={
            <Pressable onPress={() => removeWeight(d)} hitSlop={8} accessibilityLabel={`Delete weigh-in ${nice(d)}`}>
              <Ionicons name="close-circle" size={20} color={c.tertiary} />
            </Pressable>
          } />
      ))}
    </Section>
  );
}
