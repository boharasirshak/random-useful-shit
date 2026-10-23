import type { File } from 'expo-file-system';
import { Platform } from 'react-native';
import type { Voice } from '@/tools/reader/lib/models';

// Where a word starts: character offset in the sentence, and seconds into its audio.
export type Marker = { at: number; time: number };

// Renders one sentence to `out`. Both voices (system, downloaded model) look like this to the player.
export type Synth = (text: string, out: File) => Promise<{ duration: number; markers: Marker[] }>;

// File extension of what a voice writes: models always WAV; the iOS system voice Core Audio, Android's WAV.
// The player picks the format from the extension, so it has to be right.
export const audioExt = (v: Voice) => (v.kind === 'model' || Platform.OS !== 'ios' ? 'wav' : 'caf');
