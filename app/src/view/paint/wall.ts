// The walls you look up at. Roadside's main wall and the Gorge's granite, face on, carry
// their sport lines, each drawn from its topo; boulders and Send City's problems have
// close-up walls of their own (boulder.ts, gym.ts). Whatever the wall, a route is mapped
// from moves (the sim's unit) to points along its line here, so the rules never see a pixel.

import { roped, ROUTES, type RouteDef } from '../../sim';
import { arcTable, atLen, lin, mk, poly, spline, trace, type G, type Pt } from '../kit/geom';
import { mulberry32 } from '../kit/noise';
import { H, W } from '../layout';
import { coniferPath, rock } from '../shapes';
import { boulderArt, boulderOutline, boulderTopo, paintBoulderArt } from './boulder';
import { boardTopo, boardWallArt, gymTopo, gymWallArt, paintBoardWall, paintGymWall } from './gym';

const SKY: Pt[] = [
  [-4, 130],
  [26, 120],
  [58, 127],
  [92, 108],
  [126, 116],
  [164, 100],
  [200, 110],
  [240, 97],
  [276, 113],
  [312, 104],
  [364, 118],
];
const BASE_Y = 540;
const WALLPOLY: Pt[] = [...SKY, [364, BASE_Y], [-4, BASE_Y]];
const FAR_RIDGE: Pt[] = [
  [-4, 108],
  [70, 88],
  [140, 100],
  [220, 82],
  [300, 98],
  [364, 86],
];
const SHADE: Pt[] = [
  [206, 0],
  [W, 0],
  [W, H],
  [150, H],
];
const ROOFSHADOW: Pt[] = [
  [236, 326],
  [346, 318],
  [346, 352],
  [248, 346],
];
const ROOFTOP: Pt[] = [
  [222, 298],
  [346, 288],
  [346, 294],
  [224, 304],
];
const LEDGE: Pt[] = [
  [172, 386],
  [212, 382],
  [252, 380],
];
const LEDGE_SH: Pt[] = [
  [176, 389],
  [252, 383],
  [250, 396],
  [178, 398],
];
const CRACKS: Pt[][] = [
  [
    [112, 536],
    [108, 470],
    [116, 420],
    [106, 360],
    [114, 300],
    [106, 236],
    [110, 168],
  ],
  [
    [330, 530],
    [322, 470],
    [334, 420],
    [326, 360],
  ],
  [
    [40, 520],
    [48, 440],
    [38, 380],
    [46, 300],
  ],
];
const CRAG_TREES: [number, number, number][] = [
  [18, 562, 1.1],
  [346, 558, 1],
];
// Your belayer stands on the talus a step left of the route's first moves.
const BELAY_Y = 586;

