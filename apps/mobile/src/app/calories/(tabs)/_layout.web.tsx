import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { useWebTabBar, WebTabButton } from '@/ui/WebTab';

// Web (PWA): an iOS-style bottom tab bar, since there's no system tab bar in the browser.
export default function WebTabLayout() {
  const bar = useWebTabBar();
  return (
    <Tabs>
      <TabSlot />
      <TabList style={bar}>
        <TabTrigger name="index" href="/calories" asChild><WebTabButton icon="restaurant">Food</WebTabButton></TabTrigger>
        <TabTrigger name="weigh" href="/calories/weigh" asChild><WebTabButton icon="scale">Weigh-in</WebTabButton></TabTrigger>
        <TabTrigger name="goals" href="/calories/goals" asChild><WebTabButton icon="trending-down">Goals</WebTabButton></TabTrigger>
        <TabTrigger name="body" href="/calories/body" asChild><WebTabButton icon="walk">Body</WebTabButton></TabTrigger>
      </TabList>
    </Tabs>
  );
}
