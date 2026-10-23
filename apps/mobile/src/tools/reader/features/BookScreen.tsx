import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlayerBar } from '@/tools/reader/features/PlayerBar';
import { loadSentences } from '@/tools/reader/lib/files';
import { wordAt, type Sentence } from '@/tools/reader/lib/text';
import * as player from '@/tools/reader/player';
import { useReader } from '@/tools/reader/store/app';
import { notify } from '@/ui/confirm';
import { space, type, useColors } from '@/ui/theme';

type Para = { from: number; to: number }; // sentence index range, inclusive

// One book: the text, with the sentence and word being read highlighted, and the player underneath.
export function BookScreen({ id }: { id: string }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const book = useReader(s => s.books[id]);
  const [sentences, setSentences] = useState<Sentence[] | null>(null);
  const paras = useMemo(() => {
    const out: Para[] = [];
    sentences?.forEach((s, i) => {
      const last = out[out.length - 1];
      if (last && sentences[last.from].p === s.p) last.to = i;
      else out.push({ from: i, to: i });
    });
    return out;
  }, [sentences]);
  const listRef = useRef<FlatList<Para>>(null);

  useEffect(() => {
    loadSentences(id).then(setSentences, e => notify('Could not open this book', (e as Error).message));
  }, [id]);
  useEffect(() => {
    if (!sentences || !book) return;
    const { voice, rate } = useReader.getState();
    useReader.getState().touch(id);
    player.open({ id, title: book.title, sentences }, voice, rate, Math.min(book.index, sentences.length - 1)).catch(e => notify('Player', (e as Error).message));
    return player.close;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, sentences]);

  // Keep the paragraph being read in view.
  const index = player.usePlayer(s => s.index);
  const pIdx = paras.findIndex(p => index >= p.from && index <= p.to);
  useEffect(() => {
    if (pIdx >= 0) listRef.current?.scrollToIndex({ index: pIdx, viewPosition: 0.25, animated: true });
  }, [pIdx]);

  if (!book) return null;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: space.lg, minHeight: 44 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/reader'))} hitSlop={8} accessibilityRole="link"
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm }}>
          <Ionicons name="chevron-back" size={24} color={c.tint} />
          <Text style={[type.body, { color: c.tint }]}>Library</Text>
        </Pressable>
        <Text style={[type.headline, { color: c.label, flex: 1, textAlign: 'center' }]} numberOfLines={1}>{book.title}</Text>
        <Pressable onPress={() => router.push('/reader/voices')} hitSlop={10} accessibilityLabel="Voices" accessibilityRole="button" style={{ width: 80, alignItems: 'flex-end' }}>
          <Ionicons name="mic-outline" size={24} color={c.tint} />
        </Pressable>
      </View>
      <FlatList
        ref={listRef}
        data={paras}
        keyExtractor={p => String(p.from)}
        renderItem={({ item }) => <Paragraph para={item} sentences={sentences!} />}
        contentContainerStyle={{ paddingHorizontal: space.xl, paddingVertical: space.lg, gap: space.lg, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        onScrollToIndexFailed={({ index: i, averageItemLength }) => {
          listRef.current?.scrollToOffset({ offset: i * averageItemLength, animated: false });
          setTimeout(() => listRef.current?.scrollToIndex({ index: i, viewPosition: 0.25 }), 100);
        }}
      />
      {sentences && <PlayerBar count={sentences.length} />}
    </View>
  );
}

// A paragraph re-renders only when the cursor enters or leaves it.
const Paragraph = memo(function Paragraph({ para, sentences }: { para: Para; sentences: Sentence[] }) {
  const c = useColors();
  const active = player.usePlayer(s => (s.index >= para.from && s.index <= para.to ? s.index : -1));
  const parts: React.ReactNode[] = [];
  for (let i = para.from; i <= para.to; i++) {
    if (i > para.from) parts.push(' ');
    parts.push(i === active
      ? <Current key={i} text={sentences[i].t} />
      : <Text key={i} onPress={() => player.seek(i)} suppressHighlighting>{sentences[i].t}</Text>);
  }
  return <Text style={[type.body, { color: c.label, lineHeight: 28, fontSize: 19 }]}>{parts}</Text>;
});

// The sentence being read: tinted, with the current word underlined.
function Current({ text }: { text: string }) {
  const c = useColors();
  const at = player.usePlayer(s => wordAt(text, s.time, s.duration, s.markers));
  const end = text.indexOf(' ', at);
  const stop = end < 0 ? text.length : end;
  return (
    <Text style={{ backgroundColor: c.fill, color: c.label }}>
      {text.slice(0, at)}
      <Text style={{ color: c.tint, fontWeight: '600', textDecorationLine: 'underline' }}>{text.slice(at, stop)}</Text>
      {text.slice(stop)}
    </Text>
  );
}
