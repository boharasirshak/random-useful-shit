import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { nums, space, type, useColors } from './theme';

type Props = { label: string; value: number; onChange: (n: number) => void; unit?: string; placeholder?: string; decimals?: boolean };

// Settings-style number row: label on the left, editable number on the right. 0 shows as empty.
export function Field({ label, value, onChange, unit, placeholder = '0', decimals }: Props) {
  const c = useColors();
  const show = (n: number) => (n ? String(n) : '');
  const [text, setText] = useState(show(value));
  // Follow outside changes (e.g. a restore) without an effect.
  const [seen, setSeen] = useState(value);
  if (value !== seen) { setSeen(value); setText(show(value)); }
  return (
    <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.sm }}>
      <Text style={[type.body, { color: c.label, flex: 1 }]}>{label}</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        onBlur={() => onChange(Number(text) || 0)}
        onSubmitEditing={() => onChange(Number(text) || 0)}
        keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
        returnKeyType="done"
        placeholder={placeholder}
        placeholderTextColor={c.tertiary}
        accessibilityLabel={label}
        selectTextOnFocus
        style={[type.body, nums, { color: c.label, textAlign: 'right', minWidth: 56, paddingVertical: 10 }]}
      />
      {unit ? <Text style={[type.body, { color: c.secondary }]}>{unit}</Text> : null}
    </View>
  );
}
