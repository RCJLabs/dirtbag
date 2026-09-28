// Routes, their cruxes and the beta for each crux. Positions are in moves from the ground
// (fractional), so the rules never see pixels; the wall painter maps moves onto its topo.
//
// Each crux lists its beta obvious-first. The obvious sequence is always known. The others
// are earned: by falling at that crux (`unlock`) or from someone who knows (people.ts).

import type { Style } from '../types';

export type Verb = 'tension' | 'timing' | 'load';

export interface BetaDef {
  name: string;
  // How the climb panel names it mid-go: "The roof lip, heel hook."
  short: string;
  verb: Verb;
  // Half-width of the window on the verb meter, before pump, sun and skin shrink it.
  w: number;
  // Tension only: how fast the band drifts, and how long you must stay in it.
  rate?: number;
  need?: number;
  // Extra skin the sequence costs, and whether thin tips make it harder.
  skin?: number;
  crimpy?: boolean;
  note: string;
  // Shown on the locked card before you know it.
  hint?: string;
  // Earned by falling at its crux this many times; `line` is how you see it.
  unlock?: { falls: number; line: string };
  // What the climb panel says when it goes wrong, by way of failing.
  lines: { fall?: string; short?: string; long?: string; held?: string; hit?: string; miss?: string };
}

export interface CruxDef {
  id: string;
  name: string;
  from: number;
  to: number;
  // Said when you're through it.
  win: string;
  beta: string[];
}

export interface RouteDef {
  name: string;
  grade: string;
  // Unclimbable in this build: tapping the route says `blurb` instead.
  blurb?: string;
  moves: number;
  heightFt: number;
  // The beta sheet's line under the route name.
  line: string;
  cruxes: CruxDef[];
  beta: Record<string, BetaDef>;
  rest: { at: number; radius: number } | null;
  bolts: number[];
}

const closed = (name: string, grade: string, blurb: string): RouteDef => ({
  name,
  grade,
  blurb,
  moves: 0,
  heightFt: 0,
  line: '',
  cruxes: [],
  beta: {},
  rest: null,
  bolts: [],
});

export const ROUTES: Record<string, RouteDef> = {
  warmup: closed('Roadside Warmup', '5.11b', 'Roadside Warmup, 5.11b. You warmed up on the drive.'),
  roadside: closed('Roadside Route', '5.11d', 'Roadside Route, 5.11d. Another day.'),
  pump: {
    name: 'The Pump',
    grade: '5.12a',
    moves: 24,
    heightFt: 80,
    line: '24 moves, two cruxes, a rest on the ledge.',
    cruxes: [
      {
        id: 'A',
        name: 'The crimp rail',
        from: 3.65,
        to: 5.9,
        win: "Stuck it. The rail's behind you.",
        beta: ['A1', 'A2'],
      },
      {
        id: 'B',
        name: 'The roof lip',
        from: 13.25,
        to: 16.25,
        win: "Latched. You're over the lip.",
        beta: ['B1', 'B2'],
      },
    ],
    beta: {
      A1: {
        name: 'Crimp straight up',
        short: 'crimp it',
        verb: 'tension',
        w: 0.11,
        rate: 1.6,
        need: 1.6,
        skin: 4,
        crimpy: true,
        note: 'Small crimps, feet smearing. Costs 4 more skin.',
        lines: { fall: 'Your fingers open on the crimp rail.' },
      },
      A2: {
        name: 'High-step and rock over',
        short: 'rock over',
        verb: 'timing',
        w: 0.16,
        note: 'A high foot on the left takes the weight off your fingers.',
        hint: 'Fall here and you might see another way.',
        unlock: {
          falls: 1,
          line: 'On the way down you see it: a high foot on the left that takes the weight off the crimps. New beta: high-step and rock over.',
        },
        lines: { hit: 'Good foot.', miss: 'Missed the foot.', fall: 'Your foot skates off the high step.' },
      },
      B1: {
        name: 'Throw right for the jug',
        short: 'throw right',
        verb: 'load',
        w: 0.075,
        note: 'The obvious move. Big, fast and pumpy.',
        lines: {
          short: 'Short. Your fingers brush the jug and the wall lets go.',
          long: 'Too much. You slap past the jug.',
          held: 'Held it too long. You barrel off the jug.',
        },
      },
      B2: {
        name: 'Heel-hook the lip, cross to the pinch',
        short: 'heel hook',
        verb: 'tension',
        w: 0.17,
        rate: 1.2,
        need: 1.4,
        note: 'Slower and steadier. It keeps you on the wall.',
        hint: 'Someone at the Lot knows this one. Or fall here twice.',
        unlock: {
          falls: 2,
          line: "Second time off the lip. Left of the jug there's a black smear of heel rubber. New beta: heel-hook the lip.",
        },
        lines: { fall: 'Your heel pops off the lip.' },
      },
    },
    rest: { at: 10.2, radius: 0.9 },
    bolts: [2.17, 4.99, 7.8, 10.61, 13.42, 16.24, 19.05, 21.86],
  },
  testpiece: closed('Local Testpiece', '5.12b', 'Local Testpiece, 5.12b. The locals can keep it.'),
};

// Said when you come off between cruxes with nothing left in your arms.
export const PUMPED = 'Pumped. Your forearms quit before you do.';

export const STYLE_NAME: Record<Style, string> = {
  onsight: 'Onsight',
  flash: 'Flash',
  redpoint: 'Redpoint',
};
