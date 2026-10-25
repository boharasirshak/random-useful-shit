import { ActivityIndicator } from 'react-native';
import { CATALOG_VERSION, MENU } from '@/tools/calories/data/menu';
import { FOOD_DATA, onCellular, PHOTO_MB, useCatalog } from '@/tools/calories/store/catalog';
import { confirm, notify } from '@/ui/confirm';
import { Row } from '@/ui/Row';
import { Section } from '@/ui/Section';
import { useColors } from '@/ui/theme';

const n = (x: number) => x.toLocaleString();

// The food database: what's built in, the optional download of everything else (every store product we have),
// and then, optionally, every photo so it all works offline. Both ask first when you're on mobile data.
// Nothing here goes into a backup or syncs: it can always be downloaded again.
export function FoodDataSection() {
  const c = useColors();
  const { downloaded, items, busy, wantPhotos, photosDone, photosTotal, photosBusy, version, download, remove, startPhotos, pausePhotos } = useCatalog();
  const total = MENU.length; // re-read when `version` changes
  void version;

  const okOnData = async (what: string) => !(await onCellular()) || confirm('On mobile data', `${what} Use mobile data?`, 'Download');

  async function run() {
    try {
      if (downloaded) {
        if (await confirm('Remove the full database?', 'The built-in foods stay. Logged foods keep their names.', 'Remove')) await remove();
        return;
      }
      if (!(await okOnData('The full database is about 6 MB.'))) return;
      await download();
      notify('Downloaded', `${n(useCatalog.getState().items)} more foods added.`);
    } catch (e) {
      notify('Download failed', e instanceof Error ? e.message : String(e));
    }
  }

  async function photos() {
    if (wantPhotos) return pausePhotos();
    if (!(await okOnData(`Every photo is about ${PHOTO_MB} MB, a few at a time while the app is open.`))) return;
    startPhotos();
  }

  const allPhotos = photosTotal > 0 && photosDone >= photosTotal;
  const photoSubtitle = allPhotos ? `${n(photosDone)} photos saved, works offline`
    : wantPhotos ? `${n(photosDone)} of ${n(photosTotal)} · a few a second while the app is open`
      : photosDone ? `${n(photosDone)} of ${n(photosTotal)} saved · paused` : `About ${PHOTO_MB} MB, slowly, so it all works offline`;

  return (
    <Section header="Food database" footer={`${n(total)} foods: chains, store products and home staples (build ${CATALOG_VERSION}). The full database adds every store product we have; its photos load as you scroll until you save them.`}>
      <Row title={downloaded ? 'Remove Full Database' : 'Download Full Database'} subtitle={downloaded ? `${n(items)} extra foods on this device` : FOOD_DATA ? 'About 6 MB, once' : 'Not set up in this build yet.'} tint={!busy && !!FOOD_DATA}
        onPress={busy || !FOOD_DATA ? undefined : run} right={busy ? <ActivityIndicator color={c.secondary} /> : undefined} />
      {downloaded && !allPhotos && (
        <Row title={wantPhotos ? 'Pause Photo Download' : photosDone ? 'Resume Photo Download' : 'Download All Photos'} subtitle={photoSubtitle} tint
          onPress={photos} right={photosBusy ? <ActivityIndicator color={c.secondary} /> : undefined} />
      )}
      {downloaded && allPhotos && <Row title="Photos" subtitle={photoSubtitle} />}
    </Section>
  );
}
