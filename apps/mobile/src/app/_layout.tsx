import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { startSync } from '@/shared/sync/engine';
import { SYNCED } from '@/tools/sync';
import { useColors } from '@/ui/theme';

// Closes the Google sign-in popup on web and hands the token back.
WebBrowser.maybeCompleteAuthSession();

// Launcher at "/", each tool in its own folder (e.g. /calories).
export default function RootLayout() {
  const c = useColors();
  // Offline-first: everything is saved on the device; sync sends it to the server whenever it can (see shared/sync).
  useEffect(() => { startSync(SYNCED); }, []);
  return (
    // Gesture root: charts scrub with a pan gesture.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
    </GestureHandlerRootView>
  );
}
