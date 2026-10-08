// Phase 18.4: the comp ladder. A comp is on a fixed day at its wall; that day the wall's set
// is the comp's problems, climbed like anything else. Sign up at the desk and your tops (in
// a few goes each) are counted against a fixed field, drawn from the seed and climbing at
// the grades it draws: tops first, then fewest goes. A place earns points, which fade, and
// points let you into the next rung up. Nothing here moves to meet you.

import { A_LEAGUE, COMP_LADDER, COMP_TIERS, COMPETITORS } from './content/comps';
import { libraryBoulder, type RouteDef } from './content/routes';
import { COMP, LEAGUE, YEAR } from './dials';
import { Rng } from './rng';
import type { Style } from './climber';
import type { GameState } from './types';

// How many problems a wall's comp has: its slots (content/gym.ts's sets, by place id; said
// here, not imported, since that file reads this one).
const SLOTS: Record<string, number> = { gym: 6, cave: 8, center: 8 };
const TYPES: Style[] = ['crimp', 'power', 'technical', 'dyno', 'technical', 'dyno'];

// Whether a comp's on a day, by its own calendar.
const onDay = (t: (typeof COMP_TIERS)[number], day: number): boolean =>
  (day - 1) % t.every === t.on - 1 && !t.division;

// The rung on at a wall that day, or null. The A league shares League night's nights: which
// of the two is yours is compHere's to say.
export function compOn(day: number, venue: string): number | null {
  const i = COMP_TIERS.findIndex((t) => t.venue === venue && onDay(t, day));
  return i < 0 ? null : i;
}

// The next comp on or after a day, at any wall: its rung and day.
export function nextComp(day: number): { tier: number; day: number } {
  for (let d = day; ; d++) {
    const i = COMP_TIERS.findIndex((t) => onDay(t, d));
    if (i >= 0) return { tier: i, day: d };
  }
}

// ---- Phase 26: the A league ----

// Whether you're in the A league in a year: you've won a season before it. Up for good
// (Evan's call), so it's read off the seasons and nothing new is kept.
export const promotedIn = (s: GameState, year: number): boolean =>
  (s.comps?.seasons ?? []).some((x) => x.place === 1 && x.year < year);

// Which league's yours in a year.
export const leagueTier = (s: GameState, year: number): number => (promotedIn(s, year) ? A_LEAGUE : 0);

// Whether a rung is one of League night's leagues.
export const isLeague = (tier: number): boolean => tier === 0 || tier === A_LEAGUE;

// The comp that's yours at a wall that day: League night is the A league once you're in it.
export function compHere(s: GameState, day: number, venue: string): number | null {
  const i = compOn(day, venue);
  return i === 0 ? leagueTier(s, yearOf(day)) : i;
}

// A rung's grades on a day: its own, raised for the years it's been growing.
export function gradesFor(tier: number, day: number): [number, number] {
  const t = COMP_TIERS[tier]!;
  const up = t.grows ? t.grows.by * Math.min(t.grows.years, yearOf(day)) : 0;
  return [t.grades[0] + up, t.grades[1] + up];
}

const cache = new Map<string, RouteDef[]>();

