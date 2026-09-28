// Where things are on screen. The rules never see any of this: scenes, hotspots and pins
// are staging, keyed to content ids so the painters and the sim meet only through ids.

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

// What tapping a thing in a scene does.
export type Use =
  { sheet: 'van' | 'cragVan' } | { talk: string } | { thing: string; wag?: true } | { route: string };

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
  spawn: number;
  hint: string;
  hots: Hot[];
}

// The crag base's routes, left to right, with the numbers on their tags.
export const BASE_ROUTES = [
  { n: 1, x: 420, route: 'warmup' },
  { n: 2, x: 560, route: 'roadside' },
  { n: 3, x: 700, route: 'pump' },
  { n: 4, x: 840, route: 'testpiece' },
];

export const SCENES: Record<string, SceneLayout> = {
  lot: {
    spawn: 300,
    hint: 'Tap anywhere to walk',
    hots: [
      { x0: 112, x1: 330, y0: 430, y1: GND + 8, stand: 300, face: -1, use: { sheet: 'van' } },
      { x0: 566, x1: 608, y0: GND - 64, y1: GND + 8, stand: 548, face: 1, use: { talk: 'hazel-lot' } },
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
    spawn: 180,
    hint: 'The Pump is route 3. Walk right.',
    hots: [
      { x0: 34, x1: 234, y0: 440, y1: GND + 8, stand: 196, face: -1, use: { sheet: 'cragVan' } },
      ...BASE_ROUTES.map((r): Hot => ({
        x0: r.x - 26,
        x1: r.x + 26,
        y0: 110,
        y1: GND + 8,
        stand: r.x - 30,
        face: 1,
        use: { route: r.route },
      })),
      { x0: 746, x1: 778, y0: GND - 64, y1: GND + 8, stand: 738, face: 1, use: { talk: 'hazel-crag' } },
    ],
  },
};

// Where you stand after sleeping, and after walking off the wall.
export const WAKE_X = 340;
export const WALK_OFF_X = 670;

// Where speech bubbles point: the speaker's head, in world coordinates.
export const ANCHORS: Record<string, { wx: number; wy: number }> = {
  'hazel-lot': { wx: 586, wy: GND - 66 },
  'hazel-crag': { wx: 760, wy: GND - 66 },
};

// The map: live pins by place id (label side, and what kind of place colours the pin), and
// the valley's other places, dimmed.
export type PinKind = 'camp' | 'town' | 'crag';
export const MAP_PINS: Record<string, { x: number; y: number; side: 1 | -1; kind: PinKind }> = {
  lot: { x: 262, y: 612, side: 1, kind: 'camp' },
  diner: { x: 96, y: 458, side: 1, kind: 'town' },
  road: { x: 292, y: 220, side: -1, kind: 'crag' },
};
export const DIM_PINS: [number, number][] = [
  [282, 414],
  [282, 476],
  [266, 334],
  [78, 612],
  [84, 150],
];
