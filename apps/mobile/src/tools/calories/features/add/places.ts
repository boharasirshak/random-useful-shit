// How each place looks in lists: its real logo on a white tile where we have one, else an icon by kind.
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { PLACES, type Restaurant } from '@/tools/calories/data/menu';

// pad: margin inside the tile, as a share of its size (wide wordmarks need less).
type Look = { logo: number; pad: number } | { icon: ComponentProps<typeof Ionicons>['name']; color: string };

const LOGOS: Record<string, Look> = {
  cfa: { logo: require('../../../../../assets/brands/chick-fil-a.png'), pad: 0.03 },
  panda: { logo: require('../../../../../assets/brands/panda-express.png'), pad: 0.06 },
  shake: { icon: 'nutrition', color: '#007AFF' },
  custom: { icon: 'restaurant', color: '#8E8E93' },
};
const BY_KIND: Record<string, Look> = {
  fast: { icon: 'fast-food', color: '#FF9500' },
  store: { icon: 'cart', color: '#34C759' },
  home: { icon: 'home', color: '#5856D6' },
  app: { icon: 'restaurant', color: '#8E8E93' },
};

export const placeLook = (place: Restaurant): Look => LOGOS[place] ?? BY_KIND[PLACES[place]?.kind ?? 'app'];
