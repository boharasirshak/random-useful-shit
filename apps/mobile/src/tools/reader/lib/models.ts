// Voices the Reader can use: the phone's own, or a neural model downloaded on request (never bundled in the app).

export type ModelId = 'kitten-nano-en-v0_2-fp16' | 'kokoro-int8-multi-lang-v1_1';

export type Model = {
  id: ModelId; // sherpa-onnx release asset name, which the download manager resolves to a URL
  name: string;
  blurb: string;
  downloadMb: number; // what gets fetched
  diskMb: number; // after unpacking
  license: string;
  type: 'kitten' | 'kokoro';
  speakers: number;
};

export const MODELS: Model[] = [
  { id: 'kitten-nano-en-v0_2-fp16', name: 'Kitten', blurb: 'Small and quick. English, 8 voices.', downloadMb: 27, diskMb: 42, license: 'Apache 2.0', type: 'kitten', speakers: 8 },
  { id: 'kokoro-int8-multi-lang-v1_1', name: 'Kokoro', blurb: 'The natural one. English and Chinese, 100+ voices.', downloadMb: 147, diskMb: 215, license: 'Apache 2.0', type: 'kokoro', speakers: 103 },
];

export const modelById = (id: ModelId) => MODELS.find(m => m.id === id)!;

// Which voice reads: a system voice (no id = the phone's default) or a speaker of a downloaded model.
export type Voice = { kind: 'system'; id?: string } | { kind: 'model'; id: ModelId; sid: number };

export const DEFAULT_VOICE: Voice = { kind: 'system' };

// Cache folder name for audio rendered with this voice.
export const voiceKey = (v: Voice) => (v.kind === 'system' ? `system-${v.id ?? 'default'}` : `${v.id}-${v.sid}`).replace(/[^\w.-]/g, '_');

export const RATES = [0.8, 1, 1.25, 1.5, 1.75, 2] as const;
