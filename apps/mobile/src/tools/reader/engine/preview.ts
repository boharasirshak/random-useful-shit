// Voice previews: one sample sentence per voice, rendered once into the cache. One plays at a time.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import { create } from 'zustand';
import { makeSynth } from '@/tools/reader/engine';
import { audioExt } from '@/tools/reader/engine/types';
import { voiceKey, type Voice } from '@/tools/reader/lib/models';

const SAMPLE = 'Here is how this voice sounds when it reads a book to you.';

// Which voice is previewing, and whether it is still rendering or already playing.
export const usePreview = create<{ key: string | null; state: 'loading' | 'playing' }>(() => ({ key: null, state: 'loading' }));

let player: AudioPlayer | null = null;

export async function preview(v: Voice) {
  const key = voiceKey(v);
  stopPreview();
  usePreview.setState({ key, state: 'loading' });
  const dir = new Directory(Paths.cache, 'reader', 'preview');
  dir.create({ intermediates: true, idempotent: true });
  const file = new File(dir, `${key}.${audioExt(v)}`);
  try {
    if (!file.exists) await makeSynth(v)(SAMPLE, file);
  } catch (e) {
    usePreview.setState({ key: null });
    throw e;
  }
  if (usePreview.getState().key !== key) return; // another one was tapped meanwhile
  await setAudioModeAsync({ playsInSilentMode: true });
  player = createAudioPlayer({ uri: file.uri });
  player.addListener('playbackStatusUpdate', s => { if (s.didJustFinish && usePreview.getState().key === key) stopPreview(); });
  player.play();
  usePreview.setState({ key, state: 'playing' });
}

export function stopPreview() {
  player?.remove();
  player = null;
  usePreview.setState({ key: null });
}
