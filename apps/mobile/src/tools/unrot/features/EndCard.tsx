import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { type } from '@/ui/theme';
import { INK, INK_DIM, serif } from './fonts';

type Props = { width: number; height: number; count: number; liked: number; saved: number; onMore: () => void };

// Reels never end. This does: after the daily limit, a nudge to stop while it's still sticking.
export function EndCard({ width, height, count, liked, saved, onMore }: Props) {
  return (
    <View style={{ width, height, backgroundColor: '#0B1410', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 18 }}>
      <Ionicons name="leaf" size={56} color="#7BD88F" />
      <Text style={{ fontFamily: serif, fontSize: 32, lineHeight: 40, color: INK, textAlign: 'center' }}>That&apos;s enough for today.</Text>
      <Text style={[type.body, { color: INK_DIM, textAlign: 'center', maxWidth: 420, lineHeight: 24 }]}>
        You read {count} cards{liked || saved ? `, liked ${liked} and saved ${saved}` : ''}. Ideas stick better with a gap. Go think about one of them.
      </Text>
      <View style={{ gap: 10, alignSelf: 'stretch', maxWidth: 360, width: '100%', alignItems: 'stretch', marginTop: 8 }}>
        <Pressable onPress={() => router.navigate('/')} accessibilityRole="button"
          style={({ pressed }) => ({ backgroundColor: '#7BD88F', borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: pressed ? 0.8 : 1 })}>
          <Text style={[type.headline, { color: '#0B1410' }]}>Done for today</Text>
        </Pressable>
        <Pressable onPress={onMore} accessibilityRole="button"
          style={({ pressed }) => ({ borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: pressed ? 0.6 : 1 })}>
          <Text style={[type.headline, { color: INK_DIM }]}>Ten more</Text>
        </Pressable>
      </View>
    </View>
  );
}
