import { Pressable, ScrollView, Text } from 'react-native';
import { select } from './haptics';
import { radius, space, type, useColors } from './theme';

// A swipeable row of choice chips (one selected). Scales past what a segmented control can fit.
export function Chips<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  const c = useColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.sm }}>
      {options.map(([key, label]) => {
        const on = key === value;
        return (
          <Pressable key={key} onPress={() => { if (!on) select(); onChange(key); }} accessibilityRole="tab" accessibilityState={{ selected: on }}
            style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.lg + 6, backgroundColor: on ? c.label : c.fill, opacity: pressed ? 0.7 : 1 })}>
            <Text style={[type.subhead, { color: on ? c.bg : c.label, fontWeight: on ? '600' : '500' }]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
