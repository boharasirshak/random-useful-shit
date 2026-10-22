import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useHydrated } from '@/tools/calories/store/app';
import { useColors } from '@/ui/theme';

// Calorie Tracker: tabs, plus the Add Food and How It Works sheets. Waits for saved data so nothing flashes empty.
export default function CaloriesLayout() {
  const c = useColors();
  if (!useHydrated()) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add"
        options={{
          presentation: Platform.OS === 'web' ? 'modal' : 'formSheet',
          sheetAllowedDetents: [0.92],
          sheetGrabberVisible: true,
          sheetCornerRadius: 16,
        }}
      />
      <Stack.Screen name="faq" options={{ presentation: Platform.OS === 'web' ? 'modal' : 'formSheet', sheetAllowedDetents: [0.92], sheetGrabberVisible: true, sheetCornerRadius: 16 }} />
    </Stack>
  );
}
