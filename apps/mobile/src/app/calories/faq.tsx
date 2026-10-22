import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useQuestions } from '@/tools/calories/features/faq/questions';
import { Accordion } from '@/ui/Accordion';
import { Screen } from '@/ui/Screen';
import { type, useColors } from '@/ui/theme';

// How It Works: every explanation and source, out of the way of the main screens.
export default function Faq() {
  const c = useColors();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/calories'));
  return (
    <Screen title="How It Works" sheet accessory={
      <Pressable onPress={close} hitSlop={10} accessibilityRole="button"><Text style={[type.headline, { color: c.tint }]}>Done</Text></Pressable>
    }>
      <Accordion items={useQuestions()} />
    </Screen>
  );
}
