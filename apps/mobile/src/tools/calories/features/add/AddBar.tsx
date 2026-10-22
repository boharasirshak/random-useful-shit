import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MEALS } from '@/tools/calories/lib/log';
import { useUi } from '@/tools/calories/store/ui';
import { Button } from '@/ui/Button';
import { hairline, space, type, useColors } from '@/ui/theme';
import { useLogFood } from './useLogFood';

const SHOW_MS = 3500;

// Pinned to the bottom: "Added … Undo" after any add, an optional summary (e.g. a plate's running total), and an action button.
export function AddBar({ action, summary }: { action?: { title: string; disabled?: boolean; onPress: () => void }; summary?: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const meal = useUi(s => s.meal);
  const { added, undo, dismiss } = useLogFood();

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(dismiss, SHOW_MS);
    return () => clearTimeout(t);
  }, [added, dismiss]);

  if (!action && !added && !summary) return null;
  return (
    <View style={{ borderTopWidth: hairline, borderTopColor: c.separator, backgroundColor: c.bg, paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: Math.max(insets.bottom, space.md), gap: space.sm }}>
      {added && (
        <Animated.View key={added.at} entering={FadeInDown.duration(200)} exiting={FadeOut.duration(150)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 36 }} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={22} color={c.green} />
          <Text style={[type.subhead, { color: c.label, flex: 1 }]} numberOfLines={1}>Added {added.label} to {MEALS[meal]}</Text>
          <Pressable onPress={undo} hitSlop={10} accessibilityRole="button">
            <Text style={[type.headline, { color: c.tint }]}>Undo</Text>
          </Pressable>
        </Animated.View>
      )}
      {summary}
      {action && <Button title={action.title} disabled={action.disabled} onPress={action.onPress} />}
    </View>
  );
}
