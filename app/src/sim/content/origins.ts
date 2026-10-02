// Where you came from (Phase 23.2) [proposed numbers]: v0.956's six origins, each a perk and
// what it costs you (Evan's call: flaws fold into origins, as the Late Bloomer's trade-off
// always was). Chosen at creation with a name and a start. `fx` is all there is to one; the
// words for it are formatted from these numbers (identity.ts), never typed into the blurb.
//   pay: every shift's pay ×    gainIn / gainOut: skill from goes indoors / outside ×
//   gainTrain: skill from sessions ×   spring: power and fingers from anything ×
//   living: the night's spot and how you live ×   premium: the insurance premium ×
//   shop: the kit and food you buy ×   bill: dollars a week, on top of the week's bills
//   cash: dollars you start with, on top of everyone's   skills: on top of your start's

import type { Skills } from '../types';

export interface OriginFx {
  pay?: number;
  gainIn?: number;
  gainOut?: number;
  gainTrain?: number;
  spring?: number;
  living?: number;
  premium?: number;
  shop?: number;
  bill?: number;
  cash?: number;
}

export interface Origin {
  name: string;
  // Who you were, said once at creation.
  blurb: string;
  // The first morning's line about it.
  open: string;
  // What the bill's for, where there is one.
  billFor?: string;
  skills: Partial<Skills>;
  fx: OriginFx;
}

export const ORIGINS: Record<string, Origin> = {
  quit: {
    name: 'Sold It All',
    blurb: 'Quit the nine-to-five, bought the van. The classic dirtbag.',
    open: 'You had the salary, the apartment, the five-year plan. You sold all of it, bought a van, and drove until the cities ran out. No regrets yet.',
    billFor: 'the storage unit with the rest of your old life in it',
    skills: { endurance: 2, head: 2 },
    fx: { pay: 1.12, cash: 150, bill: 8 },
  },
  gymrat: {
    name: 'Gym Rat',
    blurb: 'City kid raised on plastic. Strong hands, no rock sense.',
    open: 'You came up in a city gym: plastic holds, padded floors, music thumping. Strong fingers, but real stone is a different animal.',
    skills: { power: 3, fingers: 3, head: -3, endurance: -1 },
    fx: { gainIn: 1.12, gainOut: 0.9 },
  },
  desert: {
    name: 'Desert Local',
    blurb: 'Raised on sandstone at dawn. Broke, bold, and good at living on nothing.',
    open: 'You grew up climbing desert sandstone: no gym, no scene, just you and the rock before the heat came up. Money was always thin.',
    skills: { head: 4, technique: 3, power: -3 },
    fx: { living: 0.85, cash: -25 },
  },
  gymnast: {
    name: 'Ex-Gymnast',
    blurb: 'Traded the mat for the wall. Explosive, with no head for a fall.',
    open: 'Fifteen years on the mat built a motor most climbers would kill for. Now you point it at the wall, if you can learn to trust a hold you might rip off.',
    skills: { power: 5, fingers: 2, head: -5, technique: -2 },
    fx: { gainTrain: 1.2 },
  },
  late: {
    name: 'Late Bloomer',
    blurb: 'Started at thirty-two. Savings, patience, a cool head, less spring.',
    open: 'You didn’t touch rock until thirty-two. Late to the party, but you showed up with savings, patience, and no illusions about being a prodigy.',
    skills: { head: 4, technique: 3, power: -3, fingers: -2 },
    fx: { premium: 0.65, cash: 120, spring: 0.88 },
  },
  trustfund: {
    name: 'Trust-Fund Kid',
    blurb: 'Money is no object. Work is a foreign country.',
    open: 'Mom and Dad covered the gear, the coach, the gap year. You own the latest of everything and have something to prove, and the scene can smell it on you.',
    skills: { technique: 2 },
    fx: { shop: 0.7, cash: 250, pay: 0.85 },
  },
};

// A climber carried across from v0.956 (Evan's call 11): their origin says so, and does
// nothing; and one from before origins existed has none.
export const CAME_ACROSS = 'across';
export const CAME_ACROSS_NAME = 'Came Across';
