// Where things are on screen. The rules never see any of this: scenes, hotspots and pins
// are staging, keyed to content ids so the painters and the sim meet only through ids.

import { whereNow, type Crowd, type GameState } from '../sim';
import { mulberry32 } from './kit/noise';

// A portrait phone screen in logical pixels; the page scales it to fit the device. The
// screen is always H tall. It is W wide in portrait, and on a wider window it widens to
// match, up to W_MAX, so a landscape screen sees more of the world rather than a phone
// column in a black frame. W stays the width of everything composed for portrait: the map's
// valley, a wall close up, and the panels.
export const W = 360;
export const H = 740;

// Scenes are side-on worlds with the ground at 560, framed at 1.3x so people read on a
// phone, with the ground line at screen y 612. Each is as wide as its place needs; WW is
// the width of the ones that don't say.
export const WW = 960;
export const GND = 560;
export const Z = 1.3;
export const OY = 612 - GND * Z;

// The widest the screen gets: the narrowest scene (the Lot, WW) at the scenes' zoom, so no
// scene ever shows past its ends. About 16:9.5; a Steam Deck or a 16:10 laptop fits inside
// it, and a 16:9 monitor gets a sliver of frame at each side. layout.test.ts holds every
// scene to it.
export const W_MAX = Math.round(WW * Z);
// From this wide, a sheet docks at the right instead of over the world's bottom half. It's
// where a sheet 360 across clears a portrait column in the middle (the map's valley, a
// wall close up): W / 2 + W / 2 + 360 each side of the centre.
export const WIDE = 1080;

// The screen's width for a window of this shape (width over height).
export const screenWidth = (aspect: number): number => Math.min(W_MAX, Math.max(W, Math.round(H * aspect)));

