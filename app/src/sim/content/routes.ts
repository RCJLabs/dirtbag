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
import type { GoStyle } from '../types';

export type Verb = 'tension' | 'timing' | 'load';
export type Disc = 'boulder' | 'sport' | 'trad';

// On a rope: a sport route clipped to bolts, or a trad line protected with what you place.
export const roped = (r: { disc: Disc }): boolean => r.disc !== 'boulder';

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
  // Clips, in moves. Boulders have none: you land on pads. Trad lines have none either.
  bolts: number[];
  // Trad only: the stances, in moves, where you can stop and place a piece.
  stances?: number[];
  // A sandbag (or a soft touch): the grade it really climbs at, which the rules use. The
  // listed grade is what the guidebook says (v0.956's trueGrade).
  trueGrade?: number;
  // Unclimbed: the first to send it names it (v0.956's open projects).
  open?: true;
  // On Send City's board: the gym's steep panel, whose problems stay up for weeks.
  board?: true;
  // A boulder tall enough that a fall off it is a real fall: it can land you badly (HIGHBALL).
  highball?: true;
  // A myth (v0.956's revealAfter): a line you can't even read until you've sent this one.
  hiddenUntil?: string;
}

// The grade a line really climbs at.
export const effGrade = (r: RouteDef): number => r.trueGrade ?? r.grade;

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

