// Drawing primitives shared by every painter: points, paths, curves, gradients, colours and
// offscreen canvases. Everything is in logical pixels; canvases carry their own scale.

export type Pt = [number, number];
export type G = CanvasRenderingContext2D;

export const clamp = (v: number, a = 0, b = 1): number => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const TAU = Math.PI * 2;

// An offscreen canvas of w x h logical pixels at k device pixels each.
export function mk(w: number, h: number, k = 2): [HTMLCanvasElement, G] {
  const c = document.createElement('canvas');
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  const g = c.getContext('2d')!;
  g.scale(k, k);
  return [c, g];
}

export function poly(g: CanvasPath, pts: readonly Pt[], close: boolean): void {
  g.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i]![0], pts[i]![1]);
  if (close) g.closePath();
}

function bez(g: CanvasPath, P: readonly Pt[]): void {
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1]!;
    const p1 = P[i]!;
    const p2 = P[i + 1]!;
    const p3 = P[i + 2]!;
    g.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6,
      p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6,
      p2[1] - (p3[1] - p1[1]) / 6,
      p2[0],
      p2[1],
    );
  }
}

// A smooth path through the points (Catmull-Rom as Béziers). `close` loops to the start.
export function trace(g: CanvasPath, pts: readonly Pt[], close: boolean): void {
  const n = pts.length;
  if (n < 3) {
    poly(g, pts, close);
    return;
  }
  const P = close ? [pts[n - 1]!, ...pts, pts[0]!, pts[1]!] : [pts[0]!, ...pts, pts[n - 1]!];
  g.moveTo(P[1]![0], P[1]![1]);
  bez(g, P);
  if (close) g.closePath();
}

// The same, continuing the current path with a line to the first point.
export function traceOn(g: CanvasPath, pts: readonly Pt[]): void {
  const n = pts.length;
  const P = [pts[0]!, ...pts, pts[n - 1]!];
  g.lineTo(P[1]![0], P[1]![1]);
  bez(g, P);
}

// Catmull-Rom sampled into points, `per` per segment.
export function spline(pts: readonly Pt[], per = 10): Pt[] {
  const out: Pt[] = [];
  const P = [pts[0]!, ...pts, pts[pts.length - 1]!];
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1]!;
    const p1 = P[i]!;
    const p2 = P[i + 1]!;
    const p3 = P[i + 2]!;
    for (let s = 0; s < per; s++) {
      const t = s / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const at = (k: 0 | 1) =>
        0.5 *
        (2 * p1[k] +
          (-p0[k] + p2[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
          (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([at(0), at(1)]);
    }
  }
  const last = pts[pts.length - 1]!;
  out.push([last[0], last[1]]);
  return out;
}

// Cumulative arc length at each point, for walking a distance along a polyline.
export function arcTable(p: readonly Pt[]): number[] {
  const L = [0];
  for (let i = 1; i < p.length; i++)
    L.push(L[i - 1]! + Math.hypot(p[i]![0] - p[i - 1]![0], p[i]![1] - p[i - 1]![1]));
  return L;
}

export function atLen(p: readonly Pt[], L: readonly number[], s: number): Pt {
  if (s <= 0) return [p[0]![0], p[0]![1]];
  const end = L[L.length - 1]!;
  if (s >= end) return [p[p.length - 1]![0], p[p.length - 1]![1]];
  let lo = 0;
  let hi = L.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (L[m]! < s) lo = m;
    else hi = m;
  }
  const t = (s - L[lo]!) / (L[hi]! - L[lo]! || 1);
  return [p[lo]![0] + (p[hi]![0] - p[lo]![0]) * t, p[lo]![1] + (p[hi]![1] - p[lo]![1]) * t];
}

export function rr(g: G, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function lin(
  g: G,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  stops: [number, string][],
): CanvasGradient {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}

export function rad(
  g: G,
  x: number,
  y: number,
  r0: number,
  r1: number,
  stops: [number, string][],
): CanvasGradient {
  const gr = g.createRadialGradient(x, y, r0, x, y, r1);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}

export const rgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const css = (c: number[]) =>
  `rgb(${clamp(c[0]!, 0, 255) | 0},${clamp(c[1]!, 0, 255) | 0},${clamp(c[2]!, 0, 255) | 0})`;
export const shadeHex = (h: string, f: number): string => {
  const c = rgb(h);
  return css([c[0] * f, c[1] * f, c[2] * f]);
};
