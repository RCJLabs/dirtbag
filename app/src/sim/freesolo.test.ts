import { needFor } from './climber';
// Phase 21.6: Free Solo and the speed wall.
import { describe, expect, it } from 'vitest';
import { betaScale } from './climb';
import { ROUTES, WALLS } from './content/routes';
import { FREESOLO, SPEED } from './dials';
import { act, goBlocked, newGame, unfinishedSolo } from './game';
import { fromSave, toSave } from './save';
import { soloed } from './solo';
import { speedFactor, speedTime } from './speed';
import type { Action, GameEvent, GameState, GoResult } from './types';

const refused = (ev: GameEvent[]) => (ev.find((e) => e.k === 'refused') as { why?: string } | undefined)?.why;
const lines = (ev: GameEvent[]) => ev.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const sent = (r: string): GoResult => ({
  sent: true,
  hi: ROUTES[r]!.moves,
  fellAt: null,
  tried: [],
  skin: 0,
});
const fell: GoResult = { sent: false, hi: 9, fellAt: 'x', tried: [], skin: 0 };
function run(s: GameState, ...acts: Action[]): GameState {
  for (const a of acts) {
    const r = act(s, a);
    const why = refused(r.events);
    if (why) throw new Error(why);
    s = r.state;
  }
  return s;
}
const made = (solo: boolean): GameState =>
  act(
    newGame('fs'),
    solo
      ? { t: 'create', name: 'Alex', start: 'allrounder', solo: true }
      : { t: 'create', name: 'Alex', start: 'allrounder' },
  ).state;
// At Roadside at 5:30 on day 1, after Hazel has gone: nobody to belay. Two grades in every
// style, so The Pump is inside what they can try (OVER).
const k = needFor(2);
const road = (solo: boolean): GameState => {
  const s = made(solo);
  const skills = { power: k, fingers: k, endurance: k, technique: k, head: k };
  return { ...s, at: 'road', min: 17 * 60 + 30, climber: { ...s.climber, skills } };
};

describe('Free Solo', () => {
  it('is chosen at the start, and solos outdoor sport lines and wall pitches only', () => {
    expect(made(false).mode).toBe('rope');
    const s = made(true);
    expect(s.mode).toBe('solo');
    expect(soloed(s, ROUTES.pump!)).toBe(true);
    expect(soloed(s, ROUTES[WALLS.prow!.pitches[0]!]!)).toBe(true);
    expect(soloed(s, ROUTES.tradarete!)).toBe(false);
    expect(soloed(s, ROUTES.warm!)).toBe(false);
    expect(soloed(made(false), ROUTES.pump!)).toBe(false);
  });

  it('needs no belayer or rope, and climbs tighter', () => {
    expect(goBlocked(road(false), ROUTES.pump!)).toMatch(/belay/);
    expect(goBlocked(road(true), ROUTES.pump!)).toBeNull();
    const r = ROUTES.pump!;
    const b = r.cruxes[0]!.beta[0]!;
    expect(betaScale(road(true), r, b) / betaScale(road(false), r, b)).toBeCloseTo(FREESOLO.windows);
    // A wall, without a rope of your own.
    expect(refused(act(road(true), { t: 'wall', wall: 'prow', do: 'start' }).events)).toBeUndefined();
  });

  it('ends the run on a fall, and nothing more happens to that climber', () => {
    const on = run(road(true), { t: 'go', route: 'pump' });
    expect(on.soloing).toBe('pump');
    const r = act(on, { t: 'done', route: 'pump', result: fell });
    expect(r.state.dead).toEqual({ route: 'pump', day: 1, hi: 9 });
    expect(r.state.soloing).toBeNull();
    expect(lines(r.events).join(' ')).toMatch(/came off The Pump/);
    expect(refused(act(r.state, { t: 'act', act: 'road.rest' } as Action).events)).toMatch(/gone/);
  });

  it('teaches the head on a send, and can’t be reloaded out of', () => {
    const on = run(road(true), { t: 'go', route: 'pump' });
    const up = act(on, { t: 'done', route: 'pump', result: sent('pump') });
    expect(up.state.dead).toBeNull();
    expect(up.state.soloing).toBeNull();
    expect(lines(up.events).join(' ')).toMatch(/without a rope/);
    // Close the game mid-go, and open it again: you fell.
    const back = fromSave(toSave(on, 't'));
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    expect(unfinishedSolo(back.state).dead?.route).toBe('pump');
    // Boulders and a roped climber are as they were.
    expect(unfinishedSolo(up.state)).toBe(up.state);
  });
});

describe('the speed wall', () => {
  const gym = (): GameState =>
    run({ ...made(false), at: 'gym', min: 10 * 60, cash: 200 }, { t: 'act', act: 'gym.pass' });

  it('needs Send City and its pass, and costs time', () => {
    expect(refused(act({ ...made(false), at: 'lot' }, { t: 'speed', real: 3 }).events)).toMatch(/Send City/);
    expect(refused(act({ ...made(false), at: 'gym', min: 10 * 60 }, { t: 'speed', real: 3 }).events)).toMatch(
      /pass/,
    );
    const s = gym();
    const r = run(s, { t: 'speed', real: 3.2 });
    expect(r.min).toBe(s.min + SPEED.min);
    expect(r.energy).toBe(s.energy - SPEED.energy);
    expect(r.speed).toEqual({ pb: speedTime(s.climber.skills, 3.2), runs: 1, day: s.day });
  });

  it('keeps a PB, calls a false start, and stops teaching after a few', () => {
    let s = run(gym(), { t: 'speed', real: 3.5 });
    const pb = s.speed.pb!;
    s = run(s, { t: 'speed', real: 4 });
    expect(s.speed.pb).toBe(pb);
    const k = { ...s.climber.skills };
    s = run(s, { t: 'speed', real: null });
    expect(s.climber.skills).toEqual(k);
    expect(s.speed.runs).toBe(3);
    // The first `fresh` runs a day teach, false starts counted; after that, nothing.
    s = run(s, { t: 'speed', real: 3 });
    expect(s.speed.pb!).toBeLessThan(pb);
    const k2 = { ...s.climber.skills };
    s = run(s, { t: 'speed', real: 3 });
    expect(s.climber.skills).toEqual(k2);
    // A stronger climber turns the same thumbs into a faster time.
    const strong = { power: 60, fingers: 60, endurance: 60, technique: 60, head: 60 };
    expect(speedFactor(strong)).toBeLessThan(speedFactor(s.climber.skills));
    expect(speedFactor({ power: 999, fingers: 0, endurance: 0, technique: 999, head: 0 })).toBe(
      SPEED.factor.floor,
    );
  });
});