// Stances on a trad line: a first one low, then one every `gap` moves, and one at the rest.
const stancesFor = (moves: number, rest: number, first = 2.4, gap = 3.2): number[] => {
  const out: number[] = [];
  for (let m = first; m < moves - 1.5; m += gap)
    if (Math.abs(m - rest) > 1) out.push(Math.round(m * 100) / 100);
  return [...out, rest].sort((a, b) => a - b);
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
  shape: {
    moves: number;
    from: number;
    to: number;
    cruxName: string;
    heightFt: number;
    line: string;
    trueGrade?: number;
    open?: true;
    board?: true;
    highball?: true;
    hiddenUntil?: string;
  },
): RouteDef {
  const [a, b] = LIBRARY[type];
  return {
    ...(shape.trueGrade !== undefined ? { trueGrade: shape.trueGrade } : {}),
    ...(shape.open ? { open: true as const } : {}),
    ...(shape.board ? { board: true as const } : {}),
    ...(shape.highball ? { highball: true as const } : {}),
    ...(shape.hiddenUntil ? { hiddenUntil: shape.hiddenUntil } : {}),
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

// A sport route from the library: two cruxes, each with its style's pair of sequences (the
// second earned by falling twice), a rest between them, and bolts all the way.
export function librarySport(
  id: string,
  name: string,
  grade: number,
  type: Style,
  place: string,
  shape: {
    moves: number;
    heightFt: number;
    line: string;
    rest: number;
    a: { style: Style; name: string; from: number; to: number; win: string };
    b: { style: Style; name: string; from: number; to: number; win: string };
  },
): RouteDef {
  const [a1, a2] = LIBRARY[shape.a.style];
  const [b1, b2] = LIBRARY[shape.b.style];
  const crux = (c: typeof shape.a, k: 'A' | 'B') => ({
    id: k,
    name: c.name,
    from: c.from,
    to: c.to,
    win: c.win,
    beta: [`${k}1`, `${k}2`],
  });
  return {
    id,
    name,
    grade,
    disc: 'sport',
    type,
    place,
    moves: shape.moves,
    heightFt: shape.heightFt,
    line: shape.line,
    cruxes: [crux(shape.a, 'A'), crux(shape.b, 'B')],
    beta: { A1: a1, A2: a2, B1: b1, B2: { ...b2, unlock: { falls: 2, line: b2.unlock?.line ?? '' } } },
    rest: { at: shape.rest, radius: 0.8 },
    bolts: boltsFor(shape.moves),
  };
}

// A trad line: a library sport route's shape, with stances in place of bolts. What protects
// you is what you stopped to place.
export function libraryTrad(...args: Parameters<typeof librarySport>): RouteDef {
  const r = librarySport(...args);
  const stances = stancesFor(r.moves, r.rest!.at).filter(
    (at) => !r.cruxes.some((c) => at >= c.from && at <= c.to),
  );
  return { ...r, disc: 'trad', bolts: [], stances };
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

// The rest of v0.956's Roadside: a crack, the highball that tests your head, everyone's
// project, and the line nobody's done. Trad Arête, its one trad line, is further down.
const fingerCrack = libraryBoulder('fingercrack', 'Finger Crack', 4, 'crack', 'road', {
  moves: 6,
  from: 2.2,
  to: 4.0,
  cruxName: 'The seam',
  heightFt: 13,
  line: 'A finger crack up a split block. Tape helps; so does not thinking about it.',
});
const highball = libraryBoulder('highball', 'Highball Arête', 5, 'technical', 'road', {
  moves: 8,
  from: 5.0,
  to: 6.8,
  cruxName: 'The top',
  heightFt: 18,
  line: 'Eight moves up a clean arête, and the crux is where the pads stop helping.',
  highball: true,
});
const theProject = libraryBoulder('project', 'The Project', 6, 'power', 'road', {
  moves: 6,
  from: 2.6,
  to: 4.4,
  cruxName: 'The big move',
  heightFt: 12,
  line: 'Everyone’s project. The chalk says so.',
});
const roadsideOpen = libraryBoulder('rsopen', 'The open project', 7, 'dyno', 'road', {
  moves: 6,
  from: 3.4,
  to: 4.8,
  cruxName: 'The leap',
  heightFt: 13,
  line: 'Nobody’s done it. The chalk stops at the fourth move.',
  open: true,
});

// v0.956's Roadside trad line: an arête with a crack up its side, and nothing in it but
// what you bring.
const tradArete = libraryTrad('tradarete', 'Trad Arête', 5, 'technical', 'road', {
  moves: 22,
  heightFt: 75,
  line: 'No bolts. The crack takes gear, if you stop to place it.',
  rest: 11.8,
  a: { style: 'technical', name: 'The arête', from: 6.4, to: 8.6, win: 'Back to the crack.' },
  b: { style: 'crack', name: 'The flare', from: 16.2, to: 18.4, win: 'Top out.' },
});

// ---- Granite Gorge: v0.956's second crag, shaded, two hours out ----

const gSlab = libraryBoulder('gslab', 'Granite Slab', 5, 'technical', 'gorge', {
  moves: 7,
  from: 3.2,
  to: 5.0,
  cruxName: 'The smear',
  heightFt: 14,
  line: 'A slab in the shade. Trust your feet or don’t bother.',
});
const gSerenity = libraryBoulder('gserenity', 'Serenity Crack', 6, 'crack', 'gorge', {
  moves: 7,
  from: 2.8,
  to: 4.8,
  cruxName: 'The flare',
  heightFt: 15,
  line: 'A perfect crack that pinches shut two-thirds of the way up.',
});
const gPinch = libraryBoulder('gpinch', 'The Pinch', 6, 'power', 'gorge', {
  moves: 5,
  from: 1.8,
  to: 3.4,
  cruxName: 'The pinch',
  heightFt: 12,
  line: 'One hold. You squeeze it or you don’t.',
});
const gDyno = libraryBoulder('gdyno', 'Gorge Dyno', 7, 'dyno', 'gorge', {
  moves: 5,
  from: 2.6,
  to: 3.8,
  cruxName: 'The throw',
  heightFt: 13,
  line: 'A committing throw off bad feet. The guidebook says V7.',
  trueGrade: 8,
});
const gCathedral = libraryBoulder('gcathedral', 'Crimp Cathedral', 8, 'crimp', 'gorge', {
  moves: 8,
  from: 3.6,
  to: 6.2,
  cruxName: 'The nave',
  heightFt: 16,
  line: 'A tall wall of razor crimps. People drive in from three states for it.',
});
const gOpen = libraryBoulder('gopen', 'The Gorge project', 9, 'crimp', 'gorge', {
  moves: 7,
  from: 3.0,
  to: 5.6,
  cruxName: 'The blank bit',
  heightFt: 14,
  line: 'Unclimbed. Better climbers than you have tried, which is what they all say.',
  open: true,
});
const gIntro = librarySport('gintro', 'Gorge Intro', 5, 'crimp', 'gorge', {
  moves: 20,
  heightFt: 70,
  line: 'The Gorge’s way of saying hello: twenty moves of edges.',
  rest: 11,
  a: { style: 'crimp', name: 'The first edges', from: 6.2, to: 8.4, win: 'Onto the good ledge.' },
  b: { style: 'technical', name: 'The slab finish', from: 14.6, to: 16.8, win: 'Chains.' },
});
const gClassic = librarySport('gclassic', 'Gorge Classic', 6, 'power', 'gorge', {
  moves: 22,
  heightFt: 80,
  line: 'Steep, shaded and famous. It earns it.',
  rest: 12.6,
  a: { style: 'power', name: 'The overlap', from: 7.4, to: 9.4, win: 'Over it.' },
  b: { style: 'crimp', name: 'The headwall', from: 16.8, to: 19.0, win: 'Chains in reach.' },
});
const gPowerEnd = librarySport('gpe', 'Power Endurance', 8, 'power', 'gorge', {
  moves: 26,
  heightFt: 90,
  line: 'The name is the whole description.',
  rest: 14,
  a: { style: 'power', name: 'The roof', from: 8.0, to: 10.2, win: 'Through the roof.' },
  b: { style: 'endurance', name: 'The long finish', from: 18.4, to: 21.6, win: 'Chains. Barely.' },
});

// v0.956's Gorge Trad: a long crack up the back of the gorge, pumpy all the way.
const gTrad = libraryTrad('gtrad', 'Gorge Trad', 8, 'endurance', 'gorge', {
  moves: 26,
  heightFt: 95,
  line: 'Ninety-five feet of crack. The gear is good; stopping to place it isn’t free.',
  rest: 13.6,
  a: { style: 'crack', name: 'The off-width bulge', from: 7.8, to: 10.0, win: 'Past the bulge.' },
  b: { style: 'endurance', name: 'The long corner', from: 18.6, to: 21.8, win: 'Top out. Build an anchor.' },
});

// ---- Moonstone Boulders: v0.956's desert highball crag, three hours out ----
// v0.956 named two lines Highball Arête, one here and one at Roadside; this one is the Tall
// Arête, so a log or a card can't mix them up.

const mArete = libraryBoulder('marete', 'Tall Arête', 6, 'technical', 'moon', {
  moves: 9,
  from: 5.6,
  to: 7.4,
  cruxName: 'The top',
  heightFt: 22,
  line: 'An arête as tall as a house, and the hard part is at the top of it.',
  highball: true,
});
const mMantel = libraryBoulder('mmantel', 'Moonstone Mantel', 7, 'power', 'moon', {
  moves: 5,
  from: 3.0,
  to: 4.4,
  cruxName: 'The mantel',
  heightFt: 16,
  line: 'Five moves to the lip, then the mantel everybody gets wrong the first time.',
});
const mEgg = libraryBoulder('megg', 'The Egg', 8, 'dyno', 'moon', {
  moves: 5,
  from: 2.4,
  to: 3.6,
  cruxName: 'The throw',
  heightFt: 15,
  line: 'A smooth egg of quartzite: one hold, one throw, one sloper to catch.',
});
const mHueco = libraryBoulder('mhueco', 'Hueco Pockets', 9, 'crimp', 'moon', {
  moves: 7,
  from: 3.2,
  to: 5.0,
  cruxName: 'The pockets',
  heightFt: 17,
  line: 'Pockets all the way up. The guidebook says V9. The guidebook is generous.',
  trueGrade: 8,
});
const mSplitter = libraryBoulder('msplitter', 'Moonstone Splitter', 8, 'crack', 'moon', {
  moves: 8,
  from: 4.0,
  to: 6.0,
  cruxName: 'The flare',
  heightFt: 20,
  line: 'A splitter up a boulder the size of a van. Tape up.',
  highball: true,
});
const mRoof = libraryBoulder('mroof', 'Lunar Roof', 11, 'power', 'moon', {
  moves: 9,
  from: 4.4,
  to: 7.0,
  cruxName: 'The lip',
  heightFt: 14,
  line: 'Nine moves out the roof in the dark under the boulder, and then the lip.',
});
const mOpen = libraryBoulder('mopen', 'The Moonstone project', 12, 'power', 'moon', {
  moves: 8,
  from: 3.6,
  to: 6.2,
  cruxName: 'The last hard move',
  heightFt: 22,
  line: 'Nobody’s done it. The chalk stops two-thirds of the way up a very tall boulder.',
  open: true,
  highball: true,
});
const mSpire = librarySport('mspire', 'Desert Spire', 8, 'dyno', 'moon', {
  moves: 24,
  heightFt: 90,
  line: 'A lone spire of quartzite, bolted to its summit. The jump is halfway.',
  rest: 13,
  a: { style: 'dyno', name: 'The jump', from: 9.0, to: 10.8, win: 'Stuck it.' },
  b: { style: 'technical', name: 'The summit block', from: 18.6, to: 21.2, win: 'Chains, and the view.' },
});
const mMoon = librarySport('mmoon', 'Moonlight Arête', 10, 'technical', 'moon', {
  moves: 28,
  heightFt: 110,
  line: 'An arête that catches the moon. Climb it by day anyway.',
  rest: 15.4,
  a: { style: 'technical', name: 'The arête', from: 8.4, to: 11.0, win: 'Off the arête.' },
  b: { style: 'crimp', name: 'The headwall', from: 20.2, to: 23.6, win: 'Chains.' },
});

// ---- Sandstone Mesa: v0.956's fourth crag, desert sandstone three hours out ----
// Its eleven lines, names and grades as v0.956 had them: V7 to the open V13, three bolted
// lines and a trad line. It opens at V7 and shuts for the summer heat.

const sVarnish = libraryBoulder('svarnish', 'Desert Varnish', 7, 'endurance', 'mesa', {
  moves: 10,
  from: 6.0,
  to: 8.4,
  cruxName: 'The last slopers',
  heightFt: 15,
  line: 'Ten moves across black varnish. The holds are fine; there are just a lot of them.',
});
const sCrimps = libraryBoulder('scrimps', 'Sandstone Crimps', 8, 'crimp', 'mesa', {
  moves: 7,
  from: 3.4,
  to: 5.2,
  cruxName: 'The flakes',
  heightFt: 14,
  line: 'Thin flakes that might be holds or might be next year’s talus.',
});
const sProw = libraryBoulder('sprow', 'The Prow', 9, 'technical', 'mesa', {
  moves: 8,
  from: 4.2,
  to: 6.2,
  cruxName: 'The prow',
  heightFt: 17,
  line: 'A sharp prow, climbed on its edge. The guidebook says V9.',
  trueGrade: 10,
});
const sSplit = libraryBoulder('ssplit', 'Desert Splitter', 9, 'crack', 'mesa', {
  moves: 8,
  from: 3.8,
  to: 5.8,
  cruxName: 'The flare',
  heightFt: 16,
  line: 'A splitter through a boulder the size of a van. Tape up.',
});
const sPowerhouse = libraryBoulder('spowerhouse', 'Powerhouse', 10, 'power', 'mesa', {
  moves: 6,
  from: 2.6,
  to: 4.2,
  cruxName: 'The roof',
  heightFt: 12,
  line: 'Six moves out a roof on slopers that don’t care how strong you are.',
});
const sMega = libraryBoulder('smega', 'The Megaproject', 11, 'dyno', 'mesa', {
  moves: 6,
  from: 3.0,
  to: 4.4,
  cruxName: 'The jump',
  heightFt: 15,
  line: 'Everyone’s project, for a reason. The jump is further than it looks, and it looks far.',
});
const sOpen = libraryBoulder('sopen', 'The Mesa project', 13, 'crimp', 'mesa', {
  moves: 8,
  from: 4.4,
  to: 6.6,
  cruxName: 'The blank bit',
  heightFt: 16,
  line: 'Unclimbed. Chalk on two holds, and a long blank stretch nobody has chalked.',
  open: true,
});
const sLap = librarySport('sdlap', 'Desert Lap', 8, 'crimp', 'mesa', {
  moves: 22,
  heightFt: 85,
  line: 'The warm-up here, which says something about here.',
  rest: 11.4,
  a: { style: 'crimp', name: 'The varnish', from: 6.4, to: 8.6, win: 'Onto the ledge.' },
  b: { style: 'technical', name: 'The slab', from: 16.2, to: 18.4, win: 'Chains.' },
});
const sEnduro = librarySport('senduro', 'Desert Enduro', 9, 'endurance', 'mesa', {
  moves: 28,
  heightFt: 110,
  line: 'A hundred and ten feet, and none of it is a rest you’d call a rest.',
  rest: 14.8,
  a: {
    style: 'endurance',
    name: 'The first headwall',
    from: 9.2,
    to: 12.0,
    win: 'A shake, if you’re quick.',
  },
  b: {
    style: 'crimp',
    name: 'The top edges',
    from: 21.6,
    to: 24.6,
    win: 'Chains. Your forearms file a complaint.',
  },
});
const sLink = librarySport('sbiglink', 'The Big Link', 11, 'technical', 'mesa', {
  moves: 30,
  heightFt: 120,
  line: 'Two routes linked through a blank bulge. The link is the whole point.',
  rest: 15.2,
  a: { style: 'technical', name: 'The bulge', from: 9.6, to: 12.4, win: 'Through the link.' },
  b: { style: 'power', name: 'The lip', from: 23.0, to: 25.8, win: 'Chains. All of it, in one go.' },
});
const sTrad = libraryTrad('sdtrad', 'Desert Trad Line', 11, 'technical', 'mesa', {
  moves: 26,
  heightFt: 105,
  line: 'Soft sandstone and a thin crack. Place carefully; it holds if you did.',
  rest: 13.4,
  a: { style: 'crack', name: 'The thin crack', from: 7.6, to: 10.2, win: 'Out of the crack.' },
  b: { style: 'technical', name: 'The runout face', from: 19.0, to: 21.8, win: 'Top out onto the mesa.' },
});

// ---- The Big Stone: v0.956's valley of granite big walls, four hours out ----
// Its five single-pitch lines, names and grades as v0.956 had them. Its multi-pitch walls
// come with Phase 21.5. It opens at V8, once you've paid for the trip, and it's shaded.

const bBase = libraryBoulder('bbase', 'Base Camp Boulder', 6, 'power', 'stone', {
  moves: 6,
  from: 2.8,
  to: 4.4,
  cruxName: 'The lip',
  heightFt: 13,
  line: 'Everyone’s first problem here, done in approach shoes by people waiting on a wall.',
});
const bWarm = libraryBoulder('bwarm', 'The Warm-Up Wall', 9, 'crimp', 'stone', {
  moves: 8,
  from: 4.0,
  to: 6.0,
  cruxName: 'The dime edges',
  heightFt: 16,
  line: 'A warm-up, if you warm up on V10. The guidebook says V9.',
  trueGrade: 10,
});
const bSplit = libraryBoulder('bsplit', 'The Splitter Pitch', 10, 'crack', 'stone', {
  moves: 9,
  from: 5.2,
  to: 7.4,
  cruxName: 'The finger lock',
  heightFt: 22,
  line: 'A perfect finger crack that ends a long way off the ground.',
  highball: true,
});
const bTrad = libraryTrad('btrad', 'The Trad Pitch', 11, 'technical', 'stone', {
  moves: 28,
  heightFt: 120,
  line: 'One long pitch up a corner on the big wall. Bring the rack and a lot of patience.',
  rest: 14.2,
  a: { style: 'crack', name: 'The corner', from: 8.4, to: 11.2, win: 'Out of the corner.' },
  b: {
    style: 'technical',
    name: 'The slab traverse',
    from: 20.6,
    to: 23.4,
    win: 'Top out. The valley goes quiet.',
  },
});
const bClassic = librarySport('bclassic', 'Valley Classic', 12, 'power', 'stone', {
  moves: 30,
  heightFt: 125,
  line: 'The one everybody drives four hours for. Steep, clean and famous.',
  rest: 15.4,
  a: { style: 'power', name: 'The roof', from: 9.2, to: 12.0, win: 'Over the roof.' },
  b: { style: 'crimp', name: 'The headwall', from: 22.8, to: 26.0, win: 'Chains, and a very long lower.' },
});

// ---- Wind River Walls: v0.956's high alpine granite, past the Gorge ----
// Its nine lines, names and grades as v0.956 had them: V9 to an open V15, three bolted
// and a trad line. V9 and a trip to pay for, a permit every time, and snowed in all winter.

const wAlpine = libraryBoulder('walpine', 'Alpine Crimps', 9, 'crimp', 'wind', {
  moves: 7,
  from: 3.6,
  to: 5.4,
  cruxName: 'The frozen edges',
  heightFt: 13,
  line: 'Edges on a block by the lake. Your fingers go numb before they go pumped.',
});
const wDiamond = libraryBoulder('wdiamond', 'The Diamond', 11, 'technical', 'wind', {
  moves: 8,
  from: 4.2,
  to: 6.2,
  cruxName: 'The facet',
  heightFt: 15,
  line: 'A diamond-shaped face climbed on its facets. Soft for V11, and everyone knows it.',
  trueGrade: 10,
});
const wOffwidth = libraryBoulder('woffwidth', 'Offwidth Horror', 12, 'crack', 'wind', {
  moves: 7,
  from: 3.4,
  to: 5.6,
  cruxName: 'The chimney-that-isn’t',
  heightFt: 16,
  line: 'Too wide for a fist, too narrow for a body. It costs skin you didn’t know you had.',
});
const wThin = libraryBoulder('wthin', 'Thin Air', 13, 'power', 'wind', {
  moves: 6,
  from: 2.8,
  to: 4.4,
  cruxName: 'The lunge',
  heightFt: 14,
  line: 'Eleven thousand feet up, a lunge that’s hard at sea level.',
});
const wOpen = libraryBoulder('wopen', 'The Wind River project', 15, 'technical', 'wind', {
  moves: 9,
  from: 4.6,
  to: 7.0,
  cruxName: 'The blank arête',
  heightFt: 18,
  line: 'Unclimbed. An arête with no holds on it that anyone’s found yet.',
  open: true,
});
const wGlacier = librarySport('wglacier', 'Glacier Point', 10, 'crimp', 'wind', {
  moves: 24,
  heightFt: 95,
  line: 'Clean alpine granite over a glacier. Crimps all the way, and cold ones.',
  rest: 12.2,
  a: { style: 'crimp', name: 'The seam', from: 7.2, to: 9.6, win: 'Off the seam.' },
  b: { style: 'technical', name: 'The slab', from: 17.8, to: 20.2, win: 'Chains, and a view that goes on.' },
});
const wSkyline = librarySport('wskyline', 'Skyline Traverse', 12, 'technical', 'wind', {
  moves: 30,
  heightFt: 110,
  line: 'Sideways along the skyline for half its length. The rope drag is the second crux.',
  rest: 15.0,
  a: { style: 'technical', name: 'The traverse', from: 8.8, to: 12.4, win: 'Across.' },
  b: {
    style: 'endurance',
    name: 'The last bolts',
    from: 23.2,
    to: 26.6,
    win: 'Chains. Lower slowly; it wanders.',
  },
});
const wAstro = librarySport('wastroman', 'Astroman', 14, 'crack', 'wind', {
  moves: 32,
  heightFt: 130,
  line: 'A bolted crack line, the hardest thing on the wall. It’s everything, the whole way.',
  rest: 16.4,
  a: { style: 'crack', name: 'The Harding slot', from: 10.0, to: 13.2, win: 'Out of the slot.' },
  b: {
    style: 'power',
    name: 'The roof crack',
    from: 24.6,
    to: 28.2,
    win: 'Chains. You’ll be telling people.',
  },
});
const wTrad = libraryTrad('wtrad', 'Alpine Trad', 13, 'endurance', 'wind', {
  moves: 30,
  heightFt: 125,
  line: 'A long crack up the wall, gear the whole way, and the weather watching.',
  rest: 15.6,
  a: { style: 'crack', name: 'The long hands', from: 9.4, to: 12.6, win: 'Out of the hands section.' },
  b: { style: 'endurance', name: 'The upper corner', from: 22.4, to: 25.8, win: 'Top out into the wind.' },
});

// ---- The Crucible: v0.956's remote, frigid wall, where the grades run out ----
// Its lines as v0.956 had them, V13 to its two V18 myths, and one it didn't have: The Anvil,
// V16, so the grades run out without a hole in them [proposed]. A myth can't be read until
// you've sent the hardest known line under it (v0.956's revealAfter), and nobody has
// climbed one: its first ascent is yours to name.

const cReckoning = libraryBoulder('creckoning', 'The Reckoning', 13, 'crimp', 'crucible', {
  moves: 8,
  from: 4.0,
  to: 6.2,
  cruxName: 'The razor edges',
  heightFt: 15,
  line: 'Edges in cold gneiss, sharp enough to shave with. The first thing here, and it’s V13.',
});
const cVise = libraryBoulder('cvise', 'The Vise', 14, 'crack', 'crucible', {
  moves: 7,
  from: 3.4,
  to: 5.6,
  cruxName: 'The squeeze',
  heightFt: 16,
  line: 'A crack that closes on your hand like it means it.',
});
const cApparition = libraryBoulder('capparition', 'Apparition', 15, 'power', 'crucible', {
  moves: 6,
  from: 2.8,
  to: 4.6,
  cruxName: 'The ghost hold',
  heightFt: 14,
  line: 'A hold you only see from the move before it. The guidebook says V15; it isn’t quite.',
  trueGrade: 14,
});
const cAnvil = libraryBoulder('canvil', 'The Anvil', 16, 'power', 'crucible', {
  moves: 7,
  from: 3.2,
  to: 5.2,
  cruxName: 'The strike',
  heightFt: 15,
  line: 'A block of black gneiss with one way up it, and every move of it hits back.',
});
const cHorizon = libraryBoulder('chorizon', 'Event Horizon', 17, 'dyno', 'crucible', {
  moves: 8,
  from: 4.4,
  to: 6.0,
  cruxName: 'The point of no return',
  heightFt: 17,
  line: 'Past the third move there’s no down-climbing it. The jump is the only way off.',
});
const cGenesis = libraryBoulder('cgenesis', 'The Crucible myth', 18, 'dyno', 'crucible', {
  moves: 5,
  from: 1.8,
  to: 3.6,
  cruxName: 'The move',
  heightFt: 16,
  line: 'The undercut setup, feet at your ears. Then the move: full extension, double-clutch, to a flat edge nobody has held. Then the mantel.',
  open: true,
  hiddenUntil: 'chorizon',
});
const cCrux = librarySport('ccrux', 'Crucible Crux', 13, 'dyno', 'crucible', {
  moves: 26,
  heightFt: 100,
  line: 'The warm-up, if you’ve driven this far to warm up on 5.14.',
  rest: 13.2,
  a: { style: 'dyno', name: 'The dyno', from: 8.2, to: 10.0, win: 'Stuck it.' },
  b: { style: 'crimp', name: 'The cold edges', from: 19.6, to: 22.4, win: 'Chains.' },
});
const cLifeline = librarySport('clifeline', 'The Lifeline', 15, 'crimp', 'crucible', {
  moves: 30,
  heightFt: 115,
  line: 'One thin seam, all the way. The seam is the lifeline; there’s nothing either side of it.',
  rest: 15.0,
  a: { style: 'crimp', name: 'The seam', from: 9.2, to: 12.4, win: 'Off the thin bit.' },
  b: { style: 'technical', name: 'The blank finish', from: 23.4, to: 26.8, win: 'Chains, somehow.' },
});
const cThreshold = librarySport('cthreshold', 'Threshold', 17, 'endurance', 'crucible', {
  moves: 36,
  heightFt: 130,
  line: 'The hardest known line on the wall: thirty-six moves with nowhere to hide.',
  rest: 17.6,
  a: { style: 'endurance', name: 'The long middle', from: 11.2, to: 15.0, win: 'Still on.' },
  b: {
    style: 'power',
    name: 'The last roof',
    from: 28.0,
    to: 31.8,
    win: 'Chains. The whole valley heard that.',
  },
});
const cMyth = {
  ...librarySport('cmyth', 'The myth above Threshold', 18, 'power', 'crucible', {
    moves: 38,
    heightFt: 140,
    line: 'The opening slab, a two-finger pull, the roof with feet cut, a kneebar that almost counts. Then, at forty metres, a left-hand mono.',
    rest: 19.0,
    a: { style: 'power', name: 'The roof', from: 12.0, to: 15.2, win: 'Feet back on.' },
    b: {
      style: 'crimp',
      name: 'The mono',
      from: 30.0,
      to: 33.6,
      win: 'The victory jugs, and you’re still on.',
    },
  }),
  open: true as const,
  hiddenUntil: 'cthreshold',
};

export const ROUTES: Record<string, RouteDef> = {
  warm: warmBoulder,
  dyno,
  crimpfest,
  fingercrack: fingerCrack,
  highball,
  project: theProject,
  rsopen: roadsideOpen,
  warmup,
  roadside,
  pump,
  testpiece,
  tradarete: tradArete,
  gslab: gSlab,
  gserenity: gSerenity,
  gpinch: gPinch,
  gdyno: gDyno,
  gcathedral: gCathedral,
  gopen: gOpen,
  gintro: gIntro,
  gclassic: gClassic,
  gpe: gPowerEnd,
  gtrad: gTrad,
  marete: mArete,
  mmantel: mMantel,
  megg: mEgg,
  mhueco: mHueco,
  msplitter: mSplitter,
  mroof: mRoof,
  mopen: mOpen,
  mspire: mSpire,
  mmoon: mMoon,
  svarnish: sVarnish,
  scrimps: sCrimps,
  sprow: sProw,
  ssplit: sSplit,
  spowerhouse: sPowerhouse,
  smega: sMega,
  sopen: sOpen,
  sdlap: sLap,
  senduro: sEnduro,
  sbiglink: sLink,
  sdtrad: sTrad,
  bbase: bBase,
  bwarm: bWarm,
  bsplit: bSplit,
  btrad: bTrad,
  bclassic: bClassic,
  walpine: wAlpine,
  wdiamond: wDiamond,
  woffwidth: wOffwidth,
  wthin: wThin,
  wopen: wOpen,
  wglacier: wGlacier,
  wskyline: wSkyline,
  wastroman: wAstro,
  wtrad: wTrad,
  creckoning: cReckoning,
  cvise: cVise,
  capparition: cApparition,
  canvil: cAnvil,
  chorizon: cHorizon,
  cgenesis: cGenesis,
  ccrux: cCrux,
  clifeline: cLifeline,
  cthreshold: cThreshold,
  cmyth: cMyth,
};

// Said when you come off between cruxes with nothing left in your arms.
export const PUMPED = 'Pumped. Your forearms quit before you do.';

export const SEND_NAME: Record<GoStyle, string> = {
  onsight: 'Onsight',
  flash: 'Flash',
  redpoint: 'Redpoint',
  repeat: 'Repeat',
};
