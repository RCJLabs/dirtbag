// Side-view scenes in the park-poster style: a sky plus three parallax layers (far ridges
// at 0.2, mid hills at 0.5, the ground at 1.0), flat shapes and no outlines. Each layer is
// painted once per scene and time of day, then scrolled.

import { BASE_ROUTES, GND, H, W, WW } from '../layout';
import { lerp, lin, mk, poly, rad, rr, trace, type G, type Pt } from '../kit/geom';
import { fbm, mulberry32 } from '../kit/noise';
import { chair, pineShape, popTop, rock, vanBody, vanWindows } from '../shapes';
import { ROUTES } from '../../sim';

export type Tod = 'morning' | 'night' | 'day';

interface Palette {
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

export const STARS: [number, number, number][] = (() => {
  const r = mulberry32(77);
  return Array.from({ length: 150 }, () => [r() * W, r() * 420, r() < 0.12 ? 1.6 : r() * 0.9 + 0.4]);
})();

function ridgeLine(w: number, base: number, amp: number, seed: number, freq: number, sharp = false): Pt[] {
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
  const [c, g] = mk(W, H, 2);
  const night = tod === 'night';
  g.fillStyle = lin(g, 0, 0, 0, GND, P.sky);
  g.fillRect(0, 0, W, H);
  g.fillStyle = rad(g, P.orbX, P.orbY, 0, 110, [
    [0, night ? 'rgba(242,233,216,.22)' : 'rgba(255,243,214,.6)'],
    [1, 'rgba(255,243,214,0)'],
  ]);
  g.fillRect(0, 0, W, H);
  if (night)
    for (const [x, y, s] of STARS) {
      if (y > 380) continue;
      g.fillStyle = `rgba(242,233,216,${Math.min(1, 0.25 + s * 0.5).toFixed(2)})`;
      const d = s > 1.2 ? 1.8 : 1.1;
      g.fillRect(x, y, d, d);
    }
  g.fillStyle = P.orb;
  g.beginPath();
  g.arc(P.orbX, P.orbY, night ? 15 : 24, 0, 6.2832);
  g.fill();
  return c;
}

const toGround = (w: number, pts: Pt[]) => (g: G) => {
  poly(g, pts, false);
  g.lineTo(w + 12, GND + 40);
  g.lineTo(-12, GND + 40);
  g.closePath();
};

function paintFar(P: Palette, w: number, seed: number): HTMLCanvasElement {
  const [c, g] = mk(w, H, 1.5);
  fill(g, toGround(w, ridgeLine(w, GND - 150, 95, seed, 0.011, true)), P.far2);
  g.fillStyle = lin(g, 0, GND - 190, 0, GND, [
    [0, 'rgba(255,255,255,0)'],
    [1, 'rgba(255,255,255,.22)'],
  ]);
  g.fillRect(0, GND - 190, w, 200);
  fill(g, toGround(w, ridgeLine(w, GND - 92, 72, seed + 3, 0.015, true)), P.far);
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
const WALL_EDGE: Pt[] = [
  [300, GND],
  [292, 470],
  [276, 380],
  [288, 300],
  [268, 210],
  [282, 120],
  [262, 40],
  [270, -20],
  [WW + 20, -20],
  [WW + 20, GND],
];

function routeWiggle(x: number, seed: number): Pt[] {
  const r = mulberry32(seed);
  const pts: Pt[] = [];
  for (let y = GND - 8; y > -10; y -= 24) pts.push([x + (r() - 0.5) * 10, y]);
  return pts;
}

function paintCragGround(P: Palette): HTMLCanvasElement {
  const [c, g] = mk(WW, H, 2);
  const r = mulberry32(21);
  juniper(g, 18, GND - 4, 1.6, P.trees);
  juniper(g, 250, GND - 2, 1.3, P.trees);
  fill(g, (gg) => poly(gg, WALL_EDGE, true), P.wall!);
  g.save();
  g.beginPath();
  poly(g, WALL_EDGE, true);
  g.clip();
  const shade: Pt[] = [
    [640, -20],
    [WW + 20, -20],
    [WW + 20, GND],
    [600, GND],
  ];
  fill(g, (gg) => poly(gg, shade, true), P.wallShade!);
  for (let i = 0; i < 22; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
    g.fillRect(290 + r() * 680, -10, 4 + r() * 16, GND);
  }
  // Bedding planes, then a darker foot where the wall meets the talus.
  g.strokeStyle = 'rgba(40,40,48,.22)';
  g.lineWidth = 1.6;
  for (const by of [150, 290, 420]) {
    g.beginPath();
    for (let x = 270; x <= WW + 20; x += 20) g.lineTo(x, by + Math.sin(x * 0.03 + by) * 5 + (r() - 0.5) * 3);
    g.stroke();
  }
  g.fillStyle = lin(g, 0, GND - 60, 0, GND, [
    [0, 'rgba(40,36,34,0)'],
    [1, 'rgba(40,36,34,.28)'],
  ]);
  g.fillRect(260, GND - 60, WW, 60);
  g.fillStyle = P.wallDark!;
  g.beginPath();
  g.moveTo(600, 26);
  g.lineTo(WW + 20, 14);
  g.lineTo(WW + 20, 58);
  g.lineTo(640, 60);
  g.closePath();
  g.fill();
  for (const cx of [372, 628, 902]) {
    const pts: Pt[] = [];
    for (let y = GND; y > -10; y -= 30) pts.push([cx + (r() - 0.5) * 12, y]);
    stroke(g, (gg) => trace(gg, pts, false), 'rgba(40,40,48,.45)', 2.2);
  }
  // The lines: the one you can climb solid and bright, the rest dashed.
  for (const rt of BASE_ROUTES) {
    const open = !!ROUTES[rt.route]?.cruxes.length;
    const pts = routeWiggle(rt.x, rt.n * 7);
    g.save();
    g.setLineDash(open ? [] : [4, 4]);
    g.strokeStyle = open ? 'rgba(247,235,208,.9)' : 'rgba(247,235,208,.55)';
    g.lineWidth = open ? 1.8 : 1.2;
    g.beginPath();
    trace(g, pts, false);
    g.stroke();
    g.restore();
    g.fillStyle = '#2A2A30';
    for (let i = 2; i < pts.length; i += 3) {
      const [x, y] = pts[i]!;
      g.beginPath();
      g.arc(x, y, 1.8, 0, 6.2832);
      g.fill();
    }
  }
  g.restore();
  fill(g, (gg) => gg.rect(-10, GND - 6, WW + 20, H), P.ground);
  g.fillStyle = P.track;
  g.fillRect(0, GND + 6, WW, 22);
  for (const [x, w, h] of [
    [318, 44, 24],
    [470, 30, 16],
    [612, 38, 20],
    [770, 50, 26],
    [918, 40, 22],
  ] as const)
    fill(g, (gg) => rock(gg, x, GND - h * 0.2, w, h), P.talus!);
  const cv = CRAG_VAN;
  drawVan(g, cv.x, GND - cv.h - cv.h * 0.19, cv.w, cv.h, { body: P.van, trim: P.trim, glass: P.glass });
  fill(g, (gg) => gg.rect(270, GND - 52, 4, 52), '#6B4A30');
  fill(g, (gg) => gg.rect(252, GND - 58, 40, 16), '#7A5A3A');
  fill(g, (gg) => rr(gg, 718, GND - 15, 20, 15, 5), '#C8553F');
  return c;
}

export interface Layer {
  p: number;
  w: number;
  c: HTMLCanvasElement;
}
export interface SceneArt {
  sky: HTMLCanvasElement;
  layers: Layer[];
}

const cache = new Map<string, SceneArt>();

// The painted layers for a scene at a time of day. Two are kept: the one you're in and the
// one you just left, so walking back doesn't repaint.
export function sceneArt(id: string, tod: Tod): SceneArt {
  const key = `${id}:${tod}`;
  let a = cache.get(key);
  if (a) return a;
  const crag = id === 'crag';
  const P = SP[crag ? 'day' : tod];
  const lw = (p: number) => 360 + (WW - 360) * p;
  a = {
    sky: paintSky(P, crag ? 'day' : tod),
    layers: [
      { p: 0.2, w: lw(0.2), c: paintFar(P, lw(0.2), crag ? 11 : 5) },
      { p: 0.5, w: lw(0.5), c: paintMid(P, lw(0.5), crag ? 13 : 7, crag) },
      { p: 1, w: WW, c: crag ? paintCragGround(P) : paintLotGround(P, tod) },
    ],
  };
  cache.set(key, a);
  while (cache.size > 2) cache.delete(cache.keys().next().value!);
  return a;
}
