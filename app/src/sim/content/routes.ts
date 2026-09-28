// Routes and boulder problems, their cruxes, and the beta for each crux. Positions are in
// moves from the ground (fractional), so the rules never see pixels; the painters map moves
// onto their own topos.
//
// Each crux lists its beta obvious-first. The obvious sequence is always known; the others
// are earned by falling at that crux (`unlock`), from someone who tells you, or by watching
// someone who knows it. Each beta has a style, and the style's skill mix against the
// route's grade sets how wide its window is for you (climber.ts).
//
// Roadside Crag's lines are v0.956's own: names, grades, styles. Send City's problems are
// generated each week (gym.ts) from the beta library below.

import type { Style } from '../climber';
import type { SendStyle } from '../types';

export type Verb = 'tension' | 'timing' | 'load';
export type Disc = 'boulder' | 'sport';

export interface BetaDef {
  name: string;
  // How the climb panel names it mid-go: "The roof lip, heel hook."
  short: string;
  verb: Verb;
  // Which skills it leans on.
  style: Style;
  // Half-width of the window on the verb meter, before your skills, pump, sun and skin.
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
  id: string;
  name: string;
  // v0.956's single 0..18 index. Boulders read it as V-grades, routes through the sport
  // table below.
  grade: number;
  disc: Disc;
  // The route's own character: the style its moves are made of.
  type: Style;
  // The place it's at.
  place: string;
  moves: number;
  heightFt: number;
  // The beta sheet's line under the name.
  line: string;
  cruxes: CruxDef[];
  beta: Record<string, BetaDef>;
  rest: { at: number; radius: number } | null;
  // Clips, in moves. Boulders have none: you land on pads.
  bolts: number[];
}

// v0.956's sport table: index 0 is 5.10a, 4 is 5.12a, 18 is 5.16a. The scale is squeezed
// at both ends, as it was.
const SPORT = [
  '5.10a',
  '5.10d',
  '5.11b',
  '5.11d',
  '5.12a',
  '5.12b',
  '5.12c',
  '5.12d',
  '5.13a',
  '5.13b',
  '5.13c',
  '5.13d',
  '5.14a',
  '5.14b',
  '5.14c',
  '5.14d',
  '5.15b',
  '5.15d',
  '5.16a',
];

export const gradeName = (disc: Disc, g: number): string =>
  disc === 'boulder' ? `V${g}` : (SPORT[Math.max(0, Math.min(18, g))] ?? '5.10a');

export const gradeLabel = (r: RouteDef): string => gradeName(r.disc, r.grade);

// Clips every `gap` moves from `first`, to just short of the top.
const boltsFor = (moves: number, first = 2.2, gap = 2.8): number[] => {
  const out: number[] = [];
  for (let m = first; m < moves - 1.5; m += gap) out.push(Math.round(m * 100) / 100);
  return out;
};

// ---- the beta library: a common pair of ways through each style of crux ----
// The first of each pair is what everyone tries; the second is the trick you earn.

