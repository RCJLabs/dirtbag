// Phase 18.4: the comp ladder. A comp is on a fixed day at its wall; that day the wall's set
// is the comp's problems, climbed like anything else. Sign up at the desk and your tops (in
// a few goes each) are counted against a fixed field, drawn from the seed and climbing at
// the grades it draws: tops first, then fewest goes. A place earns points, which fade, and
// points let you into the next rung up. Nothing here moves to meet you.

import { COMP_TIERS, COMPETITORS } from './content/comps';
import { libraryBoulder, type RouteDef } from './content/routes';
import { COMP } from './dials';
import { Rng } from './rng';
import type { Style } from './climber';
import type { GameState } from './types';

// How many problems a wall's comp has: its slots (content/gym.ts's sets, by place id; said
// here, not imported, since that file reads this one).
const SLOTS: Record<string, number> = { gym: 6, cave: 8, center: 8 };
const TYPES: Style[] = ['crimp', 'power', 'technical', 'dyno', 'technical', 'dyno'];

// The rung on at a wall that day, or null.
export function compOn(day: number, venue: string): number | null {
  const i = COMP_TIERS.findIndex((t) => t.venue === venue && (day - 1) % t.every === t.on - 1);
  return i < 0 ? null : i;
}

// The next comp on or after a day, at any wall: its rung and day.
export function nextComp(day: number): { tier: number; day: number } {
  for (let d = day; ; d++) {
    const i = COMP_TIERS.findIndex((t) => (d - 1) % t.every === t.on - 1);
    if (i >= 0) return { tier: i, day: d };
  }
}

const cache = new Map<string, RouteDef[]>();

// A comp's problems: as many as its wall has slots, easiest to hardest across its grades.
export function compSet(seed: string, tier: number, day: number): RouteDef[] {
  const key = `${seed}#comp${tier}-${day}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const t = COMP_TIERS[tier]!;
  const n = SLOTS[t.venue] ?? 6;
  const r = Rng.fromStream(seed, 'worldgen').derive(`comp-${tier}-${day}`);
  const [lo, hi] = t.grades;
  const set = Array.from({ length: n }, (_, i) => {
    const grade = Math.round(lo + (i * (hi - lo)) / (n - 1));
    const type = TYPES[r.int(0, TYPES.length - 1)]!;
    const moves = r.int(5, 9);
    const from = Math.round(moves * r.float(0.4, 0.65) * 100) / 100;
    return libraryBoulder(`cp-${tier}-${day}-${i + 1}`, `${t.problem} ${i + 1}`, grade, type, t.venue, {
      moves,
      from,
      to: Math.round((from + r.float(1.3, 1.9)) * 100) / 100,
      cruxName: 'The crux',
      heightFt: 14,
      line: `${t.name}, problem ${i + 1} of ${n}. Tape says V${grade}.`,
    });
  });
  cache.set(key, set);
  return set;
}

// A comp problem by id, or undefined.
export function compRoute(seed: string, id: string): RouteDef | undefined {
  const m = /^cp-(\d+)-(\d+)-(\d+)$/.exec(id);
  if (!m || !COMP_TIERS[Number(m[1])]) return undefined;
  return compSet(seed, Number(m[1]), Number(m[2]))[Number(m[3]) - 1];
}

export const isCompProblem = (id: string): boolean => id.startsWith('cp-');

export interface Score {
  name: string;
  tops: number;
  // Goes it took to top them, all told.
  goes: number;
}

// The field: names drawn from the pool, each with the grade they climb, which their tops
// come from, problem by problem.
export function compField(seed: string, tier: number, day: number): Score[] {
  const t = COMP_TIERS[tier]!;
  const r = Rng.fromStream(seed, 'events').derive(`field-${tier}-${day}`);
  const names = [...COMPETITORS];
  for (let i = names.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [names[i], names[j]] = [names[j]!, names[i]!];
  }
  const set = compSet(seed, tier, day);
  return names.slice(0, t.field - 1).map((name) => {
    const grade = t.grades[0] - 1 + r.float(0, t.grades[1] - t.grades[0] + 1.5);
    let tops = 0;
    let goes = 0;
    for (const p of set) {
      const chance = 1 / (1 + Math.exp(-COMP.steep * (grade - p.grade + 0.5)));
      if (r.next() < chance) {
        tops++;
        goes += r.int(1, COMP.goes);
      }
    }
    return { name, tops, goes };
  });
}

// Where you came: tops first, then fewest goes; a tie goes your way.
export function placing(you: Score, field: Score[]): number {
  return field.filter((f) => f.tops > you.tops || (f.tops === you.tops && f.goes < you.goes)).length + 1;
}

// What a place is worth: a win's points, less down the field.
export const pointsFor = (tier: number, place: number, of: number): number =>
  Math.round((COMP_TIERS[tier]!.pts * (of + 1 - place)) / of);

// Your points on the ladder now, each comp's fading by its age.
export const ladderPoints = (s: GameState): number =>
  Math.round(s.comps.points.reduce((a, p) => a + p.pts * 0.5 ** ((s.day - p.day) / COMP.half), 0));

// The highest rung your points let you into.
export const rungOpen = (s: GameState): number =>
  COMP_TIERS.reduce((top, t, i) => (ladderPoints(s) >= t.need ? i : top), 0);

// Why you can't sign up for today's comp here, or null when you can.
export function compBlocked(s: GameState): string | null {
  const tier = compOn(s.day, s.at);
  if (tier === null) return 'No comp here today';
  const t = COMP_TIERS[tier]!;
  if (s.comps.on) return 'You’re signed up already';
  if (s.comps.results.some((x) => x.day === s.day)) return 'You’ve competed today';
  if (s.min >= COMP.close) return 'Sign-up’s closed';
  if (ladderPoints(s) < t.need)
    return `${t.name} wants ${t.need} points on the ladder; you’ve ${ladderPoints(s)}`;
  if (s.cash < t.fee) return `The fee’s $${t.fee}`;
  return null;
}

// Your score so far today.
export const yourScore = (s: GameState): Score => {
  const tops = Object.values(s.comps.on?.tops ?? {});
  return { name: s.climber.name, tops: tops.length, goes: tops.reduce((a, b) => a + b, 0) };
};

export const podiums = (s: GameState): number => s.comps.results.filter((r) => r.place <= 3).length;
