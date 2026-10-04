// Phase 25.1: giving and guides, and the three Record Book entries that waited on them.
import { describe, expect, it } from 'vitest';
import { GIVING, GUIDE } from './dials';
import { act, newGame } from './game';
import { guideBlocked, guideLines } from './guides';
import { aimEarned } from './record';
import type { GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('giving'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  energy: 100,
  cash: 2000,
  ...over,
});
const refused = (r: ReturnType<typeof act>) => r.events[0]?.k === 'refused';
const sleep = (s: GameState) => {
  let r = act({ ...s, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' });
  if (r.state.encounter) r = act(r.state, { t: 'answer', opt: 0 });
  return r.state;
};

describe('giving', () => {
  it('gives at the food bank once a week, for a little psyche', () => {
    const s = base({ at: 'market', day: 10 });
    const r = act(s, { t: 'give', to: 'food' });
    expect(r.state.cash).toBe(s.cash - GIVING.food.cash);
    expect(r.state.giving).toEqual({ total: GIVING.food.cash, food: 10, access: 0 });
    expect(r.state.psyche.level).toBeGreaterThan(s.psyche.level);
    expect(refused(act(r.state, { t: 'give', to: 'food' }))).toBe(true);
    expect(refused(act({ ...r.state, day: 10 + GIVING.every }, { t: 'give', to: 'food' }))).toBe(false);
    expect(refused(act({ ...s, at: 'lot' }, { t: 'give', to: 'food' }))).toBe(true);
  });

  it('gives to the access fund at the shop, for the old crowd’s nod', () => {
    const s = base({ at: 'shop' });
    const r = act(s, { t: 'give', to: 'access' });
    expect(r.state.scene.old).toBe(s.scene.old + GIVING.access.old);
    expect(refused(act({ ...s, cash: 10 }, { t: 'give', to: 'access' }))).toBe(true);
  });

  it('fills the book at $1,000 over a life', () => {
    expect(aimEarned(base({ giving: { total: 990, food: 0, access: 0 } }), { given: 1000 })).toBe(false);
    expect(aimEarned(base({ giving: { total: 1000, food: 0, access: 0 } }), { given: 1000 })).toBe(true);
  });
});

describe('a guide of your own', () => {
  // Every line at Roadside sent, one of them a first ascent of yours.
  const done = (over: Partial<GameState> = {}): GameState => {
    const s = base({ at: 'lot', min: 19 * 60 });
    const lines = guideLines(s, 'road');
    const sent = { day: 5, go: 1, style: 'redpoint' as const };
    const routes = Object.fromEntries(
      lines.map((r) => [
        r.id,
        {
          known: [],
          told: [],
          pick: {},
          falls: {},
          goes: 1,
          goesToday: 0,
          hi: r.moves,
          sent,
          sentToday: false,
        },
      ]),
    );
    const open = lines.find((r) => r.open)!;
    return { ...s, routes, firsts: { [open.id]: { name: 'Mine', call: 0, day: 5 } }, ...over };
  };

  it('waits on every line sent and one of your own', () => {
    const s = base({ at: 'lot' });
    expect(guideBlocked(s, 'road')).toMatch(/haven’t sent/);
    expect(guideBlocked({ ...done(), firsts: {} }, 'road')).toMatch(/of your own/);
    expect(guideBlocked(done(), 'road')).toBeNull();
    expect(guideBlocked({ ...done(), at: 'road' }, 'road')).toMatch(/at the van/);
    expect(guideBlocked(done(), 'gym')).toMatch(/Not a crag/);
  });

  it('is written an evening at a time, then pays every week, and fills the book', () => {
    let s = done();
    for (let n = 1; n <= GUIDE.pages; n++) {
      const r = act(s, { t: 'guide', place: 'road' });
      expect(refused(r)).toBe(false);
      expect(refused(act(r.state, { t: 'guide', place: 'road' }))).toBe(true);
      s = { ...r.state, today: [], energy: 100, min: 19 * 60 };
    }
    expect(s.guides.road!.out).not.toBeNull();
    expect(aimEarned(s, { guide: true })).toBe(true);
    expect(refused(act(s, { t: 'guide', place: 'road' }))).toBe(true);
    // The week's end pays the royalty.
    const before = { ...s, day: 7, cash: 500 };
    const after = sleep(before);
    expect(after.cash).toBeGreaterThan(sleep({ ...before, guides: {} }).cash);
  });

  it('names you in the book once your habits do', () => {
    expect(aimEarned(base(), { quirk: true })).toBe(false);
    expect(aimEarned(base({ quirk: 'grinder' }), { quirk: true })).toBe(true);
  });
});
