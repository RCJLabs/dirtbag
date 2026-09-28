// Where things are on screen. The rules never see any of this: scenes, hotspots and pins
// are staging, keyed to content ids so the painters and the sim meet only through ids.

import { whereIs, type GameState } from '../sim';

// A portrait phone screen in logical pixels; the page scales it to fit the device.
export const W = 360;
export const H = 740;

// Scenes are 960 px wide side-on worlds with the ground at 560, framed at 1.3x so people
// read on a phone, with the ground line at screen y 612.
export const WW = 960;
export const GND = 560;
export const Z = 1.3;
export const OY = 612 - GND * Z;
export const VW = W / Z;

// What tapping a thing in a scene does. A gym problem is named by its place on the wall,
// since the set (and so its id) changes every week.
export type Use =
  | { sheet: 'van' | 'cragVan' | 'desk' }
  | { talk: string }
  | { thing: string; wag?: true }
  | { route: string }
  | { problem: number };

export interface Hot {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  // Where you walk to before using it, and which way you face.
  stand: number;
  face: 1 | -1;
  use: Use;
}

export interface SceneLayout {
  // The place this scene is.
  place: string;
  spawn: number;
  hint: string;
  hots: Hot[];
}

// Roadside's sport lines on the wall, left to right, with the numbers on their tags.
export const BASE_ROUTES = [
  { n: 1, x: 420, route: 'warmup' },
  { n: 2, x: 560, route: 'roadside' },
  { n: 3, x: 700, route: 'pump' },
  { n: 4, x: 840, route: 'testpiece' },
];

// Its boulders, on the talus at the foot of the wall: centre, width, height.
export const BOULDERS = [
  { x: 340, w: 68, h: 50, route: 'warm' },
  { x: 490, w: 60, h: 46, route: 'dyno' },
  { x: 630, w: 74, h: 58, route: 'crimpfest' },
];

// Send City: the desk by the door, then six problems along the wall, V0 to V5.
export const DESK_X = 170;
export const PROBLEM_X = [384, 474, 564, 654, 744, 834];

const wallHot = (x: number, use: Use, half = 26, y0 = 110): Hot => ({
  x0: x - half,
  x1: x + half,
  y0,
  y1: GND + 8,
  stand: x - 30,
  face: 1,
  use,
});

export const SCENES: Record<string, SceneLayout> = {
  lot: {
    place: 'lot',
    spawn: 300,
    hint: 'Tap anywhere to walk',
    hots: [
      { x0: 112, x1: 330, y0: 430, y1: GND + 8, stand: 300, face: -1, use: { sheet: 'van' } },
      { x0: 494, x1: 546, y0: GND - 44, y1: GND + 12, stand: 500, face: 1, use: { thing: 'fire' } },
      {
        x0: 412,
        x1: 466,
        y0: GND - 26,
        y1: GND + 12,
        stand: 474,
        face: -1,
        use: { thing: 'scout', wag: true },
      },
      { x0: 700, x1: 860, y0: 450, y1: GND + 8, stand: 688, face: 1, use: { thing: 'hazel-van' } },
    ],
  },
  crag: {
    place: 'road',
    spawn: 180,
    hint: 'Boulders on the talus, ropes on the wall',
    hots: [
      { x0: 34, x1: 234, y0: 440, y1: GND + 8, stand: 196, face: -1, use: { sheet: 'cragVan' } },
      // Boulders first: they stand in front of the wall, so a tap on one is for it.
      ...BOULDERS.map((b) => wallHot(b.x, { route: b.route }, b.w / 2, GND - b.h - 16)),
      ...BASE_ROUTES.map((r) => wallHot(r.x, { route: r.route })),
    ],
  },
  gym: {
    place: 'gym',
    spawn: 70,
    hint: 'Day pass at the desk. New problems every week.',
    hots: [
      {
        x0: DESK_X - 56,
        x1: DESK_X + 56,
        y0: GND - 70,
        y1: GND + 8,
        stand: DESK_X + 70,
        face: -1,
        use: { sheet: 'desk' },
      },
      ...PROBLEM_X.map((x, n) => wallHot(x, { problem: n }, 34, GND - 210)),
    ],
  },
};

// Where each person stands in a scene while they're at its place. You talk to them there.
export interface Spot {
  who: string;
  x: number;
  face: 1 | -1;
  pose: 'mug' | 'belay' | 'stand';
  talk: string;
}

export const SPOTS: Record<string, Spot[]> = {
  lot: [{ who: 'hazel', x: 586, face: -1, pose: 'mug', talk: 'hazel-lot' }],
  crag: [
    { who: 'hazel', x: 760, face: -1, pose: 'belay', talk: 'hazel-crag' },
    { who: 'sage', x: 904, face: -1, pose: 'stand', talk: 'sage' },
  ],
  gym: [{ who: 'sage', x: 292, face: 1, pose: 'stand', talk: 'sage' }],
};

// Who's in a scene right now: the people whose day puts them at its place.
export function presentIn(s: GameState, scene: string): Spot[] {
  const place = SCENES[scene]?.place;
  return (SPOTS[scene] ?? []).filter((p) => whereIs(s.seed, p.who, s.day, s.min) === place);
}

// You stand in front of them, facing them.
export const spotHot = (s: Spot): Hot => ({
  x0: s.x - 20,
  x1: s.x + 20,
  y0: GND - 64,
  y1: GND + 8,
  stand: s.x + s.face * 38,
  face: s.face > 0 ? -1 : 1,
  use: { talk: s.talk },
});

// Speech bubbles point at the speaker's head.
export const HEAD_Y = GND - 66;

// Where you stand after sleeping.
export const WAKE_X = 340;

// The map: live pins by place id (label side, and what kind of place colours the pin), and
// the valley's other places, dimmed.
export type PinKind = 'camp' | 'town' | 'crag';
export const MAP_PINS: Record<string, { x: number; y: number; side: 1 | -1; kind: PinKind }> = {
  lot: { x: 262, y: 612, side: 1, kind: 'camp' },
  diner: { x: 96, y: 458, side: 1, kind: 'town' },
  gym: { x: 282, y: 414, side: -1, kind: 'town' },
  cafe: { x: 282, y: 476, side: -1, kind: 'town' },
  road: { x: 292, y: 220, side: -1, kind: 'crag' },
};
export const DIM_PINS: [number, number][] = [
  [266, 334],
  [78, 612],
  [84, 150],
];
