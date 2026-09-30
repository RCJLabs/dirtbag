// Phase 22.4b: old injuries and fear. A healed injury can leave a mark that adds risk where
// it was and can flare on lines that load it; physio settles a flare. A bad landing, a deck
// or the worst injury leaves you afraid of the style until you send one.
import { describe, expect, it } from 'vitest';
import { injuryChance } from './body';
import { dayFactor } from './climb';
import { routeById } from './content/gym';
import { markOf } from './content/injuries';
import { ROUTES } from './content/routes';
import { FEAR, LOAD, SCARS } from './dials';
import { act, landingChance, newGame } from './game';
import { historyWindows, scarRoll } from './scars';
import type { GameState, Injury } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('scars'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 300,
  day: 10,
  ...over,
});
const hurt = (tier: 1 | 2 | 3, kind = 'pulley strain', days = 1): Injury => ({
  kind,
  tier,
  until: 10 + days,
});

describe('old injuries', () => {
  it('knows where each injury was', () => {
    expect(markOf('pulley strain')).toBe('fingers');
    expect(markOf('tweaked knee')).toBe('leg');
    expect(markOf('rolled ankle')).toBe('ankle');
    expect(markOf('nothing')).toBeNull();
  });

  it('never marks a tier 1, and marks a tier 3 more often than a tier 2', () => {
    const rate = (tier: 1 | 2 | 3) =>
      Array.from({ length: 200 }, (_, d) => scarRoll(base({ day: d + 1 }), hurt(tier))).filter(Boolean)
        .length;
    expect(rate(1)).toBe(0);
    expect(rate(3)).toBeGreaterThan(rate(2));
    expect(rate(2)).toBeGreaterThan(0);
  });

  it('leaves the mark when it heals, and says so', () => {
    // A day and an injury whose healing leaves a mark, found by the seeded roll.
    const day = Array.from({ length: 200 }, (_, d) => d + 1).find(
      (d) => scarRoll(base({ day: d + 1 }), hurt(3, 'ruptured pulley', 1)) === 'fingers',
    )!;
    const s = base({ day, min: 21 * 60, injury: { kind: 'ruptured pulley', tier: 3, until: day + 1 } });
    const r = act(s, { t: 'act', act: 'lot.sleep' });
    expect(r.state.injury).toBeNull();
    expect(r.state.scars).toEqual(['fingers']);
    expect(r.events.some((e) => e.k === 'line' && /will remember/.test(e.text))).toBe(true);
  });

  it('adds risk where it’s marked, and to landings for an ankle', () => {
    const spiked = { acute: 60, chronic: 30, today: 0 };
    const plain = injuryChance(base({ load: spiked }), { type: 'crimp' }, LOAD.perGo, false);
    const marked = injuryChance(
      base({ load: spiked, scars: ['fingers'] }),
      { type: 'crimp' },
      LOAD.perGo,
      false,
    );
    expect(marked).toBeCloseTo(plain * SCARS.risk);
    expect(
      injuryChance(base({ load: spiked, scars: ['fingers'] }), { type: 'dyno' }, LOAD.perGo, false),
    ).toBeCloseTo(injuryChance(base({ load: spiked }), { type: 'dyno' }, LOAD.perGo, false));
    const hb = Object.values(ROUTES).find((r) => r.highball)!;
    const plainLand = landingChance(base(), hb, hb.moves);
    expect(plainLand).toBeGreaterThan(0);
    expect(landingChance(base({ scars: ['ankle'] }), hb, hb.moves)).toBeCloseTo(plainLand * SCARS.risk);
  });

  it('narrows a flaring line’s windows, and physio settles it', () => {
    const s = base({ scars: ['fingers'], flare: { area: 'fingers', until: 13 } });
    expect(historyWindows(s, 'crimp')).toBeCloseTo(SCARS.flareWindows);
    expect(historyWindows(s, 'dyno')).toBe(1);
    expect(historyWindows({ ...s, day: 13 }, 'crimp')).toBe(1);
    const r = act({ ...s, at: 'clinic' }, { t: 'act', act: 'clinic.physio' }).state;
    expect(r.flare).toBeNull();
    expect(act(base({ at: 'clinic' }), { t: 'act', act: 'clinic.physio' }).events[0]).toMatchObject({
      k: 'refused',
    });
  });
});

describe('fear', () => {
  it('narrows its style’s windows until a send of it', () => {
    const s = base({ fear: ['technical'] });
    expect(historyWindows(s, 'technical')).toBeCloseTo(FEAR.windows);
    expect(historyWindows(s, 'crimp')).toBe(1);
    const route = routeById(s.seed, 'warm')!;
    expect(dayFactor({ ...s, fear: [route.type] }, route).windows).toBeCloseTo(
      dayFactor(base(), route).windows * FEAR.windows,
    );
  });

  it('passes when you send a line of that style, and says so', () => {
    const route = routeById('scars', 'warm')!;
    const s = base({ at: 'road', min: 9 * 60, energy: 90, skin: 90, fear: [route.type] });
    const going = act(s, { t: 'go', route: 'warm' }).state;
    const r = act(going, {
      t: 'done',
      route: 'warm',
      result: { sent: true, hi: route.moves, fellAt: null, tried: [], skin: 0 },
    });
    expect(r.state.fear).toEqual([]);
    expect(r.events.some((e) => e.k === 'line' && /fear gone/.test(e.text))).toBe(true);
  });
});
