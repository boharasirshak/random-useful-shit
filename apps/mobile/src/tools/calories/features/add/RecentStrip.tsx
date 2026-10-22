import { Pressable, ScrollView, Text, View } from 'react-native';
import { byId } from '@/tools/calories/data/menu';
import { Thumb } from '@/tools/calories/features/Thumb';
import { entryKcal, type Order } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { nums, radius, space, type, useColors } from '@/ui/theme';

const W = 132;
const mainId = (o: Order) => (o.parts.find(p => byId[p.id]?.category !== 'base') ?? o.parts[0]).id;
// "Panda Plate" alone isn't enough to tell plates apart, so list what's on it.
const detail = (o: Order) => o.parts.map(p => byId[p.id]?.name).filter(Boolean).join(', ');

// Your recent orders as a swipeable row: one tap logs the exact same thing again.
export function RecentStrip({ orders, onAdd }: { orders: Order[]; onAdd: (o: Order) => void }) {
  const c = useColors();
  const shake = useApp(s => s.shake);
  if (!orders.length) return null;
  return (
    <View style={{ gap: space.sm }}>
      <Text style={[type.footnote, { color: c.secondary, textTransform: 'uppercase', paddingHorizontal: space.lg + space.xs }]}>Recent</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.sm }}>
        {orders.map((o, i) => {
          const kcal = Math.round(entryKcal({ ...o, meal: 'lunch', qty: 1 }, shake));
          return (
            <Pressable key={i} onPress={() => onAdd(o)} accessibilityRole="button" accessibilityLabel={`Add ${o.name ?? detail(o)}, ${kcal} calories`}
              style={({ pressed }) => ({ width: W, backgroundColor: c.card, borderRadius: radius.lg, padding: space.sm, gap: 6, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
              <Thumb id={mainId(o)} size={44} />
              <Text style={[type.footnote, { color: c.label, fontWeight: '600' }]} numberOfLines={o.name ? 1 : 2}>{o.name ?? detail(o)}</Text>
              {o.name ? <Text style={[type.caption, { color: c.secondary }]} numberOfLines={2}>{detail(o)}</Text> : null}
              <Text style={[type.caption, nums, { color: c.secondary }]}>{kcal.toLocaleString()} kcal</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
