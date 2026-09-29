// Value noise for the painters: ridgelines, terrain, flicker. Deterministic, so a scene
// paints the same every time; it's scenery, so it doesn't use the sim's named streams.

import { mulberry32 } from '../../sim/rng';
import { W, H } from '../layout';
import type { G } from './geom';

export { mulberry32 };

function hash2(x: number, y: number, s: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695040)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function vnoise(x: number, y: number, s: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s);
  const b = hash2(xi + 1, yi, s);
  const c = hash2(xi, yi + 1, s);
  const d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, s: number, octaves = 4): number {
  let f = 0;
  let a = 0.5;
  let q = 1;
  let n = 0;
  for (let i = 0; i < octaves; i++) {
    f += a * vnoise(x * q, y * q, s + i * 31);
    n += a;
    q *= 2;
    a *= 0.5;
  }
  return f / n;
}

// Print grain over a whole screen-sized canvas.
// Film grain over a `w` wide stretch, as thick as ever: 6,500 flecks to a screen's width.
export function grain(g: G, seed: number, amt: number, w = W): void {
  const r = mulberry32(seed);
  const n = Math.round((6500 * w) / W);
  for (let i = 0; i < n; i++) {
    const a = amt * r();
    g.fillStyle = r() < 0.55 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * 1.3})`;
    g.fillRect(r() * w, r() * H, 0.5 + r() * 0.9, 0.5 + r() * 0.9);
  }
}
