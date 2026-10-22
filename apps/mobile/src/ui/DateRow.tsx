import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Text, View } from 'react-native';
import { space, type, useColors } from './theme';

type Props = { label: string; value: string; onChange: (day: string) => void; note?: string; max?: string };

const toDate = (day: string) => new Date(day + 'T12:00');
const toDay = (d: Date) => d.toLocaleDateString('en-CA');

// Settings-style row with the native compact date picker (tap the date to get the calendar). Days are YYYY-MM-DD.
export function DateRow({ label, value, onChange, note, max }: Props) {
  const c = useColors();
  return (
    <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.sm }}>
      <Text style={[type.body, { color: c.label, flex: 1 }]}>{label}</Text>
      {note ? <Text style={[type.body, { color: c.secondary }]}>{note}</Text> : null}
      <DateTimePicker mode="date" display="compact" value={toDate(value)} maximumDate={max ? toDate(max) : undefined}
        accentColor={c.tint} onChange={(_, d) => d && onChange(toDay(d))} />
    </View>
  );
}
