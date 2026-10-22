import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { milestone } from '@/tools/calories/lib/weighin';
import { nums, radius, space, type, useColors } from '@/ui/theme';

// The next round number below you (every 5 lb) with a bar that fills on the way there.
export function Milestone({ current, goal }: { current: number; goal: number }) {
  const c = useColors();
  const m = milestone(current, goal);
  const card = { marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, padding: space.lg, gap: space.sm } as const;
  if (!m) {
    return (
      <View style={[card, { flexDirection: 'row', alignItems: 'center', gap: space.md }]}>
        <Ionicons name="trophy" size={28} color="#FF9500" />
        <Text style={[type.headline, { color: c.label }]}>{goal ? 'You made it to your goal!' : 'Set a goal on the Goals tab'}</Text>
      </View>
    );
  }
  return (
    <View style={card}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text style={[type.headline, { color: c.label }]}>Next stop: {m.next} lb</Text>
        <Text style={[type.subhead, nums, { color: c.secondary }]}>{m.toGo.toFixed(1)} lb to go</Text>
      </View>
      <View style={{ height: 10, borderRadius: 5, backgroundColor: c.fill, overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(4, m.progress * 100)}%`, height: '100%', borderRadius: 5, backgroundColor: c.green }} />
      </View>
      {goal ? <Text style={[type.footnote, nums, { color: c.secondary }]}>Goal {goal} lb · {(current - goal).toFixed(1)} lb left</Text> : null}
    </View>
  );
}
