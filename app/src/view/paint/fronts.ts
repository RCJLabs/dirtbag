// The fronts of the places you only ever see as a card, for their card's header: the diner
// in Old Town and the coffee shop in Midtown. Drawn in the scenes' poster style, flat and
// unoutlined, at the hour you'd get there: lit windows after dark, and rain when it's
// raining in the valley. Whoever works there is at the window.

import { conditionsAt, isNight, type GameState } from '../../sim';
import { lin, rad, rr, type G } from '../kit/geom';
import { drawRain, label } from './fx';
import { drawPerson, LOOK, type Look, type Pose } from './people';
import { ridgeLine, valley, type Palette } from './scenes';

// Draws a place's front into a header `w` by `h`, in logical pixels.
export type Front = (g: G, s: GameState, w: number, h: number) => void;

// People at a window stand as big as they do in a scene's header.
const K = 0.6;
const GLASS = '#6F8C98';
const LIT = '#FFD27A';

// The street a front stands on: the valley's sky, its far ridges and the sidewalk. Returns
// the kerb's height.
function street(g: G, P: Palette, w: number, h: number, night: boolean): number {
  g.fillStyle = lin(g, 0, 0, 0, h, P.sky);
  g.fillRect(0, 0, w, h);
  g.fillStyle = P.far;
  g.beginPath();
  ridgeLine(w, h * 0.7, h * 0.24, 5, 0.012, true).forEach(([x, y], i) =>
    i ? g.lineTo(x, y) : g.moveTo(x, y),
  );
  g.lineTo(w + 12, h);
  g.lineTo(-12, h);
  g.closePath();
  g.fill();
  const kerb = h - 14;
  g.fillStyle = night ? '#2E2D38' : '#C8B598';
  g.fillRect(0, kerb, w, h - kerb);
  g.fillStyle = night ? '#1E1D27' : '#A89274';
  g.fillRect(0, kerb, w, 2);
  return kerb;
}

// Someone behind the glass, cut off by it: `feet` is where they'd stand if the wall weren't
// there.
function atWindow(
  g: G,
  who: Look,
  x: number,
  feet: number,
  dir: number,
  pose: Pose,
  glass: [number, number, number, number],
): void {
  g.save();
  g.beginPath();
  g.rect(...glass);
  g.clip();
  g.translate(x, feet);
  g.scale(K, K);
  drawPerson(g, who, { x: 0, y: 0, dir, pose, t: 0 });
  g.restore();
}

// Daylight on glass: one pale streak.
function glint(g: G, x: number, y: number, w: number, h: number): void {
  g.fillStyle = 'rgba(255,255,255,.2)';
  g.beginPath();
  g.moveTo(x + w * 0.2, y);
  g.lineTo(x + w * 0.42, y);
  g.lineTo(x + w * 0.22, y + h);
  g.lineTo(x, y + h);
  g.closePath();
  g.fill();
}

// A lamp post with its light on after dark.
function lamp(g: G, x: number, kerb: number, night: boolean): void {
  g.fillStyle = '#2B2825';
  g.fillRect(x - 1.5, kerb - 62, 3, 62);
  g.fillRect(x - 6, kerb - 64, 12, 4);
  if (!night) return;
  g.fillStyle = rad(g, x, kerb - 58, 2, 46, [
    [0, 'rgba(255,214,140,.55)'],
    [1, 'rgba(255,214,140,0)'],
  ]);
  g.fillRect(x - 46, kerb - 104, 92, 92);
}

const wet = (s: GameState, place: string) => conditionsAt(s.seed, s.day, place).sky === 'rain';

