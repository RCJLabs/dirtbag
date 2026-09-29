// The staging's side of "content is data": every crag line the rules know has one place on
// screen, in the scene of its crag, and every place has a pin on the map.
import { describe, expect, it } from 'vitest';
import { PLACES, ROUTES } from '../sim';
import { CRAGS, MAP_PINS, SCENES, widthOf } from './layout';

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
        expect(ROUTES[l.route], l.route).toMatchObject({ disc: 'sport', place });
        seen.push(l.route);
      }
    }
    expect(new Set(seen).size).toBe(seen.length);
    const crag = Object.values(ROUTES).filter((r) => r.place !== 'gym');
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

  it('pin every place on the map', () => {
    for (const id of Object.keys(PLACES)) expect(MAP_PINS[id], id).toBeDefined();
    for (const s of Object.values(SCENES)) expect(PLACES[s.place], s.place).toBeDefined();
  });
});
