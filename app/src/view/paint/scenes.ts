// Side-view scenes in the park-poster style: a sky plus three parallax layers (far ridges
// at 0.2, mid hills at 0.5, the ground at 1.0), flat shapes and no outlines. Each layer is
// painted once per scene and time of day, then scrolled.

import { ROUTES } from '../../sim';
import { CRAGS, GND, H, W, W_MAX, WW, Z, type CragSpec, GYM_W } from '../layout';
import { lerp, lin, mk, poly, rad, rr, trace, type G, type Pt } from '../kit/geom';
import { fbm, mulberry32 } from '../kit/noise';
import { chair, pineShape, popTop, rock, vanBody, vanWindows } from '../shapes';
import { paintGymBack, paintGymGround } from './gym';

export type Tod = 'morning' | 'night' | 'day';

export interface Palette {
  sky: [number, string][];
  orb: string;
  orbX: number;
  orbY: number;
  far2: string;
  far: string;
  mid: string;
  midTree: string;
  trees: string;
  ground: string;
  ground2: string;
  track: string;
  van: string;
  trim: string;
  glass: string;
  hvan?: string;
  chair?: string;
  wall?: string;
  wallShade?: string;
  wallDark?: string;
  talus?: string;
}

const SP: Record<Tod, Palette> = {
  morning: {
    sky: [
      [0, '#A8C8D8'],
      [0.55, '#DCE2D4'],
      [1, '#F4D7A6'],
    ],
    orb: '#FFF3D6',
    orbX: 250,
    orbY: 150,
    far2: '#A7B7BF',
    far: '#8EA2AE',
    mid: '#6F8A78',
    midTree: '#4B6A58',
    trees: '#2F4A3E',
    ground: '#C49E78',
    ground2: '#B08A66',
    track: '#9E7B5A',
    van: '#E6DCC4',
    trim: '#2F6F73',
    glass: '#6F8C98',
    hvan: '#B4553C',
    chair: '#C8553F',
  },
  night: {
    sky: [
      [0, '#111A31'],
      [0.6, '#27305A'],
      [1, '#56456A'],
    ],
    orb: '#F2E9D8',
    orbX: 270,
    orbY: 120,
    far2: '#303B5E',
    far: '#262F4F',
    mid: '#1D2542',
    midTree: '#161D34',
    trees: '#0F1528',
    ground: '#2A2935',
    ground2: '#23222D',
    track: '#1E1D27',
    van: '#8A8C98',
    trim: '#2A4F55',
    glass: '#3A4258',
    hvan: '#6E3A34',
    chair: '#7A3A34',
  },
  day: {
    sky: [
      [0, '#F2CF96'],
      [1, '#EFA46C'],
    ],
    orb: '#FCEBC8',
    orbX: 150,
    orbY: 92,
    far2: '#E0A583',
    far: '#D39473',
    mid: '#A58A68',
    midTree: '#4E5B45',
    trees: '#2C4A3B',
    ground: '#6B5A48',
    ground2: '#5E4F3F',
    track: '#7E6A55',
    van: '#E6DCC4',
    trim: '#2F6F73',
    glass: '#6F8C98',
    wall: '#CBC3B3',
    wallShade: '#8F939D',
    wallDark: '#4E4F58',
    talus: '#8A7865',
  },
};

// The valley's colours at a time of day, for what's drawn in it that isn't a scene: the
// fronts of the places you only see as a card.
export const valley = (tod: Tod): Palette => SP[tod];

// Granite Gorge: the canyon's in shade all day. The sky's a pale strip over the far wall,
// the rock is cool grey granite, and the trees are pines.
const GORGE: Palette = {
  sky: [
    [0, '#B9D2DC'],
    [0.6, '#DCE4DE'],
    [1, '#ECE3CD'],
  ],
  orb: '#FFF6E0',
  orbX: 292,
  orbY: 70,
  far2: '#A3B3BA',
  far: '#8798A2',
  mid: '#5F7569',
  midTree: '#3E594B',
  trees: '#294236',
  ground: '#5B584F',
  ground2: '#4E4B44',
  track: '#6C685E',
  van: '#E6DCC4',
  trim: '#2F6F73',
  glass: '#6F8C98',
  wall: '#A7AEB6',
  wallShade: '#838B96',
  wallDark: '#454C57',
  talus: '#8B8D8A',
};

