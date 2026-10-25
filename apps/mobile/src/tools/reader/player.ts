// The audiobook player. Sentences are rendered to audio files a few ahead of the cursor and queued in an
// expo-audio playlist, so background playback, lock-screen controls and speed are the OS's job, not ours.
import { createAudioPlaylist, setAudioModeAsync, type AudioPlaylist } from 'expo-audio';
import { useAmbient } from '@/shared/ambient/store';
import { Directory, File } from 'expo-file-system';
import { create } from 'zustand';
import { makeSynth } from '@/tools/reader/engine';
import { audioExt, type Marker, type Synth } from '@/tools/reader/engine/types';
import { audioDir } from '@/tools/reader/lib/files';
import { voiceKey, type Voice } from '@/tools/reader/lib/models';
import type { Sentence } from '@/tools/reader/lib/text';
import { useReader } from '@/tools/reader/store/app';

type State = {
  bookId: string | null;
  index: number; // sentence being read
  playing: boolean;
  preparing: boolean; // waiting for audio to render
  time: number; // seconds into the sentence
  duration: number;
  markers: Marker[];
  error: string | null;
};
const idle: State = { bookId: null, index: 0, playing: false, preparing: false, time: 0, duration: 0, markers: [], error: null };
export const usePlayer = create<State>(() => idle);

type Rendered = { uri: string; duration: number; markers: Marker[] };
type Book = { id: string; title: string; sentences: Sentence[] };

const LOOKAHEAD = 6; // sentences rendered ahead of the cursor
const KEEP = 30; // rendered files kept behind the cursor (lock-screen "previous" needs a few)

let playlist: AudioPlaylist | null = null;
let book: Book | null = null;
let synth: Synth;
let dir: Directory;
let ext = 'wav';
let base = 0; // sentence index of track 0 in the playlist
let rendered = new Map<number, Rendered>();
let renderNext = 0;
let rendering = false;
let wantPlay = false;
let starved = false; // playlist ran out of tracks while we wanted to keep going
let gen = 0; // bumps on every rebuild so in-flight renders know they are stale
let session = 0; // bumps on open/close, so an open() that lost the race does nothing

const cursor = () => base + (playlist?.currentIndex ?? 0);

function list() {
  if (playlist) return playlist;
  playlist = createAudioPlaylist({ updateInterval: 200, loop: 'none' });
  playlist.addListener('trackChanged', ({ currentIndex }) => {
    const i = base + currentIndex;
    const r = rendered.get(i);
    usePlayer.setState({ index: i, time: 0, duration: r?.duration ?? 0, markers: r?.markers ?? [] });
    if (book) useReader.getState().setIndex(book.id, i);
    trim(i);
    void fill();
  });
  playlist.addListener('playlistStatusUpdate', s => {
    usePlayer.setState({ time: s.currentTime, playing: s.playing, preparing: wantPlay && !s.playing && (starved || !s.isLoaded) });
    if (s.didJustFinish && s.currentIndex >= s.trackCount - 1) {
      if (book && base + s.currentIndex + 1 >= book.sentences.length) wantPlay = false; // the end
      else starved = wantPlay;
      void fill();
    }
  });
  return playlist;
}

export async function open(b: Book, voice: Voice, rate: number, at: number) {
  useAmbient.getState().stop(); // the book gets the speaker to itself
  const s = ++session;
  await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' });
  if (s !== session) return;
  book = b;
  const p = list();
  p.setActiveForLockScreen(true, { title: b.title, artist: 'Reader' }, { showNextTrack: true, showPreviousTrack: true });
  p.playbackRate = rate;
  usePlayer.setState({ ...idle, bookId: b.id, index: at });
  setVoice(voice);
}

export function setVoice(voice: Voice) {
  if (!book) return;
  synth = makeSynth(voice);
  ext = audioExt(voice);
  dir = audioDir(book.id, voiceKey(voice));
  rebuild(usePlayer.getState().index, wantPlay);
}

export function close() {
  wantPlay = false;
  gen++;
  session++;
  playlist?.pause();
  playlist?.clearLockScreenControls();
  playlist?.clear();
  rendered.clear();
  book = null;
  usePlayer.setState(idle);
}

export function play() {
  if (!book) return;
  wantPlay = true;
  const p = list();
  p.playbackRate = useReader.getState().rate;
  if (p.trackCount > 0 && cursor() < book.sentences.length && !starved) p.play();
  else starved = true;
  usePlayer.setState({ preparing: !p.playing, error: null });
  void fill();
}

export function pause() {
  wantPlay = false;
  starved = false;
  playlist?.pause();
  usePlayer.setState({ preparing: false });
}

export const toggle = () => (wantPlay ? pause() : play());

export function seek(i: number) {
  if (!book) return;
  i = Math.max(0, Math.min(book.sentences.length - 1, i));
  const p = list();
  if (i >= base && i < base + p.trackCount && rendered.has(i)) {
    p.skipTo(i - base);
    if (wantPlay) p.play();
  } else rebuild(i, wantPlay);
}

export const next = () => seek(usePlayer.getState().index + 1);
export const prev = () => seek(usePlayer.getState().index - 1);

export function setRate(rate: number) {
  if (playlist) playlist.playbackRate = rate;
}

// Starts the queue over from sentence i.
function rebuild(i: number, play: boolean) {
  gen++;
  const p = list();
  p.pause();
  p.clear();
  rendered.clear();
  base = i;
  renderNext = i;
  wantPlay = play;
  starved = play;
  usePlayer.setState({ index: i, time: 0, duration: 0, markers: [], preparing: play, error: null });
  if (book) useReader.getState().setIndex(book.id, i);
  void fill();
}

// Renders sentences in order until LOOKAHEAD are queued past the cursor. One at a time; safe to call often.
async function fill() {
  if (rendering || !book) return;
  rendering = true;
  const g = gen;
  try {
    while (book && g === gen && renderNext < book.sentences.length && renderNext <= cursor() + LOOKAHEAD) {
      const i = renderNext;
      const file = new File(dir, `${i}.${ext}`);
      const r = await synth(book.sentences[i].t, file);
      if (g !== gen) return;
      rendered.set(i, { uri: file.uri, ...r });
      const p = list();
      p.add({ uri: file.uri, name: String(i) });
      renderNext++;
      if (i === usePlayer.getState().index) usePlayer.setState({ duration: r.duration, markers: r.markers });
      if (starved && wantPlay) {
        starved = false;
        p.skipTo(i - base);
        p.playbackRate = useReader.getState().rate; // a cleared queue may forget it
        p.play();
      }
    }
  } catch (e) {
    if (g === gen) { wantPlay = false; usePlayer.setState({ preparing: false, error: (e as Error).message }); }
  } finally {
    rendering = false;
  }
}

// Drops audio far behind the cursor. The playlist keeps the (now dead) track; a seek that far back re-renders.
function trim(i: number) {
  for (const [k, r] of rendered) {
    if (k < i - KEEP) {
      rendered.delete(k);
      try { new File(r.uri).delete(); } catch {}
    }
  }
}
