// Phase 15.1: Steam's store art, drawn by the game's own painters at each size Steam asks
// for. Dev only: `npm run dev`, then /store.html to look; `npm run store:art` saves each
// one as a PNG. Not part of the production build.
//
// Two scenes. The highball at Roadside, the climber big near its top, says climbing at a
// glance; the Lot at night, the vans, the fire, Hazel and Scout, says the life around it.
// The wide capsules come in both, for Evan to pick; the tall ones are the highball; the
// library's hero and the page's background, which take no title, are the Lot.
import '@fontsource/big-shoulders-display/latin-800';
import { newGame, ROUTES } from '../sim';
import { GND, SCENES } from '../view/layout';
import { CREAM, FONT } from '../view/paint/fx';
import { drawClimber, drawPerson, INK, LOOK } from '../view/paint/people';
import { BIG } from '../view/paint/scale';
import { sceneArt } from '../view/paint/scenes';
import { onRoute, paintRouteArt, wallOf } from '../view/paint/wall';
import { sceneBack, sceneLive, todAt, type Eye } from '../view/render';

type G = CanvasRenderingContext2D;

// The Lot at twenty to nine: the string lights on, you in the chair by the fire, Scout at
// your feet, Hazel across from you. From the vans' roofs to just under the ground, with
// room over the trees for a title; wider than that, the whole Lot, cut at the top.
function lotNight(g: G, w: number, h: number): void {
  const s = newGame('store-art');
  s.min = 20 * 60 + 40;
  const lay = SCENES.lot!;
  const bottom = GND + 30;
  const z = Math.max(h / 330, w / lay.width);
  const eye: Eye = { w, h, z, oy: h - bottom * z, px: 1 };
  const vw = w / z;
  const cam = Math.max(0, Math.min(lay.width - vw, 480 - vw / 2));
  sceneBack(g, sceneArt('lot', todAt('lot', s.min), false), cam, eye);
  g.save();
  g.setTransform(z, 0, 0, z, 0, eye.oy);
  drawPerson(g, LOOK.you!, { x: 470 - cam, y: GND, dir: 1, pose: 'sit', t: 0 });
  g.restore();
  sceneLive(g, s, 'lot', cam, eye, { t: 0.4, still: true, scout: { x: 438, wag: 0 } });
}

// The highball's close-up, you three-quarters up it, filling the canvas. `at` is where the
// boulder sits across the canvas (0.5 the middle) and `up` where you sit down it; past the
// art's edges its outermost column runs on, which on a close-up is sky over hills over
// ground.
const HIGHBALL = 'highball';
const ART_K = 4;
let highball: HTMLCanvasElement | null = null;
function onHighball(g: G, w: number, h: number, at: number, up: number, span: number): void {
  const r = ROUTES[HIGHBALL]!;
  if (!highball) {
    highball = document.createElement('canvas');
    highball.width = 360 * ART_K;
    highball.height = 740 * ART_K;
    const a = highball.getContext('2d')!;
    a.scale(ART_K, ART_K);
    paintRouteArt(a, r);
  }
  const [x, y] = onRoute(r, r.moves * 0.78);
  // In close enough that the boulder fills its share of the width, or the span asked for.
  const k = Math.max(h / span, (w * Math.min(at, 1 - at) * 2) / 360);
  const x0 = x - (w * at) / k;
  const y0 = Math.max(0, Math.min(740 - h / k, y - (h / k) * up));
  const right = x0 + w / k;
  g.save();
  g.scale(k, k);
  g.translate(-x0, -y0);
  const art = highball;
  if (x0 < 0) g.drawImage(art, 0, 0, 1, art.height, x0 - 1, 0, 2 - x0, 740);
  if (right > 360) g.drawImage(art, art.width - 1, 0, 1, art.height, 359, 0, right - 359, 740);
  g.drawImage(art, 0, 0, 360, 740);
  g.translate(x, y);
  if (wallOf(r).big) g.scale(BIG, BIG);
  drawClimber(g, LOOK.you!, 0, 0, 0.6, false);
  g.restore();
}

