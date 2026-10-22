import Ionicons from '@expo/vector-icons/Ionicons';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { tap } from './haptics';
import { useColors } from './theme';

type Props = { icon: ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void; prominent?: boolean };
const SIZE = 44;

// Round toolbar button like Apple Health's ✕ and ✓: Liquid Glass on iOS 26, a soft circle elsewhere.
// prominent: the blue confirm style.
export function GlassButton({ icon, label, onPress, prominent }: Props) {
  const c = useColors();
  const glass = isLiquidGlassAvailable();
  const color = prominent ? '#fff' : c.label;
  const shape = { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' } as const;
  const inner = <Ionicons name={icon} size={prominent ? 24 : 22} color={color} />;
  return (
    <Pressable onPress={() => { tap(); onPress(); }} hitSlop={6} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {glass
        ? <GlassView isInteractive glassEffectStyle="regular" tintColor={prominent ? c.tint : undefined} style={shape}>{inner}</GlassView>
        : <View style={[shape, { backgroundColor: prominent ? c.tint : c.fill }]}>{inner}</View>}
    </Pressable>
  );
}
