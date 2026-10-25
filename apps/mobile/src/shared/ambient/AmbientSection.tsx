import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { DATA_URL } from '@/shared/data';
import { Chips } from '@/ui/Chips';
import { confirm, notify } from '@/ui/confirm';
import { Row } from '@/ui/Row';
import { Section } from '@/ui/Section';
import { space, useColors } from '@/ui/theme';
import { NOISES, useAmbient, VOLUMES, type Sound, type Track } from './store';

const KIND = { lofi: 'Lofi', ambient: 'Ambient', nature: 'Nature' };
// Music we can't ship (it's copyrighted) but you may already pay for: open a search for it in the app you use.
type Service = 'ytmusic' | 'apple' | 'spotify' | 'youtube';
const SERVICES: [Service, string][] = [['ytmusic', 'YouTube Music'], ['apple', 'Apple Music'], ['spotify', 'Spotify'], ['youtube', 'YouTube']];
const ALBUMS: [string, string][] = [['Minecraft Volume Alpha', 'C418 Minecraft Volume Alpha'], ['Minecraft Volume Beta', 'C418 Minecraft Volume Beta'], ['Lofi beats', 'lofi hip hop beats to relax study']];
const searchUrl = (s: Service, q: string) => {
  const e = encodeURIComponent(q);
  return s === 'ytmusic' ? `https://music.youtube.com/search?q=${e}` : s === 'apple' ? `https://music.apple.com/us/search?term=${e}` : s === 'spotify' ? `https://open.spotify.com/search/${e}` : `https://www.youtube.com/results?search_query=${e}`;
};

// Settings for the ambient sound: noise or your own file, the free tracks you can download, how loud, and the
// "open it in your music app" shortcuts for albums we can't ship.
export function AmbientSection() {
  const c = useColors();
  const { sound, volume, mineName, tracks, have, busy, set, setVolume, pickMine, loadTracks, download, removeTrack, stop } = useAmbient();
  const [service, setService] = useState<Service>('ytmusic');
  useEffect(() => { loadTracks(); }, [loadTracks]);

  const pick = async () => {
    try {
      await pickMine();
    } catch (e) {
      notify('Could not use that file', e instanceof Error ? e.message : String(e));
    }
  };
  const choose = (s: Sound) => (s === 'mine' && !mineName ? pick() : set(s));
  const tap = async (t: Track) => {
    const id: Sound = `track:${t.id}`;
    if (have.includes(t.id)) return set(sound === id ? 'off' : id);
    if (!(await confirm(`Download ${t.title}?`, `${t.mb} MB, by ${t.artist} (${t.licence}).`, 'Download'))) return;
    try {
      await download(t);
    } catch (e) {
      notify('Download failed', e instanceof Error ? e.message : String(e));
    }
  };
  const open = (q: string) => {
    stop();
    set('off');
    Linking.openURL(searchUrl(service, q)).catch(() => notify('Could not open it', 'Is that app installed?'));
  };
  const noiseValue: Sound = sound.startsWith('track:') ? 'off' : sound;

  return (
    <>
      <Section header="Ambient sound" footer="Plays on repeat, in the background too, under anything in the app. Stops while the Reader reads. My music loops one audio file from your phone.">
        <View style={{ paddingVertical: space.sm, gap: space.sm }}>
          <Chips options={NOISES} value={noiseValue} onChange={choose} />
          {sound !== 'off' && <Chips options={VOLUMES.map(([v, l]) => [String(v), l] as [string, string])} value={String(volume)} onChange={v => setVolume(Number(v))} />}
        </View>
        <Row title="My music" subtitle={mineName ?? 'Pick an audio file on this phone'} tint onPress={pick} />
      </Section>
      {DATA_URL && tracks.length > 0 && (
        <Section header="Free music" footer="Free to use, by the artists credited here. Download once, then it plays offline. Tap a downloaded track to play it, again to stop.">
          {tracks.map(t => {
            const on = sound === `track:${t.id}`;
            const got = have.includes(t.id);
            return (
              <Row key={t.id} title={t.title} subtitle={`${t.artist} · ${KIND[t.kind]} · ${Math.round(t.seconds / 60)} min · ${t.licence}`} onPress={busy ? undefined : () => tap(t)}
                right={busy === t.id ? <ActivityIndicator color={c.secondary} /> : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <Ionicons name={on ? 'stop-circle-outline' : got ? 'play-circle-outline' : 'cloud-download-outline'} size={24} color={c.tint} />
                    {got && <Ionicons name="trash-outline" size={20} color={c.tertiary} onPress={() => removeTrack(t)} accessibilityLabel={`Remove ${t.title}`} />}
                  </View>
                )} />
            );
          })}
        </Section>
      )}
      <Section header="Play elsewhere" footer="Albums we can't ship (they're copyrighted) but you may already have. Opens a search in that app; it keeps playing in the background while you use this one.">
        <View style={{ paddingVertical: space.sm }}>
          <Chips options={SERVICES} value={service} onChange={setService} />
        </View>
        {ALBUMS.map(([title, q]) => <Row key={title} title={title} tint onPress={() => open(q)} right={<Ionicons name="open-outline" size={18} color={c.tertiary} />} />)}
      </Section>
    </>
  );
}