// Each route's line on its wall, bottom to top, keyed by route id. The Gorge's lines are
// taller, and their features sit where their cruxes are: the Classic's overlap a third of
// the way up, the roof on Power Endurance just past it.
const TOPO_PTS: Record<string, Pt[]> = {
  gintro: [
    [70, 538],
    [64, 470],
    [78, 400],
    [70, 330],
    [82, 262],
    [74, 190],
    [80, 124],
  ],
  gclassic: [
    [180, 540],
    [186, 470],
    [172, 410],
    [190, 372],
    [184, 300],
    [176, 226],
    [188, 160],
    [182, 118],
  ],
  gpe: [
    [292, 540],
    [284, 480],
    [296, 430],
    [276, 398],
    [288, 368],
    [300, 320],
    [292, 250],
    [300, 180],
    [296, 116],
  ],
  warmup: [
    [64, 536],
    [58, 470],
    [70, 402],
    [60, 330],
    [74, 262],
    [68, 194],
  ],
  roadside: [
    [138, 538],
    [142, 468],
    [130, 402],
    [148, 332],
    [140, 264],
    [150, 188],
  ],
  pump: [
    [206, 540],
    [199, 474],
    [214, 420],
    [208, 384],
    [222, 344],
    [242, 314],
    [236, 250],
    [230, 178],
  ],
  // Moonstone's spire: the Desert Spire up its face, Moonlight Arête up its right edge.
  mspire: [
    [128, 538],
    [122, 470],
    [134, 400],
    [128, 330],
    [140, 262],
    [150, 196],
    [162, 130],
    [178, 86],
  ],
  mmoon: [
    [302, 538],
    [294, 470],
    [286, 400],
    [278, 330],
    [266, 262],
    [252, 196],
    [238, 132],
    [222, 86],
  ],
  // Trad Arête: up the right-hand crack, round the roof's end and on up the wall's edge.
  tradarete: [
    [332, 536],
    [324, 470],
    [334, 420],
    [328, 362],
    [342, 310],
    [348, 246],
    [344, 184],
  ],
  // Gorge Trad: the corner, bottom to top.
  gtrad: [
    [236, 540],
    [232, 470],
    [226, 404],
    [224, 340],
    [226, 270],
    [228, 200],
    [224, 112],
  ],
  // Sandstone Mesa's wall: Desert Lap up the varnish on the left, Desert Enduro the full
  // height beside it, The Big Link through the bulge, and the trad line up the crack.
  sdlap: [
    [60, 538],
    [54, 470],
    [66, 404],
    [58, 336],
    [70, 268],
    [64, 200],
    [70, 168],
  ],
  senduro: [
    [140, 540],
    [146, 470],
    [134, 400],
    [150, 330],
    [140, 260],
    [152, 190],
    [144, 120],
  ],
  sbiglink: [
    [222, 540],
    [216, 470],
    [228, 414],
    [212, 382],
    [226, 352],
    [218, 280],
    [230, 200],
    [222, 112],
  ],
  sdtrad: [
    [302, 540],
    [298, 470],
    [304, 400],
    [296, 330],
    [302, 262],
    [312, 196],
    [306, 124],
  ],
  testpiece: [
    [290, 538],
    [298, 470],
    [284, 410],
    [302, 352],
    [292, 312],
    [306, 262],
    [300, 184],
  ],
};

interface Topo {
  d: Pt[];
  L: number[];
  len: number;
  // Bolts for the painting of routes you're not on, every 44 px.
  bolts: number[];
}

const topoOf = (d: Pt[]): Topo => {
  const L = arcTable(d);
  const len = L[L.length - 1]!;
  const bolts: number[] = [];
  for (let s = 34; s < len - 22; s += 44) bolts.push(s);
  return { d, L, len, bolts };
};

const TOPO: Record<string, Topo> = Object.fromEntries(
  Object.entries(TOPO_PTS).map(([id, pts]) => [id, topoOf(spline(pts, 14))]),
);

export interface Wall {
  art: HTMLCanvasElement;
  topo: Topo;
  // A close-up wall (boulder or gym): the climber is drawn big.
  big: boolean;
}

const close = new Map<string, Wall>();

// A gym problem's place on the wall, from its id ("sc-3-2" is the second, V1).
export const slotOf = (id: string): number => Math.max(0, Number(id.split('-')[2] ?? 1) - 1);

// A board problem's lit holds, from its id ("bd-2-3" is the third problem of the second
// set): the grid never changes, so each set has to light new holds on it.
const boardPattern = (id: string): number => Number(id.split('-')[1] ?? 1) * 10 + slotOf(id);

// A close-up's cache key: gym problems share a wall by their place on it, board problems
// by their lit holds, and a boulder is its own.
const closeKey = (r: RouteDef): string =>
  r.board
    ? `board:${boardPattern(r.id)}:${r.heightFt}`
    : r.place === 'gym'
      ? `gym:${slotOf(r.id)}:${r.heightFt}`
      : r.id;

const topos = new Map<string, Topo>();

