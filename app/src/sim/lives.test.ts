// Phase 17.3: lives that change on the age clock. Ray's last season and the day he stops,
// Tam slowing then done, Frank's rig, partners off the rock for a stretch, and a first
// meeting that waits for your first word.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { TALK } from './content/people';
import { routesAt } from './content/gym';
import { AGE, LIFE } from './dials';
import { act, belayer, newGame, talkStart } from './game';
import { frankParks, lifeDue, RAY_GONE, RAY_LAST, stintOn, tamSlows, tamStops } from './lives';
import { whereIs } from './presence';
import type { GameEvent, GameState, PersonLog } from './types';

const SEED = 'lives';
const lines = (ev: GameEvent[]) => ev.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const made = (people: Record<string, PersonLog>, over: Partial<GameState> = {}): GameState => ({
  ...act(newGame(SEED), { t: 'create', name: 'Robin', start: 'allrounder' }).state,
  people,
  ...over,
});
// A night in the van, from the evening of `day`, answering anything at the door.
const night = (s: GameState, day: number) => {
  const bed = (x: GameState) =>
    act({ ...x, day, at: 'lot', min: 18 * 60, cash: 500, energy: 50 }, { t: 'act', act: 'lot.sleep' });
  let r = bed(s);
  for (let i = 0; i < 3 && r.state.encounter; i++) r = bed(act(r.state, { t: 'answer', opt: 0 }).state);
  return r;
};
const range = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => from + i);
const met = (since: number, more: Partial<PersonLog> = {}): PersonLog => ({
  bond: 3,
  last: 0,
  since,
  talked: true,
  ...more,
});

describe('lives that change (Phase 17.3)', () => {
  it('runs on the age clock', () => {
    expect(RAY_LAST).toBe(LIFE.ray.last * AGE.days + 1);
    expect(RAY_GONE).toBe(LIFE.ray.retire * AGE.days + 1);
    expect(tamStops(met(100))! - tamSlows(met(100))!).toBe((LIFE.tam.stop - LIFE.tam.slow) * AGE.days);
  });

  it('has Ray tell you it’s his last season, then stop coming out, leaving you his topo', () => {
    const at = (d: number) => [7, 10, 13].some((h) => whereIs(SEED, 'ray', d, h * 60));
    expect(range(RAY_LAST, RAY_GONE).some(at)).toBe(true);
    expect(range(RAY_GONE, RAY_GONE + 200).some(at)).toBe(false);
    // His last season, once, and only in it.
    const s = made({ ray: met(30) }, { day: RAY_LAST });
    expect(lifeDue(s, 'ray/1')).toBe(true);
    expect(talkStart(s, 'ray')).toBe('last-season');
    expect(lifeDue({ ...s, day: RAY_LAST - 1 }, 'ray/1')).toBe(false);
    expect(lifeDue({ ...s, people: { ray: met(30, { life: 1 }) } }, 'ray/1')).toBe(false);
    // The night he stops: the note, and every way up Roadside.
    const r = night(made({ ray: met(30) }), RAY_GONE - 1);
    expect(lines(r.events).some((l) => l.startsWith('Ray didn’t come out this weekend'))).toBe(true);
    for (const route of routesAt(SEED, 'road', RAY_GONE))
      for (const c of route.cruxes)
        for (const b of c.beta.slice(1)) expect(r.state.routes[route.id]?.known).toContain(b);
    // Not if you never knew him.
    expect(lines(night(made({}), RAY_GONE - 1).events).some((l) => l.startsWith('Ray'))).toBe(false);
  });

  it('slows Tam from his third year with you and stops him at the fifth', () => {
    const p = met(120);
    const odds = (from: number) =>
      range(from, from + 3 * AGE.days).filter((d) => whereIs(SEED, 'tam', d, 9 * 60, p)).length;
    expect(odds(tamSlows(p)!)).toBeLessThan(odds(p.since!));
    expect(range(tamStops(p)!, tamStops(p)! + 200).some((d) => whereIs(SEED, 'tam', d, 9 * 60, p))).toBe(
      false,
    );
    expect(TALK.tam!.start.some((e) => e.when?.life === 'tam/1' && e.node === 'slowing')).toBe(true);
    const r = night(made({ tam: p }), tamStops(p)! - 1);
    expect(lines(r.events).some((l) => l.includes('Five good seasons'))).toBe(true);
  });

  it('parks Frank next to you every night once his rig’s gone', () => {
    const p = met(10);
    const parks = frankParks(p)!;
    expect(range(parks, parks + 60).every((d) => whereIs(SEED, 'frank', d, 19 * 60, p) === 'lot')).toBe(true);
    expect(range(10, parks).every((d) => whereIs(SEED, 'frank', d, 19 * 60, p) === 'lot')).toBe(false);
    const s = made({ frank: p }, { day: parks, at: 'lot', min: 19 * 60 });
    expect(talkStart(s, 'frank')).toBe('parked');
    const told = act(s, { t: 'say', talk: 'frank', node: 'parked', opt: 0 }).state;
    expect(told.people.frank!.life).toBe(1);
    expect(talkStart(told, 'frank')).not.toBe('parked');
  });

  it('takes partners off the rock for a stretch now and then, never Hazel, never in the first year', () => {
    const days = range(1, 10 * AGE.days);
    for (const who of LIFE.stint.who) {
      const on = days.filter((d) => stintOn(SEED, who, d));
      expect(on.length, who).toBeGreaterThan(0);
      expect(on[0]!, who).toBeGreaterThan(AGE.days);
      for (const d of on) expect(whereIs(SEED, who, d, 12 * 60, met(1))).toBeNull();
    }
    expect(days.some((d) => stintOn(SEED, 'hazel', d))).toBe(false);
  });

  it('tells you overnight when someone you know goes, and when they’re back', () => {
    const d = range(AGE.days, 10 * AGE.days).find(
      (x) => stintOn(SEED, 'mara', x) && !stintOn(SEED, 'mara', x - 1),
    )!;
    const st = stintOn(SEED, 'mara', d)!;
    const went = lines(night(made({ mara: met(5) }), d - 1).events);
    expect(went.some((l) => l.startsWith('Mara') && l.includes(`${st.to - st.from} days`))).toBe(true);
    const back = lines(night(made({ mara: met(5) }), st.to - 1).events);
    expect(back).toContain('Mara’s back on the rock.');
    // Nothing about someone you've never met.
    expect(lines(night(made({}), d - 1).events).some((l) => l.startsWith('Mara'))).toBe(false);
  });

  it('keeps a partner’s first meeting for your first word, even after they’ve belayed you', () => {
    const day = range(5, 200).find((x) => whereIs(SEED, 'mara', x, 12 * 60) === 'gorge')!;
    const k = needFor(5);
    const s = made({}, { day, min: 12 * 60, at: 'gorge', energy: 100, skin: 100, today: ['warm'] });
    s.climber = { ...s.climber, skills: { power: k, fingers: k, endurance: k, technique: k, head: k } };
    expect(belayer(s)).toBe('mara');
    const r = act(s, { t: 'go', route: 'gintro' });
    expect(r.state.people.mara).toBeDefined();
    expect(r.state.people.mara!.talked).toBeUndefined();
    expect(talkStart(r.state, 'mara')).toBe('meet');
    const spoke = act(r.state, { t: 'say', talk: 'mara', node: 'meet', opt: 0 }).state;
    expect(spoke.people.mara!.talked).toBe(true);
    expect(talkStart(spoke, 'mara')).not.toBe('meet');
  });
});
