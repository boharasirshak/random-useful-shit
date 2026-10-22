import { Slider } from '@expo/ui/community/slider';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { maxRate, MIN_RATE, pace } from '@/tools/calories/lib/model';
import { select } from '@/ui/haptics';
import { nums, space, type, useColors } from '@/ui/theme';

const SAVE_MS = 250; // the plan recalculates on save, so wait until the thumb rests

// "Lose per week" as a slider in 0.1 lb steps, capped at 1% of body weight, with a pace label (gentle / recommended / fast).
export function RateSlider({ rate, weight, onChange }: { rate: number; weight: number; onChange: (rate: number) => void }) {
  const c = useColors();
  const max = maxRate(weight);
  const [value, setValue] = useState(Math.min(rate, max));
  const [seen, setSeen] = useState(rate);
  if (rate !== seen) { setSeen(rate); setValue(Math.min(rate, max)); }
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const change = (v: number) => {
    const r = Math.round(v * 10) / 10;
    if (r === value) return;
    select();
    setValue(r);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(r), SAVE_MS);
  };

  const p = pace(value, weight);
  const color = p.zone === 'fast' ? c.orange : c.green;
  return (
    <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={[type.body, { color: c.label, flex: 1 }]}>Lose per week</Text>
        <Text style={[type.title3, nums, { color: c.label }]}>{value.toFixed(1)} lb</Text>
      </View>
      <Slider value={value} minimumValue={MIN_RATE} maximumValue={max} step={0.1} onValueChange={change}
        minimumTrackTintColor={color} accessibilityLabel="Pounds to lose per week" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
        <Text style={[type.footnote, { color, fontWeight: '600', flex: 1 }]}>{p.label}</Text>
        <Text style={[type.footnote, nums, { color: c.secondary }]}>{p.pct.toFixed(2)}% of body weight</Text>
      </View>
    </View>
  );
}
