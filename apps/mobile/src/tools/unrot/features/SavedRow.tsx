import { Pressable, Text, View } from 'react-native';
import { topic } from '@/tools/unrot/data/topics';
import { DAY } from '@/tools/unrot/lib/feed';
import type { Card } from '@/tools/unrot/lib/types';
import { space, type, useColors } from '@/ui/theme';
import { serif } from './fonts';

// A card in the Saved / Liked list. `due`: when a saved card next comes back for review.
export function SavedRow({ card, due, now, onPress }: { card: Card; due?: number; now: number; onPress: () => void }) {
  const c = useColors();
  const t = topic(card.topic);
  const days = due == null ? null : Math.max(0, Math.ceil((due - now) / DAY));
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', gap: space.md, padding: space.lg, backgroundColor: pressed ? c.fill : 'transparent' })}>
      <View style={{ width: 4, borderRadius: 2, backgroundColor: t.color }} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[type.caption, { color: c.secondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 }]}>
          {t.name}{days == null ? '' : days === 0 ? ' · review due' : ` · review in ${days} day${days === 1 ? '' : 's'}`}
        </Text>
        {card.title && <Text style={[type.headline, { color: c.label }]} numberOfLines={1}>{card.title}</Text>}
        <Text style={{ fontFamily: serif, fontSize: 16, lineHeight: 22, color: c.label }} numberOfLines={3}>{card.text}</Text>
        <Text style={[type.footnote, { color: c.secondary }]} numberOfLines={1}>{card.author ? `${card.author} · ` : ''}{card.source}</Text>
      </View>
    </Pressable>
  );
}
