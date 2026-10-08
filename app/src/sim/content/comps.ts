// Phase 18.4: the comp ladder, as data. Five rungs from a league night at Send City to the
// Games, each on its own days at its own wall, with a fixed field of the grades it draws, an
// entry fee and a purse, the points it's worth and the points it takes to be let in.
// Opt-in: nothing happens unless you sign up at the desk on the day. Every number here is
// [proposed]; the field doesn't move with you (v0.956's comps rubber-banded).

import type { Style } from '../climber';

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
    on: 24,
    grades: [7, 13],
    field: 16,
    fee: 40,
    purse: [400, 240, 120],
    pts: 60,
    need: 60,
    problem: 'Nationals',
  },
  {
    name: 'The World Series',
    venue: 'center',
    every: 28,
    on: 17,
    grades: [10, 15],
    field: 20,
    fee: 60,
    purse: [1000, 600, 300],
    pts: 120,
    need: 140,
    problem: 'World Series',
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

// Said of how you placed, from the top down.
export const COMP_SAYS = {
  win: 'You top the last one with the clock running down, and the room goes up with you.',
  podium: 'On the podium, a step down from the top. You can see the top step from here.',
  final: 'Mid-field: some tops, some falls you’ll be thinking about all week.',
  low: 'A rough one. The problems were harder than your nerves, and everyone saw.',
};

// Phase 25.5: League night's season, the year's table settled on its last night.
export const LEAGUE_SAYS = {
  won: 'League night’s season is yours: top of the table on the whiteboard by the desk, in somebody’s good marker. They hand you an envelope and a T-shirt in the wrong size. Next year you’re in the A league.',
  wonA: 'The A league’s season is yours. The whiteboard gets a fresh marker for it, and the setters start asking what you want on the wall.',
  podium: '{league}’s season ends with you {place} on the table. Close enough to see the top from here.',
  rest: '{league}’s season ends with you {place} of {of} on the table. Next year’s field is already talking.',
};
