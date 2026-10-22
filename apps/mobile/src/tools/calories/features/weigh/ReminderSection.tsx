import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Alert, Switch, Text, View } from 'react-native';
import { useApp } from '@/tools/calories/store/app';
import { select } from '@/ui/haptics';
import { Section } from '@/ui/Section';
import { space, type, useColors } from '@/ui/theme';
import { askPermission, remindersSupported } from './reminders';

// "Daily reminder" on/off and its time. Turning it on asks iOS for permission the first time.
export function ReminderSection() {
  const c = useColors();
  const reminder = useApp(s => s.reminder);
  const setReminder = useApp(s => s.setReminder);
  if (!remindersSupported) return null;

  const toggle = async (on: boolean) => {
    select();
    if (on && !(await askPermission())) {
      Alert.alert('Notifications are off', 'Turn them on for this app in Settings to get weigh-in reminders.');
      return;
    }
    setReminder({ on });
  };
  const row = { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.sm } as const;

  return (
    <Section header="Reminder">
      <View style={row}>
        <Text style={[type.body, { color: c.label, flex: 1 }]}>Remind me to weigh in</Text>
        <Switch value={reminder.on} onValueChange={toggle} />
      </View>
      {reminder.on && (
        <View style={row}>
          <Text style={[type.body, { color: c.label, flex: 1 }]}>Time</Text>
          <DateTimePicker mode="time" display="compact" accentColor={c.tint} value={new Date(2000, 0, 1, reminder.hour, reminder.minute)}
            onChange={(_, d) => d && setReminder({ hour: d.getHours(), minute: d.getMinutes() })} />
        </View>
      )}
    </Section>
  );
}