// Moonstone: a high desert noon. Pale sky, mesas gone violet with distance, sand, and
// quartzite that's nearly white where the sun's on it.
const DESERT: Palette = {
  sky: [
    [0, '#9CC3D9'],
    [0.6, '#E3E4D6'],
    [1, '#F3DDB8'],
  ],
  orb: '#FFF4DA',
  orbX: 96,
  orbY: 78,
  far2: '#C9A7A0',
  far: '#B38C84',
  mid: '#C9A77E',
  midTree: '#6E7A55',
  trees: '#5E6B48',
  ground: '#D8BE92',
  ground2: '#C9AC7F',
  track: '#BFA073',
  van: '#E6DCC4',
  trim: '#2F6F73',
  glass: '#6F8C98',
  wall: '#E4D8C6',
  wallShade: '#C2AE9C',
  wallDark: '#8E7666',
  talus: '#CDB58F',
};

// The poster never outlines anything: shapes are fills, lines are plain strokes.
function fill(g: G, draw: (g: G) => void, col: string): void {
  g.beginPath();
  draw(g);
  g.fillStyle = col;
  g.fill();
}

function stroke(g: G, draw: (g: G) => void, col: string, w: number): void {
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = col;
  g.lineWidth = w;
  g.beginPath();
  draw(g);
  g.stroke();
}

// Skies are painted as wide as the widest screen, with the portrait screen's stretch in the
// middle, so a wider screen sees more sky around the same sun. What's soft in a sky (the
// gradient and the glow) is painted at one pixel to one; what's sharp (the sun or moon and
// the stars) is drawn over it each frame, crisp at any size.
export const SKY_W = W_MAX;
export const SKY_PAD = (SKY_W - W) / 2;

// The stars, in sky pixels, as thick as ever: 150 to a portrait screen's width.
export const STARS: [number, number, number][] = (() => {
  const r = mulberry32(77);
  const n = Math.round((150 * SKY_W) / W);
  return Array.from({ length: n }, () => [r() * SKY_W, r() * 420, r() < 0.12 ? 1.6 : r() * 0.9 + 0.4]);
})();

export function ridgeLine(
  w: number,
  base: number,
  amp: number,
  seed: number,
  freq: number,
  sharp = false,
): Pt[] {
  const pts: Pt[] = [];
  for (let x = -12; x <= w + 12; x += 8) {
    let n = fbm(x * freq, seed * 0.37, seed);
    if (sharp) n = 1 - Math.abs(n * 2 - 1);
    pts.push([x, base - n * amp]);
  }
  return pts;
}

function yOn(pts: Pt[], x: number): number {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    if (x >= a[0] && x <= b[0]) return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0] || 1));
  }
  return pts[pts.length - 1]![1];
}

function paintSky(P: Palette, tod: Tod): HTMLCanvasElement {
  const [c, g] = mk(SKY_W, H, 1);
  const night = tod === 'night';
  g.fillStyle = lin(g, 0, 0, 0, GND, P.sky);
  g.fillRect(0, 0, SKY_W, H);
  g.fillStyle = rad(g, SKY_PAD + P.orbX, P.orbY, 0, 110, [
    [0, night ? 'rgba(242,233,216,.22)' : 'rgba(255,243,214,.6)'],
    [1, 'rgba(255,243,214,0)'],
  ]);
  g.fillRect(0, 0, SKY_W, H);
  return c;
}

// The sharp part of a sky, in sky pixels.
function skyMarks(P: Palette, tod: Tod): SkyMarks {
  const night = tod === 'night';
  return { orb: { x: SKY_PAD + P.orbX, y: P.orbY, r: night ? 15 : 24, color: P.orb }, stars: night };
}

// Draws a sky's sun or moon and stars onto `g`, which maps sky pixels by `k` from (x0, y0).
export function drawSkyMarks(g: G, m: SkyMarks, x0: number, y0: number, k: number): void {
  if (m.stars)
    for (const [x, y, s] of STARS) {
      if (y > 380) continue;
      g.fillStyle = `rgba(242,233,216,${Math.min(1, 0.25 + s * 0.5).toFixed(2)})`;
      const d = (s > 1.2 ? 1.8 : 1.1) * k;
      g.fillRect((x - x0) * k, (y - y0) * k, d, d);
    }
  if (m.orb) {
    g.fillStyle = m.orb.color;
    g.beginPath();
    g.arc((m.orb.x - x0) * k, (m.orb.y - y0) * k, m.orb.r * k, 0, 6.2832);
    g.fill();
  }
}

const toGround = (w: number, pts: Pt[]) => (g: G) => {
  poly(g, pts, false);
  g.lineTo(w + 12, GND + 40);
  g.lineTo(-12, GND + 40);
  g.closePath();
};

