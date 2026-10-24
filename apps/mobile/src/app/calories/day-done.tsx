import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KIND_COLOR, medalLabel, useMotivation } from '@/tools/calories/features/motivation/useMotivation';
import { shift, today } from '@/tools/calories/lib/dates';
import { isClosed, totalKcal } from '@/tools/calories/lib/log';
import { useApp } from '@/tools/calories/store/app';
import { useBudget } from '@/tools/calories/store/derived';
import { Button } from '@/ui/Button';
import { Confetti } from '@/ui/Confetti';
import { success, tap } from '@/ui/haptics';
import { Medal } from '@/ui/Medal';
import { Ring } from '@/ui/Ring';
import { RiveView } from '@/ui/RiveView';
import { nums, space, type, useColors } from '@/ui/theme';

const fmt = (n: number) => Math.round(Math.abs(n)).toLocaleString();
const letter = (day: string) => new Date(day + 'T00:00').toLocaleDateString(undefined, { weekday: 'narrow' });

// Shown right after "Done for the Day", like Apple Books' "Daily Goal Achieved": the ring closes, the streak grows,
// new awards appear. Confetti only for days at or under target; over-target days get a kind word instead.
export default function DayDone() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { day = today() } = useLocalSearchParams<{ day?: string }>();
  const eaten = useApp(s => totalKcal(s.logs[day], s.shake));
  // Select the data, not isClosed(...): a selector that returns a new function every time makes zustand re-render forever.
  const logs = useApp(s => s.logs);
  const done = useApp(s => s.done);
  const closed = isClosed(logs, done, today());
  const markAwardsSeen = useApp(s => s.markAwardsSeen);
  const target = useBudget();
  const { streak, longest, fresh } = useMotivation();
  const under = target == null || eaten <= target;
  const record = streak > 1 && streak >= longest;
  const week = Array.from({ length: 7 }, (_, i) => shift(day, i - 6));

  // Celebrate once: a success buzz, then a lighter one as the ring lands. New awards count as seen now,
  // so keep the list from when the screen opened.
  const [awardsNow] = useState(fresh);
  useEffect(() => {
    success();
    const t = setTimeout(tap, 650);
    if (awardsNow.length) markAwardsSeen(awardsNow.map(a => a.id));
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => (router.canGoBack() ? router.back() : router.replace('/calories'));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.xxl, paddingHorizontal: space.xl, paddingBottom: space.xl, alignItems: 'center', gap: space.lg }}>
        <Animated.View entering={ZoomIn.springify().damping(12)}>
          <RiveView artboard="DayComplete" size={200} data={{ progress: target ? Math.min(1, eaten / target) : 1, color: under ? c.green : c.orange }}
            fallback={
              <Ring size={168} stroke={18} progress={target ? Math.min(1, eaten / target) : 1} color={under ? c.green : c.orange}>
                <Ionicons name="checkmark" size={64} color={under ? c.green : c.orange} />
              </Ring>
            } />
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(250)} style={{ alignItems: 'center', gap: space.xs }}>
          <Text style={[type.largeTitle, { color: c.label, textAlign: 'center' }]}>{under ? 'Day Complete' : 'Day Logged'}</Text>
          <Text style={[type.title3, nums, { color: under ? c.green : c.orange }]}>
            {target == null ? `${fmt(eaten)} kcal` : `${fmt(target - eaten)} ${under ? 'under' : 'over'} target`}
          </Text>
          <Text style={[type.subhead, { color: c.secondary, textAlign: 'center' }]}>{under ? 'Nice work.' : 'Logged is what counts. Fresh ring tomorrow.'}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(450)} style={{ alignItems: 'center', gap: space.sm, marginTop: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RiveView artboard="Flame" size={34} data={{ lit: streak > 0 }} fireOnPlay="flare" fallback={<Ionicons name="flame" size={28} color="#FF9500" />} />
            <Text style={[type.title2, nums, { color: c.label }]}>{streak}-day streak</Text>
          </View>
          {record && <Text style={[type.footnote, { color: '#FF9500', fontWeight: '700' }]}>New record</Text>}
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.xs }}>
            {week.map(d => (
              <View key={d} style={{ alignItems: 'center', gap: 4 }}>
                <Text style={[type.caption, { color: c.secondary }]}>{letter(d)}</Text>
                <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: closed(d) ? '#FF9500' : c.fill }}>
                  {closed(d) && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {awardsNow.length > 0 && (
          <Animated.View entering={FadeInUp.delay(650)} style={{ alignSelf: 'stretch', gap: space.sm, marginTop: space.md }}>
            <Text style={[type.headline, { color: c.label, textAlign: 'center' }]}>{awardsNow.length > 1 ? 'New awards' : 'New award'}</Text>
            {awardsNow.map(a => (
              <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: c.card, borderRadius: 14, padding: space.md }}>
                <Medal size={52} color={KIND_COLOR[a.kind]} label={medalLabel(a)} earned />
                <View style={{ flex: 1 }}>
                  <Text style={[type.headline, { color: c.label }]}>{a.title}</Text>
                  <Text style={[type.footnote, { color: c.secondary }]}>{a.detail}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
      <View style={{ paddingHorizontal: space.xl, paddingBottom: insets.bottom + space.md }}>
        <Button title="Done" onPress={close} />
      </View>
      {under && <Confetti />}
    </View>
  );
}
