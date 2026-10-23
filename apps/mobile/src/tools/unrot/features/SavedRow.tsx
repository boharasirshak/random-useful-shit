import { Pressable, Text, View } from 'react-native';
import { topic } from '@/tools/unrot/data/topics';
import { DAY } from '@/tools/unrot/lib/feed';
import type { Card } from '@/tools/unrot/lib/types';
import { space, type, useColors } from '@/ui/theme';

// A card in the Saved / Liked list. `due`: when a saved card next comes back for review.
export function SavedRow({ card, due, now, onPress }: { card: Card; due?: number; now: number; onPress: () => void }) {
  const c = useColors();
  const days = due == null ? null : Math.max(0, Math.ceil((due - now) / DAY));
  const when = days == null ? '' : days === 0 ? ' · Review due' : ` · Review in ${days} day${days === 1 ? '' : 's'}`;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ padding: space.lg, gap: 4, backgroundColor: pressed ? c.fill : 'transparent' })}>
      <Text style={[type.headline, { color: c.label }]} numberOfLines={2}>{card.title ?? card.text}</Text>
      {card.title && <Text style={[type.subhead, { color: c.secondary }]} numberOfLines={2}>{card.text}</Text>}
      <View style={{ flexDirection: 'row' }}>
        <Text style={[type.footnote, { color: c.secondary, flex: 1 }]} numberOfLines={1}>{card.author ?? topic(card.topic).name}{when}</Text>
      </View>
    </Pressable>
  );
}
