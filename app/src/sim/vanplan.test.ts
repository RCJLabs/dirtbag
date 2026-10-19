// Phase 43: your van, laid out. What takes room has a spot: inside the van, clear of the door,
// on top of nothing; the bed needs its length, and stays in. Every piece you could own fits at once, in the van
// and in the Rig. What you get goes in where it fits, what you lose comes out, a piece you take
// out stays out, a new van starts its own plan, and a save from before loads laid out.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BUILD, UPGRADE, VAN_PLAN } from './dials';
import { act, newGame } from './game';
import { fromSave } from './save';
import type { GameState, VanPlan } from './types';
import { cellsOf, defaultPlan, fitBlocked, floorLen, isDoor, onRoof, PIECES, turns } from './vanplan';

const V81 = readFileSync(new URL('./fixtures/save-v81.json', import.meta.url), 'utf8');
const ALL = Object.fromEntries([...Object.keys(UPGRADE), ...Object.keys(BUILD)].map((id) => [id, 1]));
const at = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('vanplan'),
  climber: {
    name: 'Test',
    start: 'allrounder',
    skills: { power: 900, fingers: 900, endurance: 900, technique: 900, head: 900 },
  },
  at: 'lot',
  x: null,
  min: 10 * 60,
  ...over,
});
const refusal = (r: ReturnType<typeof act>): string | undefined =>
  r.events.flatMap((e) => (e.k === 'refused' ? [e.why] : []))[0];
// Every piece in a plan sits inside the van, off the door, and on nothing else on its layer.
function sound(len: number, plan: VanPlan): void {
  for (const [id, sp] of Object.entries(plan)) if (sp) expect(fitBlocked(len, plan, id, sp)).toBeNull();
}

describe('Phase 43: what fits where', () => {
  it('keeps a piece inside the van, off the door, and off anything else', () => {
    const len = VAN_PLAN.len;
    const plan: VanPlan = { bed: { x: len - 4, y: 0, r: 0 } };
    expect(fitBlocked(len, plan, 'kitchen', { x: 0, y: 0, r: 0 })).toBeNull();
    expect(fitBlocked(len, plan, 'kitchen', { x: len - 1, y: 0, r: 0 })).toBe('It doesn’t fit there');
    expect(fitBlocked(len, plan, 'kitchen', { x: len - 5, y: 0, r: 0 })).toBe('Something’s already there');
    const door = VAN_PLAN.door[0]!;
    expect(isDoor(door, VAN_PLAN.wide - 1)).toBe(true);
    expect(fitBlocked(len, plan, 'heater', { x: door, y: VAN_PLAN.wide - 1, r: 0 })).toBe('That’s the door');
    // The roof has no door, and the floor's pieces aren't on it.
    expect(onRoof('solar')).toBe(true);
    expect(fitBlocked(len, plan, 'solar', { x: len - 4, y: 0, r: 0 })).toBeNull();
    // A piece never sits on itself, so it can shuffle along.
    expect(fitBlocked(len, plan, 'bed', { x: len - 4, y: 0, r: 0 })).toBeNull();
  });

  it('turns what can turn, and the bed can’t: it needs its length', () => {
    expect(cellsOf('kitchen', { x: 0, y: 0, r: 1 })).toEqual([
      [0, 0],
      [0, 1],
    ]);
    for (let x = 0; x < VAN_PLAN.rig; x++)
      expect(fitBlocked(VAN_PLAN.rig, {}, 'bed', { x, y: 0, r: 1 })).toBe('It doesn’t fit there');
    expect(turns('bed')).toBe(false);
    expect(PIECES.filter((id) => id !== 'bed').every(turns)).toBe(true);
  });

  it('fits everything you could own at once, in the van and in the Rig', () => {
    const van = defaultPlan({ gear: ALL, dream: { pick: null, pot: 0, owned: [] } });
    expect(Object.keys(van).sort()).toEqual([...PIECES].sort());
    sound(VAN_PLAN.len, van);
    const rig = defaultPlan({ gear: ALL, dream: { pick: null, pot: 0, owned: ['rig'] } });
    expect(Object.keys(rig).sort()).toEqual([...PIECES].sort());
    sound(VAN_PLAN.rig, rig);
    // The bed across the back of each.
    expect(van.bed).toEqual({ x: VAN_PLAN.len - 4, y: 0, r: 0 });
    expect(rig.bed).toEqual({ x: VAN_PLAN.rig - 4, y: 0, r: 0 });
    // A new climber's van has the bed and nothing else.
    expect(newGame('fresh').vanPlan).toEqual({ bed: van.bed });
  });
});

