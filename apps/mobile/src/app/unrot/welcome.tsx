import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TOPICS } from '@/tools/unrot/data/topics';
import { C, sans } from '@/tools/unrot/features/style';
import { Sprout, type Mood } from '@/tools/unrot/features/Sprout';
import { useUnrot } from '@/tools/unrot/store/app';
import { select, success } from '@/ui/haptics';

const GOALS = [
  { n: 10, time: 'About 3 minutes', label: 'Light' },
  { n: 25, time: 'About 8 minutes', label: 'Regular', best: true },
  { n: 40, time: 'About 12 minutes', label: 'Deep' },
];
type Icon = ComponentProps<typeof Ionicons>['name'];
const PROMISES: [Icon, string][] = [
  ['checkmark-circle-outline', 'Every quote is real, checked word for word against the book.'],
  ['book-outline', 'Every card shows where it came from.'],
  ['moon-outline', 'When you hit your goal, I’ll tell you to stop.'],
];

// First run, Duolingo-style: one question per screen, Sprout asking it, a progress bar, one button.
// From "Change topics" (already welcomed) it's just the topics step.
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const welcomed = useUnrot(s => s.welcomed);
  const [step, setStep] = useState(welcomed ? 1 : 0);
  const [picked, setPicked] = useState<string[]>(useUnrot.getState().topics);
  const [goal, setGoal] = useState(25);
  const toggle = (id: string) => { select(); setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id])); };
  const back = () => (welcomed || step === 0 ? router.back() : setStep(step - 1));

  const finish = () => {
    if (welcomed) { useUnrot.getState().setTopics(picked); router.back(); return; }
    success();
    useUnrot.getState().welcome(picked, goal);
    router.replace('/unrot');
  };
  const next = () => (welcomed || step === 3 ? finish() : setStep(step + 1));

  const screens: { say: string; sub?: string; mood: Mood; body: ReactNode; cta: string; ok: boolean }[] = [
    {
      say: 'Hi! I’m Sprout.', sub: 'Swap brain rot for one smart idea at a time.', mood: 'talk', cta: 'Let’s go', ok: true,
      body: null,
    },
    {
      say: welcomed ? 'What are you into now?' : 'What are you curious about?', sub: 'Pick a few. I’ll learn the rest from what you read.', mood: 'talk',
      cta: !picked.length ? 'Pick at least one' : welcomed ? 'Save' : 'Continue', ok: picked.length > 0,
      body: TOPICS.map(t => (
        <Option key={t.id} on={picked.includes(t.id)} onPress={() => toggle(t.id)} check
          left={<Ionicons name={`${t.icon}-outline` as Icon} size={22} color={C.dim} />} title={t.name} sub={t.hint} />
      )),
    },
    {
      say: 'How many cards a day?', sub: 'After that I’ll tell you to stop. You can change it any time.', mood: 'talk', cta: 'Continue', ok: true,
      body: GOALS.map(g => (
        <Option key={g.n} on={goal === g.n} onPress={() => { select(); setGoal(g.n); }} badge={g.best ? 'Most people' : undefined}
          left={<Text style={sans(22, '700', { color: C.ink, width: 34, fontVariant: ['tabular-nums'] })}>{g.n}</Text>}
          title={g.label} sub={g.time} />
      )),
    },
    {
      say: 'My promise to you:', mood: 'cheer', cta: 'Start reading', ok: true,
      body: PROMISES.map(([icon, text]) => (
        <View key={text} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', paddingVertical: 6 }}>
          <Ionicons name={icon} size={24} color={C.ink} />
          <Text style={sans(18, '500', { flex: 1, color: C.ink, lineHeight: 25 })}>{text}</Text>
        </View>
      )),
    },
  ];
  const s = screens[step];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Back and progress (hidden on the hello screen) */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, height: insets.top + 48, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {(step > 0 || welcomed) && (
          <Pressable onPress={back} hitSlop={10} accessibilityRole="button" accessibilityLabel={welcomed ? 'Cancel' : 'Back'}>
            <Ionicons name={welcomed ? 'close' : 'chevron-back'} size={26} color={C.dim} />
          </Pressable>
        )}
        {step > 0 && !welcomed && (
          <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: C.hairline }} accessibilityLabel={`Step ${step} of 3`}>
            <View style={{ width: `${(step / 3) * 100}%`, height: 4, borderRadius: 2, backgroundColor: C.ink }} />
          </View>
        )}
      </View>
      <Animated.View key={step} entering={FadeInRight.duration(260)} style={{ flex: 1 }}>
        {step === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 18 }}>
            <Bubble text={s.say} big />
            <Sprout mood="talk" size={200} />
            <Text style={sans(26, '600', { color: C.ink, textAlign: 'center', maxWidth: 320 })}>{s.sub}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: 10, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Sprout mood={s.mood} size={84} />
              <View style={{ flex: 1 }}><Bubble text={s.say} sub={s.sub} /></View>
            </View>
            {s.body}
          </ScrollView>
        )}
      </Animated.View>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 16, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.hairline }}>
        <Pressable onPress={next} disabled={!s.ok} accessibilityRole="button"
          style={({ pressed }) => ({ backgroundColor: s.ok ? C.ink : C.raised, borderRadius: 14, paddingVertical: 16, alignItems: 'center', opacity: pressed ? 0.85 : 1, maxWidth: 520, width: '100%', alignSelf: 'center' })}>
          <Text style={sans(17, '600', { color: s.ok ? C.bg : C.dim })}>{s.cta}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Sprout's speech bubble.
function Bubble({ text, sub, big }: { text: string; sub?: string; big?: boolean }) {
  return (
    <View style={{ backgroundColor: C.raised, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, gap: 3, alignSelf: big ? 'center' : 'stretch' }}>
      <Text style={sans(big ? 20 : 18, '700', { color: C.ink })}>{text}</Text>
      {sub && <Text style={sans(15, '400', { color: C.dim, lineHeight: 20 })}>{sub}</Text>}
    </View>
  );
}

// A big tap target: bold label, grey line under it, a check or a radio state.
function Option({ on, onPress, left, title, sub, badge, check }: { on: boolean; onPress: () => void; left: ReactNode; title: string; sub: string; badge?: string; check?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole={check ? 'checkbox' : 'radio'} accessibilityState={{ checked: on }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16,
        borderWidth: 1.5, borderColor: on ? C.ink : C.hairline, backgroundColor: on ? C.raised : 'transparent', opacity: pressed ? 0.7 : 1 })}>
      {left}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={sans(17, '600', { color: C.ink })}>{title}</Text>
        <Text style={sans(14, '400', { color: C.dim })}>{sub}</Text>
      </View>
      {badge && <Text style={sans(13, '500', { color: C.dim })}>{badge}</Text>}
      {/* Square for pick-several, round for pick-one. */}
      <Ionicons name={check ? (on ? 'checkbox' : 'square-outline') : on ? 'radio-button-on' : 'radio-button-off'} size={24} color={on ? C.ink : C.faint} />
    </Pressable>
  );
}
