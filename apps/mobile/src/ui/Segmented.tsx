import { Pressable, Text, View } from 'react-native';
import { tap } from './haptics';
import { radius, space, type, useColors } from './theme';

// iOS segmented control.
// inline: no side margins, for use inside a row.
export function Segmented<T extends string>({ options, value, onChange, inline }: { options: [T, string][]; value: T; onChange: (v: T) => void; inline?: boolean }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.fill, borderRadius: radius.sm + 1, padding: 2, marginHorizontal: inline ? 0 : space.lg }}>
      {options.map(([key, label]) => {
        const on = key === value;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => { tap(); onChange(key); }}
            style={{
              flex: 1, paddingVertical: 6, borderRadius: radius.sm - 1, alignItems: 'center',
              backgroundColor: on ? c.segment : 'transparent',
              shadowColor: '#000', shadowOpacity: on ? 0.12 : 0, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
            }}>
            <Text style={[type.footnote, { color: c.label, fontWeight: on ? '600' : '500' }]} numberOfLines={1}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