// The far ridges; in a canyon, the far wall stands twice as tall.
function paintFar(P: Palette, w: number, seed: number, canyon = false): HTMLCanvasElement {
  const [c, g] = mk(w, H, 1.5);
  const k = canyon ? 2.2 : 1;
  fill(g, toGround(w, ridgeLine(w, GND - 150 * k, 95 * k, seed, 0.011, true)), P.far2);
  g.fillStyle = lin(g, 0, GND - 190, 0, GND, [
    [0, 'rgba(255,255,255,0)'],
    [1, 'rgba(255,255,255,.22)'],
  ]);
  g.fillRect(0, GND - 190, w, 200);
  fill(g, toGround(w, ridgeLine(w, GND - 92 * k, 72 * k, seed + 3, 0.015, true)), P.far);
  return c;
}

function juniper(g: G, x: number, y: number, s: number, col: string): void {
  fill(
    g,
    (gg) => {
      gg.ellipse(x, y - 9 * s, 12 * s, 9 * s, 0, 0, 6.2832);
      gg.moveTo(x + 9 * s, y - 17 * s);
      gg.ellipse(x + 3 * s, y - 17 * s, 8 * s, 6 * s, 0, 0, 6.2832);
    },
    col,
  );
}

function paintMid(P: Palette, w: number, seed: number, desert: boolean): HTMLCanvasElement {
  const [c, g] = mk(w, H, 1.5);
  const hill = ridgeLine(w, GND - 44, 42, seed, 0.006);
  const r = mulberry32(seed);
  const T: [number, number, number][] = [];
  for (let x = 8; x < w; x += 16 + r() * 26) {
    if (r() < 0.3) continue;
    T.push([x, yOn(hill, x) + 5, desert ? 0.8 + r() * 0.6 : 34 + r() * 44]);
  }
  if (!desert) for (const [x, y, h] of T) fill(g, (gg) => pineShape(gg, x, y, h), P.midTree);
  fill(g, toGround(w, hill), P.mid);
  if (desert) for (const [x, y, s] of T) juniper(g, x, y, s, P.midTree);
  return c;
}

interface VanLook {
  body: string;
  trim: string;
  glass: string;
  lit?: boolean;
  pop?: boolean;
}

// A side-view van, front to the right, tyres on y + h.
function drawVan(
  g: G,
  x: number,
  y: number,
  w: number,
  h: number,
  { body, trim, glass, lit = false, pop = true }: VanLook,
) {
  const wr = h * 0.19;
  g.fillStyle = 'rgba(0,0,0,.2)';
  g.beginPath();
  g.ellipse(x + w / 2, y + h + wr - 1, w * 0.5, 5, 0, 0, 6.2832);
  g.fill();
  if (pop) fill(g, (gg) => popTop(gg, x, y, w), '#EFE7D6');
  fill(g, (gg) => vanBody(gg, x, y, w, h), body);
  g.save();
  g.beginPath();
  vanBody(g, x, y, w, h);
  g.clip();
  g.fillStyle = trim;
  g.fillRect(x - 2, y + h * 0.58, w + 4, h * 0.2);
  g.fillStyle = 'rgba(0,0,0,.12)';
  g.fillRect(x - 2, y + h * 0.78, w + 4, h * 0.3);
  g.restore();
  for (const v of vanWindows(x, y, w, h)) fill(g, (gg) => gg.rect(...v), lit ? '#FFD27A' : glass);
  if (!lit) {
    g.fillStyle = 'rgba(255,255,255,.35)';
    for (const [vx, vy, vw, vh] of vanWindows(x, y, w, h)) {
      g.beginPath();
      g.moveTo(vx + vw * 0.2, vy);
      g.lineTo(vx + vw * 0.45, vy);
      g.lineTo(vx + vw * 0.2, vy + vh);
      g.lineTo(vx, vy + vh);
      g.closePath();
      g.fill();
    }
  }
  g.strokeStyle = 'rgba(0,0,0,.28)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x + w * 0.57, y + h * 0.14);
  g.lineTo(x + w * 0.57, y + h * 0.96);
  g.stroke();
  fill(g, (gg) => gg.rect(x + w * 0.6, y + h * 0.5, 8, 2.5), '#3A3A40');
  fill(g, (gg) => gg.arc(x + w * 0.975, y + h * 0.7, 3.4, 0, 6.2832), '#F7EBC8');
  for (const wx of [x + w * 0.2, x + w * 0.8]) {
    fill(g, (gg) => gg.arc(wx, y + h, wr, 0, 6.2832), '#23232A');
    fill(g, (gg) => gg.arc(wx, y + h, wr * 0.42, 0, 6.2832), '#A4A4AE');
  }
}

