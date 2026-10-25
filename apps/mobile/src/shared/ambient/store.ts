// Ambient sound under whatever you're doing, on repeat, in the background too: a noise loop we ship, a free track
// you downloaded (packages/ambient, published to UploadThing), or one of your own music files. One player for the
// whole app; the choice and volume are saved on the device. Downloaded tracks live under documents/ambient/.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DATA_URL } from '@/shared/data';

export type Sound = 'off' | 'white' | 'pink' | 'brown' | 'mine' | `track:${string}`;
export const NOISES: [Sound, string][] = [['off', 'Off'], ['white', 'White noise'], ['pink', 'Pink noise'], ['brown', 'Brown noise'], ['mine', 'My music']];
export const VOLUMES: [number, string][] = [[0.15, 'Quiet'], [0.35, 'Low'], [0.6, 'Medium'], [1, 'Loud']];
export type Track = { id: string; title: string; artist: string; kind: 'lofi' | 'ambient' | 'nature'; seconds: number; mb: number; licence: string; licenceUrl: string; page: string; file: string };
const FILES: Record<'white' | 'pink' | 'brown', number> = {
  white: require('../../../assets/sounds/white.m4a'),
  pink: require('../../../assets/sounds/pink.m4a'),
  brown: require('../../../assets/sounds/brown.m4a'),
};
const dir = () => new Directory(Paths.document, 'ambient');
const trackFile = (t: Track) => new File(dir(), 'tracks', t.file);

type State = {
  sound: Sound;
  volume: number;
  mine: string | null; // uri of the file you picked
  mineName: string | null;
  playing: boolean;
  tracks: Track[]; // the published list, fetched when the settings open
  have: string[]; // track ids downloaded to this device
  busy: string | null; // track id downloading
  set: (sound: Sound) => void;
  setVolume: (v: number) => void;
  pickMine: () => Promise<void>;
  loadTracks: () => Promise<void>;
  download: (t: Track) => Promise<void>;
  removeTrack: (t: Track) => void;
  stop: () => void; // e.g. when the Reader starts (it wants the speaker to itself)
  resume: () => void; // play again if a sound is chosen
};

let player: AudioPlayer | null = null;
const release = () => {
  player?.remove();
  player = null;
};

export const useAmbient = create<State>()(
  persist(
    (set, get) => {
      const source = () => {
        const { sound, mine, tracks } = get();
        if (sound === 'off') return null;
        if (sound === 'mine') return mine ? { uri: mine } : null;
        if (sound.startsWith('track:')) {
          const t = tracks.find(x => x.id === sound.slice(6));
          const f = t && trackFile(t);
          return f?.exists ? { uri: f.uri } : null;
        }
        return FILES[sound as 'white' | 'pink' | 'brown'];
      };
      const play = async () => {
        release();
        const src = source();
        if (!src) return set({ playing: false });
        await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
        player = createAudioPlayer(src);
        player.loop = true;
        player.volume = get().volume;
        player.play();
        set({ playing: true });
      };
      return {
        sound: 'off',
        volume: 0.35,
        mine: null,
        mineName: null,
        playing: false,
        tracks: [],
        have: [],
        busy: null,
        set: sound => {
          set({ sound });
          play();
        },
        setVolume: volume => {
          set({ volume });
          if (player) player.volume = volume;
        },
        pickMine: async () => {
          const picked = await File.pickFileAsync({ mimeTypes: ['audio/*'] });
          if (picked.canceled) return;
          // iOS hands over a temporary copy: keep our own under documents so it survives.
          const d = new Directory(dir(), 'mine');
          if (d.exists) d.delete();
          d.create({ intermediates: true });
          const kept = new File(d, picked.result.name);
          picked.result.copy(kept);
          set({ mine: kept.uri, mineName: picked.result.name, sound: 'mine' });
          play();
        },
        loadTracks: async () => {
          if (!DATA_URL) return;
          try {
            const r = await fetch(`${DATA_URL}/ambient-tracks.json`);
            if (!r.ok) return;
            const tracks: Track[] = await r.json();
            set({ tracks, have: tracks.filter(t => trackFile(t).exists).map(t => t.id) });
          } catch {
            // Offline: the list you saw last time stays.
          }
        },
        download: async (t: Track) => {
          if (!DATA_URL) throw new Error('This build has no download address.');
          set({ busy: t.id });
          try {
            const d = new Directory(dir(), 'tracks');
            if (!d.exists) d.create({ intermediates: true });
            const f = trackFile(t);
            if (f.exists) f.delete();
            await File.downloadFileAsync(`${DATA_URL}/ambient-${t.file}`, f);
            set(s => ({ have: [...s.have, t.id], sound: `track:${t.id}` }));
            play();
          } finally {
            set({ busy: null });
          }
        },
        removeTrack: t => {
          const f = trackFile(t);
          if (f.exists) f.delete();
          set(s => ({ have: s.have.filter(id => id !== t.id), sound: s.sound === `track:${t.id}` ? 'off' : s.sound }));
          if (get().sound === 'off') get().stop();
        },
        stop: () => {
          release();
          set({ playing: false });
        },
        resume: () => {
          if (get().sound !== 'off' && !get().playing) play();
        },
      };
    },
    { name: 'ambient', storage: createJSONStorage(() => AsyncStorage), partialize: s => ({ sound: s.sound, volume: s.volume, mine: s.mine, mineName: s.mineName, tracks: s.tracks }) },
  ),
);