describe('Phase 43: laying it out', () => {
  it('moves a piece, turns it, and refuses a spot it doesn’t fit', () => {
    const s = at({ gear: { ...newGame('x').gear, kitchen: 1 } });
    const r = act(s, { t: 'place', piece: 'kitchen', at: { x: 3, y: 1, r: 1 } });
    expect(refusal(r)).toBeUndefined();
    expect(r.state.vanPlan.kitchen).toEqual({ x: 3, y: 1, r: 1 });
    expect(r.state.min).toBe(s.min);
    expect(refusal(act(r.state, { t: 'place', piece: 'kitchen', at: { x: 5, y: 0, r: 0 } }))).toBe(
      'Something’s already there.',
    );
    expect(refusal(act(r.state, { t: 'place', piece: 'heater', at: { x: 0, y: 0, r: 0 } }))).toBe(
      'That’s not in your van.',
    );
    expect(refusal(act(r.state, { t: 'place', piece: 'kitchen', at: { x: 1.5, y: 0, r: 0 } }))).toBe(
      'Not a spot in the van.',
    );
  });

  it('keeps a piece you’ve taken out out, till you put it back', () => {
    const s = at({ gear: { ...newGame('x').gear, kitchen: 1 } });
    const out = act(s, { t: 'place', piece: 'kitchen', at: null }).state;
    expect(out.vanPlan.kitchen).toBeNull();
    // Anything else you do leaves it where you left it.
    const later = act(out, { t: 'place', piece: 'bed', at: { x: VAN_PLAN.len - 4, y: 0, r: 0 } }).state;
    expect(later.vanPlan.kitchen).toBeNull();
    const back = act(later, { t: 'place', piece: 'kitchen', at: { x: 0, y: 0, r: 0 } }).state;
    expect(back.vanPlan.kitchen).toEqual({ x: 0, y: 0, r: 0 });
    // The bed stays in: it moves, but never comes out.
    expect(refusal(act(back, { t: 'place', piece: 'bed', at: null }))).toBe(
      'The bed stays in. You sleep there.',
    );
  });

  it('puts what you get where it fits, and takes off what you lose', () => {
    const s = at({ parts: 9 });
    expect(s.vanPlan.shelf).toBeUndefined();
    const built = act(s, { t: 'act', act: 'lot.shelf' });
    expect(refusal(built)).toBeUndefined();
    const plan = built.state.vanPlan;
    expect(plan.shelf).toBeDefined();
    sound(floorLen(built.state), plan);
    // Gone (a used van keeps nothing fitted): off the plan, and the new van laid out afresh.
    const lost = act(
      { ...built.state, gear: { ...built.state.gear, shelf: 0 } },
      {
        t: 'place',
        piece: 'bed',
        at: plan.bed!,
      },
    ).state;
    expect(lost.vanPlan.shelf).toBeUndefined();
  });
});

describe('Phase 43: a save from before', () => {
  it('loads laid out, everything it owns placed as a new van would be', () => {
    const r = fromSave(V81);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(81);
    const old = JSON.parse(V81).state;
    expect(r.state).toEqual({ ...old, vanPlan: defaultPlan(old), setUp: null });
    // Every piece it owns has a spot: a v81 save with everything fitted.
    for (const id of PIECES) expect(r.state.vanPlan[id]).toBeTruthy();
    sound(floorLen(r.state), r.state.vanPlan);
  });
});
