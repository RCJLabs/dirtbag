// Where things are on screen. The rules never see any of this: scenes, hotspots and pins
// are staging, keyed to content ids so the painters and the sim meet only through ids.

import { whereNow, type GameState } from '../sim';

// A portrait phone screen in logical pixels; the page scales it to fit the device.
export const W = 360;
export const H = 740;

// Scenes are side-on worlds with the ground at 560, framed at 1.3x so people read on a
// phone, with the ground line at screen y 612. Each is as wide as its place needs; WW is
// the width of the ones that don't say.
export const WW = 960;
export const GND = 560;
export const Z = 1.3;
export const OY = 612 - GND * Z;
export const VW = W / Z;

// What tapping a thing in a scene does. A gym problem is named by its place on the wall,
// since the set (and so its id) changes every week.
export type Use =
  | { sheet: 'van' | 'cragVan' | 'desk' | 'board' }
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
  width: number;
  spawn: number;
  hint: string;
  hots: Hot[];
}

// A crag, side on: its wall (from its foot on the left to where it ends, which may be off
// the scene), the sport lines on it left to right with the numbers on their tags, and the
// boulders on the talus in front: centre, width, height.
export interface CragSpec {
  width: number;
  wall: [number, number];
  lines: { n: number; x: number; route: string }[];
  boulders: { x: number; w: number; h: number; route: string }[];
  // Where the crag's sign stands.
  sign: number;
  hint: string;
}

export const CRAGS: Record<string, CragSpec> = {
  // Roadside's wall ends in a boulder field: v0.956's crack, highball, project and the
  // line nobody's done sit past the last bolts.
  crag: {
    width: 1400,
    wall: [262, 1010],
    lines: [
      { n: 1, x: 420, route: 'warmup' },
      { n: 2, x: 560, route: 'roadside' },
      { n: 3, x: 700, route: 'pump' },
      { n: 4, x: 840, route: 'testpiece' },
    ],
    boulders: [
      { x: 340, w: 68, h: 50, route: 'warm' },
      { x: 490, w: 60, h: 46, route: 'dyno' },
      { x: 630, w: 74, h: 58, route: 'crimpfest' },
      { x: 1000, w: 72, h: 60, route: 'fingercrack' },
      { x: 1110, w: 78, h: 96, route: 'highball' },
      { x: 1220, w: 80, h: 62, route: 'project' },
      { x: 1320, w: 66, h: 54, route: 'rsopen' },
    ],
    sign: 272,
    hint: 'Boulders on the talus, ropes on the wall',
  },
  // The Gorge: granite in the shade, three bolted lines up the canyon wall, boulders on
  // its floor either side.
  gorge: {
    width: 1340,
    wall: [300, 1360],
    lines: [
      { n: 1, x: 560, route: 'gintro' },
      { n: 2, x: 820, route: 'gclassic' },
      { n: 3, x: 1080, route: 'gpe' },
    ],
    boulders: [
      { x: 380, w: 96, h: 46, route: 'gslab' },
      { x: 480, w: 62, h: 70, route: 'gserenity' },
      { x: 680, w: 72, h: 56, route: 'gpinch' },
      { x: 950, w: 70, h: 62, route: 'gdyno' },
      { x: 1180, w: 88, h: 84, route: 'gcathedral' },
      { x: 1270, w: 70, h: 64, route: 'gopen' },
    ],
    sign: 272,
    hint: 'The canyon floor’s all boulders. The bolts need a belayer.',
  },
};

// Send City: the desk by the door, then six problems along the wall, V0 to V5, and past the
// end of the wall the board, where the hard problems live.
export const DESK_X = 170;
export const PROBLEM_X = [384, 474, 564, 654, 744, 834];
export const BOARD_X0 = 990;
export const BOARD_X1 = 1190;
export const GYM_W = 1250;

const wallHot = (x: number, use: Use, half = 26, y0 = 110): Hot => ({
  x0: x - half,
  x1: x + half,
  y0,
  y1: GND + 8,
  stand: x - 30,
  face: 1,
  use,
});

// A crag's scene: the van on the left, then its boulders and lines.
function cragScene(place: string, c: CragSpec): SceneLayout {
  return {
    place,
    width: c.width,
    spawn: 180,
    hint: c.hint,
    hots: [
      { x0: 34, x1: 234, y0: 440, y1: GND + 8, stand: 196, face: -1, use: { sheet: 'cragVan' } },
      // Boulders first: they stand in front of the wall, so a tap on one is for it.
      ...c.boulders.map((b) => wallHot(b.x, { route: b.route }, b.w / 2, GND - b.h - 16)),
      ...c.lines.map((r) => wallHot(r.x, { route: r.route })),
    ],
  };
}

// How wide a scene is.
export const widthOf = (scene: string): number => SCENES[scene]?.width ?? WW;

export const SCENES: Record<string, SceneLayout> = {
  lot: {
    place: 'lot',
    width: WW,
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
  crag: cragScene('road', CRAGS.crag!),
  gorge: cragScene('gorge', CRAGS.gorge!),
  gym: {
    place: 'gym',
    width: GYM_W,
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
      // The board lists its problems: pick one and it lights up.
      {
        x0: BOARD_X0,
        x1: BOARD_X1,
        y0: GND - 220,
        y1: GND + 8,
        stand: (BOARD_X0 + BOARD_X1) / 2 - 40,
        face: 1,
        use: { sheet: 'board' },
      },
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
    // Dex works the boulder field, by the project.
    { who: 'dex', x: 1168, face: 1, pose: 'stand', talk: 'dex' },
  ],
  gym: [
    { who: 'sage', x: 292, face: 1, pose: 'stand', talk: 'sage' },
    { who: 'dex', x: 880, face: -1, pose: 'stand', talk: 'dex' },
  ],
  // Out at the Gorge only when you've asked, and then on belay under the first line. Dex
  // turns up here only the day he's watched your first V4 go.
  gorge: [
    { who: 'sage', x: 610, face: -1, pose: 'belay', talk: 'sage' },
    { who: 'dex', x: 1236, face: -1, pose: 'stand', talk: 'dex' },
  ],
};

// Who's in a scene right now: the people whose day puts them at its place.
export function presentIn(s: GameState, scene: string): Spot[] {
  const place = SCENES[scene]?.place;
  return (SPOTS[scene] ?? []).filter((p) => whereNow(s, p.who) === place);
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
// the valley's other places, dimmed. Granite Gorge sits on the western cliff band, at the
// end of the dirt road.
export type PinKind = 'camp' | 'town' | 'crag';
export interface Pin {
  x: number;
  y: number;
  side: 1 | -1;
  kind: PinKind;
  // Nudges the label up or down, off a road that runs beside the pin.
  dy?: number;
}
export const MAP_PINS: Record<string, Pin> = {
  lot: { x: 262, y: 612, side: 1, kind: 'camp' },
  diner: { x: 96, y: 458, side: 1, kind: 'town' },
  gym: { x: 282, y: 414, side: -1, kind: 'town' },
  cafe: { x: 282, y: 476, side: -1, kind: 'town' },
  road: { x: 292, y: 220, side: -1, kind: 'crag' },
  gorge: { x: 96, y: 150, side: 1, kind: 'crag', dy: -16 },
};
export const DIM_PINS: [number, number][] = [
  [266, 334],
  [78, 612],
];
