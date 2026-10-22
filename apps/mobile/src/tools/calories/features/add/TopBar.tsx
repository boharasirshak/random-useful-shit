import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassButton } from '@/ui/GlassButton';
import { space, type, useColors } from '@/ui/theme';

// Closes Add Food entirely, from any depth.
export const closeAddFood = () => router.dismissTo('/calories');

// Top of each Add Food page, Apple Health style: round glass back (optional) and ✓ Done, then the title with an optional badge.
export function TopBar({ back, title, badge }: { back?: string; title: ReactNode; badge?: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + space.xs, paddingHorizontal: space.lg, gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {back ? <GlassButton icon="chevron-back" label={`Back to ${back}`} onPress={() => router.back()} /> : <View />}
        <GlassButton icon="checkmark" label="Done" prominent onPress={closeAddFood} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        {badge}
        {typeof title === 'string' ? <Text style={[type.largeTitle, { color: c.label, flexShrink: 1 }]} numberOfLines={1} adjustsFontSizeToFit>{title}</Text> : title}
      </View>
    </View>
  );
}
