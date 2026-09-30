// Phase 22.6c: walk-outs. Leaving a crag late, spent, alone, in the rain or the winter dark,
// the trail back to the van can turn into v0.956's epics: three stages of calls that add up
// to how you get out. A headlamp is the cheapest insurance in the valley.
import { describe, expect, it } from 'vitest';
import { EPICS } from './content/epics';
import { EVENTS } from './dials';
import { epicEnd, epicKind, epicNow, epicOdds, epicRisk } from './events';
import { act, newGame } from './game';
import type { GameState } from './types';
import { skyOn } from './weather';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('walkouts'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  at: 'road',
  cash: 200,
  energy: 60,
  fed: 60,
  min: 12 * 60,
  day: 12,
  ...over,
});
// Late, spent, hungry and alone, with no light: as risky as a dry night gets.
const risky = (over: Partial<GameState> = {}) => base({ min: 21 * 60 + 30, energy: 20, fed: 10, ...over });
const dryDay = (from: number) => {
  for (let d = from; d < from + 60; d++) if (skyOn('walkouts', d) !== 'rain') return d;
  throw new Error('no dry day');
};
// The first dry night from day 12 a walk-out starts on, leaving Roadside for the Lot.
const walkOutNight = () => {
  for (let d = 12; d < 400; d++) {
    const s = risky({ day: d });
    if (skyOn('walkouts', d) !== 'rain' && epicNow(s, 'road')) return s;
  }
  throw new Error('no walk-out in 400 nights');
};
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));

describe('walk-outs', () => {
  it('get riskier late, with no light, spent, hungry and alone, and a headlamp takes three off', () => {
    const d = dryDay(12);
    const calm = base({ day: d, people: { hazel: { bond: 1, last: d } } });
    expect(epicRisk(calm, 'road')).toBe(0);
    expect(epicOdds(calm, 'road')).toBe(0);
    const s = risky({ day: d });
    expect(epicRisk(s, 'road')).toBe(2 + 1 + 3 + 2 + 1 + 1);
    expect(epicRisk({ ...s, gear: { ...s.gear, headlamp: 1 } }, 'road')).toBe(epicRisk(s, 'road') - 3);
    expect(epicOdds(s, 'road')).toBeCloseTo(
      Math.min(EVENTS.epic.most, (10 - EVENTS.epic.from) * EVENTS.epic.per),
    );
    expect(epicKind(s, 'road')).toBe('dark');
  });

  it('come only leaving a crag, unhurt, ten days apart, one encounter a day', () => {
    const s = walkOutNight();
    expect(epicNow({ ...s, at: 'cafe' }, 'cafe')).toBeNull();
    expect(
      epicNow({ ...s, injury: { kind: 'tweaked finger', tier: 1, until: s.day + 2 } }, 'road'),
    ).toBeNull();
    expect(epicNow({ ...s, deck: { ...s.deck, epic: s.day - 3 } }, 'road')).toBeNull();
    expect(epicNow({ ...s, deck: { ...s.deck, last: s.day } }, 'road')).toBeNull();
  });

  it('hold the drive: three stages of calls, then out, and the drive is still to do', () => {
    const s = walkOutNight();
    let r = act(s, { t: 'travel', to: 'lot' });
    expect(r.state.at).toBe('road');
    expect(r.state.encounter).toMatchObject({ kind: 'epic', id: 'dark', stage: 0 });
    expect(act(r.state, { t: 'travel', to: 'lot' }).events[0]).toMatchObject({ k: 'refused' });
    // The careful calls: sit and wait, follow the bank, contour round.
    r = act(r.state, { t: 'answer', opt: 0 });
    expect(r.state.encounter?.stage).toBe(1);
    r = act(r.state, { t: 'answer', opt: 1 });
    const out = act(r.state, { t: 'answer', opt: 0 });
    expect(out.state.encounter).toBeNull();
    const ep = EPICS.find((e) => e.kind === 'dark')!;
    expect(lines(out)).toContain(ep.ends.clean);
    // Two hours, one, and one: four hours on the trail.
    expect(out.state.min).toBe(r.state.min + 4 * 60);
    expect(out.state.log.at(-1)?.text).toMatch(/The Walk Out at Roadside Crag/);
    expect(act(out.state, { t: 'travel', to: 'lot' }).state.at).toBe('lot');
  });

  it('hurt you on the way out when you push it', () => {
    const s = walkOutNight();
    let r = act(s, { t: 'travel', to: 'lot' });
    for (const i of [1, 2, 1]) r = act(r.state, { t: 'answer', opt: i });
    expect(epicEnd(2 + 3 + 2)).toBe('bad');
    expect(r.state.injury?.kind).toMatch(/ankle/);
    expect(r.events).toContainEqual(expect.objectContaining({ k: 'injured' }));
  });

  it('sell a headlamp at the gear shop', () => {
    const r = act(base({ at: 'shop' }), { t: 'act', act: 'shop.headlamp' });
    expect(r.state.gear.headlamp).toBe(1);
    expect(act(r.state, { t: 'act', act: 'shop.headlamp' }).events[0]).toMatchObject({ k: 'refused' });
  });
});
