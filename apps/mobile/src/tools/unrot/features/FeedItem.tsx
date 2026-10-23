import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { Card } from '@/tools/unrot/lib/types';
import { success } from '@/ui/haptics';
import { type } from '@/ui/theme';
import { CardFace } from './CardFace';
import { INK, INK_DIM } from './fonts';
import { MorePanel } from './MorePanel';
import { Rail } from './Rail';

const SPRING = { damping: 22, stiffness: 220, mass: 0.8 };

export type FeedItemProps = {
  card: Card;
  width: number;
  height: number;
  top: number; // room for the top bar
  bottom: number; // room for the tab bar
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
  onHide: () => void; // swiped left, after the card has flown off
  onUndo?: () => void;
};

// One reel. Swipe right: "Go deeper" slides in from the left. Swipe left: the card flies off, fewer like it.
// Double tap: like, with a heart where you tapped.
export function FeedItem(p: FeedItemProps) {
  const { width: W, height: H, top, bottom } = p;
  const tx = useSharedValue(0);
  const start = useSharedValue(0);
  const heart = useSharedValue(0);
  const hx = useSharedValue(0);
  const hy = useSharedValue(0);
  const [open, setOpen] = useState(false);
  const { onHide, onLike } = p; // plain functions, so the gesture worklets can call back into JS

  const opened = (o: boolean) => { setOpen(o); p.onOpenChange(o); if (o) p.onMore(); };
  // Undo brings the card back.
  useEffect(() => { if (!p.hidden) tx.set(withSpring(0, SPRING)); }, [p.hidden, tx]);

  const pan = usePanGesture({
    enabled: !p.hidden,
    activeOffsetX: [-14, 14],
    failOffsetY: [-14, 14],
    onBegin: () => { 'worklet'; start.set(tx.get()); },
    onUpdate: e => { 'worklet'; tx.set(Math.max(-W * 1.3, Math.min(W, start.get() + e.translationX))); },
    onDeactivate: e => {
      'worklet';
      const x = tx.get(), v = e.velocityX;
      if (start.get() > W / 2) {
        // "Go deeper" was open: close it unless it was barely moved.
        if (x < W * 0.75 || v < -500) { tx.set(withSpring(0, SPRING)); scheduleOnRN(opened, false); }
        else tx.set(withSpring(W, SPRING));
      } else if (x > W * 0.25 || v > 700) {
        tx.set(withSpring(W, SPRING));
        scheduleOnRN(opened, true);
      } else if (x < -W * 0.3 || v < -700) {
        tx.set(withTiming(-W * 1.3, { duration: 200 }, done => { if (done) scheduleOnRN(onHide); }));
      } else tx.set(withSpring(0, SPRING));
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
      scheduleOnRN(onLike);
    },
  });
  const gesture = useCompetingGestures(pan, doubleTap);

  const openMore = () => { tx.set(withSpring(W, SPRING)); opened(true); };
  const close = () => { tx.set(withSpring(0, SPRING)); opened(false); };
  const less = () => { tx.set(withTiming(-W * 1.3, { duration: 220 }, done => { if (done) scheduleOnRN(onHide); })); };
  const like = () => { if (!p.liked) success(); p.onToggleLike(); };

  const cardStyle = useAnimatedStyle(() => {
    const x = Math.min(tx.value, 0);
    return { transform: [{ translateX: x }, { rotate: `${(x / W) * 7}deg` }] };
  });
  const dim = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [0, W], [0, 0.7], Extrapolation.CLAMP) }));
  const panel = useAnimatedStyle(() => ({ transform: [{ translateX: Math.max(tx.value, 0) - W }] }));
  const lessBg = useAnimatedStyle(() => ({ opacity: interpolate(-tx.value, [0, W * 0.3], [0, 1], Extrapolation.CLAMP) }));
  const rail = useAnimatedStyle(() => ({ opacity: interpolate(Math.abs(tx.value), [0, W * 0.15], [1, 0], Extrapolation.CLAMP) }));
  const heartStyle = useAnimatedStyle(() => ({
    opacity: heart.value > 0.01 ? 1 : 0,
    transform: [{ translateX: hx.value - 60 }, { translateY: hy.value - 60 }, { scale: heart.value }, { rotate: '-12deg' }],
  }));

  return (
    <View style={{ width: W, height: H, overflow: 'hidden', backgroundColor: '#1A0F12' }}>
      {/* Under the card: what swiping left means, and Undo once it's gone. */}
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }, lessBg]}>
        <Ionicons name="eye-off" size={44} color={INK_DIM} />
        <Text style={[type.title3, { color: INK, textAlign: 'center' }]}>{p.hidden ? 'Got it. Fewer cards like this.' : 'Fewer like this'}</Text>
        {p.hidden && p.onUndo && (
          <Pressable onPress={p.onUndo} accessibilityRole="button" hitSlop={8}
            style={{ paddingHorizontal: 18, paddingVertical: 9, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.14)' }}>
            <Text style={[type.headline, { color: INK }]}>Undo</Text>
          </Pressable>
        )}
      </Animated.View>
      <GestureDetector gesture={gesture} touchAction="pan-y" userSelect="none">
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, cardStyle]}>
            <CardFace card={p.card} width={W} height={H} top={top} bottom={bottom}>
              {p.review && <Review {...p.review} />}
            </CardFace>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, dim]} />
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, heartStyle]}>
              <Ionicons name="heart" size={120} color="#FF375F" style={{ textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 16 }} />
            </Animated.View>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, panel]}>
            <MorePanel card={p.card} width={W} height={H} top={top} bottom={bottom} next={p.next} open={open} onClose={close} />
          </Animated.View>
        </View>
      </GestureDetector>
      {!p.hidden && (
        <Animated.View pointerEvents={open ? 'none' : 'box-none'} style={[{ position: 'absolute', right: 10, bottom: bottom + 8 }, rail]}>
          <Rail liked={p.liked} saved={p.saved} onLike={like} onSave={p.onSave} onShare={p.onShare} onMore={openMore} onLess={less} />
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
    <View style={{ gap: 10, padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 8 }}>
      <Text style={[type.footnote, { color: INK_DIM, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }]}>
        Saved {days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`} · still with you?
      </Text>
      {answered === null ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {([[false, 'Forgot it'], [true, 'Remembered']] as const).map(([r, label]) => (
            <Pressable key={label} onPress={() => answer(r)} accessibilityRole="button"
              style={({ pressed }) => ({ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: r ? 'rgba(48,209,88,0.25)' : 'rgba(255,255,255,0.12)', opacity: pressed ? 0.7 : 1 })}>
              <Text style={[type.headline, { color: INK }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={[type.subhead, { color: INK }]}>{answered ? 'Nice. It comes back later, further apart each time.' : 'No worries. It comes back tomorrow.'}</Text>
      )}
    </View>
  );
}
