// Who you're becoming (Phase 23.4) [proposed numbers]: v0.956's paths, its style mastery and
// its quirks, each an edge on the same few dials. Paths are claimed, two at most; mastery
// comes on its own, from sends; a quirk is named from how you climb.
//
// An edge, all optional:
//   style + windows: crux windows on lines of these styles ×   windows alone: on every line
//   firstGo: crux windows on a line's first go ×   gym: crux windows indoors ×
//   outside: crux windows outdoors ×   train: what a session teaches ×
//   fresh / tired: crux windows with energy at or over QUIRK.fresh / under QUIRK.tired ×
//   evening / dawn: crux windows from QUIRK.evening / before QUIRK.dawn ×
//   injury: the odds of getting hurt ×   gain: one skill's learning ×   gainAll: every skill's ×
//   gas: a drive's gas ×   living: the night's spot and how you live ×
// v0.956's "+n% send odds" are crux windows here, the rebuild's odds: ×(1 + n).

import type { Style } from '../climber';
import type { Skills } from '../types';

export interface Edge {
  style?: Style[];
  windows?: number;
  firstGo?: number;
  gym?: number;
  outside?: number;
  train?: number;
  fresh?: number;
  tired?: number;
  evening?: number;
  dawn?: number;
  injury?: number;
  gain?: [keyof Skills, number];
  gainAll?: number;
  gas?: number;
  living?: number;
}

// What a tier asks besides your grade: sends of lines in some styles, lines flashed or
// onsighted, or trips out to a crag.
export type Deed = { sends: Style[]; n: number } | { first: number } | { trips: number };

export interface Tier {
  name: string;
  deed: Deed;
  edge: Edge;
}

export interface Path {
  name: string;
  blurb: string;
  tiers: Tier[];
  // The third tier's title, and the line that goes with it.
  title: string;
  line: string;
  // Out of reach until what it needs is built.
  wait?: string;
}

const POWER: Style[] = ['power', 'dyno'];

export const PATHS: Record<string, Path> = {
  power: {
    name: 'Crusher',
    blurb: 'Raw power: steep pulls, big throws.',
    tiers: [
      { name: 'Strong', deed: { sends: POWER, n: 4 }, edge: { style: POWER, windows: 1.04 } },
      { name: 'Dyno Specialist', deed: { sends: ['dyno'], n: 6 }, edge: { style: ['dyno'], windows: 1.1 } },
      {
        name: 'Powerhouse',
        deed: { sends: POWER, n: 25 },
        edge: { style: ['power'], windows: 1.06, gain: ['power', 1.15] },
      },
    ],
    title: 'The strongest hands at the crag',
    line: 'You went looking for the steepest thing in the valley and you found out you could hold it.',
  },
  fingers: {
    name: 'Tendon',
    blurb: 'Fingers of steel: crimps and small holds.',
    tiers: [
      { name: 'Crimp Master', deed: { sends: ['crimp'], n: 4 }, edge: { style: ['crimp'], windows: 1.1 } },
      { name: 'Iron Tendons', deed: { sends: ['crimp'], n: 12 }, edge: { injury: 0.55 } },
      {
        name: 'Death Grip',
        deed: { sends: ['crimp'], n: 25 },
        edge: { style: ['crimp'], windows: 1.06, gain: ['fingers', 1.15] },
      },
    ],
    title: 'Fingers like rebar',
    line: 'Everything small and sharp that used to spit you off is just a hold now.',
  },
  head: {
    name: 'Nerve',
    blurb: 'A cool head: commit, and send first try.',
    tiers: [
      { name: 'Composed', deed: { first: 3 }, edge: { firstGo: 1.03 } },
      { name: 'Bold', deed: { first: 8 }, edge: { firstGo: 1.04 } },
      { name: 'Free Spirit', deed: { first: 15 }, edge: { firstGo: 1.05 } },
    ],
    title: 'Nothing left to be afraid of',
    line: 'The runout stopped meaning anything to you somewhere along the way, and you can’t remember when.',
  },
  // New in the rebuild, for the technique v0.956's paths never had (Evan's call 6).
  style: {
    name: 'Mover',
    blurb: 'Quiet feet and a good eye: the sequence reveals itself.',
    tiers: [
      {
        name: 'Smooth',
        deed: { sends: ['technical'], n: 4 },
        edge: { style: ['technical'], windows: 1.05 },
      },
      {
        name: 'Line Reader',
        deed: { sends: ['technical', 'crack'], n: 12 },
        edge: { style: ['crack'], windows: 1.05 },
      },
      {
        name: 'Flow',
        deed: { sends: ['technical'], n: 25 },
        edge: { style: ['technical'], windows: 1.06, gain: ['technique', 1.15] },
      },
    ],
    title: 'Nobody hears you climb',
    line: 'People watch you on their project and go quiet, because you made it look like a staircase.',
  },
  dirtbag: {
    name: 'Dirtbag',
    blurb: 'A life on the road: durable, cheap, free.',
    tiers: [
      { name: 'Road Dog', deed: { trips: 6 }, edge: { gas: 0.5 } },
      { name: 'Weathered', deed: { trips: 25 }, edge: { injury: 0.8 } },
      { name: 'Ageless', deed: { trips: 60 }, edge: { injury: 0.7, gain: ['endurance', 1.1] } },
    ],
    title: 'The road is the point',
    line: 'Years of lot nights and cheap coffee, and you wouldn’t trade a single one of them back.',
  },
  scene: {
    name: 'Scene',
    blurb: 'The competitor: comps, a crowd.',
    tiers: [],
    title: 'A name people know',
    line: 'You walk into any gym in the region and somebody already knows what you climb.',
    wait: 'comps (Phase 15)',
  },
};

