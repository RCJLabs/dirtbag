// The expeditions' own scenes (Phase 24.6–24.8): where you are while you're away, behind the
// day's card, and the rock a pitch of yours is climbed on. Each is painted once per time of
// day and weather into a screen-fixed canvas the sky's width: there's no walking up there,
// so nothing scrolls. Where you've got to on the wall is drawn live, over it.

import { clamp, lerp, lin, mk, poly, rad, trace, type G, type Pt } from '../kit/geom';
import { mulberry32 } from '../kit/noise';
import { H, W, W_MAX } from '../layout';
import { pineShape } from '../shapes';

export type Weather = 'clear' | 'storm';

// Sky pixels: the canvas is SKY_W across, and a portrait screen sees its middle W.
const SKY_W = W_MAX;
const CX = SKY_W / 2;

interface Look {
  sky: [number, string][];
  lit: string;
  shade: string;
  streak: string;
  far: string;
  trees: string;
  trees2: string;
  meadow: [string, string];
  cloud: string;
}

// El Capitan from the meadow: the light by day, by moon, and under a storm.
const ELCAP: Record<'day' | 'night' | 'storm' | 'stormNight', Look> = {
  day: {
    sky: [
      [0, '#7FB2D6'],
      [0.6, '#BFD8E4'],
      [1, '#EAE2CC'],
    ],
    lit: '#E3DAC6',
    shade: '#B5AE9C',
    streak: 'rgba(60,58,52,.32)',
    far: '#93A9B6',
    trees: '#2E4A3A',
    trees2: '#3F604A',
    meadow: ['#D8B86A', '#B9974E'],
    cloud: 'rgba(255,255,255,.85)',
  },
  night: {
    sky: [
      [0, '#0F1830'],
      [0.6, '#232C52'],
      [1, '#3E3C5E'],
    ],
    lit: '#6B7290',
    shade: '#4C5372',
    streak: 'rgba(10,12,24,.4)',
    far: '#2A3352',
    trees: '#121A2A',
    trees2: '#1B2538',
    meadow: ['#3A3E4E', '#2A2E3E'],
    cloud: 'rgba(120,128,160,.5)',
  },
  storm: {
    sky: [
      [0, '#565F6C'],
      [0.6, '#7A848D'],
      [1, '#9AA0A2'],
    ],
    lit: '#9C9F9A',
    shade: '#7A7E7B',
    streak: 'rgba(30,34,40,.45)',
    far: '#6A7680',
    trees: '#24352D',
    trees2: '#31453A',
    meadow: ['#8C8862', '#74704E'],
    cloud: 'rgba(88,96,108,.94)',
  },
  stormNight: {
    sky: [
      [0, '#0C111E'],
      [0.6, '#1A2034'],
      [1, '#2A2E40'],
    ],
    lit: '#4A5064',
    shade: '#383D50',
    streak: 'rgba(6,8,16,.5)',
    far: '#1E2436',
    trees: '#0D131E',
    trees2: '#141B28',
    meadow: ['#2A2D38', '#20232C'],
    cloud: 'rgba(40,44,60,.95)',
  },
};

// The wall's outline in sky pixels, its summit rim, and the Nose: the prow between the
// southwest face in the light and the southeast face in shade.
// Drawn from the meadow's height scale, then pressed into the top half of the screen,
// where the day's card leaves it showing: the summit just under the HUD, the foot of the
// wall where the card's top usually is.
const TOP = 100;
const K = 0.58;
const Y = (y: number): number => TOP + (y - 136) * K;
const up = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x, Y(y)]);
const FOOT = 580;
const BASE = Y(FOOT);
const EL_RIM: Pt[] = up([
  [CX - 560, FOOT],
  [CX - 470, 430],
  [CX - 380, 300],
  [CX - 290, 214],
  [CX - 170, 166],
  [CX - 60, 142],
  [CX + 20, 136],
  [CX + 96, 144],
  [CX + 190, 172],
  [CX + 310, 244],
  [CX + 430, 366],
  [CX + 530, 520],
  [CX + 580, FOOT],
]);
const NOSE: Pt[] = up([
  [CX + 20, 136],
  [CX + 8, 232],
  [CX + 18, 330],
  [CX + 4, 440],
  [CX + 14, FOOT],
]);
// The line up it, just left of the prow, where your portaledge hangs.
export const ELCAP_LINE: Pt[] = up([
  [CX + 2, 562],
  [CX - 6, 470],
  [CX + 4, 380],
  [CX - 8, 280],
  [CX + 2, 200],
  [CX + 10, 146],
]);

