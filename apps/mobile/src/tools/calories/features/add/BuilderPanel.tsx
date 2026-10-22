import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Switch, Text, View } from 'react-native';
import { byId } from '@/tools/calories/data/menu';
import { buildKcal, isDone, type Build } from '@/tools/calories/lib/builder';
import { useApp } from '@/tools/calories/store/app';
import { Button } from '@/ui/Button';
import { Thumb } from '@/tools/calories/features/Thumb';
import { nums, radius, space, type, useColors } from '@/ui/theme';

type Props = {
  title: string;
  build: Build;
  canHalf: boolean;
  addLabel: string;
  onFocus: (slot: number) => void;
  onHalf: (on: boolean) => void;
  onRemoveExtra: (i: number) => void;
  onAdd: () => void;
};

const SLOT = { entree: 'Entrée', base: 'Base', side: 'Side', drink: 'Drink' } as Record<string, string>;

// The meal being built: one chip per slot (tap to change), add-ons, total, and Add.
export function BuilderPanel({ title, build, canHalf, addLabel, onFocus, onHalf, onRemoveExtra, onAdd }: Props) {
  const c = useColors();
  const shake = useApp(s => s.shake);
  const count = (i: number) => build.slots.filter(s => s.category === build.slots[i].category).length;
  const nth = (i: number) => build.slots.slice(0, i + 1).filter(s => s.category === build.slots[i].category).length;

  return (
    <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, padding: space.md, gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[type.headline, { color: c.label }]}>{title}</Text>
        {canHalf && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Text style={[type.subhead, { color: c.secondary }]}>Half & half</Text>
            <Switch value={build.half} onValueChange={onHalf} />
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {build.slots.map((s, i) => {
          const on = i === build.active;
          return (
            <Pressable key={i} onPress={() => onFocus(i)} accessibilityRole="button"
              style={{ flexGrow: 1, flexBasis: 150, flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: 6, borderRadius: radius.md,
                borderWidth: 1.5, borderColor: on ? c.tint : c.separator, backgroundColor: on ? c.fill : 'transparent' }}>
              {s.id ? <Thumb id={s.id} size={36} /> : (
                <View style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: c.tertiary, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="add" size={18} color={c.tertiary} />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[type.caption, { color: c.secondary }]}>
                  {SLOT[s.category]}{count(i) > 1 ? ` ${nth(i)}` : ''}{s.qty < 1 ? ' (½)' : ''}
                </Text>
                <Text style={[type.subhead, { color: s.id ? c.label : c.tertiary }]} numberOfLines={1}>{s.id ? byId[s.id].name : 'Choose…'}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {build.extras.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {build.extras.map((id, i) => (
            <Pressable key={i} onPress={() => onRemoveExtra(i)} accessibilityLabel={`Remove ${byId[id].name}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.fill, borderRadius: 14, paddingVertical: 4, paddingHorizontal: 10 }}>
              <Text style={[type.footnote, { color: c.label }]}>{byId[id].name}</Text>
              <Ionicons name="close" size={14} color={c.secondary} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Text style={[type.headline, nums, { color: c.label, flex: 1 }]}>{Math.round(buildKcal(build, shake)).toLocaleString()} <Text style={{ color: c.secondary, fontWeight: '400' }}>kcal</Text></Text>
        <View style={{ minWidth: 160 }}><Button title={addLabel} onPress={onAdd} disabled={!isDone(build)} /></View>
      </View>
    </View>
  );
}
