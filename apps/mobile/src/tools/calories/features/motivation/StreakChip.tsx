import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { tap } from '@/ui/haptics';
import { RiveView } from '@/ui/RiveView';
import { nums, type, useColors } from '@/ui/theme';
import { useMotivation } from './useMotivation';

// 🔥 5 in the title bar: your streak at a glance. Gray at zero, orange once it's going. Opens Awards.
export function StreakChip() {
  const c = useColors();
  const { streak } = useMotivation();
  const lit = streak > 0;
  return (
    <Pressable onPress={() => { tap(); router.push('/calories/awards'); }} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${streak}-day streak. Open awards.`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: lit ? '#FF950022' : c.fill, opacity: pressed ? 0.7 : 1 })}>
      <RiveView artboard="Flame" size={22} data={{ lit }} pointerEvents="none" fallback={<Ionicons name="flame" size={18} color={lit ? '#FF9500' : c.tertiary} />} />
      <Text style={[type.headline, nums, { color: lit ? '#FF9500' : c.secondary }]}>{streak}</Text>
    </Pressable>
  );
}
