// The walls you look up at. Roadside's main wall and the Gorge's granite, face on, carry
// their sport lines, each drawn from its topo; boulders and Send City's problems have
// close-up walls of their own (boulder.ts, gym.ts). Whatever the wall, a route is mapped
// from moves (the sim's unit) to points along its line here, so the rules never see a pixel.

import { EXPED_ROUTES, indoor, onWall, ROUTES, setOf, type RouteDef } from '../../sim';
import { arcTable, atLen, lin, mk, poly, spline, trace, type G, type Pt } from '../kit/geom';
import { mulberry32 } from '../kit/noise';
import { H, W } from '../layout';
import { coniferPath, rock } from '../shapes';
import { boulderArt, boulderOutline, boulderTopo, paintBoulderArt } from './boulder';
import {
  boardTopo,
  boardWallArt,
  gymTopo,
  gymWallArt,
  paintBoardWall,
  paintGymWall,
  paintSetWall,
  setTopo,
  setWallArt,
} from './gym';
import { EXPED_FACE, paintExpedWall, SCENED } from './expeds';
import { laterWalls } from './wall.full';

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
const TALUS = (() => {
  const r = mulberry32(71);
  const out: [number, number, number, number][] = [];
  for (let x = -6; x < W + 10; x += 16 + r() * 18)
    out.push([x, BASE_Y + 4 + r() * 14, 10 + r() * 18, 6 + r() * 9]);
  return out;
})();
// Your belayer stands on the talus a step left of the route's first moves.
const BELAY_Y = 586;

// The later crags' close-up walls and their lines' topos (Phase 14.5b): the full game's
// (wall.full.ts). The demo's build has Roadside's and the Gorge's alone (wall.demo.ts).
const LATER = laterWalls({ BASE_Y, CRAG_TREES, TALUS });

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
  // height beside it, The Big Link through the bulge, and the trad line up the crack.
  testpiece: [
    [290, 538],
    [298, 470],
    [284, 410],
    [302, 352],
    [292, 312],
    [306, 262],
    [300, 184],
  ],
  ...LATER.topos,
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

// A wall's pitches (Phase 21.5): each one fills the close-up, bottom to top, wandering a
// little on its own seed, from a start that steps across the face pitch by pitch.
const WALL_X: Record<string, number> = { prow: 172, golden: 120, obsidian: 180, ascendant: 230 };
const PITCH_TOP: Record<string, number> = { road: 184 };

// Each kind of pitch's line (Phase 27.3), as [across, up] for its seven points: across in px,
// toward the middle of the face; up as a share of the climb. A traverse goes across the
// middle of it, where its crux is; a roof goes up to the roof and out to its lip, where its
// crux is; a corner leans with the corner. Cracks, chimneys, slabs and faces go straight up.
const PITCH_PATH: Partial<Record<NonNullable<RouteDef['kind']>, Pt[]>> = {
  traverse: [
    [0, 0],
    [2, 0.25],
    [6, 0.5],
    [40, 0.56],
    [86, 0.62],
    [124, 0.7],
    [128, 1],
  ],
  roof: [
    [0, 0],
    [2, 0.22],
    [-2, 0.44],
    [0, 0.66],
    [44, 0.69],
    [46, 0.84],
    [44, 1],
  ],
  corner: [0, 1, 2, 3, 4, 5, 6].map((i): Pt => [i * 6, i / 6]),
};
// How far each kind wanders off its path: a crack or a chimney hardly at all.
const PITCH_WANDER: Partial<Record<NonNullable<RouteDef['kind']>, number>> = {
  crack: 6,
  chimney: 6,
  corner: 4,
  traverse: 6,
  roof: 4,
  slab: 18,
};

function pitchPts(r: RouteDef): Pt[] {
  const n = Number(r.id.split('-').pop());
  const rnd = mulberry32(n * 97 + r.id.length * 13 + (WALL_X[r.wall!] ?? 0));
  const top = PITCH_TOP[r.place] ?? 80;
  const x0 = (WALL_X[r.wall!] ?? 180) + ((n % 3) - 1) * 26;
  const dir = x0 > W / 2 ? -1 : 1;
  const path = r.kind && PITCH_PATH[r.kind];
  // An expedition's pitch has no kind, and wanders as every pitch used to.
  const wander = (r.kind && PITCH_WANDER[r.kind]) ?? 26;
  const pts: Pt[] = [];
  for (let i = 0; i < 7; i++) {
    const [dx, up] = path?.[i] ?? [0, i / 6];
    pts.push([x0 + dir * dx + (rnd() - 0.5) * wander, 540 - (540 - top) * up]);
  }
  return pts;
}

