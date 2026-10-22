import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Svg, { Circle, Line, Polygon, Polyline } from 'react-native-svg';
import { select } from './haptics';
import { niceRange } from './scale';
import { nums, radius, space, type, useColors } from './theme';

export type Point = { x: number; y: number }; // x = ms timestamp
// Series with the same label share a legend chip, a tooltip row and visibility (e.g. a solid past + dashed future).
// fill: shade the area under the line.
export type Series = { points: Point[]; color: string; width?: number; dash?: string; dots?: boolean; fill?: boolean; label?: string };

const DAY = 864e5;
const PAD = { left: 34, right: 8, top: 8, bottom: 22 };
const fmtDay = (x: number, long: boolean) => new Date(x).toLocaleDateString(undefined, long ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' });

const fmtLong = (x: number) => new Date(x).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

// The point of a series nearest a day: dots only on their own day; lines within half their point spacing (some are weekly).
function at(s: Series, x: number) {
  const n = s.points.length;
  if (!n) return undefined;
  const gap = s.dots || n < 2 ? DAY : (s.points[n - 1].x - s.points[0].x) / (n - 1);
  let best = s.points[0];
  for (const p of s.points) if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p;
  return Math.abs(best.x - x) <= Math.max(DAY, gap) / 2 ? best : undefined;
}

// Multi-series line chart in SVG, same on iOS, Android and web.
// Touch and drag to scrub: a crosshair snaps to days, with a tooltip and a haptic tick per day.
export function LineChart({ series, height = 220, unit = '' }: { series: Series[]; height?: number; unit?: string }) {
  const c = useColors();
  const [width, setWidth] = useState(0);
  const [cursor, setCursor] = useState<number | null>(null);
  const last = useRef<number | null>(null);

  const all = series.flatMap(s => s.points);
  const xs = all.map(p => p.x), ys = all.map(p => p.y);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1, step] = niceRange(Math.min(...ys), Math.max(...ys));
  const long = x1 - x0 > 300 * DAY;
  const w = width - PAD.left - PAD.right, h = height - PAD.top - PAD.bottom;
  const X = (x: number) => PAD.left + (x1 === x0 ? w / 2 : ((x - x0) / (x1 - x0)) * w);
  const Y = (y: number) => PAD.top + (1 - (y - y0) / (y1 - y0)) * h;

  const scrub = (px: number) => {
    if (!all.length || w <= 0) return;
    const t = x0 + Math.min(1, Math.max(0, (px - PAD.left) / w)) * (x1 - x0);
    const day = x0 + Math.round((t - x0) / DAY) * DAY;
    if (day !== last.current) { last.current = day; select(); }
    setCursor(day);
  };
  const end = () => { last.current = null; setCursor(null); };
  // Starts on touch so it feels instant; a vertical swipe fails it and the page scrolls instead.
  const pan = usePanGesture({
    runOnJS: true, activeOffsetX: [-4, 4], failOffsetY: [-12, 12],
    onBegin: e => scrub(e.x), onUpdate: e => scrub(e.x), onFinalize: end,
  });

  if (!all.length) return null;
  const yTicks = Array.from({ length: Math.round((y1 - y0) / step) + 1 }, (_, i) => y0 + i * step);
  const xTicks = [x0, (x0 + x1) / 2, x1];
  const hits = cursor == null ? [] : dedupe(series.map(s => ({ s, p: at(s, cursor) })).filter(h => h.p && h.s.label));
  // Tooltip sits beside the crosshair, in whichever half (top/bottom) the lines aren't.
  const tipW = 150, tipH = 22 + hits.length * 17;
  const tipX = cursor == null ? 0 : X(cursor) > width / 2 ? X(cursor) - tipW - 8 : X(cursor) + 8;
  const linesHigh = hits.length > 0 && hits.reduce((t, h) => t + Y(h.p!.y), 0) / hits.length < height / 2;
  const tipY = linesHigh ? height - PAD.bottom - tipH - 4 : PAD.top;

  return (
    <GestureDetector gesture={pan}>
      <View onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ height }} accessibilityLabel="Weight chart. Drag to see each day.">
        {width > 0 && (
          <>
            <Svg width={width} height={height}>
              {yTicks.map(t => <Line key={t} x1={PAD.left} x2={width - PAD.right} y1={Y(t)} y2={Y(t)} stroke={c.separator} strokeWidth={0.5} />)}
              {series.filter(s => s.fill && s.points.length > 1).map((s, i) => (
                <Polygon key={`f${i}`} fill={s.color} fillOpacity={0.15}
                  points={[...s.points.map(p => `${X(p.x)},${Y(p.y)}`), `${X(s.points[s.points.length - 1].x)},${Y(y0)}`, `${X(s.points[0].x)},${Y(y0)}`].join(' ')} />
              ))}
              {series.map((s, i) =>
                s.dots
                  ? s.points.map(p => <Circle key={`${i}-${p.x}`} cx={X(p.x)} cy={Y(p.y)} r={3} fill={s.color} />)
                  : <Polyline key={i} points={s.points.map(p => `${X(p.x)},${Y(p.y)}`).join(' ')} fill="none"
                      stroke={s.color} strokeWidth={s.width ?? 2} strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round" />,
              )}
              {cursor != null && (
                <>
                  <Line x1={X(cursor)} x2={X(cursor)} y1={PAD.top} y2={height - PAD.bottom} stroke={c.secondary} strokeWidth={1} />
                  {hits.map(({ s, p }) => <Circle key={s.label} cx={X(p!.x)} cy={Y(p!.y)} r={5} fill={s.color} stroke={c.card} strokeWidth={2} />)}
                </>
              )}
            </Svg>
            {yTicks.map(t => (
              <Text key={t} style={[type.caption, nums, { position: 'absolute', left: 0, width: PAD.left - 6, textAlign: 'right', top: Y(t) - 8, color: c.secondary }]}>{Number.isInteger(t) ? t : t.toFixed(1)}</Text>
            ))}
            {xTicks.map((t, i) => (
              <Text key={i} style={[type.caption, { position: 'absolute', bottom: 0, color: c.secondary, ...(i === 0 ? { left: PAD.left } : i === 2 ? { right: PAD.right } : { left: X(t) - 30, width: 60, textAlign: 'center' }) }]}>{fmtDay(t, long)}</Text>
            ))}
            {cursor != null && (
              <View pointerEvents="none" style={{ position: 'absolute', top: tipY, left: Math.min(Math.max(tipX, 0), width - tipW), width: tipW, backgroundColor: c.bg, borderRadius: radius.sm, padding: space.sm, gap: 2,
                shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                <Text style={[type.caption, { color: c.secondary, fontWeight: '600' }]}>{fmtLong(cursor)}</Text>
                {hits.map(({ s, p }) => (
                  <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                    <Text style={[type.caption, { color: c.label, flex: 1 }]}>{s.label}</Text>
                    <Text style={[type.caption, nums, { color: c.label, fontWeight: '600' }]}>{p!.y.toFixed(1)}{unit}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </GestureDetector>
  );
}

function dedupe<T extends { s: Series }>(list: T[]) {
  return list.filter((h, i) => list.findIndex(o => o.s.label === h.s.label) === i);
}

// Legend chips under the chart. Tap one to hide or show that line.
export function Legend({ series, hidden, onToggle }: { series: Series[]; hidden?: string[]; onToggle?: (label: string) => void }) {
  const c = useColors();
  const labels = dedupe(series.filter(s => s.label).map(s => ({ s }))).map(({ s }) => s);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
      {labels.map(s => {
        const off = hidden?.includes(s.label!);
        return (
          <Pressable key={s.label} disabled={!onToggle} onPress={() => { select(); onToggle?.(s.label!); }} hitSlop={4}
            accessibilityRole="switch" accessibilityState={{ checked: !off }} accessibilityLabel={`${s.label} line`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: off ? 'transparent' : c.fill, opacity: off ? 0.45 : 1 }}>
            <View style={{ width: 12, height: s.dots ? 6 : 3, borderRadius: 3, backgroundColor: s.color }} />
            <Text style={[type.caption, { color: c.label }]}>{s.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
