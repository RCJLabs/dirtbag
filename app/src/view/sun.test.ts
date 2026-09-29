// The light you see has to be the light the rules use: the sun's edge sits on a line's
// foot the minute that line's windows start to grease, in the scene and on its wall.
import { describe, expect, it } from 'vitest';
import { CLIMB, conditionsAt, newGame, PLACES, routeOfId, sunOn, type GameState } from '../sim';
import { CRAGS, SCENES, W } from './layout';
import { onRoute } from './paint/wall';
import { footX, sceneSun, wallSun, wetness } from './sun';

const at = (min: number, over: Partial<GameState> = {}): GameState => ({
  ...newGame('sun'),
  at: 'road',
  min,
  ...over,
});

describe('the sun you see', () => {
  it("follows the crag's layout: the sun's path runs end to end over every line in the scene", () => {
    for (const [scene, c] of Object.entries(CRAGS)) {
      const path = PLACES[SCENES[scene]!.place]?.sun;
      if (!path) continue;
      const xs = path.map((id) => footX(scene, id)!);
      for (const x of xs) expect(x, scene).toBeDefined();
      // One way along the crag, never doubling back, so one edge can pass them all in order.
      const dir = Math.sign(xs.at(-1)! - xs[0]!);
      for (let i = 1; i < xs.length; i++)
        expect(Math.sign(xs[i]! - xs[i - 1]!), `${scene}: ${path[i]}`).toBe(dir);
      expect([...path].sort()).toEqual(
        [...c.lines.map((l) => l.route), ...c.boulders.map((b) => b.route)].sort(),
      );
    }
  });

  it('crosses the scene from the far end, reaching each line at its sun time', () => {
    const path = PLACES.road!.sun!;
    const first = sunOn('sun', 1, 'road', path[0]!);
    const step = CLIMB.sunSweep / (path.length - 1);
    expect(sceneSun(at(first - step - 1), 'crag')).toBeNull();
    for (const id of path) {
      const e = sceneSun(at(sunOn('sun', 1, 'road', id)), 'crag')!;
      expect(e.x).toBeCloseTo(footX('crag', id)!);
      // Lit on the side it has crossed: the boulder field's, right of it.
      expect(e.lit).toBe(1);
    }
    expect(sceneSun(at(first + CLIMB.sunSweep + step), 'crag')?.x).toBe(-80);
    // The Gorge is in the shade all day.
    expect(sceneSun(at(16 * 60, { at: 'gorge' }), 'gorge')).toBeNull();
  });

  it("reaches a line's foot on its own wall at its sun time, and not before", () => {
    const s = at(9 * 60);
    for (const id of PLACES.road!.sun!) {
      const r = routeOfId(s, id)!;
      const t = sunOn('sun', 1, 'road', id);
      expect(wallSun(at(t), r)?.x).toBeCloseTo(onRoute(r, 0)[0]);
      // A minute before, the edge hasn't reached it: it's still on the lit side of the line.
      expect(wallSun(at(t - 1), r)?.x ?? W + 40).toBeGreaterThan(onRoute(r, 0)[0]);
    }
  });

  it('wets the rock in the rain and the day after, and never the gym', () => {
    let rain = 2;
    while (conditionsAt('sun', rain, 'road').open || conditionsAt('sun', rain + 1, 'road').open === false)
      rain++;
    expect(wetness(at(9 * 60, { day: rain }), 'road')).toBe('soaked');
    // And no sun through the rain.
    expect(sceneSun(at(16 * 60, { day: rain }), 'crag')).toBeNull();
    expect(wetness(at(9 * 60, { day: rain + 1 }), 'road')).toBe('seeping');
    expect(wetness(at(9 * 60, { day: rain }), 'gym')).toBeNull();
    expect(wetness(at(9 * 60), 'road')).toBeNull();
  });
});
