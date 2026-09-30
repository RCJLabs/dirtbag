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

// Saves written by earlier builds, kept byte for byte: R0's (v1), R1's (v2) and 0.960.0's
// (v3).
const V1 = readFileSync(new URL('./fixtures/save-v1.json', import.meta.url), 'utf8');
const V2 = readFileSync(new URL('./fixtures/save-v2.json', import.meta.url), 'utf8');
const V3 = readFileSync(new URL('./fixtures/save-v3.json', import.meta.url), 'utf8');
const V4 = readFileSync(new URL('./fixtures/save-v4.json', import.meta.url), 'utf8');
const V5 = readFileSync(new URL('./fixtures/save-v5.json', import.meta.url), 'utf8');
const V6 = readFileSync(new URL('./fixtures/save-v6.json', import.meta.url), 'utf8');
const V7 = readFileSync(new URL('./fixtures/save-v7.json', import.meta.url), 'utf8');
const V8 = readFileSync(new URL('./fixtures/save-v8.json', import.meta.url), 'utf8');
const V9 = readFileSync(new URL('./fixtures/save-v9.json', import.meta.url), 'utf8');
const V10 = readFileSync(new URL('./fixtures/save-v10.json', import.meta.url), 'utf8');
const V11 = readFileSync(new URL('./fixtures/save-v11.json', import.meta.url), 'utf8');
const V12 = readFileSync(new URL('./fixtures/save-v12.json', import.meta.url), 'utf8');
const V13 = readFileSync(new URL('./fixtures/save-v13.json', import.meta.url), 'utf8');
const V14 = readFileSync(new URL('./fixtures/save-v14.json', import.meta.url), 'utf8');
const V15 = readFileSync(new URL('./fixtures/save-v15.json', import.meta.url), 'utf8');
const V16 = readFileSync(new URL('./fixtures/save-v16.json', import.meta.url), 'utf8');
const V17 = readFileSync(new URL('./fixtures/save-v17.json', import.meta.url), 'utf8');
const V18 = readFileSync(new URL('./fixtures/save-v18.json', import.meta.url), 'utf8');
const V19 = readFileSync(new URL('./fixtures/save-v19.json', import.meta.url), 'utf8');
const V20 = readFileSync(new URL('./fixtures/save-v20.json', import.meta.url), 'utf8');
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
// And Phase 10.3's: no trips paid for.
const P10 = { unlocked: [] };
// And Phase 21.1's: the kit you drove out with.
const P21 = { gear: { shoes: 60, chalk: 30 } };
// And Phase 21.3's: a training block, in base from the day it loaded.
const P213 = (day: number) => ({ training: { phase: 'base', since: day, taper: null, prehab: 0 } });
// And the job ladder's: no shifts counted yet.
const JOBS0 = { jobs: {} };
// And Phase 21.5's: on no wall, away on nothing.
const P215 = { wall: null, expedition: null };
// And Phase 21.6's: no speed runs, on a rope, alive.
const P216 = { speed: { pb: null, runs: 0, day: 0 }, mode: 'rope', soloing: null, dead: null };
// Phase 22.1's week: nothing signed up for, no warnings, living as a dirtbag.
const P221 = { shifts: [], strikes: {}, benched: {}, lifestyle: 'dirtbag' };
// Phase 22.2a's van: worn from the miles on it, and running.
const P222 = { van: { tires: 70, engine: 70, battery: 70 }, breakdown: null };
// Phase 22.2b: parked at the Lot, no nights counted, no driveway.
const P222B = { spot: 'lot', lotNights: 0, driveway: 0 };
// Phase 22.3: an empty pantry, no meals remembered, not fueled.
const P223 = { pantry: {}, meals: [], fueled: 0 };
// Phase 22.4a: the catastrophic plan everyone had, never jabbed.
const P224 = { insurance: 'catastrophic', jab: 0 };
// Phase 22.4b: no marks, no flare, no fear.
const P224B = { scars: [], flare: null, fear: [] };
// Phase 22.4c: supplies at a new climber's, and well.
const P224C = { supplies: 80, sick: null };
const P224D = { psyche: { level: 50, stale: 0 }, crags: [] };
const P225A = { seen: [] };
const P225B = { guitar: 0 };
const P226A = {
  deck: { last: 0, knock: 0, seen: [], hitch: 0, stop: 0, stops: [], met: {} },
  encounter: null,
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
      ...P10,
      ...P21,
      ...P213(old.day),
      ...JOBS0,
      ...P215,
      ...P216,
      ...P221,
      ...P222,
      ...P222B,
      ...P223,
      ...P224,
      ...P224B,
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
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
    expect(r.state).toEqual({
      ...JSON.parse(V2).state,
      ...R2_BODY,
      ...P10,
      ...P21,
      ...P213(JSON.parse(V2).state.day),
      ...JOBS0,
      ...P215,
      ...P216,
      ...P221,
      ...P222,
      ...P222B,
      ...P223,
      ...P224,
      ...P224B,
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
    });
    expect(act(r.state, { t: 'travel', to: 'lot' }).events.some((e) => e.k === 'refused')).toBe(false);
  });

  it('load a real 0.960.0 save: everything kept, and no trips paid for', () => {
    const r = fromSave(V3);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(3);
    expect(r.state).toEqual({
      ...JSON.parse(V3).state,
      ...P10,
      ...P21,
      ...P213(JSON.parse(V3).state.day),
      ...JOBS0,
      ...P215,
      ...P216,
      ...P221,
      ...P222,
      ...P222B,
      ...P223,
      ...P224,
      ...P224B,
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
    });
    expect(act(r.state, { t: 'travel', to: 'road' }).events.some((e) => e.k === 'refused')).toBe(false);
  });

  it('load a real 0.961.0 save: everything kept, and the kit you drove out with', () => {
    const r = fromSave(V4);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(4);
    expect(r.state).toEqual({
      ...JSON.parse(V4).state,
      ...P21,
      ...P213(JSON.parse(V4).state.day),
      ...JOBS0,
      ...P215,
      ...P216,
      ...P221,
      ...P222,
      ...P222B,
      ...P223,
      ...P224,
      ...P224B,
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
    });
    expect(act(r.state, { t: 'travel', to: 'lot' }).events.some((e) => e.k === 'refused')).toBe(false);
  });

  it('load a real Phase 21.2 save: everything kept, the rack too, and a training block', () => {
    const r = fromSave(V5);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(5);
    const old = JSON.parse(V5).state;
    expect(r.state).toEqual({
      ...old,
      ...P213(old.day),
      ...JOBS0,
      ...P215,
      ...P216,
      ...P221,
      ...P222,
      ...P222B,
      ...P223,
      ...P224,
      ...P224B,
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
    });
    expect(r.state.gear.rack).toBe(1);
    expect(act(r.state, { t: 'travel', to: 'lot' }).events.some((e) => e.k === 'refused')).toBe(false);
  });

  it('load a real Phase 21.4 save: everything kept, prehab and all, and no shifts counted', () => {
    const r = fromSave(V6);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(6);
    const old = JSON.parse(V6).state;
    expect(r.state).toEqual({
      ...old,
      ...JOBS0,
      ...P215,
      ...P216,
      ...P221,
      ...P222,
      ...P222B,
      ...P223,
      ...P224,
      ...P224B,
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
    });
    expect(r.state.training.prehab).toBeGreaterThan(0);
    expect(act(r.state, { t: 'travel', to: 'cafe' }).events.some((e) => e.k === 'refused')).toBe(false);
  });

  it('load a real Phase 21.4 save with shifts: everything kept, on no wall, away on nothing', () => {
    const r = fromSave(V7);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(7);
    expect(r.state).toEqual({
      ...JSON.parse(V7).state,
      ...P215,
      ...P216,
      ...P221,
      ...P222,
      ...P222B,
      ...P223,
      ...P224,
      ...P224B,
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
    });
    expect(r.state.jobs.cafe).toBe(2);
  });

  it('load a real Phase 21.6 save from before Free Solo: everything kept, on a rope, no runs', () => {
    const r = fromSave(V8);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(8);
    expect(r.state).toEqual({
      ...JSON.parse(V8).state,
      ...P216,
      ...P221,
      ...P222,
      ...P222B,
      ...P223,
      ...P224,
      ...P224B,
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
    });
    expect(r.state.routes.warm?.goes).toBe(1);
  });

  it('load a real 0.963.0 save from before the week: shifts kept, nothing signed up for', () => {
    const r = fromSave(V9);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(9);
    expect(r.state).toEqual({
      ...JSON.parse(V9).state,
      ...P221,
      ...P222,
      ...P222B,
      ...P223,
      ...P224,
      ...P224B,
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
    });
    expect(r.state.jobs.cafe).toBe(1);
  });

  it('load a real 0.964.0 save from before the van wore: the week kept, the van worn and running', () => {
    const r = fromSave(V10);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(10);
    expect(r.state).toEqual({
      ...JSON.parse(V10).state,
      ...P222,
      ...P222B,
      ...P223,
      ...P224,
      ...P224B,
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
    });
    expect(r.state.lifestyle).toBe('comfortable');
    expect(r.state.shifts).toEqual([{ job: 'cafe', day: 2 }]);
  });

  it('load a real 0.965.0 save from before you chose a spot: the van kept, parked at the Lot', () => {
    const r = fromSave(V11);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(11);
    expect(r.state).toEqual({
      ...JSON.parse(V11).state,
      ...P222B,
      ...P223,
      ...P224,
      ...P224B,
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
    });
    expect(r.state.van.tires).toBeLessThan(85);
  });

  it('load a real 0.967.1 save from before food: parked where it was, an empty pantry', () => {
    const r = fromSave(V12);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(12);
    expect(r.state).toEqual({
      ...JSON.parse(V12).state,
      ...P223,
      ...P224,
      ...P224B,
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
    });
    expect(r.state.spot).toBe('trailhead');
  });

  it('load a real 0.969.0 save from before the insurance plans: the pantry kept, catastrophic', () => {
    const r = fromSave(V13);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(13);
    expect(r.state).toEqual({
      ...JSON.parse(V13).state,
      ...P224,
      ...P224B,
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
    });
    expect(r.state.pantry.rice).toBe(4);
  });

  it('load a real 0.970.0 save from before old injuries: the plan kept, no marks and no fear', () => {
    const r = fromSave(V14);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(14);
    expect(r.state).toEqual({
      ...JSON.parse(V14).state,
      ...P224B,
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
    });
    expect(r.state.insurance).toBe('full');
  });

  it('load a real 0.971.0 save from before supplies: marks and fears kept, supplies at 80', () => {
    const r = fromSave(V15);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(15);
    expect(r.state).toEqual({ ...JSON.parse(V15).state, ...P224C, ...P224D, ...P225A, ...P225B, ...P226A });
    expect(r.state.scars).toEqual(['fingers']);
  });

  it('load a real 0.972.0 save from before psyche: sick and low kept, psyche even', () => {
    const r = fromSave(V16);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(16);
    expect(r.state).toEqual({ ...JSON.parse(V16).state, ...P224D, ...P225A, ...P225B, ...P226A });
    expect(r.state.sick).toEqual({ kind: 'cold', until: 4 });
    // It had been to the Road: going back isn't somewhere new.
    const back = act(r.state, { t: 'travel', to: 'road' }).state;
    expect(back.today).toContain('crag');
    expect(back.today).not.toContain('new-crag');
  });

  it('load a real 0.973.0 save from before the hustle: psyche and crags kept, nothing seen', () => {
    const r = fromSave(V17);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(17);
    expect(r.state).toEqual({ ...JSON.parse(V17).state, ...P225A, ...P225B, ...P226A });
    expect(r.state.psyche).toEqual({ level: 41, stale: 2 });
    expect(r.state.crags).toEqual(['road']);
    // It's hungry and broke: the next thing it does, it's told where the net is, once.
    const next = act(r.state, { t: 'act', act: 'lot.rest' });
    expect(next.state.seen).toEqual(['hustle']);
  });

  it('load a real 0.974.0 save from before busking: the hustle kept, no sets played', () => {
    const r = fromSave(V18);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(18);
    expect(r.state).toEqual({ ...JSON.parse(V18).state, ...P225B, ...P226A });
    expect(r.state.seen).toEqual(['hustle']);
    expect(r.state.today).toContain('cans');
  });

  it('load a real 0.975.0 save from before the knocks: the guitar kept, nobody at the door', () => {
    const r = fromSave(V19);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(19);
    expect(r.state).toEqual({ ...JSON.parse(V19).state, ...P226A });
    expect(r.state.guitar).toBe(12.5);
    expect(r.state.spot).toBe('driveway');
  });

  it('load a real 0.976.0 save from before the road: its knocks kept, nobody picked up', () => {
    const r = fromSave(V20);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(20);
    expect(r.state.deck).toEqual({
      last: 7,
      knock: 7,
      seen: ['jump'],
      hitch: 0,
      stop: 0,
      stops: [],
      met: {},
    });
    expect(r.state).toEqual({ ...JSON.parse(V20).state, deck: r.state.deck });
  });

  // These pretend a longer history: a v1 file that stored `money` where the state now has
  // `cash`, loaded by a build two versions on, with test migrations in place of the real ones.
  it('run the migration chain in order, and stop at a gap or a throw', () => {
    const s = played();
    const old = { ...s, money: s.cash } as Record<string, unknown>;
    delete old.cash;
    const file = JSON.stringify({ format: 'dirtbag', v: 1, app: 'old', state: old });
    expect(SAVE_VERSION).toBe(21);
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