// A comp's problems: as many as its wall has slots, easiest to hardest across its grades.
export function compSet(seed: string, tier: number, day: number): RouteDef[] {
  const key = `${seed}#comp${tier}-${day}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const t = COMP_TIERS[tier]!;
  const side = t.side;
  const n = side?.n ?? SLOTS[t.venue] ?? 6;
  const r = Rng.fromStream(seed, 'worldgen').derive(`comp-${tier}-${day}`);
  const [lo, hi] = gradesFor(tier, day);
  const set = Array.from({ length: n }, (_, i) => {
    const grade = Math.round(lo + (i * (hi - lo)) / (n - 1));
    const type = side ? side.type : TYPES[r.int(0, TYPES.length - 1)]!;
    const moves = side ? r.int(...side.moves) : r.int(5, 9);
    const from = Math.round(moves * r.float(0.4, 0.65) * 100) / 100;
    return libraryBoulder(`cp-${tier}-${day}-${i + 1}`, `${t.problem} ${i + 1}`, grade, type, t.venue, {
      moves,
      from,
      to: Math.round((from + r.float(1.3, 1.9)) * 100) / 100,
      cruxName: side ? 'The throw' : 'The crux',
      heightFt: 14,
      line: side
        ? `${t.name}, throw ${i + 1} of ${n}, further than the last. Tape says V${grade}.`
        : `${t.name}, problem ${i + 1} of ${n}. Tape says V${grade}.`,
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

// The goes a top counts in, at a comp.
export const goesFor = (tier: number): number => COMP_TIERS[tier]!.side?.goes ?? COMP.goes;

// The year a day is in, from 0.
export const yearOf = (day: number): number => Math.floor((day - 1) / YEAR.days);

// A field drawn from the pool: a shuffle, then each name's grade, handed to `each` as it's
// drawn (so a comp's tops can be rolled there and then, as they always were).
function draw<T>(
  r: Rng,
  field: number,
  grades: [number, number],
  each: (name: string, grade: number) => T,
): T[] {
  const names = [...COMPETITORS];
  for (let i = names.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [names[i], names[j]] = [names[j]!, names[i]!];
  }
  return names.slice(0, field - 1).map((name) => {
    const grade = grades[0] - 1 + r.float(0, grades[1] - grades[0] + 1.5);
    return each(name, grade);
  });
}

// One entrant's tops at a set, from the grade they climb, problem by problem.
function rollTops(r: Rng, grade: number, set: RouteDef[], goes: number): Score {
  let tops = 0;
  let n = 0;
  for (const p of set) {
    const chance = 1 / (1 + Math.exp(-COMP.steep * (grade - p.grade + 0.5)));
    if (r.next() < chance) {
      tops++;
      n += r.int(1, goes);
    }
  }
  return { name: '', tops, goes: n };
}

// The field. League night's (Phase 25.5) is drawn once a year, so its season has the same
// faces every week, and each night rolls its own tops; the A league's (Phase 26) too, drawn
// apart from it; every other comp's is the day's.
export function compField(seed: string, tier: number, day: number): Score[] {
  const t = COMP_TIERS[tier]!;
  const set = compSet(seed, tier, day);
  const goes = goesFor(tier);
  if (!isLeague(tier)) {
    const r = Rng.fromStream(seed, 'events').derive(`field-${tier}-${day}`);
    return draw(r, t.field, gradesFor(tier, day), (name, g) => ({ ...rollTops(r, g, set, goes), name }));
  }
  const a = tier === 0 ? '' : 'a-';
  const year = draw(
    Rng.fromStream(seed, 'events').derive(`league-${a}${yearOf(day)}`),
    t.field,
    t.grades,
    (name, grade) => ({ name, grade }),
  );
  const r = Rng.fromStream(seed, 'events').derive(`night-${a}${day}`);
  return year.map((e) => ({ ...rollTops(r, e.grade, set, goes), name: e.name }));
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
  COMP_LADDER.reduce((top, i) => (ladderPoints(s) >= COMP_TIERS[i]!.need ? i : top), 0);

// Why you can't sign up for today's comp here, or null when you can.
export function compBlocked(s: GameState): string | null {
  const tier = compHere(s, s.day, s.at);
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

// ---- Phase 25.5: League night's season ----

// The year's League nights, in order.
export function leagueNights(year: number): number[] {
  const from = year * YEAR.days + 1;
  return Array.from({ length: YEAR.days }, (_, i) => from + i).filter((d) => compOn(d, 'gym') === 0);
}

// Everyone's place on one League night, in one league: the field's from their scores, yours
// from the result you brought home, if you were there (the field ranked below you a place
// further down).
export function nightPlaces(s: GameState, day: number, tier = 0): Map<string, number> {
  const mine = s.comps.results.find((x) => x.tier === tier && x.day === day);
  const ranked = compField(s.seed, tier, day)
    .map((f, i) => ({ ...f, i }))
    .sort((a, b) => b.tops - a.tops || a.goes - b.goes || a.i - b.i);
  const out = new Map<string, number>();
  ranked.forEach((f, i) => out.set(f.name, mine && i + 1 >= mine.place ? i + 2 : i + 1));
  if (mine) out.set(s.climber.name, mine.place);
  return out;
}

export interface LeagueRow {
  name: string;
  pts: number;
  nights: number;
  you: boolean;
}

// The year's table so far, in your league that year, nights up to and including `upTo`: a
// night's points are the field's size, less one a place down it, and only your best
// `LEAGUE.best` nights count. A tie goes your way.
export function leagueTable(
  s: GameState,
  year: number,
  upTo: number,
  tier = leagueTier(s, year),
): LeagueRow[] {
  const of = COMP_TIERS[tier]!.field;
  const scores = new Map<string, number[]>();
  for (const d of leagueNights(year).filter((d) => d <= upTo))
    for (const [name, place] of nightPlaces(s, d, tier))
      scores.set(name, [...(scores.get(name) ?? []), of + 1 - place]);
  return [...scores]
    .map(([name, pts]) => ({
      name,
      pts: [...pts]
        .sort((a, b) => b - a)
        .slice(0, LEAGUE.best)
        .reduce((a, b) => a + b, 0),
      nights: pts.length,
      you: name === s.climber.name,
    }))
    .sort((a, b) => b.pts - a.pts || Number(b.you) - Number(a.you) || a.name.localeCompare(b.name));
}

// Whether a day is its year's last League night, when the season's table is settled.
export const seasonEnds = (day: number): boolean => {
  const n = leagueNights(yearOf(day));
  return n[n.length - 1] === day;
};
