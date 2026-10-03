import { needFor } from './climber';
// Phase 21.1: your kit. What a go does to it, what it does to a go, and the shop.
import { describe, expect, it } from 'vitest';
import { betaScale } from './climb';
import { ROUTES } from './content/routes';
import { KIT } from './dials';
import { act, morePads, newGame } from './game';
import { kitFactor } from './kit';
import type { GameState } from './types';

const made = (): GameState => {
  const s = act(newGame('kit'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  // Two grades in every style, so Roadside's V4s are inside what they can try (OVER).
  const k = needFor(2);
  return {
    ...s,
    cash: 500,
    climber: { ...s.climber, skills: { power: k, fingers: k, endurance: k, technique: k, head: k } },
  };
};
const at = (s: GameState, place: string): GameState => ({ ...s, at: place, min: 10 * 60 });
const refused = (r: ReturnType<typeof act>) => r.events.find((e) => e.k === 'refused');
const goOn = (s: GameState, route: string, skin = 0): GameState => {
  const a = act(s, { t: 'go', route });
  if (refused(a)) throw new Error(JSON.stringify(a.events));
  return act(a.state, { t: 'done', route, result: { sent: false, hi: 1, fellAt: null, tried: [], skin } })
    .state;
};

describe('the kit', () => {
  it('starts with the shoes you drove out in and half a bag of chalk', () => {
    expect(made().gear).toEqual({ shoes: KIT.shoes.startAt, chalk: KIT.chalk.startWith });
  });

  it('wears with every go: rubber by the grade, a go of chalk', () => {
    const s = goOn(at(made(), 'road'), 'warm');
    const r = ROUTES.warm!;
    expect(s.gear.shoes).toBeCloseTo(
      KIT.shoes.startAt - KIT.shoes.wear * (1 + KIT.shoes.perGrade * r.grade),
      2,
    );
    expect(s.gear.chalk).toBe(KIT.chalk.startWith - 1);
  });

  it('tightens every crux in worn and blown shoes, technical lines twice as much, and with no chalk', () => {
    const s = made();
    expect(kitFactor(s, 'power')).toBe(1);
    const worn = { ...s, gear: { ...s.gear, shoes: KIT.shoes.worn - 1 } };
    expect(kitFactor(worn, 'power')).toBeCloseTo(KIT.shoes.wornWindows);
    expect(kitFactor(worn, 'technical')).toBeCloseTo(1 - 2 * (1 - KIT.shoes.wornWindows));
    const blown = { ...s, gear: { ...s.gear, shoes: KIT.shoes.blown - 1 } };
    expect(kitFactor(blown, 'power')).toBeCloseTo(KIT.shoes.blownWindows);
    const dry = { ...s, gear: { ...s.gear, chalk: 0 } };
    expect(kitFactor(dry, 'power')).toBeCloseTo(KIT.chalk.without);
    // The beta sheet and the go read the same number.
    const r = ROUTES.warm!;
    const beta = r.cruxes[0]!.beta[0]!;
    expect(betaScale(worn, r, beta) / betaScale(s, r, beta)).toBeCloseTo(
      kitFactor(worn, r.beta[beta]!.style),
    );
  });

  it('saves skin on a crack through tape, and uses the tape', () => {
    const base = at(made(), 'road');
    const bare = goOn(base, 'fingercrack', 10);
    const taped = goOn({ ...base, gear: { ...base.gear, tape: 2 } }, 'fingercrack', 10);
    expect(base.skin - taped.skin).toBeCloseTo((base.skin - bare.skin) * KIT.tape.skin);
    expect(taped.gear.tape).toBe(1);
  });

  it('comes from the shop: a resole only when the rubber needs it, a second pad once', () => {
    let s = at(made(), 'shop');
    s = act(s, { t: 'act', act: 'shop.resole' }).state;
    expect(s.gear.shoes).toBe(KIT.shoes.resoleTo);
    expect(refused(act(s, { t: 'act', act: 'shop.resole' }))).toBeTruthy();
    expect(morePads(s)).toBe(false);
    s = act(s, { t: 'act', act: 'shop.pad' }).state;
    expect(morePads(s)).toBe(true);
    expect(refused(act(s, { t: 'act', act: 'shop.pad' }))).toBeTruthy();
    s = act(s, { t: 'act', act: 'shop.chalk' }).state;
    expect(s.gear.chalk).toBe(KIT.chalk.startWith + KIT.chalk.uses);
  });

  it('holds the swap meet on weekends only', () => {
    const s = { ...at(made(), 'shop'), gear: { shoes: 20, chalk: 1 } };
    expect(refused(act({ ...s, day: 3 }, { t: 'act', act: 'shop.usedShoes' }))).toBeTruthy();
    const sat = act({ ...s, day: 6 }, { t: 'act', act: 'shop.usedShoes' });
    expect(refused(sat)).toBeFalsy();
    expect(sat.state.gear.shoes).toBe(KIT.used.condition);
  });
});
