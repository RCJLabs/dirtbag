// Phase 37: the session. Who's on a problem with you, the rounds, falls adding up to a find
// once a session, sharing and keeping and what each pays, watching, the day's first send, and
// the save.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { wallAt } from './content/gym';
import { LOCALS, SESH_CAST, SESH_SAYS } from './content/sesh';
import { crowdNow } from './crowds';
import { SESH } from './dials';
import { act, newGame, routeOfId } from './game';
import { whereNow } from './presence';
import { psycheDay } from './psyche';
import { fromSave, toSave } from './save';
import { hiddenMoves, pendingFind, seatChance, seatsFor } from './sesh';
import { conditionsAt } from './weather';
import type { Action, GameState, GoResult } from './types';

const V79 = readFileSync(new URL('./fixtures/save-v79.json', import.meta.url), 'utf8');
// Roadside's sport route, The Pump: no session on a rope.
const ROPE = 'pump';
// A strong enough climber (the fixture's, 200 days in) at Roadside at ten in the morning,
// with Dex and Sage met; `busy` finds a day whose crowd makes a session.
const fixture = (): GameState => {
  const r = fromSave(V79);
  if (!r.ok) throw new Error(r.why);
  return r.state;
};
const at = (day: number, over: Partial<GameState> = {}): GameState => ({
  ...fixture(),
  day,
  at: 'road',
  x: null,
  min: 10 * 60,
  energy: 100,
  skin: 100,
  today: ['crag'],
  encounter: null,
  table: null,
  cards: null,
  sesh: null,
  seshFirsts: 0,
  injury: null,
  flare: null,
  routes: {},
  ...over,
});
const busy = (want: (s: GameState) => boolean = () => true): GameState => {
  for (let d = 30; d < 600; d++) {
    const s = at(d);
    const c = crowdNow(s, 'road');
    const sky = conditionsAt(s.seed, d, 'road');
    if ((c === 'busy' || c === 'packed') && sky.open && !sky.closed && want(s)) return s;
  }
  throw new Error('no busy day at Roadside');
};
const run = (s: GameState, a: Action) => act(s, a);
const refused = (r: ReturnType<typeof act>) => r.events[0]?.k === 'refused';
const fell = (crux: string, hi = 2): GoResult => ({ sent: false, hi, fellAt: crux, tried: [], skin: 0 });
const SENT: GoResult = { sent: true, hi: 99, fellAt: null, tried: [], skin: 0 };
// A go on the session's problem, and how it ended.
const go = (s: GameState, route: string, res: GoResult): GameState => {
  const g = run(s, { t: 'go', route });
  if (refused(g)) throw new Error(`go refused: ${JSON.stringify(g.events[0])}`);
  return run(g.state, {
    t: 'done',
    route,
    result: { ...res, hi: Math.min(res.hi, routeOfId(s, route)!.moves) },
  }).state;
};
const join = (s: GameState, route: string) => {
  const r = run(s, { t: 'sesh', do: 'join', route });
  if (refused(r)) throw new Error(`join refused: ${JSON.stringify(r.events[0])}`);
  return r.state;
};

