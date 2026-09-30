// The fronts of the places you only ever see as a card, for their card's header: the diner
// in Old Town and the coffee shop in Midtown. Drawn in the scenes' poster style, flat and
// unoutlined, at the hour you'd get there: lit windows after dark, and rain when it's
// raining in the valley. Whoever works there is at the window.

import { conditionsAt, isNight, isWeekend, seasonOf, type GameState } from '../../sim';
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

// The Gear Shop: board-and-batten in forest green, a hand-painted sign, and a window with the
// kit in it: a coil of rope, a rack of cams, shoes on a shelf, a pad on its side. On
// weekends the swap meet's table is out on the sidewalk.
const shop: Front = (g, s, w, h) => {
  const night = isNight(s.min);
  const kerb = street(g, valley(night ? 'night' : 'morning'), w, h, night);
  const x0 = Math.round(w * 0.2);
  const x1 = Math.round(w * 0.74);
  const top = Math.round(h * 0.12);
  const bw = x1 - x0;
  g.fillStyle = night ? '#23362E' : '#3E6250';
  g.fillRect(x0, top, bw, kerb - top);
  g.fillStyle = night ? 'rgba(0,0,0,.18)' : 'rgba(10,30,20,.2)';
  for (let x = x0 + 7; x < x1; x += 9) g.fillRect(x, top, 2, kerb - top);
  // A shed roof with a lip over the sign.
  g.fillStyle = night ? '#2B2825' : '#4A4038';
  g.beginPath();
  g.moveTo(x0 - 8, top + 2);
  g.lineTo(x1 + 8, top - 6);
  g.lineTo(x1 + 8, top);
  g.lineTo(x0 - 8, top + 8);
  g.closePath();
  g.fill();

  const sy = top + 14;
  g.fillStyle = '#EFE0C2';
  rr(g, x0 + 16, sy, bw - 32, 17, 3);
  g.fill();
  label(g, 'poster', 'GEAR', x0 + bw / 2, sy + 14, { size: 14, color: '#2B4A3C', halo: '#EFE0C2' });

  // The window: the kit on display.
  const door = 24;
  const wx = x0 + 8;
  const wy = sy + 24;
  const ww = bw - door - 20;
  const wh = kerb - 6 - wy;
  g.fillStyle = night ? LIT : '#DCD2BC';
  g.fillRect(wx, wy, ww, wh);
  // A rope coil, top left.
  g.strokeStyle = '#C9523F';
  g.lineWidth = 2.5;
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.ellipse(wx + 16, wy + 16 + i * 2, 10 - i * 2, 6 - i, 0, 0, Math.PI * 2);
    g.stroke();
  }
  // Cams on a sling, in their colours.
  const cams = ['#8C5AA8', '#3E7FB8', '#D8B43A', '#C9523F', '#6EA05A'];
  g.strokeStyle = '#2B2825';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(wx + 34, wy + 8);
  g.lineTo(wx + 34 + cams.length * 6, wy + 8);
  g.stroke();
  cams.forEach((c, i) => {
    const cx = wx + 37 + i * 6;
    g.fillStyle = '#9AA0A6';
    g.fillRect(cx - 0.5, wy + 8, 1, 7);
    g.fillStyle = c;
    g.beginPath();
    g.arc(cx, wy + 17, 2.6, 0, Math.PI * 2);
    g.fill();
  });
  // A shelf of shoes, and a pad on its side at the bottom.
  const shelf = wy + wh * 0.55;
  g.fillStyle = '#6A4A36';
  g.fillRect(wx + 4, shelf, ww - 8, 2);
  const shoe = (x: number, col: string) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(x, shelf);
    g.lineTo(x + 3, shelf - 6);
    g.lineTo(x + 9, shelf - 7);
    g.lineTo(x + 13, shelf - 2);
    g.lineTo(x + 13, shelf);
    g.closePath();
    g.fill();
    g.fillStyle = '#2B2825';
    g.fillRect(x, shelf - 1.5, 13, 1.5);
  };
  shoe(wx + 8, '#D8B43A');
  shoe(wx + 24, '#3E7FB8');
  shoe(wx + 40, '#C9523F');
  g.fillStyle = '#2F4A6A';
  g.fillRect(wx + ww - 30, wy + wh - 14, 24, 12);
  g.fillStyle = '#9AA0A6';
  g.fillRect(wx + ww - 30, wy + wh - 9, 24, 2);
  if (!night) glint(g, wx, wy, ww, wh);
  g.strokeStyle = '#2B2825';
  g.lineWidth = 2;
  g.strokeRect(wx, wy, ww, wh);

  const dx = x1 - door - 6;
  g.fillStyle = night ? '#3A2E24' : '#6A4A36';
  g.fillRect(dx, wy - 2, door, kerb - wy + 2);
  g.fillStyle = night ? LIT : '#A8BFC6';
  g.fillRect(dx + 5, wy + 3, door - 10, wh * 0.4);

  // The swap meet, weekends: a folding table on the sidewalk with somebody's old kit on it.
  if (isWeekend(s.day) && !night) {
    const tx = x1 + 12;
    g.fillStyle = '#6A4A36';
    g.fillRect(tx, kerb - 16, 44, 3);
    g.fillRect(tx + 3, kerb - 13, 2, 13);
    g.fillRect(tx + 39, kerb - 13, 2, 13);
    g.fillStyle = '#7A6A5A';
    g.fillRect(tx + 4, kerb - 22, 16, 6);
    g.fillStyle = '#B08A3A';
    g.fillRect(tx + 24, kerb - 20, 12, 4);
    label(g, 'comic', 'SWAP MEET', tx + 22, kerb - 27, { size: 8, color: '#F3E6CB', halo: '#2B2825' });
  }
  lamp(g, x0 - 20, kerb, night);
  if (wet(s, 'shop')) drawRain(g, w, h, 0, true);
};

