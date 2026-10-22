import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { nice, shift, today } from '@/tools/calories/lib/dates';
import { closedDays, totalKcal } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useBudget } from '@/tools/calories/store/derived';
import { radius, space, type, useColors } from '@/ui/theme';

const fmt = (n: number) => Math.round(Math.abs(n)).toLocaleString();

// "Yesterday: 320 under target" when you open the app the next day, plus the week so far. Kind either way.
export function RecapCard() {
  const c = useColors();
  const logs = useApp(s => s.logs);
  const done = useApp(s => s.done);
  const shake = useApp(s => s.shake);
  const target = useBudget();
  const [hidden, setHidden] = useState(false);
  const t = today();
  const closed = closedDays(logs, done, t).filter(d => d < t);
  const last = closed[closed.length - 1];
  if (hidden || target == null || !last || last < shift(t, -3)) return null;

  const diff = totalKcal(logs[last], shake) - target;
  const week = closed.filter(d => d >= shift(t, -7)).reduce((sum, d) => sum + totalKcal(logs[d], shake) - target, 0);
  const under = diff <= 0;
  const title = `${nice(last)}: ${fmt(diff)} ${under ? 'under' : 'over'} target`;

  return (
    <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, padding: space.md, flexDirection: 'row', gap: space.md }}>
      <Ionicons name={under ? 'trending-down' : 'trending-up'} size={24} color={under ? c.green : c.orange} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.headline, { color: c.label }]}>{title}</Text>
        <Text style={[type.footnote, { color: week <= 0 ? c.green : c.orange, marginTop: 2 }]}>Last 7 days: {fmt(week)} {week <= 0 ? 'under' : 'over'}</Text>
      </View>
      <Pressable onPress={() => setHidden(true)} hitSlop={10} accessibilityLabel="Hide">
        <Ionicons name="close" size={18} color={c.tertiary} />
      </Pressable>
    </View>
  );
}
