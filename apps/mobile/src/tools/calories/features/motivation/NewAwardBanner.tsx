import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { success } from '@/ui/haptics';
import { Medal } from '@/ui/Medal';
import { radius, space, type, useColors } from '@/ui/theme';
import { KIND_COLOR, medalLabel, useMotivation } from './useMotivation';

// A new award you haven't seen yet. Tap to open Awards (which marks it seen).
export function NewAwardBanner() {
  const c = useColors();
  const { fresh } = useMotivation();
  if (!fresh.length) return null;
  const a = fresh[0];
  return (
    <Animated.View entering={FadeInDown.springify()}>
      <Pressable onPress={() => { success(); router.push('/calories/awards'); }} accessibilityRole="button"
        style={({ pressed }) => ({ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, padding: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md, opacity: pressed ? 0.8 : 1 })}>
        <Medal size={48} color={KIND_COLOR[a.kind]} label={medalLabel(a)} earned />
        <View style={{ flex: 1 }}>
          <Text style={[type.footnote, { color: KIND_COLOR[a.kind], fontWeight: '600' }]}>{fresh.length > 1 ? `${fresh.length} new awards` : 'New award'}</Text>
          <Text style={[type.headline, { color: c.label }]}>{a.title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.tertiary} />
      </Pressable>
    </Animated.View>
  );
}
