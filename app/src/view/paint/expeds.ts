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

// ---- Cerro Torre (Phase 24.7) ----

// From the moraine above Laguna Torre: the needle and its rime mushroom, the Southeast Ridge
// its left skyline, rising from the Col of Patience beside El Mocho; Torre Egger and
// Standhardt to its right; the ice cap's white edge behind them all. Under them the Torre
// glacier, the moraine, and the lake with its bergs. Drawn straight in screen units: the
// needle's summit under the HUD, the glacier where the day's card starts.
const TORRE: Record<'day' | 'night' | 'storm' | 'stormNight', Look> = {
  day: {
    sky: [
      [0, '#5E8FBE'],
      [0.6, '#A9C6DA'],
      [1, '#DDE6E6'],
    ],
    lit: '#B9AA9A',
    shade: '#7F756E',
    streak: 'rgba(40,36,40,.35)',
    far: '#E9EEF2',
    trees: '#8A8378',
    trees2: '#6F695F',
    meadow: ['#7FA0A6', '#5F7E86'],
    cloud: 'rgba(255,255,255,.92)',
  },
  night: {
    sky: [
      [0, '#0D1630'],
      [0.6, '#1F2A50'],
      [1, '#34405E'],
    ],
    lit: '#5A607A',
    shade: '#3D4258',
    streak: 'rgba(8,10,22,.45)',
    far: '#8C96B2',
    trees: '#2C3040',
    trees2: '#222634',
    meadow: ['#26324A', '#1C263A'],
    cloud: 'rgba(130,140,170,.5)',
  },
  storm: {
    sky: [
      [0, '#4B5560'],
      [0.6, '#6E7882'],
      [1, '#8E969A'],
    ],
    lit: '#8C8782',
    shade: '#66625E',
    streak: 'rgba(26,28,34,.45)',
    far: '#B8C0C6',
    trees: '#6A665E',
    trees2: '#57534C',
    meadow: ['#5F7276', '#4C5E62'],
    cloud: 'rgba(96,104,114,.96)',
  },
  stormNight: {
    sky: [
      [0, '#0A0F1C'],
      [0.6, '#171D30'],
      [1, '#242A3C'],
    ],
    lit: '#40465A',
    shade: '#2E3346',
    streak: 'rgba(6,8,16,.5)',
    far: '#5A6276',
    trees: '#1E2230',
    trees2: '#181B26',
    meadow: ['#1C2434', '#151C2A'],
    cloud: 'rgba(36,40,56,.96)',
  },
};

const T_FOOT = 336;
const NEEDLE: Pt[] = [
  [CX - 170, T_FOOT],
  [CX - 168, 306],
  [CX - 124, 298],
  [CX - 84, 282],
  [CX - 58, 262],
  [CX - 44, 236],
  [CX - 34, 200],
  [CX - 26, 166],
  [CX - 20, 140],
  [CX + 16, 140],
  [CX + 20, 172],
  [CX + 26, 214],
  [CX + 32, 262],
  [CX + 44, T_FOOT],
];
// The rime mushroom on the summit: wider than the rock under it, and always there.
const MUSHROOM: [number, number, number, number][] = [
  [-10, 132, 12, 10],
  [6, 130, 13, 11],
  [-2, 118, 12, 10],
  [12, 116, 9, 8],
  [-14, 120, 8, 7],
  [2, 108, 8, 6],
];
const MOCHO: Pt[] = [
  [CX - 300, T_FOOT],
  [CX - 268, 290],
  [CX - 246, 270],
  [CX - 226, 266],
  [CX - 208, 278],
  [CX - 188, 300],
  [CX - 168, 308],
  [CX - 160, T_FOOT],
];
const EGGER: Pt[] = [
  [CX + 62, T_FOOT],
  [CX + 76, 260],
  [CX + 86, 204],
  [CX + 94, 172],
  [CX + 106, 170],
  [CX + 112, 196],
  [CX + 118, 252],
  [CX + 130, T_FOOT],
];
const STANDHARDT: Pt[] = [
  [CX + 140, T_FOOT],
  [CX + 160, 262],
  [CX + 170, 218],
  [CX + 182, 208],
  [CX + 194, 220],
  [CX + 204, 268],
  [CX + 224, T_FOOT],
];
// The Southeast Ridge, a step inside the skyline, from the col to the mushroom.
export const TORRE_LINE: Pt[] = [
  [CX - 164, 306],
  [CX - 122, 300],
  [CX - 82, 286],
  [CX - 54, 264],
  [CX - 38, 232],
  [CX - 28, 194],
  [CX - 18, 150],
];