// A route's line on its wall, without painting the wall: all that positions on it (the
// climber, the chalk, the sun's edge) need.
export function topoFor(r: RouteDef): Topo {
  if (roped(r)) return TOPO[r.id]!;
  const key = closeKey(r);
  let t = topos.get(key);
  if (!t) {
    t = topoOf(
      r.board
        ? boardTopo(boardPattern(r.id), r.heightFt)
        : r.place === 'gym'
          ? gymTopo(slotOf(r.id), r.heightFt)
          : boulderTopo(r.id, r.heightFt),
    );
    topos.set(key, t);
  }
  return t;
}

// The wall a route is on, and its line there.
export function wallOf(r: RouteDef): Wall {
  if (roped(r)) return { art: wallArt(r.place, r.id), topo: TOPO[r.id]!, big: false };
  const key = closeKey(r);
  let w = close.get(key);
  if (!w) {
    const art = r.board
      ? boardWallArt(boardPattern(r.id), r.heightFt)
      : r.place === 'gym'
        ? gymWallArt(slotOf(r.id), r.heightFt)
        : boulderArt(r);
    w = { art, topo: topoFor(r), big: true };
    close.set(key, w);
  }
  return w;
}

// A point on a route's line, `moves` up it.
export function onRoute(r: RouteDef, moves: number): Pt {
  const t = topoFor(r);
  return atLen(t.d, t.L, (moves / (r.moves || 1)) * t.len);
}

// The stretch of a route's line from one point to another, in moves: what a go climbed.
export function routeStretch(r: RouteDef, from: number, to: number): Pt[] {
  const t = topoFor(r);
  const per = t.len / (r.moves || 1);
  const a = Math.min(r.moves, Math.max(0, from)) * per;
  const b = Math.min(r.moves, Math.max(from, to)) * per;
  const pts: Pt[] = [atLen(t.d, t.L, a)];
  for (let i = 0; i < t.d.length; i++) if (t.L[i]! > a && t.L[i]! < b) pts.push(t.d[i]!);
  pts.push(atLen(t.d, t.L, b));
  return pts;
}

// Where the belayer stands for a sport route.
export function belayAt(r: RouteDef): Pt {
  const [x] = topoFor(r).d[0]!;
  return [x - 24, BELAY_Y];
}

const TALUS = (() => {
  const r = mulberry32(71);
  const out: [number, number, number, number][] = [];
  for (let x = -6; x < W + 10; x += 16 + r() * 18)
    out.push([x, BASE_Y + 4 + r() * 14, 10 + r() * 18, 6 + r() * 9]);
  return out;
})();

function boltDots(g: G, t: Topo): void {
  g.fillStyle = '#2A2A30';
  for (const s of t.bolts) {
    const [x, y] = atLen(t.d, t.L, s);
    g.beginPath();
    g.arc(x, y, 1.7, 0, 6.2832);
    g.fill();
  }
  const [ax, ay] = t.d[t.d.length - 1]!;
  g.strokeStyle = '#2A2A30';
  g.lineWidth = 1.1;
  g.beginPath();
  g.arc(ax - 3, ay, 1.9, 0, 6.2832);
  g.moveTo(ax + 4.9, ay);
  g.arc(ax + 3, ay, 1.9, 0, 6.2832);
  g.stroke();
}

