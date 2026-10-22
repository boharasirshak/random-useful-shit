import Ionicons from '@expo/vector-icons/Ionicons';
import { Fragment } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { byId } from '@/tools/calories/data/menu';
import { Thumb } from '@/tools/calories/features/Thumb';
import { itemKcal } from '@/tools/calories/lib/log';
import type { Build } from '@/tools/calories/lib/builder';
import { useApp } from '@/tools/calories/store/app';
import { hairline, nums, radius, space, type, useColors } from '@/ui/theme';

type Props = {
  build: Build;
  canHalf: boolean;
  onFocus: (slot: number) => void;
  onHalf: (on: boolean) => void;
  onRemoveExtra: (i: number) => void;
};

const SLOT = { entree: 'Entrée', base: 'Base', side: 'Side', drink: 'Drink' } as Record<string, string>;

// The meal being built, one row per slot (tap to change it; the blue one is being picked below).
// Add-ons (sauces) show as chips. The total and Add button live in the bottom bar.
export function BuilderPanel({ build, canHalf, onFocus, onHalf, onRemoveExtra }: Props) {
  const c = useColors();
  const shake = useApp(s => s.shake);
  const count = (i: number) => build.slots.filter(s => s.category === build.slots[i].category).length;
  const nth = (i: number) => build.slots.slice(0, i + 1).filter(s => s.category === build.slots[i].category).length;

  return (
    <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, overflow: 'hidden' }}>
      {build.slots.map((s, i) => {
        const on = i === build.active;
        return (
          <Fragment key={i}>
            {i > 0 && <View style={{ height: hairline, backgroundColor: c.separator, marginLeft: 64 }} />}
            <Pressable onPress={() => onFocus(i)} accessibilityRole="button" accessibilityState={{ selected: on }}
              accessibilityLabel={`${SLOT[s.category]}: ${s.id ? byId[s.id].name : 'not chosen'}`}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: 6,
                backgroundColor: on ? c.fill : pressed ? c.fill : 'transparent' })}>
              {on && <View style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, borderRadius: 2, backgroundColor: c.tint }} />}
              {s.id ? <Thumb id={s.id} size={40} /> : (
                <View style={{ width: 40, height: 40, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: on ? c.tint : c.tertiary, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="add" size={18} color={on ? c.tint : c.tertiary} />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[type.caption, { color: on ? c.tint : c.secondary, fontWeight: on ? '600' : '400' }]}>
                  {SLOT[s.category]}{count(i) > 1 ? ` ${nth(i)}` : ''}{s.qty < 1 ? ' · half' : ''}
                </Text>
                <Text style={[type.body, { color: s.id ? c.label : c.tertiary }]} numberOfLines={1}>{s.id ? byId[s.id].name : on ? 'Pick one below' : 'Tap to choose'}</Text>
              </View>
              {s.id ? <Text style={[type.subhead, nums, { color: c.secondary }]}>{Math.round(itemKcal(s.id, shake) * s.qty)}</Text> : null}
            </Pressable>
          </Fragment>
        );
      })}

      {canHalf && (
        <>
          <View style={{ height: hairline, backgroundColor: c.separator, marginLeft: space.md }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, minHeight: 44 }}>
            <Text style={[type.body, { color: c.label, flex: 1 }]}>Half & half base</Text>
            <Switch value={build.half} onValueChange={onHalf} />
          </View>
        </>
      )}

      {build.extras.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, padding: space.md, borderTopWidth: hairline, borderTopColor: c.separator }}>
          {build.extras.map((id, i) => (
            <Pressable key={i} onPress={() => onRemoveExtra(i)} accessibilityLabel={`Remove ${byId[id].name}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.fill, borderRadius: 14, paddingVertical: 4, paddingHorizontal: 10 }}>
              <Text style={[type.footnote, { color: c.label }]}>{byId[id].name}</Text>
              <Ionicons name="close" size={14} color={c.secondary} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
