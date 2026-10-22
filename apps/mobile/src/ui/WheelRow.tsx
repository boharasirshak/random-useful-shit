import { Picker } from '@expo/ui/community/picker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { select } from './haptics';
import { nums, space, type, useColors } from './theme';

export type Wheel = { value: number; options: number[]; suffix: string; onChange: (n: number) => void; format?: (n: number) => string };

// Settings-style row backed by the iOS wheel picker. Several wheels sit side by side (e.g. ft + in).
// iPhone app: tap the row to open the wheels inline, like the Settings app's date rows.
// Web: each value is a transparent <select>, which Safari on iPhone shows as the same wheel.
export function WheelRow({ label, wheels }: { label: string; wheels: Wheel[] }) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const text = (w: Wheel, n: number) => `${(w.format ?? String)(n)} ${w.suffix}`;
  const shown = (w: Wheel) => (w.value ? text(w, w.value) : '–');
  const items = (w: Wheel) => w.options.map(o => <Picker.Item key={o} label={text(w, o)} value={String(o)} />);

  if (Platform.OS === 'web') {
    return (
      <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.md }}>
        <Text style={[type.body, { color: c.label, flex: 1 }]}>{label}</Text>
        {wheels.map((w, i) => (
          <View key={i}>
            <Text style={[type.body, nums, { color: c.tint }]}>{shown(w)}</Text>
            <Picker selectedValue={String(w.value)} onValueChange={v => w.onChange(Number(v))}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}>
              {items(w)}
            </Picker>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View>
      <Pressable onPress={() => { select(); setOpen(o => !o); }} accessibilityRole="button" accessibilityLabel={`${label}, ${wheels.map(shown).join(' ')}`}
        style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.sm }}>
        <Text style={[type.body, { color: c.label, flex: 1 }]}>{label}</Text>
        <Text style={[type.body, nums, { color: open ? c.tint : c.secondary }]}>{wheels.map(shown).join(' ')}</Text>
      </Pressable>
      {open && (
        <View style={{ flexDirection: 'row', paddingHorizontal: space.sm }}>
          {wheels.map((w, i) => (
            <Picker key={i} style={{ flex: 1 }} selectedValue={String(w.value || w.options[Math.floor(w.options.length / 2)])} onValueChange={v => w.onChange(Number(v))}>
              {items(w)}
            </Picker>
          ))}
        </View>
      )}
    </View>
  );
}

export const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
