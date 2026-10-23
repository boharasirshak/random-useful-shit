import type { File } from 'expo-file-system';

// Where a word starts: character offset in the sentence, and seconds into its audio.
export type Marker = { at: number; time: number };

// Renders one sentence to `out`. Both voices (system, downloaded model) look like this to the player.
export type Synth = (text: string, out: File) => Promise<{ duration: number; markers: Marker[] }>;

// Audio file extension each platform's system voice writes (Core Audio on iOS, WAV on Android).
export const audioExt = (ios: boolean) => (ios ? 'caf' : 'wav');
