// Phase 18.4: the comp ladder, as data. Five rungs from a league night at Send City to the
// Games, each on its own days at its own wall, with a fixed field of the grades it draws, an
// entry fee and a purse, the points it's worth and the points it takes to be let in.
// Opt-in: nothing happens unless you sign up at the desk on the day. Every number here is
// [proposed]; the field doesn't move with you (v0.956's comps rubber-banded).

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
];

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
