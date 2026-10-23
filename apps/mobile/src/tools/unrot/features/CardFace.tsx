import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { topic } from '@/tools/unrot/data/topics';
import type { Card } from '@/tools/unrot/lib/types';
import { Reveal } from './Reveal';
import { C, sans } from './style';

const words = (s: string) => s.split(/\s+/).length;
// Fewer words, bigger type, so a short line reads like a poster and the longest still fits without scrolling.
const lead = (n: number) => (n <= 10 ? 34 : n <= 18 ? 30 : 26);

type Props = { card: Card; width: number; height: number; top: number; bottom: number; active: boolean; children?: ReactNode };

// The front of a card: the words, big, a little above the middle of the screen. Ideas, facts and questions lead
// with their title; quotes lead with the quote. The key phrase is the brightest, heaviest part. Topic sits quietly at the foot.
export function CardFace({ card, width, height, top, bottom, active, children }: Props) {
  const titled = !!card.title && card.type !== 'quote';
  const size = lead(words(card.text));
  const meta = [topic(card.topic).name, card.thread && `Part ${card.thread.part} of ${card.thread.of}`].filter(Boolean).join('  ·  ');
  return (
    <View style={{ width, height, backgroundColor: C.bg, paddingTop: top, paddingBottom: bottom, paddingLeft: 28, paddingRight: 76 }}>
      <View style={{ flex: 1 }} />
      <View style={{ gap: 20, maxWidth: 620 }}>
        {titled && <Text style={sans(32, '700', { color: C.ink })}>{card.title}</Text>}
        {titled ? (
          <Reveal text={card.text} em={card.em} active={active} style={sans(20, '400', { color: C.body, lineHeight: 29 })} emStyle={{ color: C.ink, fontWeight: '600' }} />
        ) : (
          <Reveal text={card.text} em={card.em} active={active} style={sans(size, '500', { color: C.body })} emStyle={{ color: C.ink, fontWeight: '700' }} />
        )}
        {card.type === 'question' && <Text style={sans(15, '500', { color: C.dim })}>Swipe left for the answer</Text>}
        <View style={{ gap: 2 }}>
          {card.author && <Text style={sans(16, '600', { color: C.ink })}>{card.author}</Text>}
          <Text style={sans(14, '400', { color: C.dim })} numberOfLines={2}>{card.source}</Text>
        </View>
      </View>
      <View style={{ flex: 1.5 }} />
      {children}
      <Text style={sans(13, '500', { color: C.dim, letterSpacing: 0.2 })} numberOfLines={1}>{meta}</Text>
    </View>
  );
}
