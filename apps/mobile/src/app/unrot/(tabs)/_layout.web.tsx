import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { useWebTabBar, WebTabButton } from '@/ui/WebTab';

export default function WebTabLayout() {
  const bar = useWebTabBar();
  return (
    <Tabs>
      <TabSlot />
      <TabList style={bar}>
        <TabTrigger name="index" href="/unrot" asChild><WebTabButton icon="albums">Feed</WebTabButton></TabTrigger>
        <TabTrigger name="saved" href="/unrot/saved" asChild><WebTabButton icon="bookmark">Saved</WebTabButton></TabTrigger>
        <TabTrigger name="you" href="/unrot/you" asChild><WebTabButton icon="person-circle">You</WebTabButton></TabTrigger>
      </TabList>
    </Tabs>
  );
}
