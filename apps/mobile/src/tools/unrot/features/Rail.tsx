import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { tap } from '@/ui/haptics';
import { INK } from './fonts';

type Icon = ComponentProps<typeof Ionicons>['name'];
type Props = { liked: boolean; saved: boolean; onLike: () => void; onSave: () => void; onShare: () => void; onMore: () => void; onLess: () => void };

function Action({ icon, label, color = INK, onPress }: { icon: Icon; label: string; color?: string; onPress: () => void }) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={({ pressed }) => ({ alignItems: 'center', gap: 3, transform: [{ scale: pressed ? 0.88 : 1 }] })}>
      <Ionicons name={icon} size={30} color={color} style={{ textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 6 }} />
      <Text style={{ color: INK, fontSize: 11, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

// The buttons down the right edge. Every gesture has a button too, for people who don't swipe.
export function Rail({ liked, saved, onLike, onSave, onShare, onMore, onLess }: Props) {
  return (
    <View style={{ gap: 20, alignItems: 'center' }}>
      <Action icon={liked ? 'heart' : 'heart-outline'} label={liked ? 'Liked' : 'Like'} color={liked ? '#FF375F' : INK} onPress={onLike} />
      <Action icon={saved ? 'bookmark' : 'bookmark-outline'} label={saved ? 'Saved' : 'Save'} color={saved ? '#FFD60A' : INK} onPress={onSave} />
      <Action icon="book-outline" label="Deeper" onPress={onMore} />
      <Action icon="paper-plane-outline" label="Share" onPress={onShare} />
      <Action icon="eye-off-outline" label="Less" onPress={onLess} />
    </View>
  );
}
