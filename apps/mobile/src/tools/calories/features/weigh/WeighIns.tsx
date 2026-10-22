import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from 'react-native';
import { nice } from '@/tools/calories/lib/dates';
import { useApp } from '@/tools/calories/store/app';
import { Row } from '@/ui/Row';
import { Section } from '@/ui/Section';
import { useColors } from '@/ui/theme';

// Every weigh-in, newest first, with the change from the one before. Today's is logged with the card at the top.
export function WeighIns() {
  const c = useColors();
  const weights = useApp(s => s.weights);
  const removeWeight = useApp(s => s.removeWeight);
  const days = Object.keys(weights).sort();
  if (!days.length) return null;
  // Change from the weigh-in before, shown under each date.
  const change = (i: number) => {
    if (i === 0) return 'First weigh-in';
    const d = Math.round((weights[days[i]] - weights[days[i - 1]]) * 10) / 10;
    return d === 0 ? 'No change' : `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} lb`;
  };

  return (
    <Section header="Weigh-ins" footer="Weigh in the same time each day, ideally in the morning.">
      {days.map((d, i) => ({ d, i })).reverse().slice(0, 30).map(({ d, i }) => (
        <Row key={d} title={nice(d)} subtitle={change(i)} value={`${weights[d]} lb`}
          right={
            <Pressable onPress={() => removeWeight(d)} hitSlop={8} accessibilityLabel={`Delete weigh-in ${nice(d)}`}>
              <Ionicons name="close-circle" size={20} color={c.tertiary} />
            </Pressable>
          } />
      ))}
    </Section>
  );
}
