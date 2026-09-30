// The conditions you can see at a crag: where the sun's edge is, and how wet the rock is.
// The rules decide both (sunOn, conditionsAt); this only works out where to draw them, so
// the light on a line changes the minute its windows do.

import { CLIMB, conditionsAt, onWall, PLACES, routeOfId, sunOn, type GameState, type RouteDef } from '../sim';
import { CRAGS, W } from './layout';
import { onRoute } from './paint/wall';

// A line's foot in its crag scene: a sport line's tag, or a boulder's centre.
export function footX(scene: string, route: string): number | undefined {
  const c = CRAGS[scene];
  return c?.lines.find((l) => l.route === route)?.x ?? c?.boulders.find((b) => b.route === route)?.x;
}

// Where the sun's edge is, and which side of it is lit: the side it has already crossed.
export interface Edge {
  x: number;
  lit: 1 | -1;
}

// A crag's sun today: its path, the minutes between lines, its scene, and the side that's
// lit (the sun comes in beyond the end its path starts at). null for the shade, a day of
// rain, or the gym.
function sunAt(
  s: GameState,
  place: string,
): { ids: string[]; step: number; scene: string; lit: 1 | -1 } | null {
  const p = PLACES[place];
  const scene = p?.scene;
  if (!p?.sun || p.sun.length < 2 || p.shaded || !scene || !CRAGS[scene]) return null;
  if (!conditionsAt(s.seed, s.day, place).open) return null;
  const first = footX(scene, p.sun[0]!) ?? 0;
  const last = footX(scene, p.sun.at(-1)!) ?? 0;
  return { ids: p.sun, step: CLIMB.sunSweep / (p.sun.length - 1), scene, lit: last < first ? 1 : -1 };
}

// Piecewise along (minute, x) points, with a step's run-in beyond the lit end and a step's
// run-out beyond the other: before the run-in, no sun; after the run-out, it has everything.
function edgeAt(min: number, pts: [number, number][], step: number, lo: number, hi: number, lit: 1 | -1) {
  const [from, to] = lit === 1 ? [hi, lo] : [lo, hi];
  const all: [number, number][] = [[pts[0]![0] - step, from], ...pts, [pts.at(-1)![0] + step, to]];
  if (min < all[0]![0]) return null;
  for (let i = 1; i < all.length; i++) {
    const [t1, b] = all[i]!;
    if (min < t1) {
      const [t0, a] = all[i - 1]!;
      return { x: a + ((b - a) * (min - t0)) / (t1 - t0), lit };
    }
  }
  return { x: to, lit };
}

// Where the sun's edge is in a crag scene, in scene x: it comes in at one end, passes each
// line's foot at the minute that line gets the sun, and goes off the other. null before it
// arrives, and all day in the shade.
export function sceneSun(s: GameState, scene: string): Edge | null {
  const place = Object.keys(PLACES).find((id) => PLACES[id]!.scene === scene);
  const sun = place ? sunAt(s, place) : null;
  if (!place || !sun) return null;
  const pts = sun.ids.map((id): [number, number] => [sunOn(s.seed, s.day, place, id), footX(scene, id) ?? 0]);
  return edgeAt(s.min, pts, sun.step, -80, CRAGS[scene]!.width + 80, sun.lit);
}

// The same edge on a line's own wall: across the sport lines on a route's wall topo, or
// across a boulder's close-up, at the pace and from the side the scene's edge keeps.
export function wallSun(s: GameState, r: RouteDef): Edge | null {
  const sun = sunAt(s, r.place);
  if (!sun || !sun.ids.includes(r.id)) return null;
  const at = (id: string): [number, number] => [
    sunOn(s.seed, s.day, r.place, id),
    onRoute(routeOfId(s, id)!, 0)[0],
  ];
  const ids = onWall(r) ? sun.ids.filter((id) => onWall(routeOfId(s, id)!)) : [r.id];
  return edgeAt(s.min, ids.map(at), sun.step, -40, W + 40, sun.lit);
}

// How strong the light is: full through the day, going with the evening.
export const sunLight = (min: number): number => Math.max(0, Math.min(1, (CLIMB.darkFrom - min) / 120));

// Wet rock: soaked while it rains, seeping the day after.
export function wetness(s: GameState, place: string): 'soaked' | 'seeping' | null {
  if (!PLACES[place]?.crag) return null;
  const c = conditionsAt(s.seed, s.day, place);
  return !c.open ? 'soaked' : c.seeping ? 'seeping' : null;
}