// What a pitch's kind looks like on the rock, under your line: a crack's dark seam, a
// chimney's slot, a corner's shadowed wall, a roof above the line where it goes out, and the
// break a traverse follows. A slab and a face are just the rock.
function paintPitch(g: G, r: RouteDef, t: Topo): void {
  const pts = TOPO_PTS[r.id]!;
  const dir = pts[6]![0] >= pts[0]![0] ? 1 : -1;
  const along = (d: Pt[], dx: number, dy: number): Pt[] => d.map(([x, y]): Pt => [x + dx, y + dy]);
  g.save();
  g.lineCap = 'round';
  if (r.kind === 'crack') {
    g.strokeStyle = 'rgba(30,32,38,.6)';
    g.lineWidth = 1.8;
    g.beginPath();
    trace(g, along(t.d, 4, 0), false);
    g.stroke();
  } else if (r.kind === 'chimney') {
    g.strokeStyle = 'rgba(24,26,32,.42)';
    g.lineWidth = 20;
    g.lineCap = 'butt';
    g.beginPath();
    trace(g, t.d, false);
    g.stroke();
  } else if (r.kind === 'corner') {
    const edge = along(t.d, dir * 6, 0);
    g.fillStyle = 'rgba(24,26,32,.34)';
    g.beginPath();
    poly(g, [...edge, ...along(edge, dir * 30, 0).reverse()], true);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.4)';
    g.lineWidth = 1.4;
    g.beginPath();
    trace(g, edge, false);
    g.stroke();
  } else if (r.kind === 'roof') {
    // Over the stretch where the line goes out under it, to the lip it pulls over.
    const [ax, ay] = pts[3]!;
    const [bx, by] = pts[4]!;
    const under: Pt[] = [
      [ax - dir * 22, ay - 10],
      [bx + dir * 4, by - 10],
    ];
    g.fillStyle = '#4A515B';
    g.beginPath();
    poly(g, [...under, [bx + dir * 4, by - 26], [ax - dir * 22, ay - 22]], true);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.5)';
    g.lineWidth = 1.6;
    g.beginPath();
    poly(g, under, false);
    g.stroke();
  } else if (r.kind === 'traverse') {
    g.strokeStyle = 'rgba(30,32,38,.6)';
    g.lineWidth = 2.2;
    g.beginPath();
    trace(g, along(pts.slice(2, 6), 0, 7), false);
    g.stroke();
  }
  g.restore();
}

for (const r of Object.values(ROUTES)) if (r.wall) TOPO_PTS[r.id] = pitchPts(r);
// An expedition's pitches (Phase 24) climb the same way, on their objective's own rock
// (Phase 24.6–24.8).
for (const r of Object.values(EXPED_ROUTES)) TOPO_PTS[r.id] = pitchPts(r);

// Miller's Bluff (Phase 25.7): its six lines on its own face, left to right as the field
// sees them: edges up the barn wall, the tufa, the corner leaning out at its top, the
// pillar's edge, out under the big roof a third of the way up, and the long wall to the top.
Object.assign(TOPO_PTS, {
  bbarn: [
    [44, 540],
    [50, 470],
    [40, 400],
    [52, 330],
    [44, 260],
    [50, 190],
    [46, 136],
  ],
  btufa: [
    [104, 540],
    [102, 460],
    [108, 380],
    [104, 300],
    [110, 220],
    [106, 132],
  ],
  bcow: [
    [162, 540],
    [158, 460],
    [160, 380],
    [156, 300],
    [164, 220],
    [178, 160],
    [184, 124],
  ],
  bpillar: [
    [222, 540],
    [214, 470],
    [218, 400],
    [212, 320],
    [218, 240],
    [214, 166],
    [220, 112],
  ],
  broof: [
    [268, 540],
    [272, 470],
    [266, 410],
    [276, 386],
    [298, 380],
    [306, 340],
    [300, 260],
    [306, 180],
    [300, 118],
  ],
  blong: [
    [332, 540],
    [326, 450],
    [334, 360],
    [326, 270],
    [332, 180],
    [328, 84],
  ],
});

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
// Phase 44.2: a set you hung is its own, by its id, like a boulder.
const closeKey = (r: RouteDef): string =>
  r.board
    ? `board:${boardPattern(r.id)}:${r.heightFt}`
    : indoor(r.place) && !setOf(r.id)
      ? `${r.place}:${slotOf(r.id)}:${r.heightFt}`
      : r.id;