// The Warehouse (Phase 22.1): a long corrugated shed on the flats, roll-up doors at the dock,
// one of them open on the racking inside, pallets stacked by the wall and a forklift out
// front. The dock lights burn from before dawn.
const warehouse: Front = (g, s, w, h) => {
  const night = isNight(s.min);
  const kerb = street(g, valley(night ? 'night' : 'morning'), w, h, night);
  const x0 = Math.round(w * 0.08);
  const x1 = Math.round(w * 0.86);
  const top = Math.round(h * 0.22);
  const bw = x1 - x0;
  // The shed: pale steel with its ribs, and a low-pitched roof.
  g.fillStyle = night ? '#4A5058' : '#AEB4B4';
  g.fillRect(x0, top, bw, kerb - top);
  g.fillStyle = night ? 'rgba(0,0,0,.2)' : 'rgba(60,70,75,.18)';
  for (let x = x0 + 4; x < x1; x += 6) g.fillRect(x, top, 1.5, kerb - top);
  g.fillStyle = night ? '#33373E' : '#7D8686';
  g.beginPath();
  g.moveTo(x0 - 6, top + 2);
  g.lineTo(x0 + bw / 2, top - 10);
  g.lineTo(x1 + 6, top + 2);
  g.closePath();
  g.fill();
  label(g, 'poster', 'DOCK', x0 + 34, top + 16, { size: 12, color: '#F3E6CB', halo: '#2B2825' });

  // The dock: three roll-up doors on a raised apron. The middle one's open.
  const apron = kerb - 8;
  g.fillStyle = night ? '#2B2825' : '#6A625A';
  g.fillRect(x0, apron, bw, kerb - apron);
  const dw = Math.round(bw * 0.18);
  const dy = top + 26;
  for (let i = 0; i < 3; i++) {
    const dx = x0 + Math.round(bw * 0.3) + i * (dw + 8);
    if (i === 1) {
      g.fillStyle = night ? LIT : '#3A3530';
      g.fillRect(dx, dy, dw, apron - dy);
      // Racking inside, and the shutter rolled up at the top.
      g.fillStyle = night ? '#B08A3A' : '#C9523F';
      for (let y = dy + 8; y < apron - 4; y += 10) g.fillRect(dx + 3, y, dw - 6, 2);
      g.fillStyle = night ? '#5A6068' : '#8C9494';
      g.fillRect(dx - 1, dy, dw + 2, 5);
    } else {
      g.fillStyle = night ? '#5A6068' : '#8C9494';
      g.fillRect(dx, dy, dw, apron - dy);
      g.fillStyle = 'rgba(0,0,0,.18)';
      for (let y = dy + 4; y < apron; y += 4) g.fillRect(dx, y, dw, 1);
    }
    // A lamp over every door.
    g.fillStyle = night ? LIT : '#E8D9A8';
    g.fillRect(dx + dw / 2 - 3, dy - 6, 6, 3);
  }

  // Pallets stacked by the wall, and a forklift out front, forks down.
  const px = x0 + 8;
  g.fillStyle = '#B08A5A';
  for (let i = 0; i < 4; i++) g.fillRect(px, kerb - 5 - i * 6, 26, 4);
  g.fillStyle = '#7A5A3A';
  for (let i = 0; i < 4; i++) g.fillRect(px + 2, kerb - 2 - i * 6, 22, 1);
  const fx = x1 + 4;
  g.fillStyle = '#D8B43A';
  g.fillRect(fx, kerb - 16, 20, 11);
  g.fillStyle = '#2B2825';
  g.fillRect(fx + 4, kerb - 30, 2, 14);
  g.fillRect(fx + 16, kerb - 30, 2, 14);
  g.fillRect(fx + 4, kerb - 31, 14, 2);
  g.fillRect(fx - 6, kerb - 26, 2, 24);
  g.fillRect(fx - 14, kerb - 3, 12, 2);
  g.beginPath();
  g.arc(fx + 4, kerb - 3, 3.5, 0, Math.PI * 2);
  g.arc(fx + 16, kerb - 3, 3.5, 0, Math.PI * 2);
  g.fill();
  if (wet(s, 'warehouse')) drawRain(g, w, h, 0, true);
};

