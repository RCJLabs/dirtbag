// Phase 18.4: the comp ladder, as data. Five rungs from a league night at Send City to the
// Games, each on its own days at its own wall, with a fixed field of the grades it draws, an
// entry fee and a purse, the points it's worth and the points it takes to be let in.
// Opt-in: nothing happens unless you sign up at the desk on the day. Every number here is
// [proposed]; the field doesn't move with you (v0.956's comps rubber-banded).

import type { Style } from '../climber';
import { MEDIA_RIVAL } from './media';

export interface CompTier {
  name: string;
  // Where, and when: on day `on` of every `every` days.
  venue: string;
  every: number;
  on: number;
  // The grades its problems run, easiest to hardest, and its field's.
  grades: [number, number];
  field: number;
  fee: number;
  // Paid to first, second and third.
  purse: [number, number, number];
  // Points for a win (less down the field), and the points on the ladder to be let in.
  pts: number;
  need: number;
  // What the problems are called, numbered.
  problem: string;
  // Phase 25.5: off the ladder (no points, never a rung), and a set of its own: how many
  // problems, all of one style, how many moves each, and the goes a top counts in.
  side?: { n: number; type: Style; moves: [number, number]; goes: number };
  // Phase 26: the grades, set and field, rise `by` a year for the first `years` years, as
  // word of it gets round.
  grows?: { by: number; years: number };
  // Phase 26: League night's A league. The same nights as League night, for whoever has won
  // a season: never a comp on a day of its own, never a rung.
  division?: 'A';
  // Phase 33.1 (Evan's call, 14 Oct 2026: small finals): rounds on the days after the first,
  // and how many go through from each to the next. A qualifier and a final; the World Series
  // has a semi-final between. Without it, a comp is the one round on its one day.
  rounds?: number[];
  // Phase 33.4 (Evan's call, 14 Oct 2026): picked, not let in by points. A podium (the top
  // `top`) at rung `from`'s last edition makes the team, till its next.
  team?: { from: number; top: number };
}

export const COMP_TIERS: CompTier[] = [
  {
    name: 'League night',
    venue: 'gym',
    every: 7,
    on: 4,
    grades: [0, 5],
    field: 10,
    fee: 10,
    purse: [40, 25, 15],
    pts: 10,
    need: 0,
    problem: 'League',
  },
  {
    name: 'The Circuit',
    venue: 'cave',
    every: 14,
    on: 10,
    grades: [4, 10],
    field: 12,
    fee: 25,
    purse: [150, 90, 50],
    pts: 25,
    need: 20,
    problem: 'Circuit',
  },
  {
    name: 'Nationals',
    venue: 'center',
    every: 28,
    // Phase 33.4: a week before the World Series, which it picks the team for; clear of
    // League nights, the Circuit and the Games.
    on: 8,
    grades: [7, 13],
    field: 16,
    fee: 40,
    purse: [400, 240, 120],
    pts: 60,
    need: 60,
    problem: 'Nationals',
    rounds: [6],
  },
  {
    name: 'The World Series',
    venue: 'center',
    every: 28,
    on: 15,
    grades: [10, 15],
    field: 20,
    fee: 60,
    purse: [1000, 600, 300],
    pts: 120,
    need: 0,
    problem: 'World Series',
    rounds: [12, 6],
    team: { from: 2, top: 3 },
  },
  {
    name: 'The Games',
    venue: 'center',
    every: 56,
    on: 50,
    grades: [12, 17],
    field: 20,
    fee: 0,
    purse: [3000, 1800, 1000],
    pts: 200,
    need: 200,
    problem: 'Games',
    rounds: [8],
  },
  // Phase 25.5 (Evan's call, 4 Oct 2026): v0.956's Fall Festival dyno comp, once a year at
  // Send City in the fall, off the ladder. Five dynos, each further than the last, climbed
  // like any comp problem; v0.956 rolled dice for it.
  {
    name: 'The Fall Festival dyno comp',
    venue: 'gym',
    every: 56,
    on: 13,
    grades: [2, 10],
    field: 12,
    fee: 15,
    purse: [300, 150, 75],
    pts: 0,
    need: 0,
    problem: 'Dyno',
    side: { n: 5, type: 'dyno', moves: [3, 4], goes: 3 },
    // Phase 26: a V10 won it every year; three years on, the throws and the field run V5 to V13.
    grows: { by: 1, years: 3 },
  },
  // Phase 26 (Evan's call, 8 Oct 2026): a season won moves you up for good. League night's
  // same nights, harder problems, a field that's been at it longer.
  {
    name: 'The A league',
    venue: 'gym',
    every: 7,
    on: 4,
    grades: [3, 8],
    field: 10,
    fee: 15,
    purse: [80, 50, 30],
    pts: 15,
    need: 0,
    problem: 'A league',
    division: 'A',
  },
];