function paintRoadside(g: G): void {
  g.fillStyle = lin(g, 0, 0, 0, 150, [
    [0, '#F2CF96'],
    [1, '#EFA46C'],
  ]);
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#FCEBC8';
  g.beginPath();
  g.arc(304, 66, 24, 0, 6.2832);
  g.fill();
  g.fillStyle = '#D39473';
  g.beginPath();
  trace(g, FAR_RIDGE, false);
  g.lineTo(364, 220);
  g.lineTo(-4, 220);
  g.closePath();
  g.fill();

  g.save();
  g.beginPath();
  poly(g, WALLPOLY, true);
  g.clip();
  g.fillStyle = '#CBC3B3';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#8F939D';
  g.beginPath();
  poly(g, SHADE, true);
  g.fill();
  const r = mulberry32(81);
  for (let i = 0; i < 14; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
    g.fillRect(r() * W, 90, 4 + r() * 16, 460);
  }
  g.fillStyle = '#4E4F58';
  g.beginPath();
  poly(g, ROOFSHADOW, true);
  g.fill();
  g.fillStyle = '#E4DCCB';
  g.beginPath();
  poly(g, ROOFTOP, true);
  g.fill();
  g.fillStyle = 'rgba(40,40,48,.35)';
  g.beginPath();
  poly(g, LEDGE_SH, true);
  g.fill();
  g.strokeStyle = '#E9E2D2';
  g.lineWidth = 2;
  g.beginPath();
  trace(g, LEDGE, false);
  g.stroke();
  g.strokeStyle = 'rgba(40,40,48,.5)';
  g.lineWidth = 2.2;
  g.lineCap = 'round';
  for (const c of CRACKS) {
    g.beginPath();
    trace(g, c, false);
    g.stroke();
  }
  g.fillStyle = '#7E7A73';
  g.fillRect(0, 0, 26, BASE_Y);
  g.restore();

  g.fillStyle = '#6B5A48';
  g.fillRect(-4, BASE_Y, W + 8, H - BASE_Y);
  g.fillStyle = '#8A7865';
  for (const t of TALUS) {
    g.beginPath();
    rock(g, ...t);
    g.fill();
  }
  g.fillStyle = '#2C4A3B';
  for (const [tx, ty, s] of CRAG_TREES) {
    g.beginPath();
    coniferPath(g, tx, ty, s);
    g.fill();
  }
}

// The Gorge's canyon wall: a strip of sky over the far rim, then granite to the talus, in
// shade all day. A corner system splits the face; the Classic's overlap and the roof on
// Power Endurance stand out dark.
const G_TOP: Pt[] = [
  [-4, 74],
  [40, 66],
  [96, 78],
  [150, 60],
  [214, 70],
  [262, 56],
  [318, 66],
  [364, 58],
];
const G_WALL: Pt[] = [...G_TOP, [364, BASE_Y], [-4, BASE_Y]];

// Moonstone's spire, face-on: a quartzite tower against a desert sky, square-fractured and
// rust-streaked, with sand and scrub at its foot.
const M_WALL: Pt[] = [
  [30, BASE_Y],
  [44, 420],
  [70, 300],
  [92, 190],
  [118, 110],
  [150, 70],
  [190, 56],
  [226, 70],
  [252, 110],
  [274, 200],
  [298, 320],
  [320, 440],
  [338, BASE_Y],
];

// Sandstone Mesa: a flat-topped red wall, varnish streaked down it from the rim.
const S_WALL: Pt[] = [
  [-4, BASE_Y],
  [-4, 104],
  [60, 98],
  [120, 101],
  [180, 94],
  [240, 99],
  [300, 92],
  [364, 97],
  [364, BASE_Y],
];

