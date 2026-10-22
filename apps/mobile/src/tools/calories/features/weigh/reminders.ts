// Schedules the weigh-in reminders on the phone. Each run replaces the next two weeks of them, so weighing in
// today cancels today's ping. iPhone/Android only; the web can't schedule local notifications reliably.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { reminderText, reminderTimes, type Reminder } from '@/tools/calories/lib/reminder';

const ID = 'weigh-in-';
export const remindersSupported = Platform.OS !== 'web';

// If a reminder fires while the app is open, still show it as a banner.
if (remindersSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export async function askPermission(): Promise<boolean> {
  const now = await Notifications.getPermissionsAsync();
  if (now.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function syncReminders(r: Reminder, weighedToday: boolean, streak: number) {
  if (!remindersSupported) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter(n => n.identifier.startsWith(ID)).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  if (!r.on || !(await Notifications.getPermissionsAsync()).granted) return;
  const times = reminderTimes(new Date(), r, weighedToday);
  await Promise.all(times.map((date, i) => Notifications.scheduleNotificationAsync({
    identifier: ID + i,
    content: reminderText(i, streak),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  })));
}