const LOT_VAN = { x: 110, w: 220, h: 90 };
const HZ_VAN = { x: 700, w: 160, h: 74 };
export const FIRE_X = 520;
// Café lights strung from your van to Hazel's.
export const LIGHTS: Pt[] = (() => {
  const a = [330, 468];
  const b = [706, 472];
  const o: Pt[] = [];
  for (let t = 0; t <= 1.0001; t += 0.0625)
    o.push([lerp(a[0]!, b[0]!, t), lerp(a[1]!, b[1]!, t) + Math.sin(Math.PI * t) * 26]);
  return o;
})();

function paintLotGround(P: Palette, tod: Tod): HTMLCanvasElement {
  const [c, g] = mk(WW, H, 2);
  const night = tod === 'night';
  for (const [x, h] of [
    [26, 236],
    [76, 186],
    [640, 150],
    [904, 212],
    [946, 252],
  ] as const)
    fill(g, (gg) => pineShape(gg, x, GND + 4, h), P.trees);
  fill(g, (gg) => gg.rect(-10, GND - 6, WW + 20, H), P.ground);
  g.fillStyle = P.ground2;
  g.fillRect(0, GND + 40, WW, H);
  const r = mulberry32(5);
  g.fillStyle = P.track;
  g.fillRect(0, GND + 16, WW, 3);
  g.fillRect(0, GND + 27, WW, 2);
  for (let i = 0; i < 30; i++) {
    const x = r() * WW;
    const y = GND + 8 + r() * 170;
    const s = 1.5 + r() * 2.5;
    fill(g, (gg) => gg.ellipse(x, y, s * 1.4, s, 0, 0, 6.2832), P.ground2);
  }
  const lv = LOT_VAN;
  drawVan(g, lv.x, GND - lv.h - lv.h * 0.19, lv.w, lv.h, {
    body: P.van,
    trim: P.trim,
    glass: P.glass,
    lit: night,
  });
  const hv = HZ_VAN;
  g.save();
  g.translate(hv.x * 2 + hv.w, 0);
  g.scale(-1, 1);
  drawVan(g, hv.x, GND - hv.h - hv.h * 0.19, hv.w, hv.h, {
    body: P.hvan!,
    trim: '#F4E6C8',
    glass: P.glass,
    lit: night,
    pop: false,
  });
  g.restore();
  stroke(g, (gg) => poly(gg, LIGHTS, false), night ? '#3A3240' : '#5A4A40', 1);
  if (!night)
    for (const p of LIGHTS) {
      g.fillStyle = '#EDE3CF';
      g.beginPath();
      g.arc(p[0], p[1] + 3, 2.2, 0, 6.2832);
      g.fill();
    }
  // Cooler, water jug, camp chairs, the fire ring and the morning coffee pot.
  fill(g, (gg) => gg.rect(344, GND - 18, 28, 18), '#3F7FB0');
  fill(g, (gg) => gg.rect(342, GND - 21, 32, 5), '#F4F1EA');
  fill(g, (gg) => rr(gg, 378, GND - 24, 13, 24, 3), '#E08A3A');
  for (const [x, d] of [
    [466, 1],
    [580, -1],
  ] as const)
    stroke(g, (gg) => chair(gg, x, GND - 4, d), P.chair!, 2.6);
  for (let k = 0; k < 7; k++) {
    const x = FIRE_X - 27 + k * 9;
    fill(g, (gg) => gg.ellipse(x, GND + 2, 5.5, 4, 0, 0, 6.2832), night ? '#4A4856' : '#8E8578');
  }
  stroke(
    g,
    (gg) => {
      gg.moveTo(FIRE_X - 14, GND);
      gg.lineTo(FIRE_X + 12, GND - 7);
      gg.moveTo(FIRE_X - 12, GND - 7);
      gg.lineTo(FIRE_X + 14, GND);
    },
    '#5A3A26',
    4,
  );
  if (!night) {
    fill(g, (gg) => rr(gg, FIRE_X + 18, GND - 19, 11, 13, 2), '#2F5E8C');
    stroke(
      g,
      (gg) => {
        gg.moveTo(FIRE_X + 29, GND - 16);
        gg.lineTo(FIRE_X + 33, GND - 19);
      },
      '#2F5E8C',
      1.6,
    );
  }
  return c;
}

const CRAG_VAN = { x: 34, w: 200, h: 82 };

// How a crag's rock is painted: Roadside's banded sandstone, the Gorge's granite, or
// Moonstone's quartzite.
type Rock = 'sandstone' | 'granite' | 'quartzite';

