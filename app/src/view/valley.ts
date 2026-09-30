// The valley map's geography: the river, the highway, the town blocks, and a heightfield
// the terrain is shaded from. All of it is fixed, so it's computed once and cached.

import { clamp, lerp, mk, spline, type G, type Pt } from './kit/geom';
import { fbm } from './kit/noise';
import { H, W, W_MAX } from './layout';

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

// The highway on north, past where the portrait map's edge cut it off: only a wide map
// sees it. It's scenery; drives never use it.
export const ROAD_NORTH: Pt[] = spline(
  [
    [318, 98],
    [384, 58],
    [452, 24],
    [530, -14],
  ],
  12,
).filter(([x]) => x >= 384);

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
// The walk-in to Roadside.
export const TRAILS: Pt[][] = [
  [
    [266, 258],
    [276, 244],
    [286, 232],
  ],
];
// The side roads: how a place off the highway reaches it, from where it leaves the
// highway. A place beside the highway has none: it joins the highway level with its pin.
export const SIDE_ROADS: Record<string, { pts: Pt[]; dirt?: true }> = {
  // The Old Town spur.
  diner: {
    pts: [
      [207, 470],
      [176, 468],
      [146, 467],
      [118, 466],
    ],
  },
  // The dirt road west to Granite Gorge.
  gorge: {
    pts: [
      [274, 168],
      [236, 172],
      [198, 168],
      [160, 162],
      [122, 156],
      [96, 152],
    ],
    dirt: true,
  },
  // Wind River: the Gorge's dirt road, and on past it up out of the valley.
  wind: {
    pts: [
      [274, 168],
      [236, 172],
      [198, 168],
      [160, 162],
      [122, 156],
      [96, 152],
      [72, 136],
      [54, 122],
      [40, 108],
    ],
    dirt: true,
  },
  // West to Psicobloc Cove: the Old Town spur, and on down to the coast.
  cove: {
    pts: [
      [207, 470],
      [176, 468],
      [146, 467],
      [118, 466],
      [84, 478],
      [52, 494],
      [24, 506],
    ],
  },
  // East to The Crucible: off the highway above Midtown, up over the pass.
  crucible: {
    pts: [
      [roadX(364), 364],
      [250, 360],
      [282, 358],
      [312, 364],
      [338, 372],
    ],
    dirt: true,
  },
  // On north from the highway's end to The Big Stone.
  stone: {
    pts: [
      [384, 58],
      [370, 48],
      [356, 40],
      [346, 34],
    ],
  },
  // The Training Center: a Midtown side street, west between the blocks.
  center: {
    pts: [
      [roadX(402), 402],
      [196, 402],
      [184, 402],
    ],
  },
  // The Warehouse: a short spur west off the highway, onto the flats by the river.
  warehouse: {
    pts: [
      [roadX(572), 572],
      [202, 572],
    ],
  },
  // The Market: a street east off the highway, across from the café.
  market: {
    pts: [
      [roadX(446), 446],
      [262, 446],
      [306, 446],
    ],
  },
  // The Garage: a short street east off the highway, below Midtown.
  garage: {
    pts: [
      [roadX(562), 562],
      [250, 562],
      [288, 562],
    ],
  },
  // The desert road west to Sandstone Mesa, where the highway climbs out of the valley.
  mesa: {
    pts: [
      [318, 98],
      [290, 90],
      [258, 80],
      [228, 70],
      [200, 60],
    ],
    dirt: true,
  },
};
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
  // The Warehouse's shed, long and low, behind its pin.
  [176, 552, 30, 12],
  // The Garage: a two-bay shop.
  [292, 542, 22, 12],
];
export const LOT_RECT: [number, number, number, number] = [242, 598, 44, 28];

// How far the map reaches past the portrait screen's edges, each side: the country a wide
// screen sees around the valley.
export const MAP_PAD = (W_MAX - W) / 2;

