// What's in you (Phase 23.2): v0.956's hidden talents. Each climber is dealt one good and one
// bad at creation, on the seed, and doesn't know them: they show once a skill has come on
// enough to notice (identity.ts). `gain` multiplies everything that skill learns; `injury`,
// the risk on lines that load the fingers.

import type { Skills } from '../types';

export interface Talent {
  name: string;
  skill: keyof Skills;
  good: boolean;
  gain: number;
  injury?: number;
  // Said when it shows.
  desc: string;
}

export const TALENTS: Record<string, Talent> = {
  crimper: {
    name: 'Natural Crimper',
    skill: 'fingers',
    good: true,
    gain: 1.35,
    desc: 'Your fingers were built for small holds: finger strength comes fast.',
  },
  explosive: {
    name: 'Explosive',
    skill: 'power',
    good: true,
    gain: 1.35,
    desc: 'Fast-twitch everything: power piles on quick.',
  },
  engine: {
    name: 'Slow-Twitch Engine',
    skill: 'endurance',
    good: true,
    gain: 1.35,
    desc: 'A bottomless tank: endurance builds fast.',
  },
  quietfeet: {
    name: 'Quiet Feet',
    skill: 'technique',
    good: true,
    gain: 1.35,
    desc: 'A natural mover: technique clicks fast.',
  },
  iceveins: {
    name: 'Ice in the Veins',
    skill: 'head',
    good: true,
    gain: 1.35,
    desc: 'Unflappable: your head game grows fast.',
  },
  bomber: {
    name: 'Bomber Tendons',
    skill: 'fingers',
    good: true,
    gain: 1.1,
    injury: 0.55,
    desc: 'Cabled tendons: your fingers shrug off load.',
  },
  glass: {
    name: 'Glass Tendons',
    skill: 'fingers',
    good: false,
    gain: 0.7,
    injury: 1.7,
    desc: 'Paper pulleys: fingers come slow and tweak easy.',
  },
  nopop: {
    name: 'No Pop',
    skill: 'power',
    good: false,
    gain: 0.7,
    desc: 'Strength is a grind: power comes slow.',
  },
  noengine: {
    name: 'No Engine',
    skill: 'endurance',
    good: false,
    gain: 0.7,
    desc: 'You pump out quick: endurance comes slow.',
  },
  stiff: {
    name: 'Stiff',
    skill: 'technique',
    good: false,
    gain: 0.7,
    desc: 'Movement fights you: technique comes slow.',
  },
  skittish: {
    name: 'Skittish',
    skill: 'head',
    good: false,
    gain: 0.7,
    desc: 'Fear runs hot: head game comes slow.',
  },
};
