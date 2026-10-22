import { ActivityIndicator, Pressable, Text } from 'react-native';
import { radius, space, type, useColors } from './theme';

type Props = { title: string; onPress: () => void; kind?: 'filled' | 'tinted' | 'plain'; disabled?: boolean; busy?: boolean };

// iOS button styles: filled (primary), tinted (secondary), plain (text).
export function Button({ title, onPress, kind = 'filled', disabled, busy }: Props) {
  const c = useColors();
  const off = disabled || busy;
  const bg = kind === 'filled' ? (off ? c.fill : c.tint) : kind === 'tinted' ? c.fill : 'transparent';
  const fg = kind === 'filled' ? (off ? c.tertiary : '#fff') : off ? c.tertiary : c.tint;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      style={({ pressed }) => ({
        backgroundColor: bg, borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: space.lg,
        alignItems: 'center', opacity: pressed ? 0.7 : 1,
      })}>
      {busy ? <ActivityIndicator color={fg} /> : <Text style={[type.headline, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}
