// Downloaded neural voices (Kitten, Kokoro) running on the phone through sherpa-onnx. Nothing is bundled:
// the model is fetched from the sherpa-onnx GitHub release when the user asks, and unpacked under documents.
import { ModelCategory, deleteModel, ensureModel, getModelPath, isModelDownloaded, type Progress } from 'react-native-sherpa-onnx/download';
import { createTTS, saveAudioToFile, type TtsEngine } from 'react-native-sherpa-onnx/tts';
import { filePath } from '@/tools/reader/lib/files';
import { modelById, type ModelId } from '@/tools/reader/lib/models';
import type { Synth } from './types';

export const modelsAvailable = true;

export const modelDownloaded = (id: ModelId) => isModelDownloaded(ModelCategory.Tts, id);

export const downloadModel = (id: ModelId, onProgress: (p: Progress) => void, signal?: AbortSignal) =>
  ensureModel(ModelCategory.Tts, id, { onProgress, signal, deleteArchiveAfterExtract: true });

export async function removeModel(id: ModelId) {
  if (loaded?.id === id) { await loaded.engine.destroy(); loaded = null; }
  await deleteModel(ModelCategory.Tts, id);
}

// One engine in memory at a time: they are a few hundred MB.
let loaded: { id: ModelId; engine: TtsEngine } | null = null;

async function engine(id: ModelId) {
  if (loaded?.id === id) return loaded.engine;
  await loaded?.engine.destroy();
  loaded = null;
  const path = await getModelPath(ModelCategory.Tts, id);
  if (!path) throw new Error('This voice is not downloaded yet.');
  const e = await createTTS({ modelPath: { type: 'file', path }, modelType: modelById(id).type, numThreads: 2 });
  loaded = { id, engine: e };
  return e;
}

export const modelSynth = (id: ModelId, sid: number): Synth => async (text, out) => {
  const audio = await (await engine(id)).generateSpeech(text, { sid });
  await saveAudioToFile(audio, filePath(out));
  return { duration: audio.samples.length / audio.sampleRate, markers: [] };
};
