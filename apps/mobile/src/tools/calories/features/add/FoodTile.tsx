import { Pressable, Text, View } from 'react-native';
import type { MenuItem } from '@/tools/calories/data/menu';
import { Thumb } from '@/tools/calories/features/Thumb';
import { nums, radius, type, useColors } from '@/ui/theme';

type Props = { item: MenuItem; kcal: number; width: number; badge?: number; selected?: boolean; onPress: () => void };

// A menu item card: photo, name, calories. Badge shows how many you've logged/picked.
export function FoodTile({ item, kcal, width, badge, selected, onPress }: Props) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${Math.round(kcal)} calories`}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        width, backgroundColor: c.card, borderRadius: radius.md, overflow: 'hidden',
        borderWidth: 2, borderColor: selected ? c.tint : 'transparent', transform: [{ scale: pressed ? 0.95 : 1 }],
      })}>
      <Thumb id={item.id} width="100%" radius={0} />
      {badge ? (
        <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: c.tint, borderRadius: 9, minWidth: 18, paddingHorizontal: 5, paddingVertical: 1, alignItems: 'center' }}>
          <Text style={[type.caption, nums, { color: '#fff', fontWeight: '700' }]}>{badge}</Text>
        </View>
      ) : null}
      <View style={{ paddingHorizontal: 8, paddingVertical: 6, gap: 1 }}>
        <Text style={[type.footnote, { color: c.label, fontWeight: '600', minHeight: 32 }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[type.caption, nums, { color: c.secondary }]}>{Math.round(kcal)} kcal</Text>
      </View>
    </Pressable>
  );
}
