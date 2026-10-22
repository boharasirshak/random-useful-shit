import { DayPicker } from '@/tools/calories/features/food/DayPicker';
import { DaySummary } from '@/tools/calories/features/food/DaySummary';
import { MealSection } from '@/tools/calories/features/food/MealSection';
import { MEALS, type Meal } from '@/tools/calories/lib/log';
import { Screen } from '@/ui/Screen';

// Food: the day's numbers, then each meal with its food and an Add button.
export default function FoodScreen() {
  return (
    <Screen title="Food" back="Apps" accessory={<DayPicker />}>
      <DaySummary />
      {(Object.keys(MEALS) as Meal[]).map(m => <MealSection key={m} meal={m} />)}
    </Screen>
  );
}