// The Garage (Phase 22.2a): a cinder-block shop with two bays, one up on the lift, a
// hand-painted sign, stacked tires by the door and an oil-stained apron.
const garage: Front = (g, s, w, h) => {
  const night = isNight(s.min);
  const kerb = street(g, valley(night ? 'night' : 'morning'), w, h, night);
  const x0 = Math.round(w * 0.14);
  const x1 = Math.round(w * 0.8);
  const top = Math.round(h * 0.18);
  const bw = x1 - x0;
  g.fillStyle = night ? '#5A5652' : '#C9C2B4';
  g.fillRect(x0, top, bw, kerb - top);
  g.fillStyle = night ? 'rgba(0,0,0,.14)' : 'rgba(90,80,70,.14)';
  for (let y = top + 6; y < kerb; y += 7) g.fillRect(x0, y, bw, 1);
  g.fillStyle = night ? '#2B2825' : '#4A4038';
  g.fillRect(x0 - 4, top - 4, bw + 8, 5);
  g.fillStyle = '#EFE0C2';
  rr(g, x0 + 20, top + 6, bw - 40, 17, 3);
  g.fill();
  label(g, 'poster', 'DALE’S', x0 + bw / 2, top + 20, { size: 14, color: '#8A3A2A', halo: '#EFE0C2' });
  // Two bays: the left one open, a van up on the lift; the right one shut.
  const by = top + 30;
  const bayW = Math.round(bw * 0.36);
  const lx = x0 + 10;
  g.fillStyle = night ? LIT : '#3A3530';
  g.fillRect(lx, by, bayW, kerb - by);
  g.fillStyle = '#6F8C98';
  rr(g, lx + 8, by + 10, bayW - 16, 14, 3);
  g.fill();
  g.fillStyle = '#2B2825';
  g.fillRect(lx + bayW / 2 - 2, by + 24, 4, kerb - by - 24);
  g.beginPath();
  g.arc(lx + 16, by + 26, 3.5, 0, Math.PI * 2);
  g.arc(lx + bayW - 16, by + 26, 3.5, 0, Math.PI * 2);
  g.fill();
  const rx = lx + bayW + 10;
  g.fillStyle = night ? '#6A6660' : '#9A948A';
  g.fillRect(rx, by, bayW, kerb - by);
  g.fillStyle = 'rgba(0,0,0,.16)';
  for (let y = by + 4; y < kerb; y += 4) g.fillRect(rx, y, bayW, 1);
  // Tires stacked by the door, and an oil stain on the apron.
  const tx = x1 + 6;
  g.fillStyle = '#2B2825';
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.ellipse(tx + 10, kerb - 4 - i * 6, 11, 3.5, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(20,18,16,.35)';
  g.beginPath();
  g.ellipse(lx + bayW / 2, kerb + 6, 18, 3, 0, 0, Math.PI * 2);
  g.fill();
  lamp(g, x0 - 20, kerb, night);
  if (wet(s, 'garage')) drawRain(g, w, h, 0, true);
};

// The Market (Phase 22.3): a corner grocery with a striped awning, crates of greens and
// oranges out front on the sidewalk, and a hand-lettered sign in the window.
const market: Front = (g, s, w, h) => {
  const night = isNight(s.min);
  const kerb = street(g, valley(night ? 'night' : 'morning'), w, h, night);
  const x0 = Math.round(w * 0.16);
  const x1 = Math.round(w * 0.82);
  const top = Math.round(h * 0.14);
  const bw = x1 - x0;
  g.fillStyle = night ? '#4A3A32' : '#B86B4B';
  g.fillRect(x0, top, bw, kerb - top);
  g.fillStyle = night ? 'rgba(0,0,0,.18)' : 'rgba(80,30,20,.14)';
  for (let y = top + 5; y < kerb; y += 6) g.fillRect(x0, y, bw, 1);
  g.fillStyle = '#EFE0C2';
  rr(g, x0 + 18, top + 8, bw - 36, 16, 3);
  g.fill();
  label(g, 'poster', 'MARKET', x0 + bw / 2, top + 21, { size: 13, color: '#6E3A28', halo: '#EFE0C2' });
  // A striped awning over the window.
  const ay = top + 30;
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#EFE0C2' : '#3E7F5A';
    g.fillRect(x0 + 4 + (i * (bw - 8)) / 8, ay, (bw - 8) / 8 + 0.5, 9);
  }
  const wy = ay + 12;
  const wh = kerb - 22 - wy;
  g.fillStyle = night ? LIT : '#A8BFC6';
  g.fillRect(x0 + 10, wy, bw * 0.55, wh);
  if (!night) glint(g, x0 + 10, wy, bw * 0.55, wh);
  label(g, 'comic', 'EGGS · RICE · GREENS', x0 + 10 + (bw * 0.55) / 2, wy + wh / 2 + 3, {
    size: 7,
    color: '#2B2825',
    halo: night ? LIT : '#A8BFC6',
  });
  g.fillStyle = night ? '#3A2E24' : '#6A4A36';
  g.fillRect(x1 - 30, wy, 22, kerb - wy);
  // Crates on the sidewalk: greens, oranges, and a stack of empties.
  const crate = (x: number, fill: string) => {
    g.fillStyle = '#8A6A44';
    g.fillRect(x, kerb - 14, 22, 12);
    g.fillStyle = fill;
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.arc(x + 4 + i * 5, kerb - 15, 3, 0, Math.PI * 2);
      g.fill();
    }
  };
  crate(x0 + 12, '#5E9A4A');
  crate(x0 + 38, '#E0913A');
  g.fillStyle = '#8A6A44';
  g.fillRect(x1 + 6, kerb - 12, 20, 10);
  g.fillRect(x1 + 8, kerb - 22, 20, 10);
  lamp(g, x0 - 18, kerb, night);
  if (wet(s, 'market')) drawRain(g, w, h, 0, true);
};

