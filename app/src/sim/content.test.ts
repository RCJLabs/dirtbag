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
import { LIBRARY, PITCH_KINDS, ROUTES, WALLS, type RouteDef } from './content/routes';
import { ROCK_LINES, ROCK_MOVES } from './content/rock';
import { CLASSICS, HIGHBALL } from './dials';
import { GEAR } from './content/gear';
import { HOLIDAY_SCENES, HOLIDAY_WITH, HOLIDAYS } from './content/folks';
import { KNOCKS } from './content/knocks';
import { HITCHERS, PASS_BY, STOPS } from './content/road';
import { NAME_IDEAS } from './content/origins';
import { ROSTER } from './content/comps';
import { MEDIA_RIVAL } from './content/media';
import { NAME_MAX } from './game';

const STYLES = Object.keys(MIX);
// The fixed lines, and the gym's first two months (the wall and the board) for two seeds.
const everyRoute: RouteDef[] = [
  ...Object.values(ROUTES),
  ...['a', 'b'].flatMap((seed) => [1, 2, 3, 4, 5, 6, 7, 8].flatMap((w) => gymSet(seed, w))),
  ...['a', 'b'].flatMap((seed) => [1, 2].flatMap((b) => boardSet(seed, b))),
];

describe('content', () => {
  it('makes every outdoor boulder from HIGHBALL.fromFt up a highball, and nothing else', () => {
    for (const r of Object.values(ROUTES)) {
      const tall = r.disc === 'boulder' && !r.dws && !r.board && r.heightFt >= HIGHBALL.fromFt;
      expect(!!r.highball, r.id).toBe(tall);
    }
    // v0.956's Highball Arête, and what the later crags brought.
    expect(
      ['highball', 'marete', 'gcathedral', 'wopen', 'chorizon'].every((id) => ROUTES[id]!.highball),
    ).toBe(true);
    expect(ROUTES.megg!.highball).toBeUndefined();
  });

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
        .filter((r) => r.place === 'road' && !r.wall)
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

  // Phase 39 (criterion 1): five classics a crag, hand-picked across its grades and kinds, from
  // lines there to be climbed; none at a crag whose every line is still waiting for its first.
  it('gives every crag its five classics, spread across its grades and kinds', () => {
    for (const [id, p] of Object.entries(PLACES)) {
      if (!p.crag) {
        expect(p.classics, id).toBeUndefined();
        continue;
      }
      const lines = Object.values(ROUTES).filter((r) => r.place === id && !r.wall);
      const climbed = lines.filter((r) => !r.open);
      if (!climbed.length) {
        expect(p.classics ?? [], id).toEqual([]);
        continue;
      }
      const picks = (p.classics ?? []).map((c) => ROUTES[c]);
      expect(picks, id).toHaveLength(CLASSICS.list);
      expect(new Set(p.classics).size, id).toBe(CLASSICS.list);
      for (const r of picks) {
        expect(r, id).toBeDefined();
        expect(r!.place, r!.id).toBe(id);
        expect(r!.open || r!.wall || r!.hiddenUntil, r!.id).toBeFalsy();
      }
      // Spread: the grades aren't all one, and where the crag has more than one kind of line,
      // the classics do too.
      expect(new Set(picks.map((r) => r!.grade)).size, id).toBeGreaterThan(2);
      const kinds = (rs: (RouteDef | undefined)[]) => new Set(rs.map((r) => r!.disc));
      if (kinds(climbed).size > 1) expect(kinds(picks).size, id).toBeGreaterThan(1);
      // A newcomer's first: the crag's easiest classic is within a grade of its easiest line.
      expect(Math.min(...picks.map((r) => r!.grade)), id).toBeLessThanOrEqual(
        Math.min(...climbed.map((r) => r.grade)) + 1,
      );
    }
  });

  it("a place that's shut to you says the grade that opens it", () => {
    for (const [id, p] of Object.entries(PLACES))
      if (p.minGrade !== undefined) expect(p.locked, id).toContain(`V${p.minGrade}`);
  });

  // Phase 27.2: the rock's beta.
  it('climbs every crag in its own rock: no crux at a crag starts the way another does', () => {
    const plastic = new Set(Object.values(LIBRARY).flatMap(([a, b]) => [a.name, b.name]));
    // Made by hand before the rock had moves of its own.
    const byHand = new Set(['warmup', 'roadside', 'pump']);
    for (const [id, p] of Object.entries(PLACES)) {
      if (!p.crag) continue;
      // A wall's pitches are the crag's too (Phase 27.3).
      const lines = Object.values(ROUTES).filter((r) => r.place === id);
      const firsts: string[] = [];
      const pairs: string[] = [];
      for (const r of lines) {
        if (!byHand.has(r.id)) expect(ROCK_LINES[r.id], r.id).toBeDefined();
        for (const c of r.cruxes) {
          const [a, b] = c.beta.map((k) => r.beta[k]!.name);
          expect(plastic.has(a!) || plastic.has(b!), `${r.id} ${c.id} is still plastic`).toBe(false);
          firsts.push(a!);
          pairs.push(`${a} / ${b}`);
        }
      }
      expect(new Set(firsts).size, `${id}: a first way through repeats`).toBe(firsts.length);
      expect(new Set(pairs).size, `${id}: a crux sequence repeats`).toBe(pairs.length);
    }
  });

  it('uses every move each rock has, and only at that rock’s crags', () => {
    const used = new Map<string, Set<string>>();
    for (const [id, cruxes] of Object.entries(ROCK_LINES)) {
      const rock = PLACES[ROUTES[id]!.place]!.rock!;
      for (const pair of cruxes)
        for (const m of pair) {
          expect(ROCK_MOVES[rock][m], `${id}: ${m} isn’t ${rock}`).toBeDefined();
          (used.get(rock) ?? used.set(rock, new Set()).get(rock)!).add(m);
        }
    }
    for (const [rock, moves] of Object.entries(ROCK_MOVES))
      expect(
        Object.keys(moves).filter((m) => !used.get(rock)?.has(m)),
        rock,
      ).toEqual([]);
  });

  // Phase 27.3: a wall's pitches by kind.
  it('climbs every wall in at least three kinds of pitch, each in its kind’s shape', () => {
    for (const [id, w] of Object.entries(WALLS)) {
      const kinds = new Set(w.pitches.map((p) => ROUTES[p]!.kind));
      expect(kinds.has(undefined), id).toBe(false);
      expect(kinds.size, id).toBeGreaterThanOrEqual(3);
      for (const p of w.pitches) {
        const r = ROUTES[p]!;
        const k = PITCH_KINDS[r.kind!];
        expect([r.moves, r.cruxes[0]!.from, r.rest?.at ?? null], p).toEqual([k.moves, k.from, k.rest]);
        // A rest is somewhere to rest: never in the crux, and before it.
        if (k.rest !== null) expect(k.rest, p).toBeLessThan(k.from - 1);
        expect(k.to, p).toBeLessThan(k.moves);
      }
    }
  });

  it('every sunny crag lists all its lines, once each, in the path the sun takes', () => {
    for (const [id, p] of Object.entries(PLACES)) {
      if (!p.crag || p.shaded) {
        expect(p.sun, id).toBeUndefined();
        continue;
      }
      // A wall's pitches take the sun with the wall, not a place on its path.
      const lines = Object.values(ROUTES)
        .filter((r) => r.place === id && !r.wall)
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

// Phase 34.3: the save checks gear against GEAR, so a piece of kit an act sells and GEAR doesn't
// know would quarantine the next save (the camera nearly did).
describe('the kit the acts give you', () => {
  it('is all kit the save knows', () => {
    for (const [id, a] of Object.entries(ACTS)) if (a.gear) expect(GEAR, id).toHaveProperty([a.gear.id]);
  });
});

// Phase 35: the road and the year. Each pool's own test checks what it added; this holds the
// whole of every pool, old lines and new, to the same rules, so a line added later can't slip by.
describe('the road and the year', () => {
  const knocks = KNOCKS.flatMap((k) => [
    k.title,
    k.sit,
    ...k.opts.flatMap((o) => [o.label, o.out]),
    ...(k.away ? [k.away.line] : []),
  ]);
  const hitchers = HITCHERS.flatMap((h) => [
    h.who,
    h.sign,
    h.look,
    h.pitch,
    h.again.open,
    ...[...h.opts, ...h.again.opts].flatMap((o) => [o.label, o.out]),
    ...(h.friend ? [h.friend] : []),
  ]);
  const stops = STOPS.flatMap((x) => [x.name, x.blurb, ...x.opts.flatMap((o) => [o.label, o.out])]);
  const holidays = [
    ...Object.values(HOLIDAYS).flatMap((h) => [h.name, h.text, h.alone]),
    ...Object.values(HOLIDAY_SCENES).flatMap((h) => [h.scene, ...h.opts.flatMap((o) => [o.label, o.out])]),
    ...Object.values(HOLIDAY_WITH),
  ];

  it('words every line with no number typed in, no straight quote, and only the blanks the game fills', () => {
    // The blanks: a knock at a friend's driveway names its host; the potluck names your dish.
    for (const [ts, blank] of [
      [knocks, '{who}'],
      [[...hitchers, PASS_BY.label, PASS_BY.out, ...stops], ''],
      [holidays, '{dish}'],
    ] as const)
      for (const t of ts) {
        expect(t.trim(), t).toBe(t);
        expect(t.length, t).toBeGreaterThan(0);
        expect(t, t).not.toMatch(/\d|['"]|\s{2}/);
        expect(blank ? t.replaceAll(blank, '') : t, t).not.toMatch(/[{}]/);
      }
  });

  it('resolves: one id each, answers that exist, a return for every knock that helps, people the cast knows', () => {
    for (const ids of [KNOCKS, HITCHERS, STOPS].map((xs) => xs.map((x) => x.id)))
      expect(new Set(ids).size).toBe(ids.length);
    for (const k of KNOCKS) {
      for (const i of k.helped ?? []) expect(k.opts[i], k.id).toBeTruthy();
      if (k.away) {
        expect(k.opts[k.away.opt], k.id).toBeTruthy();
        expect(k.helped ?? [], k.id).not.toContain(k.away.opt);
      }
      const back = k.id.match(/^back-(.+)$/)?.[1];
      if (back) expect(KNOCKS.find((x) => x.id === back)?.helped, k.id).toBeTruthy();
      else if (k.helped)
        expect(
          KNOCKS.some((x) => x.id === `back-${k.id}`),
          k.id,
        ).toBe(true);
    }
    for (const who of Object.keys(HOLIDAY_WITH)) expect(PEOPLE, who).toHaveProperty([who]);
  });
});

// Phase 14.1: the names the first screen offers a controller that can't type one.
describe('the names on offer', () => {
  it('are short enough to take, one each, and nobody you meet in the valley or across a comp', () => {
    const taken = new Set(
      [...Object.values(PEOPLE).map((p) => p.name), ...ROSTER.map((r) => r.name), MEDIA_RIVAL.name].map(
        (n) => n.split(' ')[0],
      ),
    );
    expect(new Set(NAME_IDEAS).size).toBe(NAME_IDEAS.length);
    for (const n of NAME_IDEAS) {
      expect(n.length, n).toBeLessThanOrEqual(NAME_MAX);
      expect(n, n).toMatch(/^[A-Z][a-z]+$/);
      expect(taken.has(n), n).toBe(false);
    }
  });
});