export const OPEN_PATHS = Object.keys(PATHS).filter((id) => !PATHS[id]!.wait);

// Mastery (Phase 23.4): v0.956's style mastery and its hybrids, one track (Evan's call). A
// style's mastered at MASTERY_AT.sends lines sent in it.
export const MASTERY: Record<Style, { name: string; edge: Edge; line: string }> = {
  crimp: {
    name: 'Crimp Lord',
    edge: { gain: ['fingers', 1.1] },
    line: 'Your fingers have seen everything.',
  },
  power: {
    name: 'Powerhouse Sender',
    edge: { gain: ['power', 1.1] },
    line: 'Big moves are just a Tuesday.',
  },
  endurance: {
    name: 'Marathon Sender',
    edge: { style: ['endurance'], windows: 1.08 },
    line: 'The pitch length stopped mattering.',
  },
  technical: {
    name: 'Technical Mastery',
    edge: { style: ['technical'], windows: 1.08 },
    line: 'The sequence reveals itself.',
  },
  dyno: { name: 'Big Air', edge: { firstGo: 1.04 }, line: 'Committing to the huck is second nature now.' },
  crack: {
    name: 'Crack Sage',
    edge: { injury: 0.85 },
    line: 'Your hands and body have learned to protect themselves.',
  },
};

// The hybrids: two skills both at MASTERY_AT.hybrid's grade, by id in the mastery list.
export const HYBRIDS: Record<string, { name: string; a: keyof Skills; b: keyof Skills; edge: Edge }> = {
  hy_compressor: { name: 'Compressor', a: 'power', b: 'fingers', edge: { style: ['crimp'], windows: 1.05 } },
  hy_dynprecision: {
    name: 'Dynamic Precision',
    a: 'power',
    b: 'technique',
    edge: { style: ['dyno'], windows: 1.05 },
  },
  hy_engine: { name: 'The Engine', a: 'power', b: 'endurance', edge: { gain: ['power', 1.12] } },
  hy_fearless: { name: 'Fearless', a: 'power', b: 'head', edge: { firstGo: 1.04 } },
  hy_precision: {
    name: 'Precision Climber',
    a: 'fingers',
    b: 'technique',
    edge: { style: ['technical'], windows: 1.05 },
  },
  hy_sportspec: {
    name: 'Sport Specialist',
    a: 'fingers',
    b: 'endurance',
    edge: { style: ['endurance'], windows: 1.05 },
  },
  hy_coolcrimps: { name: 'Cool on Crimps', a: 'fingers', b: 'head', edge: { injury: 0.85 } },
  hy_allday: { name: 'All-Day Climber', a: 'technique', b: 'endurance', edge: { gain: ['endurance', 1.12] } },
  hy_routereader: {
    name: 'Route Reader',
    a: 'technique',
    b: 'head',
    edge: { style: ['crack'], windows: 1.05 },
  },
  hy_ironwill: { name: 'Iron Will', a: 'endurance', b: 'head', edge: { firstGo: 1.04 } },
};

