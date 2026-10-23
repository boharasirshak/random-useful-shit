import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useReaderHydrated } from '@/tools/reader/store/app';
import { useColors } from '@/ui/theme';

// Reader: the library, one book at a time, and the Voices sheet. Waits for saved data so nothing flashes empty.
export default function ReaderLayout() {
  const c = useColors();
  if (!useReaderHydrated()) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="book/[id]" />
      <Stack.Screen name="voices" options={{ presentation: Platform.OS === 'web' ? 'modal' : 'formSheet', sheetAllowedDetents: [0.92], sheetGrabberVisible: true, sheetCornerRadius: 16 }} />
    </Stack>
  );
}
