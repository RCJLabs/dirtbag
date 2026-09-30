// Insurance and the clinic (Phase 22.4a): what the week's bills come to on your plan, what a
// clinic bill for an injury comes to, and what physio and cortisone cost you.

import { CLINIC, INJURY, MONEY, PLANS } from './dials';
import type { GameState, Injury } from './types';

// Registration and your plan's premium, due on the week's last night.
export const weeklyBills = (s: GameState): number => MONEY.registration + PLANS[s.insurance].premium;

// The clinic's bill for an injury of this tier, on your plan. The first injury's is waived.
export function clinicBill(s: GameState, tier: 1 | 2 | 3): number {
  if (s.hurt === 0) return 0;
  const base = INJURY.clinic[tier - 1]!;
  const p = PLANS[s.insurance];
  if (!base) return 0;
  return p.copay !== undefined ? p.copay : Math.round(base * p.bill);
}

export const carePrice = (s: GameState, what: keyof typeof CLINIC): number =>
  Math.round(CLINIC[what].price * PLANS[s.insurance].care);

// Whether cortisone is still hiding something: the next injury lands a tier worse.
export const jabbed = (s: GameState): boolean => s.jab > 0 && s.day - s.jab <= CLINIC.cortisone.jabDays;

// An injury cortisone hid (Phase 22.4a): a tier worse, and its time off longer by the gap
// between the tiers' shortest. Tier 3 is as bad as it gets.
export function worsened(h: Injury): Injury {
  if (h.tier >= 3) return h;
  const tier = (h.tier + 1) as 2 | 3;
  return { ...h, tier, until: h.until + INJURY.days[tier - 1]![0] - INJURY.days[h.tier - 1]![0] };
}
