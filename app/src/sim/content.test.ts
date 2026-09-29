// Content is data, so nothing but these checks stops a typo in an id from shipping. Every
// reference resolves, routes are physically sane, and every talk node is reachable.
import { describe, expect, it } from 'vitest';
import { MIX } from './climber';
import {
  gymSet,
  routeById,
  routesAt,
  weekOf,
  boardSet,
  blockOf,
  BOARD_WEEKS,
  WEEK_DAYS,
} from './content/gym';
import { ACTS, PLACES, road, ROADS, TEXT_VALUES } from './content/places';
import { fill } from './format';
import { PEOPLE, TALK, THINGS } from './content/people';
import { ROUTES, type RouteDef } from './content/routes';

const STYLES = Object.keys(MIX);
// The fixed lines, and the gym's first two months (the wall and the board) for two seeds.
const everyRoute: RouteDef[] = [
  ...Object.values(ROUTES),
  ...['a', 'b'].flatMap((seed) => [1, 2, 3, 4, 5, 6, 7, 8].flatMap((w) => gymSet(seed, w))),
  ...['a', 'b'].flatMap((seed) => [1, 2].flatMap((b) => boardSet(seed, b))),
];

describe('content', () => {
  it('places list real acts, and each act belongs to a place', () => {
    for (const p of Object.values(PLACES)) for (const a of p.acts) expect(ACTS, a).toHaveProperty([a]);
    for (const id of Object.keys(ACTS)) expect(PLACES, id).toHaveProperty([id.split('.')[0]!]);
  });

  it('joins every place to every other by road, with no road going to waste', () => {
    const ids = Object.keys(PLACES);
    const seen = new Set<string>();
    for (const r of ROADS) {
      expect(PLACES, r.a).toHaveProperty([r.a]);
      expect(PLACES, r.b).toHaveProperty([r.b]);
      const k = [r.a, r.b].sort().join('-');
      expect(r.a, k).not.toBe(r.b);
      expect(seen.has(k), `two roads ${k}`).toBe(false);
      seen.add(k);
      // Each road is the quickest way between its own ends: one that isn't, nobody drives.
      expect(road(r.a, r.b), k).toMatchObject({ min: r.min, cash: r.cash });
    }
    for (const a of ids)
      for (const b of ids) {
        if (a === b) continue;
        const there = road(a, b);
        expect(there, `${a} to ${b}`).toBeDefined();
        expect(road(b, a), `${b} to ${a}`).toMatchObject({ min: there!.min, cash: there!.cash });
      }
  });

  it("keeps v0.956's drives from the Lot, the far crags by way of Roadside", () => {
    expect(road('lot', 'road')).toEqual({ min: 60, cash: 12, via: [] });
    expect(road('lot', 'gorge')).toEqual({ min: 120, cash: 22, via: ['road'] });
    expect(road('lot', 'moon')).toEqual({ min: 180, cash: 30, via: ['road'] });
    expect(road('lot', 'lot')).toBeUndefined();
  });

  it('routes are climbable in order, and every beta is defined and styled', () => {
    for (const r of everyRoute) {
      const id = r.id;
      expect(routeById('a', id) ?? routeById('b', id), id).toBeDefined();
      expect(r.grade).toBeGreaterThanOrEqual(0);
      expect(r.grade).toBeLessThanOrEqual(18);
      expect(STYLES).toContain(r.type);
      expect(PLACES).toHaveProperty([r.place]);
      expect(r.cruxes.length, id).toBeGreaterThan(0);
      let last = 0;
      for (const c of r.cruxes) {
        expect(c.from, `${id}/${c.id}`).toBeGreaterThanOrEqual(last);
        expect(c.to).toBeGreaterThan(c.from);
        expect(c.to).toBeLessThan(r.moves);
        last = c.to;
        expect(c.beta.length).toBeGreaterThan(0);
        for (const b of c.beta) expect(r.beta, `${id}/${b}`).toHaveProperty([b]);
        // The obvious sequence is always known, so it can't be locked.
        expect(r.beta[c.beta[0]!]!.unlock).toBeUndefined();
      }
      expect([...r.bolts].sort((a, b) => a - b)).toEqual(r.bolts);
      // Ropes have clips; boulders land on pads.
      if (r.disc === 'sport') expect(r.bolts.length, id).toBeGreaterThan(2);
      else expect(r.bolts, id).toEqual([]);
      if (r.rest) expect(r.rest.at).toBeLessThan(r.moves);
      for (const b of Object.values(r.beta)) {
        expect(STYLES).toContain(b.style);
        if (b.verb === 'tension') expect(b.rate && b.need).toBeTruthy();
      }
    }
  });

  it('Send City sets six problems a week, V0 to V5, the same for the same seed', () => {
    const w1 = gymSet('a', 1);
    expect(w1.map((r) => r.grade)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(w1.every((r) => r.place === 'gym' && r.disc === 'boulder')).toBe(true);
    expect(new Set(w1.map((r) => r.name)).size).toBe(6);
    expect(gymSet('a', 1)).toBe(w1);
    expect(gymSet('a', 2).map((r) => r.name)).not.toEqual(w1.map((r) => r.name));
    // The gym's lines are the week's wall, then the board.
    expect(routesAt('a', 'gym', 7).slice(0, 6)).toEqual(w1);
    expect(routesAt('a', 'gym', 8).slice(0, 6)).toEqual(gymSet('a', 2));
    expect(weekOf(1)).toBe(1);
    expect(weekOf(8)).toBe(2);
    expect(routesAt('a', 'road', 1).map((r) => r.id)).toEqual(
      Object.values(ROUTES)
        .filter((r) => r.place === 'road')
        .map((r) => r.id),
    );
    expect(routeById('a', 'sc-99-7')).toBeUndefined();
    expect(routeById('a', 'nope')).toBeUndefined();
  });

  it('the board sets four hard problems, V4 to V7, that stay up four weeks', () => {
    const b1 = boardSet('a', 1);
    expect(b1.map((r) => r.grade)).toEqual([4, 5, 6, 7]);
    // And they climb a grade stiff, as boards do.
    expect(b1.map((r) => r.trueGrade)).toEqual([5, 6, 7, 8]);
    expect(b1.every((r) => r.board && r.place === 'gym' && r.disc === 'boulder')).toBe(true);
    expect(new Set(b1.map((r) => r.name)).size).toBe(4);
    // Up from the first morning to the last day of the fourth week, then reset.
    const lastDay = WEEK_DAYS * BOARD_WEEKS;
    expect(blockOf(1)).toBe(1);
    expect(blockOf(lastDay)).toBe(1);
    expect(blockOf(lastDay + 1)).toBe(2);
    expect(routesAt('a', 'gym', 1).slice(6)).toEqual(b1);
    expect(routesAt('a', 'gym', lastDay).slice(6)).toEqual(b1);
    expect(boardSet('a', 2).map((r) => r.name)).not.toEqual(b1.map((r) => r.name));
    // An old problem still resolves, for its log.
    expect(routeById('a', 'bd-1-3')).toBe(b1[2]);
    expect(routeById('a', 'bd-1-9')).toBeUndefined();
    expect(b1[0]!.line).toContain(`${BOARD_WEEKS} weeks`);
  });

  it('place cards fill every number they mention from the data', () => {
    for (const [id, p] of Object.entries(PLACES))
      for (const text of [p.away, p.here])
        expect(fill(text, { ...TEXT_VALUES, lines: 1 }), id).not.toMatch(/\{/);
  });

  it("a place that's shut to you says the grade that opens it", () => {
    for (const [id, p] of Object.entries(PLACES))
      if (p.minGrade !== undefined) expect(p.locked, id).toContain(`V${p.minGrade}`);
  });

  it('every sunny crag lists all its lines, once each, in the path the sun takes', () => {
    for (const [id, p] of Object.entries(PLACES)) {
      if (!p.crag || p.shaded) {
        expect(p.sun, id).toBeUndefined();
        continue;
      }
      const lines = Object.values(ROUTES)
        .filter((r) => r.place === id)
        .map((r) => r.id);
      expect([...(p.sun ?? [])].sort(), id).toEqual(lines.sort());
    }
  });

  it('talk resolves: people, nodes, acts and beta', () => {
    for (const [id, t] of Object.entries(TALK)) {
      expect(PEOPLE, id).toHaveProperty([t.who]);
      const reached = new Set(t.start.map((s) => s.node));
      for (const n of reached) expect(t.nodes, `${id}/${n}`).toHaveProperty([n]);
      for (const node of Object.values(t.nodes)) {
        for (const o of node.opts) {
          if (o.next) {
            expect(t.nodes, `${id} -> ${o.next}`).toHaveProperty([o.next]);
            reached.add(o.next);
          }
          if (o.fx?.act) expect(ACTS).toHaveProperty([o.fx.act]);
          if (o.fx?.learn) {
            const [route, beta] = o.fx.learn.split('/');
            expect(ROUTES[route!]?.beta, o.fx.learn).toHaveProperty([beta!]);
          }
        }
      }
      expect([...reached].sort(), `${id}: unreachable nodes`).toEqual(Object.keys(t.nodes).sort());
    }
    for (const t of Object.values(THINGS)) {
      if (t.nightAct) expect(ACTS).toHaveProperty([t.nightAct]);
      if (t.away) expect(PEOPLE).toHaveProperty([t.away.who]);
    }
    for (const p of Object.values(PEOPLE))
      for (const at of p.shows ?? []) expect(PLACES).toHaveProperty([at]);
  });
});
