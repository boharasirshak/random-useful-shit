import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, type, useColors } from './theme';

// A scrolling screen with an iOS large title. `back` adds a "‹ Apps"-style link to the launcher.
export function Screen({ title, accessory, back, children }: { title: string; accessory?: ReactNode; back?: string; children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + 96, gap: space.xl, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
      {back && (
        <Pressable onPress={() => router.navigate('/')} hitSlop={8} accessibilityRole="link"
          style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, marginBottom: -space.md }}>
          <Ionicons name="chevron-back" size={24} color={c.tint} />
          <Text style={[type.body, { color: c.tint }]}>{back}</Text>
        </Pressable>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: space.lg }}>
        <Text style={[type.largeTitle, { color: c.label }]} accessibilityRole="header">{title}</Text>
        {accessory}
      </View>
      {children}
    </ScrollView>
  );
}
