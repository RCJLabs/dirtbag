import { describe, expect, it } from 'vitest';
import { act, newGame } from './game';
import { fromSave, SAVE_VERSION, toSave, validate, type Migration } from './save';

const played = () => {
  let s = newGame('save-test');
  for (const a of [
    { t: 'say', talk: 'hazel-lot', node: 'morning', opt: 0 },
    { t: 'travel', to: 'road' },
    { t: 'go', route: 'pump' },
    { t: 'done', route: 'pump', result: { sent: false, hi: 5, fellAt: 'A', skin: 4 } },
  ] as const)
    s = act(s, a).state;
  return s;
};

describe('saves', () => {
  it('round-trip a played game exactly', () => {
    const s = played();
    const r = fromSave(toSave(s, '0.1.0'));
    expect(r).toEqual({ ok: true, state: s, from: SAVE_VERSION });
  });

  it('say why they failed instead of handing back a fresh game', () => {
    expect(fromSave('{"format":"dirtbag","v":1,"sta')).toEqual({ ok: false, why: 'not JSON' });
    expect(fromSave('{"v":1}')).toEqual({ ok: false, why: 'not a Dirtbag save' });
    expect(fromSave('{"format":"dirtbag","v":"1"}')).toEqual({ ok: false, why: 'no version' });
    const newer = fromSave(JSON.stringify({ format: 'dirtbag', v: SAVE_VERSION + 1, app: 'x', state: {} }));
    expect(newer.ok).toBe(false);
    expect(!newer.ok && newer.why).toMatch(/newer build/);
  });

  it('reject a state that is out of shape or out of range, naming the field', () => {
    const s = played();
    expect(validate(s)).toEqual([]);
    const bad = fromSave(toSave({ ...s, energy: 150, at: 'narnia' }, 'x'));
    expect(bad).toEqual({ ok: false, why: 'invalid: energy; at' });
    const badRoute = JSON.parse(toSave(s, 'x'));
    badRoute.state.routes.pump.falls.A = -1;
    expect(fromSave(JSON.stringify(badRoute))).toEqual({ ok: false, why: 'invalid: routes.pump.falls' });
  });

  // SAVE_VERSION is still 1, so these tests pretend: a v1 file that stored `money` where
  // the state now has `cash`, loaded by a build two versions later.
  it('run the migration chain in order, and stop at a gap or a throw', () => {
    const s = played();
    const old = { ...s, money: s.cash } as Record<string, unknown>;
    delete old.cash;
    const file = JSON.stringify({ format: 'dirtbag', v: 1, app: 'old', state: old });
    const chain: Record<number, Migration> = {
      1: (x) => {
        const { money, ...rest } = x as Record<string, unknown>;
        return { ...rest, cash: money };
      },
      2: (x) => x,
    };
    expect(fromSave(file, chain, 3)).toEqual({ ok: true, state: s, from: 1 });
    expect(fromSave(file, { 1: chain[1]! }, 3)).toEqual({ ok: false, why: 'no migration from v2' });
    const boom = fromSave(
      file,
      {
        ...chain,
        2: () => {
          throw new Error('boom');
        },
      },
      3,
    );
    expect(boom).toEqual({ ok: false, why: 'migration from v2 failed: boom' });
  });
});