// What tapping a thing in a scene does. A gym problem is named by its place on the wall,
// since the set (and so its id) changes every week.
export type Use =
  | { sheet: 'van' | 'cragVan' | 'desk' | 'board' | 'speed' }
  | { talk: string }
  | { thing: string; wag?: true }
  | { route: string }
  | { problem: number }
  | { wall: string }
  // Phase 25.6: one of the strangers at a busy crag.
  | { crowd: number };

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
  // Where the place card's header looks: the middle of what it shows, where the people
  // who'd be there stand.
  frame: number;
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
  // The middle of its place card's header.
  frame: number;
  // Its multi-pitch walls (Phase 21.5): where each one starts up the rock.
  walls?: { x: number; wall: string }[];
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
      // The arête at the wall's end, with no bolts on it.
      { n: 5, x: 945, route: 'tradarete' },
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
    walls: [{ x: 300, wall: 'prow' }],
    // The belay under The Pump, Sage by the Testpiece and Dex in the boulder field.
    frame: 930,
  },
  // The Gorge: granite in the shade, three bolted lines and a trad corner up the canyon wall, boulders on
  // its floor either side.
  gorge: {
    width: 1340,
    wall: [300, 1360],
    lines: [
      { n: 1, x: 560, route: 'gintro' },
      { n: 2, x: 820, route: 'gclassic' },
      // The corner between the Classic and Power Endurance takes gear, not bolts.
      { n: 3, x: 950, route: 'gtrad' },
      { n: 4, x: 1080, route: 'gpe' },
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
    // Sage on belay under the first line, and the classic.
    frame: 760,
  },
  // Moonstone: sand, sky and quartzite boulders the size of houses, and a spire in the
  // middle with two bolted lines on it.
  moon: {
    width: 1400,
    wall: [620, 1040],
    lines: [
      { n: 1, x: 680, route: 'mspire' },
      { n: 2, x: 750, route: 'mmoon' },
    ],
    boulders: [
      { x: 380, w: 92, h: 150, route: 'marete' },
      { x: 500, w: 80, h: 90, route: 'mmantel' },
      { x: 590, w: 70, h: 84, route: 'megg' },
      { x: 850, w: 84, h: 104, route: 'mhueco' },
      { x: 970, w: 96, h: 132, route: 'msplitter' },
      { x: 1110, w: 116, h: 78, route: 'mroof' },
      { x: 1262, w: 104, h: 150, route: 'mopen' },
    ],
    sign: 272,
    hint: 'Highballs on the sand. The spire needs a belayer.',
    // The spire, with a highball either side.
    frame: 760,
  },
  // Psicobloc Cove: a limestone sea cliff, its eight deep-water lines up it from a rock
  // shelf above the water. No boulders: the sea's where they'd be.
  cove: {
    width: 1500,
    wall: [480, 1500],
    lines: [
      { n: 1, x: 560, route: 'ptide' },
      { n: 2, x: 670, route: 'pplunge' },
      { n: 3, x: 780, route: 'pslab' },
      { n: 4, x: 890, route: 'pbarnacle' },
      { n: 5, x: 1000, route: 'pleap' },
      { n: 6, x: 1110, route: 'poverhang' },
      { n: 7, x: 1220, route: 'parete' },
      { n: 8, x: 1330, route: 'pdeep' },
    ],
    boulders: [],
    sign: 272,
    hint: 'Pick a line and pull on. The sea catches you.',
    frame: 900,
  },
  // Miller's Bluff (Phase 18.6): a grey limestone wall on the back of a farm, six lines up it
  // and three boulders in the field, none of them ever climbed till you bolt them.
  bluff: {
    width: 1500,
    wall: [480, 1240],
    lines: [
      { n: 1, x: 580, route: 'bbarn' },
      { n: 2, x: 700, route: 'btufa' },
      { n: 3, x: 820, route: 'bcow' },
      { n: 4, x: 940, route: 'bpillar' },
      { n: 5, x: 1060, route: 'broof' },
      { n: 6, x: 1180, route: 'blong' },
    ],
    boulders: [
      { x: 360, w: 70, h: 52, route: 'bhay' },
      { x: 1320, w: 76, h: 58, route: 'btrough' },
      { x: 1430, w: 72, h: 84, route: 'bsilo' },
    ],
    sign: 272,
    hint: 'Nobody’s ever climbed here. Pick a line and bolt it.',
    frame: 880,
  },
  // The Crucible: a black gneiss wall with four roped lines, the myth the last of them, and
  // boulders on the frozen ground either side; the boulder myth out past Event Horizon.
  crucible: {
    width: 1600,
    wall: [640, 1220],
    lines: [
      { n: 1, x: 720, route: 'ccrux' },
      { n: 2, x: 840, route: 'clifeline' },
      { n: 3, x: 960, route: 'cthreshold' },
      { n: 4, x: 1080, route: 'cmyth' },
    ],
    boulders: [
      { x: 340, w: 80, h: 54, route: 'creckoning' },
      { x: 460, w: 70, h: 60, route: 'cvise' },
      { x: 570, w: 64, h: 50, route: 'capparition' },
      { x: 1290, w: 76, h: 62, route: 'canvil' },
      { x: 1400, w: 84, h: 68, route: 'chorizon' },
      { x: 1510, w: 72, h: 58, route: 'cgenesis' },
    ],
    sign: 272,
    hint: 'Nothing here is easy. The wall needs a belayer.',
    frame: 920,
  },
  // Wind River: an alpine wall with four roped lines, boulders by the lake either side.
  wind: {
    width: 1560,
    wall: [620, 1240],
    lines: [
      { n: 1, x: 700, route: 'wglacier' },
      { n: 2, x: 820, route: 'wskyline' },
      { n: 3, x: 940, route: 'wastroman' },
      { n: 4, x: 1060, route: 'wtrad' },
    ],
    boulders: [
      { x: 340, w: 80, h: 52, route: 'walpine' },
      { x: 480, w: 70, h: 60, route: 'wdiamond' },
      { x: 1300, w: 84, h: 70, route: 'woffwidth' },
      { x: 1400, w: 66, h: 56, route: 'wthin' },
      { x: 1500, w: 60, h: 64, route: 'wopen' },
    ],
    sign: 272,
    hint: 'Boulders by the lake. The wall needs a belayer, and a jacket.',
    // The wall.
    frame: 900,
  },
  // The Big Stone: a granite big wall filling the right of the scene, its two single
  // pitches on it, and boulders in the meadow at its foot.
  stone: {
    width: 1400,
    wall: [560, 1400],
    lines: [
      { n: 1, x: 780, route: 'bclassic' },
      // Up the corner system.
      { n: 2, x: 966, route: 'btrad' },
    ],
    boulders: [
      { x: 350, w: 90, h: 54, route: 'bbase' },
      { x: 1110, w: 84, h: 70, route: 'bwarm' },
      { x: 1260, w: 80, h: 96, route: 'bsplit' },
    ],
    sign: 272,
    hint: 'Boulders in the meadow. The wall needs a belayer.',
    walls: [
      { x: 640, wall: 'golden' },
      { x: 1060, wall: 'obsidian' },
      { x: 1200, wall: 'ascendant' },
    ],
    // The foot of the wall.
    frame: 820,
  },
  // Sandstone Mesa: a red wall with three bolted lines and a crack, boulders on the sand
  // either side, and the Megaproject's block out past the end of it.
  mesa: {
    width: 1560,
    wall: [620, 1140],
    lines: [
      { n: 1, x: 700, route: 'sdlap' },
      { n: 2, x: 820, route: 'senduro' },
      { n: 3, x: 940, route: 'sbiglink' },
      { n: 4, x: 1060, route: 'sdtrad' },
    ],
    boulders: [
      { x: 340, w: 96, h: 50, route: 'svarnish' },
      { x: 470, w: 60, h: 48, route: 'scrimps' },
      { x: 590, w: 84, h: 60, route: 'ssplit' },
      { x: 1170, w: 74, h: 70, route: 'sprow' },
      { x: 1270, w: 72, h: 44, route: 'spowerhouse' },
      { x: 1370, w: 60, h: 56, route: 'smega' },
      { x: 1480, w: 66, h: 54, route: 'sopen' },
    ],
    sign: 272,
    hint: 'Boulders on the sand. The wall needs a belayer.',
    // The wall, and the Prow past its end.
    frame: 900,
  },
};