// The rungs of the ladder, by index: every comp but the side ones and the A league.
export const COMP_LADDER = COMP_TIERS.flatMap((t, i) => (t.side || t.division ? [] : [i]));
// The Games, the ladder's top.
export const GAMES_TIER = COMP_LADDER[COMP_LADDER.length - 1]!;
// The dyno comp.
export const DYNO_COMP = COMP_TIERS.findIndex((t) => t.side?.type === 'dyno');
// League night's A league.
export const A_LEAGUE = COMP_TIERS.findIndex((t) => t.division === 'A');

// Who you're up against: a pool of names the fields are drawn from.
export const COMPETITORS = [
  'Juno Vale',
  'Theo Marsh',
  'Ada Kowal',
  'Ren Ito',
  'Mika Sands',
  'Oskar Brandt',
  'Lena Fischer',
  'Cruz Medina',
  'Hana Mori',
  'Felix Durand',
  'Zara Quinn',
  'Iker Soto',
  'Nell Archer',
  'Bo Lindqvist',
  'Sasha Petrov',
  'Wim de Groot',
  'Talia Ross',
  'Emeka Obi',
  'Yuki Tanaka',
  'Mateo Ruiz',
  'Isla Grant',
  'Pavel Novak',
  'Dara Kelly',
  'Ana Silva',
];

// Phase 33.3 (Evan's call, 14 Oct 2026: a roster per tier): the field that comes back. Each
// rung from the Circuit up has its named rivals, each with a grade in the career's first
// year and a trend a year (rising, steady, fading) for the first few years (dials: RIVALS),
// wobbled a little each year by the seed.
// A rival whose grade gets past the top of their rung (dials: RIVALS.up) goes up a rung for
// good, and out of the one below. Skye is on the
// World Series' roster and comes back for Nationals too. The rest of a field is fillers from
// the pool, never named. Every grade here is [proposed]; each rung's favourites sit at or
// just over its top grade.
export interface Rival {
  name: string;
  // The rung they climb in, in the first year, and any they enter as well.
  tier: number;
  also?: number[];
  grade: number;
  trend: number;
}

export const ROSTER: Rival[] = [
  // The Circuit: V4 to V10.
  { name: 'Priya Raman', tier: 1, grade: 10.3, trend: 0 },
  { name: 'Gus Ferrante', tier: 1, grade: 9.6, trend: -0.2 },
  { name: 'Nico Hale', tier: 1, grade: 9.2, trend: 0.8 },
  { name: 'Lotte Brink', tier: 1, grade: 8, trend: 0 },
  { name: 'Kai Mendez', tier: 1, grade: 6.5, trend: 1 },
  // Nationals: V7 to V13.
  { name: 'Ines Duarte', tier: 2, grade: 13.2, trend: 0 },
  { name: 'Callum Reyes', tier: 2, grade: 12.6, trend: -0.3 },
  { name: 'Mae Okafor', tier: 2, grade: 12, trend: 0.8 },
  { name: 'Rory Kerr', tier: 2, grade: 11, trend: 0.4 },
  { name: 'Tobias Lund', tier: 2, grade: 10, trend: 0 },
  { name: 'June Park', tier: 2, grade: 8.8, trend: 0.3 },
  // The World Series: V10 to V15.
  { name: MEDIA_RIVAL.name, tier: 3, also: [2], grade: 14.6, trend: 0.1 },
  { name: 'Elio Varga', tier: 3, grade: 15.2, trend: 0 },
  { name: 'Noor Haddad', tier: 3, grade: 14, trend: -0.1 },
  { name: 'Signe Holm', tier: 3, grade: 13.4, trend: 0.3 },
  { name: 'Arjun Mehta', tier: 3, grade: 13.5, trend: 0.6 },
  { name: 'Luca Bellini', tier: 3, grade: 12, trend: -0.3 },
  // The Games: V12 to V17.
  { name: 'Akira Sato', tier: 4, grade: 17.2, trend: 0 },
  { name: 'Freya Lind', tier: 4, grade: 16.5, trend: 0.1 },
  { name: 'Dmitri Volkov', tier: 4, grade: 16, trend: -0.3 },
  { name: 'Clara Moreau', tier: 4, grade: 15, trend: 0.2 },
  { name: 'Owen Byrne', tier: 4, grade: 14, trend: 0 },
];

