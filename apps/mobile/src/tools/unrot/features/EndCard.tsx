import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { RiveView } from '@/ui/RiveView';
import { Sprout } from './Sprout';
import { C, sans } from './style';

type Props = { width: number; height: number; count: number; liked: number; saved: number; onMore: () => void };

// Reels never end. This does: after the daily goal, a nudge to stop while it's still sticking.
export function EndCard({ width, height, count, liked, saved, onMore }: Props) {
  return (
    <View style={{ width, height, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
      <RiveView artboard="UnrotGrow" size={170} data={{ progress: 100 }} pointerEvents="none" fallback={<Sprout mood="cheer" size={120} />} />
      <Text style={sans(30, '700', { color: C.ink, textAlign: 'center' })}>That’s enough for today.</Text>
      <Text style={sans(17, '400', { color: C.dim, textAlign: 'center', maxWidth: 340 })}>
        {count} cards{liked || saved ? `, ${liked} liked, ${saved} saved` : ''}. Ideas stick better with a gap. Come back tomorrow.
      </Text>
      <View style={{ gap: 6, width: '100%', maxWidth: 340, marginTop: 12 }}>
        <Pressable onPress={() => router.navigate('/')} accessibilityRole="button"
          style={({ pressed }) => ({ backgroundColor: C.ink, borderRadius: 14, paddingVertical: 15, alignItems: 'center', opacity: pressed ? 0.8 : 1 })}>
          <Text style={sans(17, '600', { color: C.bg })}>Done for today</Text>
        </Pressable>
        <Pressable onPress={onMore} accessibilityRole="button" style={({ pressed }) => ({ paddingVertical: 14, alignItems: 'center', opacity: pressed ? 0.5 : 1 })}>
          <Text style={sans(16, '500', { color: C.dim })}>Ten more</Text>
        </Pressable>
      </View>
    </View>
  );
}
