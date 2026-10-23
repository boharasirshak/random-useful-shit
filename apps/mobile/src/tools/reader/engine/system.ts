// The phone's own text-to-speech voices, rendered to files by the local speech-file module (modules/speech-file).
import { requireOptionalNativeModule } from 'expo-modules-core';
import { filePath } from '@/tools/reader/lib/files';
import type { Marker, Synth } from './types';

export type SystemVoice = { id: string; name: string; language: string; quality: 'default' | 'enhanced' | 'premium'; installed: boolean };

const native = requireOptionalNativeModule<{
  getVoices(): Promise<SystemVoice[]>;
  openVoiceSettings(): Promise<boolean>;
  synthesizeToFile(text: string, voiceId: string | null, path: string): Promise<{ path: string; duration: number; markers: Marker[] }>;
}>('SpeechFile');

export const systemAvailable = !!native;

export const systemVoices = () => native?.getVoices() ?? Promise.resolve([]);

// Android opens the system TTS settings (where more voices install). iOS has no such screen; returns false.
export const openVoiceSettings = () => native?.openVoiceSettings() ?? Promise.resolve(false);

export const systemSynth = (voiceId?: string): Synth => async (text, out) => {
  if (!native) throw new Error('This build has no speech module. Rebuild the app (npm run ios / android).');
  const r = await native.synthesizeToFile(text, voiceId ?? null, filePath(out));
  return { duration: r.duration, markers: r.markers };
};
