// Phase 22.4a: insurance plans and the clinic. Each plan's premium goes with the week's
// bills and sets what a clinic bill comes to; physio takes a day off an injury, once a day;
// cortisone halves what's left and makes the next injury in three weeks a tier worse.
import { describe, expect, it } from 'vitest';
import { carePrice, clinicBill, jabbed, weeklyBills, worsened } from './clinic';
import { CLINIC, INJURY, MONEY, PLANS } from './dials';
import { act, newGame } from './game';
import type { GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('clinic'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 300,
  day: 10,
  hurt: 1,
  ...over,
});
const hurt = (days: number, tier: 1 | 2 | 3 = 2) => ({ kind: 'pulley', tier, until: 10 + days });

describe('insurance', () => {
  it('bills the week at your plan’s premium', () => {
    expect(weeklyBills(base())).toBe(MONEY.registration + MONEY.insurance);
    expect(weeklyBills(base({ insurance: 'none' }))).toBe(MONEY.registration);
    expect(weeklyBills(base({ insurance: 'full' }))).toBe(MONEY.registration + PLANS.full.premium);
    const night = act(base({ day: 7, min: 21 * 60, insurance: 'full' }), {
      t: 'act',
      act: 'lot.sleep',
    }).state;
    expect(night.cash).toBe(300 - MONEY.vanSpot - weeklyBills(base({ insurance: 'full' })));
  });

  it('sets what a clinic bill comes to, and the first injury is still free', () => {
    expect(clinicBill(base(), 3)).toBe(INJURY.clinic[2]);
    expect(clinicBill(base({ insurance: 'none' }), 3)).toBe(INJURY.clinic[2]! * PLANS.none.bill);
    expect(clinicBill(base({ insurance: 'full' }), 3)).toBe(PLANS.full.copay);
    expect(clinicBill(base({ hurt: 0, insurance: 'none' }), 3)).toBe(0);
    expect(clinicBill(base(), 1)).toBe(0);
  });

  it('switches plan from the week', () => {
    expect(act(base(), { t: 'insure', plan: 'full' }).state.insurance).toBe('full');
  });
});

describe('the clinic', () => {
  it('takes a day off with physio, once a day, at your plan’s price', () => {
    const s = base({ at: 'clinic', injury: hurt(5) });
    const r = act(s, { t: 'act', act: 'clinic.physio' }).state;
    expect(r.injury?.until).toBe(s.injury!.until - CLINIC.physio.days);
    expect(r.cash).toBe(300 - CLINIC.physio.price);
    expect(act(r, { t: 'act', act: 'clinic.physio' }).events[0]).toMatchObject({ k: 'refused' });
    expect(carePrice(base({ insurance: 'full' }), 'physio')).toBeLessThan(CLINIC.physio.price);
    expect(act(base({ at: 'clinic' }), { t: 'act', act: 'clinic.physio' }).events[0]).toMatchObject({
      k: 'refused',
    });
  });

  it('heals you when physio takes the last day', () => {
    const r = act(base({ at: 'clinic', injury: hurt(1) }), { t: 'act', act: 'clinic.physio' }).state;
    expect(r.injury).toBeNull();
  });

  it('halves what’s left with cortisone, and the next injury in three weeks lands a tier worse', () => {
    const r = act(base({ at: 'clinic', injury: hurt(8) }), { t: 'act', act: 'clinic.cortisone' }).state;
    expect(r.injury?.until).toBe(10 + 4);
    expect(r.jab).toBe(10);
    expect(jabbed(r)).toBe(true);
    expect(jabbed({ ...r, day: 10 + CLINIC.cortisone.jabDays + 1 })).toBe(false);
    const w = worsened(hurt(3, 1));
    expect(w.tier).toBe(2);
    expect(w.until).toBe(13 + INJURY.days[1]![0] - INJURY.days[0]![0]);
    expect(worsened(hurt(15, 3)).tier).toBe(3);
  });
});
