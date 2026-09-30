// Phase 21.2: trad. What you place is what catches you; with nothing placed, the ground does.
import { describe, expect, it } from 'vitest';
import {
  goResult,
  protection,
  stanceAt,
  startAttempt,
  STEP,
  stepAttempt,
  attemptInput,
  type Attempt,
} from './climb';
import { needFor } from './climber';
import { ROUTES, roped } from './content/routes';
import { CLIMB, KIT, TRAD } from './dials';
import { act, deckChance, goBlocked, newGame } from './game';
import type { GameState } from './types';

const arete = ROUTES.tradarete!;

const fit = needFor(arete.grade);
function atCrag(gear: Record<string, number> = {}): GameState {
  const s = newGame('trad');
  return {
    ...s,
    at: 'road',
    min: 9 * 60,
    today: ['warm'],
    cash: 1000,
    gear: { ...s.gear, ...gear },
    climber: {
      name: 'Test',
      start: 'allrounder',
      skills: { power: fit, fingers: fit, endurance: fit, technique: fit, head: fit },
    },
  };
}
const refused = (r: ReturnType<typeof act>) => r.events.find((e) => e.k === 'refused');

// Climbs to `to` moves, stopping to place at the stances in `place` and running the rest out.
function climb(to: number, place: number[]): Attempt {
  let a = startAttempt(atCrag({ rack: 1 }), arete);
  for (let i = 0; i < 60 * 60 && a.pos < to; i++) {
    const at = stanceAt(a);
    const hold = !(at !== null && place.includes(at));
    if (hold !== a.hold) a = attemptInput(a, hold).att;
    a = stepAttempt(a, STEP).att;
  }
  return a;
}

// Comes off right where it is: pumped.
function fallOff(a: Attempt): Attempt {
  let f = attemptInput({ ...a, pump: 100 }, true).att;
  f = stepAttempt(f, STEP).att;
  expect(f.phase).toBe('fall');
  return f;
}

describe('trad', () => {
  it('is a line on a rope, with stances in place of bolts', () => {
    for (const r of [ROUTES.tradarete!, ROUTES.gtrad!]) {
      expect(r.disc).toBe('trad');
      expect(roped(r)).toBe(true);
      expect(r.bolts).toEqual([]);
      expect(r.stances!.length).toBeGreaterThan(3);
      expect(r.stances).toContain(r.rest!.at);
      // No stance inside a crux: you place between the hard bits.
      for (const at of r.stances!)
        for (const c of r.cruxes) expect(at < c.from || at > c.to, `${r.id} ${at}`).toBe(true);
    }
  });

  it('places a piece when you let go at a stance, for pump, and not when you climb through', () => {
    const placed = climb(6.0, [2.4, 5.6]);
    expect(placed.placed).toEqual([2.4, 5.6]);
    const ran = climb(6.0, []);
    expect(ran.placed).toEqual([]);
    // Stopping to place costs pump over climbing straight through.
    expect(placed.pump).toBeGreaterThan(ran.pump);
    expect(TRAD.placePump).toBeGreaterThan(-CLIMB.pumpHang);
  });

  it('catches a fall on the last piece placed, and decks you with nothing low enough', () => {
    const close = fallOff(climb(6.0, [2.4, 5.6]));
    expect(protection(close)).toEqual([2.4, 5.6]);
    expect(close.fall!.deck).toBeUndefined();
    expect(close.fall!.to).toBeGreaterThan(0);
    // One piece low down: the same fall is long enough to reach the ground.
    const far = fallOff(climb(6.0, [2.4]));
    expect(far.fall!.deck).toBeGreaterThan(0);
    const none = fallOff(climb(6.0, []));
    expect(none.fall!.deck).toBe(Math.round((none.pos * arete.heightFt) / arete.moves));
    expect(close.fall!.ft).toBeLessThan(none.fall!.ft);
    // The go's result carries the deck to the rules.
    expect(goResult(none).deck).toBe(none.fall!.deck);
    expect(goResult(close).deck).toBeUndefined();
  });

  it('needs a rack, then a belayer', () => {
    expect(goBlocked(atCrag(), arete)).toMatch(/rack/);
    expect(goBlocked(atCrag({ rack: 1 }), arete) ?? '').not.toMatch(/rack/);
  });

  it('can hurt when you deck: nothing up to the safe height, more with every foot', () => {
    expect(deckChance(TRAD.deck.safeFt)).toBe(0);
    expect(deckChance(20)).toBeCloseTo(TRAD.deck.perFoot * (20 - TRAD.deck.safeFt));
    // Across many days, a 20 ft deck sometimes hurts and a short one never does.
    const deck = (ft: number, day: number) => {
      const s = { ...atCrag({ rack: 1 }), day };
      const r = act(s, {
        t: 'done',
        route: 'tradarete',
        result: { sent: false, hi: 6, fellAt: null, tried: [], skin: 0, deck: ft },
      });
      return r.state.injury;
    };
    const days = Array.from({ length: 60 }, (_, i) => i + 1);
    expect(days.some((d) => deck(20, d))).toBe(true);
    expect(days.every((d) => !deck(TRAD.deck.safeFt, d))).toBe(true);
  });

  it('sells a rack at the shop, and a used one at the swap meet', () => {
    let s = { ...atCrag(), at: 'shop', day: 3 };
    expect(refused(act(s, { t: 'act', act: 'shop.usedRack' }))).toBeTruthy();
    const sat = act({ ...s, day: 6 }, { t: 'act', act: 'shop.usedRack' });
    expect(sat.state.cash).toBe(s.cash - Math.round(KIT.used.share * KIT.rack.price));
    s = act(s, { t: 'act', act: 'shop.rack' }).state;
    expect(s.gear.rack).toBe(1);
    expect(refused(act(s, { t: 'act', act: 'shop.rack' }))).toBeTruthy();
  });
});
