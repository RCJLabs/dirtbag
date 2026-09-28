// Things drawn every frame on top of the painted layers: the fire, the string lights,
// labels, route tags and the van on the map.

import { VW } from '../layout';
import { rad, rr, type G } from '../kit/geom';
import { vnoise } from '../kit/noise';
import { INK } from './people';

export const FONT = {
  // Comic: hand lettering for people, panels and the map.
  comic: '"Patrick Hand SC","Patrick Hand",cursive',
  // Poster: condensed caps for signs painted into the landscape.
  poster: '"Big Shoulders Display",Impact,sans-serif',
};
export const ACC = { comic: '#D8553F', poster: '#DA6A34' };
export const CREAM = '#FFFDF5';

type Kit = 'comic' | 'poster';

export function label(
  g: G,
  kit: Kit,
  txt: string,
  x: number,
  y: number,
  {
    size = 13,
    align = 'center',
    color,
    halo,
  }: { size?: number; align?: CanvasTextAlign; color?: string; halo?: string } = {},
): void {
  g.font = `${kit === 'comic' ? 400 : 800} ${size}px ${FONT[kit]}`;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.lineJoin = 'round';
  g.strokeStyle = halo ?? (kit === 'comic' ? CREAM : '#1E2B2B');
  g.lineWidth = 3.4;
  g.strokeText(txt, x, y);
  g.fillStyle = color ?? (kit === 'comic' ? INK : '#F6ECD6');
  g.fillText(txt, x, y);
}

// The camp fire: a glow at night, four flickering tongues, and smoke by day.
export function drawFire(g: G, x: number, y: number, t: number, night: boolean, still: boolean): void {
  const big = night ? 1 : 0.55;
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = rad(g, x, y - 10, 2, night ? 160 : 60, [
    [0, `rgba(255,150,70,${night ? 0.34 : 0.16})`],
    [1, 'rgba(255,150,70,0)'],
  ]);
  g.fillRect(x - 170, y - 180, 340, 270);
  g.restore();
  const tongues = [
    { dx: -7, w: 5, h: 18 },
    { dx: 0, w: 7.5, h: 30 },
    { dx: 7, w: 5, h: 21 },
    { dx: -2, w: 3.5, h: 13 },
  ];
  tongues.forEach((q, i) => {
    const h = q.h * big * (still ? 1 : 0.8 + 0.34 * vnoise(t * 5 + i * 3, 0, i + 1));
    const lean = still ? 0 : (vnoise(t * 3 + i, 1, i + 7) - 0.5) * 6 * big;
    const w = q.w * (big * 0.4 + 0.6);
    const X = x + q.dx * (big * 0.5 + 0.5);
    const Y = y - 3;
    g.beginPath();
    g.moveTo(X - w, Y);
    g.quadraticCurveTo(X - w * 1.15, Y - h * 0.45, X + lean, Y - h);
    g.quadraticCurveTo(X + w * 1.15, Y - h * 0.45, X + w, Y);
    g.closePath();
    g.fillStyle = i === 3 ? '#FFE08A' : '#FF9A3D';
    g.fill();
  });
  if (!night && !still)
    for (let k = 0; k < 4; k++) {
      const p = (t * 0.22 + k * 0.25) % 1;
      g.fillStyle = `rgba(236,236,240,${(0.32 * (1 - p)).toFixed(3)})`;
      g.beginPath();
      g.arc(x + Math.sin(t * 0.8 + k) * 5 + p * 12, y - 18 - p * 95, 4 + p * 11, 0, 6.2832);
      g.fill();
    }
}

export function drawLights(g: G, pts: readonly [number, number][], cam: number): void {
  g.save();
  pts.forEach((p, i) => {
    const x = p[0] - cam;
    if (x < -10 || x > VW + 10) return;
    const c = ['#FFD27A', '#FF9A6A', '#9FD3FF'][i % 3]!;
    g.shadowColor = c;
    g.shadowBlur = 9;
    g.fillStyle = c;
    g.beginPath();
    g.arc(x, p[1] + 3, 2.4, 0, 6.2832);
    g.fill();
  });
  g.restore();
}