function paintMesa(g: G): void {
  g.fillStyle = lin(g, 0, 0, 0, 120, [
    [0, '#8FB9D6'],
    [1, '#F1D6B0'],
  ]);
  g.fillRect(0, 0, W, H);
  // Another mesa, far off across the flats.
  g.fillStyle = '#C7968A';
  g.beginPath();
  g.moveTo(-4, 118);
  g.lineTo(-4, 84);
  g.lineTo(90, 84);
  g.lineTo(104, 118);
  g.closePath();
  g.fill();
  const r = mulberry32(151);
  g.save();
  g.beginPath();
  poly(g, S_WALL, true);
  g.clip();
  g.fillStyle = lin(g, 0, 90, 0, BASE_Y, [
    [0, '#C8683E'],
    [1, '#B45A38'],
  ]);
  g.fillRect(0, 0, W, H);
  // Cross-bedding: long shallow curves, the old dunes this was.
  g.strokeStyle = 'rgba(90,40,26,.28)';
  g.lineWidth = 1.4;
  for (let y = 150; y < BASE_Y; y += 40 + r() * 30) {
    g.beginPath();
    g.moveTo(-4, y);
    for (let x = 0; x <= W + 8; x += 24) g.lineTo(x, y + Math.sin(x * 0.012 + y) * 10 + (r() - 0.5) * 3);
    g.stroke();
  }
  // Desert varnish: black streaks where water runs off the rim.
  for (let i = 0; i < 16; i++) {
    const x = r() * W;
    const len = 120 + r() * 300;
    g.fillStyle = lin(g, 0, 96, 0, 96 + len, [
      [0, 'rgba(40,22,20,.55)'],
      [1, 'rgba(40,22,20,0)'],
    ]);
    g.fillRect(x, 96, 6 + r() * 16, len);
  }
  // Huecos, a few.
  g.fillStyle = 'rgba(70,30,20,.5)';
  for (let i = 0; i < 9; i++) {
    g.beginPath();
    g.ellipse(20 + r() * 320, 160 + r() * 340, 3 + r() * 5, 2 + r() * 3, 0, 0, 6.2832);
    g.fill();
  }
  // The Big Link's bulge, and its shadow.
  g.fillStyle = 'rgba(70,30,22,.45)';
  g.beginPath();
  g.moveTo(186, 392);
  g.quadraticCurveTo(222, 368, 262, 390);
  g.lineTo(262, 404);
  g.quadraticCurveTo(222, 386, 186, 404);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(255,214,176,.5)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(186, 392);
  g.quadraticCurveTo(222, 368, 262, 390);
  g.stroke();
  // The trad line's crack, and the blank face above it.
  g.strokeStyle = 'rgba(40,20,16,.7)';
  g.lineWidth = 2.4;
  g.beginPath();
  trace(
    g,
    [
      [310, 540],
      [306, 470],
      [312, 400],
      [304, 330],
      [310, 262],
      [316, 214],
    ],
    false,
  );
  g.stroke();
  // The rim: a paler cap of harder rock.
  g.fillStyle = '#D9906A';
  g.fillRect(-4, 90, W + 8, 16);
  g.restore();

  g.fillStyle = '#D9B48A';
  g.fillRect(-4, BASE_Y, W + 8, H - BASE_Y);
  g.fillStyle = '#C49A72';
  for (let i = 0; i < 14; i++) {
    g.beginPath();
    rock(g, r() * W, BASE_Y + 20 + r() * 160, 12 + r() * 20, 6 + r() * 8);
    g.fill();
  }
  g.fillStyle = '#6E7A55';
  for (const [tx, ty, sc] of [
    [16, BASE_Y + 4, 1.1],
    [346, BASE_Y + 2, 0.9],
  ] as const) {
    g.beginPath();
    g.ellipse(tx, ty - 8 * sc, 18 * sc, 10 * sc, 0, 0, 6.2832);
    g.fill();
  }
}