// The wall's outline: a ragged left edge from its foot, and either the scene's right edge
// or, where the wall ends, a top that steps down into the talus.
function wallEdge(c: CragSpec): Pt[] {
  const [x0, x1] = c.wall;
  const left: Pt[] = [
    [x0 + 38, GND],
    [x0 + 30, 470],
    [x0 + 14, 380],
    [x0 + 26, 300],
    [x0 + 6, 210],
    [x0 + 20, 120],
    [x0, 40],
    [x0 + 8, -20],
  ];
  const right: Pt[] =
    x1 >= c.width
      ? [
          [c.width + 20, -20],
          [c.width + 20, GND],
        ]
      : [
          [x1 - 260, -20],
          [x1 - 180, 40],
          [x1 - 120, 130],
          [x1 - 64, 250],
          [x1 - 22, 380],
          [x1 + 20, GND],
        ];
  return [...left, ...right];
}

function routeWiggle(x: number, seed: number): Pt[] {
  const r = mulberry32(seed);
  const pts: Pt[] = [];
  for (let y = GND - 8; y > -10; y -= 24) pts.push([x + (r() - 0.5) * 10, y]);
  return pts;
}

function sandstone(g: G, P: Palette, c: CragSpec, r: () => number): void {
  const [x0, x1] = c.wall;
  const shade: Pt[] = [
    [640, -20],
    [x1 + 20, -20],
    [x1 + 20, GND],
    [600, GND],
  ];
  fill(g, (gg) => poly(gg, shade, true), P.wallShade!);
  for (let i = 0; i < 30; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
    g.fillRect(x0 + 28 + r() * (x1 - x0), -10, 4 + r() * 16, GND);
  }
  // Bedding planes, then a darker foot where the wall meets the talus.
  g.strokeStyle = 'rgba(40,40,48,.22)';
  g.lineWidth = 1.6;
  for (const by of [150, 290, 420]) {
    g.beginPath();
    for (let x = x0 + 8; x <= x1 + 20; x += 20)
      g.lineTo(x, by + Math.sin(x * 0.03 + by) * 5 + (r() - 0.5) * 3);
    g.stroke();
  }
  g.fillStyle = P.wallDark!;
  g.beginPath();
  g.moveTo(600, 26);
  g.lineTo(x1 + 20, 14);
  g.lineTo(x1 + 20, 58);
  g.lineTo(640, 60);
  g.closePath();
  g.fill();
  for (const cx of [372, 628, 902]) {
    const pts: Pt[] = [];
    for (let y = GND; y > -10; y -= 30) pts.push([cx + (r() - 0.5) * 12, y]);
    stroke(g, (gg) => trace(gg, pts, false), 'rgba(40,40,48,.45)', 2.2);
  }
}

// Granite: broad panels split by joints, big arching sheets peeling off the face, black
// streaks where water runs off the rim, and lichen.
function granite(g: G, P: Palette, c: CragSpec, r: () => number): void {
  const [x0, x1] = c.wall;
  const right = Math.min(x1, c.width) + 20;
  for (let x = x0 + 30; x < right;) {
    const w = 90 + r() * 150;
    const lean = (r() - 0.5) * 50;
    const k = r();
    const tone = k < 0.4 ? 'rgba(24,28,36,.06)' : k < 0.75 ? 'rgba(24,28,36,.15)' : 'rgba(150,136,110,.14)';
    fill(
      g,
      (gg) =>
        poly(
          gg,
          [
            [x, -20],
            [x + w, -20],
            [x + w + lean, GND],
            [x + lean * 0.4, GND],
          ],
          true,
        ),
      tone,
    );
    const joint: Pt[] = [];
    for (let y = -20; y <= GND; y += 40)
      joint.push([x + w + (lean * (y + 20)) / (GND + 20) + (r() - 0.5) * 8, y]);
    // A dark line with a lit lip beside it, so the panels read as planes.
    stroke(g, (gg) => trace(gg, joint, false), 'rgba(34,38,46,.6)', 2.2);
    const lip: Pt[] = joint.map(([jx, jy]) => [jx + 2.5, jy]);
    stroke(g, (gg) => trace(gg, lip, false), 'rgba(236,238,236,.45)', 1.2);
    x += w;
  }
  // A shaded corner system, left of the steep line.
  fill(
    g,
    (gg) =>
      poly(
        gg,
        [
          [930, -20],
          [1010, -20],
          [990, GND],
          [946, GND],
        ],
        true,
      ),
    P.wallShade!,
  );
  for (let i = 0; i < 7; i++) {
    const cx = x0 + 80 + r() * (right - x0 - 140);
    const cy = 120 + r() * 320;
    const rad = 50 + r() * 70;
    const a0 = Math.PI * (1.25 + r() * 0.1);
    const a1 = a0 + Math.PI * (0.3 + r() * 0.12);
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(38,42,50,.5)';
    g.lineWidth = 2.2;
    g.beginPath();
    g.arc(cx, cy + rad, rad, a0, a1);
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.4)';
    g.lineWidth = 1.4;
    g.beginPath();
    g.arc(cx, cy + rad + 3.5, rad, a0, a1);
    g.stroke();
  }
  for (let i = 0; i < 16; i++) {
    const x = x0 + 40 + r() * (right - x0 - 60);
    const w = 4 + r() * 9;
    const len = 200 + r() * 300;
    g.fillStyle = lin(g, 0, 60, 0, 60 + len, [
      [0, 'rgba(34,38,46,.28)'],
      [1, 'rgba(34,38,46,0)'],
    ]);
    g.fillRect(x, -10, w, len + 70);
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = r() < 0.7 ? 'rgba(150,172,112,.4)' : 'rgba(214,196,120,.34)';
    g.beginPath();
    g.ellipse(x0 + 30 + r() * (right - x0), 100 + r() * 420, 3 + r() * 9, 2 + r() * 5, 0, 0, 6.2832);
    g.fill();
  }
  // The roof Power Endurance goes through.
  g.fillStyle = P.wallDark!;
  g.beginPath();
  g.moveTo(1030, 236);
  g.lineTo(1150, 226);
  g.lineTo(1150, 252);
  g.lineTo(1040, 258);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,.45)';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(1030, 236);
  g.lineTo(1150, 226);
  g.stroke();
}

