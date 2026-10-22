import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import { nice, shift, today } from '@/tools/calories/lib/dates';
import { useUi } from '@/tools/calories/store/ui';
import { select } from '@/ui/haptics';
import { type, useColors } from '@/ui/theme';

// ‹ Today › — steps through days. Tapping the label jumps back to today.
export function DayPicker() {
  const c = useColors();
  const { day, setDay } = useUi();
  const arrow = (by: number, icon: 'chevron-back' | 'chevron-forward', label: string) => (
    <Pressable onPress={() => { select(); setDay(shift(day, by)); }} hitSlop={10} accessibilityLabel={label}>
      <Ionicons name={icon} size={22} color={c.tint} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      {arrow(-1, 'chevron-back', 'Previous day')}
      <Pressable onPress={() => { select(); setDay(today()); }} accessibilityLabel="Go to today">
        <Text style={[type.headline, { color: c.label, minWidth: 92, textAlign: 'center' }]}>{nice(day)}</Text>
      </Pressable>
      {arrow(1, 'chevron-forward', 'Next day')}
    </View>
  );
}
