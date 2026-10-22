import { Stack } from 'expo-router';
import { useColors } from '@/ui/theme';

// Add Food is its own full-screen stack: places (index) → a place's menu ([place]).
export default function AddLayout() {
  const c = useColors();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
}