// Quartzite: pale, hard and fractured square, with rust where water has run over it and a
// darker shaded side on the spire.
function quartzite(g: G, P: Palette, c: CragSpec, r: () => number): void {
  const [x0, x1] = c.wall;
  fill(
    g,
    (gg) =>
      poly(
        gg,
        [
          [x0 + 110, -20],
          [x1 + 30, -20],
          [x1 + 30, GND],
          [x0 + 170, GND],
        ],
        true,
      ),
    P.wallShade!,
  );
  // Fractures: long horizontals and short verticals, so the rock reads as blocks.
  g.strokeStyle = 'rgba(96,74,62,.4)';
  g.lineWidth = 1.6;
  for (let y = 40; y < GND; y += 46 + r() * 30) {
    g.beginPath();
    g.moveTo(x0, y);
    for (let x = x0; x <= x1 + 30; x += 30) g.lineTo(x, y + (r() - 0.5) * 6);
    g.stroke();
    for (let k = 0; k < 4; k++) {
      const vx = x0 + 20 + r() * (x1 - x0);
      g.beginPath();
      g.moveTo(vx, y);
      g.lineTo(vx + (r() - 0.5) * 6, y + 24 + r() * 20);
      g.stroke();
    }
  }
  for (let i = 0; i < 12; i++) {
    const x = x0 + 30 + r() * (x1 - x0 - 40);
    const len = 80 + r() * 200;
    const top = r() * 260;
    g.fillStyle = lin(g, 0, top, 0, top + len, [
      [0, 'rgba(176,96,52,.28)'],
      [1, 'rgba(176,96,52,0)'],
    ]);
    g.fillRect(x, top, 5 + r() * 10, len);
  }
}

// Behind-the-boulders trees: junipers at Roadside and Moonstone, pines in the Gorge.
const TREES: Record<string, [number, number][]> = {
  crag: [
    [18, 1.6],
    [250, 1.3],
    [1166, 1.5],
    [1384, 1.4],
  ],
  gorge: [
    [18, 210],
    [96, 170],
    [250, 150],
  ],
  moon: [
    [16, 1.2],
    [262, 0.9],
    [1180, 1.1],
    [1370, 1.3],
  ],
};

// The talus: rocks at the wall's foot, between the boulders.
const TALUS: Record<string, [number, number, number][]> = {
  crag: [
    [410, 26, 14],
    [560, 22, 12],
    [770, 50, 26],
    [918, 40, 22],
    [1056, 24, 12],
    [1270, 22, 10],
  ],
  moon: [
    [446, 24, 10],
    [720, 30, 12],
    [1040, 22, 10],
    [1340, 26, 12],
  ],
  gorge: [
    [620, 34, 16],
    [760, 26, 12],
    [880, 44, 22],
    [1030, 30, 14],
    [1320, 40, 20],
  ],
};