// A peak: lit left of `split`, shaded right of it, with rime caught on its edges.
function peak(g: G, pts: Pt[], split: number, L: Look, r: () => number, rime = 6): void {
  fill(g, pts, L.lit);
  g.save();
  g.beginPath();
  poly(g, pts, true);
  g.clip();
  g.fillStyle = L.shade;
  g.fillRect(split, 0, SKY_W, H);
  g.restore();
  // Rime plastered on the skyline, thickest high up, in short feathers.
  g.fillStyle = 'rgba(244,248,252,.7)';
  const sky = pts.slice(1, -1);
  for (let i = 0; i < rime; i++) {
    const k = Math.floor(r() * (sky.length - 1));
    const a = sky[k]!;
    const b = sky[k + 1]!;
    const t = r();
    const x = lerp(a[0], b[0], t);
    const y = lerp(a[1], b[1], t);
    g.beginPath();
    g.ellipse(x, y + 1, 1.2 + r() * 1.8, 1.8 + r() * 2.6, 0, 0, 6.2832);
    g.fill();
  }
}

// Lenticular clouds, stacked like plates: the wind at the summits, on a fine day.
function lenticular(g: G, x: number, y: number, w: number, col: string): void {
  g.fillStyle = col;
  for (let k = 0; k < 3; k++) {
    g.beginPath();
    g.ellipse(x + k * 6, y - k * 7, w * (1 - k * 0.22), 6 - k, 0, 0, 6.2832);
    g.fill();
  }
}

