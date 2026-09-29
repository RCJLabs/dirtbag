// The walls you look up at. Roadside's main wall and the Gorge's granite, face on, carry
// their sport lines, each drawn from its topo; boulders and Send City's problems have
// close-up walls of their own (boulder.ts, gym.ts). Whatever the wall, a route is mapped
// from moves (the sim's unit) to points along its line here, so the rules never see a pixel.

import { ROUTES, type RouteDef } from '../../sim';
import { arcTable, atLen, lin, mk, poly, spline, trace, type G, type Pt } from '../kit/geom';
import { mulberry32 } from '../kit/noise';
import { H, W } from '../layout';
import { coniferPath, rock } from '../shapes';
import { boulderArt, boulderTopo } from './boulder';
import { gymTopo, gymWallArt } from './gym';

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

// The wall a route is on, and its line there.
export function wallOf(r: RouteDef): Wall {
  if (r.disc === 'sport') return { art: wallArt(r.place, r.id), topo: TOPO[r.id]!, big: false };
  const key = r.place === 'gym' ? `gym:${slotOf(r.id)}:${r.heightFt}` : r.id;
  let w = close.get(key);
  if (!w) {
    w =
      r.place === 'gym'
        ? {
            art: gymWallArt(slotOf(r.id), r.heightFt),
            topo: topoOf(gymTopo(slotOf(r.id), r.heightFt)),
            big: true,
          }
        : { art: boulderArt(r), topo: topoOf(boulderTopo(r.id, r.heightFt)), big: true };
    close.set(key, w);
  }
  return w;
}

// A point on a route's line, `moves` up it.
export function onRoute(r: RouteDef, moves: number): Pt {
  const t = wallOf(r).topo;
  return atLen(t.d, t.L, (moves / (r.moves || 1)) * t.len);
}

// The stretch of a route's line from one point to another, in moves: what a go climbed.
export function routeStretch(r: RouteDef, from: number, to: number): Pt[] {
  const t = wallOf(r).topo;
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
  const [x] = wallOf(r).topo.d[0]!;
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
function paintLines(g: G, place: string, selected: string): void {
  for (const [id, t] of Object.entries(TOPO)) {
    if (id === selected || ROUTES[id]?.place !== place) continue;
    g.strokeStyle = '#F7EBD0';
    g.lineWidth = 1.5;
    g.setLineDash([4, 3]);
    g.beginPath();
    trace(g, t.d, false);
    g.stroke();
    g.setLineDash([]);
    boltDots(g, t);
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
    if (place === 'gorge') paintGorge(g);
    else paintRoadside(g);
    paintLines(g, place, selected);
    c = cv;
    cache.set(selected, c);
  }
  return c;
}
