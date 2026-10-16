// The demo's Hollow: nothing to find (Phase 14.5b). Its twin, hollow.full.ts, is the full
// game's. Each piece keeps its shape, with nothing in it, for the rules that ask after it; the
// quest never comes due in the demo.
import type * as Full from './hollow.full';

const node = { calls: true as const, text: '', opts: [] };
export const OLD_WORD: typeof Full.OLD_WORD = { ray: node, frank: node };
export const HITCH_ASK: typeof Full.HITCH_ASK = { label: '', out: '' };
export const BOOK_ROW: typeof Full.BOOK_ROW = { label: '', note: '', says: '' };
export const CLUE_NAME: typeof Full.CLUE_NAME = { old: '', hitch: '', book: '' };
export const WALK_ROW: typeof Full.WALK_ROW = { label: '', note: '' };
export const WALK_READY = '';
export const FOUND = '';
export const NOT_FOUND = '';
export const GEAR_CLEANED = '';
export const HOLLOW_STANCE: typeof Full.HOLLOW_STANCE = {
  after: 0,
  crack: true,
  title: '',
  sit: '',
  opts: [],
  elder: { label: '', stance: '', out: '', fx: {} },
};
const blank = { clean: '', rough: '', bad: '' };
export const HOLLOW_EPIC: typeof Full.HOLLOW_EPIC = {
  kind: 'hollow',
  title: '',
  open: '',
  stages: [],
  ends: blank,
  story: blank,
};
export const HOLLOW_RECORD: typeof Full.HOLLOW_RECORD = [];
