import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import { tap } from './haptics';
import { nums, radius, type, useColors } from './theme';

// Compact − qty + control.
export function Stepper({ value, onStep }: { value: number; onStep: (by: number) => void }) {
  const c = useColors();
  const btn = (by: number, icon: 'remove' | 'add', label: string) => (
    <Pressable onPress={() => { tap(); onStep(by); }} hitSlop={6} accessibilityLabel={label} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
      <Ionicons name={icon} size={16} color={c.label} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.fill, borderRadius: radius.sm }}>
      {btn(-1, 'remove', 'One less')}
      <Text style={[type.subhead, nums, { color: c.label, minWidth: 16, textAlign: 'center' }]}>{value}</Text>
      {btn(1, 'add', 'One more')}
    </View>
  );
}
