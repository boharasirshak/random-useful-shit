// Where a book's text and rendered audio live. Text: documents (kept). Audio: cache (the OS may purge it).
import { Directory, File, Paths } from 'expo-file-system';
import type { Sentence } from './text.ts';

const bookDir = (id: string) => new Directory(Paths.document, 'reader', id);
const textFile = (id: string) => new File(bookDir(id), 'sentences.json');

export async function saveSentences(id: string, sentences: Sentence[]) {
  bookDir(id).create({ intermediates: true, idempotent: true });
  await textFile(id).write(JSON.stringify(sentences));
}

export async function loadSentences(id: string): Promise<Sentence[]> {
  return JSON.parse(await textFile(id).text());
}

export function deleteBookFiles(id: string) {
  for (const d of [bookDir(id), new Directory(Paths.cache, 'reader', id)]) if (d.exists) d.delete();
}

// Audio rendered for one book with one voice. Emptied when the book is opened; the player refills it.
export function audioDir(id: string, voiceKey: string) {
  const d = new Directory(Paths.cache, 'reader', id, voiceKey);
  if (d.exists) d.delete();
  d.create({ intermediates: true });
  return d;
}

export const filePath = (f: File) => decodeURI(f.uri.replace(/^file:\/\//, ''));
