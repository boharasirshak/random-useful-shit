import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Switch, View } from 'react-native';
import { AmbientSection } from '@/shared/ambient/AmbientSection';
import { useCards, useCatalog } from '@/tools/unrot/data/catalog';
import { TasteSection } from '@/tools/unrot/features/TasteSection';
import { todayCount, useUnrot } from '@/tools/unrot/store/app';
import { fetchPublished, UNROT_DATA } from '@/tools/unrot/store/sync';
import { confirm, notify } from '@/ui/confirm';
import { Row } from '@/ui/Row';
import { Screen } from '@/ui/Screen';
import { Section } from '@/ui/Section';
import { Segmented } from '@/ui/Segmented';
import { space, useColors } from '@/ui/theme';

const LIMITS: ['15' | '25' | '40' | '0', string][] = [['15', '15'], ['25', '25'], ['40', '40'], ['0', 'No limit']];

// Your taste, your limits, your data.
export default function YouScreen() {
  const c = useColors();
  const cards = useCards().length;
  const limit = useUnrot(s => s.limit);
  const seen = useUnrot(s => Object.keys(s.seen).length);
  const today = todayCount(useUnrot(s => s.today));
  const st = useUnrot.getState;
  const chevron = <Ionicons name="chevron-forward" size={18} color={c.tertiary} />;
  const askOnLaunch = useCatalog(s => s.askOnLaunch);
  const setAsk = useCatalog(s => s.setAsk);
  const checkNow = async () => {
    try {
      const fresh = await fetchPublished();
      if (!fresh) return notify('Up to date', 'You have the newest cards.');
      useCatalog.getState().set(fresh);
      notify('Updated', `${fresh.cards.length.toLocaleString()} cards now.`);
    } catch (e) {
      notify('Could not check', e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <Screen title="You" back="Apps">
      <Section>
        <Row title="Today" value={`${today.count} card${today.count === 1 ? '' : 's'}`} />
        <Row title="Read so far" value={`${seen} of ${cards}`} />
      </Section>
      <Section header="Cards a day" footer="Reels never end. Unrot stops you after this many, with an option for ten more.">
        <View style={{ padding: space.md }}>
          <Segmented inline options={LIMITS} value={String(limit) as (typeof LIMITS)[number][0]} onChange={v => st().setLimit(Number(v))} />
        </View>
      </Section>
      <TasteSection />
      <AmbientSection />
      {UNROT_DATA && (
        <Section header="New cards" footer="Cards are published separately from app updates. On launch, Unrot can check and ask before downloading.">
          <Row title="Ask on launch" right={<Switch value={askOnLaunch} onValueChange={setAsk} />} />
          <Row title="Check for new cards now" tint onPress={checkNow} />
        </Section>
      )}
      <Section>
        <Row title="Change topics" onPress={() => router.push('/unrot/welcome')} right={chevron} />
        <Row title="Show the gesture tips again" onPress={() => { st().relearn(); router.navigate('/unrot'); }} right={chevron} />
      </Section>
      <Section header="Sync" footer="Likes, saves and your taste sync with your account, like the rest of the app.">
        <Row title="Account and sync" onPress={() => router.push('/account')} right={chevron} />
      </Section>
      <Section header="Start over">
        <Row title="Reset my taste" tint onPress={async () => {
          if (await confirm('Reset your taste?', 'The feed forgets what you like and starts again from your topics.', 'Reset')) st().resetTaste();
        }} />
        <Row title="Forget what I’ve read" tint onPress={async () => {
          if (await confirm('Forget what you’ve read?', 'Cards you’ve seen or swiped away can show up again. Saved and liked cards stay.', 'Forget')) st().clearHistory();
        }} />
      </Section>
    </Screen>
  );
}
