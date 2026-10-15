// Phase 18.4: the comp ladder. A comp is on a fixed day at its wall; that day the wall's set
// is the comp's problems, climbed like anything else. Sign up at the desk and your tops (in
// a few goes each) are counted against a fixed field, drawn from the seed and climbing at
// the grades it draws: tops first, then fewest goes. A place earns points, which fade, and
// points let you into the next rung up. Nothing here moves to meet you.

import {
  A_LEAGUE,
  COMP_LADDER,
  COMP_RULES,
  COMP_TIERS,
  COMPETITORS,
  FIELD_SAYS,
  ROSTER,
  ROUND_NAMES,
  TEAM_SAYS,
  type Rival,
} from './content/comps';
import { fill } from './format';
import { libraryBoulder, type RouteDef } from './content/routes';
import { COMP, LEAGUE, RIVALS, YEAR } from './dials';
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

// ---- Phase 33.1: rounds ----

// Which round of its comp a day is: 0 on the comp's own day, then one a day after it, for as
// many rounds as it has. A comp without rounds is all round 0.
export function roundOf(tier: number, day: number): number {
  const t = COMP_TIERS[tier]!;
  if (!t.rounds) return 0;
  const off = (((day - t.on) % t.every) + t.every) % t.every;
  return off <= t.rounds.length ? off : 0;
}

// The comp's first day, from any of its rounds' days.
export const startOf = (tier: number, day: number): number => day - roundOf(tier, day);

// A round's name: the qualifier, a semi-final, the final.
export function roundName(tier: number, round: number): string {
  const n = (COMP_TIERS[tier]!.rounds?.length ?? 0) + 1;
  return ROUND_NAMES[n]?.[round] ?? '';
}

const cache = new Map<string, RouteDef[]>();

