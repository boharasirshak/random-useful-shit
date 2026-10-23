import type { Voice } from '@/tools/reader/lib/models';
import { modelSynth } from './model';
import { systemSynth } from './system';
import type { Synth } from './types';

export const makeSynth = (v: Voice): Synth => (v.kind === 'system' ? systemSynth(v.id) : modelSynth(v.id, v.sid));
