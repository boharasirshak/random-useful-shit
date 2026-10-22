import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/ui/Button';
import { hairline, space, type, useColors } from '@/ui/theme';
import type { Added } from './useAddFood';

const SHOW_MS = 3500;

type Props = {
  action?: { title: string; disabled?: boolean; onPress: () => void }; // e.g. "Add to Lunch · 1,560 kcal"
  added: Added | null;
  meal: string;
  onUndo: () => void;
  onDismiss: () => void;
};

// Pinned to the bottom of the sheet: the Add button while building, and "Added … Undo" right after any add.
export function AddBar({ action, added, meal, onUndo, onDismiss }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(onDismiss, SHOW_MS);
    return () => clearTimeout(t);
  }, [added, onDismiss]);

  if (!action && !added) return null;
  return (
    <View style={{ borderTopWidth: hairline, borderTopColor: c.separator, backgroundColor: c.bg, paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: Math.max(insets.bottom, space.md), gap: space.sm }}>
      {added && (
        <Animated.View key={added.at} entering={FadeInDown.duration(200)} exiting={FadeOut.duration(150)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 36 }} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={22} color={c.green} />
          <Text style={[type.subhead, { color: c.label, flex: 1 }]} numberOfLines={1}>Added {added.label} to {meal}</Text>
          <Pressable onPress={onUndo} hitSlop={10} accessibilityRole="button">
            <Text style={[type.headline, { color: c.tint }]}>Undo</Text>
          </Pressable>
        </Animated.View>
      )}
      {action && <Button title={action.title} disabled={action.disabled} onPress={action.onPress} />}
    </View>
  );
}
