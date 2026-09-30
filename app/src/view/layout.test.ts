// The staging's side of "content is data": every crag line the rules know has one place on
// screen, in the scene of its crag, and every place has a pin on the map and a header on
// its card.
import { describe, expect, it } from 'vitest';
import { onWall, PLACES, ROUTES } from '../sim';
import { hasHeader } from './header';
import {
  CRAGS,
  H,
  MAP_FIT,
  MAP_PINS,
  mapToScreen,
  screenToMap,
  SCENES,
  screenWidth,
  SPOTS,
  W,
  W_MAX,
  WIDE,
  widthOf,
  Z,
} from './layout';
import { drivePath, joinOf, roadX, SIDE_ROADS } from './valley';

describe('the crags on screen', () => {
  it('put every crag line in its place’s scene, once', () => {
    const seen: string[] = [];
    for (const [scene, c] of Object.entries(CRAGS)) {
      const place = SCENES[scene]!.place;
      for (const b of c.boulders) {
        expect(ROUTES[b.route], b.route).toMatchObject({ disc: 'boulder', place });
        seen.push(b.route);
      }
      for (const l of c.lines) {
        expect(ROUTES[l.route], l.route).toMatchObject({ place });
        expect(onWall(ROUTES[l.route]!), l.route).toBe(true);
        seen.push(l.route);
      }
    }
    expect(new Set(seen).size).toBe(seen.length);
    // A wall's pitches are climbed from its sheet, not walked up to one by one.
    const crag = Object.values(ROUTES).filter((r) => r.place !== 'gym' && !r.wall);
    expect(seen.sort()).toEqual(crag.map((r) => r.id).sort());
  });

  it('keep boulders apart and inside their scene', () => {
    for (const [scene, c] of Object.entries(CRAGS)) {
      expect(widthOf(scene)).toBe(c.width);
      const bs = [...c.boulders].sort((a, b) => a.x - b.x);
      bs.forEach((b, i) => {
        expect(b.x + b.w / 2, b.route).toBeLessThanOrEqual(c.width);
        if (i) expect(b.x - b.w / 2, b.route).toBeGreaterThan(bs[i - 1]!.x + bs[i - 1]!.w / 2);
      });
    }
  });

  it('fit every map pin between the HUD and the buttons, and read taps back to the map', () => {
    for (const [id, p] of Object.entries(MAP_PINS)) {
      const [x, y] = mapToScreen(p.x, p.y);
      expect(y, id).toBeGreaterThanOrEqual(MAP_FIT.top);
      expect(y, id).toBeLessThanOrEqual(MAP_FIT.bottom);
      expect(x, id).toBeGreaterThan(0);
      expect(x, id).toBeLessThan(W);
      const [bx, by] = screenToMap(x, y);
      expect(bx).toBeCloseTo(p.x);
      expect(by).toBeCloseTo(p.y);
    }
  });

  it('pin every place on the map', () => {
    for (const id of Object.keys(PLACES)) expect(MAP_PINS[id], id).toBeDefined();
    for (const s of Object.values(SCENES)) expect(PLACES[s.place], s.place).toBeDefined();
  });

  it('give every place a header: its scene, framed inside it, or a front of its own', () => {
    for (const id of Object.keys(PLACES)) expect(hasHeader(id), id).toBe(true);
    for (const [id, p] of Object.entries(PLACES)) if (p.scene) expect(SCENES[p.scene]?.place, id).toBe(id);
    for (const [id, s] of Object.entries(SCENES)) {
      expect(s.frame, id).toBeGreaterThan(0);
      expect(s.frame, id).toBeLessThan(s.width);
    }
    // Anyone whose day can bring them to a scene has somewhere to stand in it.
    for (const id of Object.keys(SCENES)) expect(SPOTS[id], id).toBeDefined();
  });
});

describe('the screen', () => {
  it('is W wide in portrait, widens with the window, and stops at W_MAX', () => {
    expect(screenWidth(390 / 844)).toBe(W);
    expect(screenWidth(768 / 1024)).toBe(Math.round(H * 0.75));
    expect(screenWidth(1280 / 800)).toBe(Math.round(H * 1.6));
    expect(screenWidth(1920 / 1080)).toBe(W_MAX);
    // A Steam Deck docks its sheets.
    expect(screenWidth(1280 / 800)).toBeGreaterThanOrEqual(WIDE);
  });

  it('never sees past a scene’s ends, even at its widest', () => {
    for (const [id, s] of Object.entries(SCENES)) expect(s.width, id).toBeGreaterThanOrEqual(W_MAX / Z);
  });
});

describe('the drives on the map', () => {
  it('start side roads on the highway, and only for places that have pins', () => {
    for (const [id, r] of Object.entries(SIDE_ROADS)) {
      expect(MAP_PINS[id], id).toBeDefined();
      const [x, y] = r.pts[0]!;
      expect(Math.abs(x - roadX(y)), id).toBeLessThan(3);
    }
  });

  it('go from pin to pin along the roads, never past either end, without jumps', () => {
    const ids = Object.keys(PLACES);
    for (const a of ids)
      for (const b of ids) {
        if (a === b) continue;
        const pts = drivePath(a, b, MAP_PINS);
        expect(pts[0], `${a} to ${b}`).toEqual([MAP_PINS[a]!.x, MAP_PINS[a]!.y]);
        expect(pts.at(-1), `${a} to ${b}`).toEqual([MAP_PINS[b]!.x, MAP_PINS[b]!.y]);
        const ends = [...joinOf(a, MAP_PINS).pts, ...joinOf(b, MAP_PINS).pts].map((p) => p[1]);
        for (const [, y] of pts) {
          expect(y, `${a} to ${b}`).toBeGreaterThanOrEqual(Math.min(...ends) - 1);
          expect(y, `${a} to ${b}`).toBeLessThanOrEqual(Math.max(...ends) + 1);
        }
        // No stretch of road skipped: the longest step is a town street from the highway to a
        // pin a couple of blocks off it. A place further off needs a side road.
        for (let i = 1; i < pts.length; i++) {
          const step = Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
          expect(
            step,
            `${a} to ${b}: a pin this far off the highway needs a side road (SIDE_ROADS)`,
          ).toBeLessThan(90);
        }
      }
  });
});