// The title, as the game's signs letter a place: its poster face, cream on ink, with a
// drop of shadow. As big as fits `width`, its baseline at y.
function title(g: G, width: number, x: number, y: number, align: CanvasTextAlign = 'center'): void {
  const text = 'DIRTBAG';
  let size = 400;
  for (; size > 12; size--) {
    g.font = `800 ${size}px ${FONT.poster}`;
    if (g.measureText(text).width + size * 0.1 <= width) break;
  }
  g.save();
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.lineJoin = 'round';
  g.fillStyle = INK;
  g.fillText(text, x + size * 0.05, y + size * 0.06);
  g.strokeStyle = INK;
  g.lineWidth = size * 0.09;
  g.strokeText(text, x, y);
  g.fillStyle = CREAM;
  g.fillText(text, x, y);
  g.restore();
}

// Each asset Steam's store page and library take, at its size in pixels (Steamworks'
// graphical assets page, as of 2026: check it before uploading). The file each is saved as
// is its name.
export interface Art {
  name: string;
  w: number;
  h: number;
  // Drawn over nothing: the library's logo is a PNG with its background left clear.
  clear?: boolean;
  draw: (g: G, w: number, h: number) => void;
}

const wideHighball =
  (span: number) =>
  (g: G, w: number, h: number): void => {
    onHighball(g, w, h, 0.74, 0.55, span);
    title(g, w * 0.52, w * 0.05, h * 0.58, 'left');
  };
const wideLot =
  (share: number, y: number) =>
  (g: G, w: number, h: number): void => {
    lotNight(g, w, h);
    title(g, w * share, w / 2, h * y);
  };
const tall = (span: number, y: number) => (g: G, w: number, h: number) => {
  onHighball(g, w, h, 0.5, 0.45, span);
  title(g, w * 0.84, w / 2, h * y);
};

export const ART: Art[] = [
  { name: 'header-highball', w: 920, h: 430, draw: wideHighball(420) },
  { name: 'header-lot', w: 920, h: 430, draw: wideLot(0.6, 0.4) },
  { name: 'small-highball', w: 462, h: 174, draw: wideHighball(300) },
  { name: 'small-lot', w: 462, h: 174, draw: wideLot(0.86, 0.6) },
  { name: 'main-highball', w: 1232, h: 706, draw: wideHighball(520) },
  { name: 'main-lot', w: 1232, h: 706, draw: wideLot(0.6, 0.36) },
  { name: 'vertical', w: 748, h: 896, draw: tall(520, 0.17) },
  { name: 'library-capsule', w: 600, h: 900, draw: tall(560, 0.15) },
  { name: 'library-header-highball', w: 920, h: 430, draw: wideHighball(420) },
  { name: 'library-header-lot', w: 920, h: 430, draw: wideLot(0.6, 0.4) },
  { name: 'library-hero', w: 3840, h: 1240, draw: lotNight },
  {
    name: 'library-logo',
    w: 1280,
    h: 720,
    clear: true,
    draw: (g, w, h) => title(g, w * 0.92, w / 2, h * 0.68),
  },
  { name: 'page-background', w: 1438, h: 810, draw: lotNight },
];

// Painted once the fonts are in, so the title is in its face and not a fallback's.
const canvases = new Map<string, HTMLCanvasElement>();
async function paint(): Promise<void> {
  await document.fonts.load(`800 100px ${FONT.poster}`);
  for (const a of ART) {
    const fig = document.createElement('figure');
    const cv = document.createElement('canvas');
    cv.width = a.w;
    cv.height = a.h;
    if (a.clear) cv.classList.add('clear');
    a.draw(cv.getContext('2d')!, a.w, a.h);
    canvases.set(a.name, cv);
    const cap = document.createElement('figcaption');
    cap.textContent = `${a.name} · ${a.w} × ${a.h}`;
    fig.append(cv, cap);
    document.body.append(fig);
  }
}

// What `npm run store:art` reads: each asset as a PNG, by name.
declare global {
  interface Window {
    storeArt?: Promise<Record<string, string>>;
  }
}
window.storeArt = paint().then(() =>
  Object.fromEntries([...canvases].map(([name, cv]) => [name, cv.toDataURL('image/png')])),
);
