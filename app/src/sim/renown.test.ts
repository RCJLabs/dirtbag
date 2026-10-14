// Phase 28.4: the crew's renown (Evan's call: lines only, never a number). It grows with the
// projects sent with the crew there and the months it's had its name, and the old guard, the
// strangers at the crag and the shops say its name more the further it's gone.
import { describe, expect, it } from 'vitest';
import { holds } from './cond';
import { RENOWN_CROWD } from './content/renown';
import { renownTier } from './crew';
import { RENOWN } from './dials';
import { act, newGame, talkStart } from './game';
import { keeperLine } from './keepers';
import { whereNow } from './presence';
import type { GameState } from './types';

const named = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('renown'),
  day: 40,
  crewName: { name: 'Gorge Rats', day: 40 },
  people: { ray: { bond: 2, last: 0, since: 1, talked: true, life: 9 } },
  ...over,
});
const trains = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ route: `r${i}`, day: 40, train: ['hazel'] }));

describe('renown', () => {
  it('is nothing without a name, and grows with trains and months', () => {
    expect(renownTier(named({ crewName: null, crewSends: trains(9) }))).toBe(0);
    expect(renownTier(named())).toBe(0);
    // The first train is the first tier.
    expect(RENOWN.train).toBeGreaterThanOrEqual(RENOWN.tiers[0]!);
    expect(renownTier(named({ crewSends: trains(1) }))).toBe(1);
    // A project sent alone doesn't count.
    expect(renownTier(named({ crewSends: [{ route: 'x', day: 40, train: [] }] }))).toBe(0);
    // Time named counts too, a little.
    const later = named({ day: 40 + 30 * RENOWN.tiers[0]! });
    expect(renownTier(later)).toBe(1);
    expect(renownTier(named({ crewSends: trains(9) }))).toBe(RENOWN.tiers.length);
  });

  it('opens the strangers’ lines a tier at a time', () => {
    const at = (s: GameState) => RENOWN_CROWD.filter((l) => !l.when || holds(s, l.when)).length;
    expect(at(named())).toBe(0);
    const one = at(named({ crewSends: trains(1) }));
    expect(one).toBeGreaterThan(0);
    expect(at(named({ crewSends: trains(9) }))).toBeGreaterThan(one);
  });

  it('gets the crew’s name said in town', () => {
    const s = named({ crewSends: trains(3) });
    const said = Array.from({ length: 120 }, (_, d) => keeperLine({ ...s, day: 40 + d }, 'diner') ?? '');
    expect(said.some((l) => l.includes('Gorge Rats'))).toBe(true);
    expect(said.every((l) => !l.includes('{crew}'))).toBe(true);
  });
});

describe('the old guard', () => {
  it('has a word about the crew once a tier, said once', () => {
    const s = named({ crewSends: trains(1) });
    expect(talkStart(named(), 'ray')).not.toMatch(/^renown-/);
    expect(talkStart(s, 'ray')).toBe('renown-1');
    // Heard, it's done.
    const heard = { ...s, seen: [...s.seen, 'renown-ray-1'] };
    expect(talkStart(heard, 'ray')).not.toMatch(/^renown-/);
    // A jump past a tier skips its line.
    const two = named({ crewSends: trains(3) });
    expect(renownTier(two)).toBe(2);
    expect(talkStart(two, 'ray')).toBe('renown-2');
  });

  it('keeps it heard when Frank says it at his stove', () => {
    // A night Frank's rig is in the Lot.
    const frank = { bond: 2, last: 0, since: 1, talked: true, life: 9 };
    const day = Array.from({ length: 200 }, (_, i) => 40 + i).find(
      (d) => whereNow(named({ day: d, at: 'lot', min: 21 * 60, people: { frank } }), 'frank') === 'lot',
    )!;
    const s = named({ day, crewSends: trains(1), at: 'lot', min: 21 * 60, people: { frank } });
    expect(talkStart(s, 'frank')).toBe('renown-1');
    const r = act(s, { t: 'say', talk: 'frank', node: 'renown-1', opt: 0 });
    expect(r.state.seen).toContain('renown-frank-1');
    expect(talkStart(r.state, 'frank')).not.toBe('renown-1');
  });
});
