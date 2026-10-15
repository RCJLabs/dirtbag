// Phase 32.1: the Hollow, the crag nobody has a topo for. On no map and no road you know of
// till it's found; its lines all open projects, in sandstone, held to every line's rules.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { PLACES } from './content/places';
import { ROCK_LINES } from './content/rock';
import { ROUTES } from './content/routes';
import { routeById } from './content/gym';
import { readFileSync } from 'node:fs';
import { FOUND, GEAR_CLEANED, HITCH_ASK, NOT_FOUND, OLD_WORD, WALK_READY, BOOK_ROW } from './content/hollow';
import { STANCES } from './content/scene';
import { wallAt } from './content/gym';
import { boltBlocked, bolted } from './business';
import { HOLLOW, LAND } from './dials';
import { hitcherById, hitchOpts } from './events';
import { act, emptyLog, goBlocked, newGame, routeOfId, talkStart } from './game';
import { asking, bookBlocked, hardestOutside, hitchDue, known, oldWordDue, walkBlocked } from './hollow';
import { RAY_GONE } from './lives';
import { whereNow } from './presence';
import { fromSave, MIGRATIONS, validate } from './save';
import { stanceDue } from './scene';
import { aimEarned } from './record';
import type { GameState } from './types';

const n = needFor(10);
const strong = (over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('hollow'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  return {
    ...s,
    climber: { ...s.climber, skills: { power: n, fingers: n, endurance: n, technique: n, head: n } },
    at: 'gorge',
    min: 9 * 60,
    energy: 100,
    cash: 200,
    ...over,
  };
};
const lines = Object.values(ROUTES).filter((r) => r.place === 'hollow');

describe('the Hollow', () => {
  it('is on no road you know of till it’s found, however hard you climb', () => {
    const s = strong();
    expect(known(s, 'hollow')).toBe(false);
    expect(known(s, 'gorge')).toBe(true);
    const r = act(s, { t: 'travel', to: 'hollow' });
    expect(r.events.find((e) => e.k === 'refused')).toMatchObject({
      why: 'There’s no road there you know of.',
    });
    // And it isn't one of the crags a circuit asks for until it is.
    const everywhere = { ...s, unlocked: ['moon'] };
    expect(aimEarned(everywhere, { circuit: true })).toBe(false);
  });

  it('is a drive like any other once found', () => {
    const s = strong({ unlocked: ['hollow'] });
    expect(known(s, 'hollow')).toBe(true);
    const r = act(s, { t: 'travel', to: 'hollow' });
    expect(r.events.some((e) => e.k === 'refused')).toBe(false);
    expect(r.state.at).toBe('hollow');
  });

  it('is a shaded sandstone canyon with no crowd, and no way to buy your way in', () => {
    const p = PLACES.hollow!;
    expect(p).toMatchObject({ hidden: true, crag: true, rock: 'sandstone', shaded: true });
    expect(p.unlock).toBeUndefined();
    expect(p.crowd).toBeUndefined();
  });

  it('has boulders, cracks and faces, every one an open project, in its own rock', () => {
    expect(lines.map((r) => r.disc).sort()).toEqual([
      'boulder',
      'boulder',
      'boulder',
      'sport',
      'sport',
      'trad',
      'trad',
    ]);
    for (const r of lines) {
      expect(r.open).toBe(true);
      expect(routeById('hollow', r.id)?.id).toBe(r.id);
      expect(ROCK_LINES[r.id]?.length).toBe(r.cruxes.length);
    }
    expect(Math.min(...lines.map((r) => r.grade))).toBeGreaterThanOrEqual(PLACES.hollow!.minGrade!);
  });
});

// Phase 32.2: the quest. Three people each know a piece of the way, once you climb hard enough
// outside; with all three, the walk in from the Gorge.
const V70 = readFileSync(new URL('./fixtures/save-v70.json', import.meta.url), 'utf8');
const sentV9 = { gopen: { ...emptyLog(), goes: 4, sent: { day: 20, go: 4, style: 'redpoint' as const } } };
const asker = (over: Partial<GameState> = {}) => strong({ routes: sentV9, ...over });
const said = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');
const all3 = (over: Partial<GameState> = {}) =>
  asker({ hollow: { clues: ['old', 'hitch', 'book'], tries: 0 }, at: 'gorge', min: 8 * 60, ...over });

describe('the way to the Hollow', () => {
  it('is nobody’s to tell you till you’ve sent a hard line outside', () => {
    const weak = strong();
    expect(hardestOutside(weak)).toBe(-1);
    expect(asking(weak)).toBe(false);
    expect(oldWordDue(weak, 'ray')).toBe(false);
    expect(hitchDue(weak)).toBe(false);
    expect(bookBlocked({ ...weak, at: 'shop' })).not.toBeNull();
    const s = asker();
    expect(hardestOutside(s)).toBe(HOLLOW.from);
    expect(asking(s)).toBe(true);
    // A gym's V9 doesn't count: the old-timers want to see you on rock.
    expect(oldWordDue(s, 'ray')).toBe(true);
    expect(oldWordDue(s, 'frank')).toBe(false);
    expect(oldWordDue({ ...s, day: RAY_GONE }, 'frank')).toBe(true);
    expect(oldWordDue({ ...s, day: RAY_GONE }, 'ray')).toBe(false);
  });

  it('comes from Ray, at Roadside, once', () => {
    let s = asker({ people: { ray: { bond: 1, last: 1, talked: true } } });
    let d = 10;
    while (!(whereNow({ ...s, day: d, at: 'road', min: 10 * 60 }, 'ray') === 'road')) d++;
    s = { ...s, day: d, at: 'road', min: 10 * 60, x: null };
    expect(talkStart(s, 'ray')).toBe('hollow');
    const r = act(s, { t: 'say', talk: 'ray', node: 'hollow', opt: 0 });
    expect(refused(r)).toBe(false);
    expect(r.state.hollow.clues).toEqual(['old']);
    expect(talkStart(r.state, 'ray')).not.toBe('hollow');
    expect(OLD_WORD.ray!.text).not.toMatch(/\d/);
  });

  it('comes from the old hand on the road, asked about the canyon on his sign', () => {
    const s = asker();
    const h = hitcherById('oldhand')!;
    const opts = hitchOpts(s, h);
    const i = opts.findIndex((o) => o.label === HITCH_ASK.label);
    expect(i).toBe(h.opts.length);
    const r = act({ ...s, encounter: { kind: 'hitch', id: 'oldhand' } }, { t: 'answer', opt: i });
    expect(refused(r)).toBe(false);
    expect(said(r)).toContain(HITCH_ASK.out);
    expect(r.state.hollow.clues).toEqual(['hitch']);
    // Asked, he's done: the next time, his usual.
    expect(hitchOpts(r.state, h).some((o) => o.label === HITCH_ASK.label)).toBe(false);
    // And nobody else carries it.
    expect(hitchOpts(s, hitcherById('nurse')!).some((o) => o.label === HITCH_ASK.label)).toBe(false);
  });

  it('comes from the old guidebook at the shop, and the third says it’s enough', () => {
    const s = asker({ at: 'shop', hollow: { clues: ['old', 'hitch'], tries: 0 } });
    expect(refused(act({ ...s, at: 'cafe' }, { t: 'hollow', do: 'book' }))).toBe(true);
    const r = act(s, { t: 'hollow', do: 'book' });
    expect(refused(r)).toBe(false);
    expect(r.state.min).toBe(s.min + HOLLOW.book);
    expect(said(r).slice(0, 2)).toEqual([BOOK_ROW.says, WALK_READY]);
    expect(r.state.hollow.clues).toEqual(['old', 'hitch', 'book']);
    expect(bookBlocked(r.state)).not.toBeNull();
  });
});

describe('the walk in', () => {
  it('needs all three, at the Gorge, early and fresh', () => {
    expect(walkBlocked(asker({ at: 'gorge', hollow: { clues: ['old', 'book'], tries: 0 } }))).toMatch(
      /^2 of 3/,
    );
    expect(walkBlocked(all3({ at: 'road' }))).toMatch(/Gorge/);
    expect(walkBlocked(all3({ min: HOLLOW.walk.by }))).toMatch(/late/);
    expect(walkBlocked(all3({ energy: HOLLOW.walk.energy - 1 }))).toMatch(/tired/);
    expect(walkBlocked(all3())).toBeNull();
  });

  it('finds it the way the clues point: in the canyon, on the map, in the book', () => {
    let r = act(all3(), { t: 'hollow', do: 'walk' });
    expect(r.state.encounter).toMatchObject({ kind: 'epic', id: 'hollow', stage: 0 });
    for (const opt of [0, 2, 0]) r = act(r.state, { t: 'answer', opt });
    expect(said(r)).toContain(FOUND);
    expect(r.state.encounter).toBeNull();
    expect(r.state.at).toBe('hollow');
    expect(known(r.state, 'hollow')).toBe(true);
    expect(r.state.record.hollow).toBe(r.state.day);
    expect(walkBlocked(r.state)).toMatch(/know the way/);
  });

  it('walks you back out, unhurt, on a bad day, the clues still good', () => {
    let r = act(all3(), { t: 'hollow', do: 'walk' });
    for (const opt of [1, 0, 2]) r = act(r.state, { t: 'answer', opt });
    expect(said(r)).toContain(NOT_FOUND);
    expect(r.state.at).toBe('gorge');
    expect(r.state.injury).toBeNull();
    expect(r.state.hollow).toEqual({ clues: ['old', 'hitch', 'book'], tries: 1 });
    expect(known(r.state, 'hollow')).toBe(false);
  });

  it('loads a real 0.999.65 save from before the quest with no clues and no walks', () => {
    const r = fromSave(V70);
    if (!r.ok) throw new Error(r.why);
    expect(r.from).toBe(70);
    expect(r.state.hollow).toEqual({ clues: [], tries: 0 });
    const old = JSON.parse(V70).state;
    expect(r.state).toEqual({
      ...old,
      hollow: { clues: [], tries: 0 },
      boltedCracks: [],
      firsts: (MIGRATIONS[72]!(old) as GameState).firsts,
      deck: (MIGRATIONS[73]!(old) as GameState).deck,
    });
  });
});

// Phase 32.3: first ascents there. A boulder's cleaned and a face bolted; a crack's cleaned for
// gear or bolted, your call (Evan's), and the scene hears about it.
const V71 = readFileSync(new URL('./fixtures/save-v71.json', import.meta.url), 'utf8');
const there = (over: Partial<GameState> = {}) =>
  strong({ unlocked: ['hollow'], at: 'hollow', cash: 500, ...over });
const prep = (s: GameState, route: string, how?: 'gear' | 'bolts') =>
  act(s, { t: 'bolt', route, ...(how ? { how } : {}) });
const RACK = 'You need a rack to lead this. The gear shop sells them';

describe('first ascents in the Hollow', () => {
  it('can’t be climbed till somebody’s been up there with a brush, a rack or a drill', () => {
    const s = there();
    for (const r of lines) expect(bolted(s, r)).toBe(false);
    expect(goBlocked(s, ROUTES.hsplit!)).toBe('Nobody’s been up it. Clean it for gear or bolt it first');
    expect(goBlocked(s, ROUTES.hwall!)).toMatch(/^Nobody’s bolted it/);
    expect(goBlocked(s, ROUTES.hcrow!)).toMatch(/^Nobody’s cleaned it/);
    // Nobody owns it: there's no land to buy, only the way in to find.
    expect(boltBlocked(s, ROUTES.hsplit!)).toBeNull();
    expect(boltBlocked({ ...s, at: 'gorge' }, ROUTES.hsplit!)).toMatch(/Hollow/);
  });

  it('cleans a boulder quietly, and bolts a face, which the gym crowd likes', () => {
    const s = there();
    const b = prep(s, 'hcrow');
    expect(refused(b)).toBe(false);
    expect(b.state.cash).toBe(s.cash - LAND.clean.cash);
    expect(b.state.min).toBe(s.min + LAND.clean.min);
    expect(b.state.scene).toEqual(s.scene);
    expect(bolted(b.state, ROUTES.hcrow!)).toBe(true);
    const f = prep(s, 'hwall');
    expect(f.state.cash).toBe(s.cash - LAND.bolt.cash);
    expect(f.state.scene).toMatchObject({ old: s.scene.old, gym: s.scene.gym + HOLLOW.scene.bolt.gym });
    expect(f.state.boltedCracks).toEqual([]);
    // Cleaning's free: in debt, you can still do it; bolts you can't.
    expect(refused(prep({ ...s, cash: -20 }, 'hcrow'))).toBe(false);
    expect(refused(prep({ ...s, cash: -20 }, 'hwall'))).toBe(true);
    // A face takes bolts, whatever you'd rather.
    expect(prep(s, 'hwall', 'gear').state.cash).toBe(s.cash - LAND.bolt.cash);
  });

  it('cleans a crack for gear unless you say otherwise, and the old guard nods; it wants a rack', () => {
    const s = there();
    const g = prep(s, 'hsplit');
    expect(refused(g)).toBe(false);
    expect(said(g)).toContain(GEAR_CLEANED.replace('{line}', ROUTES.hsplit!.name));
    expect(g.state.cash).toBe(s.cash - LAND.clean.cash);
    expect(g.state.scene).toMatchObject({ old: s.scene.old + HOLLOW.scene.gear.old, gym: s.scene.gym });
    expect(g.state.boltedCracks).toEqual([]);
    expect(routeOfId(g.state, 'hsplit')?.disc).toBe('trad');
    expect(wallAt(g.state, 'hollow').find((r) => r.id === 'hsplit')?.disc).toBe('trad');
    expect(refused(prep({ ...g.state, energy: 100 }, 'hsplit', 'bolts'))).toBe(true);
  });

  it('bolts a crack if you’d rather: the gym crowd’s pleased, the old guard isn’t, and it climbs as sport', () => {
    const s = there();
    const b = prep(s, 'hcorner', 'bolts');
    expect(refused(b)).toBe(false);
    expect(b.state.cash).toBe(s.cash - LAND.bolt.cash);
    expect(b.state.scene).toMatchObject({
      old: s.scene.old + HOLLOW.scene.crack.old,
      gym: s.scene.gym + HOLLOW.scene.crack.gym,
    });
    expect(b.state.boltedCracks).toEqual(['hcorner']);
    const r = routeOfId(b.state, 'hcorner')!;
    expect(r).toMatchObject({ disc: 'sport', grade: ROUTES.hcorner!.grade, moves: ROUTES.hcorner!.moves });
    expect(r.bolts.length).toBeGreaterThan(0);
    expect(r.stances).toBeUndefined();
    expect(wallAt(b.state, 'hollow').find((x) => x.id === 'hcorner')).toEqual(r);
    // The topo still calls it a crack.
    expect(ROUTES.hcorner!.disc).toBe('trad');
    // On a dry day, the crack left for gear wants a rack; the bolted one doesn't.
    const both = prep({ ...b.state, energy: 100, min: 9 * 60 }, 'hsplit').state;
    let d = both.day;
    while (goBlocked({ ...both, day: d }, routeOfId(both, 'hsplit')!) !== RACK) d++;
    expect(goBlocked({ ...both, day: d }, routeOfId(both, 'hcorner')!)).not.toBe(RACK);
  });

  it('has the fire argue a bolted crack before anything else, and only then', () => {
    const b = prep(there(), 'hcorner', 'bolts').state;
    let d = b.day;
    while (!stanceDue({ ...b, day: d }, 'hollow')) d++;
    expect(stanceDue({ ...b, day: d }, 'hollow')).toBe('hollowbolts');
    const none = { ...b, boltedCracks: [] };
    for (let i = 0; i < 300; i++) expect(stanceDue({ ...none, day: d + i }, 'gorge')).not.toBe('hollowbolts');
    // Keep them, and they stay; pull them, and it goes on gear, still yours to climb.
    const asked = { ...b, day: d, encounter: { kind: 'stance' as const, id: 'hollowbolts' } };
    expect(act(asked, { t: 'answer', opt: 0 }).state.boltedCracks).toEqual(['hcorner']);
    const pulled = act(asked, { t: 'answer', opt: 1 });
    expect(pulled.state.boltedCracks).toEqual([]);
    expect(pulled.state.bolted).toContain('hcorner');
    expect(routeOfId(pulled.state, 'hcorner')?.disc).toBe('trad');
    expect(pulled.state.scene.old).toBe(b.scene.old + STANCES.hollowbolts!.opts[1]!.fx.old!);
    for (const t of [GEAR_CLEANED, STANCES.hollowbolts!.sit, ...STANCES.hollowbolts!.opts.map((o) => o.out)])
      expect(t).not.toMatch(/\d/);
  });

  it('won’t load bolts in a crack nobody prepared, or a face counted as a crack', () => {
    const s = prep(there(), 'hcorner', 'bolts').state;
    expect(validate(s)).toEqual([]);
    expect(validate({ ...s, boltedCracks: ['hsplit'] })).toContain('boltedCracks');
    expect(validate({ ...s, bolted: [...s.bolted, 'hwall'], boltedCracks: ['hcorner', 'hwall'] })).toContain(
      'boltedCracks',
    );
  });

  it('loads a real 0.999.67 save from before, with nothing bolted in the Hollow', () => {
    const r = fromSave(V71);
    if (!r.ok) throw new Error(r.why);
    expect(r.from).toBe(71);
    const old = JSON.parse(V71).state;
    expect(r.state).toEqual({
      ...old,
      boltedCracks: [],
      firsts: (MIGRATIONS[72]!(old) as GameState).firsts,
      deck: (MIGRATIONS[73]!(old) as GameState).deck,
    });
  });
});
