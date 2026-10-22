import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { shift } from '@/tools/calories/lib/dates';
import { totalKcal } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useBudget } from '@/tools/calories/store/derived';
import { useUi } from '@/tools/calories/store/ui';
import { Button } from '@/ui/Button';
import { success, tap } from '@/ui/haptics';
import { radius, space, type, useColors } from '@/ui/theme';

const fmt = (n: number) => Math.round(n).toLocaleString();

// Closes out the selected day: how it went against the target, and the streak of closed days.
export function DoneForDay() {
  const c = useColors();
  const day = useUi(s => s.day);
  const done = useApp(s => s.done);
  const setDone = useApp(s => s.setDone);
  const eaten = useApp(s => totalKcal(s.logs[day], s.shake));
  const target = useBudget();

  if (!done[day]) {
    return (
      <View style={{ paddingHorizontal: space.lg }}>
        <Button title="Done for the Day" disabled={!eaten} onPress={() => { success(); setDone(day, true); }} />
      </View>
    );
  }

  let streak = 0;
  while (done[shift(day, -streak)]) streak++;
  const diff = target == null ? null : target - eaten;
  const under = diff != null && diff >= 0;

  return (
    <Animated.View entering={FadeIn.duration(250)} style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, padding: space.lg, alignItems: 'center', gap: space.sm }}>
      <Animated.View entering={ZoomIn.springify().damping(12)}>
        <Ionicons name="checkmark-circle" size={52} color={under || diff == null ? c.green : c.orange} />
      </Animated.View>
      <Text style={[type.headline, { color: c.label }]}>Day done</Text>
      <Text style={[type.subhead, { color: c.secondary, textAlign: 'center' }]}>
        {fmt(eaten)} kcal{diff == null ? '' : under ? ` · ${fmt(diff)} under target` : ` · ${fmt(-diff)} over target`}
      </Text>
      {streak > 1 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="flame" size={16} color={c.orange} />
          <Text style={[type.footnote, { color: c.label, fontWeight: '600' }]}>{streak}-day streak</Text>
        </View>
      )}
      <Pressable onPress={() => { tap(); setDone(day, false); }} hitSlop={8} accessibilityRole="button">
        <Text style={[type.subhead, { color: c.tint }]}>Reopen day</Text>
      </Pressable>
    </Animated.View>
  );
}
