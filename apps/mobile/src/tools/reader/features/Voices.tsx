import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { downloadModel, modelDownloaded, modelsAvailable, removeModel } from '@/tools/reader/engine/model';
import { openVoiceSettings, systemAvailable, systemVoices, type SystemVoice } from '@/tools/reader/engine/system';
import { MODELS, type ModelId, type Voice } from '@/tools/reader/lib/models';
import * as player from '@/tools/reader/player';
import { useReader } from '@/tools/reader/store/app';
import { confirm, notify } from '@/ui/confirm';
import { select } from '@/ui/haptics';
import { Row } from '@/ui/Row';
import { Screen } from '@/ui/Screen';
import { Section } from '@/ui/Section';
import { Stepper } from '@/ui/Stepper';
import { type, useColors } from '@/ui/theme';

const IOS_STEPS = 'Settings → Accessibility → Spoken Content → Voices. Pick your language and a voice, then tap Download. "Enhanced" and "Premium" voices sound far better. Come back here and pick it.';

type Download = { percent: number; phase: string; abort: AbortController };

// Voice settings: the phone's voices, and models you can download that run on the phone.
export function Voices() {
  const c = useColors();
  const voice = useReader(s => s.voice);
  const setVoice = useReader(s => s.setVoice);
  const [voices, setVoices] = useState<SystemVoice[]>([]);
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [downloads, setDownloads] = useState<Partial<Record<ModelId, Download>>>({});

  useEffect(() => {
    systemVoices().then(setVoices).catch(() => {});
    MODELS.forEach(m => modelDownloaded(m.id).then(ok => setReady(r => ({ ...r, [m.id]: ok }))).catch(() => {}));
  }, []);

  const choose = (v: Voice) => { select(); setVoice(v); player.setVoice(v); };
  const check = (on: boolean) => (on ? <Ionicons name="checkmark" size={22} color={c.tint} /> : null);
  const lang = (Intl.DateTimeFormat().resolvedOptions().locale || 'en').slice(0, 2).toLowerCase();
  const mine = voices.filter(v => v.installed && v.language.toLowerCase().startsWith(lang));
  const shown = (mine.length ? mine : voices.filter(v => v.installed)).sort((a, b) => a.name.localeCompare(b.name));

  const download = async (id: ModelId) => {
    const m = MODELS.find(x => x.id === id)!;
    const ok = await confirm(`Download ${m.name}?`,
      `This fetches ${m.downloadMb} MB from GitHub (k2-fsa/sherpa-onnx releases) and takes ${m.diskMb} MB on your phone. Wi-Fi recommended. It runs on the phone only: your text never leaves it.`, 'Download');
    if (!ok) return;
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
    if (!(await confirm(`Delete ${m.name}?`, `Frees ${m.diskMb} MB. You can download it again any time.`, 'Delete'))) return;
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
      <Section header="Phone voices" footer={systemAvailable ? 'Free, offline, already on your phone. Better ones are a download away in the system settings.' : 'Needs the iPhone or Android app.'}>
        <Row title="Default voice" subtitle="Whatever the phone uses" onPress={() => choose({ kind: 'system' })} right={check(voice.kind === 'system' && !voice.id)} />
        {shown.map(v => (
          <Row key={v.id} title={v.name} subtitle={`${v.language} · ${v.quality}`} onPress={() => choose({ kind: 'system', id: v.id })} right={check(voice.kind === 'system' && voice.id === v.id)} />
        ))}
        <Row title="Get better voices…" tint onPress={async () => {
          if (!(await openVoiceSettings())) notify('Download voices', Platform.OS === 'ios' ? IOS_STEPS : 'Open your phone\'s text-to-speech settings and install voice data.');
        }} />
      </Section>
      <Section header="Downloadable voices" footer={modelsAvailable ? 'Neural voices that run on the phone. Downloaded only when you ask; nothing is bundled in the app.' : 'Needs the iPhone or Android app.'}>
        {MODELS.map(m => {
          const d = downloads[m.id];
          const on = voice.kind === 'model' && voice.id === m.id;
          const subtitle = d ? `${d.phase === 'downloading' ? 'Downloading' : 'Unpacking'}… ${Math.round(d.percent)}%` : `${m.blurb} ${m.diskMb} MB · ${m.license}`;
          return (
            <View key={m.id}>
              <Row
                title={ready[m.id] ? m.name : `Download ${m.name} (${m.downloadMb} MB)`}
                subtitle={subtitle}
                tint={!ready[m.id] && !d}
                onPress={d ? () => d.abort.abort() : ready[m.id] ? () => choose({ kind: 'model', id: m.id, sid: 0 }) : () => download(m.id)}
                right={d ? <Text style={[type.subhead, { color: c.tint }]}>Cancel</Text> : ready[m.id]
                  ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      {check(on)}
                      <Pressable onPress={() => remove(m.id)} hitSlop={10} accessibilityLabel={`Delete ${m.name}`} accessibilityRole="button">
                        <Ionicons name="trash-outline" size={20} color={c.tertiary} />
                      </Pressable>
                    </View>
                  : null}
              />
              {on && voice.kind === 'model' && (
                <Row title="Speaker" subtitle={`1 to ${m.speakers}`} right={<Stepper value={voice.sid + 1} onStep={by => choose({ kind: 'model', id: m.id, sid: (voice.sid + by + m.speakers) % m.speakers })} />} />
              )}
            </View>
          );
        })}
      </Section>
    </Screen>
  );
}
