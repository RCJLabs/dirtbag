// The next generation (Phase 16.5): the kid you coached climbs on after you, in the same world,
// the morning after you hang it up. What carries is the van and what you owned, the trips you
// paid for, the dog, how you climbed (a rope or none), the Record Book as the family's, and
// your first ascents, on the topos under your name. Everything else is theirs to earn.

import { PEOPLE } from './content/people';
import { PLACES } from './content/places';
import { routeById } from './content/gym';
import { HOME, DAY } from './dials';
import { fill } from './format';
import { tierOf } from './presence';
import type { GameEvent, GameState } from './types';
import { yearsDone } from './year';

// Who put a line up, by name: a person, a forebear ("kin:Robin"), or whoever's named.
export function byName(by: string): string {
  if (by.startsWith('kin:')) return by.slice(4);
  return PEOPLE[by]?.full ?? PEOPLE[by]?.name ?? by;
}

// The line your forebear put up that's easiest to get to: the crag you can reach soonest,
// then the easiest line there.
export function kinLine(s: GameState): { id: string; name: string; grade: number; place: string } | null {
  const f = s.family;
  if (!f) return null;
  const lines = f.lines
    .map((id) => ({ id, r: routeById(s.seed, id), fa: s.firsts[id] }))
    .filter((x) => !!x.r && !!x.fa)
    .sort(
      (a, b) =>
        (PLACES[a.r!.place]?.minGrade ?? 0) - (PLACES[b.r!.place]?.minGrade ?? 0) || a.r!.grade - b.r!.grade,
    );
  const l = lines[0];
  return l
    ? { id: l.id, name: l.fa!.name, grade: l.r!.grade, place: PLACES[l.r!.place]?.name ?? 'the crag' }
    : null;
}

// The words a family's story fills in: who, and their line.
export const familyWords = (s: GameState): Record<string, string> => ({
  forebear: s.family?.forebear ?? '',
  line: kinLine(s)?.name ?? 'their line',
});
export const familyFill = (s: GameState, text: string): string =>
  s.family ? fill(text, familyWords(s)) : text;

// The kid's state, from a climber who's hung it up: a new climber (made on the next screen)
// in the same world, the next morning, with what carries.
export function heirOf(
  s: GameState,
  fresh: (seed: string) => GameState,
): { state: GameState; events: GameEvent[] } | null {
  if (!s.life.retired || !s.climber.name) return null;
  const next = fresh(s.seed);
  const day = s.day + 1;
  const forebear = s.climber.name;
  const own = Object.entries(s.firsts)
    .filter(([, f]) => !f.by)
    .map(([id]) => id);
  const dex = s.people.dex;
  return {
    state: {
      ...next,
      day,
      min: DAY.wakeMin,
      // Their first ascents keep their names, now under yours as the one who put them up.
      firsts: Object.fromEntries(
        Object.entries(s.firsts).map(([id, f]) => [id, f.by ? f : { ...f, by: `kin:${forebear}` }]),
      ),
      record: { ...s.record },
      van: { ...s.van },
      dream: { ...next.dream, owned: [...s.dream.owned] },
      unlocked: [...s.unlocked],
      // The bolts you put in at the bluff stay in the rock (Phase 18.6); the gym doesn't pass
      // down with them: it's theirs to earn.
      bolted: [...s.bolted],
      dog: s.dog ? { ...s.dog } : null,
      dogs: [...s.dogs],
      mode: s.mode,
      life: { held: day - 1, told: 0, retired: null },
      year: { recapped: yearsDone(day), home: 'none' },
      family: {
        gen: (s.family?.gen ?? 1) + 1,
        forebear,
        lines: own,
        coach: !!dex && tierOf(dex.bond) >= HOME.tier,
      },
    },
    events: [{ k: 'heir', forebear }],
  };
}
