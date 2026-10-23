import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { FlatList, Platform, Pressable, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCards } from '@/tools/unrot/data/catalog';
import { DAY, nextPart, readMs } from '@/tools/unrot/lib/feed';
import type { Model } from '@/tools/unrot/lib/model';
import type { Card } from '@/tools/unrot/lib/types';
import { todayCount, useUnrot } from '@/tools/unrot/store/app';
import { success } from '@/ui/haptics';
import { EndCard } from './EndCard';
import { FeedItem } from './FeedItem';
import { Hint, LESSONS } from './Hint';
import { extend, insertAfter, type Item } from './queue';
import { shareCard } from './share';
import { C, sans } from './style';

const AHEAD = 3;

// The reel: one card per screen, swipe up for the next. Learns from what you do with each card.
export function Feed() {
  const insets = useSafeAreaInsets();
  const cards = useCards();
  const byId = useMemo(() => new Map(cards.map(c => [c.id, c])), [cards]);
  const liked = useUnrot(s => s.liked);
  const saved = useUnrot(s => s.saved);
  const hidden = useUnrot(s => s.hidden);
  const lessons = useUnrot(s => s.lessons);
  const lesson = LESSONS.find(l => !lessons.includes(l));
  const limit = useUnrot(s => s.limit);
  const today = todayCount(useUnrot(s => s.today));
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [items, setItems] = useState<Item[]>(() => extend([], -1, AHEAD + 1)); // -1: nothing on screen yet
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Card | null>(null); // just hidden: Undo for a few seconds
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
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
    if (i > index) store().learned('next');
  };

  // You engaged with part of a thread: the next part comes up next.
  const engaged = (c: Card) => {
    touched.current.add(c.id);
    const next = nextPart(cards, c, store().hidden);
    if (next && !store().seen[next.id]) setItems(l => insertAfter(l, c.id, next.id));
  };
  const actions = (c: Card) => ({
    onLike: () => {
      store().learned('like');
      if (store().liked[c.id]) return;
      success();
      store().toggleLike(c);
      engaged(c);
    },
    onToggleLike: () => {
      const was = !!store().liked[c.id];
      store().toggleLike(c);
      if (!was) { store().learned('like'); engaged(c); }
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
      store().learned('deeper');
      if (!touched.current.has(c.id)) store().signal(c, 'more');
      engaged(c);
    },
    onHide: () => {
      store().learned('less');
      touched.current.add(c.id);
      undo.current.set(c.id, store().hide(c));
      setToast(c);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 4500);
      const at = items.findIndex(x => x.id === c.id);
      const l = at + 1 >= items.length ? extend(items, at, AHEAD) : items;
      if (l !== items) setItems(l);
      if (at + 1 < l.length) setTimeout(() => list.current?.scrollToIndex({ index: at + 1, animated: true }), 60);
    },
    onUndo: () => undoHide(c),
  });
  const undoHide = (c: Card) => {
    const m = undo.current.get(c.id);
    if (m) store().unhide(c.id, m);
    undo.current.delete(c.id);
    setToast(null);
  };
  const keepGoing = () => {
    store().keepGoing();
    const l = extend(items.filter(x => x.kind !== 'end'), index - 1, AHEAD);
    setItems(l);
    enter(index, l);
  };

  const top = insets.top + 52;
  const bottom = Platform.OS === 'web' ? 20 : insets.bottom + 68; // phones: the tab bar floats over the feed
  const renderItem = ({ item, index: i }: { item: Item; index: number }) => {
    if (item.kind === 'end')
      return <EndCard width={size.w} height={size.h} count={today.count} liked={Object.values(liked).filter(t => t > since).length}
        saved={Object.values(saved).filter(s => s.at > since).length} onMore={keepGoing} />;
    const c = byId.get(item.id!);
    if (!c) return <View style={{ width: size.w, height: size.h }} />;
    const s = saved[c.id];
    return (
      <FeedItem card={c} width={size.w} height={size.h} top={top} bottom={bottom} active={i === index}
        liked={!!liked[c.id]} saved={!!s} hidden={hidden.includes(c.id)} next={nextPart(cards, c, hidden)}
        review={item.kind === 'review' && s ? { days: Math.floor((since + DAY - s.at) / DAY), onAnswer: r => store().reviewed(c.id, r) } : undefined}
        onOpenChange={setOpen} {...actions(c)} />
    );
  };

  return (
    // The list is pinned at the measured size, so it can't push its container taller (on web that loops forever).
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: C.bg }} onLayout={e => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {size.h > 0 && (items.length ? (
        <FlatList ref={list} data={items} style={{ position: 'absolute', top: 0, left: 0, width: size.w, height: size.h }} keyExtractor={x => x.key} renderItem={renderItem} extraData={[liked, saved, hidden, size, index]}
          pagingEnabled showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} onScroll={onScroll} scrollEventThrottle={64} scrollEnabled={!open}
          getItemLayout={(_, i) => ({ length: size.h, offset: size.h * i, index: i })} decelerationRate="fast"
          windowSize={3} initialNumToRender={2} maxToRenderPerBatch={2} removeClippedSubviews={Platform.OS === 'android'} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
          <Text style={sans(19, '600', { color: C.ink, textAlign: 'center' })}>No cards here yet</Text>
          <Text style={sans(15, '400', { color: C.dim, textAlign: 'center' })}>New cards arrive with app updates.</Text>
        </View>
      ))}
      {!open && (
        <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top, left: 0, right: 0 }}>
          {/* Today's progress toward the daily goal: a hairline that fills, like stories. */}
          {limit > 0 && (
            <View style={{ height: 2, marginHorizontal: 16, marginTop: 4, borderRadius: 1, backgroundColor: C.hairline }}
              accessible accessibilityLabel={`${today.count} of ${limit + today.extra} cards today`}>
              <View style={{ height: 2, borderRadius: 1, backgroundColor: C.ink, width: `${Math.min(100, (today.count / (limit + today.extra)) * 100)}%` }} />
            </View>
          )}
          <View pointerEvents="box-none" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 44 }}>
            <Pressable onPress={() => router.navigate('/')} hitSlop={10} accessibilityRole="link" accessibilityLabel="Back to apps" style={{ width: 36, height: 36, justifyContent: 'center' }}>
              <Ionicons name="chevron-back" size={24} color={C.ink} />
            </Pressable>
            <Text style={sans(17, '700', { color: C.ink, letterSpacing: -0.2 })} accessibilityRole="header">unrot</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>
      )}
      {lesson && !open && items[index]?.kind === 'card' && (
        // In the empty space above the words (cards sit a little above centre), so a tip never covers them.
        <View key={lesson} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 48, top: top + 8 }}>
          <Hint lesson={lesson} />
        </View>
      )}
      {toast && (
        <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(180)}
          style={{ position: 'absolute', left: 16, right: 16, bottom: bottom - 8, flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: C.raised, borderRadius: 14, paddingLeft: 16, paddingRight: 6, paddingVertical: 6,
            shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } }}>
          <Text style={sans(15, '500', { color: C.ink, flex: 1 })}>Hidden. You’ll see fewer like it.</Text>
          <Pressable onPress={() => undoHide(toast)} accessibilityRole="button" hitSlop={6} style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 10, opacity: pressed ? 0.5 : 1 })}>
            <Text style={sans(15, '700', { color: C.ink })}>Undo</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
