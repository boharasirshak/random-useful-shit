import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { downloadModel, modelDownloaded, removeModel } from '@/tools/reader/engine/model';
import { preview, stopPreview, usePreview } from '@/tools/reader/engine/preview';
import { openVoiceSettings, systemVoices, type SystemVoice } from '@/tools/reader/engine/system';
import { MODELS, voiceKey, type ModelId, type Voice } from '@/tools/reader/lib/models';
import * as player from '@/tools/reader/player';
import { useReader } from '@/tools/reader/store/app';
import { confirm, notify } from '@/ui/confirm';
import { select } from '@/ui/haptics';
import { Row } from '@/ui/Row';
import { Screen } from '@/ui/Screen';
import { Section } from '@/ui/Section';
import { Stepper } from '@/ui/Stepper';
import { type, useColors } from '@/ui/theme';

type Download = { percent: number; phase: string; abort: AbortController };

const QUALITY = { premium: 0, enhanced: 1, default: 2 };
const LABEL = { premium: 'Premium', enhanced: 'Enhanced', default: 'Default' };

// "en-GB" → "UK", "en-US" → "US", else the region name the runtime knows.
function region(tag: string) {
  const r = tag.split(/[-_]/)[1];
  if (!r) return '';
  if (r === 'GB') return 'UK';
  try { return new Intl.DisplayNames(undefined, { type: 'region' }).of(r) ?? r; } catch { return r; }
}

const SHOW = 2; // English voices listed before "More…"

// Voice settings: the phone's voices by language, and downloadable models.
export function Voices() {
  const c = useColors();
  const voice = useReader(s => s.voice);
  const setVoice = useReader(s => s.setVoice);
  const [voices, setVoices] = useState<SystemVoice[]>([]);
  const [more, setMore] = useState(false);
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [downloads, setDownloads] = useState<Partial<Record<ModelId, Download>>>({});
  const previewing = usePreview();

  useEffect(() => {
    systemVoices().then(setVoices).catch(() => {});
    MODELS.forEach(m => modelDownloaded(m.id).then(ok => setReady(r => ({ ...r, [m.id]: ok }))).catch(() => {}));
    return stopPreview;
  }, []);

  const choose = (v: Voice) => { select(); setVoice(v); player.setVoice(v); };
  const hear = (v: Voice) => preview(v).catch(e => notify('Could not play this voice', (e as Error).message));

  // Row accessory: play/stop for a preview, and a checkmark on the chosen voice.
  const right = (on: boolean, v: Voice) => {
    const k = voiceKey(v);
    const mine = previewing.key === k;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {mine && previewing.state === 'loading'
          ? <ActivityIndicator color={c.tint} />
          : <Pressable onPress={() => (mine ? stopPreview() : hear(v))} hitSlop={10} accessibilityLabel={mine ? 'Stop' : 'Hear this voice'} accessibilityRole="button">
              <Ionicons name={mine ? 'stop-circle-outline' : 'play-circle-outline'} size={26} color={c.tint} />
            </Pressable>}
        {on ? <Ionicons name="checkmark" size={22} color={c.tint} /> : <View style={{ width: 22 }} />}
      </View>
    );
  };

  // English system voices, best quality first; a couple shown, the rest behind "More…".
  const english = voices.filter(v => v.installed && v.language.toLowerCase().startsWith('en'))
    .sort((a, b) => QUALITY[a.quality] - QUALITY[b.quality] || a.name.localeCompare(b.name));
  const shown = more ? english : english.slice(0, SHOW);

  const download = async (id: ModelId) => {
    const m = MODELS.find(x => x.id === id)!;
    if (!(await confirm(`Download ${m.name}?`, `${m.downloadMb} MB download, ${m.diskMb} MB on the phone.`, 'Download'))) return;
    const abort = new AbortController();
    setDownloads(d => ({ ...d, [id]: { percent: 0, phase: 'downloading', abort } }));
    try {
      await downloadModel(id, p => setDownloads(d => ({ ...d, [id]: { percent: p.percent, phase: p.phase, abort } })), abort.signal);
      setReady(r => ({ ...r, [id]: true }));
      choose({ kind: 'model', id, sid: 0 });
    } catch (e) {
      if (!abort.signal.aborted) notify('Download failed', (e as Error).message);
    } finally {
      setDownloads(d => { const { [id]: _, ...rest } = d; return rest; });
    }
  };
  const remove = async (id: ModelId) => {
    const m = MODELS.find(x => x.id === id)!;
    if (!(await confirm(`Delete ${m.name}?`, `Frees ${m.diskMb} MB.`, 'Delete'))) return;
    await removeModel(id);
    setReady(r => ({ ...r, [id]: false }));
    if (voice.kind === 'model' && voice.id === id) choose({ kind: 'system' });
  };

  return (
    <Screen title="Voices" sheet accessory={
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/reader'))} hitSlop={10} accessibilityRole="button">
        <Text style={[type.headline, { color: c.tint }]}>Done</Text>
      </Pressable>
    }>
      <Section header="Downloaded">
        {MODELS.map(m => {
          const d = downloads[m.id];
          const on = voice.kind === 'model' && voice.id === m.id;
          const sid = on && voice.kind === 'model' ? voice.sid : 0;
          return (
            <View key={m.id}>
              <Row
                title={m.name}
                subtitle={d ? `${d.phase === 'downloading' ? 'Downloading' : 'Unpacking'}… ${Math.round(d.percent)}%` : ready[m.id] ? `${m.speakers} speakers` : `${m.downloadMb} MB`}
                onPress={d ? () => d.abort.abort() : ready[m.id] ? () => choose({ kind: 'model', id: m.id, sid }) : () => download(m.id)}
                right={d ? <Text style={[type.subhead, { color: c.tint }]}>Cancel</Text> : ready[m.id]
                  ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      {right(on, { kind: 'model', id: m.id, sid })}
                      <Pressable onPress={() => remove(m.id)} hitSlop={10} accessibilityLabel={`Delete ${m.name}`} accessibilityRole="button">
                        <Ionicons name="trash-outline" size={20} color={c.tertiary} />
                      </Pressable>
                    </View>
                  : <Ionicons name="cloud-download-outline" size={24} color={c.tint} />}
              />
              {on && voice.kind === 'model' && (
                <Row title="Speaker" right={<Stepper value={voice.sid + 1} onStep={by => choose({ kind: 'model', id: m.id, sid: (voice.sid + by + m.speakers) % m.speakers })} />} />
              )}
            </View>
          );
        })}
      </Section>
      <Section header="Phone">
        <Row title="Default voice" onPress={() => choose({ kind: 'system' })} right={right(voice.kind === 'system' && !voice.id, { kind: 'system' })} />
        {shown.map(v => (
          <Row key={v.id} title={v.name} subtitle={[LABEL[v.quality], region(v.language)].filter(Boolean).join(' · ')} onPress={() => choose({ kind: 'system', id: v.id })} right={right(voice.kind === 'system' && voice.id === v.id, { kind: 'system', id: v.id })} />
        ))}
        {english.length > SHOW && <Row title={more ? 'Fewer' : `More… (${english.length - SHOW})`} tint onPress={() => setMore(m => !m)} />}
        <Row title="Get more voices…" tint onPress={async () => {
          if (!(await openVoiceSettings())) notify('Voices', Platform.OS === 'ios' ? 'Settings → Accessibility → Spoken Content → Voices' : 'Text-to-speech settings');
        }} />
      </Section>
    </Screen>
  );
}
