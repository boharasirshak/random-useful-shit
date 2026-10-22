import { useWindowDimensions, View } from 'react-native';
import type { MenuItem } from '@/tools/calories/data/menu';
import { itemKcal } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { Heading } from '@/ui/Heading';
import { space } from '@/ui/theme';
import { FoodTile } from './FoodTile';

type Props = {
  title: string;
  items: MenuItem[];
  onPick: (id: string) => void;
  badge?: (id: string) => number;
  selected?: (id: string) => boolean;
};

const GAP = 8;
const MIN_TILE = 104; // 3 across on a phone
const MAX_WIDTH = 720; // matches Screen's content width cap

// Titled grid of food tiles: 3 across on a phone, more on wider screens.
export function MenuGrid({ title, items, onPick, badge, selected }: Props) {
  const shake = useApp(s => s.shake);
  const width = Math.min(useWindowDimensions().width, MAX_WIDTH) - space.lg * 2;
  const cols = Math.max(3, Math.floor((width + GAP) / (MIN_TILE + GAP)));
  const tile = (width - GAP * (cols - 1)) / cols;
  if (!items.length) return null;

  return (
    <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
      <View style={{ marginHorizontal: -space.lg }}><Heading title={title} /></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
        {items.map(item => (
          <FoodTile key={item.id} item={item} width={tile} kcal={itemKcal(item.id, shake)}
            badge={badge?.(item.id)} selected={selected?.(item.id)} onPress={() => onPick(item.id)} />
        ))}
      </View>
    </View>
  );
}
