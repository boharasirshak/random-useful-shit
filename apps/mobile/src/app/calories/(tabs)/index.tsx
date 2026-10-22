import { Pressable, Text, View } from 'react-native';
import { DayRing } from '@/tools/calories/features/food/DayRing';
import { DoneForDay } from '@/tools/calories/features/food/DoneForDay';
import { FavoritesRow } from '@/tools/calories/features/food/FavoritesRow';
import { MealCard } from '@/tools/calories/features/food/MealCard';
import { WeekStrip } from '@/tools/calories/features/food/WeekStrip';
import { NewAwardBanner } from '@/tools/calories/features/motivation/NewAwardBanner';
import { RecapCard } from '@/tools/calories/features/motivation/RecapCard';
import { StreakChip } from '@/tools/calories/features/motivation/StreakChip';
import { nice, today } from '@/tools/calories/lib/dates';
import { MEALS, type Meal } from '@/tools/calories/lib/log';
import { useUi } from '@/tools/calories/store/ui';
import { select } from '@/ui/haptics';
import { Screen } from '@/ui/Screen';
import { type, useColors } from '@/ui/theme';

// Home of the Calorie Tracker: streak, the week, new awards, yesterday's recap, today's ring, favorites, meals, Done for the Day.
export default function FoodScreen() {
  const c = useColors();
  const { day, setDay } = useUi();
  const t = today();
  const accessory = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {day !== t && (
        <Pressable onPress={() => { select(); setDay(t); }} hitSlop={8} accessibilityRole="button">
          <Text style={[type.headline, { color: c.tint }]}>Today</Text>
        </Pressable>
      )}
      <StreakChip />
    </View>
  );
  return (
    <Screen title={nice(day)} back="Apps" accessory={accessory}>
      <WeekStrip />
      <NewAwardBanner />
      {day === t && <RecapCard />}
      <DayRing />
      <FavoritesRow />
      {(Object.keys(MEALS) as Meal[]).map(m => <MealCard key={m} meal={m} />)}
      <DoneForDay />
    </Screen>
  );
}
