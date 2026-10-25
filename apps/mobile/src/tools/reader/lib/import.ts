// Pick a PDF, pull its text out natively (PDFKit / PDFBox), split it into sentences and save it as a book.
import { File } from 'expo-file-system';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { filePath, saveSentences } from './files.ts';
import { sentences } from './text.ts';

const pdf = requireOptionalNativeModule<{ extractText(path: string, password: string | null): Promise<string> }>('PdfExtractor');

export const canImport = !!pdf;

export async function importPdf(): Promise<{ id: string; title: string; count: number } | null> {
  if (!pdf) throw new Error('This build has no PDF module. Rebuild the app (npm run ios / android).');
  const picked = await File.pickFileAsync({ mimeTypes: ['application/pdf'] }); // a list: iOS rejects a bare string before the picker opens
  if (picked.canceled) return null;
  const file = picked.result;
  const text = await pdf.extractText(filePath(file), null);
  const list = sentences(text);
  if (!list.length) throw new Error('No readable text in this PDF. Scanned pages would need OCR.');
  const id = Date.now().toString(36);
  await saveSentences(id, list);
  return { id, title: file.name.replace(/\.pdf$/i, ''), count: list.length };
}