const topos = new Map<string, Topo>();

// A route's line on its wall, without painting the wall: all that positions on it (the
// climber, the chalk, the sun's edge) need.
export function topoFor(r: RouteDef): Topo {
  if (onWall(r)) return TOPO[r.id]!;
  const key = closeKey(r);
  let t = topos.get(key);
  if (!t) {
    const set = setOf(r.id);
    t = topoOf(
      r.board
        ? boardTopo(boardPattern(r.id), r.heightFt)
        : set
          ? setTopo(set.cells, r.heightFt)
          : indoor(r.place)
            ? gymTopo(slotOf(r.id), r.heightFt)
            : boulderTopo(r.id, r.heightFt),
    );
    topos.set(key, t);
  }
  return t;
}

// The wall a route is on, and its line there.
export function wallOf(r: RouteDef): Wall {
  if (onWall(r)) return { art: wallArt(r.place, r.id), topo: TOPO[r.id]!, big: false };
  const key = closeKey(r);
  let w = close.get(key);
  if (!w) {
    const set = setOf(r.id);
    const art = r.board
      ? boardWallArt(boardPattern(r.id), r.heightFt)
      : set
        ? setWallArt(r.id, set.ids, set.cells, r.heightFt)
        : indoor(r.place)
          ? gymWallArt(slotOf(r.id), r.heightFt, r.place)
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
  // Up on a wall, the single-pitch lines are below you, and the other pitches are yours to
  // come to: only your pitch is drawn.
  const high = !!ROUTES[selected]?.wall;
  for (const [id, t] of Object.entries(TOPO)) {
    // A myth nobody has read isn't drawn: there's nothing on the rock to see.
    if (high || id === selected || ROUTES[id]?.place !== place || ROUTES[id]?.hiddenUntil) continue;
    if (ROUTES[id]?.wall) continue;
    const bolted = ROUTES[id]?.disc === 'sport';
    g.strokeStyle = '#F7EBD0';
    g.lineWidth = 1.5;
    g.setLineDash([4, 3]);
    g.beginPath();
    trace(g, t.d, false);
    g.stroke();
    g.setLineDash([]);
    if (bolted) boltDots(g, t);
  }
  // A myth's own line waits for the render, which draws it once you can read it.
  if (ROUTES[selected]?.hiddenUntil) return;
  if (ROUTES[selected]?.kind) paintPitch(g, ROUTES[selected]!, TOPO[selected]!);
  traceSelected(g, TOPO[selected]!);
}

// Your line, solid.
export function traceSelected(g: G, t: { d: Pt[] }): void {
  g.strokeStyle = '#DA6A34';
  g.lineWidth = 2.6;
  g.lineCap = 'round';
  g.beginPath();
  trace(g, t.d, false);
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
  const later = LATER.paint[place];
  if (place === 'gorge') paintGorge(g);
  else if (later) later(g);
  else if (SCENED.includes(place)) paintExpedWall(g, place);
  else paintRoadside(g);
  paintLines(g, place, selected);
}

// The rock on a route's close-up, as a path to clip to: the face a sport line is on, or
// the boulder itself, so weather drawn on the rock stays off the sky.
export function rockPath(g: G, r: RouteDef): void {
  g.beginPath();
  if (onWall(r)) poly(g, FACE[r.place] ?? WALLPOLY, true);
  else poly(g, boulderOutline(r), true);
}

// Each crag's rock face on its close-up, where weather is drawn; Roadside's is WALLPOLY.
const FACE: Record<string, Pt[]> = {
  gorge: G_WALL,
  ...LATER.faces,
  elcap: EXPED_FACE,
  cerrotorre: EXPED_FACE,
  trango: EXPED_FACE,
};

// A route's wall, painted into any context in wall units: what the wall view caches at 2x,
// for the send card to paint at its own size.
export function paintRouteArt(g: G, r: RouteDef): void {
  if (onWall(r)) paintWall(g, r.place, r.id);
  else if (r.board) paintBoardWall(g, boardPattern(r.id), r.heightFt);
  else if (setOf(r.id)) paintSetWall(g, setOf(r.id)!.ids, setOf(r.id)!.cells, r.heightFt);
  else if (indoor(r.place)) paintGymWall(g, slotOf(r.id), r.heightFt, r.place);
  else paintBoulderArt(g, r);
}
