import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useCards } from '@/tools/unrot/data/catalog';
import { topic } from '@/tools/unrot/data/topics';
import type { Card } from '@/tools/unrot/lib/types';
import { related } from '@/tools/unrot/store/sync';
import { Sprout } from './Sprout';
import { C, sans } from './style';

type Props = { card: Card; width: number; height: number; top: number; bottom: number; next?: Card; open: boolean; onClose: () => void; onLess: () => void };

const host = (url: string) => url.replace(/^https:\/\/(www\.)?/, '').split('/')[0];

// "Go deeper": what swiping left opens. The story behind the card, where it comes from, what's next in its thread,
// related ideas (when online), and the way to say "not for me".
export function MorePanel({ card, width, height, top, bottom, next, open, onClose, onLess }: Props) {
  const cards = useCards();
  const [rel, setRel] = useState<string[] | null>(null);
  useEffect(() => { if (open && rel === null) related(card.id).then(setRel); }, [open, rel, card.id]);
  const relCards = (rel ?? []).map(id => cards.find(c => c.id === id)).filter((c): c is Card => !!c);
  const heading = card.type === 'quote' ? card.author ?? 'Go deeper' : card.title ?? 'Go deeper';
  return (
    <View style={{ width, height, backgroundColor: C.panel }}>
      <ScrollView contentContainerStyle={{ paddingTop: top, paddingBottom: bottom + 32, paddingHorizontal: 28, gap: 28, maxWidth: 680, width: '100%', alignSelf: 'center' }}>
        <View style={{ gap: 14 }}>
          <Text style={sans(30, '700', { color: C.ink })}>{heading}</Text>
          {card.more.split(/\n\n+/).map((p, i) => <Text key={i} style={sans(17, '400', { color: C.body, lineHeight: 27 })}>{p}</Text>)}
        </View>
        <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: C.hairline, paddingTop: 20 }}>
          {card.author && card.type !== 'quote' && <Text style={sans(15, '600', { color: C.ink })}>{card.author}</Text>}
          <Text style={sans(15, '400', { color: C.dim })}>{card.source}</Text>
          {card.link && (
            <Pressable onPress={() => WebBrowser.openBrowserAsync(card.link!)} accessibilityRole="link" hitSlop={8} style={{ alignSelf: 'flex-start', marginTop: 10 }}>
              <Text style={sans(15, '600', { color: C.ink, textDecorationLine: 'underline' })}>
                {card.link.includes('gutenberg.org') ? 'Read the whole book, free' : `Read more on ${host(card.link)}`}
              </Text>
            </Pressable>
          )}
        </View>
        {card.thread && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: C.hairline, paddingTop: 20 }}>
            {!next && <Sprout mood={open ? 'cheer' : 'idle'} size={56} />}
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={sans(15, '600', { color: C.ink })}>{card.thread.title}</Text>
              <Text style={sans(15, '400', { color: C.dim })}>
                {next ? `Part ${card.thread.part} of ${card.thread.of}. Next up: ${next.title ?? `part ${next.thread!.part}`}.` : `You finished all ${card.thread.of} parts.`}
              </Text>
            </View>
          </View>
        )}
        {relCards.length > 0 && (
          <View style={{ borderTopWidth: 1, borderTopColor: C.hairline, paddingTop: 20, gap: 6 }}>
            <Text style={sans(15, '600', { color: C.ink, marginBottom: 6 })}>Related ideas</Text>
            {relCards.map(r => (
              <Pressable key={r.id} onPress={() => router.push({ pathname: '/unrot/card/[id]', params: { id: r.id } })} accessibilityRole="button"
                style={({ pressed }) => ({ paddingVertical: 10, gap: 2, opacity: pressed ? 0.6 : 1 })}>
                <Text style={sans(16, '500', { color: C.ink })} numberOfLines={2}>{r.title ?? r.text}</Text>
                <Text style={sans(13, '400', { color: C.dim })}>{topic(r.topic).name}{r.author ? ` · ${r.author}` : ''}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Pressable onPress={onLess} accessibilityRole="button" hitSlop={8}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 8, opacity: pressed ? 0.5 : 1 })}>
          <Ionicons name="eye-off-outline" size={18} color={C.dim} />
          <Text style={sans(15, '500', { color: C.dim })}>Not for me, show fewer like this</Text>
        </Pressable>
      </ScrollView>
      {/* Always in reach, however far you've scrolled. */}
      <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back to the card"
        style={{ position: 'absolute', top: top - 46, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: C.raised, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="close" size={20} color={C.ink} />
      </Pressable>
    </View>
  );
}
