import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { nums, space, type, useColors } from './theme';

type Props = {
  title: string;
  subtitle?: string;
  value?: string;
  left?: ReactNode;
  right?: ReactNode;
  tint?: boolean; // blue action row, like "Add Food"
  valueColor?: string;
  onPress?: () => void;
};

// One row of an iOS list.
export function Row({ title, subtitle, value, left, right, tint, valueColor, onPress }: Props) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({
        minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: space.md,
        paddingHorizontal: space.lg, paddingVertical: subtitle ? space.sm : 11,
        backgroundColor: pressed ? c.fill : 'transparent',
      })}>
      {left}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[type.body, { color: tint ? c.tint : c.label }]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[type.footnote, nums, { color: c.secondary }]} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={[type.body, nums, { color: valueColor ?? c.secondary }]}>{value}</Text> : null}
      {right}
    </Pressable>
  );
}
