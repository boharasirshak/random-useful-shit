import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const COLORS = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE', '#FF2D55'];
const COUNT = 60;
// Repeatable pseudo-random 0–1 (render must stay pure, so no Math.random).
const rnd = (i: number, k: number) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

// One burst of confetti falling from the top. Purely decorative; ignores touches.
export function Confetti() {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => Array.from({ length: COUNT }, (_, i) => ({
    x: rnd(i, 1) * width, drift: (rnd(i, 2) - 0.5) * 120, delay: rnd(i, 3) * 400,
    size: 6 + rnd(i, 4) * 6, spin: 360 + rnd(i, 5) * 720, color: COLORS[i % COLORS.length], round: i % 3 === 0,
  })), [width]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => <Piece key={i} {...p} fall={height + 40} />)}
    </View>
  );
}

function Piece({ x, drift, delay, size, spin, color, round, fall }: { x: number; drift: number; delay: number; size: number; spin: number; color: string; round: boolean; fall: number }) {
  const t = useSharedValue(0);
  useEffect(() => { t.value = withDelay(delay, withTiming(1, { duration: 2200, easing: Easing.in(Easing.quad) })); }, [t, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value * 0.6,
    transform: [{ translateX: x + drift * t.value }, { translateY: -20 + fall * t.value }, { rotate: `${spin * t.value}deg` }],
  }));
  return <Animated.View style={[{ position: 'absolute', width: size, height: round ? size : size * 0.45, borderRadius: round ? size / 2 : 1, backgroundColor: color }, style]} />;
}