describe('the session', () => {
  it('seats the cast here who boulder, then nameless locals to make the crowd’s number', () => {
    const s = busy();
    const r = routeOfId(s, 'crimpfest')!;
    const seats = seatsFor(s, r);
    const n = SESH.seats[crowdNow(s, 'road') === 'packed' ? 'packed' : 'busy'];
    expect(seats).toHaveLength(n);
    const cast = SESH.cast.filter((w) => s.people[w] && whereNow(s, w) === 'road');
    expect(seats.slice(0, cast.length).map((p) => p.who)).toEqual(cast.slice(0, n));
    for (const p of seats.slice(cast.length)) {
      expect(p.who).toMatch(/^local-\d+$/);
      expect(p.grade).toBeGreaterThanOrEqual(r.grade + SESH.spread[0]! - 1);
      expect(p.grade).toBeLessThanOrEqual((r.trueGrade ?? r.grade) + SESH.spread[1]!);
    }
    expect(new Set(seats.map((p) => p.who)).size).toBe(seats.length);
    // The same day draws the same people.
    expect(seatsFor(s, r)).toEqual(seats);
  });

  it('is on a boulder outside, on a busy day, by day, once a day, on a problem you haven’t sent', () => {
    const s = busy();
    expect(refused(run(s, { t: 'sesh', do: 'join', route: 'crimpfest' }))).toBe(false);
    // A rope, a quiet day, dark, sent, the gym.
    expect(routeOfId(s, ROPE)!.disc).not.toBe('boulder');
    expect(refused(run(s, { t: 'sesh', do: 'join', route: ROPE }))).toBe(true);
    const quiet = (() => {
      for (let d = 30; d < 600; d++) {
        const q = at(d);
        if (crowdNow(q, 'road') === 'quiet' && conditionsAt(q.seed, d, 'road').open) return q;
      }
      throw new Error('no quiet day');
    })();
    expect(refused(run(quiet, { t: 'sesh', do: 'join', route: 'crimpfest' }))).toBe(true);
    expect(refused(run({ ...s, min: 20 * 60 }, { t: 'sesh', do: 'join', route: 'crimpfest' }))).toBe(true);
    const sent = { ...s, routes: { crimpfest: { ...go(s, 'crimpfest', SENT).routes.crimpfest! } } };
    expect(refused(run(sent, { t: 'sesh', do: 'join', route: 'crimpfest' }))).toBe(true);
    const gym = { ...s, at: 'gym', today: ['pass'] };
    const plastic = wallAt(gym, 'gym')[0]!.id;
    expect(routeOfId(gym, plastic)!.disc).toBe('boulder');
    expect(refused(run(gym, { t: 'sesh', do: 'join', route: plastic }))).toBe(true);
    // Once a day: walked away from, it doesn't start again.
    const left = run(join(s, 'crimpfest'), { t: 'sesh', do: 'leave' }).state;
    expect(left.sesh).toBeNull();
    expect(refused(run(left, { t: 'sesh', do: 'join', route: 'warm' }))).toBe(true);
  });

  it('adds everyone’s falls up to a find, once a session, and a local shares it or keeps it', () => {
    const s = busy();
    const r = routeOfId(s, 'crimpfest')!;
    const move = hiddenMoves(r)[0]!;
    const crux = r.cruxes.find((c) => c.beta.includes(move))!.id;
    let x = join(s, 'crimpfest');
    // Sat out until one of them turns it up.
    for (let i = 0; i < 12 && !x.sesh!.found.length; i++) x = run(x, { t: 'sesh', do: 'wait' }).state;
    const f = x.sesh!.found[0]!;
    expect(f.beta).toBe(move);
    expect(f.by).not.toBe('you');
    expect(x.sesh!.falls[crux]).toBeGreaterThanOrEqual(r.beta[move]!.unlock!.falls);
    const finder = x.sesh!.seats.find((p) => p.who === f.by)!;
    expect(f.shared).toBe(finder.shares);
    const others = x.sesh!.seats.filter((p) => p !== finder);
    if (f.shared) {
      expect(others.every((p) => p.knows.includes(move))).toBe(true);
      expect(x.routes.crimpfest!.told).toContain(move);
    } else {
      expect(others.some((p) => p.knows.includes(move))).toBe(false);
      expect(x.routes.crimpfest?.known ?? []).not.toContain(move);
    }
    // Found once: more falls there turn up nothing more.
    for (let i = 0; i < 4; i++) x = run(x, { t: 'sesh', do: 'wait' }).state;
    expect(x.sesh!.found.filter((g) => g.beta === move)).toHaveLength(1);
  });

  it('puts a move you turn up to you: share it for bond and the old guard, or keep it for nothing now', () => {
    const s = busy((q) => !!q.people.dex && whereNow(q, 'dex') === 'road');
    const r = routeOfId(s, 'crimpfest')!;
    const move = hiddenMoves(r)[0]!;
    const crux = r.cruxes.find((c) => c.beta.includes(move))!.id;
    const x = go(join(s, 'crimpfest'), 'crimpfest', fell(crux));
    expect(pendingFind(x.sesh!)).toBe(move);
    expect(x.routes.crimpfest!.known).toContain(move);
    // Nothing more till you answer.
    expect(refused(run(x, { t: 'go', route: 'crimpfest' }))).toBe(true);
    expect(refused(run(x, { t: 'sesh', do: 'wait' }))).toBe(true);
    // Sharing: everyone has it, the cast here a bond more than the day together gave, and
    // the old guard thinks better of you.
    const dex = x.people.dex!.bond;
    const shared = run(x, { t: 'sesh', do: 'share' }).state;
    expect(shared.sesh!.seats.every((p) => p.knows.includes(move))).toBe(true);
    expect(shared.people.dex!.bond).toBe(dex + SESH.share.bond);
    expect(shared.scene.old).toBe(Math.min(100, x.scene.old + SESH.share.old));
    expect(shared.sesh!.said[0]).toMatch(/You tell them/);
    // Keeping: nobody else has it, and nothing changes but what they don't know.
    const kept = run(x, { t: 'sesh', do: 'keep' }).state;
    expect(kept.sesh!.seats.some((p) => p.knows.includes(move))).toBe(false);
    expect(kept.people.dex!.bond).toBe(dex);
    expect(kept.scene).toEqual(x.scene);
    expect(pendingFind(kept.sesh!)).toBeNull();
  });

  it('asks about the moves you bring to it, from another day', () => {
    const s = busy();
    const r = routeOfId(s, 'crimpfest')!;
    const move = hiddenMoves(r)[0]!;
    const known = {
      ...s,
      routes: { crimpfest: { ...go(s, 'crimpfest', fell('A')).routes.crimpfest!, known: [move] } },
    };
    const x = join({ ...known, today: ['crag'] }, 'crimpfest');
    expect(pendingFind(x.sesh!)).toBe(move);
    expect(x.sesh!.said.join(' ')).toMatch(/You already know/);
  });

  it('costs you the onsight to watch a round first, not the flash', () => {
    const s = busy();
    const x = run(join(s, 'crimpfest'), { t: 'sesh', do: 'wait' }).state;
    expect(x.routes.crimpfest!.told.length).toBeGreaterThan(0);
    expect(x.min).toBe(s.min + SESH.round);
    const up = go(x, 'crimpfest', SENT);
    expect(up.routes.crimpfest!.sent!.style).toBe('flash');
    // Straight in, it's still on.
    const cold = go(join(s, 'crimpfest'), 'crimpfest', SENT);
    expect(cold.routes.crimpfest!.sent!.style).toBe('onsight');
  });

  it('pays the day’s first send in psyche, the old guard and the Record Book, and ends your session', () => {
    const s = busy();
    const x = join(s, 'crimpfest');
    const up = go(x, 'crimpfest', SENT);
    expect(up.sesh).toBeNull();
    expect(up.seshFirsts).toBe(1);
    expect(up.scene.old).toBe(Math.min(100, x.scene.old + SESH.first.old));
    expect(up.today).toContain('sesh-first');
    expect(psycheDay(up).up).toContain('first to the top');
    expect(up.record.firstup).toBe(up.day);
    expect(x.record.firstup).toBeUndefined();
  });

  it('lets a local send first, and pays you nothing for second', () => {
    const s = busy();
    let x = join(s, 'crimpfest');
    for (let i = 0; i < 30 && !x.sesh?.first; i++) x = run(x, { t: 'sesh', do: 'wait' }).state;
    expect(x.sesh!.first).toMatch(/./);
    expect(x.sesh!.first).not.toBe('you');
    const old = x.scene.old;
    const up = go(x, 'crimpfest', SENT);
    expect(up.seshFirsts).toBe(0);
    expect(up.today).not.toContain('sesh-first');
    expect(up.scene.old).toBe(old);
  });

  it('gives them better odds with the move than without it', () => {
    const s = busy();
    const r = routeOfId(s, 'crimpfest')!;
    const p = { who: 'local-0', grade: r.grade, knows: [] as string[], sent: false, shares: true };
    expect(seatChance({ ...p, knows: hiddenMoves(r) }, r)).toBeGreaterThan(seatChance(p, r));
  });

  it('runs their round after each go of yours that doesn’t go, and ends with the day', () => {
    const s = busy();
    const x = join(s, 'crimpfest');
    const after = go(x, 'crimpfest', fell('A', 1));
    expect(after.sesh!.round).toBe(1);
    expect(after.sesh!.said.length).toBeGreaterThan(0);
    const night = run({ ...after, at: 'lot', min: 21 * 60 }, { t: 'act', act: 'lot.sleep' }).state;
    expect(night.sesh).toBeNull();
  });

  it('saves a session on the go, refuses a broken one, and loads a v79 save with none', () => {
    const s = busy();
    const x = go(join(s, 'crimpfest'), 'crimpfest', fell('A', 1));
    const back = fromSave(toSave(x, 'test'));
    expect(back.ok && back.state.sesh).toEqual(x.sesh);
    const broken = JSON.parse(toSave(x, 'test'));
    broken.state.sesh.seats[0].knows = 'everything';
    expect(fromSave(JSON.stringify(broken)).ok).toBe(false);
    const old = fromSave(V79);
    expect(old.ok && old.from).toBe(79);
    expect(old.ok && old.state.sesh).toBeNull();
    expect(old.ok && old.state.seshFirsts).toBe(0);
  });
});

describe('the words', () => {
  it('types in no number, no straight quote, and only the blanks the session fills', () => {
    const blanks = /\{(who|crux|beta)\}/g;
    const cast = Object.values(SESH_CAST).flatMap((c) => [c.found, c.first]);
    for (const w of [...Object.values(SESH_SAYS), ...cast, ...LOCALS]) {
      expect(w.trim(), w).toBe(w);
      expect(w, w).not.toMatch(/\d|['"]|\s{2}/);
      expect(w.replace(blanks, ''), w).not.toMatch(/[{}]/);
    }
    // A local is pointed out, never named: each starts "the".
    for (const l of LOCALS) expect(l).toMatch(/^the /);
    // Whoever shares says the move; whoever keeps it doesn't.
    for (const c of Object.values(SESH_CAST)) expect(c.found.includes('{beta}')).toBe(c.shares);
  });
});

// The new game's own, for completeness: nothing on.
it('starts a climber with no session and none sent first', () => {
  const s = newGame('x');
  expect(s.sesh).toBeNull();
  expect(s.seshFirsts).toBe(0);
});
