// The valley map's geography: the river, the highway, the town blocks, and a heightfield
// the terrain is shaded from. All of it is fixed, so it's computed once and cached.

import { clamp, lerp, mk, spline, type G, type Pt } from './kit/geom';
import { fbm } from './kit/noise';
import { H, W } from './layout';

export const riverX = (y: number): number =>
  176 + 34 * Math.sin(y * 0.0085 + 0.8) + 12 * Math.sin(y * 0.023 + 1.7);

export const ROAD: Pt[] = spline(
  [
    [238, 760],
    [226, 660],
    [216, 570],
    [207, 480],
    [212, 410],
    [232, 340],
    [256, 280],
    [262, 214],
    [280, 150],
    [318, 98],
    [384, 58],
  ],
  12,
);

export function roadX(y: number): number {
  for (let i = 0; i < ROAD.length - 1; i++) {
    const a = ROAD[i]!;
    const b = ROAD[i + 1]!;
    if ((a[1] - y) * (b[1] - y) <= 0) {
      const t = (y - a[1]) / (b[1] - a[1] || 1);
      return a[0] + (b[0] - a[0]) * t;
    }
  }
  return y < 58 ? 384 : 238;
}

export const RIVER: Pt[] = Array.from({ length: 98 }, (_, i) => {
  const y = i * 8 - 10;
  return [riverX(y), y];
});
export const LAKE = { x: 78, y: 612, rx: 44, ry: 28 };
export const CREEK: Pt[] = [
  [120, 606],
  [134, 602],
  [150, 605],
  [166, 600],
];
// The Old Town spur off the highway, and where it leaves it.
export const SPUR: Pt[] = [
  [207, 470],
  [176, 468],
  [146, 467],
  [118, 466],
];
export const JUNCTION: Pt = [207, 470];
export const TRAILS: Pt[][] = [
  [
    [266, 258],
    [276, 244],
    [286, 232],
  ],
  [
    [274, 168],
    [236, 172],
    [198, 168],
    [160, 162],
    [122, 156],
    [96, 152],
  ],
];
export const BLOCKS: [number, number, number, number][] = [
  [222, 400, 30, 20],
  [258, 400, 34, 20],
  [222, 426, 30, 22],
  [258, 426, 34, 22],
  [226, 462, 26, 22],
  [258, 462, 40, 22],
  [226, 490, 26, 22],
  [258, 490, 40, 22],
  [72, 446, 22, 17],
  [98, 446, 24, 17],
  [72, 467, 22, 17],
  [98, 467, 24, 17],
  [256, 328, 18, 12],
  [236, 342, 16, 10],
];
export const LOT_RECT: [number, number, number, number] = [242, 598, 44, 28];

// Terrain height: low along the river and road, rising to the ridges, a dip for the lake,
// and two cliff bands where the crags are.
function elev(x: number, y: number): number {
  const r = riverX(y);
  const rd = roadX(y);
  const lo = Math.min(r, rd) - 30;
  const hi = Math.max(r, rd) + 24;
  const d = x < lo ? lo - x : x > hi ? x - hi : 0;
  let h = 16 + Math.pow(d / 10, 1.35) * 3.1 + (fbm(x * 0.013, y * 0.013, 11) - 0.5) * 36;
  if (y < 280) h += (280 - y) * 0.13;
  const lx = (x - LAKE.x) / LAKE.rx;
  const ly = (y - LAKE.y) / LAKE.ry;
  h -= 32 * Math.exp(-(lx * lx + ly * ly) * 0.8);
  h +=
    (22 / (1 + Math.exp(-(x - (250 + 6 * Math.sin(y * 0.06))) / 2.2))) * Math.exp(-(((y - 232) / 48) ** 2));
  h += (20 / (1 + Math.exp((x - (118 + 5 * Math.sin(y * 0.07))) / 2.2))) * Math.exp(-(((y - 150) / 40) ** 2));
  return h;
}

const GS = 5;
const GX = Math.ceil(W / GS) + 1;
const GY = Math.ceil(H / GS) + 1;
let grid: Float32Array | null = null;

function heights(): Float32Array {
  if (grid) return grid;
  grid = new Float32Array(GX * GY);
  for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) grid[j * GX + i] = elev(i * GS, j * GS);
  return grid;
}

export function hAt(x: number, y: number): number {
  const h = heights();
  const fx = clamp(x / GS, 0, GX - 1.001);
  const fy = clamp(y / GS, 0, GY - 1.001);
  const i = fx | 0;
  const j = fy | 0;
  const tx = fx - i;
  const ty = fy - j;
  return lerp(
    lerp(h[j * GX + i]!, h[j * GX + i + 1]!, tx),
    lerp(h[(j + 1) * GX + i]!, h[(j + 1) * GX + i + 1]!, tx),
    ty,
  );
}

// Hillshade, lit from the upper left: 0 dark .. 1 bright.
export function shadeAt(x: number, y: number): number {
  const e = 1.6;
  const dx = (hAt(x + e, y) - hAt(x - e, y)) / (2 * e);
  const dy = (hAt(x, y + e) - hAt(x, y - e)) / (2 * e);
  const nx = -dx * 2.4;
  const ny = -dy * 2.4;
  const nl = Math.hypot(nx, ny, 1);
  return clamp((nx * -0.55 + ny * -0.62 + 0.56) / nl);
}

export const bandIndex = (h: number): number =>
  h < 26 ? 0 : h < 40 ? 1 : h < 58 ? 2 : h < 84 ? 3 : h < 112 ? 4 : 5;

// Paints the terrain pixel by pixel: colorAt(x, y, height, shade, band, inLake) -> rgb.
export function rasterMap(
  g: G,
  colorAt: (x: number, y: number, h: number, s: number, band: number, lake: boolean) => number[],
): void {
  const [c, cg] = mk(W, H, 1);
  const img = cg.createImageData(W, H);
  const d = img.data;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const h = hAt(x, y);
      const lx = (x - LAKE.x) / LAKE.rx;
      const ly = (y - LAKE.y) / LAKE.ry;
      const col = colorAt(x, y, h, shadeAt(x, y), bandIndex(h), lx * lx + ly * ly < 1);
      const i = (y * W + x) * 4;
      d[i] = col[0]!;
      d[i + 1] = col[1]!;
      d[i + 2] = col[2]!;
      d[i + 3] = 255;
    }
  cg.putImageData(img, 0, 0);
  g.drawImage(c, 0, 0, W, H);
}

// The drive between two places, as a path along the roads through the junction. Old Town
// is off the spur; everything else sits beside the highway and joins it level with its pin.
function legPts(id: string, pins: Record<string, { x: number; y: number }>): Pt[] {
  const p = pins[id]!;
  const [, jy] = JUNCTION;
  if (id === 'diner') return [[p.x, p.y], ...SPUR.slice().reverse()];
  const along =
    p.y > jy
      ? ROAD.filter((q) => q[1] <= p.y && q[1] > jy)
      : ROAD.filter((q) => q[1] >= p.y && q[1] < jy).reverse();
  return [[p.x, p.y], [roadX(p.y), p.y], ...along];
}

export function drivePath(a: string, b: string, pins: Record<string, { x: number; y: number }>): Pt[] {
  return [...legPts(a, pins), JUNCTION, ...legPts(b, pins).reverse()];
}
