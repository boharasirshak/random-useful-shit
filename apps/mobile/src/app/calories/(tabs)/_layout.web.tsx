import Ionicons from '@expo/vector-icons/Ionicons';
import { TabList, TabSlot, Tabs, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hairline, useColors } from '@/ui/theme';

type Icon = ComponentProps<typeof Ionicons>['name'];

// Web (PWA): an iOS-style bottom tab bar, since there's no system tab bar in the browser.
function TabButton({ icon, children, isFocused, ...props }: TabTriggerSlotProps & { icon: Icon }) {
  const c = useColors();
  const color = isFocused ? c.tint : c.secondary;
  return (
    // Cast: expo-router/ui's ref type lags React Native 0.88's view types.
    <Pressable {...(props as PressableProps)} style={{ flex: 1, alignItems: 'center', gap: 2, paddingTop: 7 }}>
      <Ionicons name={isFocused ? icon : (`${icon}-outline` as Icon)} size={24} color={color} />
      <Text style={{ fontSize: 10, fontWeight: '500', color }}>{children}</Text>
    </Pressable>
  );
}

export default function WebTabLayout() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Tabs>
      <TabSlot />
      <TabList style={{
        flexDirection: 'row', backgroundColor: c.card, borderTopWidth: hairline, borderTopColor: c.separator,
        paddingBottom: Math.max(insets.bottom, 8), height: 50 + Math.max(insets.bottom, 8),
      }}>
        <TabTrigger name="index" href="/calories" asChild><TabButton icon="restaurant">Food</TabButton></TabTrigger>
        <TabTrigger name="body" href="/calories/body" asChild><TabButton icon="walk">Body</TabButton></TabTrigger>
        <TabTrigger name="goals" href="/calories/goals" asChild><TabButton icon="trending-down">Goals</TabButton></TabTrigger>
      </TabList>
    </Tabs>
  );
}