function paintMoon(g: G): void {
  g.fillStyle = lin(g, 0, 0, 0, 300, [
    [0, '#9CC3D9'],
    [1, '#F3DDB8'],
  ]);
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#C9A7A0';
  g.beginPath();
  g.moveTo(-4, 250);
  g.lineTo(40, 250);
  g.lineTo(52, 228);
  g.lineTo(120, 228);
  g.lineTo(132, 250);
  g.lineTo(250, 250);
  g.lineTo(262, 236);
  g.lineTo(330, 236);
  g.lineTo(342, 256);
  g.lineTo(W + 4, 256);
  g.lineTo(W + 4, BASE_Y);
  g.lineTo(-4, BASE_Y);
  g.closePath();
  g.fill();

  g.save();
  g.beginPath();
  poly(g, M_WALL, true);
  g.clip();
  g.fillStyle = '#E4D8C6';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#C2AE9C';
  g.beginPath();
  g.moveTo(210, 0);
  g.lineTo(W, 0);
  g.lineTo(W, H);
  g.lineTo(250, H);
  g.closePath();
  g.fill();
  const r = mulberry32(131);
  g.strokeStyle = 'rgba(96,74,62,.42)';
  g.lineWidth = 1.5;
  for (let y = 90; y < BASE_Y; y += 34 + r() * 26) {
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= W; x += 24) g.lineTo(x, y + (r() - 0.5) * 5);
    g.stroke();
    for (let k = 0; k < 3; k++) {
      const vx = 40 + r() * 280;
      g.beginPath();
      g.moveTo(vx, y);
      g.lineTo(vx + (r() - 0.5) * 5, y + 18 + r() * 16);
      g.stroke();
    }
  }
  for (let i = 0; i < 10; i++) {
    const x = 40 + r() * 280;
    const top = 60 + r() * 200;
    const len = 90 + r() * 200;
    g.fillStyle = lin(g, 0, top, 0, top + len, [
      [0, 'rgba(176,96,52,.3)'],
      [1, 'rgba(176,96,52,0)'],
    ]);
    g.fillRect(x, top, 5 + r() * 9, len);
  }
  g.restore();

  g.fillStyle = '#D8BE92';
  g.fillRect(-4, BASE_Y, W + 8, H - BASE_Y);
  g.fillStyle = '#C9AC7F';
  for (let i = 0; i < 14; i++) {
    g.beginPath();
    rock(g, r() * W, BASE_Y + 20 + r() * 160, 12 + r() * 20, 6 + r() * 8);
    g.fill();
  }
  g.fillStyle = '#6E7A55';
  for (const [tx, ty, sc] of [
    [14, BASE_Y + 4, 1.2],
    [348, BASE_Y + 2, 1],
  ] as const) {
    g.beginPath();
    g.ellipse(tx, ty - 8 * sc, 18 * sc, 10 * sc, 0, 0, 6.2832);
    g.fill();
  }
}

function paintGorge(g: G): void {
  g.fillStyle = lin(g, 0, 0, 0, 90, [
    [0, '#B9D2DC'],
    [1, '#E4E6DA'],
  ]);
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#A3B3BA';
  g.beginPath();
  g.moveTo(-4, 52);
  for (let x = 0; x <= W + 8; x += 30) g.lineTo(x, 40 + Math.sin(x * 0.04) * 8);
  g.lineTo(W + 4, 120);
  g.lineTo(-4, 120);
  g.closePath();
  g.fill();

  g.save();
  g.beginPath();
  poly(g, G_WALL, true);
  g.clip();
  g.fillStyle = '#B4B9BE';
  g.fillRect(0, 0, W, H);
  // The corner, and the shaded side of it.
  g.fillStyle = '#8C949D';
  g.beginPath();
  g.moveTo(222, 0);
  g.lineTo(W, 0);
  g.lineTo(W, H);
  g.lineTo(238, H);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(38,42,50,.55)';
  g.lineWidth = 2.6;
  g.beginPath();
  trace(
    g,
    [
      [222, 60],
      [228, 200],
      [224, 340],
      [236, 540],
    ],
    false,
  );
  g.stroke();
  const r = mulberry32(93);
  for (let i = 0; i < 14; i++) {
    const x = r() * W;
    const len = 120 + r() * 260;
    g.fillStyle = lin(g, 0, 50, 0, 50 + len, [
      [0, 'rgba(38,42,50,.3)'],
      [1, 'rgba(38,42,50,0)'],
    ]);
    g.fillRect(x, 50, 5 + r() * 10, len);
  }
  g.strokeStyle = 'rgba(58,62,70,.4)';
  g.lineWidth = 1.5;
  g.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const x = 20 + r() * 300;
    const y = 120 + r() * 360;
    const k = 16 + r() * 30;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + k * 0.7, y - k * 0.25, x + k, y + k * 0.9);
    g.stroke();
  }
  for (let i = 0; i < 70; i++) {
    g.fillStyle = r() < 0.7 ? 'rgba(168,186,136,.3)' : 'rgba(214,200,140,.26)';
    g.beginPath();
    g.ellipse(r() * W, 80 + r() * 450, 2 + r() * 6, 1.5 + r() * 4, 0, 0, 6.2832);
    g.fill();
  }
  // The overlap on the Classic, and the roof on Power Endurance, each with its shadow.
  for (const [x0, x1, y, d] of [
    [150, 214, 380, 10],
    [252, 352, 404, 22],
  ] as const) {
    g.fillStyle = '#4A515B';
    g.beginPath();
    g.moveTo(x0, y);
    g.lineTo(x1, y - 4);
    g.lineTo(x1, y + d);
    g.lineTo(x0 + 8, y + d * 0.6);
    g.closePath();
    g.fill();
    g.strokeStyle = '#D2D6D8';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x0, y);
    g.lineTo(x1, y - 4);
    g.stroke();
  }
  g.fillStyle = 'rgba(40,40,46,.16)';
  for (let k = 0; k < 400; k++) g.fillRect(r() * W, 70 + r() * 470, 1.3, 1.3);
  g.restore();

  g.fillStyle = '#5B584F';
  g.fillRect(-4, BASE_Y, W + 8, H - BASE_Y);
  g.fillStyle = '#8B8D8A';
  for (const t of TALUS) {
    g.beginPath();
    rock(g, ...t);
    g.fill();
  }
  g.fillStyle = '#294236';
  for (const [tx, ty, sc] of CRAG_TREES) {
    g.beginPath();
    coniferPath(g, tx, ty, sc * 1.2);
    g.fill();
  }
}

