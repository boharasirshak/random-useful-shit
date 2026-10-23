import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { cardBg, topic } from '@/tools/unrot/data/topics';
import type { Card } from '@/tools/unrot/lib/types';
import { type } from '@/ui/theme';
import { INK, INK_DIM, serif } from './fonts';
import { TopicChip } from './TopicChip';

const KIND = { quote: 'Quote', idea: 'Big idea', fact: 'Did you know', question: 'Think about it' };

// Shorter words get bigger type, like a poster.
const size = (words: number) => (words <= 14 ? 32 : words <= 28 ? 27 : words <= 45 ? 23 : 20);

type Props = { card: Card; width: number; height: number; top: number; bottom: number; children?: ReactNode };

// The front of a card: just the words, big, on the topic's color.
export function CardFace({ card, width, height, top, bottom, children }: Props) {
  const t = topic(card.topic);
  const fs = size(card.text.split(/\s+/).length) - (card.type === 'quote' ? 0 : 3);
  return (
    <View style={{ width, height, backgroundColor: cardBg(t.color), paddingTop: top, paddingBottom: bottom, paddingLeft: 24, paddingRight: 72, overflow: 'hidden' }}>
      <Ionicons name={t.icon} size={width * 0.95} color={t.color} style={{ position: 'absolute', right: -width * 0.3, bottom: height * 0.06, opacity: 0.05 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <TopicChip id={card.topic} />
        {card.thread && <TopicChip id={card.topic} label={`${card.thread.part}/${card.thread.of} · ${card.thread.title}`} />}
      </View>
      <View style={{ flex: 1, justifyContent: 'center', gap: 14 }}>
        <Text style={[type.footnote, { color: t.color, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }]}>{KIND[card.type]}</Text>
        {card.title && card.type !== 'quote' && <Text style={[type.title2, { color: INK, fontSize: 25, lineHeight: 31 }]}>{card.title}</Text>}
        {card.type === 'quote' && <Text style={{ fontFamily: serif, fontSize: 72, lineHeight: 72, height: 44, color: t.color }}>“</Text>}
        <Text style={{ fontFamily: serif, fontSize: fs, lineHeight: Math.round(fs * 1.32), color: INK }}>{card.text}</Text>
        {(card.author || card.type === 'quote') && <Text style={[type.headline, { color: INK, marginTop: 4 }]}>— {card.author}</Text>}
        <Text style={[type.footnote, { color: INK_DIM }]} numberOfLines={2}>{card.source}</Text>
      </View>
      {children}
    </View>
  );
}
