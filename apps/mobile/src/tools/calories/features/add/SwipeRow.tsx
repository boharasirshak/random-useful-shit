import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { useRef } from 'react';
import { View } from 'react-native';
import Swipeable, { SwipeDirection, type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { space, useColors } from '@/ui/theme';

const SWIPE = 90; // how far to drag before letting go counts

// A list row you can swipe: right to add it right away, left to remove it. Like Mail's swipe actions.
export function SwipeRow({ onAdd, onRemove, children }: { onAdd: () => void; onRemove: () => void; children: ReactNode }) {
  const c = useColors();
  const ref = useRef<SwipeableMethods>(null);
  const action = (icon: ComponentProps<typeof Ionicons>['name'], color: string, side: 'flex-start' | 'flex-end') => (
    <View style={{ flex: 1, backgroundColor: color, justifyContent: 'center', alignItems: side, paddingHorizontal: space.xl }}>
      <Ionicons name={icon} size={26} color="#fff" />
    </View>
  );
  return (
    <Swipeable ref={ref} friction={1.5} leftThreshold={SWIPE} rightThreshold={SWIPE}
      renderLeftActions={() => action('add', c.green, 'flex-start')}
      renderRightActions={() => action('trash', c.red, 'flex-end')}
      onSwipeableWillOpen={dir => {
        if (dir === SwipeDirection.RIGHT) { onAdd(); ref.current?.close(); } else onRemove();
      }}>
      <View style={{ backgroundColor: c.card }}>{children}</View>
    </Swipeable>
  );
}
