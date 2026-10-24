import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { byId } from '@/tools/calories/data/menu';
import { Thumb } from '@/tools/calories/features/Thumb';
import { entryKcal, MEALS, mealForHour, totalKcal, type Order } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useBudget } from '@/tools/calories/store/derived';
import { useUi } from '@/tools/calories/store/ui';
import { success, warning } from '@/ui/haptics';
import { Heading } from '@/ui/Heading';
import { nums, radius, space, type, useColors } from '@/ui/theme';

const mainId = (o: Order) => (o.parts.find(p => byId[p.id]?.category !== 'base') ?? o.parts[0]).id;

// Your ♥ orders, one tap from Home. They go into the meal for the time of day.
export function FavoritesRow() {
  const c = useColors();
  const favorites = useApp(s => s.favorites);
  const shake = useApp(s => s.shake);
  const addFood = useApp(s => s.addFood);
  const day = useUi(s => s.day);
  const locked = useApp(s => !!s.done[day]); // Done for the Day: nothing to add until it's reopened
  const target = useBudget();
  if (!favorites.length || locked) return null;
  const meal = mealForHour(new Date().getHours());

  const add = (o: Order) => {
    addFood(day, { meal, ...o });
    const s = useApp.getState();
    (target != null && totalKcal(s.logs[day], s.shake) > target ? warning : success)();
  };

  return (
    <View style={{ gap: space.sm }}>
      <Heading title="Favorites" note={`Adds to ${MEALS[meal]}`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.sm }}>
        {favorites.map(o => {
          const kcal = Math.round(entryKcal({ ...o, meal, qty: 1 }, shake));
          const title = o.name ?? byId[o.parts[0].id]?.name ?? 'Food';
          return (
            <Pressable key={title + JSON.stringify(o.parts)} onPress={() => add(o)} accessibilityRole="button" accessibilityLabel={`Add ${title} to ${MEALS[meal]}`}
              style={({ pressed }) => ({ width: 120, backgroundColor: c.card, borderRadius: radius.lg, padding: space.sm, gap: 6, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Thumb id={mainId(o)} size={40} />
                <Ionicons name="add-circle" size={24} color={c.tint} />
              </View>
              <Text style={[type.footnote, { color: c.label, fontWeight: '600' }]} numberOfLines={2}>{title}</Text>
              <Text style={[type.caption, nums, { color: c.secondary }]}>{kcal.toLocaleString()} kcal</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
