// Phase 44.2: the set stays up. A set hung on a shift goes up on the panel under its name, its
// id carrying it: a problem like the gym's own till the week's reset, found by its id
// anywhere, climbable, and down with the week. A new set takes its place, your own wall's set
// goes up too, and a save from before has nothing up.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { setUpNow, stillUp, wallAt, routeById } from './content/gym';
import { JOBS } from './content/jobs';
import { SET_MOVES } from './content/setting';
import { OWN_GYM, SETTING } from './dials';
import { act, lineName, newGame } from './game';
import { fromSave } from './save';
import { setGrade, setMoves, type Cell } from './setpanel';
import { setBrief } from './work';
import { setId, setNameIdeas, setNameOf, setOf, setRoute } from './yourset';
import type { GameState, GoResult } from './types';

const V82 = readFileSync(new URL('./fixtures/save-v82.json', import.meta.url), 'utf8');
const strong = { power: 400, fingers: 400, endurance: 400, technique: 400, head: 400 };
const base = (over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('yourset'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  return {
    ...s,
    at: 'gym',
    min: 8 * 60,
    energy: 100,
    climber: { ...s.climber, skills: strong },
    shifts: [{ job: 'set', day: 1 }],
    ...over,
  };
};
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const cells: Cell[] = [
  [0, 0],
  [1, 1],
  [3, 3],
  [3, 4],
  [2, 6],
];
// Hung on the day's shift, from the day's bucket.
function hang(s: GameState, name?: string) {
  const set = setBrief(s).hand.slice(0, SETTING.pick);
  return { set, r: act(s, { t: 'act', act: 'gym.set', play: { set, at: cells, name } }) };
}

describe('Phase 44.2: a set in its id', () => {
  it('carries its day, its holds and their squares, and gives them back', () => {
    const ids = Object.keys(SET_MOVES).slice(0, SETTING.pick);
    const id = setId(12, ids, cells);
    expect(id).toMatch(/^ys-12-/);
    expect(setOf(id)).toEqual({ day: 12, ids, cells });
    expect(setOf('sc-2-1')).toBeNull();
    expect(setOf('ys-12-z00')).toBeNull();
  });

  it('keeps the bucket’s order, so a hung set’s holds stay what they were, and a square is two digits', () => {
    expect(Object.keys(SET_MOVES)).toEqual([
      'jug',
      'shake',
      'rail',
      'pinch',
      'mono',
      'undercling',
      'deadpoint',
      'campus',
      'smear',
      'gaston',
      'heel',
      'slap',
      'dyno',
    ]);
    expect(SETTING.panel.cols).toBeLessThanOrEqual(10);
    expect(SETTING.panel.rows).toBeLessThanOrEqual(10);
  });

  it('is a problem like the gym’s own: one crux at its hardest move, graded as the panel graded it', () => {
    const ids = ['jug', 'undercling', 'mono', 'campus', 'slap'];
    const id = setId(12, ids, cells);
    const r = setRoute(id)!;
    expect(routeById('any seed', id)).toEqual(r);
    expect(r).toMatchObject({ disc: 'boulder', place: 'gym', type: 'crimp', moves: ids.length + 1 });
    expect(r.grade).toBe(setGrade(setMoves(ids, cells)));
    const c = r.cruxes[0]!;
    expect(c.from).toBeLessThan(c.to);
    expect(c.to).toBeLessThan(r.moves);
    expect(c.beta.every((b) => r.beta[b])).toBe(true);
    // Every hold the bucket has, as the hardest, gives a style a go can climb.
    for (const hold of Object.keys(SET_MOVES)) {
      const t = setRoute(setId(3, [hold, 'smear', 'rail', 'gaston', 'heel'], cells))!.type;
      expect(['crimp', 'power', 'technical', 'dyno']).toContain(t);
    }
  });
});

describe('Phase 44.2: up on the panel till the reset', () => {
  it('goes up when it’s hung on a shift, under the name given, tidied', () => {
    const s = base();
    const { set, r } = hang(s, '  The   Long Reach ');
    expect(r.state.setUp).toEqual({ id: setId(s.day, set, cells), name: 'The Long Reach' });
    expect(lines(r)).toContain('“The Long Reach” is up on the panel till the reset.');
  });

  it('takes the first idea for a name too short, and cuts one too long', () => {
    const s = base();
    const b = setBrief(s);
    const { set, r } = hang(s, 'X');
    expect(r.state.setUp!.name).toBe(setNameIdeas(b.wall, b.crowd, set, cells)[0]);
    expect(setNameOf('a'.repeat(40), ['Idea'])).toHaveLength(SETTING.name.max);
    expect(setNameOf(undefined, [])).toBe('Your set');
  });

  it('is on the wall after the week’s six and before the board, climbed like them, till the reset', () => {
    const s = base();
    const { r } = hang(s, 'The Long Reach');
    const up = { ...r.state, min: 13 * 60 };
    const id = up.setUp!.id;
    const wall = wallAt(up, 'gym');
    expect(wall.filter((x) => !x.board).length).toBe(7);
    expect(wall[6]!.id).toBe(id);
    expect(wall.slice(7).every((x) => x.board)).toBe(true);
    expect(lineName(up, wall[6]!)).toBe('The Long Reach');
    expect(setUpNow(up)?.id).toBe(id);
    // A go on it, and a send.
    const route = setRoute(id)!;
    const went = act(up, { t: 'go', route: id });
    expect(went.events.find((e) => e.k === 'refused')).toBeUndefined();
    const sent: GoResult = { sent: true, hi: route.moves, fellAt: null, tried: ['A1'], skin: 0 };
    const done = act(went.state, { t: 'done', route: id, result: sent });
    expect(done.state.routes[id]?.sent).toBeTruthy();
    // The week turns: down off the wall, though its log still finds it.
    const later = { ...done.state, day: up.day + 7 };
    expect(stillUp(later.day, id)).toBe(false);
    expect(setUpNow(later)).toBeUndefined();
    expect(wallAt(later, 'gym').some((x) => x.id === id)).toBe(false);
    expect(routeById(later.seed, id)?.id).toBe(id);
  });

  it('comes down for the next set hung', () => {
    const s = base({
      shifts: [
        { job: 'set', day: 1 },
        { job: 'set', day: 2 },
      ],
    });
    const first = hang(s, 'First').r.state;
    const next = hang({ ...first, day: 2, min: 8 * 60, energy: 100, today: [] }, 'Second').r.state;
    expect(next.setUp!.name).toBe('Second');
    expect(
      wallAt(next, 'gym')
        .filter((x) => x.id.startsWith('ys-'))
        .map((x) => lineName(next, x)),
    ).toEqual(['Second']);
  });

  it('goes up from your own wall too', () => {
    const s = base({
      jobs: { set: JOBS.set!.at.at(-1)! },
      min: 9 * 60,
      gym: {
        since: 1,
        members: OWN_GYM.members.start,
        quality: OWN_GYM.plain,
        till: 0,
        last: 0,
        setter: false,
        upgrades: [],
        peak: OWN_GYM.members.start,
        set: 0,
      },
    });
    const set = setBrief(s).hand.slice(0, SETTING.pick);
    const r = act(s, { t: 'gym', do: 'set', set, at: cells, name: 'Home Wall' });
    expect(r.state.setUp).toEqual({ id: setId(s.day, set, cells), name: 'Home Wall' });
  });

  it('loads a save from before with nothing up', () => {
    const r = fromSave(V82);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(82);
    expect(r.state).toEqual({ ...JSON.parse(V82).state, setUp: null });
  });
});
