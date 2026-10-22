import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { nums, space, type, useColors } from './theme';

export type Point = { x: number; y: number }; // x = ms timestamp
export type Series = { points: Point[]; color: string; width?: number; dash?: string; dots?: boolean; label?: string };

const PAD = { left: 36, right: 8, top: 8, bottom: 22 };
const fmtDay = (x: number) => new Date(x).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// Minimal multi-series line chart in SVG. Same rendering on iOS, Android and web.
export function LineChart({ series, height = 220 }: { series: Series[]; height?: number }) {
  const c = useColors();
  const [width, setWidth] = useState(0);
  const all = series.flatMap(s => s.points);
  if (!all.length) return null;

  const xs = all.map(p => p.x), ys = all.map(p => p.y);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs) || 1];
  const [y0, y1] = [Math.floor(Math.min(...ys) - 1), Math.ceil(Math.max(...ys) + 1)];
  const w = width - PAD.left - PAD.right, h = height - PAD.top - PAD.bottom;
  const X = (x: number) => PAD.left + (x1 === x0 ? w / 2 : ((x - x0) / (x1 - x0)) * w);
  const Y = (y: number) => PAD.top + (1 - (y - y0) / (y1 - y0)) * h;
  const yTicks = [0, 1, 2, 3].map(i => y0 + ((y1 - y0) * i) / 3);
  const xTicks = [x0, (x0 + x1) / 2, x1];

  return (
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 && (
        <>
          <Svg width={width} height={height}>
            {yTicks.map(t => <Line key={t} x1={PAD.left} x2={width - PAD.right} y1={Y(t)} y2={Y(t)} stroke={c.separator} strokeWidth={0.5} />)}
            {series.map((s, i) =>
              s.dots
                ? s.points.map(p => <Circle key={`${i}-${p.x}`} cx={X(p.x)} cy={Y(p.y)} r={3} fill={s.color} />)
                : <Polyline key={i} points={s.points.map(p => `${X(p.x)},${Y(p.y)}`).join(' ')} fill="none"
                    stroke={s.color} strokeWidth={s.width ?? 2} strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round" />,
            )}
          </Svg>
          {yTicks.map(t => (
            <Text key={t} style={[type.caption, nums, { position: 'absolute', left: 0, width: PAD.left - 6, textAlign: 'right', top: Y(t) - 8, color: c.secondary }]}>{Math.round(t)}</Text>
          ))}
          {xTicks.map((t, i) => (
            <Text key={i} style={[type.caption, { position: 'absolute', bottom: 0, color: c.secondary, ...(i === 0 ? { left: PAD.left } : i === 2 ? { right: PAD.right } : { left: X(t) - 24, width: 48, textAlign: 'center' }) }]}>{fmtDay(t)}</Text>
          ))}
        </>
      )}
    </View>
  );
}

// Legend chips under the chart.
export function Legend({ series }: { series: Series[] }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
      {series.filter(s => s.label).map(s => (
        <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: s.dots ? 6 : 3, borderRadius: 3, backgroundColor: s.color }} />
          <Text style={[type.caption, { color: c.secondary }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}
