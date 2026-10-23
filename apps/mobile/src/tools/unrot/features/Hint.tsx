import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { C, sans } from './style';

export type Lesson = 'next' | 'like' | 'deeper' | 'less';
// One gesture at a time, taught on a real card, gone the moment you do it (like Tinder's first swipes).
export const LESSONS: Lesson[] = ['next', 'like', 'deeper', 'less'];
const HINT: Record<Lesson, string> = {
  next: 'Swipe up for the next card',
  like: 'Double-tap to like',
  deeper: 'Swipe left to go deeper',
  less: 'Press and hold if it’s not for you',
};

export function Hint({ lesson }: { lesson: Lesson }) {
  return (
    <Animated.View entering={FadeIn.duration(400).delay(700)} exiting={FadeOut.duration(200)} pointerEvents="none" style={{ alignItems: 'center', gap: 14 }}>
      <Cue lesson={lesson} />
      <Text style={sans(15, '600', { color: C.ink })}>{HINT[lesson]}</Text>
    </Animated.View>
  );
}

const SPAN = 26; // how far the fingertip travels, each way from the middle

// A fingertip: a soft white dot that shows the gesture. Swipes leave two fading ghosts; taps ripple; a hold grows a ring.
function Cue({ lesson }: { lesson: Lesson }) {
  const t = useSharedValue(0);
  const still = useReducedMotion();
  useEffect(() => {
    t.set(still ? 0.5 : withRepeat(withTiming(1, { duration: lesson === 'less' ? 1900 : 1600, easing: Easing.linear }), -1, false));
  }, [lesson, still, t]);
  return (
    <View style={{ width: 2 * SPAN + 44, height: 2 * SPAN + 44, alignItems: 'center', justifyContent: 'center' }}>
      {lesson === 'next' || lesson === 'deeper' ? (
        <>
          <Dot t={t} lesson={lesson} lag={0.1} alpha={0.18} />
          <Dot t={t} lesson={lesson} lag={0.05} alpha={0.36} />
          <Dot t={t} lesson={lesson} lag={0} alpha={1} />
        </>
      ) : (
        <>
          <Ring t={t} lesson={lesson} />
          <Dot t={t} lesson={lesson} lag={0} alpha={1} />
        </>
      )}
    </View>
  );
}

function Dot({ t, lesson, lag, alpha }: { t: SharedValue<number>; lesson: Lesson; lag: number; alpha: number }) {
  const a = useAnimatedStyle(() => {
    const v = t.value - lag;
    const fade = interpolate(v, [0, 0.1, 0.55, 0.68], [0, 1, 1, 0], 'clamp') * alpha;
    if (lesson === 'next' || lesson === 'deeper') {
      const k = interpolate(v, [0.1, 0.55], [0, 1], 'clamp');
      const d = SPAN - 2 * SPAN * (1 - (1 - k) * (1 - k)); // ease out
      return { opacity: fade, transform: lesson === 'next' ? [{ translateY: d }] : [{ translateX: d }] };
    }
    const press = lesson === 'like'
      ? interpolate(t.value, [0.12, 0.18, 0.24, 0.32, 0.38, 0.44], [1, 0.78, 1, 1, 0.78, 1], 'clamp')
      : interpolate(t.value, [0.1, 0.2, 0.8, 0.9], [1, 0.82, 0.82, 1], 'clamp');
    return { opacity: interpolate(t.value, [0, 0.08, 0.8, 0.95], [0, 1, 1, 0], 'clamp'), transform: [{ scale: press }] };
  });
  return <Animated.View style={[{ position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: C.ink, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, a]} />;
}

function Ring({ t, lesson }: { t: SharedValue<number>; lesson: Lesson }) {
  const a = useAnimatedStyle(() => {
    if (lesson === 'like') {
      const k = Math.max(interpolate(t.value, [0.18, 0.4], [0, 1], 'clamp') * (t.value < 0.4 ? 1 : 0), interpolate(t.value, [0.38, 0.62], [0, 1], 'clamp') * (t.value >= 0.38 ? 1 : 0));
      return { opacity: (1 - k) * 0.6 * (k > 0 ? 1 : 0), transform: [{ scale: 1 + k * 1.1 }] };
    }
    const k = interpolate(t.value, [0.2, 0.8], [0, 1], 'clamp');
    return { opacity: interpolate(t.value, [0.15, 0.25, 0.8, 0.92], [0, 0.7, 0.7, 0], 'clamp'), transform: [{ scale: 1 + k * 0.9 }] };
  });
  return <Animated.View style={[{ position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: C.ink }, a]} />;
}