export const LIBRARY: Record<Style, [BetaDef, BetaDef]> = {
  crimp: [
    {
      name: 'Crimp it',
      short: 'crimp it',
      verb: 'tension',
      style: 'crimp',
      w: 0.12,
      rate: 1.5,
      need: 1.5,
      skin: 2,
      crimpy: true,
      note: 'Small edges, feet on smears. Straightforward and sore.',
      lines: { fall: 'Your fingers open.' },
    },
    {
      name: 'High foot and rock over',
      short: 'rock over',
      verb: 'timing',
      style: 'technical',
      w: 0.16,
      note: 'A high foot takes the weight off your fingers.',
      hint: 'Fall here and you might see another way.',
      unlock: { falls: 1, line: 'On the way down you spot a high foot. New beta: rock over.' },
      lines: { hit: 'Good foot.', miss: 'Missed the foot.', fall: 'Your foot skates off the high step.' },
    },
  ],
  power: [
    {
      name: 'Big pull to the jug',
      short: 'big pull',
      verb: 'load',
      style: 'power',
      w: 0.085,
      note: 'All arms. It goes if you commit.',
      lines: {
        short: 'Short. You slap the jug and slide off.',
        long: 'Too much. You overshoot the jug.',
        held: 'Held it too long. Your arms give out.',
      },
    },
    {
      name: 'Heel hook and reach',
      short: 'heel hook',
      verb: 'tension',
      style: 'technical',
      w: 0.15,
      rate: 1.3,
      need: 1.4,
      note: 'The heel does half the pulling.',
      hint: 'Fall here twice, or watch someone who knows it.',
      unlock: {
        falls: 2,
        line: "Second time off. There's heel rubber right by your hip. New beta: heel hook.",
      },
      lines: { fall: 'Your heel pops.' },
    },
  ],
  technical: [
    {
      name: 'Smear and stand up',
      short: 'smear',
      verb: 'tension',
      style: 'technical',
      w: 0.12,
      rate: 1.2,
      need: 1.6,
      note: 'Trust the rubber. Hips over your feet.',
      lines: { fall: 'Your foot skids off the smear.' },
    },
    {
      name: 'Crimp the seam',
      short: 'crimp the seam',
      verb: 'tension',
      style: 'crimp',
      w: 0.15,
      rate: 1.4,
      need: 1.4,
      crimpy: true,
      note: 'A thin seam you can pull on. Less balance, more fingers.',
      hint: 'Fall here and you might see another way.',
      unlock: { falls: 1, line: 'Sliding off, your hand drags over a seam. New beta: crimp the seam.' },
      lines: { fall: 'The seam spits you off.' },
    },
  ],
  dyno: [
    {
      name: 'Jump for it',
      short: 'jump',
      verb: 'load',
      style: 'dyno',
      w: 0.08,
      note: 'One shot. Commit or come off.',
      lines: {
        short: 'Short. Fingertips on the jug, then air.',
        long: 'Too much. You fly past the jug.',
        held: 'You hesitate, and that is the whole move gone.',
      },
    },
    {
      name: 'Bump through the pinch',
      short: 'bump',
      verb: 'timing',
      style: 'power',
      w: 0.14,
      note: 'Two small moves instead of one big one.',
      hint: 'Fall here twice, or watch someone who knows it.',
      unlock: {
        falls: 2,
        line: "Twice off the jump. There's a pinch halfway you never looked at. New beta: bump through.",
      },
      lines: { hit: 'Caught it.', miss: 'Missed the pinch.', fall: 'You come off the pinch.' },
    },
  ],
  endurance: [
    {
      name: 'Keep moving',
      short: 'keep moving',
      verb: 'tension',
      style: 'endurance',
      w: 0.13,
      rate: 1.6,
      need: 1.8,
      note: 'No rests. Climb it before you pump out.',
      lines: { fall: 'Your forearms go.' },
    },
    {
      name: 'Shake out on the jug',
      short: 'shake out',
      verb: 'timing',
      style: 'technical',
      w: 0.16,
      note: "There's a jug halfway. Shake each arm, then go.",
      hint: 'Fall here and you might see another way.',
      unlock: { falls: 1, line: 'You come off right next to a big jug. New beta: shake out there.' },
      lines: { hit: 'Good shake.', miss: 'Rushed it.', fall: 'Pumped off anyway.' },
    },
  ],
  crack: [
    {
      name: 'Jam it',
      short: 'jam',
      verb: 'timing',
      style: 'crack',
      w: 0.13,
      skin: 3,
      note: 'Thumbs down, twist, trust it. It hurts.',
      lines: { hit: 'Solid jam.', miss: 'The jam slips.', fall: 'Your hand pulls out of the crack.' },
    },
    {
      name: 'Layback the edge',
      short: 'layback',
      verb: 'tension',
      style: 'power',
      w: 0.15,
      rate: 1.4,
      need: 1.5,
      note: "Lean off the crack's edge instead of jamming it.",
      hint: 'Fall here and you might see another way.',
      unlock: { falls: 1, line: 'Off again. The crack has a clean edge to layback. New beta: layback.' },
      lines: { fall: 'Your feet cut and you swing off.' },
    },
  ],
};

// A boulder with one crux from the library, for the crag and the gym alike.
export function libraryBoulder(
  id: string,
  name: string,
  grade: number,
  type: Style,
  place: string,
  shape: { moves: number; from: number; to: number; cruxName: string; heightFt: number; line: string },
): RouteDef {
  const [a, b] = LIBRARY[type];
  return {
    id,
    name,
    grade,
    disc: 'boulder',
    type,
    place,
    moves: shape.moves,
    heightFt: shape.heightFt,
    line: shape.line,
    cruxes: [
      {
        id: 'A',
        name: shape.cruxName,
        from: shape.from,
        to: shape.to,
        win: 'Through it. Top out.',
        beta: ['A1', 'A2'],
      },
    ],
    beta: { A1: a, A2: b },
    rest: null,
    bolts: [],
  };
}

// ---- Roadside Crag ----

const pump: RouteDef = {
  id: 'pump',
  name: 'The Pump',
  grade: 4,
  disc: 'sport',
  type: 'endurance',
  place: 'road',
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
      style: 'crimp',
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
      style: 'technical',
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
      style: 'dyno',
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
      style: 'technical',
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
};

