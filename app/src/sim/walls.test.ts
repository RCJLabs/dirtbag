// Phase 21.5: multi-pitch walls, each climbed and each failed (criterion 4).
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { WALLS } from './content/routes';
import { WALL } from './dials';
import { belayer, act, goBlocked, newGame } from './game';
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

  it('keep whoever bivied with you there in the morning, to belay the next pitch', () => {
    const s = send(play(atProw(), { t: 'wall', wall: 'prow', do: 'start' }), w.pitches[0]!);
    expect(belayer(s)).toBe('hazel');
    const night = play({ ...s, min: 21 * 60 }, { t: 'wall', wall: 'prow', do: 'bivy' });
    expect(night.people.hazel?.invite).toEqual({ day: night.day, place: 'road', from: night.min });
    expect(belayer(night)).toBe('hazel');
  });
});

// The pitches of a wall, as routes.
import { ROUTES } from './content/routes';
const routes = (w: (typeof WALLS)[string]) => w.pitches.map((id) => ROUTES[id]!);

// Expeditions moved to expeditions.test.ts in Phase 24, when their pitches became climbs.
