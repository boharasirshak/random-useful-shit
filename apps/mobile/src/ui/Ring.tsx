import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from './theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
type Props = { size: number; stroke: number; progress: number; color: string; children?: ReactNode };

// Activity-ring style progress (0–1, capped) that sweeps to its value, starting at 12 o'clock, with content in the middle.
export function Ring({ size, stroke, progress, color, children }: Props) {
  const c = useColors();
  const r = (size - stroke) / 2, len = 2 * Math.PI * r;
  const p = useSharedValue(0);
  const target = Math.min(1, Math.max(0, progress));
  useEffect(() => { p.value = withTiming(target, { duration: 700, easing: Easing.out(Easing.cubic) }); }, [p, target]);
  const arc = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - p.value), strokeOpacity: p.value > 0.001 ? 1 : 0 }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.fill} strokeWidth={stroke} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${len} ${len}`} animatedProps={arc} />
      </Svg>
      {children}
    </View>
  );
}
