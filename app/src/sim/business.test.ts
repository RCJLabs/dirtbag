// Phase 18.6: your own gym and your own crag. Send City bought by its head setter, a night's
// takings into a till that's yours to draw (Phase 18's criterion 4), members drawn by the
// wall; Miller's Bluff bought, a line climbable once bolted, an open project to name.
import { describe, expect, it } from 'vitest';
import { bolted, boltBlocked, businessRung, gymBuyBlocked, gymDay, gymNight, gymTarget } from './business';
import { gymSet, weekOf } from './content/gym';
import { JOBS } from './content/jobs';
import { ROUTES } from './content/routes';
import { OWN_GYM, GYM_SET, LAND } from './dials';
import { act, goBlocked, newGame } from './game';
import type { GameState, OwnGym } from './types';

const strong = { power: 400, fingers: 400, endurance: 400, technique: 400, head: 400 };
const base = (over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('business'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  return { ...s, energy: 100, cash: 20000, climber: { ...s.climber, skills: strong }, ...over };
};
const head = (over: Partial<GameState> = {}) => base({ jobs: { set: JOBS.set!.at.at(-1)! }, ...over });
const owned = (g: Partial<OwnGym> = {}, over: Partial<GameState> = {}): GameState =>
  head({
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
      ...g,
    },
    ...over,
  });
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const sleep = (s: GameState) => {
  let r = act({ ...s, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' });
  if (r.state.encounter) r = act(r.state, { t: 'answer', opt: 0 });
  return r;
};

describe('your own gym', () => {
  it('sells only to its head setter, with the price in hand', () => {
    expect(gymBuyBlocked(base())).toMatch(/head setter/);
    expect(gymBuyBlocked(head({ cash: 10 }))).toMatch(/in hand/);
    expect(gymBuyBlocked(head())).toBeNull();
    const r = act(head({ shifts: [{ job: 'set', day: 3 }] }), { t: 'gym', do: 'buy' });
    expect(r.state.gym).toMatchObject({ members: OWN_GYM.members.start, till: 0 });
    expect(r.state.cash).toBe(20000 - OWN_GYM.price);
    expect(r.state.shifts).toEqual([]);
    expect(r.state.today).toContain('pass');
    expect(businessRung(r.state)).toBe(JOBS.set!.ranks.length + 1);
  });

  it('runs a night: the wall goes stale, members drift toward it, the takings go in the till', () => {
    const g = owned({ quality: 0.8 }).gym!;
    const n = gymNight(g);
    expect(n.quality).toBeCloseTo(0.8 - OWN_GYM.fade, 10);
    expect(n.members).toBeGreaterThan(g.members);
    expect(n.till).toBe(gymDay({ ...g, members: n.members }).net);
    // A hired setter keeps the wall up.
    expect(gymNight({ ...g, quality: 0, setter: true }).quality).toBe(OWN_GYM.hired);
    // Upgrades draw more.
    expect(gymTarget({ ...g, upgrades: ['board'] })).toBe(gymTarget(g) + OWN_GYM.upgrades.board.members);
  });

  it('tells the night in the morning, and the till’s yours to draw (criterion 4)', () => {
    const r = sleep(owned({ quality: 0.9, members: 150 }));
    expect(lines(r).some((l) => /^Send City yesterday: \+\$/.test(l))).toBe(true);
    const till = r.state.gym!.till;
    expect(till).toBeGreaterThan(0);
    const drawn = act(r.state, { t: 'gym', do: 'draw' });
    expect(drawn.state.cash).toBe(r.state.cash + till);
    expect(drawn.state.gym!.till).toBe(0);
    expect(act(drawn.state, { t: 'gym', do: 'draw' }).events[0]?.k).toBe('refused');
  });

  it('warns of a short till, and sells up past the floor; no trap you can’t see coming', () => {
    const short = sleep(owned({ quality: 0, members: 10, till: -50 }));
    expect(lines(short).some((l) => /till's .* short/.test(l))).toBe(true);
    const sold = sleep(owned({ quality: 0, members: 10, till: OWN_GYM.floor + 10 }));
    expect(sold.state.gym).toBeNull();
  });

  it('takes a short till covered from your pocket, as far as it goes', () => {
    const s = owned({ till: -200 }, { cash: 150 });
    const part = act(s, { t: 'gym', do: 'pay' });
    expect(part.state.cash).toBe(0);
    expect(part.state.gym!.till).toBe(-50);
    expect(act(part.state, { t: 'gym', do: 'pay' }).events[0]?.k).toBe('refused');
    const full = act({ ...s, cash: 500 }, { t: 'gym', do: 'pay' });
    expect(full.state.cash).toBe(300);
    expect(full.state.gym!.till).toBe(0);
    expect(act(full.state, { t: 'gym', do: 'pay' }).events[0]?.k).toBe('refused');
  });

  it('builds upgrades from your pocket, once each; sells for a share of the price and the till', () => {
    const s = owned({ till: 300 });
    const up = act(s, { t: 'gym', do: 'upgrade', what: 'board' });
    expect(up.state.gym!.upgrades).toEqual(['board']);
    expect(up.state.cash).toBe(s.cash - OWN_GYM.upgrades.board.price);
    expect(act(up.state, { t: 'gym', do: 'upgrade', what: 'board' }).events[0]?.k).toBe('refused');
    const sold = act(s, { t: 'gym', do: 'sell' });
    expect(sold.state.gym).toBeNull();
    expect(sold.state.cash).toBe(s.cash + Math.round(OWN_GYM.price * OWN_GYM.resale + 300));
  });

  it('is set by you, once a day; no setting shifts for the owner', () => {
    const s = owned({ quality: 0.1 }, { at: 'gym', min: 9 * 60 });
    const r = act(s, { t: 'gym', do: 'set' });
    expect(r.state.gym!.quality).toBe(OWN_GYM.plain);
    expect(r.state.energy).toBe(s.energy - GYM_SET.energy);
    expect(act(r.state, { t: 'gym', do: 'set' }).events[0]?.k).toBe('refused');
    expect(act(s, { t: 'act', act: 'gym.set' }).events[0]).toMatchObject({ k: 'refused' });
  });

  it('is the owner’s every morning: the wall and the shower, no pass bought', () => {
    const day = sleep(owned({ quality: 0.6 })).state;
    expect(day.today).toContain('pass');
    const s = { ...day, at: 'gym', min: 9 * 60, energy: 100, supplies: 20 };
    const problem = gymSet(s.seed, weekOf(s.day))[0]!;
    expect(goBlocked({ ...s, today: [] }, problem)).toMatch(/day pass/);
    expect(goBlocked(s, problem)).toBeNull();
    expect(act(s, { t: 'act', act: 'gym.shower' }).events[0]?.k).not.toBe('refused');
    // Sold, the keys go with it: tomorrow's pass is bought like anyone's.
    const sold = act(s, { t: 'gym', do: 'sell' }).state;
    expect(sleep(sold).state.today).not.toContain('pass');
  });
});

describe('Miller’s Bluff', () => {
  const line = ROUTES.bbarn!;
  const block = ROUTES.bhay!;

  it('is land: nothing on it to climb till you’ve bought it and bolted the line', () => {
    const s = base({ at: 'bluff', min: 9 * 60 });
    expect(bolted(s, line)).toBe(false);
    expect(goBlocked(s, line)).toMatch(/bolt it/i);
    expect(boltBlocked(s, line)).toMatch(/for sale/);
    const bought = act({ ...s, at: 'lot' }, { t: 'unlock', place: 'bluff' });
    expect(bought.state.unlocked).toContain('bluff');
    expect(bought.state.cash).toBe(s.cash - LAND.price);
    expect(bought.state.record.landowner).toBeDefined();
  });

  it('bolts a sport line and cleans a boulder, each an open project after', () => {
    const s = base({ at: 'bluff', min: 9 * 60, unlocked: ['bluff'] });
    const r = act(s, { t: 'bolt', route: 'bbarn' });
    expect(r.state.bolted).toEqual(['bbarn']);
    expect(r.state.cash).toBe(s.cash - LAND.bolt.cash);
    // Bolted, it's a line like any other: wanting a belayer, not bolts.
    expect(goBlocked(r.state, line)).not.toMatch(/bolt/i);
    expect(line.open).toBe(true);
    const c = act({ ...r.state, energy: 100 }, { t: 'bolt', route: 'bhay' });
    expect(c.state.bolted).toEqual(['bbarn', 'bhay']);
    expect(c.state.cash).toBe(r.state.cash - LAND.clean.cash);
    expect(block.open).toBe(true);
    expect(goBlocked(c.state, block)).toBeNull();
    expect(act(c.state, { t: 'bolt', route: 'bbarn' }).events[0]?.k).toBe('refused');
    expect(act({ ...s, at: 'lot' }, { t: 'bolt', route: 'btufa' }).events[0]?.k).toBe('refused');
  });
});