// What a quirk is tested on: your goes, and how many were outside, on fresh or tired legs,
// in the evening or at dawn, well inside your grade, or powerful.
export interface Habits {
  goes: number;
  outdoor: number;
  fresh: number;
  tired: number;
  evening: number;
  dawn: number;
  easy: number;
  power: number;
}

export interface Quirk {
  name: string;
  edge: Edge;
  // Said when it's named.
  line: string;
  // Whether your habits name it; the first that does, in order, is yours.
  test: (h: Habits, s: { hurt: number; day: number }) => boolean;
  wait?: string;
}

const share = (n: number, h: Habits) => n / Math.max(1, h.goes);

// v0.956's eight, in its order. Shares are its thresholds.
export const QUIRKS: Record<string, Quirk> = {
  compbeast: {
    name: 'Comp Beast',
    edge: {},
    line: 'You climb better with a crowd watching than without one.',
    test: () => false,
    wait: 'comps (Phase 15)',
  },
  glasscannon: {
    name: 'Glass Cannon',
    edge: { style: ['power'], windows: 1.06, injury: 1.3 },
    line: 'Everything you climb is a fight, and your body keeps sending the invoice. Freakish power on the steep, a frame that keeps folding under it.',
    test: (h, s) => share(h.power, h) >= 0.45 && s.hurt >= 2,
  },
  purist: {
    name: 'Stone Purist',
    edge: { living: 0.75, gym: 0.92 },
    line: 'You can’t remember the last time you paid to climb indoors. Real rock, cheap living, and a quiet contempt for plastic.',
    test: (h) => share(h.outdoor, h) >= 0.85,
  },
  weekend: {
    name: 'Weekend Warrior',
    edge: { fresh: 1.08, tired: 0.9 },
    line: 'Somebody points out you’ve never once tied in tired. On fresh legs you’re unstoppable. Gassed, you’re a different climber entirely.',
    test: (h) => share(h.fresh, h) >= 0.7,
  },
  grinder: {
    name: 'The Grinder',
    edge: { gainAll: 1.08, injury: 1.25 },
    line: 'You climb through everything: tired, sore, half-cooked. It’s made you relentless, and it’s never once let anything finish healing.',
    test: (h) => share(h.tired, h) >= 0.4,
  },
  nightowl: {
    name: 'Night Owl',
    edge: { evening: 1.07, dawn: 0.93 },
    line: 'The headlamp is the most-used thing in the van. You’re useless before coffee and you come alive somewhere around dusk.',
    test: (h) => share(h.evening, h) >= 0.45 && h.evening > h.dawn * 2,
  },
  sandbagger: {
    name: 'Sandbagger',
    edge: { windows: 1.04, gainAll: 0.94 },
    line: 'You climb well inside yourself and carry zero ego about a number, which makes you unshakeable, and stubborn about ever drilling a weakness.',
    test: (h) => share(h.easy, h) >= 0.6,
  },
  slowburn: {
    name: 'Slow Burn',
    edge: { gainAll: 1.06 },
    line: 'It took you a long time to find your feet. Somewhere in the last few seasons, quietly, you started to soar.',
    test: (_h, s) => s.day >= 150,
  },
};
