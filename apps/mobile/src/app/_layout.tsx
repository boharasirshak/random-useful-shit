import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColors } from '@/ui/theme';

// Closes the Google sign-in popup on web and hands the token back.
WebBrowser.maybeCompleteAuthSession();

// Launcher at "/", each tool in its own folder (e.g. /calories).
export default function RootLayout() {
  const c = useColors();
  return (
    // Gesture root: charts scrub with a pan gesture.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
    </GestureHandlerRootView>
  );
}
