import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { KIND_COLOR, medalLabel, useMotivation } from '@/tools/calories/features/motivation/useMotivation';
import type { Award, Kind } from '@/tools/calories/lib/awards';
import { useApp } from '@/tools/calories/store/app';
import { GlassButton } from '@/ui/GlassButton';
import { Medal } from '@/ui/Medal';
import { Screen } from '@/ui/Screen';
import { nums, radius, space, type, useColors } from '@/ui/theme';

const KINDS: [Kind, string][] = [['streak', 'Streaks'], ['target', 'On Target'], ['weight', 'Weight']];

// Awards, like Apple Fitness: your streak up top, the ones you're closest to ("Go For It"), then every medal by kind.
export default function Awards() {
  const c = useColors();
  const { list, streak, longest } = useMotivation();
  const markAwardsSeen = useApp(s => s.markAwardsSeen);
  const width = Math.min(useWindowDimensions().width, 720) - space.lg * 2;
  const cell = (width - space.sm * 2) / 3;
  const earnedIds = list.filter(a => a.earned).map(a => a.id).join();
  useEffect(() => { if (earnedIds) markAwardsSeen(earnedIds.split(',')); }, [earnedIds, markAwardsSeen]);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/calories'));
  const next = list.filter(a => !a.earned && a.have > 0).sort((a, b) => b.have / b.need - a.have / a.need).slice(0, 3);

  const tile = (a: Award, w: number) => (
    <View key={a.id} style={{ width: w, alignItems: 'center', gap: 4, paddingVertical: space.sm }} accessibilityLabel={`${a.title}, ${a.earned ? 'earned' : `${a.have} of ${a.need}`}`}>
      <Medal size={Math.min(84, w - 16)} color={KIND_COLOR[a.kind]} label={medalLabel(a)} earned={a.earned} />
      <Text style={[type.footnote, { color: a.earned ? c.label : c.secondary, fontWeight: '600', textAlign: 'center' }]} numberOfLines={1}>{a.title}</Text>
      <Text style={[type.caption, nums, { color: c.secondary }]}>{a.earned ? 'Earned' : `${a.have} of ${a.need}`}</Text>
    </View>
  );

  return (
    <Screen title="Awards" sheet accessory={<GlassButton icon="checkmark" label="Done" prominent onPress={close} />}>
      <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: streak ? '#FF950022' : c.fill, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="flame" size={40} color={streak ? '#FF9500' : c.tertiary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.largeTitle, nums, { color: c.label }]}>{streak} <Text style={[type.title3, { color: c.secondary }]}>day streak</Text></Text>
          <Text style={[type.footnote, { color: c.secondary }]}>Longest: {longest} {longest === 1 ? 'day' : 'days'}</Text>
        </View>
      </View>

      {next.length > 0 && (
        <View style={{ gap: space.sm }}>
          <Text style={[type.title3, { color: c.label, paddingHorizontal: space.lg }]}>Go For It</Text>
          <View style={{ flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg }}>{next.map(a => tile(a, cell))}</View>
        </View>
      )}

      {KINDS.map(([k, title]) => (
        <View key={k} style={{ gap: space.sm }}>
          <Text style={[type.title3, { color: c.label, paddingHorizontal: space.lg }]}>{title}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingHorizontal: space.lg }}>
            {list.filter(a => a.kind === k).map(a => tile(a, cell))}
          </View>
        </View>
      ))}
    </Screen>
  );
}