// Send City: the desk by the door, then six problems along the wall, V0 to V5, and past the
// end of the wall the board, where the hard problems live.
export const DESK_X = 170;
export const PROBLEM_X = [384, 474, 564, 654, 744, 834];
export const BOARD_X0 = 990;
export const BOARD_X1 = 1190;
// Past the board, the speed wall (Phase 21.6): two lanes, taller than the room.
export const SPEED_X0 = 1270;
export const SPEED_X1 = 1400;
// The lane you race in, and the one beside it.
export const SPEED_LANE = 1302;
export const GYM_W = 1470;
// The Cave: the desk by the door, then eight problems out its steep walls, V3 to V10.
export const CAVE_X = [360, 440, 520, 600, 690, 780, 870, 960];
export const CAVE_W = 1150;
// The Training Center: the desk, then eight comp problems along its white walls, V7 to V14.
export const CENTER_X = [360, 445, 530, 615, 700, 785, 870, 955];
export const CENTER_W = 1150;

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
    frame: c.frame,
    hots: [
      { x0: 34, x1: 234, y0: 440, y1: GND + 8, stand: 196, face: -1, use: { sheet: 'cragVan' } },
      // Boulders first: they stand in front of the wall, so a tap on one is for it.
      ...c.boulders.map((b) => wallHot(b.x, { route: b.route }, b.w / 2, GND - b.h - 16)),
      // A wall's start, high on the rock, above anything you'd walk up to.
      ...(c.walls ?? []).map((w) => ({
        x0: w.x - 34,
        x1: w.x + 34,
        y0: 40,
        y1: GND - 170,
        stand: w.x - 30,
        face: 1 as const,
        use: { wall: w.wall },
      })),
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
    // The van, the fire and whoever's at it.
    frame: 440,
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
  moon: cragScene('moon', CRAGS.moon!),
  mesa: cragScene('mesa', CRAGS.mesa!),
  stone: cragScene('stone', CRAGS.stone!),
  wind: cragScene('wind', CRAGS.wind!),
  crucible: cragScene('crucible', CRAGS.crucible!),
  cove: cragScene('cove', CRAGS.cove!),
  bluff: cragScene('bluff', CRAGS.bluff!),
  cave: {
    place: 'cave',
    width: CAVE_W,
    spawn: 70,
    hint: 'Day pass at the desk. The set changes every week.',
    frame: 560,
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
      ...CAVE_X.map((x, n) => wallHot(x, { problem: n }, 34, GND - 210)),
    ],
  },
  center: {
    place: 'center',
    width: CENTER_W,
    spawn: 70,
    hint: 'Day pass at the desk. The comp set changes every week.',
    frame: 560,
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
      ...CENTER_X.map((x, n) => wallHot(x, { problem: n }, 34, GND - 240)),
    ],
  },
  gym: {
    place: 'gym',
    width: GYM_W,
    spawn: 70,
    hint: 'Day pass at the desk. New problems every week.',
    // The desk, Sage's corner and the wall.
    frame: 470,
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
      {
        x0: SPEED_X0,
        x1: SPEED_X1,
        y0: 20,
        y1: GND + 8,
        stand: SPEED_LANE,
        face: 1,
        use: { sheet: 'speed' },
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
  lot: [
    { who: 'hazel', x: 586, face: -1, pose: 'mug', talk: 'hazel-lot' },
    // Frank, past Hazel's van, by his rig.
    { who: 'frank', x: 905, face: -1, pose: 'stand', talk: 'frank' },
  ],
  crag: [
    { who: 'hazel', x: 760, face: -1, pose: 'belay', talk: 'hazel-crag' },
    { who: 'sage', x: 904, face: -1, pose: 'stand', talk: 'sage' },
    // Dex works the boulder field, by the project.
    { who: 'dex', x: 1168, face: 1, pose: 'stand', talk: 'dex' },
    // Ray, on the guardrail at the wall's end, where he can see all of it.
    { who: 'ray', x: 1052, face: -1, pose: 'mug', talk: 'ray' },
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
    // Mara, under the classic: her warm-up.
    { who: 'mara', x: 878, face: -1, pose: 'belay', talk: 'mara' },
  ],
  // Nobody's day brings them out here, but Dex stays wherever he first saw you send a V4.
  moon: [
    { who: 'dex', x: 1190, face: -1, pose: 'stand', talk: 'dex' },
    { who: 'rico', x: 905, face: 1, pose: 'stand', talk: 'rico' },
  ],
  mesa: [
    { who: 'dex', x: 1320, face: -1, pose: 'stand', talk: 'dex' },
    // Tam, in the wall's morning shade, between the long lines.
    { who: 'tam', x: 880, face: -1, pose: 'belay', talk: 'tam' },
  ],
  stone: [{ who: 'dex', x: 1180, face: -1, pose: 'stand', talk: 'dex' }],
  wind: [{ who: 'dex', x: 1350, face: -1, pose: 'stand', talk: 'dex' }],
  crucible: [{ who: 'dex', x: 1340, face: -1, pose: 'stand', talk: 'dex' }],
  cove: [{ who: 'dex', x: 420, face: 1, pose: 'stand', talk: 'dex' }],
  // Nobody's day brings them to private land (Phase 18.6).
  bluff: [],
  cave: [
    { who: 'dex', x: 1020, face: -1, pose: 'stand', talk: 'dex' },
    // Rico, under the steepest of the week's problems.
    { who: 'rico', x: 1090, face: -1, pose: 'stand', talk: 'rico' },
  ],
  center: [{ who: 'dex', x: 1030, face: -1, pose: 'stand', talk: 'dex' }],
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
  // The gear shop: on the highway into Midtown, a block short of the café.
  shop: { x: 240, y: 540, side: 1, kind: 'town' },
  // The Warehouse: on the flats by the river, down a short spur west of the highway.
  warehouse: { x: 190, y: 572, side: -1, kind: 'town' },
  // The Clinic: Old Town, round the corner from the diner (Phase 22.4a).
  clinic: { x: 104, y: 424, side: 1, kind: 'town' },
  // The Lake: west of the Lot, on its east shore, past the creek (Phase 22.3b).
  lake: { x: 108, y: 604, side: 1, kind: 'camp', dy: -12 },
  // The Market: Midtown, across the street from the café. Labelled to its left: to the
  // right, a phone's screen cut its name off (Evan, 0.975.0).
  market: { x: 318, y: 446, side: -1, kind: 'town' },
  // The Garage: east of the highway past the gear shop, down a short street. Labelled to its
  // left, as the market is.
  garage: { x: 300, y: 562, side: -1, kind: 'town' },
  road: { x: 292, y: 220, side: -1, kind: 'crag' },
  gorge: { x: 96, y: 150, side: 1, kind: 'crag', dy: -16 },
  // Out of the valley where the highway leaves it, north past Roadside.
  moon: { x: 336, y: 100, side: -1, kind: 'crag' },
  // West off the highway on a desert road, past the valley's rim.
  mesa: { x: 200, y: 60, side: -1, kind: 'crag' },
  // Up the highway past where it leaves the valley.
  stone: { x: 346, y: 34, side: -1, kind: 'crag' },
  // On past the Gorge, where its dirt road climbs out of the valley.
  wind: { x: 40, y: 108, side: 1, kind: 'crag' },
  // East out of the valley, over the pass above Midtown.
  crucible: { x: 338, y: 372, side: -1, kind: 'crag', dy: 16 },
  // West past Old Town, down to the coast.
  cove: { x: 24, y: 506, side: 1, kind: 'crag', dy: 14 },
  // Miller's Bluff (Phase 18.6): east of the Lot, down a farm track.
  bluff: { x: 352, y: 590, side: -1, kind: 'crag', dy: -10 },
  // The Cave: at the trailhead hamlet on the highway, below Roadside.
  cave: { x: 266, y: 334, side: 1, kind: 'town' },
  // The Training Center: Midtown, west of the highway, down a side street between blocks.
  center: { x: 172, y: 402, side: -1, kind: 'town' },
};
// The lake was dimmed until Phase 22.3b opened it; nothing is dimmed now.
export const DIM_PINS: [number, number][] = [];

// The valley on the screen: scaled a little, about the middle, so its pins (The Big Stone
// at the top, the Lot at the bottom) sit between the HUD and the caption above and the goal
// chip and buttons below. Drawn full size, the top crags hid under the HUD on a phone.
export const MAP_FIT = { top: 112, bottom: 648, from: 34, to: 612 };
export const MAP_K = (MAP_FIT.bottom - MAP_FIT.top) / (MAP_FIT.to - MAP_FIT.from);
// A point on the map to the screen's valley column, and back.
export const mapToScreen = (x: number, y: number): [number, number] => [
  W / 2 + (x - W / 2) * MAP_K,
  MAP_FIT.top + (y - MAP_FIT.from) * MAP_K,
];
export const screenToMap = (x: number, y: number): [number, number] => [
  W / 2 + (x - W / 2) / MAP_K,
  MAP_FIT.from + (y - MAP_FIT.top) / MAP_K,
];

// Phase 25.6: the strangers at a crag, the same ones all day: as many as the crowd, each by
// a line or a boulder, facing one way or the other, some sitting. Drawn and tapped alike.
export interface Stranger {
  x: number;
  dir: 1 | -1;
  sit: boolean;
}
export function strangersAt(place: string, crag: CragSpec, day: number, crowd: Crowd): Stranger[] {
  const n = { empty: 0, quiet: 1, busy: 3, packed: 5 }[crowd];
  const spots = [...crag.lines.map((l) => l.x), ...crag.boulders.map((b) => b.x)];
  const r = mulberry32(day * 131 + place.length * 17 + spots.length);
  const out: Stranger[] = [];
  for (let i = 0; i < n && spots.length; i++) {
    const x = spots.splice(Math.floor(r() * spots.length), 1)[0]! + (r() - 0.5) * 36;
    out.push({ x, dir: r() < 0.5 ? -1 : 1, sit: r() < 0.25 });
  }
  return out;
}

export const strangerHot = (p: Stranger, i: number): Hot => ({
  x0: p.x - 14,
  x1: p.x + 14,
  y0: GND - 64,
  y1: GND + 8,
  stand: p.x - p.dir * 34,
  face: p.dir > 0 ? -1 : 1,
  use: { crowd: i },
});