const fill = (g: G, pts: Pt[], col: string | CanvasGradient) => {
  g.fillStyle = col;
  g.beginPath();
  poly(g, pts, true);
  g.fill();
};

function pines(g: G, r: () => number, y: number, h: number, col: string, gap: number): void {
  g.fillStyle = col;
  g.beginPath();
  for (let x = -20; x < SKY_W + 20; x += gap * (0.6 + r() * 0.8))
    pineShape(g, x, y + r() * 10, h * (0.7 + r() * 0.6));
  g.fill();
}

// A bank of cloud along a band, soft at its edges.
function cloudBank(g: G, y: number, h: number, col: string, seed: number): void {
  const r = mulberry32(seed);
  g.fillStyle = col;
  for (let i = 0; i < 60; i++) {
    const x = r() * SKY_W;
    const cy = y + (r() - 0.5) * h;
    g.beginPath();
    g.ellipse(x, cy, 60 + r() * 90, 18 + r() * 26, 0, 0, 6.2832);
    g.fill();
  }
}

function paintElcap(g: G, night: boolean, storm: boolean): void {
  const L = ELCAP[storm ? (night ? 'stormNight' : 'storm') : night ? 'night' : 'day'];
  const r = mulberry32(203);
  g.fillStyle = lin(g, 0, 0, 0, BASE, L.sky);
  g.fillRect(0, 0, SKY_W, H);
  if (night && !storm) {
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(242,233,216,${(0.3 + r() * 0.6).toFixed(2)})`;
      const d = r() < 0.1 ? 1.8 : 1.1;
      g.fillRect(r() * SKY_W, r() * Y(380), d, d);
    }
    g.fillStyle = '#F2E9D8';
    g.beginPath();
    g.arc(CX + 250, 96, 14, 0, 6.2832);
    g.fill();
  } else if (!storm) {
    g.fillStyle = rad(g, CX + 260, 104, 0, 120, [
      [0, 'rgba(255,246,220,.7)'],
      [1, 'rgba(255,246,220,0)'],
    ]);
    g.fillRect(0, 0, SKY_W, H);
    g.fillStyle = '#FFF6DC';
    g.beginPath();
    g.arc(CX + 260, 104, 22, 0, 6.2832);
    g.fill();
  }
  // The valley's far rim, both sides of the wall.
  const far: Pt[] = [[-10, BASE]];
  for (let x = -10; x <= SKY_W + 10; x += 24)
    far.push([x, Y(380) + (Math.sin(x * 0.011) * 40 + Math.sin(x * 0.037) * 14) * K]);
  far.push([SKY_W + 10, BASE]);
  fill(g, far, L.far);
  // The wall: the lit face, then the shaded one right of the Nose.
  fill(
    g,
    EL_RIM,
    lin(g, 0, TOP, 0, BASE, [
      [0, L.lit],
      [1, L.shade],
    ]),
  );
  g.save();
  g.beginPath();
  poly(g, EL_RIM, true);
  g.clip();
  g.fillStyle = L.shade;
  g.beginPath();
  poly(g, [...NOSE, [CX + 600, BASE], [CX + 600, 0], [CX + 20, 0]], true);
  g.fill();
  // The diorite on the southeast face, the shape of North America, and the Heart on the
  // southwest: the two marks anyone in the meadow points out.
  fill(
    g,
    up([
      [CX + 106, 282],
      [CX + 134, 274],
      [CX + 175, 283],
      [CX + 197, 304],
      [CX + 183, 326],
      [CX + 160, 338],
      [CX + 150, 364],
      [CX + 138, 375],
      [CX + 132, 353],
      [CX + 118, 329],
      [CX + 103, 309],
    ]),
    L.streak.replace(/[\d.]+\)$/, '.3)'),
  );
  fill(
    g,
    up([
      [CX - 250, 330],
      [CX - 226, 314],
      [CX - 206, 326],
      [CX - 186, 314],
      [CX - 164, 332],
      [CX - 176, 372],
      [CX - 206, 404],
      [CX - 236, 372],
    ]),
    L.streak.replace(/[\d.]+\)$/, '.22)'),
  );
  // Black streaks where the water runs, more on the shaded face; the sheets peeling off it.
  for (let i = 0; i < 18; i++) {
    const x = CX - 420 + r() * 900;
    const top = Y(150 + r() * 160);
    const len = (120 + r() * 300) * K;
    const w = 1.2 + r() * (x > CX ? 4 : 2);
    g.fillStyle = lin(g, 0, top, 0, top + len, [
      [0, 'rgba(0,0,0,0)'],
      [0.2, L.streak],
      [1, 'rgba(0,0,0,0)'],
    ]);
    g.beginPath();
    poly(
      g,
      [
        [x, top],
        [x + w, top],
        [x + w * 0.6, top + len],
        [x + w * 0.4, top + len],
      ],
      true,
    );
    g.fill();
  }
  g.strokeStyle = L.streak;
  g.lineWidth = 1.4;
  for (let i = 0; i < 14; i++) {
    const x = CX - 380 + r() * 760;
    const y = Y(220 + r() * 300);
    const a = (30 + r() * 50) * K;
    g.beginPath();
    g.arc(x, y + a, a, Math.PI * 1.25, Math.PI * 1.6);
    g.stroke();
  }
  // The Great Roof, high on the southeast face, and the ledges you sleep on.
  fill(
    g,
    [
      [CX + 52, Y(300)],
      [CX + 118, Y(286)],
      [CX + 116, Y(292)],
      [CX + 56, Y(305)],
    ],
    'rgba(30,30,34,.4)',
  );
  g.fillStyle = 'rgba(255,255,255,.25)';
  for (const [x, y, w] of [
    [CX - 30, 488, 40],
    [CX - 22, 402, 30],
    [CX - 40, 252, 36],
  ] as const)
    g.fillRect(x, Y(y), w, 1.5);
  g.restore();
  // The prow's edge, catching the light.
  g.strokeStyle = 'rgba(255,255,255,.35)';
  g.lineWidth = 2;
  g.beginPath();
  trace(g, NOSE, false);
  g.stroke();
  // Pines on the rim, then the forest at the foot of it.
  g.fillStyle = L.trees;
  g.beginPath();
  for (let i = 1; i < EL_RIM.length - 4; i++) {
    const [x0, y0] = EL_RIM[i]!;
    const [x1, y1] = EL_RIM[i + 1]!;
    for (let k = 0; k < 4; k++) {
      const t = (k + r()) / 4;
      pineShape(g, lerp(x0, x1, t), lerp(y0, y1, t) + 2, 6 + r() * 6);
    }
  }
  g.fill();
  if (storm) cloudBank(g, Y(170), 60, L.cloud, 211);
  pines(g, r, BASE - 2, 46, L.trees2, 12);
  pines(g, r, BASE + 10, 38, L.trees, 9);
  // The meadow, gold grass to the road.
  g.fillStyle = lin(g, 0, BASE, 0, H, [
    [0, L.meadow[0]],
    [1, L.meadow[1]],
  ]);
  g.fillRect(0, BASE + 8, SKY_W, H);
  g.fillStyle = 'rgba(0,0,0,.08)';
  for (let i = 0; i < 90; i++) {
    g.beginPath();
    g.ellipse(r() * SKY_W, BASE + 30 + r() * 300, 6 + r() * 20, 2 + r() * 3, 0, 0, 6.2832);
    g.fill();
  }
  g.fillStyle = night ? '#1E2230' : '#5A5650';
  g.fillRect(0, H - 34, SKY_W, 10);
  if (night) {
    // Other parties' headlamps, up on the wall.
    g.fillStyle = '#FFE7A8';
    for (const [x, y] of [
      [CX - 120, 340],
      [CX + 140, 420],
      [CX - 260, 470],
    ] as const) {
      g.beginPath();
      g.arc(x, Y(y), 1.6, 0, 6.2832);
      g.fill();
    }
  }
}

// The objectives with a scene painted so far; the rest are seen from the Lot.
export const SCENED = ['elcap'];

// An objective's scene, by time of day and weather. Two are kept, as the scenes are.
const cache = new Map<string, HTMLCanvasElement>();
export function expedScene(id: string, night: boolean, storm: boolean): HTMLCanvasElement {
  const key = `${id}:${night}:${storm}`;
  let c = cache.get(key);
  if (!c) {
    const [cv, g] = mk(SKY_W, H, 1);
    paintElcap(g, night, storm);
    c = cv;
    cache.set(key, c);
    while (cache.size > 2) cache.delete(cache.keys().next().value!);
  }
  return c;
}

// Where you are on the wall in the scene, in sky pixels: `k` of the way up its line.
export function expedSpot(id: string, k: number): Pt {
  void id;
  const pts = ELCAP_LINE;
  const t = clamp(k) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(t));
  const a = pts[i]!;
  const b = pts[i + 1]!;
  return [lerp(a[0], b[0], t - i), lerp(a[1], b[1], t - i)];
}
export const EXPED_SKY_W = SKY_W;

// ---- the wall view ----

// The ledge the belay's on, and the air under it.
const LEDGE_Y = 590;
export const EXPED_FACE: Pt[] = [
  [-4, LEDGE_Y + 14],
  [-4, -4],
  [W + 4, -4],
  [W + 4, LEDGE_Y + 14],
];

// A pitch on El Cap, close up: clean granite, a corner, the crack system; under the belay
// ledge, the haul bag and the portaledge hanging, and the meadow a long way down.
export function paintExpedWall(g: G, place: string): void {
  void place;
  const r = mulberry32(219);
  // The air first: haze to the trees and meadow far below.
  g.fillStyle = lin(g, 0, LEDGE_Y, 0, H, [
    [0, '#BFD3DE'],
    [0.7, '#A9C0B4'],
    [1, '#C8B574'],
  ]);
  g.fillRect(0, LEDGE_Y, W, H - LEDGE_Y);
  g.fillStyle = 'rgba(46,74,58,.55)';
  g.beginPath();
  for (let x = -6; x < W + 6; x += 5 + r() * 6) pineShape(g, x, H - 12, 6 + r() * 6);
  g.fill();
  // The face.
  g.fillStyle = lin(g, 0, 0, 0, LEDGE_Y, [
    [0, '#DCD3BF'],
    [1, '#CEC5B0'],
  ]);
  g.fillRect(0, 0, W, LEDGE_Y + 14);
  // The corner right of the line, in shade, and the crack in its back.
  g.fillStyle = '#ABA592';
  g.beginPath();
  poly(
    g,
    [
      [272, -4],
      [W + 4, -4],
      [W + 4, LEDGE_Y + 14],
      [262, LEDGE_Y + 14],
      [268, 300],
    ],
    true,
  );
  g.fill();
  g.strokeStyle = 'rgba(40,40,44,.7)';
  g.lineWidth = 2.4;
  g.beginPath();
  trace(
    g,
    [
      [272, -4],
      [266, 150],
      [270, 300],
      [262, 450],
      [264, LEDGE_Y],
    ],
    false,
  );
  g.stroke();
  // The crack system the pitches follow, and the sheets and streaks around it.
  g.strokeStyle = 'rgba(40,40,44,.45)';
  g.lineWidth = 1.6;
  g.beginPath();
  trace(
    g,
    [
      [196, LEDGE_Y],
      [190, 470],
      [200, 360],
      [188, 240],
      [198, 120],
      [192, -4],
    ],
    false,
  );
  g.stroke();
  g.strokeStyle = 'rgba(40,40,44,.28)';
  for (let i = 0; i < 6; i++) {
    const x = 20 + r() * 200;
    const y = 50 + r() * 440;
    const a = 30 + r() * 40;
    g.beginPath();
    g.arc(x, y + a, a, Math.PI * 1.25, Math.PI * 1.6);
    g.stroke();
  }
  for (let i = 0; i < 10; i++) {
    const x = r() * W;
    const len = 140 + r() * 300;
    g.fillStyle = lin(g, 0, 0, 0, len, [
      [0, 'rgba(50,48,44,.26)'],
      [1, 'rgba(50,48,44,0)'],
    ]);
    g.fillRect(x, -4, 3 + r() * 9, len);
  }
  // The ledge, the anchor, and what hangs from it.
  g.fillStyle = '#B8AF99';
  g.beginPath();
  poly(
    g,
    [
      [40, LEDGE_Y],
      [250, LEDGE_Y - 2],
      [262, LEDGE_Y + 6],
      [236, LEDGE_Y + 16],
      [52, LEDGE_Y + 14],
    ],
    true,
  );
  g.fill();
  g.fillStyle = 'rgba(30,30,34,.3)';
  g.fillRect(52, LEDGE_Y + 14, 184, 5);
  const ax = 214;
  const ay = LEDGE_Y - 26;
  g.fillStyle = '#5A5A60';
  g.fillRect(ax - 4, ay - 2, 8, 4);
  g.strokeStyle = '#F4E6C8';
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(ax, ay);
  g.lineTo(ax + 24, LEDGE_Y + 40);
  g.moveTo(ax, ay);
  g.lineTo(ax + 70, LEDGE_Y + 70);
  g.stroke();
  // The haul bag, then the portaledge with its fly.
  g.fillStyle = '#2F5E8C';
  g.beginPath();
  g.ellipse(ax + 24, LEDGE_Y + 54, 9, 15, 0, 0, 6.2832);
  g.fill();
  g.fillStyle = '#D8693A';
  g.beginPath();
  poly(
    g,
    [
      [ax + 70, LEDGE_Y + 70],
      [ax + 112, LEDGE_Y + 96],
      [ax + 36, LEDGE_Y + 96],
    ],
    true,
  );
  g.fill();
  g.fillStyle = '#4A4A50';
  g.fillRect(ax + 34, LEDGE_Y + 96, 80, 4);
}
