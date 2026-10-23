import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCards } from '@/tools/unrot/data/catalog';
import { FeedItem } from '@/tools/unrot/features/FeedItem';
import { INK } from '@/tools/unrot/features/fonts';
import { shareCard } from '@/tools/unrot/features/share';
import { useUnrot } from '@/tools/unrot/store/app';
import { type } from '@/ui/theme';

// One card, full screen, from the Saved list. Same gestures as the feed.
export default function CardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const card = useCards().find(c => c.id === id);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const liked = useUnrot(s => !!s.liked[id]);
  const saved = useUnrot(s => !!s.saved[id]);
  const st = useUnrot.getState;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/unrot/saved'));
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0C' }}>
      {card ? (
        <FeedItem card={card} width={width} height={height} top={insets.top + 52} bottom={insets.bottom + 24}
          liked={liked} saved={saved} hidden={false}
          onLike={() => { if (!st().liked[card.id]) st().toggleLike(card); }} onToggleLike={() => st().toggleLike(card)}
          onSave={() => st().toggleSave(card)} onShare={() => { shareCard(card).then(ok => ok && st().signal(card, 'share')); }}
          onMore={() => {}} onOpenChange={() => {}} onHide={() => { st().hide(card); close(); }} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[type.headline, { color: INK }]}>This card is gone from the catalog.</Text>
        </View>
      )}
      <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}
        style={{ position: 'absolute', top: insets.top + 8, left: 16, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="close" size={20} color={INK} />
      </Pressable>
    </View>
  );
}
