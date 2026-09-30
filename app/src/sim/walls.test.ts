// Phase 21.5: multi-pitch walls and expeditions, each climbed and each failed (criterion 4).
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { EXPEDITIONS } from './content/expeditions';
import { WALLS } from './content/routes';
import { EXPED, WALL } from './dials';
import { summitOdds, stormOn } from './expeditions';
import { act, goBlocked, newGame } from './game';
import type { Action, GameState } from './types';
import { conditionsAt } from './weather';

const k = (g: number) => {
  const n = needFor(g);
  return { power: n, fingers: n, endurance: n, technique: n, head: n };
};
const refused = (r: ReturnType<typeof act>) => {
  const e = r.events.find((x) => x.k === 'refused');
  return e?.k === 'refused' ? e.why : null;
};
const play = (s: GameState, ...as: Action[]): GameState => {
  for (const a of as) {
    const r = act(s, a);
    const why = refused(r);
    if (why) throw new Error(`${JSON.stringify(a)}: ${why}`);
    s = r.state;
  }
  return s;
};
// A dry day at Roadside with Hazel there to belay.
const dry = Array.from({ length: 60 }, (_, i) => i + 2).find((d) => conditionsAt('walls', d, 'road').open)!;
const atProw = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('walls'),
  day: dry,
  at: 'road',
  min: 9 * 60,
  cash: 100,
  today: ['warm'],
  climber: { name: 'Kit', start: 'allrounder', skills: k(8) },
  gear: { shoes: 80, chalk: 30, rope: 1 },
  ...over,
});
const send = (s: GameState, route: string): GameState =>
  play(
    s,
    { t: 'go', route },
    { t: 'done', route, result: { sent: true, hi: 16, fellAt: null, tried: ['A1'], skin: 0 } },
  );

describe('walls', () => {
  const w = WALLS.prow!;

  it('need a rope of your own, and go a pitch at a time, in order', () => {
    expect(
      refused(act({ ...atProw(), gear: { shoes: 80, chalk: 30 } }, { t: 'wall', wall: 'prow', do: 'start' })),
    ).toMatch(/rope/);
    const s = play(atProw(), { t: 'wall', wall: 'prow', do: 'start' });
    expect(goBlocked(s, routes(w)[1]!)).toMatch(/Pitch 1 is next/);
    const one = send(s, w.pitches[0]!);
    expect(one.wall).toEqual({ id: 'prow', next: 1 });
    expect(goBlocked(one, routes(w)[1]!)).toBeNull();
  });

  it('pay once at the summit, and never again', () => {
    let s = play(atProw(), { t: 'wall', wall: 'prow', do: 'start' });
    for (const p of w.pitches) s = { ...send(s, p), energy: 100, min: 10 * 60 };
    const pay = WALL.pay.base + WALL.pay.perGrade * w.grade + WALL.pay.perPitch * w.pitches.length;
    expect(s.wall).toBeNull();
    expect(s.cash).toBe(100 + pay);
    let again = play(s, { t: 'wall', wall: 'prow', do: 'start' });
    for (const p of w.pitches) again = { ...send(again, p), energy: 100, min: 10 * 60 };
    expect(again.cash).toBe(s.cash);
  });

  it('let you sleep on a ledge after dark, and come down when you drive off or retreat', () => {
    const s = send(play(atProw(), { t: 'wall', wall: 'prow', do: 'start' }), w.pitches[0]!);
    expect(refused(act(s, { t: 'wall', wall: 'prow', do: 'bivy' }))).toMatch(/light/);
    const night = play({ ...s, min: 21 * 60 }, { t: 'wall', wall: 'prow', do: 'bivy' });
    expect(night).toMatchObject({ at: 'road', day: s.day + 1, wall: { id: 'prow', next: 1 } });
    expect(night.cash).toBe(s.cash);
    expect(play(night, { t: 'wall', wall: 'prow', do: 'retreat' }).wall).toBeNull();
    expect(play(night, { t: 'travel', to: 'lot' }).wall).toBeNull();
  });
});

// The pitches of a wall, as routes.
import { ROUTES } from './content/routes';
const routes = (w: (typeof WALLS)[string]) => w.pitches.map((id) => ROUTES[id]!);

describe('expeditions', () => {
  const e = EXPEDITIONS.elcap!;
  const ready = (grade: number, seed = 'exped'): GameState => ({
    ...newGame(seed),
    at: 'lot',
    cash: 1000,
    climber: { name: 'Kit', start: 'allrounder', skills: k(grade) },
  });
  // Lead every fair day you've the energy for, rest otherwise: the policy the odds assume.
  const run = (s: GameState, dig = false): GameState => {
    s = play(s, { t: 'exped', id: 'elcap', do: 'go' });
    while (s.expedition) {
      const x = s.expedition;
      const cost = dig ? EXPED.dig : EXPED.lead;
      const storm = stormOn(s.seed, 'elcap', e, s.day);
      s = play(s, {
        t: 'exped',
        id: 'elcap',
        do: !storm && x.energy >= cost ? (dig ? 'dig' : 'lead') : 'rest',
      });
    }
    return s;
  };

  it('need the grade and the cost in hand, and keep you away from the valley till it ends', () => {
    expect(refused(act(ready(6), { t: 'exped', id: 'elcap', do: 'go' }))).toMatch(/V7/);
    expect(refused(act({ ...ready(8), cash: 800 }, { t: 'exped', id: 'elcap', do: 'go' }))).toMatch(/\$900/);
    const s = play(ready(8), { t: 'exped', id: 'elcap', do: 'go' });
    expect(s.cash).toBe(100);
    expect(refused(act(s, { t: 'travel', to: 'gym' }))).toMatch(/El Capitan/);
  });

  it('can be climbed, and failed, and the odds shown up front are the odds you get', () => {
    const seeds = Array.from({ length: 300 }, (_, i) => `x${i}`);
    for (const grade of [7, 10]) {
      const runs = seeds.map((sd) => run(ready(grade, sd)));
      const summits = runs.filter((s) => s.cash > 1000 - e.cost).length / runs.length;
      const odds = summitOdds(k(grade), e, false);
      expect(Math.abs(summits - odds), `V${grade}: ${summits} vs ${odds}`).toBeLessThan(0.08);
      // Both happen: some get up it, some don't.
      if (grade === 10) expect(summits).toBeGreaterThan(0.5);
      if (grade === 7) expect(summits).toBeLessThan(0.5);
    }
    expect(summitOdds(k(12), e, false)).toBeGreaterThan(summitOdds(k(8), e, false));
  });

  it('can be called off, with nothing to show for it', () => {
    const s = play(ready(9), { t: 'exped', id: 'elcap', do: 'go' }, { t: 'exped', id: 'elcap', do: 'bail' });
    expect(s.expedition).toBeNull();
    expect(s.cash).toBe(1000 - e.cost);
  });
});
