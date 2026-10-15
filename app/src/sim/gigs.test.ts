// Phase 26b: money in a day. Day labor on the seed's days, the whole day for flat pay and no
// rank; and a family at a busy crag who'd pay you to hang them a rope, once a day.
import { describe, expect, it } from 'vitest';
import { GIGS } from './content/gigs';
import { crowdAt } from './crowds';
import { GIG, KIT, PLASMA, TOURISTS } from './dials';
import { dayFactor } from './climb';
import { ROUTES } from './content/routes';
import { act, newGame } from './game';
import { gigBlocked, gigOn, touristLine, touristsOn } from './gigs';
import type { GameState, RouteLog } from './types';
import { seasonOf } from './weather';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('gigs'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  energy: 100,
  ...over,
});
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const sent = (day: number): RouteLog => ({
  known: [],
  told: [],
  pick: {},
  falls: {},
  goes: 1,
  goesToday: 0,
  hi: 0,
  sent: { day, go: 1, style: 'redpoint' },
  sentToday: false,
});

describe('day labor', () => {
  const days = Array.from({ length: 4 * 56 }, (_, i) => i + 1);

  it('is posted on the seed’s days, the same on a reload, in its season', () => {
    const on = days.filter((d) => gigOn('gigs', d));
    expect(on.length / days.length).toBeGreaterThan(GIG.odds - 0.12);
    expect(on.length / days.length).toBeLessThan(GIG.odds + 0.12);
    expect(days.map((d) => gigOn('gigs', d))).toEqual(days.map((d) => gigOn('gigs', d)));
    for (const d of on) {
      const g = GIGS[gigOn('gigs', d)!]!;
      if (g.season) expect(g.season).toContain(seasonOf(d));
    }
    expect(new Set(on.map((d) => gigOn('gigs', d))).size).toBeGreaterThanOrEqual(4);
  });

  it('takes the whole day for flat pay, counts toward no rank, and leaves no shift after it', () => {
    const day = days.find((d) => gigOn('gigs', d))!;
    const s = base({ day, at: 'market', min: 7 * 60 });
    const r = act(s, { t: 'gig' });
    expect(r.events[0]?.k).not.toBe('refused');
    expect(r.state.cash).toBe(s.cash + GIG.pay);
    expect(r.state.min).toBe(s.min + GIG.min);
    expect(r.state.energy).toBe(s.energy - GIG.energy);
    expect(r.state.jobs).toEqual(s.jobs);
    expect(r.state.today).toEqual(expect.arrayContaining(['worked', 'worked2']));
    expect(lines(r).some((l) => l.includes(GIGS[gigOn('gigs', day)!]!.says))).toBe(true);
    const after = act({ ...r.state, at: 'cafe', min: 8 * 60 }, { t: 'act', act: 'cafe.shift' });
    expect(after.events[0]).toMatchObject({ k: 'refused', why: expect.stringMatching(/two shifts/) });
  });

  it('is refused on a day without one, away from the market, late, after a shift, or tired', () => {
    const day = days.find((d) => gigOn('gigs', d))!;
    const none = days.find((d) => !gigOn('gigs', d))!;
    const s = base({ day, at: 'market', min: 7 * 60 });
    expect(gigBlocked(s)).toBeNull();
    expect(gigBlocked({ ...s, day: none })).toMatch(/No day labor/);
    expect(gigBlocked({ ...s, at: 'diner' })).toMatch(/posted at/);
    expect(gigBlocked({ ...s, min: GIG.by + 1 })).toMatch(/starts by/);
    expect(gigBlocked({ ...s, today: ['worked'] })).toMatch(/worked today/);
    expect(gigBlocked({ ...s, energy: GIG.energy - 1 })).toMatch(/tired/);
  });
});

