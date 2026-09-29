// A place card's header: the place as you'd find it when you got there. A place with a
// scene is drawn from it, framed where its people stand, with the light, the wet and
// whoever is there at that hour. A place you only ever see as a card has its front drawn.

import { PLACES, type GameState } from '../sim';
import { mk, type G } from './kit/geom';
import { GND, SCENES } from './layout';
import { FRONTS } from './paint/fronts';
import { sceneArt, SEEN } from './paint/scenes';
import { sceneBack, sceneLive, todAt, type Eye } from './render';

// The band of the world a header shows: from the tags on the rock to just under the
// ground, so the people in it are there head to toe.
const TOP = GND - 190;
const BOTTOM = GND + 26;

// Painted backs, kept by scene, time of day and size. A scene's layers take a phone a
// moment to paint, and the back doesn't change with the hour: only what's drawn over it.
const backs = new Map<string, HTMLCanvasElement>();
const KEPT = 6;

// Whether a place has a header to show: a scene, or a front of its own. layout.test.ts
// holds every place to it.
export const hasHeader = (place: string): boolean => {
  const scene = PLACES[place]?.scene;
  return scene ? !!SCENES[scene] : !!FRONTS[place];
};

// Paints `place` at the state's hour into a header `w` by `h` logical pixels, `px` device
// pixels to one.
export function paintHeader(g: G, s: GameState, place: string, w: number, h: number, px: number): void {
  const scene = PLACES[place]?.scene;
  const lay = scene ? SCENES[scene] : undefined;
  if (!scene || !lay) {
    g.setTransform(px, 0, 0, px, 0, 0);
    FRONTS[place]?.(g, s, w, h);
    return;
  }
  // The band, unless the header's so wide it would see past the layers: then a little less
  // of it, kept on the ground.
  const z = Math.max(h / (BOTTOM - TOP), w / SEEN);
  const eye: Eye = { w, h, z, oy: h - BOTTOM * z, px };
  const vw = w / z;
  const cam = Math.max(0, Math.min(lay.width - vw, lay.frame - vw / 2));
  const tod = todAt(scene, s.min);
  const key = `${scene}:${tod}:${w}x${h}@${px}`;
  let back = backs.get(key);
  if (!back) {
    const [c, bg] = mk(w, h, px);
    sceneBack(bg, sceneArt(scene, tod, false), cam, eye);
    backs.set(key, (back = c));
    while (backs.size > KEPT) backs.delete(backs.keys().next().value!);
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(back, 0, 0);
  sceneLive(g, s, scene, cam, eye, { t: 0, still: true });
}
