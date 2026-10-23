import { Platform, Share } from 'react-native';
import type { Card } from '@/tools/unrot/lib/types';
import { notify } from '@/ui/confirm';

const shareText = (c: Card) =>
  [c.title, c.type === 'quote' ? `“${c.text}”` : c.text, c.author ? `— ${c.author}, ${c.source}` : c.source, '', 'via Unrot'].filter(x => x != null).join('\n');

// The system share sheet. Browsers without one get the text copied instead.
export async function shareCard(c: Card): Promise<boolean> {
  const message = shareText(c);
  try {
    if (Platform.OS === 'web' && !navigator.share) {
      await navigator.clipboard.writeText(message);
      notify('Copied', 'The card is on your clipboard.');
      return true;
    }
    const r = await Share.share({ message });
    return r.action !== Share.dismissedAction;
  } catch {
    return false;
  }
}
