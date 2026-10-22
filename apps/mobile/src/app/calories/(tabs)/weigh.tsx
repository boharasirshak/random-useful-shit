import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { HelpButton } from '@/tools/calories/features/faq/HelpButton';
import { Milestone } from '@/tools/calories/features/weigh/Milestone';
import { ReminderSection } from '@/tools/calories/features/weigh/ReminderSection';
import { WeekBubbles } from '@/tools/calories/features/weigh/WeekBubbles';
import { WeighHero } from '@/tools/calories/features/weigh/WeighHero';
import { WeighIns } from '@/tools/calories/features/weigh/WeighIns';
import { DAY_MS, shift, today, ts } from '@/tools/calories/lib/dates';
import { trend } from '@/tools/calories/lib/model';
import { weighInNews } from '@/tools/calories/lib/weighin';
import { useApp } from '@/tools/calories/store/app';
import { Heading } from '@/ui/Heading';
import { LineChart } from '@/ui/LineChart';
import { Screen } from '@/ui/Screen';
import { nums, radius, space, type, useColors } from '@/ui/theme';

// Weigh-in: its own tab so it's one tap away every morning. Ring, wheels, a reaction, the week, the next milestone.
export default function WeighScreen() {
  const c = useColors();
  const weights = useApp(s => s.weights);
  const goal = useApp(s => s.profile.goal);
  const start = useApp(s => s.profile.weight);
  const t = today();
  const days = Object.keys(weights).sort();
  const latest = days.length ? weights[days[days.length - 1]] : start;
  const last = days[days.length - 1];
  // The streak is alive if you weighed in today or yesterday (today still has time).
  const live = last === t || last === shift(t, -1);
  const streak = live ? weighInNews(weights, last).streak : 0;
  const points = days.filter(d => ts(d) >= ts(t) - 30 * DAY_MS).map(d => ({ x: ts(d), y: weights[d] }));

  const chip = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: streak ? c.tint + '22' : c.fill }}>
      <Ionicons name="flame" size={18} color={streak ? c.tint : c.tertiary} />
      <Text style={[type.headline, nums, { color: streak ? c.tint : c.secondary }]}>{streak}</Text>
    </View>
  );

  return (
    <Screen title="Weigh-in" back="Apps" accessory={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{chip}<HelpButton /></View>}>
      <WeighHero />
      <WeekBubbles streak={streak} />
      <Milestone current={latest || 0} goal={goal} />
      <ReminderSection />
      {points.length > 1 && (
        <View style={{ gap: space.sm }}>
          <Heading title="Last 30 days" />
          <View style={{ marginHorizontal: space.lg, backgroundColor: c.card, borderRadius: radius.lg, padding: space.md }}>
            <LineChart height={160} unit=" lb" series={[
              { points: trend(points), color: c.green, width: 3, label: 'Trend' },
              { points, color: c.secondary, dots: true, label: 'Weigh-ins' },
            ]} />
          </View>
        </View>
      )}
      <WeighIns />
    </Screen>
  );
}
