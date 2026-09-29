// The send card: a keepsake of a send, drawn on the device from the line's own wall and
// topo, to save or share. Nothing is uploaded: the page paints the PNG and hands it to the
// phone. Card units are 360 × 640, the wall view's width, painted at 3x: a 1080 × 1920
// image, a phone screen's shape, which is what stories and chats want.

import type { RouteDef } from '../../sim';
import { clamp, mk, poly, rr, type G, type Pt } from '../kit/geom';
import { H, W } from '../layout';
import { ACC, CREAM, FONT, label } from './fx';
import { drawClimber, INK, LOOK } from './people';
import { BIG } from './scale';
import { paintRouteArt, routeStretch, wallOf } from './wall';

export interface Card {
  route: RouteDef;
  // The line as it goes by: its first-ascent name and called grade once it has them.
  name: string;
  grade: string;
  // How it went: "Flash", "Redpoint, go 6".
  style: string;
  where: string;
  when: string;
  who: string;
  // A first ascent on the line: yours, or whoever got there first.
  fa: { mine: boolean; by: string } | null;
}

export const CARD = { w: 360, h: 640, k: 3 };
// The wall's panel, in card units.
const P = { x: 16, y: 16, w: 328, h: 464 };
const DIM = '#5E5A52';

// The stretch of wall the card shows: the whole line, room above it for you at the top and
// a little ground below, in the panel's shape. Never wider than the wall; if a line is ever
// too tall for that, the top stays in.
function crop(r: RouteDef): { x: number; y: number; s: number; big: boolean } {
  const { topo, big } = wallOf(r);
  const xs = topo.d.map((p) => p[0]);
  const ys = topo.d.map((p) => p[1]);
  // On a close-up wall you're drawn big: more room over the top for your arms, and never
  // closer in than the wall view itself, so you don't fill the panel.
  const top = Math.min(...ys) - (big ? 135 : 46);
  const bottom = Math.max(...ys) + (big ? 70 : 30);
  const aspect = P.w / P.h;
  let h = Math.max(bottom - top, big ? 460 : 330);
  let w = h * aspect;
  if (w > W) {
    w = W;
    h = w / aspect;
  }
  const x = clamp((Math.min(...xs) + Math.max(...xs)) / 2 - w / 2, 0, W - w);
  const y = clamp(bottom - top > h ? top : (top + bottom) / 2 - h / 2, 0, H - h);
  return { x, y, s: P.w / w, big };
}

// The largest size, up to `max`, at which a line of text fits the width.
function fit(g: G, font: string, weight: number, text: string, width: number, max: number): number {
  let size = max;
  for (; size > 12; size--) {
    g.font = `${weight} ${size}px ${font}`;
    if (g.measureText(text).width <= width) break;
  }
  return size;
}

function stroke(g: G, pts: Pt[], color: string, width: number): void {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  poly(g, pts, false);
  g.stroke();
}

export function paintCard(g: G, c: Card): void {
  const r = c.route;
  g.fillStyle = CREAM;
  g.fillRect(0, 0, CARD.w, CARD.h);

  // The wall, in a comic panel.
  g.fillStyle = INK;
  rr(g, P.x + 4, P.y + 4, P.w, P.h, 4);
  g.fill();
  g.save();
  rr(g, P.x, P.y, P.w, P.h, 4);
  g.clip();
  const v = crop(r);
  g.translate(P.x, P.y);
  g.scale(v.s, v.s);
  g.translate(-v.x, -v.y);
  paintRouteArt(g, r);
  // The line as a guidebook's photo-topo draws it, bright with a pale edge; and you at the top.
  const line = routeStretch(r, 0, r.moves);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  stroke(g, line, 'rgba(255,253,245,.92)', v.big ? 6.5 : 5);
  stroke(g, line, ACC.comic, v.big ? 3 : 2.5);
  const [tx, ty] = line[line.length - 1]!;
  if (v.big) {
    g.save();
    g.translate(tx, ty);
    g.scale(BIG, BIG);
    drawClimber(g, LOOK.you!, 0, 0, 0, false);
    g.restore();
  } else drawClimber(g, LOOK.you!, tx, ty, 0, false);
  g.restore();

  // Your first ascent gets a ribbon across the panel's corner.
  if (c.fa?.mine) {
    g.save();
    rr(g, P.x, P.y, P.w, P.h, 4);
    g.clip();
    g.translate(P.x + P.w, P.y);
    g.rotate(Math.PI / 4);
    g.fillStyle = ACC.comic;
    g.fillRect(-110, 42, 220, 30);
    g.strokeStyle = INK;
    g.lineWidth = 1.6;
    g.strokeRect(-110, 42, 220, 30);
    label(g, 'poster', 'FIRST ASCENT', 0, 63.5, { size: 18, color: CREAM, halo: ACC.comic });
    g.restore();
  }
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  rr(g, P.x, P.y, P.w, P.h, 4);
  g.stroke();

  // The caption: the name as a poster would letter it, then the grade and how it went, where
  // and when, and who.
  const x = P.x + 2;
  const name = c.name.toUpperCase();
  const size = fit(g, FONT.poster, 800, name, P.w - 4, 44);
  label(g, 'poster', name, x, 537, { size, align: 'left', color: INK, halo: CREAM });
  label(g, 'comic', c.grade, x, 567, { size: 25, align: 'left', color: ACC.comic });
  g.font = `400 25px ${FONT.comic}`;
  const gx = x + g.measureText(c.grade).width;
  label(g, 'comic', ` · ${c.style}`, gx, 567, { size: 25, align: 'left' });
  label(g, 'comic', `${c.where} · ${c.when}`, x, 591, { size: 17, align: 'left', color: DIM });
  const by = !c.fa
    ? c.who
    : c.fa.mine
      ? `First ascent: ${c.who}`
      : `First ascent: ${c.fa.by} · Second: ${c.who}`;
  label(g, 'comic', by, x, 611, { size: 17, align: 'left', color: DIM });
  label(g, 'poster', 'DIRTBAG', x, 632, { size: 15, align: 'left', color: ACC.comic, halo: CREAM });
  label(g, 'comic', 'dirtbag.rcjlabs.com', P.x + P.w, 632, { size: 13, align: 'right', color: DIM });
}

// The card as a PNG. The fonts are the game's own, bundled; they have to be loaded before a
// canvas can letter with them.
export async function cardPng(c: Card): Promise<Blob> {
  await Promise.all([`800 40px ${FONT.poster}`, `400 20px ${FONT.comic}`].map((f) => document.fonts.load(f)));
  const [cv, g] = mk(CARD.w, CARD.h, CARD.k);
  paintCard(g, c);
  return new Promise((ok, no) => cv.toBlob((b) => (b ? ok(b) : no(new Error('No card.'))), 'image/png'));
}
