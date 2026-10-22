import { Text, View } from 'react-native';
import { space, type, useColors } from './theme';

type Props = { label: string; value: string; onChange: (day: string) => void; note?: string; max?: string };

// Web version: a plain <input type="date">, which iPhone Safari shows as its own date wheel.
export function DateRow({ label, value, onChange, note, max }: Props) {
  const c = useColors();
  return (
    <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.sm }}>
      <Text style={[type.body, { color: c.label, flex: 1 }]}>{label}</Text>
      {note ? <Text style={[type.body, { color: c.secondary }]}>{note}</Text> : null}
      <input type="date" value={value} max={max} aria-label={label} onChange={e => e.target.value && onChange(e.target.value)}
        style={{ font: 'inherit', fontSize: 17, color: c.tint, background: c.fill, border: 0, borderRadius: 8, padding: '6px 10px', colorScheme: 'light dark' }} />
    </View>
  );
}
