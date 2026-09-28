// Path builders for things that appear in more than one painting: trees, vans, chairs,
// rocks. They only add to the current path; the caller fills or strokes.

import type { G } from './kit/geom';
import { poly } from './kit/geom';

export function pineShape(g: G, x: number, y: number, h: number): void {
  const w = h * 0.32;
  g.moveTo(x, y - h);
  for (let k = 1; k <= 4; k++) {
    const yy = y - h + (k * h) / 4.2;
    const ww = (w * k) / 4;
    g.lineTo(x + ww, yy);
    g.lineTo(x + ww * 0.45, yy);
  }
  g.lineTo(x + w * 0.1, y);
  g.lineTo(x - w * 0.1, y);
  for (let k = 4; k >= 1; k--) {
    const yy = y - h + (k * h) / 4.2;
    const ww = (w * k) / 4;
    g.lineTo(x - ww * 0.45, yy);
    g.lineTo(x - ww, yy);
  }
  g.closePath();
}

export function vanBody(g: G, x: number, y: number, w: number, h: number): void {
  const r = 10;
  g.moveTo(x + r, y);
  g.lineTo(x + w * 0.78, y);
  g.quadraticCurveTo(x + w * 0.9, y + 2, x + w * 0.97, y + h * 0.38);
  g.lineTo(x + w, y + h - 8);
  g.quadraticCurveTo(x + w, y + h, x + w - 8, y + h);
  g.lineTo(x + 8, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - 8);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}

export const vanWindows = (
  x: number,
  y: number,
  w: number,
  h: number,
): [number, number, number, number][] => [
  [x + 14, y + 12, w * 0.2, h * 0.3],
  [x + w * 0.3, y + 12, w * 0.26, h * 0.3],
  [x + w * 0.8, y + 10, w * 0.13, h * 0.32],
];

export function popTop(g: G, x: number, y: number, w: number): void {
  poly(
    g,
    [
      [x + w * 0.12, y],
      [x + w * 0.2, y - 20],
      [x + w * 0.66, y - 16],
      [x + w * 0.72, y],
    ],
    true,
  );
}

// A folding camp chair facing `dir`.
export function chair(g: G, x: number, y: number, dir: number): void {
  g.moveTo(x - 9 * dir, y - 22);
  g.lineTo(x - 7 * dir, y - 6);
  g.lineTo(x + 9 * dir, y - 6);
  g.moveTo(x - 7 * dir, y - 6);
  g.lineTo(x - 10 * dir, y + 4);
  g.moveTo(x + 9 * dir, y - 6);
  g.lineTo(x + 11 * dir, y + 4);
  g.moveTo(x - 7 * dir, y - 6);
  g.lineTo(x + 6 * dir, y + 4);
}

export function rock(g: G, x: number, y: number, w: number, h: number): void {
  g.moveTo(x, y + h * 0.5);
  g.quadraticCurveTo(x + w * 0.1, y - h * 0.5, x + w * 0.5, y - h * 0.45);
  g.quadraticCurveTo(x + w * 0.95, y - h * 0.4, x + w, y + h * 0.4);
  g.quadraticCurveTo(x + w * 0.5, y + h * 0.75, x, y + h * 0.5);
  g.closePath();
}

export function coniferPath(g: G, x: number, y: number, s: number): void {
  for (let k = 0; k < 3; k++) {
    g.moveTo(x, y - 50 * s + k * 14);
    g.lineTo(x + 13 * s + k * 3, y - 18 * s + k * 8);
    g.lineTo(x - 13 * s - k * 3, y - 18 * s + k * 8);
    g.closePath();
  }
}

// A two-tone triangle tree, lit side left, for the map.
export function lpTree(g: G, x: number, y: number, s: number, dark: string, light: string, hm = 2.3): void {
  g.fillStyle = light;
  g.beginPath();
  g.moveTo(x, y - s * hm);
  g.lineTo(x, y);
  g.lineTo(x - s, y);
  g.closePath();
  g.fill();
  g.fillStyle = dark;
  g.beginPath();
  g.moveTo(x, y - s * hm);
  g.lineTo(x + s, y);
  g.lineTo(x, y);
  g.closePath();
  g.fill();
}