// Other lines dashed with their bolts; yours solid, its bolts drawn live as you clip them.
// A trad line has no bolts to draw: only what you place.
function paintLines(g: G, place: string, selected: string): void {
  for (const [id, t] of Object.entries(TOPO)) {
    if (id === selected || ROUTES[id]?.place !== place) continue;
    const trad = ROUTES[id]?.disc === 'trad';
    g.strokeStyle = '#F7EBD0';
    g.lineWidth = 1.5;
    g.setLineDash([4, 3]);
    g.beginPath();
    trace(g, t.d, false);
    g.stroke();
    g.setLineDash([]);
    if (!trad) boltDots(g, t);
  }
  g.strokeStyle = '#DA6A34';
  g.lineWidth = 2.6;
  g.lineCap = 'round';
  g.beginPath();
  trace(g, TOPO[selected]!.d, false);
  g.stroke();
}

const cache = new Map<string, HTMLCanvasElement>();

export function wallArt(place: string, selected: string): HTMLCanvasElement {
  let c = cache.get(selected);
  if (!c) {
    const [cv, g] = mk(W, H, 2);
    paintWall(g, place, selected);
    c = cv;
    cache.set(selected, c);
  }
  return c;
}

function paintWall(g: G, place: string, selected: string): void {
  if (place === 'gorge') paintGorge(g);
  else if (place === 'moon') paintMoon(g);
  else if (place === 'mesa') paintMesa(g);
  else paintRoadside(g);
  paintLines(g, place, selected);
}

// The rock on a route's close-up, as a path to clip to: the face a sport line is on, or
// the boulder itself, so weather drawn on the rock stays off the sky.
export function rockPath(g: G, r: RouteDef): void {
  g.beginPath();
  if (roped(r)) poly(g, FACE[r.place] ?? WALLPOLY, true);
  else poly(g, boulderOutline(r), true);
}

// Each crag's rock face on its close-up, where weather is drawn; Roadside's is WALLPOLY.
const FACE: Record<string, Pt[]> = { gorge: G_WALL, moon: M_WALL, mesa: S_WALL };

// A route's wall, painted into any context in wall units: what the wall view caches at 2x,
// for the send card to paint at its own size.
export function paintRouteArt(g: G, r: RouteDef): void {
  if (roped(r)) paintWall(g, r.place, r.id);
  else if (r.board) paintBoardWall(g, boardPattern(r.id), r.heightFt);
  else if (r.place === 'gym') paintGymWall(g, slotOf(r.id), r.heightFt);
  else paintBoulderArt(g, r);
}
