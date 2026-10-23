import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { deleteBookFiles } from '@/tools/reader/lib/files';
import { canImport, importPdf } from '@/tools/reader/lib/import';
import { useReader } from '@/tools/reader/store/app';
import { Button } from '@/ui/Button';
import { confirm, notify } from '@/ui/confirm';
import { thud } from '@/ui/haptics';
import { Row } from '@/ui/Row';
import { Screen } from '@/ui/Screen';
import { Section } from '@/ui/Section';
import { space, useColors } from '@/ui/theme';

// The bookshelf: add a PDF, pick one to listen to, remove one.
export function Library() {
  const c = useColors();
  const books = useReader(s => s.books);
  const addBook = useReader(s => s.addBook);
  const removeBook = useReader(s => s.removeBook);
  const [busy, setBusy] = useState(false);
  const list = Object.values(books).sort((a, b) => b.opened.localeCompare(a.opened));

  const add = async () => {
    setBusy(true);
    try {
      const b = await importPdf();
      if (b) { addBook(b); router.push(`/reader/book/${b.id}`); }
    } catch (e) {
      notify('Could not add this PDF', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string, title: string) => {
    if (!(await confirm('Remove book?', `"${title}" and its saved spot go away. The PDF itself stays where it was.`, 'Remove'))) return;
    thud();
    removeBook(id);
    try { deleteBookFiles(id); } catch {}
  };

  return (
    <Screen title="Reader" back="Apps" accessory={
      <Pressable onPress={() => router.push('/reader/voices')} hitSlop={10} accessibilityLabel="Voices" accessibilityRole="button">
        <Ionicons name="mic-outline" size={26} color={c.tint} />
      </Pressable>
    }>
      <View style={{ paddingHorizontal: space.lg }}>
        <Button title="Add PDF" onPress={add} busy={busy} disabled={!canImport} />
      </View>
      <Section header={list.length ? 'Books' : undefined} footer={
        !canImport ? 'Reading PDFs aloud needs the iPhone or Android app.'
          : list.length ? undefined : 'Add a PDF and it is read to you with the phone\'s voice, or one you download. Works with the screen locked, like an audiobook.'
      }>
        {list.map(b => (
          <Row
            key={b.id}
            title={b.title}
            subtitle={`${Math.round((b.index / Math.max(1, b.count - 1)) * 100)}% · ${b.count.toLocaleString()} sentences`}
            onPress={() => router.push(`/reader/book/${b.id}`)}
            right={
              <Pressable onPress={() => remove(b.id, b.title)} hitSlop={10} accessibilityLabel={`Remove ${b.title}`} accessibilityRole="button">
                <Ionicons name="trash-outline" size={20} color={c.tertiary} />
              </Pressable>
            }
          />
        ))}
      </Section>
    </Screen>
  );
}
