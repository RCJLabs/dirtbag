import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, newGame } from './game';
import { fromSave, MIGRATIONS, SAVE_VERSION, toSave, validate, type Migration } from './save';
import type { Action } from './types';

const played = () => {
  let s = newGame('save-test');
  const acts: Action[] = [
    { t: 'create', name: 'Sam', start: 'ropegun' },
    { t: 'say', talk: 'hazel-lot', node: 'morning', opt: 0 },
    { t: 'travel', to: 'road' },
    { t: 'go', route: 'pump' },
    { t: 'done', route: 'pump', result: { sent: false, hi: 5, fellAt: 'A', tried: ['A1'], skin: 4 } },
  ];
  for (const a of acts) {
    const r = act(s, a);
    if (r.events.some((e) => e.k === 'refused')) throw new Error(JSON.stringify(r.events));
    s = r.state;
  }
  return s;
};

// Saves written by earlier builds, kept byte for byte: R0's (v1) and R1's (v2).
const V1 = readFileSync(new URL('./fixtures/save-v1.json', import.meta.url), 'utf8');
const V2 = readFileSync(new URL('./fixtures/save-v2.json', import.meta.url), 'utf8');
// What R2's migration adds to any older save.
const R2_BODY = {
  load: { acute: 20, chronic: 20, today: 0 },
  injury: null,
  hurt: 0,
  firsts: {},
  race: null,
  trips: 0,
  dog: null,
  goals: 0,
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
    const badClimber = { ...s, fed: -1, climber: { ...s.climber, start: 'soloist', skills: { power: 1 } } };
    expect(validate(badClimber)).toEqual([
      'fed',
      'climber.start',
      'climber.skills.fingers',
      'climber.skills.endurance',
      'climber.skills.technique',
      'climber.skills.head',
    ]);
    expect(validate({ ...s, people: { sage: { bond: -1, last: 0 } } })).toEqual(['people.sage']);
  });

  it('load a real R0 save: its routes and beta kept, a climber still to make', () => {
    const r = fromSave(V1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(1);
    const old = JSON.parse(V1).state;
    expect(r.state).toEqual({
      ...old,
      fed: 80,
      climber: {
        name: '',
        start: 'allrounder',
        skills: { power: 8, fingers: 8, endurance: 8, technique: 8, head: 8 },
      },
      people: {},
      ...R2_BODY,
    });
    // And it plays on: the new rules accept it.
    const made = act(r.state, { t: 'create', name: 'Sam', start: 'boulderer' });
    expect(made.events).toEqual([]);
    expect(MIGRATIONS[1]).toBeTypeOf('function');
  });

  it('load a real R1 save: a climber, bonds and all, with R2’s body added', () => {
    const r = fromSave(V2);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(2);
    expect(r.state).toEqual({ ...JSON.parse(V2).state, ...R2_BODY });
    expect(act(r.state, { t: 'travel', to: 'lot' }).events.some((e) => e.k === 'refused')).toBe(false);
  });

  // These pretend a longer history: a v1 file that stored `money` where the state now has
  // `cash`, loaded by a build two versions on, with test migrations in place of the real ones.
  it('run the migration chain in order, and stop at a gap or a throw', () => {
    const s = played();
    const old = { ...s, money: s.cash } as Record<string, unknown>;
    delete old.cash;
    const file = JSON.stringify({ format: 'dirtbag', v: 1, app: 'old', state: old });
    expect(SAVE_VERSION).toBe(3);
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
