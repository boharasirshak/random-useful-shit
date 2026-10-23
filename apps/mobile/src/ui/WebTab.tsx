import Ionicons from '@expo/vector-icons/Ionicons';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hairline, useColors } from './theme';

type Icon = ComponentProps<typeof Ionicons>['name'];

// Web (PWA): an iOS-style tab button, since there's no system tab bar in the browser.
export function WebTabButton({ icon, children, isFocused, ...props }: TabTriggerSlotProps & { icon: Icon }) {
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

// Style for the TabList that holds the buttons.
export function useWebTabBar() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return {
    flexDirection: 'row', backgroundColor: c.card, borderTopWidth: hairline, borderTopColor: c.separator,
    paddingBottom: Math.max(insets.bottom, 8), height: 50 + Math.max(insets.bottom, 8),
  } as const;
}
