import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import { Thumb } from '@/tools/calories/features/Thumb';
import { select } from '@/ui/haptics';
import { RiveView } from '@/ui/RiveView';
import { nums, space, type, useColors } from '@/ui/theme';

type Props = {
  thumb: string; title: string; subtitle?: string; kcal: number;
  count: number; // already in this meal: the + becomes a green ✓ (tap again to add another)
  fav?: boolean; onFav?: () => void;
  onAdd: () => void;
};

// List row that logs on tap: photo, name, details, calories, ♥ to pin it, and + / ✓.
export function FoodRow({ thumb, title, subtitle, kcal, count, fav, onFav, onAdd }: Props) {
  const c = useColors();
  return (
    <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel={`Add ${title}, ${Math.round(kcal)} calories${count ? `, ${count} added` : ''}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: space.lg, paddingRight: space.md, paddingVertical: space.sm, backgroundColor: pressed ? c.fill : 'transparent' })}>
      <Thumb id={thumb} size={44} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[type.body, { color: c.label }]} numberOfLines={1}>{title}</Text>
        <Text style={[type.footnote, nums, { color: c.secondary }]} numberOfLines={1}>{subtitle ? `${subtitle} · ` : ''}{Math.round(kcal).toLocaleString()} kcal</Text>
      </View>
      {onFav && (
        <Pressable onPress={() => { select(); onFav(); }} hitSlop={8} accessibilityRole="button" accessibilityLabel={fav ? `Unfavorite ${title}` : `Favorite ${title}`} style={{ padding: 4 }}>
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={22} color={fav ? '#FF2D55' : c.tertiary} />
        </Pressable>
      )}
      <View style={{ alignItems: 'center', minWidth: 30 }}>
        <RiveView artboard="AddTick" size={40} data={{ added: count > 0 }} pointerEvents="none"
          fallback={<Ionicons name={count ? 'checkmark-circle' : 'add-circle'} size={30} color={count ? c.green : c.tint} />} />
        {count > 1 && <Text style={[type.caption, nums, { color: c.green, fontWeight: '700', marginTop: -2 }]}>×{count}</Text>}
      </View>
    </Pressable>
  );
}
