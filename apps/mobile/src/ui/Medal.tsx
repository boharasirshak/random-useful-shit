import { Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useColors } from './theme';

// Award medal in the Apple Fitness spirit: concentric line art. Earned = metallic color with the number; locked = faint outline.
export function Medal({ size, color, label, earned }: { size: number; color: string; label: string; earned: boolean }) {
  const c = useColors();
  const font = Platform.select({ web: '-apple-system, BlinkMacSystemFont, sans-serif' });
  const s = size / 2, id = `g${color.replace('#', '')}`;
  const line = earned ? `url(#${id})` : c.tertiary;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <Stop offset="0.35" stopColor={color} />
          <Stop offset="1" stopColor={color} stopOpacity={0.7} />
        </LinearGradient>
      </Defs>
      {earned && <Circle cx={s} cy={s} r={s - 1} fill={color} fillOpacity={0.14} />}
      <Circle cx={s} cy={s} r={s * 0.92} stroke={line} strokeWidth={size * 0.035} fill="none" />
      <Circle cx={s} cy={s} r={s * 0.74} stroke={line} strokeWidth={size * 0.02} fill="none" />
      <Circle cx={s} cy={s} r={s * 0.58} stroke={line} strokeWidth={size * 0.012} fill="none" strokeDasharray={`${size * 0.03} ${size * 0.03}`} />
      <SvgText x={s} y={s + size * 0.1} fontSize={size * 0.3} fontWeight="800" fontFamily={font} textAnchor="middle" fill={earned ? color : c.tertiary}>{label}</SvgText>
    </Svg>
  );
}
