import { useEffect, useMemo } from 'react';
import { View, type TextStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { phraseCount, phrases, type Word } from '@/tools/unrot/lib/phrases';

type Props = { text: string; em?: string; active: boolean; style: TextStyle; emStyle: TextStyle };

// Card text that brightens a phrase at a time when the card lands. It starts dim, never blank, so a card you're
// swiping in is already readable. The key phrase ends brighter and heavier than the rest. Reduce Motion: no sweep.
export function Reveal({ text, em, active, style, emStyle }: Props) {
  const words = useMemo(() => phrases(text, em), [text, em]);
  const n = phraseCount(words);
  const p = useSharedValue(0);
  const still = useReducedMotion();
  useEffect(() => {
    if (active) p.set(still ? n : withTiming(n, { duration: 120 + n * 140, easing: Easing.out(Easing.quad) }));
  }, [active, still, n, p]);
  return (
    <View accessible accessibilityLabel={text} style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {words.map((w, i) => <RevealWord key={i} w={w} p={p} style={w.em ? [style, emStyle] : style} />)}
    </View>
  );
}

function RevealWord({ w, p, style }: { w: Word; p: SharedValue<number>; style: TextStyle | TextStyle[] }) {
  const a = useAnimatedStyle(() => ({ opacity: 0.28 + 0.72 * Math.min(1, Math.max(0, (p.value - w.phrase) * 1.5)) }));
  return <Animated.Text style={[style, a]}>{w.space ? `${w.text} ` : w.text}</Animated.Text>;
}
