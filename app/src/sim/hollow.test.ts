// Phase 32.1: the Hollow, the crag nobody has a topo for. On no map and no road you know of
// till it's found; its lines all open projects, in sandstone, held to every line's rules.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { PLACES } from './content/places';
import { ROCK_LINES } from './content/rock';
import { ROUTES } from './content/routes';
import { routeById } from './content/gym';
import { readFileSync } from 'node:fs';
import { FOUND, HITCH_ASK, NOT_FOUND, OLD_WORD, WALK_READY, BOOK_ROW } from './content/hollow';
import { HOLLOW } from './dials';
import { hitcherById, hitchOpts } from './events';
import { act, emptyLog, newGame, talkStart } from './game';
import { asking, bookBlocked, hardestOutside, hitchDue, known, oldWordDue, walkBlocked } from './hollow';
import { RAY_GONE } from './lives';
import { whereNow } from './presence';
import { fromSave } from './save';
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
    expect(r.state).toEqual({ ...JSON.parse(V70).state, hollow: { clues: [], tries: 0 } });
  });
});
