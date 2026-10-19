// The demo's crag day: none (Phase 20.3). Moonstone is past the demo, so the day never comes
// round in it; each piece keeps its twin's shape, festival.full.ts, with nothing in it.
import type * as Full from './festival.full';

const way = { label: '', out: '' };
export const FESTIVAL_SAYS: typeof Full.FESTIVAL_SAYS = {
  name: '',
  morning: '',
  notYet: '',
  rained: '',
  washed: '',
  week: '',
  scene: '',
  trail: way,
  scramble: { ...way, note: '' },
  climb: { ...way, note: '' },
  oldHand: '',
  late: '',
  hand: '',
  handNote: '',
  notYetOn: '',
  scrambled: '',
  won: '',
  podium: '',
  mid: '',
  low: '',
  shoes: '',
  shoesPaid: '',
  wonBy: '',
  dexAhead: '',
  dexBehind: '',
  fire: { trail: '', scramble: '', climb: '' },
  alone: '',
  with: {},
};