describe('crag tourists', () => {
  // Roadside's warm-up sent, a rope in the van, and a busy morning there.
  const warm = 'warmup';
  const ready = (over: Partial<GameState> = {}) =>
    base({
      at: 'road',
      min: 10 * 60,
      gear: { ...base().gear, rope: 1 },
      routes: { [warm]: sent(1) },
      ...over,
    });
  const busy = Array.from({ length: 200 }, (_, i) => i + 2).filter((d) => {
    const c = crowdAt('gigs', d, 10 * 60, 'road');
    return c === 'busy' || c === 'packed';
  });
  const asked = busy.filter((d) => touristsOn(ready({ day: d })));

  it('asks on some busy days, with a rope and a roped line of yours to hang it on', () => {
    expect(asked.length).toBeGreaterThan(0);
    expect(asked.length).toBeLessThan(busy.length);
    const d = asked[0]!;
    expect(touristLine(ready({ day: d }))?.id).toBe(warm);
    expect(touristsOn(ready({ day: d, gear: { ...base().gear, rope: 0 } }))).toBe(false);
    expect(touristsOn(ready({ day: d, routes: {} }))).toBe(false);
    const quiet = Array.from({ length: 200 }, (_, i) => i + 2).find((x) => {
      const c = crowdAt('gigs', x, 10 * 60, 'road');
      return c === 'quiet' || c === 'empty';
    })!;
    expect(touristsOn(ready({ day: quiet }))).toBe(false);
  });

  it('says so when you get there, pays an hour and a tip, and once a day', () => {
    const d = asked[0]!;
    const there = act(ready({ day: d, at: 'lot', min: 9 * 60 + 30 }), { t: 'travel', to: 'road' });
    expect(lines(there).some((l) => l.includes('guidebook upside down'))).toBe(true);
    const s = ready({ day: d });
    const r = act(s, { t: 'tourists' });
    expect(r.events[0]?.k).not.toBe('refused');
    expect(r.state.cash - s.cash).toBeGreaterThanOrEqual(TOURISTS.pay);
    expect(r.state.cash - s.cash).toBeLessThanOrEqual(TOURISTS.pay + TOURISTS.tip);
    expect(r.state.min).toBe(s.min + TOURISTS.min);
    expect(lines(r).some((l) => l.includes(touristLine(s)!.name))).toBe(true);
    expect(act(r.state, { t: 'tourists' }).events[0]).toMatchObject({ k: 'refused' });
    expect(act({ ...s, min: TOURISTS.till }, { t: 'tourists' }).events[0]).toMatchObject({ k: 'refused' });
  });
});

describe('selling kit (Phase 26b)', () => {
  it('buys it back at the shop any day, at a share of its price, and it’s gone', () => {
    const s = base({
      at: 'shop',
      min: 10 * 60,
      gear: { ...base().gear, rack: 1, rope: 1, pad: 1, hangboard: 1, headlamp: 1, camera: 1 },
    });
    for (const [act_, id] of [
      ['shop.sellRack', 'rack'],
      ['shop.sellRope', 'rope'],
      ['shop.sellPad', 'pad'],
      ['shop.sellHangboard', 'hangboard'],
      ['shop.sellHeadlamp', 'headlamp'],
      ['shop.sellCamera', 'camera'],
    ] as const) {
      const r = act(s, { t: 'act', act: act_ });
      expect(r.events[0]?.k, act_).not.toBe('refused');
      expect(r.state.cash - s.cash).toBe(Math.round(KIT.sell * KIT[id].price));
      expect(r.state.gear[id] ?? 0).toBe(0);
      expect(act(r.state, { t: 'act', act: act_ }).events[0]).toMatchObject({ k: 'refused' });
    }
  });
});

describe('plasma (Phase 26b)', () => {
  const on = (d: number) => PLASMA.days.includes(d % 7);
  it('is drawn on its two days a week, once, for money, and the power goes with it', () => {
    const day = Array.from({ length: 14 }, (_, i) => i + 1).find(on)!;
    const off = Array.from({ length: 14 }, (_, i) => i + 1).find((d) => !on(d))!;
    const s = base({ day, at: 'clinic', min: 10 * 60 });
    expect(act({ ...s, day: off }, { t: 'act', act: 'clinic.plasma' }).events[0]).toMatchObject({
      k: 'refused',
      why: expect.stringMatching(/They draw/),
    });
    const r = act(s, { t: 'act', act: 'clinic.plasma' });
    expect(r.events[0]?.k).not.toBe('refused');
    expect(r.state.cash - s.cash).toBe(PLASMA.pay);
    expect(r.state.min).toBe(s.min + PLASMA.min);
    expect(act(r.state, { t: 'act', act: 'clinic.plasma' }).events[0]).toMatchObject({ k: 'refused' });
    const line = ROUTES.warmup!;
    const before = dayFactor({ ...s, at: 'road' }, line).windows;
    const after = dayFactor({ ...r.state, at: 'road', min: s.min }, line).windows;
    expect(after / before).toBeCloseTo(PLASMA.windows, 5);
  });
});
