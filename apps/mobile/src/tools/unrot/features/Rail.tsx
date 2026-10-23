import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { tap } from '@/ui/haptics';
import { RiveView } from '@/ui/RiveView';
import { C } from './style';

type Icon = ComponentProps<typeof Ionicons>['name'];
type Props = { liked: boolean; saved: boolean; onLike: () => void; onSave: () => void; onShare: () => void; onMore: () => void };

function Action({ icon, label, color = C.ink, art, onPress }: { icon: Icon; label: string; color?: string; art?: ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="button" accessibilityLabel={label} hitSlop={10}
      style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.5 : 1 })}>
      {art ?? <Ionicons name={icon} size={27} color={color} />}
    </Pressable>
  );
}

// Four quiet buttons down the right edge, for everything the gestures do. "Not for me" lives in Go deeper and on a long press.
export function Rail({ liked, saved, onLike, onSave, onShare, onMore }: Props) {
  return (
    <View style={{ gap: 14, alignItems: 'center' }}>
      <Action icon={liked ? 'heart' : 'heart-outline'} label={liked ? 'Unlike' : 'Like'} color={liked ? C.like : C.ink} onPress={onLike} />
      <Action icon="bookmark-outline" label={saved ? 'Remove from saved' : 'Save'} onPress={onSave}
        art={<RiveView artboard="UnrotSave" size={34} data={{ saved }} pointerEvents="none"
          fallback={<Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={26} color={C.ink} />} />} />
      <Action icon="book-outline" label="Go deeper" onPress={onMore} />
      <Action icon="paper-plane-outline" label="Share" onPress={onShare} />
    </View>
  );
}
