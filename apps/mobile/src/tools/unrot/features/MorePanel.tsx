import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useCards } from '@/tools/unrot/data/catalog';
import { topic } from '@/tools/unrot/data/topics';
import type { Card } from '@/tools/unrot/lib/types';
import { related } from '@/tools/unrot/store/sync';
import { type } from '@/ui/theme';
import { INK, INK_DIM, serif } from './fonts';
import { TopicChip } from './TopicChip';

type Props = { card: Card; width: number; height: number; top: number; bottom: number; next?: Card; open: boolean; onClose: () => void };

const host = (url: string) => url.replace(/^https:\/\/(www\.)?/, '').split('/')[0];

// "Go deeper": what swiping right opens. The context behind the card, its source, and where a thread goes next.
export function MorePanel({ card, width, height, top, bottom, next, open, onClose }: Props) {
  const t = topic(card.topic);
  const cards = useCards();
  // Related cards by meaning, from the server, fetched the first time the panel opens.
  const [rel, setRel] = useState<string[] | null>(null);
  useEffect(() => { if (open && rel === null) related(card.id).then(setRel); }, [open, rel, card.id]);
  const relCards = (rel ?? []).map(id => cards.find(c => c.id === id)).filter((c): c is Card => !!c);
  return (
    <View style={{ width, height, backgroundColor: '#0E0E11' }}>
      <ScrollView contentContainerStyle={{ paddingTop: top, paddingBottom: bottom + 24, paddingHorizontal: 24, gap: 18, maxWidth: 680, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[type.title2, { color: INK }]}>Go deeper</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back to the card"
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={20} color={INK} />
          </Pressable>
        </View>
        <TopicChip id={card.topic} />
        <View style={{ borderLeftWidth: 3, borderLeftColor: t.color, paddingLeft: 14 }}>
          {card.title && <Text style={[type.headline, { color: INK, marginBottom: 4 }]}>{card.title}</Text>}
          <Text style={{ fontFamily: serif, fontSize: 17, lineHeight: 24, color: INK_DIM, fontStyle: card.type === 'quote' ? 'italic' : 'normal' }}>{card.text}</Text>
        </View>
        {card.more.split(/\n\n+/).map((p, i) => (
          <Text key={i} style={[type.body, { color: INK, lineHeight: 26 }]}>{p}</Text>
        ))}
        <View style={{ gap: 4, padding: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' }}>
          <Text style={[type.footnote, { color: INK_DIM, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }]}>Source</Text>
          {card.author && <Text style={[type.headline, { color: INK }]}>{card.author}</Text>}
          <Text style={[type.subhead, { color: INK }]}>{card.source}</Text>
          {card.link && (
            <Pressable onPress={() => WebBrowser.openBrowserAsync(card.link!)} accessibilityRole="link" hitSlop={6}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <Ionicons name="open-outline" size={16} color={t.color} />
              <Text style={[type.subhead, { color: t.color, fontWeight: '600' }]}>
                {card.link.includes('gutenberg.org') ? 'Read the whole book, free' : `Read more on ${host(card.link)}`}
              </Text>
            </Pressable>
          )}
        </View>
        {card.thread && (
          <View style={{ gap: 4, padding: 14, borderRadius: 12, backgroundColor: `${t.color}1F` }}>
            <Text style={[type.footnote, { color: t.color, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }]}>
              {card.thread.title} · part {card.thread.part} of {card.thread.of}
            </Text>
            <Text style={[type.subhead, { color: INK }]}>
              {next ? `Up next in your feed: ${next.title ?? `part ${next.thread!.part}`}.` : 'That was the last part. You finished the thread.'}
            </Text>
          </View>
        )}
        {relCards.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={[type.footnote, { color: INK_DIM, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }]}>Related ideas</Text>
            {relCards.map(r => (
              <Pressable key={r.id} onPress={() => router.push({ pathname: '/unrot/card/[id]', params: { id: r.id } })} accessibilityRole="button"
                style={({ pressed }) => ({ flexDirection: 'row', gap: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', opacity: pressed ? 0.7 : 1 })}>
                <View style={{ width: 3, borderRadius: 2, backgroundColor: topic(r.topic).color }} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.caption, { color: topic(r.topic).color, fontWeight: '600' }]}>{topic(r.topic).name}</Text>
                  <Text style={[type.subhead, { color: INK }]} numberOfLines={2}>{r.title ?? r.text}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
        <Text style={[type.footnote, { color: INK_DIM, textAlign: 'center' }]}>Swipe left to go back</Text>
      </ScrollView>
    </View>
  );
}
