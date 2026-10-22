import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, type, useColors } from './theme';

type Props = { title: string; accessory?: ReactNode; back?: string; onBack?: () => void; sheet?: boolean; children: ReactNode };

// A scrolling screen with an iOS large title. `back` adds a "‹ Apps"-style link (to the launcher unless onBack is given).
// sheet: inside a form sheet, which already sits below the notch.
export function Screen({ title, accessory, back, onBack = () => router.navigate('/'), sheet, children }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  // iOS knows where this screen really sits (under the notch, inside tabs, in a sheet), so let it inset the
  // scroll view. Elsewhere, pad by the safe area ourselves.
  const ios = Platform.OS === 'ios';
  const top = sheet ? space.lg : ios ? space.xs : insets.top + space.xs;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentInsetAdjustmentBehavior={ios ? 'automatic' : 'never'}
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingTop: top, paddingBottom: ios ? space.xxl : insets.bottom + 88, gap: space.lg, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
      <View style={{ gap: space.xs }}>
        {back && (
          <Pressable onPress={onBack} hitSlop={8} accessibilityRole="link"
            style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, minHeight: 32 }}>
            <Ionicons name="chevron-back" size={24} color={c.tint} />
            <Text style={[type.body, { color: c.tint }]}>{back}</Text>
          </Pressable>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, paddingHorizontal: space.lg, minHeight: 41 }}>
          <Text style={[type.largeTitle, { color: c.label, flexShrink: 1 }]} accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
          {accessory}
        </View>
      </View>
      {children}
    </ScrollView>
  );
}