// The Diner: long and low, cream over a red stripe with a steel band along the roof, a row
// of booths in the windows, and its sign on a pole. Otis has the paper in the second booth.
const diner: Front = (g, s, w, h) => {
  const night = isNight(s.min);
  const kerb = street(g, valley(night ? 'night' : 'morning'), w, h, night);
  const x0 = Math.round(w * 0.1);
  const x1 = Math.round(w * 0.9);
  const top = Math.round(h * 0.4);
  const bw = x1 - x0;
  g.fillStyle = night ? '#8F897E' : '#EFE4CC';
  rr(g, x0, top, bw, kerb - top + 2, 7);
  g.fill();
  g.fillStyle = night ? '#62646C' : '#C9CDD2';
  g.fillRect(x0 + 3, top + 4, bw - 6, 7);
  g.fillStyle = night ? '#4A4C53' : '#A4A9B0';
  g.fillRect(x0 + 3, top + 7, bw - 6, 1);
  g.fillStyle = night ? '#7A2A22' : '#B23A2C';
  g.fillRect(x0, kerb - 11, bw, 5);

  const door = 28;
  const wy = top + 16;
  const wh = kerb - 15 - wy;
  const n = 5;
  const gap = 5;
  const ww = (bw - door - 14 - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const wx = x0 + 6 + i * (ww + gap);
    g.fillStyle = night ? LIT : GLASS;
    g.fillRect(wx, wy, ww, wh);
    if (i === 1) {
      const cx = wx + ww * 0.55;
      atWindow(g, LOOK.otis!, cx, wy + wh + 8, -1, 'sit', [wx, wy, ww, wh]);
      // The paper, held up.
      g.fillStyle = '#F3EFE4';
      g.fillRect(cx - 12, wy + wh * 0.42, 10, 8);
      g.fillStyle = '#9A958A';
      for (let k = 0; k < 3; k++) g.fillRect(cx - 11, wy + wh * 0.42 + 2 + k * 2, 8, 0.8);
    }
    if (!night) glint(g, wx, wy, ww, wh);
  }
  const dx = x1 - door - 4;
  g.fillStyle = night ? '#3B4A55' : '#2F6F73';
  g.fillRect(dx, wy - 3, door - 4, kerb - wy + 3);
  g.fillStyle = night ? LIT : '#8FB0BC';
  g.fillRect(dx + 5, wy + 2, door - 14, wh * 0.5);

  // The sign on its pole: DINER, in red neon after dark.
  const sx = x0 + bw * 0.28;
  g.fillStyle = '#2B2825';
  g.fillRect(sx - 1.5, top - 24, 3, 24);
  g.save();
  if (night) {
    g.shadowColor = '#FF6A5A';
    g.shadowBlur = 14;
  }
  g.fillStyle = '#F3E6CB';
  rr(g, sx - 32, top - 44, 64, 22, 4);
  g.fill();
  g.restore();
  g.strokeStyle = '#1E2B2B';
  g.lineWidth = 1.5;
  rr(g, sx - 32, top - 44, 64, 22, 4);
  g.stroke();
  label(g, 'poster', 'DINER', sx, top - 27.5, { size: 15, color: '#B23A2C', halo: '#F3E6CB' });
  lamp(g, x1 + (w - x1) / 2, kerb, night);
  if (wet(s, 'diner')) drawRain(g, w, h, 0, true);
};