// A numbered tag at a route's foot, with its grade; the open route in the accent colour.
export function routeTag(
  g: G,
  x: number,
  y: number,
  n: number,
  grade: string,
  open: boolean,
  sent: boolean,
): void {
  if (x < -30 || x > VW + 30) return;
  g.beginPath();
  g.arc(x, y, 9.5, 0, 6.2832);
  g.fillStyle = open ? ACC.poster : '#F3E6CB';
  g.fill();
  g.strokeStyle = '#1E2B2B';
  g.lineWidth = 1.6;
  g.stroke();
  g.font = `800 13px ${FONT.poster}`;
  g.textAlign = 'center';
  g.fillStyle = open ? '#FFFFFF' : '#1E2B2B';
  g.fillText(String(n), x, y + 4.5);
  label(g, 'poster', grade, x + 14, y + 4.5, { size: 12.5, align: 'left' });
  if (sent) label(g, 'poster', 'SENT', x, y - 16, { size: 12, color: ACC.poster });
}

// A boulder's tag: its grade on a chalk-white card on top of the rock.
export function boulderTag(g: G, x: number, y: number, grade: string, sent: boolean): void {
  if (x < -30 || x > VW + 30) return;
  g.fillStyle = '#F3E6CB';
  g.strokeStyle = '#1E2B2B';
  g.lineWidth = 1.5;
  rr(g, x - 14, y - 9, 28, 17, 3);
  g.fill();
  g.stroke();
  g.font = `800 13px ${FONT.poster}`;
  g.textAlign = 'center';
  g.fillStyle = '#1E2B2B';
  g.fillText(grade, x, y + 4.5);
  if (sent) label(g, 'poster', 'SENT', x, y - 14, { size: 12, color: ACC.poster });
}

// A gym problem's start tape: its colour, its grade, and SENT once you've done it.
export function tapeTag(g: G, x: number, y: number, col: string, grade: string, sent: boolean): void {
  if (x < -30 || x > VW + 30) return;
  g.fillStyle = col;
  g.fillRect(x - 15, y - 8, 30, 15);
  g.font = `800 12px ${FONT.poster}`;
  g.textAlign = 'center';
  g.fillStyle = col === '#E8C547' ? '#1E2B2B' : '#FFFFFF';
  g.fillText(grade, x, y + 4);
  if (sent) label(g, 'poster', 'SENT', x, y - 13, { size: 12, color: ACC.poster, halo: '#F3E6CB' });
}

// Rain over an outdoor view: a grey wash and slanting streaks, falling unless motion is off.
export function drawRain(g: G, w: number, h: number, t: number, still: boolean): void {
  g.fillStyle = 'rgba(52,66,92,.42)';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(226,234,242,.5)';
  g.lineWidth = 1.2;
  g.lineCap = 'round';
  g.beginPath();
  let seed = 9;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 110; i++) {
    const x0 = r() * (w + 60);
    const y0 = r() * h;
    const v = 0.8 + r() * 0.5;
    const fall = still ? 0 : t * 480 * v;
    const y = ((y0 + fall) % (h + 40)) - 20;
    const x = x0 - (y + 20) * 0.28;
    g.moveTo(x, y);
    g.lineTo(x - 4.5, y + 16);
  }
  g.stroke();
}

// Your van on the map, bouncing a little while it drives.
export function vanIcon(g: G, x: number, y: number, t: number, moving: boolean, still: boolean): void {
  const b = moving && !still ? Math.abs(Math.sin(t * 14)) * 1.2 : 0;
  g.save();
  g.translate(x, y - b);
  g.fillStyle = '#F4EBD8';
  g.strokeStyle = INK;
  g.lineWidth = 1.6;
  rr(g, -13, -9, 26, 12, 4);
  g.fill();
  g.stroke();
  g.fillStyle = '#4F9A9E';
  g.fillRect(-12, -2, 24, 3);
  g.fillStyle = '#23232A';
  for (const wx of [-7, 7]) {
    g.beginPath();
    g.arc(wx, 3.5, 3, 0, 6.2832);
    g.fill();
  }
  g.restore();
}
