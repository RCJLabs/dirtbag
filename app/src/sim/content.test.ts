// Content is data, so nothing but these checks stops a typo in an id from shipping. Every
// reference resolves, routes are physically sane, and every talk node is reachable.
import { describe, expect, it } from 'vitest';
import { ACTS, PLACES, ROADS } from './content/places';
import { PEOPLE, TALK, THINGS } from './content/people';
import { ROUTES } from './content/routes';

describe('content', () => {
  it('places list real acts, and roads join real places', () => {
    for (const p of Object.values(PLACES)) for (const a of p.acts) expect(ACTS, a).toHaveProperty([a]);
    for (const r of ROADS) {
      expect(PLACES).toHaveProperty([r.a]);
      expect(PLACES).toHaveProperty([r.b]);
    }
  });

  it('routes are climbable in order, and every beta is defined', () => {
    for (const [id, r] of Object.entries(ROUTES)) {
      if (!r.cruxes.length) {
        expect(r.blurb, id).toBeTruthy();
        continue;
      }
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
      if (r.rest) expect(r.rest.at).toBeLessThan(r.moves);
      for (const b of Object.values(r.beta)) if (b.verb === 'tension') expect(b.rate && b.need).toBeTruthy();
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
    for (const t of Object.values(THINGS)) if (t.nightAct) expect(ACTS).toHaveProperty([t.nightAct]);
  });
});
