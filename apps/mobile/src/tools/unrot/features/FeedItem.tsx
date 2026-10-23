import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, useCompetingGestures, useLongPressGesture, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { Card } from '@/tools/unrot/lib/types';
import { success, thud } from '@/ui/haptics';
import { RiveView, type RiveHandle } from '@/ui/RiveView';
import { CardFace } from './CardFace';
import { MorePanel } from './MorePanel';
import { Rail } from './Rail';
import { C, sans } from './style';

const SPRING = { damping: 22, stiffness: 220, mass: 0.8 };

export type FeedItemProps = {
  card: Card;
  width: number;
  height: number;
  top: number; // room for the top bar
  bottom: number; // room for the tab bar
  active: boolean; // on screen now: its words start arriving
  liked: boolean;
  saved: boolean;
  hidden: boolean;
  next?: Card; // next part of the card's thread
  review?: { days: number; onAnswer: (remembered: boolean) => void };
  onLike: () => void; // double tap: like, never unlike
  onToggleLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onMore: () => void; // opened "Go deeper"
  onOpenChange: (open: boolean) => void;
  onHide: () => void; // "not for me" (long-press or the button), after the card has flown off
  onUndo?: () => void;
};

// One reel. Swipe up: the next one (the list scrolls). Swipe left: "Go deeper" slides in from the right; swipe right
// closes it. Double tap: like, with a heart where you tapped. Press and hold: not for me (the card flies off, Undo).
// Swiping right on the card itself does nothing on purpose: thumbs read right as "yes" (Tinder), and iOS uses it for Back.
export function FeedItem(p: FeedItemProps) {
  const { width: W, height: H, top, bottom } = p;
  const tx = useSharedValue(0);
  const start = useSharedValue(0);
  const heart = useSharedValue(0);
  const hx = useSharedValue(0);
  const hy = useSharedValue(0);
  const [open, setOpen] = useState(false);
  const heartRive = useRef<RiveHandle>(null);
  const { onHide, onLike } = p; // plain functions, so the gesture worklets can call back into JS

  const opened = (o: boolean) => { setOpen(o); p.onOpenChange(o); if (o) p.onMore(); };
  const liked = () => { heartRive.current?.trigger('pop'); onLike(); };
  const less = () => { thud(); tx.set(withTiming(W * 1.3, { duration: 240 }, done => { if (done) scheduleOnRN(onHide); })); };
  // Undo brings the card back.
  useEffect(() => { if (!p.hidden) tx.set(withSpring(0, SPRING)); }, [p.hidden, tx]);

  const pan = usePanGesture({
    enabled: !p.hidden,
    activeOffsetX: [-14, 14],
    failOffsetY: [-14, 14],
    onBegin: () => { 'worklet'; start.set(tx.get()); },
    onUpdate: e => {
      'worklet';
      const x = start.get() + e.translationX;
      tx.set(x > 0 ? x * 0.12 : Math.max(-W, x)); // past the card's resting place it only gives a little
    },
    onDeactivate: e => {
      'worklet';
      const x = tx.get(), v = e.velocityX;
      const wasOpen = start.get() < -W / 2;
      const open = wasOpen ? !(x > -W * 0.75 || v > 500) : x < -W * 0.25 || v < -700;
      tx.set(withSpring(open ? -W : 0, SPRING));
      if (open !== wasOpen) scheduleOnRN(opened, open);
    },
  });
  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    enabled: !open && !p.hidden,
    onActivate: e => {
      'worklet';
      hx.set(e.x);
      hy.set(e.y);
      heart.set(withSequence(withTiming(0, { duration: 0 }), withSpring(1, { damping: 8, stiffness: 260 }), withDelay(350, withTiming(0, { duration: 180 }))));
      scheduleOnRN(liked);
    },
  });
  const hold = useLongPressGesture({
    minDuration: 450,
    enabled: !open && !p.hidden,
    onActivate: () => { 'worklet'; scheduleOnRN(less); },
  });
  const gesture = useCompetingGestures(pan, doubleTap, hold);

  const openMore = () => { tx.set(withSpring(-W, SPRING)); opened(true); };
  const close = () => { tx.set(withSpring(0, SPRING)); opened(false); };
  const like = () => { if (!p.liked) success(); p.onToggleLike(); };

  const cardStyle = useAnimatedStyle(() => {
    const x = Math.max(tx.value, 0);
    return { transform: [{ translateX: x }, { rotate: `${(x / W) * 7}deg` }] };
  });
  const dim = useAnimatedStyle(() => ({ opacity: interpolate(-tx.value, [0, W], [0, 0.7], Extrapolation.CLAMP) }));
  const panel = useAnimatedStyle(() => ({ transform: [{ translateX: W + Math.min(tx.value, 0) }] }));
  const lessBg = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [W * 0.4, W], [0, 1], Extrapolation.CLAMP) }));
  const rail = useAnimatedStyle(() => ({ opacity: interpolate(Math.abs(tx.value), [0, W * 0.15], [1, 0], Extrapolation.CLAMP) }));
  const heartAt = useAnimatedStyle(() => ({ transform: [{ translateX: hx.value - 70 }, { translateY: hy.value - 70 }] }));
  const webHeart = useAnimatedStyle(() => ({ opacity: heart.value > 0.01 ? 1 : 0, transform: [{ scale: heart.value }, { rotate: '-12deg' }] }));

  return (
    <View style={{ width: W, height: H, overflow: 'hidden', backgroundColor: C.panel }}>
      {/* Under the card: what "not for me" means, and Undo once it's gone. */}
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }, lessBg]}>
        <Ionicons name="eye-off-outline" size={36} color={C.dim} />
        <Text style={sans(19, '600', { color: C.ink, textAlign: 'center' })}>{p.hidden ? 'Got it. Fewer cards like this.' : 'Fewer like this'}</Text>
        {p.hidden && p.onUndo && (
          <Pressable onPress={p.onUndo} accessibilityRole="button" hitSlop={8}
            style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99, backgroundColor: C.raised }}>
            <Text style={sans(16, '600', { color: C.ink })}>Undo</Text>
          </Pressable>
        )}
      </Animated.View>
      <GestureDetector gesture={gesture} touchAction="pan-y" userSelect="none">
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, cardStyle]}>
            <CardFace card={p.card} width={W} height={H} top={top} bottom={bottom} active={p.active}>
              {p.review && <Review {...p.review} />}
            </CardFace>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, dim]} />
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: 140, height: 140 }, heartAt]}>
              <RiveView ref={heartRive} artboard="UnrotHeart" size={140} pointerEvents="none"
                fallback={<Animated.View style={webHeart}><Ionicons name="heart" size={110} color={C.like} /></Animated.View>} />
            </Animated.View>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, panel]}>
            <MorePanel card={p.card} width={W} height={H} top={top} bottom={bottom} next={p.next} open={open} onClose={close} onLess={() => { close(); setTimeout(less, 250); }} />
          </Animated.View>
        </View>
      </GestureDetector>
      {!p.hidden && (
        <Animated.View pointerEvents={open ? 'none' : 'box-none'} style={[{ position: 'absolute', right: 10, bottom: bottom + 8 }, rail]}>
          <Rail liked={p.liked} saved={p.saved} onLike={like} onSave={p.onSave} onShare={p.onShare} onMore={openMore} />
        </Animated.View>
      )}
    </View>
  );
}

// A saved card coming back: do you still remember it?
function Review({ days, onAnswer }: { days: number; onAnswer: (remembered: boolean) => void }) {
  const [answered, setAnswered] = useState<boolean | null>(null);
  const answer = (r: boolean) => { setAnswered(r); onAnswer(r); };
  return (
    <View style={{ gap: 12, marginBottom: 20 }}>
      <Text style={sans(15, '500', { color: C.dim })}>
        You saved this {days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`}. Still remember it?
      </Text>
      {answered === null ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {([[false, 'Not really'], [true, 'Yes']] as const).map(([r, label]) => (
            <Pressable key={label} onPress={() => answer(r)} accessibilityRole="button"
              style={({ pressed }) => ({ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: r ? C.ink : C.raised, opacity: pressed ? 0.7 : 1 })}>
              <Text style={sans(16, '600', { color: r ? C.bg : C.ink })}>{label}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={sans(15, '500', { color: C.ink })}>{answered ? 'Nice. It comes back later, a bit further apart each time.' : 'It comes back tomorrow.'}</Text>
      )}
    </View>
  );
}
