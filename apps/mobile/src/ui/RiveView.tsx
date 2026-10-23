import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Rive, { Alignment, AutoBind, Fit, type RiveRef } from 'rive-react-native';
import FILE from '../../assets/rive/random-useful-shit.riv';

// Every animation lives in one Rive file (../../../*.rml → assets/rive/, see README). Pick one by artboard name.
export type Artboard = 'Flame' | 'DayComplete' | 'AddTick' | 'ScaleHop' | 'Medal';
// View-model values the host sets: numbers, booleans, or '#RRGGBB' colors.
export type RiveData = Record<string, number | boolean | string>;
export type RiveHandle = { trigger: (name: string) => void };
export type RiveViewProps = {
  artboard: Artboard;
  size: number; // square, in points
  data?: RiveData;
  fireOnPlay?: string; // a trigger to fire once the state machine starts
  fallback: ReactNode; // what web shows instead (rive-react-native is native only)
  children?: ReactNode; // overlaid in the middle on native, e.g. a medal's number
  pointerEvents?: ViewProps['pointerEvents']; // 'none' when a parent Pressable owns the tap
};

export const RiveView = forwardRef<RiveHandle, RiveViewProps>(function RiveView({ artboard, size, data, fireOnPlay, children, pointerEvents }, ref) {
  const rive = useRef<RiveRef>(null);
  const started = useRef(false);
  const json = JSON.stringify(data ?? {});
  const apply = useCallback(() => {
    const r = rive.current;
    if (!r) return;
    for (const [k, v] of Object.entries(JSON.parse(json) as RiveData)) {
      if (typeof v === 'number') r.setNumber(k, v);
      else if (typeof v === 'boolean') r.setBoolean(k, v);
      else r.setColor(k, v);
    }
  }, [json]);
  useEffect(() => { if (started.current) apply(); }, [apply]);
  useImperativeHandle(ref, () => ({ trigger: name => rive.current?.trigger(name) }), []);

  return (
    <View pointerEvents={pointerEvents} style={{ width: size, height: size }}>
      <Rive ref={rive} source={FILE} artboardName={artboard} dataBinding={AutoBind(true)} fit={Fit.Contain} alignment={Alignment.Center} autoplay
        style={{ width: size, height: size }}
        onPlay={() => {
          if (started.current) return;
          started.current = true;
          apply();
          if (fireOnPlay) rive.current?.trigger(fireOnPlay);
        }} />
      {children != null && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>{children}</View>}
    </View>
  );
});
