// The demo's story past the first season: none (Phase 14.5b). Its twin, story.full.ts, is the
// full game's. The Line's scene keeps its shape, with nothing in it, for the screens that
// would show it.
import type { Act } from './story';

export const LATER_ACTS: Act[] = [];

export const LATER_PAID: string[] = [];

const blank = { label: '', note: '' };
export const LINE_SCENE: typeof import('./story.full').LINE_SCENE = {
  naming: { title: '', text: '' },
  there: { title: '', alone: '', dog: '' },
  credits: { title: '', sub: '' },
  choice: { title: '', text: '', retire: blank, keep: blank },
};
