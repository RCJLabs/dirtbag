// What became of you (Phase 16.4): the epilogue, built from what the save kept. Each line
// says whether it names something this climber did (criterion 2 wants five of those), as
// against who they were.

import { PEOPLE } from './content/people';
import { routeById } from './content/gym';
import {
  BOOK_END,
  CALLING_END,
  CROWD_END,
  DOG_END,
  FA_END,
  HOME_END,
  MASTERY_END,
  ORIGIN_END,
  PATH_END,
  FAMILY_END,
  PEOPLE_END,
  NAMED_END,
  ROMANCE_END,
  QUIRK_END,
  STANCE_END,
  SUMMIT_END,
} from './content/epilogue';
import { EXPEDITIONS } from './content/expeditions';
import { PATHS, QUIRKS } from './content/paths';
import { masteryOf } from './paths';
import { PLACES } from './content/places';
import { recordById } from './content/record';
import { HOME } from './dials';
import { fill } from './format';
import { tierOf } from './presence';
import { kinLine } from './heir';
import { stanceAnswer, standingWord } from './scene';
import type { GameState } from './types';

export interface EpilogueLine {
  text: string;
  // Names something you did, not just who you were.
  did: boolean;
}

const WORDS = ['none', 'one', 'two', 'all three'];
const list = (xs: string[]) =>
  xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

export function epilogue(s: GameState): EpilogueLine[] {
  const out: EpilogueLine[] = [];
  const put = (text: string | undefined | null, did = true) => {
    if (text) out.push({ text, did });
  };

  // Who you were.
  if (s.origin) put(ORIGIN_END[s.origin], false);

  // The family you climbed on after, and their line, if you sent it.
  if (s.family) {
    put(fill(FAMILY_END.after, { forebear: s.family.forebear }), false);
    const l = kinLine(s);
    if (l && s.routes[l.id]?.sent)
      put(fill(FAMILY_END.repeat, { forebear: s.family.forebear, line: l.name }));
  }

  // Your hardest first ascent, by its name, and where.
  const fa = Object.entries(s.firsts)
    .filter(([, f]) => !f.by)
    .map(([id, f]) => ({ f, r: routeById(s.seed, id) }))
    .filter((x) => !!x.r)
    .sort((a, b) => b.r!.grade - a.r!.grade)[0];
  if (fa) put(fill(FA_END, { name: fa.f.name, place: PLACES[fa.r!.place]?.name ?? 'the crag' }));

  // The summits.
  const tops = [
    ...new Set(s.book.filter((t) => t.end === 'summit').map((t) => EXPEDITIONS[t.id]?.name ?? t.id)),
  ];
  if (tops.length) put(fill(SUMMIT_END, { mountains: list(tops) }));

  // The path you went furthest on: its title at the top, or how far you got.
  const path = Object.entries(s.paths.tiers)
    .filter(([id, n]) => n > 0 && PATHS[id])
    .sort((a, b) => b[1] - a[1])[0];
  if (path) {
    const [id, n] = path;
    const p = PATHS[id]!;
    put(
      n >= p.tiers.length
        ? fill(PATH_END.title, { title: p.title })
        : fill(PATH_END.part, { path: p.name, tier: p.tiers[n - 1]!.name }),
    );
  }

  // How you climbed, as the scene named it, and what you mastered.
  if (s.quirk && QUIRKS[s.quirk]) put(fill(QUIRK_END, { quirk: QUIRKS[s.quirk]!.name }));
  const mastered = s.mastery.map((k) => masteryOf(k)?.name).filter((x): x is string => !!x);
  if (mastered.length) put(fill(MASTERY_END, { list: list(mastered) }));

  // What you said you were climbing for, and how far it went.
  const call = s.calling.id ? CALLING_END[s.calling.id] : undefined;
  if (call) {
    const r = Math.min(3, s.calling.rungs.length);
    put(fill(call[r]!, { rungs: WORDS[r]! }), r > 0);
  }

  // The calls you made, in your own words: the first and the last.
  const made = [...s.scene.stances].sort((a, b) => a.day - b.day);
  const said = [made[0], made.length > 1 ? made[made.length - 1] : undefined]
    .map((x) => (x ? stanceAnswer(x.id, x.opt)?.stance : undefined))
    .filter((x): x is string => !!x);
  for (const stance of said) put(fill(STANCE_END, { stance }));

  // The crowds, where you ended up at either end with them.
  for (const f of ['old', 'gym'] as const) {
    const w = standingWord(s.scene[f]);
    if (w === 'Beloved') put(CROWD_END[f].high);
    if (w === 'Distrusted') put(CROWD_END[f].low);
  }

  // The people: close, or met and gone their own way.
  for (const [who, l] of Object.entries(PEOPLE_END)) {
    const p = s.people[who];
    if (!p) continue;
    if (tierOf(p.bond) >= HOME.tier) put(l.close);
    else put(l.far, false);
  }

  // The lines you named for someone (Phase 17.5).
  for (const f of Object.values(s.firsts))
    if (f.for && !f.by) put(fill(NAMED_END, { line: f.name, who: PEOPLE[f.for]?.name ?? f.for }));

  // Who you were with (Phase 17.4).
  if (s.romance) {
    const name = PEOPLE[s.romance.who]?.name ?? s.romance.who;
    put(fill(s.romance.over === undefined ? ROMANCE_END.together : ROMANCE_END.over, { name }));
  }

  // The dog: still with you, or the last one you had.
  if (s.dog) put(fill(DOG_END.with, { name: s.dog.name }));
  else if (s.dogs.length) put(fill(DOG_END.lost, { name: s.dogs[s.dogs.length - 1]!.name }));

  if (typeof s.year.home === 'number') put(HOME_END);

  // The page you'd show people: the latest earned, other than hanging it up.
  const page = Object.entries(s.record)
    .filter(([id]) => id !== 'retired')
    .sort((a, b) => b[1] - a[1])[0];
  const entry = page ? recordById(page[0]) : undefined;
  if (entry) put(fill(BOOK_END, { title: entry.title }));

  return out;
}

// How many things you did the epilogue names (criterion 2: at least five).
export const namedDeeds = (s: GameState): number => epilogue(s).filter((l) => l.did).length;
