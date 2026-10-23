import { Stack } from 'expo-router';
import { useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { useCatalog } from '@/tools/unrot/data/catalog';
import { useUnrotHydrated } from '@/tools/unrot/store/app';
import { refreshCatalog } from '@/tools/unrot/store/sync';

// Unrot: waits for saved data and checks the server (if there is one) for new cards.
export default function UnrotLayout() {
  const hydrated = useUnrotHydrated();
  const catalogReady = useSyncExternalStore(useCatalog.persist.onFinishHydration, useCatalog.persist.hasHydrated, () => false);
  useEffect(() => { if (hydrated) refreshCatalog().catch(() => {}); }, [hydrated]);
  if (!hydrated || !catalogReady) return null;
  const modal = Platform.OS === 'web' ? 'modal' : 'fullScreenModal';
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0C' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="welcome" options={{ presentation: modal, gestureEnabled: false }} />
      <Stack.Screen name="card/[id]" options={{ presentation: modal }} />
    </Stack>
  );
}
