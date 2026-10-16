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
import { HIGHBALL } from '../dials';
import { PLACES } from './places';
import { ROCK_LINES, ROCK_MOVES } from './rock';
import { laterLines } from './routes.full';
import type { GoStyle } from '../types';

export type Verb = 'tension' | 'timing' | 'load';
export type Disc = 'boulder' | 'sport' | 'trad';

// On a rope: a sport route clipped to bolts, or a trad line protected with what you place.
export const roped = (r: { disc: Disc }): boolean => r.disc !== 'boulder';

// Drawn on a crag's wall, not as a boulder of its own: a roped line, or a deep-water solo up
// a sea cliff.
export const onWall = (r: { disc: Disc; dws?: true }): boolean => roped(r) || !!r.dws;

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
  // A crux only you meet, climbing over your grade (reach.ts): the one it borrows its beta from.
  of?: string;
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
  // Set from its height (isHighball), never by hand.
  highball?: true;
  // A myth (v0.956's revealAfter): a line you can't even read until you've sent this one.
  hiddenUntil?: string;
  // Deep-water solo: a boulder problem up a sea cliff. A fall is a splash: no pad, no
  // landing, no strain roll (v0.956's dws).
  dws?: true;
  // A pitch of a multi-pitch wall (WALLS): climbed only in its turn, on the wall.
  wall?: string;
  // And what kind of pitch it is (Phase 27.3), which gave it its shape (PITCH_KINDS).
  kind?: PitchKind;
  // A pitch of an expedition (Phase 24): climbed only up there, in your block.
  exped?: string;
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
    hiddenUntil?: string;
    dws?: true;
  },
): RouteDef {
  const [a, b] = LIBRARY[type];
  return {
    ...(shape.trueGrade !== undefined ? { trueGrade: shape.trueGrade } : {}),
    ...(shape.open ? { open: true as const } : {}),
    ...(shape.board ? { board: true as const } : {}),
    ...(shape.hiddenUntil ? { hiddenUntil: shape.hiddenUntil } : {}),
    ...(shape.dws ? { dws: true as const } : {}),
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

// Phase 32.3: a crack you bolted in a wild place: its shape, with bolts in place of the gear.
export const asSport = (r: RouteDef): RouteDef => {
  const { stances: _, ...rest } = r;
  return { ...rest, disc: 'sport', bolts: boltsFor(r.moves) };
};

// A trad line: a library sport route's shape, with stances in place of bolts. What protects
// you is what you stopped to place.
export function libraryTrad(...args: Parameters<typeof librarySport>): RouteDef {
  const r = librarySport(...args);
  const stances = stancesFor(r.moves, r.rest!.at).filter(
    (at) => !r.cruxes.some((c) => at >= c.from && at <= c.to),
  );
  return { ...r, disc: 'trad', bolts: [], stances };
}

// One pitch of a multi-pitch wall: a single crux of its style two-thirds of the way up, bolts
// all the way, and a belay ledge at the top.
export function libraryPitch(
  wall: string,
  n: number,
  name: string,
  grade: number,
  type: Style,
  place: string,
): RouteDef {
  const [a, b] = LIBRARY[type];
  const moves = 16;
  return {
    id: `${wall}-${n}`,
    name,
    grade,
    disc: 'sport',
    type,
    place,
    moves,
    heightFt: 100,
    line: `Pitch ${n}. A hundred feet to the next ledge.`,
    cruxes: [{ id: 'A', name, from: 9.2, to: 11.4, win: 'Through it. On to the ledge.', beta: ['A1', 'A2'] }],
    beta: { A1: a, A2: b },
    rest: null,
    bolts: boltsFor(moves),
    wall,
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
  cruxName: 'The arête',
  heightFt: 18,
  line: 'A clean arête a long way up, and the crux is where the pads stop helping.',
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

// ---- The later crags (Phase 14.5b): their lines are in routes.full.ts, the full game's only ----

// ---- Multi-pitch walls (Phase 21.5): v0.956's four, pitch by pitch ----
// A wall is climbed a pitch at a time, in order, on a rope, and you can sleep on it. The
// Prow at Roadside is v0.956's; its name went to the Mesa's boulder first, so it's The Long
// Prow here. The rest are at The Big Stone.

export interface WallDef {
  name: string;
  place: string;
  // The wall's grade on the sport table: its hardest pitch.
  grade: number;
  pitches: string[];
  line: string;
}

// Phase 27.3: a wall's pitches by kind, where they all used to be one shape. The kind sets how
// long a pitch is, where its crux sits and whether there's a rest: a chimney rests, a roof
// doesn't. Each crux comes after about as much climbing from the belay, or from the rest, as
// the old shape's did, so a pitch is still as hard as its grade; what moves is where it's
// hard and what it asks. Its moves are its rock's (content/rock.ts).
export type PitchKind = 'crack' | 'corner' | 'chimney' | 'traverse' | 'roof' | 'slab' | 'face';

interface PitchShape {
  moves: number;
  from: number;
  to: number;
  rest: number | null;
  line: string;
  win: string;
}

export const PITCH_KINDS: Record<PitchKind, PitchShape> = {
  face: {
    moves: 16,
    from: 9.2,
    to: 11.4,
    rest: null,
    line: 'Open face to the next ledge, and the hard bit most of the way up it.',
    win: 'Through it. On to the ledge.',
  },
  crack: {
    moves: 16,
    from: 8.6,
    to: 10.8,
    rest: null,
    line: 'One crack, ledge to ledge. It pinches down past halfway, then it’s jams to the top.',
    win: 'Past the pinch. Jams to the ledge.',
  },
  corner: {
    moves: 20,
    from: 13.4,
    to: 15.6,
    rest: 4,
    line: 'A long corner. You can stem and shake out low down; the hard part is where it closes up.',
    win: 'Out of the corner, and on to the ledge.',
  },
  chimney: {
    moves: 20,
    from: 17.2,
    to: 19.2,
    rest: 9,
    line: 'A chimney. Wide enough to get inside, and to rest in, until it flares at the top.',
    win: 'Out of the flare. The ledge is right there.',
  },
  traverse: {
    moves: 14,
    from: 7.8,
    to: 10,
    rest: null,
    line: 'More across than up. The rope runs sideways behind you, and the hard moves are in the middle.',
    win: 'Across. The ledge is a short way up.',
  },
  roof: {
    moves: 15,
    from: 10,
    to: 12.2,
    rest: null,
    line: 'Steep to a roof and out along it. The lip is the crux, high, with nowhere to shake out first.',
    win: 'Over the lip. The ledge is above you.',
  },
  slab: {
    moves: 18,
    from: 13.6,
    to: 15.8,
    rest: 5,
    line: 'A slab. Padding to a stance, and above it the blank bit where the friction runs out.',
    win: 'Through the blank bit. Padding to the ledge.',
  },
};

// A wall's pitch in its kind's shape: the library pitch's crux, moved and renamed by kind,
// whose moves inRock then swaps for the rock's.
function wallPitch(
  wall: string,
  n: number,
  name: string,
  grade: number,
  type: Style,
  place: string,
  kind: PitchKind,
): RouteDef {
  const k = PITCH_KINDS[kind];
  const r = libraryPitch(wall, n, name, grade, type, place);
  return {
    ...r,
    kind,
    moves: k.moves,
    line: `Pitch ${n}. ${k.line}`,
    cruxes: [{ ...r.cruxes[0]!, from: k.from, to: k.to, win: k.win }],
    rest: k.rest === null ? null : { at: k.rest, radius: 0.8 },
    bolts: boltsFor(k.moves),
  };
}

const pitches = (wall: string, place: string, list: [string, number, Style, PitchKind][]): RouteDef[] =>
  list.map(([name, grade, type, kind], i) => wallPitch(wall, i + 1, name, grade, type, place, kind));

// The later crags' lines, the Bluff's and the Hollow's, and the Big Stone's walls: the full game's
// (routes.full.ts), and none in the demo's build (routes.demo.ts, Phase 14.5b). Made here, once
// the makers they're built with are ready.
const LATER = laterLines({ libraryBoulder, librarySport, libraryTrad, pitches });

const PITCHES: RouteDef[] = [
  ...pitches('prow', 'road', [
    ['Slab Start', 3, 'technical', 'slab'],
    ['The Crimp Ladder', 4, 'crimp', 'face'],
    ['The Roof Crux', 5, 'power', 'roof'],
    ['Summit Headwall', 4, 'endurance', 'crack'],
  ]),
  ...LATER.pitches,
];

export const WALLS: Record<string, WallDef> = {
  prow: {
    name: 'The Long Prow',
    place: 'road',
    grade: 5,
    pitches: PITCHES.filter((r) => r.wall === 'prow').map((r) => r.id),
    line: 'Four pitches up the prow above Roadside. The roof on the third is the whole story.',
  },
  ...LATER.walls,
};

const LINES: Record<string, RouteDef> = {
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
  ...LATER.lines,
  ...Object.fromEntries(PITCHES.map((r) => [r.id, r])),
};

// A highball is any boulder outdoors from HIGHBALL.fromFt up, set by its height and never by
// hand (Evan's call, 30 Sep 2026), so a new crag's tall problems can't be left falling free.
// A deep-water solo lands in the sea.
export const isHighball = (r: RouteDef): boolean =>
  r.disc === 'boulder' && !r.dws && !r.board && r.heightFt >= HIGHBALL.fromFt;

// Phase 27.5: a highball's top-out. Every boulder tall enough to be a highball gets a second
// crux at its lip, past where the line used to end, so there are two places to fall, the
// higher one harder to land, and where the pad goes is a choice. It plays as LIBRARY's
// technical pair, whose verb and numbers the rock's moves keep (inRock), and the height
// stays, so the line's first crux comes off lower than it did.
export const TOP_OUT = { name: 'The top-out', moves: 2, from: 0.4, to: 1.6, win: 'Over the lip. Stand up.' };

function topOut(r: RouteDef): RouteDef {
  const [t1, t2] = LIBRARY.technical;
  const b1 = { ...t1, ...HIGHBALL.topOut.first };
  const b2 = { ...t2, ...HIGHBALL.topOut.earned };
  const end = r.moves;
  return {
    ...r,
    moves: end + TOP_OUT.moves,
    cruxes: [
      ...r.cruxes.map((c) =>
        c.win === 'Through it. Top out.' ? { ...c, win: 'Through it. Now the top.' } : c,
      ),
      {
        id: 'B',
        name: TOP_OUT.name,
        from: end + TOP_OUT.from,
        to: end + TOP_OUT.to,
        win: TOP_OUT.win,
        beta: ['B1', 'B2'],
      },
    ],
    beta: { ...r.beta, B1: b1, B2: b2 },
  };
}

// Phase 27.2: an outdoor line's cruxes in its rock's moves (content/rock.ts), in place of the
// plastic library's. A move plays as the beta it replaces did, its verb, window and costs
// kept (the Local Testpiece's were tuned by hand), so how hard a line is doesn't move; a
// move of another verb is a mistake in the table, said loudly. What changes is its name, its
// words, and the style it leans on. A roped line's second crux takes two falls to earn, as
// librarySport's did.
function inRock(r: RouteDef): RouteDef {
  const crux = ROCK_LINES[r.id];
  if (!crux) return r;
  const rock = PLACES[r.place]?.rock;
  const moves = rock ? ROCK_MOVES[rock] : undefined;
  if (!moves || crux.length !== r.cruxes.length) throw new Error(`${r.id}: no rock moves for its cruxes`);
  const beta = { ...r.beta };
  r.cruxes.forEach((c, i) => {
    crux[i]!.forEach((id, k) => {
      const key = c.beta[k]!;
      const was = r.beta[key]!;
      const move = moves[id];
      if (!move || move.verb !== was.verb) throw new Error(`${r.id} ${key}: ${id} isn't a ${was.verb} move`);
      const { w: _w, rate: _r, need: _n, skin: _s, ...words } = move;
      const plays = {
        w: was.w,
        ...(was.rate !== undefined ? { rate: was.rate, need: was.need } : {}),
        ...(was.skin !== undefined ? { skin: was.skin } : {}),
      };
      const falls = k === 1 && i > 0 && roped(r) ? 2 : move.unlock?.falls;
      beta[key] = {
        ...words,
        ...plays,
        ...(move.unlock ? { unlock: { ...move.unlock, falls: falls! } } : {}),
      };
    });
  });
  return { ...r, beta };
}

export const ROUTES: Record<string, RouteDef> = Object.fromEntries(
  Object.entries(LINES).map(([id, l]) => {
    const r = inRock(isHighball(l) ? topOut(l) : l);
    return [id, isHighball(r) ? { ...r, highball: true as const } : r];
  }),
);

// Said when you come off between cruxes with nothing left in your arms.
export const PUMPED = 'Pumped. Your forearms quit before you do.';

export const SEND_NAME: Record<GoStyle, string> = {
  onsight: 'Onsight',
  flash: 'Flash',
  redpoint: 'Redpoint',
  repeat: 'Repeat',
};

// Calling the flash or the onsight (Phase 27.4): the toggle on the beta sheet, what you say
// before the go, and what's said after it. {style} is flash or onsight.
export const CALL_SAYS = {
  label: 'Call the {style}',
  note: 'Say it before you start. Send it, and you’ll feel it tonight. Fall, and you’ll feel that too.',
  call: 'You call the {style} before you start. Everyone heard.',
  sent: 'You called the {style}, and it went.',
  fell: 'You called it, and it didn’t go. That’ll sit with you tonight.',
};