// Past the portrait map's edges the valley walls crest (CREST out) and fall away into the
// next country over, rough with ridges. Each term starts from nothing at the edge and
// changes smoothly away from it, so a wide map has no seam where the portrait one ended.
const CREST = 50;
const FALL = 170;
const DROP = 110;
const RIDGES = 150;

// Terrain height: low along the river and road, rising to the ridges, a dip for the lake,
// and two cliff bands where the crags are.
function elev(x: number, y: number): number {
  const r = riverX(y);
  const rd = roadX(y);
  const lo = Math.min(r, rd) - 30;
  const hi = Math.max(r, rd) + 24;
  const out = x < 0 ? -x : x > W ? x - W : 0;
  const d = out
    ? Math.max(
        0,
        Math.max(0, x < 0 ? lo : W - hi) +
          out * Math.exp(-out / CREST) -
          DROP * (1 - Math.exp(-((out / FALL) ** 2))),
      )
    : x < lo
      ? lo - x
      : x > hi
        ? x - hi
        : 0;
  let h = 16 + Math.pow(d / 10, 1.35) * 3.1 + (fbm(x * 0.013, y * 0.013, 11) - 0.5) * 36;
  if (out) h += RIDGES * (fbm(x * 0.011, y * 0.011, 29) - 0.5) * (1 - Math.exp(-((out / 110) ** 2)));
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
const GX = Math.ceil((W + 2 * MAP_PAD) / GS) + 1;
const GY = Math.ceil(H / GS) + 1;
let grid: Float32Array | null = null;

function heights(): Float32Array {
  if (grid) return grid;
  grid = new Float32Array(GX * GY);
  for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) grid[j * GX + i] = elev(i * GS - MAP_PAD, j * GS);
  return grid;
}

export function hAt(x: number, y: number): number {
  const h = heights();
  const fx = clamp((x + MAP_PAD) / GS, 0, GX - 1.001);
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
// It covers `pad` either side of the portrait map too, in the map's own x.
export function rasterMap(
  g: G,
  colorAt: (x: number, y: number, h: number, s: number, band: number, lake: boolean) => number[],
  pad = 0,
): void {
  const w = W + 2 * pad;
  const [c, cg] = mk(w, H, 1);
  const img = cg.createImageData(w, H);
  const d = img.data;
  for (let y = 0; y < H; y++)
    for (let px = 0; px < w; px++) {
      const x = px - pad;
      const h = hAt(x, y);
      const lx = (x - LAKE.x) / LAKE.rx;
      const ly = (y - LAKE.y) / LAKE.ry;
      const col = colorAt(x, y, h, shadeAt(x, y), bandIndex(h), lx * lx + ly * ly < 1);
      const i = (y * w + px) * 4;
      d[i] = col[0]!;
      d[i + 1] = col[1]!;
      d[i + 2] = col[2]!;
      d[i + 3] = 255;
    }
  cg.putImageData(img, 0, 0);
  g.drawImage(c, -pad, 0, w, H);
}

// How a place joins the highway: from its pin, down its side road if it has one, to the
// highway at level `y`.
export function joinOf(id: string, pins: Record<string, { x: number; y: number }>): { y: number; pts: Pt[] } {
  const p = pins[id]!;
  const side = SIDE_ROADS[id];
  const y = side ? side.pts[0]![1] : p.y;
  return { y, pts: [[p.x, p.y], ...(side?.pts.slice().reverse() ?? []), [roadX(y), y]] };
}

// The drive between two places: out along one's side road, up or down the highway, and in
// along the other's. It never runs past either end.
export function drivePath(a: string, b: string, pins: Record<string, { x: number; y: number }>): Pt[] {
  const from = joinOf(a, pins);
  const to = joinOf(b, pins);
  const between = ROAD.filter((q) => (q[1] - from.y) * (q[1] - to.y) < 0);
  // The highway is listed south to north.
  return [...from.pts, ...(to.y < from.y ? between : between.reverse()), ...to.pts.slice().reverse()];
}