function paintTorre(g: G, night: boolean, storm: boolean): void {
  const L = TORRE[storm ? (night ? 'stormNight' : 'storm') : night ? 'night' : 'day'];
  const r = mulberry32(307);
  g.fillStyle = lin(g, 0, 0, 0, T_FOOT, L.sky);
  g.fillRect(0, 0, SKY_W, H);
  if (night && !storm) {
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(242,233,216,${(0.3 + r() * 0.6).toFixed(2)})`;
      const d = r() < 0.1 ? 1.8 : 1.1;
      g.fillRect(r() * SKY_W, r() * 300, d, d);
    }
    g.fillStyle = '#F2E9D8';
    g.beginPath();
    g.arc(CX - 210, 92, 13, 0, 6.2832);
    g.fill();
  } else if (!storm) {
    lenticular(g, CX + 150, 96, 70, L.cloud);
    lenticular(g, CX - 260, 120, 54, L.cloud);
    lenticular(g, CX + 420, 140, 80, L.cloud);
  }
  // The ice cap's edge, white behind the peaks, and the Fitz Roy group's teeth far off.
  const cap: Pt[] = [[-10, T_FOOT]];
  for (let x = -10; x <= SKY_W + 10; x += 18)
    cap.push([x, 262 + Math.sin(x * 0.013) * 10 + (Math.abs(((x * 7) % 46) - 23) - 11) * 0.6]);
  cap.push([SKY_W + 10, T_FOOT]);
  fill(g, cap, L.far);
  const teeth: Pt[] = [[CX + 290, T_FOOT]];
  let tx = CX + 300;
  for (let i = 0; i < 12; i++) {
    tx += 14 + r() * 30;
    teeth.push([tx, i % 2 ? 250 + r() * 18 : 186 + r() * 50]);
  }
  teeth.push([CX + 660, T_FOOT]);
  g.globalAlpha = 0.55;
  fill(g, teeth, L.shade);
  fill(
    g,
    teeth.map(([x, y]) => [SKY_W - x + 40, y + 10]),
    L.shade,
  );
  g.globalAlpha = 1;
  // The towers, back to front.
  peak(g, STANDHARDT, CX + 182, L, r, 5);
  peak(g, EGGER, CX + 100, L, r, 6);
  peak(g, MOCHO, CX - 226, L, r, 4);
  peak(g, NEEDLE, CX - 2, L, r, 14);
  // The mushroom over it all, shaded on its lee side.
  const rimeCol = night ? '#C9D0E0' : storm ? '#D6DBDE' : '#F6F8FA';
  g.fillStyle = rimeCol;
  for (const [x, y, rx, ry] of MUSHROOM) {
    g.beginPath();
    g.ellipse(CX + x, y, rx, ry, 0, 0, 6.2832);
    g.fill();
  }
  g.fillStyle = 'rgba(110,130,160,.3)';
  for (const [x, y, rx, ry] of MUSHROOM.filter(([x]) => x > 4)) {
    g.beginPath();
    g.ellipse(CX + x + 2, y + 2, rx * 0.8, ry * 0.8, 0, 0, 6.2832);
    g.fill();
  }
  // The storm: a plume torn off the summit downwind, and cloud on the towers.
  if (storm) {
    g.fillStyle = L.cloud;
    for (let i = 0; i < 26; i++) {
      const t = i / 26;
      g.beginPath();
      g.ellipse(CX + 4 + t * 520, 118 + t * 40 + (r() - 0.5) * 16, 30 + t * 64, 20 + t * 6, 0, 0, 6.2832);
      g.fill();
    }
    cloudBank(g, 200, 70, L.cloud, 313);
  }
  // The glacier, its crevasses, then the moraine and the lake with its bergs.
  g.fillStyle = lin(g, 0, T_FOOT - 6, 0, 392, [
    [0, night ? '#7C88A6' : storm ? '#C2CACE' : '#EEF3F6'],
    [1, night ? '#5E6A88' : storm ? '#A2ACB2' : '#C9D8E2'],
  ]);
  g.beginPath();
  poly(
    g,
    [
      [-10, T_FOOT - 4],
      [SKY_W + 10, T_FOOT - 4],
      [SKY_W + 10, 392],
      [-10, 392],
    ],
    true,
  );
  g.fill();
  g.strokeStyle = night ? 'rgba(30,40,70,.5)' : 'rgba(80,110,140,.45)';
  g.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const x = r() * SKY_W;
    const y = T_FOOT + 6 + r() * 50;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 10 + r() * 22, y + 2 + r() * 3);
    g.stroke();
  }
  const shore: Pt[] = [[-10, 392]];
  for (let x = -10; x <= SKY_W + 10; x += 20) shore.push([x, 392 + Math.sin(x * 0.02) * 6 + r() * 4]);
  shore.push([SKY_W + 10, 430], [-10, 430]);
  fill(g, shore, L.trees);
  g.fillStyle = lin(g, 0, 426, 0, H, [
    [0, L.meadow[0]],
    [1, L.meadow[1]],
  ]);
  g.fillRect(0, 426, SKY_W, H - 426);
  g.fillStyle = night ? '#A8B4CC' : '#F2F6F8';
  for (let i = 0; i < 16; i++) {
    const x = r() * SKY_W;
    const y = 450 + r() * 160;
    const w = 6 + r() * 20;
    g.beginPath();
    poly(
      g,
      [
        [x - w, y],
        [x - w * 0.5, y - w * 0.5],
        [x + w * 0.3, y - w * 0.6],
        [x + w, y],
      ],
      true,
    );
    g.fill();
  }
  g.fillStyle = L.trees2;
  g.fillRect(0, H - 60, SKY_W, 60);
}

// Snow, not rain, where the water's snow: slower, wandering flakes.
export function drawSnow(g: G, w: number, h: number, t: number, still: boolean): void {
  g.fillStyle = 'rgba(60,70,90,.38)';
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(240,244,250,.85)';
  let seed = 11;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 140; i++) {
    const x0 = r() * (w + 80);
    const y0 = r() * h;
    const v = 0.6 + r() * 0.6;
    const fall = still ? 0 : t * 110 * v;
    const y = ((y0 + fall) % (h + 20)) - 10;
    // Blown left by the wind, wrapping round the screen, wandering as it falls.
    const span = w + 80;
    const drift = still ? 0 : t * 60 * v;
    const x = ((((x0 - drift) % span) + span) % span) - 40 + Math.sin(y * 0.03 + i) * 6;
    const d = 1.2 + r() * 1.6;
    g.fillRect(x, y, d, d);
  }
}

// Which objectives' storms are snow.
export const SNOWS = (id: string): boolean => id !== 'elcap';

// The objectives with a scene painted so far; the rest are seen from the Lot.
export const SCENED = ['elcap', 'cerrotorre'];

// An objective's scene, by time of day and weather. Two are kept, as the scenes are.
const cache = new Map<string, HTMLCanvasElement>();
export function expedScene(id: string, night: boolean, storm: boolean): HTMLCanvasElement {
  const key = `${id}:${night}:${storm}`;
  let c = cache.get(key);
  if (!c) {
    const [cv, g] = mk(SKY_W, H, 1);
    if (id === 'cerrotorre') paintTorre(g, night, storm);
    else paintElcap(g, night, storm);
    c = cv;
    cache.set(key, c);
    while (cache.size > 2) cache.delete(cache.keys().next().value!);
  }
  return c;
}

// Where you are on the wall in the scene, in sky pixels: `k` of the way up its line.
export function expedSpot(id: string, k: number): Pt {
  const pts = id === 'cerrotorre' ? TORRE_LINE : ELCAP_LINE;
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

// Each objective's rock close up: the face, the corner's shade, the ledge, and what's far
// below the belay.
const ROCK: Record<
  string,
  { face: [string, string]; corner: string; ledge: string; air: [number, string][] }
> = {
  elcap: {
    face: ['#DCD3BF', '#CEC5B0'],
    corner: '#ABA592',
    ledge: '#B8AF99',
    air: [
      [0, '#BFD3DE'],
      [0.7, '#A9C0B4'],
      [1, '#C8B574'],
    ],
  },
  cerrotorre: {
    face: ['#B4A698', '#9C9088'],
    corner: '#7E746E',
    ledge: '#E8EEF2',
    air: [
      [0, '#C6D4E0'],
      [0.6, '#E4ECF0'],
      [1, '#B8CCD8'],
    ],
  },
};

// A pitch on an objective, close up: its granite, a corner, the crack system; under the belay
// ledge, the haul bag and the portaledge hanging, and a long way down, El Cap's meadow or
// the Torre glacier. Cerro Torre's rock carries rime.
export function paintExpedWall(g: G, place: string): void {
  const R = ROCK[place] ?? ROCK.elcap!;
  const ice = place === 'cerrotorre';
  const r = mulberry32(219);
  // The air first: haze down to what's below.
  g.fillStyle = lin(g, 0, LEDGE_Y, 0, H, R.air);
  g.fillRect(0, LEDGE_Y, W, H - LEDGE_Y);
  if (ice) {
    g.strokeStyle = 'rgba(80,110,140,.4)';
    g.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const x = r() * W;
      const y = H - 70 + r() * 60;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 8 + r() * 14, y + 2);
      g.stroke();
    }
  } else {
    g.fillStyle = 'rgba(46,74,58,.55)';
    g.beginPath();
    for (let x = -6; x < W + 6; x += 5 + r() * 6) pineShape(g, x, H - 12, 6 + r() * 6);
    g.fill();
  }
  // The face.
  g.fillStyle = lin(g, 0, 0, 0, LEDGE_Y, [
    [0, R.face[0]],
    [1, R.face[1]],
  ]);
  g.fillRect(0, 0, W, LEDGE_Y + 14);
  // The corner right of the line, in shade, and the crack in its back.
  g.fillStyle = R.corner;
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
  // Rime on the Torre: feathers on the edges, ice in the back of the corner.
  if (ice) {
    g.fillStyle = 'rgba(244,248,252,.82)';
    for (let i = 0; i < 26; i++) {
      const y = r() * (LEDGE_Y - 20);
      const x = 266 + (r() - 0.5) * 10;
      g.beginPath();
      g.ellipse(x, y, 2 + r() * 4, 3 + r() * 6, 0, 0, 6.2832);
      g.fill();
    }
    // And a little in the crack the line follows.
    for (let i = 0; i < 8; i++) {
      const y = 40 + r() * (LEDGE_Y - 80);
      g.beginPath();
      g.ellipse(194 + (r() - 0.5) * 8, y, 1.5 + r() * 2, 2 + r() * 3, 0, 0, 6.2832);
      g.fill();
    }
    g.strokeStyle = 'rgba(214,232,244,.8)';
    g.lineWidth = 3;
    g.beginPath();
    trace(
      g,
      [
        [270, 40],
        [266, 160],
        [270, 280],
      ],
      false,
    );
    g.stroke();
  }
  // The ledge, the anchor, and what hangs from it.
  g.fillStyle = R.ledge;
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
