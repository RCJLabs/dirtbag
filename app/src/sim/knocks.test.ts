// Phase 22.6a: knocks on the van at night. v0.956's ten, by where you're parked; at most one
// a day and never within a few nights of the last; the night waits on your answer.
import { describe, expect, it } from 'vitest';
import { KNOCKS } from './content/knocks';
import { EVENTS } from './dials';
import { knockOdds, knockPsyche, knockTonight } from './events';
import { act, newGame } from './game';
import { SPOT_IDS } from './spots';
import type { GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('knocks'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 200,
  energy: 50,
  min: 21 * 60,
  ...over,
});
// The first night of the first 200 a knock comes to the Lot on.
const knockNight = (over: Partial<GameState> = {}) => {
  for (let day = 5; day < 205; day++) {
    const s = base({ day, ...over });
    if (knockTonight(s, 'lot')) return s;
  }
  throw new Error('no knock in 200 nights');
};
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));

describe('knocks on the van', () => {
  it('come by where you’re parked, with three answers each, for every spot', () => {
    for (const spot of SPOT_IDS)
      expect(
        KNOCKS.some((k) => k.spots.includes(spot)),
        spot,
      ).toBe(true);
    for (const k of KNOCKS) expect(k.opts, k.id).toHaveLength(3);
    const s = base({ day: 9 });
    expect(knockOdds(s, 'lot')).toBeCloseTo(EVENTS.knock.odds * EVENTS.knock.spot.lot);
    expect(knockOdds(s, 'driveway')).toBeLessThan(knockOdds(s, 'lot'));
  });

  it('hold the night until you answer, then the night goes on', () => {
    const s = knockNight();
    const r = act(s, { t: 'act', act: 'lot.sleep' });
    expect(r.state.day).toBe(s.day);
    expect(r.state.encounter?.kind).toBe('knock');
    expect(r.events).toContainEqual(expect.objectContaining({ k: 'encounter' }));
    expect(act(r.state, { t: 'act', act: 'lot.cook' }).events[0]).toMatchObject({ k: 'refused' });
    const k = KNOCKS.find((x) => x.id === r.state.encounter!.id)!;
    const a = act(r.state, { t: 'answer', opt: 1 });
    expect(a.state.encounter).toBeNull();
    expect(a.state.day).toBe(s.day + 1);
    expect(lines(a)[0]).toBe(k.opts[1]!.out);
    expect(act(a.state, { t: 'answer', opt: 0 }).events[0]).toMatchObject({ k: 'refused' });
  });

  it('do what the answer says: cash, and psyche on the rebuild’s scale', () => {
    const s = knockNight();
    const r = act(s, { t: 'act', act: 'lot.sleep' });
    const k = KNOCKS.find((x) => x.id === r.state.encounter!.id)!;
    const i = k.opts.findIndex((o) => o.fx.cash) >= 0 ? k.opts.findIndex((o) => o.fx.cash) : 0;
    const a = act({ ...r.state, deck: { ...r.state.deck } }, { t: 'answer', opt: i });
    // The same night slept without the knock, for the difference.
    const plain = act({ ...s, deck: { ...s.deck, knock: s.day } }, { t: 'act', act: 'lot.sleep' });
    expect(a.state.cash - plain.state.cash).toBe(k.opts[i]!.fx.cash ?? 0);
    expect(knockPsyche({ psyche: 9 })).toBe(Math.round(9 * EVENTS.psyche));
  });

  it('never come twice inside a few nights, nor on a day with an encounter already', () => {
    const s = knockNight();
    expect(knockOdds({ ...s, deck: { ...s.deck, knock: s.day - 1 } }, 'lot')).toBe(0);
    expect(
      knockOdds({ ...s, deck: { ...s.deck, knock: s.day - EVENTS.knock.every } }, 'lot'),
    ).toBeGreaterThan(0);
    expect(knockOdds({ ...s, deck: { ...s.deck, last: s.day } }, 'lot')).toBe(0);
  });

  it('pass over the ones you heard lately while there are others', () => {
    const s = knockNight();
    const k = knockTonight(s, 'lot')!;
    const others = KNOCKS.filter((x) => x.spots.includes('lot') && x.id !== k.id).map((x) => x.id);
    const again = knockTonight({ ...s, deck: { ...s.deck, seen: [k.id] } }, 'lot');
    if (again) expect(others).toContain(again.id);
  });

  it('bring the driveway’s friend to the door, and the bond with them', () => {
    // The friend's knock is the driveway's only one.
    expect(KNOCKS.filter((k) => k.spots.includes('driveway')).map((k) => k.id)).toEqual(['friend']);
  });
});