// A comp's problems: as many as its wall has slots, easiest to hardest across its grades.
// Phase 33.1: a later round sets fewer, and harder: the final from the middle of its grades
// up, a semi-final from a quarter of the way.
export function compSet(seed: string, tier: number, day: number): RouteDef[] {
  const key = `${seed}#comp${tier}-${day}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const t = COMP_TIERS[tier]!;
  const side = t.side;
  const round = roundOf(tier, day);
  const of = (t.rounds?.length ?? 0) + 1;
  const n = round ? COMP.roundProblems : (side?.n ?? SLOTS[t.venue] ?? 6);
  const r = Rng.fromStream(seed, 'worldgen').derive(`comp-${tier}-${day}`);
  const [low, hi] = gradesFor(tier, startOf(tier, day));
  const lo = round ? Math.round(low + ((hi - low) * round) / (2 * (of - 1))) : low;
  const called = round ? `${t.name} ${roundName(tier, round)}` : t.name;
  const set = Array.from({ length: n }, (_, i) => {
    const grade = Math.round(lo + (i * (hi - lo)) / (n - 1));
    const type = side ? side.type : TYPES[r.int(0, TYPES.length - 1)]!;
    const moves = side ? r.int(...side.moves) : r.int(5, 9);
    const from = Math.round(moves * r.float(0.4, 0.65) * 100) / 100;
    const label = round
      ? `${t.problem} ${roundName(tier, round)[0]!.toUpperCase()}${i + 1}`
      : `${t.problem} ${i + 1}`;
    return libraryBoulder(`cp-${tier}-${day}-${i + 1}`, label, grade, type, t.venue, {
      moves,
      from,
      to: Math.round((from + r.float(1.3, 1.9)) * 100) / 100,
      cruxName: side ? 'The throw' : 'The crux',
      heightFt: 14,
      line: side
        ? `${t.name}, throw ${i + 1} of ${n}, further than the last. Tape says V${grade}.`
        : `${called}, problem ${i + 1} of ${n}. Tape says V${grade}.`,
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

// Phase 33.2: the minutes a problem's on the clock in a round: the qualifier's, or a later
// round's.
export const clockFor = (round: number): number => COMP.clock[Math.min(round, 1)]!;

// The goes you get at a problem in a round, and a top counts in any of them: what its clock
// buys (Phase 33.2), or the dyno comp's throws.
export const goesFor = (tier: number, round = 0): number =>
  COMP_TIERS[tier]!.side?.goes ?? Math.floor(clockFor(round) / COMP.perGo);

// The clock, in words: "5 minutes on each, time for 5 goes", or the dyno comp's throws.
export function compClock(tier: number, round: number): string {
  const goes = goesFor(tier, round);
  return COMP_TIERS[tier]!.side
    ? fill(COMP_RULES.throws, { goes })
    : fill(COMP_RULES.clock, { min: clockFor(round), goes });
}

// Whether you're in a round of your comp at this wall today.
export const inComp = (s: GameState): boolean =>
  !!s.comps.on && s.comps.on.day === s.day && COMP_TIERS[s.comps.on.tier]?.venue === s.at;

// Phase 33.2: the goes left on a comp problem, or null for anything else. The problem's id
// carries its comp and day, so its goes are the round's.
export function goesLeft(s: GameState, id: string): number | null {
  const m = /^cp-(\d+)-(\d+)-\d+$/.exec(id);
  if (!m || !COMP_TIERS[Number(m[1])]) return null;
  const tier = Number(m[1]);
  const budget = goesFor(tier, roundOf(tier, Number(m[2])));
  return Math.max(0, budget - (s.routes[id]?.goes ?? 0));
}

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

// ---- Phase 33.3: the rivals ----

// Whether a rung's fields have a roster: the ladder from the Circuit up.
export const rostered = (tier: number): boolean => COMP_LADDER.includes(tier) && !isLeague(tier);

// A rival's grade in a year: their own, moved by their trend while it runs, give or take the
// year's wobble.
export function rivalGrade(seed: string, v: Rival, year: number): number {
  const w = Rng.fromStream(seed, 'events')
    .derive(`rival-${v.name}-${year}`)
    .float(-RIVALS.wobble, RIVALS.wobble);
  return Math.round((v.grade + v.trend * Math.min(year, RIVALS.years) + w) * 100) / 100;
}

// The rung a rival climbs in, in a year: their own, and up one for good in any year their
// grade is past the top of the rung they were in.
export function rivalTier(seed: string, v: Rival, year: number): number {
  let tier = v.tier;
  for (let y = 0; y <= year; y++) {
    const next = COMP_LADDER[COMP_LADDER.indexOf(tier) + 1];
    if (next !== undefined && rivalGrade(seed, v, y) >= COMP_TIERS[tier]!.grades[1] + RIVALS.up) tier = next;
  }
  return tier;
}

export interface InField {
  name: string;
  grade: number;
  // The rung they came up from this year, if they did.
  up: number | null;
}

// The rivals in a rung's fields in a year, strongest first: its own, whoever's come up to it,
// and anyone who enters it as well (Skye, at Nationals).
export function rivalsIn(seed: string, tier: number, year: number): InField[] {
  if (!rostered(tier)) return [];
  return ROSTER.flatMap((v) => {
    const now = rivalTier(seed, v, year);
    if (now !== tier && !v.also?.includes(tier)) return [];
    const was = year > 0 ? rivalTier(seed, v, year - 1) : v.tier;
    return [
      { name: v.name, grade: rivalGrade(seed, v, year), up: now === tier && was !== tier ? was : null },
    ];
  }).sort((a, b) => b.grade - a.grade);
}

export const isRival = (name: string): boolean => ROSTER.some((v) => v.name === name);

// A comp's climbers: from the Circuit up, the rung's rivals that year, and fillers from the
// pool to make up the numbers; any other comp's, all from the pool.
function entrants(seed: string, tier: number, day: number, r: Rng): { name: string; grade: number }[] {
  const t = COMP_TIERS[tier]!;
  const named = rivalsIn(seed, tier, yearOf(day))
    .slice(0, t.field - 1)
    .map(({ name, grade }) => ({ name, grade }));
  const rest = draw(r, t.field - named.length, gradesFor(tier, day), (name, grade) => ({ name, grade }));
  return [...named, ...rest];
}

// What the field's line says when you're done (Phase 33.3), from the last round's field and
// your place in it: who won (only a rival by name), or who was second when you won; and the
// rival one place ahead of you, if that's someone else. Out before the final, only that.
export function fieldSays(field: Score[], place: number, last: boolean): string {
  const ranked = field
    .map((f, i) => ({ ...f, i }))
    .sort((a, b) => b.tops - a.tops || a.goes - b.goes || a.i - b.i);
  const said: string[] = [];
  const top = ranked[0];
  if (last && top && place === 1 && isRival(top.name)) said.push(fill(FIELD_SAYS.second, { name: top.name }));
  if (last && top && place > 1)
    said.push(isRival(top.name) ? fill(FIELD_SAYS.won, { name: top.name }) : FIELD_SAYS.stranger);
  const near = place > 1 ? ranked[place - 2] : undefined;
  if (near && (near !== top || !last) && isRival(near.name))
    said.push(fill(FIELD_SAYS.ahead, { name: near.name }));
  return said.join(' ');
}

// One entrant's tops at a set, from the grade they climb, problem by problem. Phase 33.3:
// rolled a go at a time, each go's chance the one that tops it in the round's goes as often
// as before, so whoever's well over a problem tops it in a go or two, and someone at their
// limit gets it late if at all. (A top's goes were drawn evenly from 1 to the clock's, so a
// favourite topped as slowly as anyone and lost on goes to a flash.)
function rollTops(r: Rng, grade: number, set: RouteDef[], goes: number): Score {
  let tops = 0;
  let n = 0;
  for (const p of set) {
    const chance = 1 / (1 + Math.exp(-COMP.steep * (grade - p.grade + 0.5)));
    const go = 1 - (1 - chance) ** (1 / goes);
    for (let g = 1; g <= goes; g++)
      if (r.next() < go) {
        tops++;
        n += g;
        break;
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
  const goes = goesFor(tier, 0);
  if (t.rounds) return roundField(seed, tier, day);
  if (!isLeague(tier)) {
    const r = Rng.fromStream(seed, 'events').derive(`field-${tier}-${day}`);
    return entrants(seed, tier, day, r).map((e) => ({ ...rollTops(r, e.grade, set, goes), name: e.name }));
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

// Phase 33.1: a comp with rounds draws its field once, on its first day; each round rolls
// the tops of whoever's still in it. The field in a round you're in: the qualifier's whole
// field, then those ranked through each cut but the place you took (so it's the field you
// meet, whichever place you went through in).
export function roundField(seed: string, tier: number, day: number): Score[] {
  const t = COMP_TIERS[tier]!;
  const start = startOf(tier, day);
  const round = roundOf(tier, day);
  let left = entrants(seed, tier, start, Rng.fromStream(seed, 'events').derive(`field-${tier}-${start}`));
  const roll = (k: number) => {
    const r = Rng.fromStream(seed, 'events').derive(`round-${tier}-${start}-${k}`);
    const set = compSet(seed, tier, start + k);
    return left.map((e) => ({
      ...rollTops(r, e.grade, set, goesFor(tier, k)),
      name: e.name,
      grade: e.grade,
    }));
  };
  for (let k = 0; k < round; k++)
    left = roll(k)
      .map((x, i) => ({ ...x, i }))
      .sort((a, b) => b.tops - a.tops || a.goes - b.goes || a.i - b.i)
      .slice(0, t.rounds![k]! - 1)
      .map(({ name, grade }) => ({ name, grade }));
  return roll(round).map(({ name, tops, goes }) => ({ name, tops, goes }));
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

// The highest rung your points let you into: not one that picks its team (Phase 33.4).
export const rungOpen = (s: GameState): number =>
  COMP_LADDER.reduce(
    (top, i) => (!COMP_TIERS[i]!.team && ladderPoints(s) >= COMP_TIERS[i]!.need ? i : top),
    0,
  );

// ---- Phase 33.4: the national team ----

// A comp's last edition to have started on or before a day, or null before its first.
export function lastEdition(tier: number, day: number): number | null {
  const t = COMP_TIERS[tier]!;
  const d = day - ((((day - t.on) % t.every) + t.every) % t.every);
  return d >= 1 ? d : null;
}

// Whether you're on the team for a comp that picks one, on a day: a podium at the last
// edition of the comp that picks it, held before that day. Any other comp, you're in.
export function onTeam(s: GameState, tier: number, day = s.day): boolean {
  const team = COMP_TIERS[tier]!.team;
  if (!team) return true;
  const last = lastEdition(team.from, day - 1);
  if (last === null) return false;
  const end = last + (COMP_TIERS[team.from]!.rounds?.length ?? 0);
  return s.comps.results.some(
    (r) => r.tier === team.from && r.place <= team.top && r.day >= last && r.day <= end,
  );
}

// The comps a rung picks the team for.
export const picksFor = (tier: number): number[] =>
  COMP_TIERS.flatMap((t, i) => (t.team?.from === tier ? [i] : []));

// A comp's next first day after a day.
export function nextEdition(tier: number, day: number): number {
  const t = COMP_TIERS[tier]!;
  return day + 1 + ((((t.on - day - 1) % t.every) + t.every) % t.every);
}

// Why you can't sign up for today's comp here, or null when you can.
export function compBlocked(s: GameState): string | null {
  const tier = compHere(s, s.day, s.at);
  if (tier === null) return 'No comp here today';
  const t = COMP_TIERS[tier]!;
  if (s.comps.on) return 'You’re signed up already';
  if (s.comps.results.some((x) => x.day === s.day)) return 'You’ve competed today';
  if (s.min >= COMP.close) return 'Sign-up’s closed';
  if (t.team && !onTeam(s, tier))
    return fill(TEAM_SAYS.blocked, { name: t.name, from: COMP_TIERS[t.team.from]!.name });
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
