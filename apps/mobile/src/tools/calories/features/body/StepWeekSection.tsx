import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DAYS, weekAvg } from '@/tools/calories/lib/steps';
import { useApp } from '@/tools/calories/store/app';
import { select } from '@/ui/haptics';
import { Section } from '@/ui/Section';
import { nums, radius, space, type, useColors } from '@/ui/theme';
import { range, WheelRow } from '@/ui/WheelRow';

const BAR_H = 64;
const STEPS = range(0, 60).map(i => i * 500);
const fmt = (n: number) => Math.round(n).toLocaleString();
const todayIndex = () => (new Date().getDay() + 6) % 7; // Monday = 0

// Your typical week of steps: tap a day's bar, set it on the wheel. The model uses the week's average.
export function StepWeekSection() {
  const c = useColors();
  const stepWeeks = useApp(s => s.stepWeeks);
  const fallback = useApp(s => s.profile.steps);
  const setStepWeek = useApp(s => s.setStepWeek);
  const week = stepWeeks[stepWeeks.length - 1]?.week ?? Array(7).fill(fallback);
  const [day, setDay] = useState(todayIndex);
  const [picked, setPicked] = useState(false);
  const max = Math.max(10000, ...week);

  return (
    <Section header="Steps">
      <View style={{ padding: space.lg, gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={[type.title2, nums, { color: c.label }]}>{fmt(weekAvg(week))}</Text>
          <Text style={[type.footnote, { color: c.secondary }]}>steps/day average</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {week.map((n, i) => {
            const on = i === day;
            return (
              <Pressable key={i} onPress={() => { select(); setDay(i); setPicked(true); }} accessibilityRole="button" accessibilityState={{ selected: on }}
                accessibilityLabel={`${DAYS[i]}, ${fmt(n)} steps`} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <Text style={[type.caption, nums, { color: on ? c.tint : c.secondary, fontSize: 10 }]}>{n >= 1000 ? `${Math.round(n / 100) / 10}k` : n}</Text>
                <View style={{ height: BAR_H, width: '100%', justifyContent: 'flex-end', borderRadius: radius.sm, backgroundColor: c.fill, overflow: 'hidden' }}>
                  <View style={{ height: Math.max(n ? 4 : 0, (n / max) * BAR_H), backgroundColor: on ? c.tint : c.green, opacity: on ? 1 : 0.55 }} />
                </View>
                <Text style={[type.caption, { color: on ? c.tint : c.secondary, fontWeight: on ? '700' : '400' }]}>{DAYS[i][0]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <WheelRow key={day} label={DAYS[day]} startOpen={picked} wheels={[{
        value: week[day], options: STEPS, suffix: 'steps', format: n => n.toLocaleString(),
        onChange: n => setStepWeek(week.map((x, i) => (i === day ? n : x))),
      }]} />
    </Section>
  );
}
