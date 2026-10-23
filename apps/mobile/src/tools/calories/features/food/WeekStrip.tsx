import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import { shift, today } from '@/tools/calories/lib/dates';
import { isClosed, totalKcal } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useBudget } from '@/tools/calories/store/derived';
import { useUi } from '@/tools/calories/store/ui';
import { select } from '@/ui/haptics';
import { Ring } from '@/ui/Ring';
import { nums, space, type, useColors } from '@/ui/theme';

const monday = (day: string) => shift(day, -((new Date(day + 'T00:00').getDay() + 6) % 7));
const letter = (day: string) => new Date(day + 'T00:00').toLocaleDateString(undefined, { weekday: 'narrow' });

// The selected day's week: each day is a ring (eaten vs target), ✓ once "Done for the Day". Tap to jump; arrows change week.
export function WeekStrip() {
  const c = useColors();
  const { day, setDay } = useUi();
  const logs = useApp(s => s.logs);
  const shake = useApp(s => s.shake);
  const done = useApp(s => s.done);
  const target = useBudget();
  const t = today();
  const closed = isClosed(logs, done, t);
  const week = Array.from({ length: 7 }, (_, i) => shift(monday(day), i));
  const go = (d: string) => { select(); setDay(d); };
  const arrow = (by: number, icon: 'chevron-back' | 'chevron-forward', label: string) => (
    <Pressable onPress={() => go(shift(day, by))} hitSlop={8} accessibilityLabel={label} style={{ paddingVertical: 14 }}>
      <Ionicons name={icon} size={20} color={c.tint} />
    </Pressable>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm }}>
      {arrow(-7, 'chevron-back', 'Previous week')}
      {week.map(d => {
        const eaten = totalKcal(logs[d], shake), on = d === day, future = d > t;
        const over = target != null && eaten > target;
        return (
          <Pressable key={d} onPress={() => go(d)} accessibilityRole="button" accessibilityState={{ selected: on }}
            accessibilityLabel={`${d}${closed(d) ? ', done' : ''}, ${Math.round(eaten)} calories`}
            style={{ flex: 1, alignItems: 'center', gap: 4, opacity: future ? 0.4 : 1 }}>
            <Text style={[type.caption, { color: on ? c.tint : c.secondary, fontWeight: on ? '700' : '500' }]}>{letter(d)}</Text>
            <View style={{ borderRadius: 22, padding: 2, backgroundColor: on ? c.fill : 'transparent' }}>
              <Ring size={36} stroke={3.5} progress={target ? eaten / target : 0} color={over ? c.red : c.green}>
                {closed(d)
                  ? <Ionicons name="checkmark" size={16} color={over ? c.red : c.green} />
                  : <Text style={[type.footnote, nums, { color: d === t ? c.tint : c.label, fontWeight: on || d === t ? '700' : '500' }]}>{Number(d.slice(8))}</Text>}
              </Ring>
            </View>
          </Pressable>
        );
      })}
      {arrow(7, 'chevron-forward', 'Next week')}
    </View>
  );
}
