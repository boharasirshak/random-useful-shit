import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { tap } from '@/ui/haptics';
import { useColors } from '@/ui/theme';

// "?" in a screen's title row → How It Works.
export function HelpButton() {
  const c = useColors();
  return (
    <Pressable onPress={() => { tap(); router.push('/calories/faq'); }} hitSlop={10} accessibilityRole="button" accessibilityLabel="How it works">
      <Ionicons name="help-circle-outline" size={28} color={c.tint} />
    </Pressable>
  );
}
