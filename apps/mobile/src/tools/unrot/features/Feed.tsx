import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCards } from '@/tools/unrot/data/catalog';
import { DAY, nextPart, readMs } from '@/tools/unrot/lib/feed';
import type { Model } from '@/tools/unrot/lib/model';
import type { Card } from '@/tools/unrot/lib/types';
import { todayCount, useUnrot } from '@/tools/unrot/store/app';
import { success } from '@/ui/haptics';
import { type } from '@/ui/theme';
import { Coach } from './Coach';
import { EndCard } from './EndCard';
import { FeedItem } from './FeedItem';
import { INK, INK_DIM, serif } from './fonts';
import { extend, insertAfter, type Item } from './queue';
import { shareCard } from './share';

const AHEAD = 3;

// The reel: one card per screen, swipe up for the next. Learns from what you do with each card.
export function Feed() {
  const insets = useSafeAreaInsets();
  const cards = useCards();
  const byId = useMemo(() => new Map(cards.map(c => [c.id, c])), [cards]);
  const liked = useUnrot(s => s.liked);
  const saved = useUnrot(s => s.saved);
  const hidden = useUnrot(s => s.hidden);
  const coached = useUnrot(s => s.coached);
  const limit = useUnrot(s => s.limit);
  const today = todayCount(useUnrot(s => s.today));
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [items, setItems] = useState<Item[]>(() => extend([], 0, AHEAD + 1));
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [since] = useState(() => Date.now() - DAY); // "today" on the end card
  const list = useRef<FlatList<Item>>(null);
  const shownAt = useRef(0);
  const touched = useRef(new Set<string>()); // cards you did something with this session
  const undo = useRef(new Map<string, Model>());

  // The first card counts as shown once the feed is up.
  useEffect(() => {
    const id = items[0]?.id;
    if (id) useUnrot.getState().shown(id);
    shownAt.current = Date.now();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Light status bar over the dark feed; reading time only counts while the feed is on screen.
  useFocusEffect(useCallback(() => {
    setStatusBarStyle('light');
    shownAt.current = Date.now();
    return () => setStatusBarStyle('auto');
  }, []));

  const store = useUnrot.getState;
  const enter = (i: number, l: Item[]) => {
    const id = l[i]?.id;
    if (id) store().shown(id);
    shownAt.current = Date.now();
    if (i >= l.length - AHEAD) setItems(extend(l, i, AHEAD));
  };
  // Leaving a card you didn't touch: a quick flick is a mild "no", staying to read it is a mild "yes".
  const leave = (i: number) => {
    const it = items[i];
    const card = it?.kind === 'card' && it.id ? byId.get(it.id) : undefined;
    if (!card || touched.current.has(card.id) || store().hidden.includes(card.id)) return;
    const dt = Date.now() - shownAt.current;
    if (dt < 1500) store().signal(card, 'skip');
    else if (dt >= readMs(card)) store().signal(card, 'read');
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!size.h) return;
    const i = Math.round(e.nativeEvent.contentOffset.y / size.h);
    if (i === index || i < 0 || i >= items.length) return;
    leave(index);
    setIndex(i);
    enter(i, items);
  };

  // You engaged with part of a thread: the next part comes up next.
  const engaged = (c: Card) => {
    touched.current.add(c.id);
    const next = nextPart(cards, c, store().hidden);
    if (next && !store().seen[next.id]) setItems(l => insertAfter(l, c.id, next.id));
  };
  const actions = (c: Card) => ({
    onLike: () => {
      if (store().liked[c.id]) return;
      success();
      store().toggleLike(c);
      engaged(c);
    },
    onToggleLike: () => {
      const was = !!store().liked[c.id];
      store().toggleLike(c);
      if (!was) engaged(c);
    },
    onSave: () => {
      const was = !!store().saved[c.id];
      store().toggleSave(c);
      if (!was) { success(); engaged(c); }
    },
    onShare: async () => {
      if (await shareCard(c)) { store().signal(c, 'share'); engaged(c); }
    },
    onMore: () => {
      if (!touched.current.has(c.id)) store().signal(c, 'more');
      engaged(c);
    },
    onHide: () => {
      touched.current.add(c.id);
      undo.current.set(c.id, store().hide(c));
      const at = items.findIndex(x => x.id === c.id);
      const l = at + 1 >= items.length ? extend(items, at, AHEAD) : items;
      if (l !== items) setItems(l);
      if (at + 1 < l.length) setTimeout(() => list.current?.scrollToIndex({ index: at + 1, animated: true }), 60);
    },
    onUndo: () => {
      const m = undo.current.get(c.id);
      if (m) store().unhide(c.id, m);
      undo.current.delete(c.id);
    },
  });
  const keepGoing = () => {
    store().keepGoing();
    const l = extend(items.filter(x => x.kind !== 'end'), index - 1, AHEAD);
    setItems(l);
    enter(index, l);
  };

  const top = insets.top + 52;
  const bottom = Platform.OS === 'web' ? 16 : insets.bottom + 64; // phones: the tab bar floats over the feed
  const renderItem = ({ item }: { item: Item }) => {
    if (item.kind === 'end')
      return <EndCard width={size.w} height={size.h} count={today.count} liked={Object.values(liked).filter(t => t > since).length}
        saved={Object.values(saved).filter(s => s.at > since).length} onMore={keepGoing} />;
    const c = byId.get(item.id!);
    if (!c) return <View style={{ width: size.w, height: size.h }} />;
    const s = saved[c.id];
    return (
      <FeedItem card={c} width={size.w} height={size.h} top={top} bottom={bottom}
        liked={!!liked[c.id]} saved={!!s} hidden={hidden.includes(c.id)} next={nextPart(cards, c, hidden)}
        review={item.kind === 'review' && s ? { days: Math.floor((since + DAY - s.at) / DAY), onAnswer: r => store().reviewed(c.id, r) } : undefined}
        onOpenChange={setOpen} {...actions(c)} />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0C' }} onLayout={e => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {size.h > 0 && (items.length ? (
        <FlatList ref={list} data={items} keyExtractor={x => x.key} renderItem={renderItem} extraData={[liked, saved, hidden, size]}
          pagingEnabled showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} onScroll={onScroll} scrollEventThrottle={64} scrollEnabled={!open}
          getItemLayout={(_, i) => ({ length: size.h, offset: size.h * i, index: i })} decelerationRate="fast"
          windowSize={3} initialNumToRender={2} maxToRenderPerBatch={2} removeClippedSubviews={Platform.OS === 'android'} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
          <Ionicons name="leaf-outline" size={44} color={INK_DIM} />
          <Text style={[type.headline, { color: INK, textAlign: 'center' }]}>No cards here yet.</Text>
          <Text style={[type.subhead, { color: INK_DIM, textAlign: 'center' }]}>New cards arrive with app updates, or from the server when one is set up.</Text>
        </View>
      ))}
      {!open && (
        <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 6, left: 8, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.navigate('/')} hitSlop={8} accessibilityRole="link" style={{ flexDirection: 'row', alignItems: 'center', minHeight: 36 }}>
            <Ionicons name="chevron-back" size={24} color={INK} />
            <Text style={[type.body, { color: INK }]}>Apps</Text>
          </Pressable>
          <Text style={{ fontFamily: serif, fontSize: 22, color: INK, fontStyle: 'italic' }} accessibilityRole="header">unrot</Text>
          <Text style={[type.subhead, { color: INK_DIM, minWidth: 60, textAlign: 'right', fontVariant: ['tabular-nums'] }]} accessibilityLabel={`${today.count} cards read today`}>
            {limit ? `${Math.min(today.count, limit + today.extra)}/${limit + today.extra}` : today.count}
          </Text>
        </View>
      )}
      {!coached && items[0]?.kind === 'card' && <Coach onDone={() => store().setCoached()} />}
    </View>
  );
}
