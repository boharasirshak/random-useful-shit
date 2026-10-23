// Downloaded neural voices (Kitten, Kokoro) running on the phone through sherpa-onnx. Nothing is bundled:
// the model archive is fetched from the sherpa-onnx GitHub release when the user asks, unpacked by the
// library's native extractor, and kept under documents/reader/models/<id>.
import { Directory, File, Paths } from 'expo-file-system';
import { TurboModuleRegistry, type TurboModule } from 'react-native';
import { createTTS, saveAudioToFile, type TtsEngine } from 'react-native-sherpa-onnx/tts';
import { filePath } from '@/tools/reader/lib/files';
import { modelById, type ModelId } from '@/tools/reader/lib/models';
import type { Synth } from './types';

export type Progress = { percent: number; phase: 'downloading' | 'extracting' };

const RELEASE = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models';

// The library's TurboModule, for its archive extractor (libarchive). Looked up directly so a build without it
// fails with a message instead of at import time.
const native = TurboModuleRegistry.get<TurboModule & {
  extractArchive(source: string, target: string, force: boolean, skipEntries: number, operationId: string): Promise<{ success: boolean; reason?: string }>;
}>('SherpaOnnx');

export const modelsAvailable = !!native;

const modelDir = (id: ModelId) => new Directory(Paths.document, 'reader', 'models', id);
const ready = (id: ModelId) => new File(modelDir(id), 'ready');

export const modelDownloaded = async (id: ModelId) => ready(id).exists;

export async function downloadModel(id: ModelId, onProgress: (p: Progress) => void, signal?: AbortSignal) {
  if (!native) throw new Error('This build has no sherpa-onnx module. Rebuild the app.');
  const dir = modelDir(id);
  if (dir.exists) dir.delete();
  dir.create({ intermediates: true });
  const archive = new File(dir, `${id}.tar.bz2`);
  const task = File.createDownloadTask(`${RELEASE}/${id}.tar.bz2`, archive);
  const sub = task.addListener('progress', p => onProgress({ percent: p.totalBytes > 0 ? (p.bytesWritten / p.totalBytes) * 100 : 0, phase: 'downloading' }));
  const abort = () => task.cancel();
  signal?.addEventListener('abort', abort);
  try {
    const file = await task.downloadAsync();
    if (!file || signal?.aborted) throw new Error('Cancelled');
    onProgress({ percent: 100, phase: 'extracting' });
    const r = await native.extractArchive(filePath(archive), filePath(dir), true, 0, `reader-${id}`);
    if (!r.success) throw new Error(r.reason ?? 'Could not unpack the model');
    archive.delete();
    ready(id).create();
  } catch (e) {
    if (dir.exists) dir.delete();
    throw e;
  } finally {
    sub.remove();
    signal?.removeEventListener('abort', abort);
    task.release();
  }
}

export async function removeModel(id: ModelId) {
  if (loaded?.id === id) { await loaded.engine.destroy(); loaded = null; }
  if (modelDir(id).exists) modelDir(id).delete();
}

// One engine in memory at a time: they are a few hundred MB.
let loaded: { id: ModelId; engine: TtsEngine } | null = null;

async function engine(id: ModelId) {
  if (loaded?.id === id) return loaded.engine;
  await loaded?.engine.destroy();
  loaded = null;
  if (!ready(id).exists) throw new Error('This voice is not downloaded yet.');
  // The archive unpacks into one folder named after the model; point the engine at it.
  const dir = modelDir(id);
  const inner = dir.list().find(e => e instanceof Directory) as Directory | undefined;
  const e = await createTTS({ modelPath: { type: 'file', path: filePath(inner ?? dir) }, modelType: modelById(id).type, numThreads: 2 });
  loaded = { id, engine: e };
  return e;
}

export const modelSynth = (id: ModelId, sid: number): Synth => async (text, out) => {
  const audio = await (await engine(id)).generateSpeech(text, { sid });
  await saveAudioToFile(audio, filePath(out));
  return { duration: audio.samples.length / audio.sampleRate, markers: [] };
};
