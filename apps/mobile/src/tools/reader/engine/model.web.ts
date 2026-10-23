// Web: no on-device models. Keeps the native package out of the PWA bundle.
import type { ModelId } from '@/tools/reader/lib/models';
import type { Synth } from './types';

export type Progress = { percent: number; phase: 'downloading' | 'extracting' };

export const modelsAvailable = false;
export const modelDownloaded = async (_id: ModelId) => false;
export const downloadModel = async (_id: ModelId, _onProgress: (p: Progress) => void, _signal?: AbortSignal): Promise<void> => {
  throw new Error('Downloaded voices need the iPhone or Android app.');
};
export const removeModel = async (_id: ModelId) => {};
export const modelSynth = (_id: ModelId, _sid: number): Synth => async () => {
  throw new Error('Downloaded voices need the iPhone or Android app.');
};
