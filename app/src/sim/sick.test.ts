// Phase 22.4c: supplies and sickness. The gauge runs down each night at the van and comes
// back at the lake, the market, the gym and the truck stop; each night's chance of waking
// sick rises with the cold, low supplies, hunger and a samey diet; a sickness costs energy
// and windows until it passes, or the clinic sees to it.
import { describe, expect, it } from 'vitest';
import { dayFactor } from './climb';
import { routeById } from './content/gym';
import { BODY, FOOD, SICK, SUPPLIES } from './dials';
import { act, newGame } from './game';
import { sickOdds, sickRoll } from './sick';
import type { GameState } from './types';
import { seasonOf } from './weather';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('sick'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 200,
  day: 3,
  energy: 30,
  ...over,
});
const sleep = (s: GameState) => act({ ...s, min: 21 * 60 }, { t: 'act', act: 'lot.sleep' });
const winter = Array.from({ length: 60 }, (_, i) => i + 1).find((d) => seasonOf(d) === 'winter')!;

describe('supplies', () => {
  it('run down a night at the van, less at the truck stop', () => {
    const s = base({ supplies: 60 });
    expect(sleep(s).state.supplies).toBe(60 - SUPPLIES.night);
    expect(sleep({ ...s, spot: 'truckstop' }).state.supplies).toBe(60 - SUPPLIES.night + SUPPLIES.truckstop);
  });

  it('come back at the lake, the market and the gym’s shower, never past full', () => {
    expect(act(base({ at: 'lake', supplies: 10 }), { t: 'act', act: 'lake.water' }).state.supplies).toBe(
      10 + SUPPLIES.lake,
    );
    const m = act(base({ at: 'market', supplies: 90 }), { t: 'act', act: 'market.water' }).state;
    expect(m.supplies).toBe(100);
    expect(m.cash).toBe(200 - SUPPLIES.market.price);
    const g = base({ at: 'gym', supplies: 20 });
    expect(act(g, { t: 'act', act: 'gym.shower' }).events[0]).toMatchObject({ k: 'refused' });
    expect(act({ ...g, today: ['pass'] }, { t: 'act', act: 'gym.shower' }).state.supplies).toBe(
      20 + SUPPLIES.shower,
    );
  });
});

describe('sickness', () => {
  it('rises with the cold, low supplies, hunger and a samey diet', () => {
    expect(sickOdds(base(), false).odds).toBeCloseTo(SICK.base);
    const worst = base({
      day: winter,
      supplies: 5,
      fed: BODY.hungryBelow - 1,
      meals: Array(FOOD.same).fill('ramen'),
    });
    expect(sickOdds(worst, false).odds).toBeCloseTo(
      SICK.base + SICK.winter + SICK.supplies + SICK.hungry + SICK.same,
    );
    // The heater keeps the winter out of it.
    expect(sickOdds(worst, true).odds).toBeCloseTo(SICK.base + SICK.supplies + SICK.hungry + SICK.same);
  });

  it('comes on overnight, costs energy and windows, and passes', () => {
    const worst = { supplies: 5, fed: 5, meals: Array(FOOD.same).fill('ramen') };
    const day = Array.from({ length: 300 }, (_, i) => i + 1).find((d) => {
      const r = sickRoll(base({ day: d, ...worst }), false);
      return r && r.kind !== 'toothache';
    })!;
    const r = sleep(base({ day, ...worst }));
    expect(r.state.sick).not.toBeNull();
    expect(r.events.some((e) => e.k === 'line' && /You wake up with/.test(e.text))).toBe(true);
    const route = routeById('sick', 'warm')!;
    expect(dayFactor(r.state, route).windows).toBeCloseTo(
      dayFactor({ ...r.state, sick: null }, route).windows * SICK.windows,
    );
    // It passes on the morning it's due.
    const later = sleep({ ...r.state, day: r.state.sick!.until - 1, supplies: 90, fed: 80, meals: [] });
    expect(later.state.sick).toBeNull();
  });

  it('keeps a toothache until a doctor sees it, and a doctor halves a cold', () => {
    const tooth = base({ at: 'clinic', sick: { kind: 'toothache', until: 0 } });
    expect(sleep({ ...tooth, at: 'lot', day: 50 }).state.sick?.kind).toBe('toothache');
    expect(act(tooth, { t: 'act', act: 'clinic.doctor' }).state.sick).toBeNull();
    const cold = base({ at: 'clinic', sick: { kind: 'cold', until: 3 + 4 } });
    expect(act(cold, { t: 'act', act: 'clinic.doctor' }).state.sick?.until).toBe(3 + 2);
    expect(act(base({ at: 'clinic' }), { t: 'act', act: 'clinic.doctor' }).events[0]).toMatchObject({
      k: 'refused',
    });
  });
});
