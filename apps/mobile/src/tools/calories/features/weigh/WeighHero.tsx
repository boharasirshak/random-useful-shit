import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { today } from '@/tools/calories/lib/dates';
import { milestone, weighInNews } from '@/tools/calories/lib/weighin';
import { useApp } from '@/tools/calories/store/app';
import { Button } from '@/ui/Button';
import { Confetti } from '@/ui/Confetti';
import { success, tap } from '@/ui/haptics';
import { Ring } from '@/ui/Ring';
import { RiveView } from '@/ui/RiveView';
import { nums, radius, space, type, useColors } from '@/ui/theme';
import { range, WheelRow } from '@/ui/WheelRow';

const WHOLE = range(80, 450), TENTHS = range(0, 9);

// The scale icon hops until you've weighed in.
function Hop() {
  const c = useColors();
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withSequence(withTiming(-8, { duration: 260, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) }), withTiming(0, { duration: 700 })), -1);
  }, [y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}><Ionicons name="scale" size={30} color={c.tint} /></Animated.View>;
}

// Today's weigh-in: a big ring (start → goal) with your weight in the middle, wheels to set it, then a reaction.
export function WeighHero() {
  const c = useColors();
  const weights = useApp(s => s.weights);
  const profile = useApp(s => s.profile);
  const setWeight = useApp(s => s.setWeight);
  const t = today();
  const days = Object.keys(weights).sort();
  const lastDay = [...days].reverse().find(d => d < t);
  const startLb = days.length ? weights[days[0]] : profile.weight;
  const preset = weights[t] ?? (lastDay ? weights[lastDay] : profile.weight) ?? 180;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(preset);
  const [party, setParty] = useState(false);
  const logged = weights[t] != null && !editing;
  const shown = logged ? weights[t] : draft;
  const goal = profile.goal;
  const progress = goal && startLb > goal ? (startLb - shown) / (startLb - goal) : 0;

  const save = () => {
    const news = weighInNews({ ...weights, [t]: draft }, t);
    const before = milestone(weights[lastDay ?? ''] ?? startLb, goal), after = milestone(draft, goal);
    setWeight(t, draft);
    (news.delta != null && news.delta > 0 ? tap : success)();
    setParty(news.newLow || (before != null && (after == null || after.next < before.next)) || [7, 30, 100].includes(news.streak));
    setEditing(false);
  };

  const news = logged ? weighInNews(weights, t) : null;
  const down = news?.delta != null && news.delta < 0;
  const deltaColor = news?.delta == null || news.delta === 0 ? c.secondary : down ? c.green : c.orange;
  const whole = Math.floor(draft), tenth = Math.round((draft - whole) * 10);
  const set = (w: number, d: number) => setDraft(Math.round((w + d / 10) * 10) / 10);

  return (
    // Not clipped, and above what follows, so confetti can rain down the screen.
    <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, zIndex: 10 }}>
      <View style={{ alignItems: 'center', paddingTop: space.xl, paddingHorizontal: space.lg, gap: space.md }}>
        <Ring size={210} stroke={18} progress={progress} color={c.green}>
          <View style={{ alignItems: 'center' }}>
            {news?.newLow ? <Ionicons name="trophy" size={24} color="#FF9500" />
              : <RiveView artboard="ScaleHop" size={40} data={{ logged }} pointerEvents="none" fallback={logged ? <Ionicons name="checkmark-circle" size={24} color={c.green} /> : <Hop />} />}
            <Text style={[type.largeTitle, nums, { color: c.label, fontSize: 44, lineHeight: 52 }]}>{shown.toFixed(1)}</Text>
            <Text style={[type.subhead, { color: c.secondary }]}>lb</Text>
          </View>
        </Ring>
        {logged && news ? (
          <Animated.View entering={FadeIn} style={{ alignItems: 'center', gap: space.xs }}>
            {news.delta != null && (
              <Animated.View entering={ZoomIn.springify().damping(11)} style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, backgroundColor: deltaColor + '22' }}>
                <Text style={[type.headline, nums, { color: deltaColor }]}>{news.delta > 0 ? '+' : news.delta < 0 ? '−' : '±'}{Math.abs(news.delta).toFixed(1)} lb</Text>
              </Animated.View>
            )}
            <Text style={[type.subhead, { color: c.label, textAlign: 'center' }]}>{news.line}</Text>
          </Animated.View>
        ) : (
          <Text style={[type.headline, { color: c.label }]}>{lastDay ? 'Hop on the scale' : 'Your first weigh-in'}</Text>
        )}
      </View>
      {logged ? (
        <Pressable onPress={() => { tap(); setDraft(weights[t]); setEditing(true); }} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'center', padding: space.lg }}>
          <Text style={[type.body, { color: c.tint }]}>Edit</Text>
        </Pressable>
      ) : (
        <>
          <WheelRow label="Today" startOpen wheels={[
            { value: whole, options: WHOLE, suffix: '', onChange: w => set(w, tenth) },
            { value: tenth, options: TENTHS, suffix: 'lb', format: n => `.${n}`, onChange: d => set(whole, d) },
          ]} />
          <View style={{ padding: space.lg, paddingTop: space.sm }}>
            <Button title={`Log ${draft.toFixed(1)} lb`} onPress={save} />
          </View>
        </>
      )}
      {party && <Confetti />}
    </View>
  );
}
