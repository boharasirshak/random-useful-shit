import { Pressable, Text, View } from 'react-native';
import type { MenuItem } from '@/tools/calories/data/menu';
import { Thumb } from '@/tools/calories/features/Thumb';
import { nums, radius, space, type, useColors } from '@/ui/theme';

type Props = { item: MenuItem; kcal: number; width: number; badge?: number; selected?: boolean; onPress: () => void };

// A menu item card: photo, name, calories. Badge shows how many you've logged/picked.
export function FoodTile({ item, kcal, width, badge, selected, onPress }: Props) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${Math.round(kcal)} calories`}
      style={({ pressed }) => ({
        width, backgroundColor: c.card, borderRadius: radius.lg, overflow: 'hidden',
        borderWidth: 2, borderColor: selected ? c.tint : 'transparent', transform: [{ scale: pressed ? 0.97 : 1 }],
      })}>
      <Thumb id={item.id} width="100%" radius={0} />
      {badge ? (
        <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: c.tint, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Text style={[type.caption, nums, { color: '#fff', fontWeight: '600' }]}>×{badge}</Text>
        </View>
      ) : null}
      <View style={{ padding: space.sm, paddingHorizontal: 10 }}>
        <Text style={[type.subhead, { color: c.label, fontWeight: '500', minHeight: 38 }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[type.footnote, nums, { color: c.secondary }]}>{Math.round(kcal)} kcal</Text>
      </View>
    </Pressable>
  );
}
