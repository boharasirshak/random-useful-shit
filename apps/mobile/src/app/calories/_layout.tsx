import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { syncReminders } from '@/tools/calories/features/weigh/reminders';
import { shift, today } from '@/tools/calories/lib/dates';
import { weighInNews } from '@/tools/calories/lib/weighin';
import { useApp, useHydrated } from '@/tools/calories/store/app';
import { useUi } from '@/tools/calories/store/ui';
import { useColors } from '@/ui/theme';

// Calorie Tracker: tabs, plus Add Food and Day Complete (full screen), and the Awards and How It Works sheets. Waits for saved data so nothing flashes empty.
export default function CaloriesLayout() {
  const c = useColors();
  const hydrated = useHydrated();
  const reminder = useApp(s => s.reminder);
  const weights = useApp(s => s.weights);
  const t = today();
  const weighed = weights[t] != null;
  const last = Object.keys(weights).sort().pop();
  const streak = last && (last === t || last === shift(t, -1)) ? weighInNews(weights, last).streak : 0;
  useEffect(() => {
    if (hydrated) syncReminders(reminder, weighed, streak).catch(() => {});
  }, [hydrated, reminder, weighed, streak]);
  // The selected day follows the clock: past midnight, or coming back to the app, it moves on to the new day
  // (unless you picked a day yourself). Yesterday closes on its own; tap it in the week strip to edit it.
  useEffect(() => {
    const roll = () => useUi.getState().rollover();
    roll();
    const tick = setInterval(roll, 30_000);
    const sub = AppState.addEventListener('change', s => { if (s === 'active') roll(); });
    return () => { clearInterval(tick); sub.remove(); };
  }, []);
  if (!hydrated) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="(tabs)" />
      {/* Full screen: menus need the room, especially on small phones. */}
      <Stack.Screen name="add" options={{ presentation: Platform.OS === 'web' ? 'modal' : 'fullScreenModal' }} />
      <Stack.Screen name="day-done" options={{ presentation: Platform.OS === 'web' ? 'modal' : 'fullScreenModal', animation: 'fade' }} />
      <Stack.Screen name="awards" options={{ presentation: Platform.OS === 'web' ? 'modal' : 'formSheet', sheetAllowedDetents: [0.92], sheetGrabberVisible: true, sheetCornerRadius: 16 }} />
      <Stack.Screen name="faq" options={{ presentation: Platform.OS === 'web' ? 'modal' : 'formSheet', sheetAllowedDetents: [0.92], sheetGrabberVisible: true, sheetCornerRadius: 16 }} />
    </Stack>
  );
}
