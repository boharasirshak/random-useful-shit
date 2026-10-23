import { Redirect } from 'expo-router';
import { Feed } from '@/tools/unrot/features/Feed';
import { useUnrot } from '@/tools/unrot/store/app';

export default function FeedScreen() {
  const welcomed = useUnrot(s => s.welcomed);
  return welcomed ? <Feed /> : <Redirect href="/unrot/welcome" />;
}
