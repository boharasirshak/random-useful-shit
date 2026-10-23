// How each place looks in lists: its real logo on a white tile, or an icon for the shake.
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { Restaurant } from '@/tools/calories/data/menu';

// pad: margin inside the tile, as a share of its size (wide wordmarks need less).
type Look = { logo: number; pad: number } | { icon: ComponentProps<typeof Ionicons>['name']; color: string };

export const PLACE_LOOK: Record<Restaurant, Look> = {
  cfa: { logo: require('../../../../../assets/brands/chick-fil-a.png'), pad: 0.03 },
  panda: { logo: require('../../../../../assets/brands/panda-express.png'), pad: 0.06 },
  shake: { icon: 'nutrition', color: '#007AFF' },
  custom: { icon: 'restaurant', color: '#8E8E93' },
};