// Phase 33.4: the national team, said. {name} is the comp it's for, {from} the one that picks it.
export const TEAM_SAYS = {
  blocked: '{name} is for the national team, and a podium at {from} is what makes it',
  pick: 'The podium makes the team for {name}.',
  made: 'That podium puts you on the national team: {name}, {when}.',
  dropped: 'Off the podium, and off the team. {name} goes on without you.',
  ladder: '{name}, for the national team: a podium at {from} makes it.',
};

// Phase 33.3: the field, said. Only rivals are named; a filler who wins is a stranger.
export const FIELD_SAYS = {
  favourites: 'The favourites: {names}.',
  up: 'Up from {from} this year: {names}.',
  won: '{name} won it.',
  stranger: 'Somebody nobody had on their sheet won it.',
  second: '{name} was second.',
  ahead: '{name} finished one place ahead of you.',
};

// Said of how you placed, from the top down.
export const COMP_SAYS = {
  win: 'You top the last one with the clock running down, and the room goes up with you.',
  podium: 'On the podium, a step down from the top. You can see the top step from here.',
  mid: 'Mid-field: some tops, some falls you’ll be thinking about all week.',
  low: 'A rough one. The problems were harder than your nerves, and everyone saw.',
};

// Phase 33.1: a comp's rounds, by how many it has.
export const ROUND_NAMES: Record<number, string[]> = {
  2: ['qualifier', 'final'],
  3: ['qualifier', 'semi-final', 'final'],
};

// Said when you go through to the next round, and when you don't.
export const ROUND_SAYS = {
  through:
    'Through to the {next} tomorrow, one of {of}. Your name goes on the board in someone else’s handwriting.',
  out: 'Not through: the cut was {cut}. You watch the {next} from the mats tomorrow, if you watch it at all.',
};

// Phase 33.2: comp rules, said. The clock's minutes and the goes they buy come from the dials.
export const COMP_RULES = {
  clock: '{min} minutes on each, time for {goes} goes',
  throws: '{goes} goes at each',
  // On a comp problem's sheet: the go you're on, of the round's.
  go: 'Go {n} of {goes} on the clock.',
  // A go past the clock.
  time: 'Time’s up on this one. The judge waves you off it',
  // Beta you haven't found yet, on a comp problem: nobody's telling.
  hint: 'Isolation: nobody here will show you. A fall might.',
  ask: 'Comp rules: nobody can tell you anything on it.',
  // Asked to show you something, in your comp at its wall.
  watch: '“Not on comp day,” {name} says. “You read them yourself, same as everyone in there.”',
};

// Phase 25.5: League night's season, the year's table settled on its last night.
export const LEAGUE_SAYS = {
  won: 'League night’s season is yours: top of the table on the whiteboard by the desk, in somebody’s good marker. They hand you an envelope and a T-shirt in the wrong size. Next year you’re in the A league.',
  wonA: 'The A league’s season is yours. The whiteboard gets a fresh marker for it, and the setters start asking what you want on the wall.',
  podium: '{league}’s season ends with you {place} on the table. Close enough to see the top from here.',
  rest: '{league}’s season ends with you {place} of {of} on the table. Next year’s field is already talking.',
};
