// Phase 22.8: dreams. A jar the card and the bills never touch, and the broke check counts;
// v0.956's three dreams at its prices; and what each takes off, for good.
import { describe, expect, it } from 'vitest';
import { DREAMS } from './content/dreams';
import { EXPEDITIONS } from './content/expeditions';
import { DREAM, SPOTS, UPGRADE } from './dials';
import { expedCost, worth } from './dreams';
import { act, newGame } from './game';
import { needsTeaching } from './hustle';
import { nightAt, ticketTonight } from './spots';
import type { Action, GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('dreams'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 3000,
  ...over,
});
const run = (s: GameState, a: Action) => act(s, a);
const dream = (s: GameState, what: 'pick' | 'stash' | 'take' | 'claim', id?: string, amount?: number) =>
  run(s, { t: 'dream', do: what, id, amount });
const refused = (r: ReturnType<typeof act>) => r.events[0]?.k === 'refused';

describe('dreams', () => {
  it('fills a jar with cash in hand, never the card, and tips it out again', () => {
    let s = dream(base(), 'pick', 'rig').state;
    s = dream(s, 'stash', undefined, 500).state;
    expect(s.cash).toBe(2500);
    expect(s.dream.pot).toBe(500);
    expect(refused(dream({ ...s, cash: 10 }, 'stash', undefined, 50))).toBe(true);
    const back = dream(s, 'take').state;
    expect(back.cash).toBe(3000);
    expect(back.dream.pot).toBe(0);
  });

  it('is money the broke check counts, and the bills don’t touch', () => {
    const s = base({ cash: 4, fed: 20, dream: { pick: 'rig', pot: 400, owned: [] } });
    expect(worth(s)).toBe(404);
    expect(needsTeaching(s)).toBe(false);
    expect(needsTeaching({ ...s, dream: { ...s.dream, pot: 0 } })).toBe(true);
  });

  it('claims the dream once the jar covers it, and not before', () => {
    const cost = DREAMS.find((d) => d.id === 'rig')!.cost;
    let s = dream(base(), 'pick', 'rig').state;
    s = dream(s, 'stash', undefined, cost - 1).state;
    expect(refused(dream(s, 'claim'))).toBe(true);
    s = dream({ ...s, cash: 10 }, 'stash', undefined, 1).state;
    const r = dream(s, 'claim');
    expect(r.state.dream.owned).toEqual(['rig']);
    expect(r.state.dream.pot).toBe(0);
    expect(r.state.dream.pick).toBeNull();
    expect(refused(dream(r.state, 'pick', 'rig'))).toBe(true);
  });

  it('halves every spot and fits every upgrade with the Rig', () => {
    let s = base({ dream: { pick: 'rig', pot: 2800, owned: [] } });
    s = dream(s, 'claim').state;
    for (const u of Object.keys(UPGRADE)) expect(s.gear[u], u).toBe(1);
    expect(nightAt({ ...s, spot: 'lot' }).cost).toBe(Math.round(SPOTS.lot.cost * DREAM.rig) + SPOTS.lot.gas);
  });

  it('halves every expedition with the War Chest', () => {
    const e = Object.values(EXPEDITIONS)[0]!;
    const s = base({ dream: { pick: null, pot: 0, owned: ['warchest'] } });
    expect(expedCost(s, e.cost)).toBe(Math.round(e.cost * DREAM.warchest));
    expect(expedCost(base(), e.cost)).toBe(e.cost);
  });

  it('stops charging for the Lot and its tickets with Home Base, and gives you a kitchen', () => {
    let s = base({ dream: { pick: 'homebase', pot: 9000, owned: [] }, lotNights: 9 });
    expect(ticketTonight(s)).toBeGreaterThan(0);
    s = dream(s, 'claim').state;
    expect(s.gear.kitchen).toBe(1);
    expect(nightAt({ ...s, spot: 'lot' }).cost).toBe(SPOTS.lot.gas);
    expect(ticketTonight(s)).toBe(0);
    // The weekly bills still come.
    expect(DREAMS.find((d) => d.id === 'homebase')!.perk).toMatch(/weekly bills still come/);
  });
});