// The Lake (Phase 22.3b): still water under the far ridges, reeds at the edge, a half-sunk
// dock and a lawn chair on it. Frost on the reeds in winter.
const lake: Front = (g, s, w, h) => {
  const night = isNight(s.min);
  const P = valley(night ? 'night' : 'morning');
  g.fillStyle = lin(g, 0, 0, 0, h, P.sky);
  g.fillRect(0, 0, w, h);
  g.fillStyle = P.far;
  g.beginPath();
  ridgeLine(w, h * 0.55, h * 0.22, 7, 0.01, true).forEach(([x, y], i) =>
    i ? g.lineTo(x, y) : g.moveTo(x, y),
  );
  g.lineTo(w + 12, h);
  g.lineTo(-12, h);
  g.closePath();
  g.fill();
  const shore = Math.round(h * 0.62);
  g.fillStyle = night ? '#1E3440' : '#5E8FA0';
  g.fillRect(0, shore, w, h - shore);
  g.fillStyle = night ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.22)';
  for (let i = 0; i < 6; i++) g.fillRect(w * (0.1 + i * 0.14), shore + 10 + (i % 3) * 9, w * 0.08, 1.5);
  // The dock, and the chair on it.
  const dx = Math.round(w * 0.55);
  g.fillStyle = '#6A4A36';
  g.fillRect(dx, shore + 18, w * 0.3, 5);
  for (let i = 0; i < 4; i++) g.fillRect(dx + 6 + i * (w * 0.07), shore + 23, 3, 12);
  g.strokeStyle = '#C9523F';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(dx + w * 0.18, shore + 18);
  g.lineTo(dx + w * 0.2, shore + 6);
  g.lineTo(dx + w * 0.24, shore + 6);
  g.moveTo(dx + w * 0.2, shore + 12);
  g.lineTo(dx + w * 0.25, shore + 12);
  g.lineTo(dx + w * 0.26, shore + 18);
  g.stroke();
  // Reeds along the near edge.
  const winter = seasonOf(s.day) === 'winter';
  g.strokeStyle = winter ? '#C8D4D8' : '#4E6B3A';
  g.lineWidth = 1.5;
  for (let x = 6; x < w * 0.45; x += 5) {
    g.beginPath();
    g.moveTo(x, h);
    g.lineTo(x + ((x * 7) % 5) - 2, h - 14 - ((x * 13) % 11));
    g.stroke();
  }
  if (wet(s, 'lake')) drawRain(g, w, h, 0, true);
};

