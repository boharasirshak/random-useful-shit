// The downloadable full food catalog (every store product, not just the popular ones the app ships with), and its
// photos. Both live on UploadThing (packages/food-data/upload.mjs puts them there). The JSON is one download into
// the app's documents; photos are optional and trickle in a few a second while the app is open, each saved as a
// file, so after that the whole database works offline. Photos not yet saved load by URL.
// Device-only: none of this syncs or goes into a backup, because it can always be downloaded again.
// `version` ticks whenever items or photos change, so lists that read MENU or Thumb re-render.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import * as Network from 'expo-network';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { byId, fromCatalog, MENU, registerItems, type Catalog } from '@/tools/calories/data/menu';

export const FOOD_DATA = process.env.EXPO_PUBLIC_FOOD_DATA_URL?.replace(/\/$/, '') || null; // e.g. https://<app>.ufs.sh/f
export const PHOTO_MB = 180; // what every photo adds up to, for the "on mobile data" question
const PHOTO_GAP_MS = 250; // ponytail: ~4 photos a second, gentle on the host; a background task if anyone wants it faster
const dir = () => new Directory(Paths.document, 'calories');
const photosDir = () => new Directory(dir(), 'photos');
const jsonFile = () => new File(dir(), 'foods.json');
export const photoUri = (id: string) => `${photosDir().uri}/${id}.jpg`;

// On mobile data? Only then do we ask. Web and unknown count as fine.
export async function onCellular() {
  try {
    return (await Network.getNetworkStateAsync()).type === Network.NetworkStateType.CELLULAR;
  } catch {
    return false;
  }
}

type State = {
  downloaded: boolean; // the full catalog JSON is on this device
  items: number; // how many it added
  busy: boolean;
  wantPhotos: boolean; // the user asked for every photo (saved; the download resumes on launch and foreground)
  photosDone: number; // saved so far
  photosTotal: number;
  photosBusy: boolean;
  version: number;
  load: () => Promise<void>; // at launch
  download: () => Promise<void>;
  remove: () => Promise<void>;
  startPhotos: () => void;
  pausePhotos: () => void;
  resumePhotos: () => void; // on launch / foreground, if wanted
};

const local = new Set<string>(); // ids with a photo file on this device (not state: 17k entries, read by Thumb)
export const hasLocalPhoto = (id: string) => local.has(id);
const remoteWithPhoto = () => MENU.filter(m => m.url);

export const useCatalog = create<State>()(
  persist(
    (set, get) => {
      const tick = () => set(s => ({ version: s.version + 1 }));
      // Bundled copies win (same data, local photo); the rest come in with photos by URL.
      const take = (data: Catalog) => {
        const fresh = data.items.filter(i => !byId[i.id]);
        registerItems(fresh.map(i => fromCatalog(i, true)));
        set({ downloaded: true, items: fresh.length, photosTotal: remoteWithPhoto().length });
        tick();
      };
      let running = false;
      // One photo at a time, a short pause between, until done, paused or removed. Safe to call twice.
      const pump = async () => {
        if (running || !get().wantPhotos || !get().downloaded) return;
        running = true;
        set({ photosBusy: true });
        try {
          const pd = photosDir();
          if (!pd.exists) pd.create({ intermediates: true });
          let n = 0;
          for (const m of remoteWithPhoto()) {
            if (!get().wantPhotos) break;
            if (local.has(m.id)) continue;
            try {
              await File.downloadFileAsync(m.url!, new File(pd, `${m.id}.jpg`));
              local.add(m.id);
            } catch {
              // Skipped this time; it stays a URL and gets another go on the next resume.
            }
            if (++n % 10 === 0) {
              set({ photosDone: local.size });
              tick();
            }
            await new Promise(r => setTimeout(r, PHOTO_GAP_MS));
          }
          set({ photosDone: local.size });
          tick();
        } finally {
          running = false;
          set({ photosBusy: false });
        }
      };
      return {
        downloaded: false,
        items: 0,
        busy: false,
        wantPhotos: false,
        photosDone: 0,
        photosTotal: 0,
        photosBusy: false,
        version: 0,
        load: async () => {
          try {
            const f = jsonFile();
            if (!f.exists) return;
            take(JSON.parse(await f.text()));
            const pd = photosDir();
            if (pd.exists) for (const e of pd.list()) if (e instanceof File && e.name.endsWith('.jpg')) local.add(e.name.slice(0, -4));
            set({ photosDone: local.size });
            tick();
            pump();
          } catch {
            // A bad or unreadable file (or the web, which has no documents folder) just means "not downloaded".
          }
        },
        download: async () => {
          if (!FOOD_DATA) throw new Error('This build has no download address (EXPO_PUBLIC_FOOD_DATA_URL).');
          set({ busy: true });
          try {
            const r = await fetch(`${FOOD_DATA}/foods.json`);
            if (!r.ok) throw new Error(`Download failed (${r.status})`);
            const text = await r.text();
            take(JSON.parse(text));
            try {
              const d = dir();
              if (!d.exists) d.create({ intermediates: true });
              const f = jsonFile();
              if (f.exists) f.delete();
              f.write(text);
            } catch {
              // ponytail: no file system on the web, so there it lasts the session. IndexedDB if anyone cares.
            }
          } finally {
            set({ busy: false });
          }
        },
        remove: async () => {
          set({ wantPhotos: false });
          try {
            if (jsonFile().exists) jsonFile().delete();
            if (photosDir().exists) photosDir().delete();
          } catch {}
          local.clear();
          set({ downloaded: false, items: 0, photosDone: 0, photosTotal: 0 }); // registered items stay until relaunch; harmless
          tick();
        },
        startPhotos: () => {
          set({ wantPhotos: true });
          pump();
        },
        pausePhotos: () => set({ wantPhotos: false }),
        resumePhotos: () => pump(),
      };
    },
    { name: 'calorie-catalog', storage: createJSONStorage(() => AsyncStorage), partialize: s => ({ wantPhotos: s.wantPhotos }) },
  ),
);
