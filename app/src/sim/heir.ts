// The next generation (Phase 16.5): the kid you coached climbs on after you, in the same world,
// the morning after you hang it up. What carries is the van and what you owned, the trips you
// paid for, the dog, how you climbed (a rope or none), and your first ascents, on the topos
// under your name. Phase 31.1: a share of the money, some of the old guard's regard, and what
// you did, kept for the family; your Record Book goes beside theirs, which starts empty.
// Everything else is theirs to earn.

import { ageOf } from './ageing';
import { EXPEDITIONS } from './content/expeditions';
import { PEOPLE } from './content/people';
import { ACTS, PLACES } from './content/places';
import { indoor, routeById } from './content/gym';
import { HOME, DAY, FACTION, FAMILY } from './dials';
import { fill } from './format';
import { tierOf } from './presence';
import type { Career, GameEvent, GameState } from './types';
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

// The most a climber leaves the kid (Phase 31.1): the café's pay for FAMILY.shifts shifts.
export const leaveCap = (): number => (ACTS['cafe.shift']?.cost.cash ?? 0) * FAMILY.shifts;

// What passes on: a share of the money, capped; a debt stays with them.
export const moneyLeft = (s: GameState): number =>
  Math.min(leaveCap(), Math.floor(FAMILY.share * Math.max(0, s.cash + s.dream.pot)));

// Where the kid starts with the old guard: some of the way to where their forebear stood.
export const oldStart = (old: number): number =>
  Math.round(FACTION.start + FAMILY.old * (old - FACTION.start));

// A climbing life, as the family keeps it (Phase 31.1): the lines sent outside (not an
// expedition's pitches, nor the gym's sets, which come down), the one tried most and never
// sent (the harder of two tried as often), and the rest from what the game kept.
export function careerOf(s: GameState): Career {
  const sent: string[] = [];
  let project: { id: string; goes: number; grade: number } | null = null;
  for (const [id, l] of Object.entries(s.routes)) {
    const r = routeById(s.seed, id);
    if (!r || r.exped || indoor(r.place)) continue;
    if (l.sent) sent.push(id);
    else if (
      l.goes > 0 &&
      (!project || l.goes > project.goes || (l.goes === project.goes && r.grade > project.grade))
    )
      project = { id, goes: l.goes, grade: r.grade };
  }
  const r = s.life.retired;
  return {
    sent,
    project: project?.id ?? null,
    age: ageOf(s, r?.day ?? s.day),
    how: r?.home ? 'home' : r?.forced ? 'body' : 'chose',
    scars: [...s.scars],
    summits: [
      ...new Set(s.book.filter((t) => t.end === 'summit').map((t) => EXPEDITIONS[t.id]?.name ?? t.id)),
    ],
    crew: s.crewName?.name ?? null,
    old: s.scene.old,
    money: moneyLeft(s),
  };
}

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
  const career = careerOf(s);
  return {
    state: {
      ...next,
      day,
      cash: next.cash + career.money,
      min: DAY.wakeMin,
      // Their first ascents keep their names, now under yours as the one who put them up.
      firsts: Object.fromEntries(
        Object.entries(s.firsts).map(([id, f]) => [id, f.by ? f : { ...f, by: `kin:${forebear}` }]),
      ),
      record: {},
      scene: { ...next.scene, old: oldStart(s.scene.old) },
      van: { ...s.van },
      dream: { ...next.dream, owned: [...s.dream.owned] },
      unlocked: [...s.unlocked],
      // The bolts you put in at the bluff stay in the rock (Phase 18.6); the gym doesn't pass
      // down with them: it's theirs to earn.
      bolted: [...s.bolted],
      // A guide in print stays in print (Phase 25.1); one half-written goes with you.
      guides: Object.fromEntries(Object.entries(s.guides).filter(([, g]) => g.out !== null)),
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
        // The kid you coached (Phase 25.3), grown: their grade, a head start for the next.
        ...(s.mentee ? { mentee: { name: s.mentee.name, grade: Math.floor(s.mentee.level) } } : {}),
        career,
        books: [...(s.family?.books ?? []), { name: forebear, record: { ...s.record } }],
      },
    },
    events: [{ k: 'heir', forebear }],
  };
}
