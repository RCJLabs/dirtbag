import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, newGame, talkStart } from './game';
import { fromSave, MIGRATIONS, SAVE_VERSION, toSave, validate, type Migration } from './save';
import type { Action } from './types';
import { ageOf, daysLeft } from './age';
import { currentGoal } from './story';
import { AGE } from './dials';

const played = () => {
  let s = newGame('save-test');
  const acts: Action[] = [
    { t: 'create', name: 'Sam', start: 'ropegun' },
    { t: 'say', talk: 'hazel-lot', node: 'morning', opt: 0 },
    { t: 'travel', to: 'road' },
    { t: 'go', route: 'warm' },
    { t: 'done', route: 'warm', result: { sent: false, hi: 4, fellAt: 'A', tried: ['A1'], skin: 4 } },
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
// v41 (Phase 17.3): everyone an older save had met, it had spoken to.
const spoken = <T extends { people?: Record<string, object> }>(st: T): T => ({
  ...st,
  people: Object.fromEntries(Object.entries(st.people ?? {}).map(([k, p]) => [k, { ...p, talked: true }])),
});
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
const V21 = readFileSync(new URL('./fixtures/save-v21.json', import.meta.url), 'utf8');
const V22 = readFileSync(new URL('./fixtures/save-v22.json', import.meta.url), 'utf8');
const V23 = readFileSync(new URL('./fixtures/save-v23.json', import.meta.url), 'utf8');
const V24 = readFileSync(new URL('./fixtures/save-v24.json', import.meta.url), 'utf8');
const V25 = readFileSync(new URL('./fixtures/save-v25.json', import.meta.url), 'utf8');
const V26 = readFileSync(new URL('./fixtures/save-v26.json', import.meta.url), 'utf8');
const V27 = readFileSync(new URL('./fixtures/save-v27.json', import.meta.url), 'utf8');
const V28 = readFileSync(new URL('./fixtures/save-v28.json', import.meta.url), 'utf8');
const V29 = readFileSync(new URL('./fixtures/save-v29.json', import.meta.url), 'utf8');
const V30 = readFileSync(new URL('./fixtures/save-v30.json', import.meta.url), 'utf8');
const V31 = readFileSync(new URL('./fixtures/save-v31.json', import.meta.url), 'utf8');
const V32 = readFileSync(new URL('./fixtures/save-v32.json', import.meta.url), 'utf8');
const V33 = readFileSync(new URL('./fixtures/save-v33.json', import.meta.url), 'utf8');
const V34 = readFileSync(new URL('./fixtures/save-v34.json', import.meta.url), 'utf8');
const V35 = readFileSync(new URL('./fixtures/save-v35.json', import.meta.url), 'utf8');
const V36 = readFileSync(new URL('./fixtures/save-v36.json', import.meta.url), 'utf8');
const V37 = readFileSync(new URL('./fixtures/save-v37.json', import.meta.url), 'utf8');
const V38 = readFileSync(new URL('./fixtures/save-v38.json', import.meta.url), 'utf8');
const V39 = readFileSync(new URL('./fixtures/save-v39.json', import.meta.url), 'utf8');
const V40 = readFileSync(new URL('./fixtures/save-v40.json', import.meta.url), 'utf8');
const V41 = readFileSync(new URL('./fixtures/save-v41.json', import.meta.url), 'utf8');
const V42 = readFileSync(new URL('./fixtures/save-v42.json', import.meta.url), 'utf8');
const V43 = readFileSync(new URL('./fixtures/save-v43.json', import.meta.url), 'utf8');
const V44 = readFileSync(new URL('./fixtures/save-v44.json', import.meta.url), 'utf8');
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
  deck: { last: 0, knock: 0, seen: [], hitch: 0, stop: 0, stops: [], met: {}, epic: 0 },
  encounter: null,
  dogs: [],
  dream: { pick: null, pot: 0, owned: [] },
  table: null,
  cards: null,
  reads: {},
  booked: null,
  book: [],
  record: expect.any(Object),
  origin: null,
  talents: expect.any(Object),
  calling: { id: null, since: 0, rungs: [], offered: false },
  paths: { tiers: {}, told: [] },
  mastery: expect.any(Array),
  quirk: null,
  habits: expect.any(Object),
  scene: { old: 50, gym: 50, stances: [], echoes: [], last: 0, echoLast: 0 },
  board: { week: 0, jobs: [], shifts0: 0, sessions: 0 },
  year: expect.any(Object),
  life: expect.any(Object),
  family: null,
  romance: null,
  folks: { calls: 0 },
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
    const old = spoken(JSON.parse(V1).state);
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
      ...spoken(JSON.parse(V2).state),
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
      ...spoken(JSON.parse(V3).state),
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
      ...spoken(JSON.parse(V4).state),
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
    const old = spoken(JSON.parse(V5).state);
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
    const old = spoken(JSON.parse(V6).state);
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
      ...spoken(JSON.parse(V7).state),
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
      ...spoken(JSON.parse(V8).state),
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
      ...spoken(JSON.parse(V9).state),
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
      ...spoken(JSON.parse(V10).state),
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
      ...spoken(JSON.parse(V11).state),
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
      ...spoken(JSON.parse(V12).state),
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
      ...spoken(JSON.parse(V13).state),
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
      ...spoken(JSON.parse(V14).state),
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
    expect(r.state).toEqual({
      ...spoken(JSON.parse(V15).state),
      ...P224C,
      ...P224D,
      ...P225A,
      ...P225B,
      ...P226A,
    });
    expect(r.state.scars).toEqual(['fingers']);
  });

  it('load a real 0.972.0 save from before psyche: sick and low kept, psyche even', () => {
    const r = fromSave(V16);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(16);
    expect(r.state).toEqual({ ...spoken(JSON.parse(V16).state), ...P224D, ...P225A, ...P225B, ...P226A });
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
    expect(r.state).toEqual({ ...spoken(JSON.parse(V17).state), ...P225A, ...P225B, ...P226A });
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
    expect(r.state).toEqual({ ...spoken(JSON.parse(V18).state), ...P225B, ...P226A });
    expect(r.state.seen).toEqual(['hustle']);
    expect(r.state.today).toContain('cans');
  });

  it('load a real 0.975.0 save from before the knocks: the guitar kept, nobody at the door', () => {
    const r = fromSave(V19);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(19);
    expect(r.state).toEqual({ ...spoken(JSON.parse(V19).state), ...P226A });
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
      epic: 0,
    });
    expect(r.state).toEqual({
      ...spoken(JSON.parse(V20).state),
      deck: r.state.deck,
      dogs: [],
      dream: { pick: null, pot: 0, owned: [] },
      table: null,
      cards: null,
      reads: {},
      booked: null,
      book: [],
      record: expect.any(Object),
      origin: null,
      talents: expect.any(Object),
      calling: { id: null, since: 0, rungs: [], offered: false },
      paths: { tiers: {}, told: [] },
      mastery: expect.any(Array),
      quirk: null,
      habits: expect.any(Object),
      scene: { old: 50, gym: 50, stances: [], echoes: [], last: 0, echoLast: 0 },
      board: { week: 0, jobs: [], shifts0: 0, sessions: 0 },
      year: expect.any(Object),
      life: expect.any(Object),
      family: null,
      romance: null,
      folks: { calls: 0 },
    });
  });

  it('load a real 0.977.0 save from before the walk-outs: the road kept, no walk-out yet', () => {
    const r = fromSave(V21);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(21);
    const old = spoken(JSON.parse(V21).state);
    expect(r.state).toEqual({
      ...old,
      deck: { ...old.deck, epic: 0 },
      dogs: [],
      dream: { pick: null, pot: 0, owned: [] },
      table: null,
      cards: null,
      reads: {},
      booked: null,
      book: [],
      record: expect.any(Object),
      origin: null,
      talents: expect.any(Object),
      calling: { id: null, since: 0, rungs: [], offered: false },
      paths: { tiers: {}, told: [] },
      mastery: expect.any(Array),
      quirk: null,
      habits: expect.any(Object),
      scene: { old: 50, gym: 50, stances: [], echoes: [], last: 0, echoLast: 0 },
      board: { week: 0, jobs: [], shifts0: 0, sessions: 0 },
      year: expect.any(Object),
      life: expect.any(Object),
      family: null,
      romance: null,
      folks: { calls: 0 },
    });
    expect(r.state.deck.met).toEqual({ busker: 2 });
  });

  it('load a real 0.978.0 save with a dog: Scout kept, aging from the day he picked you', () => {
    const r = fromSave(V22);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(22);
    expect(r.state).toEqual({
      ...spoken(JSON.parse(V22).state),
      dogs: [],
      dream: { pick: null, pot: 0, owned: [] },
      table: null,
      cards: null,
      reads: {},
      booked: null,
      book: [],
      record: expect.any(Object),
      origin: null,
      talents: expect.any(Object),
      calling: { id: null, since: 0, rungs: [], offered: false },
      paths: { tiers: {}, told: [] },
      mastery: expect.any(Array),
      quirk: null,
      habits: expect.any(Object),
      scene: { old: 50, gym: 50, stances: [], echoes: [], last: 0, echoLast: 0 },
      board: { week: 0, jobs: [], shifts0: 0, sessions: 0 },
      year: expect.any(Object),
      life: expect.any(Object),
      family: null,
      romance: null,
      folks: { calls: 0 },
    });
    expect(r.state.dog).toEqual({ name: 'Scout', since: 12, fed: 70, bond: 55 });
  });

  it('load a real 0.979.0 save from before dreams: Scout remembered, an empty jar', () => {
    const r = fromSave(V23);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(23);
    expect(r.state).toEqual({
      ...spoken(JSON.parse(V23).state),
      dream: { pick: null, pot: 0, owned: [] },
      table: null,
      cards: null,
      reads: {},
      booked: null,
      book: [],
      record: expect.any(Object),
      origin: null,
      talents: expect.any(Object),
      calling: { id: null, since: 0, rungs: [], offered: false },
      paths: { tiers: {}, told: [] },
      mastery: expect.any(Array),
      quirk: null,
      habits: expect.any(Object),
      scene: { old: 50, gym: 50, stances: [], echoes: [], last: 0, echoLast: 0 },
      board: { week: 0, jobs: [], shifts0: 0, sessions: 0 },
      year: expect.any(Object),
      life: expect.any(Object),
      family: null,
      romance: null,
      folks: { calls: 0 },
    });
    expect(r.state.dogs).toEqual([{ name: 'Scout', years: 16, day: 301 }]);
  });

  it('load a real 0.980.0 save from before the games: the jar kept, no hand on the go', () => {
    const r = fromSave(V24);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(24);
    expect(r.state).toEqual({
      ...spoken(JSON.parse(V24).state),
      table: null,
      cards: null,
      reads: {},
      booked: null,
      book: [],
      record: expect.any(Object),
      origin: null,
      talents: expect.any(Object),
      calling: { id: null, since: 0, rungs: [], offered: false },
      paths: { tiers: {}, told: [] },
      mastery: expect.any(Array),
      quirk: null,
      habits: expect.any(Object),
      scene: { old: 50, gym: 50, stances: [], echoes: [], last: 0, echoLast: 0 },
      board: { week: 0, jobs: [], shifts0: 0, sessions: 0 },
      year: expect.any(Object),
      life: expect.any(Object),
      family: null,
      romance: null,
      folks: { calls: 0 },
    });
    expect(r.state.dream).toEqual({ pick: 'rig', pot: 300, owned: [] });
  });

  it('load a real 0.981.0 save from before the cards: a hand of dice still on the go', () => {
    const r = fromSave(V25);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(25);
    expect(r.state).toEqual({
      ...spoken(JSON.parse(V25).state),
      cards: null,
      reads: {},
      booked: null,
      book: [],
      record: expect.any(Object),
      origin: null,
      talents: expect.any(Object),
      calling: { id: null, since: 0, rungs: [], offered: false },
      paths: { tiers: {}, told: [] },
      mastery: expect.any(Array),
      quirk: null,
      habits: expect.any(Object),
      scene: { old: 50, gym: 50, stances: [], echoes: [], last: 0, echoLast: 0 },
      board: { week: 0, jobs: [], shifts0: 0, sessions: 0 },
      year: expect.any(Object),
      life: expect.any(Object),
      family: null,
      romance: null,
      folks: { calls: 0 },
    });
    expect(r.state.table?.who).toBe('hazel');
  });

  it('load a real 0.984.0 save away on El Cap: the trip kept, roped to Hazel, nights counted', () => {
    const r = fromSave(V26);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(26);
    const old = spoken(JSON.parse(V26).state);
    expect(old.expedition).toEqual({ id: 'elcap', day: 3, pitch: 0, energy: 100 });
    expect(r.state).toEqual({
      ...old,
      expedition: {
        id: 'elcap',
        day: 3,
        pitch: 0,
        partner: 'hazel',
        nights: 2,
        food: 7,
        ledge: true,
        stove: false,
        seen: [],
      },
      booked: null,
      book: [],
      record: expect.any(Object),
      origin: null,
      talents: expect.any(Object),
      calling: { id: null, since: 0, rungs: [], offered: false },
      paths: { tiers: {}, told: [] },
      mastery: expect.any(Array),
      quirk: null,
      habits: expect.any(Object),
      scene: { old: 50, gym: 50, stances: [], echoes: [], last: 0, echoLast: 0 },
      board: { week: 0, jobs: [], shifts0: 0, sessions: 0 },
      year: expect.any(Object),
      life: expect.any(Object),
      family: null,
      romance: null,
      folks: { calls: 0 },
    });
  });

  it('load a real 0.985.0 save up Cerro Torre: food for the days left, the ledge and a stove', () => {
    const r = fromSave(V27);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(27);
    const old = spoken(JSON.parse(V27).state);
    expect(r.state).toEqual({
      ...old,
      expedition: { ...old.expedition, food: 14, ledge: true, stove: true, seen: [] },
      booked: null,
      book: [],
      record: expect.any(Object),
      origin: null,
      talents: expect.any(Object),
      calling: { id: null, since: 0, rungs: [], offered: false },
      paths: { tiers: {}, told: [] },
      mastery: expect.any(Array),
      quirk: null,
      habits: expect.any(Object),
      scene: { old: 50, gym: 50, stances: [], echoes: [], last: 0, echoLast: 0 },
      board: { week: 0, jobs: [], shifts0: 0, sessions: 0 },
      year: expect.any(Object),
      life: expect.any(Object),
      family: null,
      romance: null,
      folks: { calls: 0 },
    });
  });

  it('load a real 0.987.0 save a night up El Cap: the trip kept, nothing yet happened up there', () => {
    const r = fromSave(V28);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(28);
    const old = spoken(JSON.parse(V28).state);
    expect(old.expedition).toMatchObject({ id: 'elcap', day: 2, pitch: 1, nights: 1 });
    expect(r.state).toEqual({
      ...old,
      expedition: { ...old.expedition, seen: [] },
      book: [],
      record: expect.any(Object),
      origin: null,
      talents: expect.any(Object),
      calling: { id: null, since: 0, rungs: [], offered: false },
      paths: { tiers: {}, told: [] },
      mastery: expect.any(Array),
      quirk: null,
      habits: expect.any(Object),
      scene: { old: 50, gym: 50, stances: [], echoes: [], last: 0, echoLast: 0 },
      board: { week: 0, jobs: [], shifts0: 0, sessions: 0 },
      year: expect.any(Object),
      life: expect.any(Object),
      family: null,
      romance: null,
      folks: { calls: 0 },
    });
  });

  it('load a real 0.988.0 save a night up El Cap: an empty book, and the trip goes in it when it’s over', () => {
    const r = fromSave(V29);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(29);
    const old = spoken(JSON.parse(V29).state);
    expect(r.state).toEqual({
      ...old,
      book: [],
      record: expect.any(Object),
      origin: null,
      talents: expect.any(Object),
      calling: { id: null, since: 0, rungs: [], offered: false },
      paths: { tiers: {}, told: [] },
      mastery: expect.any(Array),
      quirk: null,
      habits: expect.any(Object),
      scene: { old: 50, gym: 50, stances: [], echoes: [], last: 0, echoLast: 0 },
      board: { week: 0, jobs: [], shifts0: 0, sessions: 0 },
      year: expect.any(Object),
      life: expect.any(Object),
      family: null,
      romance: null,
      folks: { calls: 0 },
    });
    const home = act(r.state, { t: 'exped', id: 'elcap', do: 'bail' }).state;
    expect(home.expedition).toBeNull();
    expect(home.book).toEqual([
      {
        id: 'elcap',
        day: home.day,
        end: 'bail',
        high: 1,
        partner: 'hazel',
        nights: 1,
        seen: [],
        told: false,
      },
    ]);
  });

  it('load a real 0.993.0 save just back from El Cap: what you’d done goes in the Record Book, quietly', () => {
    const r = fromSave(V30);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(30);
    const old = spoken(JSON.parse(V30).state);
    const {
      record,
      origin,
      talents,
      calling,
      paths,
      mastery,
      quirk,
      habits,
      scene,
      board,
      year,
      life,
      family,
      romance,
      folks,
      ...rest
    } = r.state;
    expect(rest).toEqual(old);
    expect(family).toBeNull();
    expect(origin).toBeNull();
    expect(talents.ids).toEqual([]);
    // A pitch sent outside, $3,992 in hand, close to Hazel: in the book as of the day it loaded.
    expect(Object.keys(record)).toEqual(expect.arrayContaining(['firstsend', 'outside', 'grand', 'crew']));
    expect(record.loaded).toBeUndefined();
    expect(Object.values(record).every((d) => d === old.day)).toBe(true);
  });

  it('load a real 0.994.0 save from a new climber: nowhere in particular, nothing dealt', () => {
    const r = fromSave(V31);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(31);
    const {
      origin,
      talents,
      calling,
      paths,
      mastery,
      quirk,
      habits,
      scene,
      board,
      year,
      life,
      family,
      romance,
      folks,
      ...rest
    } = r.state;
    expect(rest).toEqual(JSON.parse(V31).state);
    expect(calling.id).toBeNull();
    expect(origin).toBeNull();
    expect(talents).toEqual({ ids: [], known: [], from: rest.climber.skills });
  });

  it('load a real 0.995.0 save from a Desert Local: talents kept, no calling yet, not yet asked', () => {
    const r = fromSave(V32);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(32);
    const {
      calling,
      paths,
      mastery,
      quirk,
      habits,
      scene,
      board,
      year,
      life,
      family,
      romance,
      folks,
      ...rest
    } = r.state;
    expect(rest).toEqual(JSON.parse(V32).state);
    expect(rest.origin).toBe('desert');
    expect(calling).toEqual({ id: null, since: 0, rungs: [], offered: false });
  });

  it('load a real 0.996.0 save from a Send-or-Bust: its calling kept, no paths, habits counted from now', () => {
    const r = fromSave(V33);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(33);
    const { paths, mastery, quirk, habits, scene, board, year, life, family, romance, folks, ...rest } =
      r.state;
    expect(rest).toEqual(JSON.parse(V33).state);
    expect(rest.calling.id).toBe('sendorbust');
    expect(paths).toEqual({ tiers: {}, told: [] });
    expect(mastery).toEqual([]);
    expect(quirk).toBeNull();
    expect(habits.goes).toBe(0);
  });

  it('load a real 0.997.0 save from a Night Owl: its quirk kept, even with both crowds', () => {
    const r = fromSave(V34);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(34);
    const { scene, board, year, life, family, romance, folks, ...rest } = r.state;
    expect(rest).toEqual(JSON.parse(V34).state);
    expect(rest.quirk).toBe('nightowl');
    expect(scene).toEqual({ old: 50, gym: 50, stances: [], echoes: [], last: 0, echoLast: 0 });
  });

  it('load a real 0.998.0 save mid-season: where you stand kept, the board up on the next thing you do', () => {
    const r = fromSave(V35);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(35);
    const { board, year, life, family, romance, folks, ...rest } = r.state;
    expect(rest).toEqual(JSON.parse(V35).state);
    expect(rest.scene.old).toBe(62);
    expect(board).toEqual({ week: 0, jobs: [], shifts0: 0, sessions: 0 });
  });

  it('load a real 0.999.0 save past its first year: that year counts as recapped, quietly; no Homecoming', () => {
    const r = fromSave(V36);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(36);
    const { year, life, family, romance, folks, ...rest } = r.state;
    expect(rest).toEqual(JSON.parse(V36).state);
    expect(rest.day).toBe(70);
    expect(year).toEqual({ recapped: 1, home: 'none' });
  });

  it('load a real 0.999.3 save at day 400: the clock held back to 43, so the countdown starts on loading', () => {
    const r = fromSave(V37);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(37);
    const { life, family, romance, folks, ...rest } = r.state;
    expect(rest).toEqual(JSON.parse(V37).state);
    expect(family).toBeNull();
    // Day 400 would be 44 on a new climber's clock; held back 21 days, it's 43, told.
    expect(life).toEqual({ held: 21, told: 43, retired: null });
    expect(ageOf(r.state)).toBe(43);
    expect(daysLeft(r.state)).toBe(AGE.days * 2);
  });

  it('load a real 0.999.4 save past Act I: on, quietly, past the stages of Act II it had already done', () => {
    const r = fromSave(V38);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(38);
    const { goals, family, romance, folks, ...rest } = r.state;
    expect(family).toBeNull();
    const { goals: was, ...old } = JSON.parse(V38).state;
    expect(rest).toEqual(old);
    expect(was).toBe(5);
    // Three lines outside at V4 and up, two of them at the Gorge: earning trust and getting
    // past Roadside, done; proving V6, not yet. No pay, no cards: the cash is as it was.
    expect(goals).toBe(7);
    expect(currentGoal(r.state)?.id).toBe('prove');
  });

  it('load a real 0.999.7 save: everything kept, the first of its family', () => {
    const r = fromSave(V39);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(39);
    const { family, romance, folks, ...rest } = r.state;
    expect(rest).toEqual(JSON.parse(V39).state);
    expect(family).toBeNull();
  });

  it('load a real 0.999.12 save: everyone met counts as spoken to, and nobody’s life has moved on', () => {
    const r = fromSave(V40);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(40);
    const old = JSON.parse(V40).state;
    const { people, romance, folks, ...rest } = r.state;
    const { people: was, ...before } = old;
    expect(rest).toEqual(before);
    // Mara had belayed you without a word; the save can't tell, so her meeting doesn't replay.
    expect(Object.keys(people).sort()).toEqual(Object.keys(was).sort());
    for (const [id, p] of Object.entries(people)) {
      expect(p).toEqual({ ...was[id], talked: true });
      expect(p.life).toBeUndefined();
    }
  });

  it('load a real 0.999.13 save: close to Sage and Mara, with nobody yet, and no spark offered', () => {
    const r = fromSave(V41);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(41);
    const { romance, folks, ...rest } = r.state;
    expect(rest).toEqual(JSON.parse(V41).state);
    expect(romance).toBeNull();
    // Sage at Ride-or-Die, Mara a Partner: either spark can come now.
    expect(talkStart(r.state, 'sage')).not.toBe('meet');
  });

  it('load a real 0.999.14 save: with Mara, a line named, and nothing given yet', () => {
    const r = fromSave(V42);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(42);
    const { folks, ...rest } = r.state;
    expect(rest).toEqual(JSON.parse(V42).state);
    expect(folks).toEqual({ calls: 0 });
    expect(r.state.romance).toMatchObject({ who: 'mara', stage: 3 });
    expect(Object.values(r.state.people).every((p) => p.gave === undefined)).toBe(true);
    expect(r.state.firsts.rsopen!.for).toBeUndefined();
  });

  it('load a real 0.999.15 save: a gift given, and nobody’s called from home yet', () => {
    const r = fromSave(V43);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(43);
    const { folks, ...rest } = r.state;
    expect(rest).toEqual(JSON.parse(V43).state);
    expect(folks).toEqual({ calls: 0 });
    expect(r.state.people.frank!.gave).toBe(55);
  });

  it('load a real 0.999.16 save: two calls from home, and nobody’s fire lines heard in order yet', () => {
    const r = fromSave(V44);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(44);
    expect(r.state).toEqual(JSON.parse(V44).state);
    expect(r.state.folks).toEqual({ calls: 2 });
    expect(Object.values(r.state.people).every((p) => p.heard === undefined)).toBe(true);
  });

  // These pretend a longer history: a v1 file that stored `money` where the state now has
  // `cash`, loaded by a build two versions on, with test migrations in place of the real ones.
  it('run the migration chain in order, and stop at a gap or a throw', () => {
    const s = played();
    const old = { ...s, money: s.cash } as Record<string, unknown>;
    delete old.cash;
    const file = JSON.stringify({ format: 'dirtbag', v: 1, app: 'old', state: old });
    expect(SAVE_VERSION).toBe(45);
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