// The Clinic (Phase 22.4a): a low white building with a green cross, a ramp, and a bench
// out front where somebody always seems to be icing a knee.
const clinic: Front = (g, s, w, h) => {
  const night = isNight(s.min);
  const kerb = street(g, valley(night ? 'night' : 'morning'), w, h, night);
  const x0 = Math.round(w * 0.14);
  const x1 = Math.round(w * 0.84);
  const top = Math.round(h * 0.24);
  const bw = x1 - x0;
  g.fillStyle = night ? '#6E7074' : '#E4E0D6';
  g.fillRect(x0, top, bw, kerb - top);
  g.fillStyle = night ? '#3E4044' : '#8E8A80';
  g.fillRect(x0 - 4, top - 5, bw + 8, 6);
  // The cross.
  const cx = x0 + 26;
  const cy = top + 18;
  g.fillStyle = '#3E8F5A';
  g.fillRect(cx - 3, cy - 9, 6, 18);
  g.fillRect(cx - 9, cy - 3, 18, 6);
  label(g, 'poster', 'CLINIC', x0 + bw / 2 + 12, top + 22, {
    size: 13,
    color: '#3E5A48',
    halo: night ? '#6E7074' : '#E4E0D6',
  });
  // Windows, the door and the ramp.
  const wy = top + 32;
  for (let i = 0; i < 3; i++) {
    const wx = x0 + 12 + i * (bw * 0.2);
    g.fillStyle = night ? LIT : '#A8BFC6';
    g.fillRect(wx, wy, bw * 0.14, kerb - wy - 14);
  }
  const dx = x1 - 34;
  g.fillStyle = night ? LIT : '#6F8C98';
  g.fillRect(dx, wy - 4, 22, kerb - wy + 4);
  g.fillStyle = night ? '#4A4C50' : '#B8B2A6';
  g.beginPath();
  g.moveTo(dx - 30, kerb);
  g.lineTo(dx, kerb - 6);
  g.lineTo(dx, kerb);
  g.closePath();
  g.fill();
  // The bench.
  g.fillStyle = '#6A4A36';
  g.fillRect(x1 + 6, kerb - 10, 26, 3);
  g.fillRect(x1 + 8, kerb - 7, 2, 7);
  g.fillRect(x1 + 28, kerb - 7, 2, 7);
  lamp(g, x0 - 18, kerb, night);
  if (wet(s, 'clinic')) drawRain(g, w, h, 0, true);
};

export const FRONTS: Record<string, Front> = { diner, cafe, shop, warehouse, garage, market, lake, clinic };
