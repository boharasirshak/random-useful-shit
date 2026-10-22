import Ionicons from '@expo/vector-icons/Ionicons';
import { Fragment, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { select } from './haptics';
import { hairline, radius, space, type, useColors } from './theme';

export type Fold = { title: string; body: ReactNode };

// A card of questions; tap one to open its answer. Several can be open at once.
export function Accordion({ items }: { items: Fold[] }) {
  const c = useColors();
  const [open, setOpen] = useState<number[]>([]);
  const toggle = (i: number) => { select(); setOpen(o => (o.includes(i) ? o.filter(x => x !== i) : [...o, i])); };
  return (
    <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, overflow: 'hidden' }}>
      {items.map((it, i) => {
        const on = open.includes(i);
        return (
          <Fragment key={it.title}>
            {i > 0 && <View style={{ height: hairline, backgroundColor: c.separator, marginLeft: space.lg }} />}
            <Pressable onPress={() => toggle(i)} accessibilityRole="button" accessibilityState={{ expanded: on }}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 48, paddingHorizontal: space.lg, paddingVertical: space.sm, backgroundColor: pressed ? c.fill : 'transparent' })}>
              <Text style={[type.body, { color: c.label, flex: 1, fontWeight: on ? '600' : '400' }]}>{it.title}</Text>
              <Ionicons name={on ? 'chevron-up' : 'chevron-down'} size={18} color={c.tertiary} />
            </Pressable>
            {on && (
              <Animated.View entering={FadeIn.duration(180)} style={{ paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.md }}>
                {it.body}
              </Animated.View>
            )}
          </Fragment>
        );
      })}
    </View>
  );
}
