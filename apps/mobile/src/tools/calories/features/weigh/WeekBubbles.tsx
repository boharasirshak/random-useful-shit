import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { shift, today } from '@/tools/calories/lib/dates';
import { useApp } from '@/tools/calories/store/app';
import { Heading } from '@/ui/Heading';
import { nums, radius, space, type, useColors } from '@/ui/theme';

const monday = (day: string) => shift(day, -((new Date(day + 'T00:00').getDay() + 6) % 7));
const letter = (day: string) => new Date(day + 'T00:00').toLocaleDateString(undefined, { weekday: 'narrow' });

// This week, Duolingo style: a bubble per day that fills when you weigh in. Today's waits with a dashed ring.
export function WeekBubbles({ streak }: { streak: number }) {
  const c = useColors();
  const weights = useApp(s => s.weights);
  const t = today();
  const week = Array.from({ length: 7 }, (_, i) => shift(monday(t), i));
  return (
    <View style={{ gap: space.sm }}>
      <Heading title="This week" note={streak > 1 ? `${streak} days in a row` : undefined} />
      <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, padding: space.md, flexDirection: 'row', justifyContent: 'space-between' }}>
        {week.map(d => {
          const lb = weights[d], isToday = d === t, future = d > t;
          return (
            <View key={d} style={{ alignItems: 'center', gap: 4, opacity: future ? 0.35 : 1 }}>
              <Text style={[type.caption, { color: isToday ? c.tint : c.secondary, fontWeight: isToday ? '700' : '500' }]}>{letter(d)}</Text>
              <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
                backgroundColor: lb != null ? c.tint : 'transparent', borderWidth: lb != null ? 0 : 2, borderStyle: isToday ? 'dashed' : 'solid', borderColor: isToday ? c.tint : c.fill }}>
                {lb != null ? <Ionicons name="checkmark" size={20} color="#fff" /> : null}
              </View>
              <Text style={[type.caption, nums, { color: c.secondary, minHeight: 15 }]}>{lb != null ? Math.round(lb) : ''}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