function paintCragGround(P: Palette, id: string, kind: Rock): HTMLCanvasElement {
  const spec = CRAGS[id]!;
  const w = spec.width;
  const [c, g] = mk(w, H, 2);
  const r = mulberry32(21);
  for (const [x, k] of TREES[id] ?? []) {
    if (kind === 'granite') fill(g, (gg) => pineShape(gg, x, GND + 4, k), P.trees);
    else juniper(g, x, GND - 4, k, P.trees);
  }
  const edge = wallEdge(spec);
  fill(g, (gg) => poly(gg, edge, true), P.wall!);
  g.save();
  g.beginPath();
  poly(g, edge, true);
  g.clip();
  if (kind === 'granite') granite(g, P, spec, r);
  else if (kind === 'quartzite') quartzite(g, P, spec, r);
  else sandstone(g, P, spec, r);
  g.fillStyle = lin(g, 0, GND - 60, 0, GND, [
    [0, 'rgba(40,36,34,0)'],
    [1, 'rgba(40,36,34,.28)'],
  ]);
  g.fillRect(spec.wall[0] - 2, GND - 60, w, 60);
  // The sport lines, chalked up the wall, their bolts dotted along them.
  for (const rt of spec.lines) {
    const pts = routeWiggle(rt.x, rt.n * 7);
    g.strokeStyle = 'rgba(247,235,208,.9)';
    g.lineWidth = 1.8;
    g.beginPath();
    trace(g, pts, false);
    g.stroke();
    g.fillStyle = '#2A2A30';
    for (let i = 2; i < pts.length; i += 3) {
      const [x, y] = pts[i]!;
      g.beginPath();
      g.arc(x, y, 1.8, 0, 6.2832);
      g.fill();
    }
  }
  g.restore();
  fill(g, (gg) => gg.rect(-10, GND - 6, w + 20, H), P.ground);
  g.fillStyle = P.track;
  g.fillRect(0, GND + 6, w, 22);
  for (const [x, tw, th] of TALUS[id] ?? []) fill(g, (gg) => rock(gg, x, GND - th * 0.2, tw, th), P.talus!);
  for (const b of spec.boulders) paintBoulder(g, b, kind);
  const cv = CRAG_VAN;
  drawVan(g, cv.x, GND - cv.h - cv.h * 0.19, cv.w, cv.h, { body: P.van, trim: P.trim, glass: P.glass });
  // The sign, and a pad someone left at the foot of the wall.
  fill(g, (gg) => gg.rect(spec.sign - 2, GND - 52, 4, 52), '#6B4A30');
  fill(g, (gg) => gg.rect(spec.sign - 20, GND - 58, 40, 16), '#7A5A3A');
  if (id === 'crag') fill(g, (gg) => rr(gg, 718, GND - 15, 20, 15, 5), '#C8553F');
  return c;
}

// Boulder colours by rock: lit face and shaded side.
const BOULDER_ROCK: Record<Rock, [string, string]> = {
  sandstone: ['#BDB5A5', '#9C968B'],
  granite: ['#C3C6C6', '#969BA1'],
  quartzite: ['#EDE3D3', '#C4B19E'],
};

