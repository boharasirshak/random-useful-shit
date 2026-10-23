import { useEffect } from 'react';
import { Image } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { RiveView } from '@/ui/RiveView';

export type Mood = 'idle' | 'talk' | 'cheer';
const MOOD = { idle: 0, talk: 1, cheer: 2 };

// Sprout, Unrot's mascot (Rive). Web, which has no Rive, gets the logo with a gentle bob.
export function Sprout({ mood = 'idle', size = 120 }: { mood?: Mood; size?: number }) {
  return <RiveView artboard="UnrotSprout" size={size} data={{ mood: MOOD[mood] }} pointerEvents="none" fallback={<Bob size={size * 0.8} fast={mood !== 'idle'} />} />;
}

function Bob({ size, fast }: { size: number; fast: boolean }) {
  const y = useSharedValue(0);
  const still = useReducedMotion();
  useEffect(() => {
    if (!still) y.set(withRepeat(withTiming(1, { duration: fast ? 420 : 1400, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [fast, still, y]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: -y.value * (fast ? 6 : 3) }] }));
  return (
    <Animated.View style={a}>
      <Image source={require('@/assets/tools/unrot.png')} style={{ width: size, height: size, borderRadius: size * 0.22 }} accessibilityIgnoresInvertColors />
    </Animated.View>
  );
}
