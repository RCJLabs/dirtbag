// Phase 22.6b: on the road. v0.956's hitchhikers and roadside stops, on drives to and from
// the crags; at most one encounter a day, shared with the knocks; and a hitchhiker who
// remembers what you did, and may be the one who pulls up at your next breakdown.
import { describe, expect, it } from 'vitest';
import { HITCHERS, STOPS } from './content/road';
import { EVENTS } from './dials';
import { driveEncounter, hitchFriend, hitchOpts, roadTrip } from './events';
import { act, newGame } from './game';
import type { GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('road'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 200,
  energy: 70,
  min: 9 * 60,
  day: 6,
  ...over,
});
const withEncounter = (e: NonNullable<GameState['encounter']>, over: Partial<GameState> = {}) =>
  base({ at: 'road', encounter: e, ...over });
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
// The first drive to Roadside, from day 6, that meets `kind` on the way.
const driveTo = (kind: 'hitch' | 'stop', over: Partial<GameState> = {}) => {
  for (let day = 6; day < 400; day++) {
    const s = base({ day, ...over });
    const r = act(s, { t: 'travel', to: 'road' });
    if (r.state.encounter?.kind === kind) return { s, r };
  }
  throw new Error(`no ${kind} in 400 days`);
};

describe('on the road', () => {
  it('meets you only on drives to or from a crag, never before day three, one a day', () => {
    expect(roadTrip('lot', 'road')).toBe(true);
    expect(roadTrip('lot', 'cafe')).toBe(false);
    const { s, r } = driveTo('hitch');
    expect(r.state.at).toBe('road');
    expect(r.events).toContainEqual(expect.objectContaining({ k: 'encounter', kind: 'hitch' }));
    expect(r.state.deck.last).toBe(s.day);
    expect(driveEncounter({ ...s, day: 2 }, 'lot', 'road')).toBeNull();
    expect(driveEncounter({ ...s, deck: { ...s.deck, last: s.day } }, 'lot', 'road')).toBeNull();
    expect(act(r.state, { t: 'act', act: 'lot.cook' }).events[0]).toMatchObject({ k: 'refused' });
  });

  it('keeps hitchhikers five days apart and stops three', () => {
    const { s } = driveTo('hitch');
    const soon = { ...s, deck: { ...s.deck, hitch: s.day - 1 } };
    expect(driveEncounter(soon, 'lot', 'road')?.kind).not.toBe('hitch');
    const { s: t } = driveTo('stop');
    const again = { ...t, deck: { ...t.deck, stop: t.day - 1 } };
    expect(driveEncounter(again, 'lot', 'road')?.kind).not.toBe('stop');
    expect(EVENTS.hitch.every).toBe(5);
  });

  it('lets you drive past a stranger, who stays a stranger', () => {
    const s = withEncounter({ kind: 'hitch', id: 'kid' });
    const opts = hitchOpts(s, HITCHERS[0]!);
    expect(opts).toHaveLength(4);
    const r = act(s, { t: 'answer', opt: 3 });
    expect(r.state.encounter).toBeNull();
    expect(r.state.deck.met.kid).toBeUndefined();
    expect(lines(r)[0]).toMatch(/sign goes down/);
  });

  it('remembers what you did, and the second meeting knows it', () => {
    const s = withEncounter({ kind: 'hitch', id: 'grifter' });
    const gave = act(s, { t: 'answer', opt: 0 }).state;
    expect(gave.deck.met.grifter).toBe(0);
    expect(gave.cash).toBe(200 - 40);
    const g = HITCHERS.find((h) => h.id === 'grifter')!;
    expect(hitchOpts(gave, g).map((o) => o.label)).toContain('Stop, and ask for your forty back');
    const refused = act(s, { t: 'answer', opt: 1 }).state;
    expect(hitchOpts(refused, g).map((o) => o.label)).not.toContain('Stop, and ask for your forty back');
  });

  it('teaches you real beta, not flat skill: the old hand’s receipt', () => {
    const s = withEncounter({ kind: 'hitch', id: 'oldhand' });
    const r = act(s, { t: 'answer', opt: 0 });
    expect(r.events).toContainEqual(expect.objectContaining({ k: 'learned', how: 'told' }));
    expect(r.state.climber.skills).toEqual(s.climber.skills);
    // The busker's three chords are guitar practice (Phase 22.5b).
    const b = act(withEncounter({ kind: 'hitch', id: 'busker' }), { t: 'answer', opt: 2 });
    expect(b.state.guitar).toBe(3);
  });

  it('pulls over for a stop: the detour, the find, and less of it the second time', () => {
    const x = STOPS.find((y) => y.id === 'hotspring')!;
    const s = withEncounter({ kind: 'stop', id: 'hotspring' }, { energy: 40, skin: 40 });
    const r = act(s, { t: 'answer', opt: 0 });
    expect(r.state.min).toBe(s.min + EVENTS.stop.min);
    expect(r.state.energy).toBe(40 + x.fx.energy!);
    expect(r.state.deck.stops).toEqual(['hotspring']);
    const back = act({ ...r.state, encounter: { kind: 'stop', id: 'hotspring' } }, { t: 'answer', opt: 0 });
    expect(back.state.energy - r.state.energy).toBe(Math.round(x.fx.energy! * EVENTS.stop.again));
    // Or keep driving, and nothing.
    const on = act(s, { t: 'answer', opt: 1 });
    expect(on.state.min).toBe(s.min);
    expect(on.state.deck.stops).toEqual([]);
  });

  it('sends a hitchhiker you were good to to your breakdown, never the two who took from you', () => {
    const met = (id: string, i: number) => base({ deck: { ...base().deck, met: { [id]: i } } });
    let found = false;
    for (let day = 3; day < 60 && !found; day++) {
      const s = { ...met('nurse', 1), day };
      const h = hitchFriend(s);
      if (h) {
        expect(h.id).toBe('nurse');
        found = true;
      }
      expect(hitchFriend({ ...met('thief', 0), day })).toBeNull();
      expect(hitchFriend({ ...met('grifter', 0), day })).toBeNull();
    }
    expect(found).toBe(true);
  });
});
