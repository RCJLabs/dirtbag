// Phase 27.5: every highball tops out, so it has two places to fall, and the extra pads go
// under one of them (Evan's call: on a highball you choose where the pad goes).
import { describe, expect, it } from 'vitest';
import { attemptInput, goResult, startAttempt, stepAttempt } from './climb';
import { needFor } from './climber';
import { ROUTES, TOP_OUT } from './content/routes';
import { HIGHBALL } from './dials';
import { act, cruxFallMoves, fallCrux, landingChance, newGame, padUnder } from './game';
import type { GameState } from './types';
import { conditionsAt } from './weather';

const k = needFor(9);
const dry = Array.from({ length: 80 }, (_, i) => i + 2).find((d) => conditionsAt('pads', d, 'moon').open)!;
// A morning at Moonstone with nobody about to spot, the haul's pads unlocked.
const atMoon = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('pads'),
  day: dry,
  at: 'moon',
  min: 10 * 60,
  today: ['warm'],
  unlocked: ['moon'],
  climber: {
    name: 'Kit',
    start: 'allrounder',
    skills: { power: k, fingers: k, endurance: k, technique: k, head: k },
  },
  ...over,
});
const tall = ROUTES.marete!;
const [crux, top] = tall.cruxes as [(typeof tall.cruxes)[0], (typeof tall.cruxes)[0]];

describe('highball top-outs', () => {
  it('give every highball a top-out above its crux, and nothing else one', () => {
    for (const r of Object.values(ROUTES)) {
      const ids = r.cruxes.map((c) => c.id);
      if (!r.highball) {
        expect(
          r.cruxes.some((c) => c.name === TOP_OUT.name),
          r.id,
        ).toBe(false);
        continue;
      }
      expect(ids, r.id).toEqual(['A', 'B']);
      const [a, b] = r.cruxes;
      expect(b!.name, r.id).toBe(TOP_OUT.name);
      expect(b!.from, r.id).toBeGreaterThan(a!.to);
      expect(b!.to, r.id).toBeLessThan(r.moves);
    }
  });

  it('count a crux’s fall from the move the climb counts it from', () => {
    // Hold to the top-out's start, then let go of everything: off at the top-out.
    const s = atMoon();
    let a = startAttempt(s, tall);
    for (let i = 0; i < 60 * 120 && a.phase !== 'lowered'; i++) {
      const want = a.phase === 'climb' && a.done.includes('A') ? true : a.phase === 'climb';
      if (want !== a.hold) a = attemptInput(a, want).att;
      // Through the first crux by fiat, so the fall is the top-out's.
      if (a.phase === 'crux' && a.crux?.id === 'A')
        a = { ...a, phase: 'climb', crux: null, done: ['A'], pos: crux.to };
      a = stepAttempt(a).att;
    }
    const res = goResult(a);
    expect(res.fellAt).toBe('B');
    expect(res.hi).toBe(cruxFallMoves(top));
    expect(fallCrux(tall, res.hi, res.fellAt)).toBe('B');
    expect(fallCrux(tall, cruxFallMoves(crux))).toBe('A');
  });
});

describe('where the pads go', () => {
  const at = (s: GameState, c: typeof crux) => landingChance(s, tall, cruxFallMoves(c), c.id);

  it('go under the worse fall, the top-out, till you move them, and cover only it', () => {
    const s = atMoon();
    expect(padUnder(s, tall)).toBe('B');
    const bare = atMoon({ unlocked: [] });
    expect(padUnder(bare, tall)).toBeNull();
    expect(at(s, top)).toBeCloseTo(at(bare, top) * HIGHBALL.pads);
    expect(at(s, crux)).toBeCloseTo(at(bare, crux));
    // The top-out is the higher fall, and lands worse.
    expect(at(bare, top)).toBeGreaterThan(at(bare, crux));
  });

  it('move under the crux when the go says so, for the rest of the day', () => {
    const r = act(atMoon(), { t: 'go', route: 'marete', pad: 'A' });
    const s = r.state;
    expect(s.today).toContain('pad-marete-A');
    expect(padUnder(s, tall)).toBe('A');
    const bare = atMoon({ unlocked: [] });
    expect(at(s, crux)).toBeCloseTo(at(bare, crux) * HIGHBALL.pads);
    expect(at(s, top)).toBeCloseTo(at(bare, top));
    // And back under the top-out: one place at a time.
    const back = act(
      { ...s, routes: { ...s.routes, marete: { ...s.routes.marete!, goesToday: 0 } } },
      { t: 'go', route: 'marete', pad: 'B' },
    ).state;
    expect(back.today.filter((f) => f.startsWith('pad-marete-'))).toEqual(['pad-marete-B']);
  });

  it('can’t be moved with only the one pad, or on a line that isn’t a highball', () => {
    expect(act(atMoon({ unlocked: [] }), { t: 'go', route: 'marete', pad: 'A' }).state.today).not.toContain(
      'pad-marete-A',
    );
    const low = act(atMoon(), { t: 'go', route: 'megg', pad: 'A' }).state;
    expect(low.today.some((f) => f.startsWith('pad-'))).toBe(false);
  });
});
