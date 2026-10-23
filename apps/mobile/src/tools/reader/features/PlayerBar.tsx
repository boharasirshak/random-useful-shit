import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RATES } from '@/tools/reader/lib/models';
import * as player from '@/tools/reader/player';
import { useReader } from '@/tools/reader/store/app';
import { tap } from '@/ui/haptics';
import { Segmented } from '@/ui/Segmented';
import { hairline, nums, space, type, useColors } from '@/ui/theme';

// Audiobook controls: previous sentence, play/pause, next sentence, speed.
export function PlayerBar({ count }: { count: number }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const index = player.usePlayer(s => s.index);
  const playing = player.usePlayer(s => s.playing);
  const preparing = player.usePlayer(s => s.preparing);
  const error = player.usePlayer(s => s.error);
  const rate = useReader(s => s.rate);
  const setRate = useReader(s => s.setRate);
  const btn = (icon: 'play' | 'pause' | 'play-skip-back' | 'play-skip-forward', size: number, label: string, onPress: () => void) => (
    <Pressable onPress={() => { tap(); onPress(); }} hitSlop={10} accessibilityLabel={label} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: space.sm })}>
      <Ionicons name={icon} size={size} color={c.label} />
    </Pressable>
  );
  return (
    <View style={{ backgroundColor: c.card, borderTopWidth: hairline, borderTopColor: c.separator, paddingTop: space.md, paddingBottom: insets.bottom + space.sm, gap: space.md }}>
      <Text style={[type.footnote, nums, { color: error ? c.red : c.secondary, textAlign: 'center' }]} numberOfLines={1}>
        {error ?? (preparing ? 'Preparing…' : `${(index + 1).toLocaleString()} of ${count.toLocaleString()}`)}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.xxl }}>
        {btn('play-skip-back', 30, 'Previous sentence', player.prev)}
        {preparing
          ? <View style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={c.label} /></View>
          : btn(playing ? 'pause' : 'play', 44, playing ? 'Pause' : 'Play', player.toggle)}
        {btn('play-skip-forward', 30, 'Next sentence', player.next)}
      </View>
      <Segmented options={RATES.map(r => [String(r), `${r}×`] as [string, string])} value={String(rate)} onChange={v => { setRate(Number(v)); player.setRate(Number(v)); }} />
    </View>
  );
}