// A boulder on the talus, side on: an angular block with a lit face and a shaded side,
// chalk, and a pad in front. Its line shows in its shape: steep problems lean out, an
// arête has its edge, a crack its split, a crimp line its edges.
function paintBoulder(g: G, spot: CragSpec['boulders'][number], kind: Rock): void {
  const { x, w, h, route: id } = spot;
  const type = ROUTES[id]?.type;
  const r = mulberry32([...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0);
  const l = x - w / 2;
  const rt = x + w / 2;
  const b = GND + 4;
  const t = b - h;
  const lean = type === 'power' || type === 'dyno' ? w * 0.16 : 0;
  const top: Pt = [x + (r() - 0.5) * w * 0.2 + lean, t - 2 + r() * 4];
  const pts: Pt[] = [
    [l, b],
    [l - 3 + r() * 5, t + h * (0.4 + r() * 0.15)],
    [l + w * (0.12 + r() * 0.1) + lean * 0.4, t + 3 + r() * 6],
    top,
    [rt - w * (0.1 + r() * 0.1) + lean, t + 4 + r() * 8],
    [rt + lean * 0.7 + 2, t + h * (0.3 + r() * 0.2)],
    [rt, b],
  ];
  const [lit, dark] = BOULDER_ROCK[kind];
  g.lineJoin = 'round';
  g.fillStyle = lit;
  g.strokeStyle = lit;
  g.lineWidth = 3;
  g.beginPath();
  poly(g, pts, true);
  g.fill();
  g.stroke();
  g.save();
  g.beginPath();
  poly(g, pts, true);
  g.clip();
  // The shaded side, from the summit down; an arête puts it on a sharp diagonal.
  const edge = type === 'technical' ? l + w * 0.34 : x + w * 0.12;
  fill(
    g,
    (gg) =>
      poly(
        gg,
        [
          [top[0], t - 12],
          [rt + 30, t - 12],
          [rt + 30, b + 10],
          [edge, b + 10],
        ],
        true,
      ),
    dark,
  );
  if (type === 'technical')
    stroke(g, (gg) => trace(gg, [top, [edge, b + 4]], false), 'rgba(255,255,255,.5)', 1.4);
  if (type === 'crack') {
    const cx = x - w * 0.05;
    const split: Pt[] = [];
    for (let y = t - 4; y <= b; y += h / 5) split.push([cx + (r() - 0.5) * 5, y]);
    stroke(g, (gg) => trace(gg, split, false), 'rgba(34,32,36,.75)', 2.4);
  }
  if (type === 'crimp') {
    g.strokeStyle = 'rgba(40,40,46,.35)';
    g.lineWidth = 1.2;
    for (let k = 0; k < 5; k++) {
      const ex = l + w * (0.12 + r() * 0.4);
      const ey = t + h * (0.2 + r() * 0.6);
      g.beginPath();
      g.moveTo(ex, ey);
      g.lineTo(ex + 5 + r() * 5, ey - 1);
      g.stroke();
    }
  }
  if (kind === 'granite') {
    g.fillStyle = 'rgba(40,40,46,.2)';
    for (let k = 0; k < Math.round((w * h) / 90); k++) g.fillRect(l + r() * w, t + r() * h, 1.4, 1.4);
  }
  g.fillStyle = 'rgba(255,255,255,.55)';
  for (let k = 0; k < 4; k++) {
    g.beginPath();
    g.ellipse(x - w * 0.14 + (r() - 0.5) * w * 0.26, b - h * (0.3 + k * 0.16), 2.6, 1.8, 0, 0, 6.2832);
    g.fill();
  }
  g.fillStyle = 'rgba(40,36,34,.18)';
  g.fillRect(l - 10, b - 8, w + 20, 12);
  g.restore();
  fill(g, (gg) => gg.rect(x - w / 2 - 6, GND - 1, w + 12, 7), type === 'dyno' ? '#C8553F' : '#3F7F6A');
}

export interface Layer {
  p: number;
  w: number;
  c: HTMLCanvasElement;
}
export interface SkyMarks {
  orb: { x: number; y: number; r: number; color: string } | null;
  stars: boolean;
}
export interface SceneArt {
  // What's behind the layers and stays put on screen: a sky, or the gym's back wall. It is
  // SKY_W wide and H tall in sky pixels, however many canvas pixels that is.
  sky: HTMLCanvasElement;
  marks: SkyMarks;
  layers: Layer[];
}

const cache = new Map<string, SceneArt>();

// The widest stretch of a scene anything shows at once, in world pixels: the widest screen,
// which sees about three times what a portrait one does, or a place card's header, about
// twice. The far layers are painted wide enough for it wherever it looks.
export const SEEN = Math.max(600, W_MAX / Z);

// The painted layers for a scene at a time of day. Two are kept: the one you're in and the
// one you just left, so walking back doesn't repaint. A place card's header paints from a
// scene without keeping it (`keep` false), so looking at the map never pushes out yours.
export function sceneArt(id: string, tod: Tod, keep = true): SceneArt {
  const key = id === 'gym' ? id : `${id}:${tod}`;
  const a = cache.get(key) ?? paintArt(id, tod);
  if (keep && !cache.has(key)) {
    cache.set(key, a);
    while (cache.size > 2) cache.delete(cache.keys().next().value!);
  }
  return a;
}

function paintArt(id: string, tod: Tod): SceneArt {
  if (id === 'gym')
    return {
      sky: paintGymBack(SKY_W),
      marks: { orb: null, stars: false },
      layers: [{ p: 1, w: GYM_W, c: paintGymGround() }],
    };
  const crag = CRAGS[id];
  const gorge = id === 'gorge';
  const moon = id === 'moon';
  const P = gorge ? GORGE : moon ? DESERT : SP[crag ? 'day' : tod];
  const w = crag?.width ?? WW;
  const lw = (p: number) => SEEN + (w - SEEN) * p;
  const seed = gorge ? 17 : moon ? 23 : crag ? 11 : 5;
  const rock: Rock = gorge ? 'granite' : moon ? 'quartzite' : 'sandstone';
  return {
    sky: paintSky(P, crag ? 'day' : tod),
    marks: skyMarks(P, crag ? 'day' : tod),
    layers: [
      { p: 0.2, w: lw(0.2), c: paintFar(P, lw(0.2), seed, gorge) },
      { p: 0.5, w: lw(0.5), c: paintMid(P, lw(0.5), seed + 2, !!crag && !gorge) },
      { p: 1, w, c: crag ? paintCragGround(P, id, rock) : paintLotGround(P, tod) },
    ],
  };
}