const warmup: RouteDef = {
  id: 'warmup',
  name: 'Roadside Warmup',
  grade: 2,
  disc: 'sport',
  type: 'crimp',
  place: 'road',
  moves: 18,
  heightFt: 60,
  line: '18 moves. One crux, a crimp traverse at half height.',
  cruxes: [
    {
      id: 'A',
      name: 'The traverse',
      from: 8.2,
      to: 10.4,
      win: 'Across. Jugs to the chains.',
      beta: ['A1', 'A2'],
    },
  ],
  beta: {
    A1: {
      name: 'Crimp across',
      short: 'crimp across',
      verb: 'tension',
      style: 'crimp',
      w: 0.13,
      rate: 1.4,
      need: 1.4,
      skin: 2,
      crimpy: true,
      note: 'Hand over hand on small edges. Everyone does it this way.',
      lines: { fall: 'A crimp rolls under your fingers.' },
    },
    A2: {
      name: 'Step through and match the flake',
      short: 'step through',
      verb: 'timing',
      style: 'technical',
      w: 0.17,
      note: 'Feet first, then the flake takes both hands.',
      hint: 'Fall here and you might see another way.',
      unlock: {
        falls: 1,
        line: 'Swinging on the rope you see the footholds under the traverse. New beta: step through.',
      },
      lines: { hit: 'Good step.', miss: 'Your foot misses.', fall: 'You barn-door off the traverse.' },
    },
  },
  rest: null,
  bolts: boltsFor(18),
};

const roadside: RouteDef = {
  id: 'roadside',
  name: 'Roadside Route',
  grade: 3,
  disc: 'sport',
  type: 'power',
  place: 'road',
  moves: 20,
  heightFt: 70,
  line: '20 moves. Steady climbing to a bulge that asks for everything at once.',
  cruxes: [
    {
      id: 'A',
      name: 'The bulge',
      from: 11,
      to: 13.2,
      win: "Over the bulge. It's easy from here.",
      beta: ['A1', 'A2'],
    },
  ],
  beta: {
    A1: {
      name: 'Undercling and pull',
      short: 'undercling',
      verb: 'load',
      style: 'power',
      w: 0.09,
      note: 'Feet high, undercling hard, and go.',
      lines: {
        short: 'Short. You paw at the lip and drop.',
        long: 'Too much. You punch past the hold.',
        held: 'You lock off too long and your arms quit.',
      },
    },
    A2: {
      name: 'Heel-toe cam under the bulge',
      short: 'heel-toe cam',
      verb: 'tension',
      style: 'technical',
      w: 0.15,
      rate: 1.3,
      need: 1.5,
      note: 'Jam a foot in the slot and let it hold you in.',
      hint: 'Fall here twice, or watch someone who knows it.',
      unlock: {
        falls: 2,
        line: 'Hanging under the bulge, you notice the slot at your feet. New beta: heel-toe cam.',
      },
      lines: { fall: 'Your foot slides out of the slot.' },
    },
  },
  rest: null,
  bolts: boltsFor(20),
};

const testpiece: RouteDef = {
  id: 'testpiece',
  name: 'Local Testpiece',
  grade: 5,
  disc: 'sport',
  type: 'technical',
  place: 'road',
  moves: 22,
  heightFt: 75,
  line: '22 moves. A blank slab low, and crimps to the chains.',
  cruxes: [
    {
      id: 'A',
      name: 'The blank slab',
      from: 5.6,
      to: 8.2,
      win: 'Off the slab. Breathe.',
      beta: ['A1', 'A2'],
    },
    {
      id: 'B',
      name: 'The last crimps',
      from: 16.8,
      to: 19.2,
      win: 'Chains in reach.',
      beta: ['B1', 'B2'],
    },
  ],
  beta: {
    A1: { ...LIBRARY.technical[0], lines: { fall: 'Your feet skate and the slab spits you off.' } },
    A2: { ...LIBRARY.technical[1] },
    B1: { ...LIBRARY.crimp[0], w: 0.1 },
    B2: {
      ...LIBRARY.crimp[1],
      unlock: { falls: 2, line: "There's a foothold out left of the last crimps. New beta: rock over." },
    },
  },
  rest: { at: 12.4, radius: 0.8 },
  bolts: boltsFor(22),
};

const warmBoulder = libraryBoulder('warm', 'Warm Boulder', 2, 'endurance', 'road', {
  moves: 7,
  from: 3.6,
  to: 5.4,
  cruxName: 'The long reach',
  heightFt: 12,
  line: 'A low start, seven moves, and a long reach to the lip.',
});
const dyno = libraryBoulder('dyno', 'The Dyno', 3, 'dyno', 'road', {
  moves: 5,
  from: 2.4,
  to: 3.6,
  cruxName: 'The jump',
  heightFt: 11,
  line: 'Five moves, and one of them is a leap.',
});
const crimpfest = libraryBoulder('crimpfest', 'Crimpfest', 4, 'crimp', 'road', {
  moves: 6,
  from: 1.8,
  to: 4.4,
  cruxName: 'The crimps',
  heightFt: 12,
  line: 'Six moves on edges you can barely see.',
});

export const ROUTES: Record<string, RouteDef> = {
  warm: warmBoulder,
  dyno,
  crimpfest,
  warmup,
  roadside,
  pump,
  testpiece,
};

// Said when you come off between cruxes with nothing left in your arms.
export const PUMPED = 'Pumped. Your forearms quit before you do.';

export const SEND_NAME: Record<SendStyle, string> = {
  onsight: 'Onsight',
  flash: 'Flash',
  redpoint: 'Redpoint',
};
