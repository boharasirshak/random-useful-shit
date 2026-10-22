import { router } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MENU, type Category } from '@/tools/calories/data/menu';
import { BuilderPanel } from '@/tools/calories/features/add/BuilderPanel';
import { MenuGrid } from '@/tools/calories/features/add/MenuGrid';
import { ShakeCard } from '@/tools/calories/features/add/ShakeCard';
import { useAddFood } from '@/tools/calories/features/add/useAddFood';
import { MEALS, type Meal } from '@/tools/calories/lib/log';
import { useUi } from '@/tools/calories/store/ui';
import { Segmented } from '@/ui/Segmented';
import { radius, space, type, useColors } from '@/ui/theme';

const SECTIONS: [Category, string][] = [
  ['entree', 'Entrées'], ['base', 'Bases'], ['side', 'Sides'], ['appetizer', 'Appetizers & soup'], ['drink', 'Drinks'], ['sauce', 'Sauces'],
];
const label = (cat: Category) => SECTIONS.find(s => s[0] === cat)![1];

// Sheet for adding food to the selected meal: à la carte, or build a plate/meal.
export default function AddFood() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { meal, setMeal } = useUi();
  const a = useAddFood();
  const addLabel = `Add to ${MEALS[meal]}`;
  const active = a.build?.active != null ? a.build.slots[a.build.active].category : null;
  const picked = new Set(a.build ? [...a.build.slots.map(s => s.id), ...a.build.extras] : []);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.lg, paddingBottom: space.sm }}>
        <Text style={[type.title3, { color: c.label }]}>Add Food</Text>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/calories'))} hitSlop={10} accessibilityRole="button">
          <Text style={[type.headline, { color: c.tint }]}>Done</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ gap: space.lg, paddingBottom: insets.bottom + space.xxl, width: '100%', maxWidth: 720, alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <Segmented options={Object.entries(MEALS) as [Meal, string][]} value={meal} onChange={setMeal} />
        <Segmented options={a.restaurants} value={a.restaurant} onChange={a.setRestaurant} />
        {a.orders && <Segmented options={Object.keys(a.orders).map(o => [o, o] as [string, string])} value={a.orderName} onChange={a.setOrder} />}

        {a.restaurant === 'shake' ? (
          <ShakeCard addLabel={addLabel} onAdd={() => a.addSingle('shake')} />
        ) : a.build && a.order ? (
          <>
            <BuilderPanel title={a.comboName} build={a.build} canHalf={a.order.slots.includes('base')} addLabel={addLabel}
              onFocus={a.focusSlot} onHalf={a.toggleHalf} onRemoveExtra={a.dropExtra} onAdd={a.addBuild} />
            {active
              ? <MenuGrid title={`Choose ${label(active).toLowerCase().replace(/s$/, '')}`} items={MENU.filter(m => m.restaurant === a.restaurant && m.category === active)}
                  onPick={a.tapItem} selected={id => picked.has(id)} />
              : <Text style={[type.subhead, { color: c.secondary, paddingHorizontal: space.xl }]}>All set. Tap a slot above to swap something.</Text>}
            {a.order.extras && (
              <MenuGrid title={`Add ${label(a.order.extras).toLowerCase()} (optional)`} items={MENU.filter(m => m.restaurant === a.restaurant && m.category === a.order!.extras)}
                onPick={a.tapItem} badge={id => a.build!.extras.filter(x => x === id).length} />
            )}
          </>
        ) : (
          <>
            <TextInput value={a.query} onChangeText={a.setQuery} placeholder="Search" placeholderTextColor={c.secondary} clearButtonMode="while-editing"
              autoCorrect={false} accessibilityLabel="Search menu"
              style={[type.body, { color: c.label, backgroundColor: c.fill, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 8, marginHorizontal: space.lg }]} />
            {SECTIONS.map(([cat, title]) => (
              <MenuGrid key={cat} title={title} items={a.items.filter(m => m.category === cat)} onPick={a.tapItem} badge={a.loggedCount} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