// The coffee shop: two storeys of brick in Midtown, a teal awning over the shop window, and
// Wren on the bar behind it, by the machine.
const cafe: Front = (g, s, w, h) => {
  const night = isNight(s.min);
  const kerb = street(g, valley(night ? 'night' : 'morning'), w, h, night);
  const x0 = Math.round(w * 0.22);
  const x1 = Math.round(w * 0.78);
  const top = Math.round(h * 0.04);
  const bw = x1 - x0;
  g.fillStyle = night ? '#5E3A34' : '#A5563E';
  g.fillRect(x0, top, bw, kerb - top);
  g.fillStyle = night ? 'rgba(0,0,0,.14)' : 'rgba(60,20,10,.14)';
  for (let y = top + 6; y < kerb; y += 5) g.fillRect(x0, y, bw, 1);
  g.fillStyle = night ? '#3E2A28' : '#6E3A2C';
  g.fillRect(x0 - 4, top, bw + 8, 5);

  // Upstairs: three windows, one lit after dark.
  const uy = top + 10;
  const uh = Math.round(h * 0.13);
  for (let i = 0; i < 3; i++) {
    const ux = x0 + (bw / 3) * (i + 0.5) - 10;
    g.fillStyle = night && i === 1 ? LIT : night ? '#3A4258' : GLASS;
    g.fillRect(ux, uy, 20, uh);
    g.fillStyle = night ? '#2A1E1C' : '#E6DCC4';
    g.fillRect(ux - 2, uy + uh, 24, 2);
  }

  // The sign, then the awning under it: teal and cream, scalloped.
  const sy = uy + uh + 6;
  g.fillStyle = '#1E2B2B';
  g.fillRect(x0 + 12, sy, bw - 24, 15);
  label(g, 'poster', 'COFFEE', x0 + bw / 2, sy + 12, { size: 13, color: '#F3E6CB', halo: '#1E2B2B' });
  const ay = sy + 18;
  const ah = 8;
  const aw = bw - 12;
  const stripes = Math.round(aw / 10);
  for (let i = 0; i < stripes; i++) {
    g.fillStyle = i % 2 ? '#F3E6CB' : '#2F6F73';
    g.fillRect(x0 + 6 + (i * aw) / stripes, ay, aw / stripes + 0.5, ah);
    g.beginPath();
    g.arc(x0 + 6 + ((i + 0.5) * aw) / stripes, ay + ah, aw / stripes / 2, 0, Math.PI);
    g.fill();
  }

  // The shop window: the bar, the machine, and Wren.
  const door = 26;
  const wx = x0 + 8;
  const wy = ay + ah + 5;
  const ww = bw - door - 20;
  const wh = kerb - 4 - wy;
  g.fillStyle = night ? LIT : '#E9D3AE';
  g.fillRect(wx, wy, ww, wh);
  // Her head near the top of the glass, the bar across her waist.
  atWindow(g, LOOK.wren!, wx + ww * 0.62, wy + 44, -1, 'stand', [wx, wy, ww, wh]);
  g.fillStyle = '#6A4A36';
  g.fillRect(wx, wy + wh * 0.64, ww, wh * 0.36);
  g.fillStyle = '#C9CDD2';
  g.fillRect(wx + 10, wy + wh * 0.64 - 9, 15, 9);
  g.fillStyle = '#1E2B2B';
  g.fillRect(wx + 13, wy + wh * 0.64 - 4, 3, 4);
  g.fillRect(wx + 19, wy + wh * 0.64 - 4, 3, 4);
  if (!night) glint(g, wx, wy, ww, wh);
  g.strokeStyle = '#2B2825';
  g.lineWidth = 2;
  g.strokeRect(wx, wy, ww, wh);

  const dx = x1 - door - 6;
  g.fillStyle = night ? '#24444A' : '#2F6F73';
  g.fillRect(dx, wy - 2, door, kerb - wy + 2);
  g.fillStyle = night ? LIT : '#8FB0BC';
  g.fillRect(dx + 5, wy + 3, door - 10, wh * 0.45);

  // A chalkboard out front.
  const bx = x1 + 18;
  g.fillStyle = '#2B2825';
  g.beginPath();
  g.moveTo(bx - 9, kerb);
  g.lineTo(bx - 6, kerb - 22);
  g.lineTo(bx + 6, kerb - 22);
  g.lineTo(bx + 9, kerb);
  g.closePath();
  g.fill();
  label(g, 'comic', 'OPEN', bx, kerb - 8, { size: 8, color: '#F3E6CB', halo: '#2B2825' });
  lamp(g, x0 - 22, kerb, night);
  if (wet(s, 'cafe')) drawRain(g, w, h, 0, true);
};

export const FRONTS: Record<string, Front> = { diner, cafe };
