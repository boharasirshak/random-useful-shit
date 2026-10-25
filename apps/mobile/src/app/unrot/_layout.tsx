import { Stack } from 'expo-router';
import { useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { useCatalog } from '@/tools/unrot/data/catalog';
import { useUnrotHydrated } from '@/tools/unrot/store/app';
import { offerPublished, refreshCatalog } from '@/tools/unrot/store/sync';
import { confirm } from '@/ui/confirm';

// Unrot: waits for saved data, checks the server (if there is one) for new cards, and offers the published set when it's newer.
export default function UnrotLayout() {
  const hydrated = useUnrotHydrated();
  const catalogReady = useSyncExternalStore(useCatalog.persist.onFinishHydration, useCatalog.persist.hasHydrated, () => false);
  useEffect(() => {
    if (!hydrated) return;
    refreshCatalog().catch(() => {});
    offerPublished((n, kb) => confirm('New cards', `${n.toLocaleString()} new card${n === 1 ? '' : 's'} are out (${kb} KB). Download now?`, 'Download')).catch(() => {});
  }, [hydrated]);
  if (!hydrated || !catalogReady) return null;
  const modal = Platform.OS === 'web' ? 'modal' : 'fullScreenModal';
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B0B0C' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="welcome" options={{ presentation: modal, gestureEnabled: false }} />
      <Stack.Screen name="card/[id]" options={{ presentation: modal }} />
    </Stack>
  );
}
