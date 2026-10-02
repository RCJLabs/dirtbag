// Who you are (Phase 23.2): your origin's perk and cost, and the talents dealt you, as the
// multipliers the rest of the rules read. Everything an origin does goes through one of
// these, so a price or a gain shown on screen is the one charged.

import type { Style } from './climber';
import { ORIGINS, type Origin, type OriginFx } from './content/origins';
import { INJURY_NAME } from './content/injuries';
import { TALENTS } from './content/talents';
import { PLANS, TALENT } from './dials';
import { Rng } from './rng';
import type { GameState, Skills } from './types';

export const originOf = (s: GameState): Origin | null => (s.origin ? (ORIGINS[s.origin] ?? null) : null);
const fx = (s: GameState): OriginFx => originOf(s)?.fx ?? {};

// Where a skill's learned: on a go indoors or outside, or in a session (the speed wall's one).
export type Where = 'in' | 'out' | 'train';

// What a skill learns there, as a share of everyone's: your origin's, then your talents'.
export function gainMult(s: GameState, k: keyof Skills, where: Where): number {
  const f = fx(s);
  let m = where === 'in' ? (f.gainIn ?? 1) : where === 'out' ? (f.gainOut ?? 1) : (f.gainTrain ?? 1);
  if ((k === 'power' || k === 'fingers') && f.spring) m *= f.spring;
  for (const id of s.talents.ids) {
    const t = TALENTS[id];
    if (t && t.skill === k) m *= t.gain;
  }
  return m;
}

// The styles that load the fingers, where tendons tell.
const FINGERY: Style[] = ['crimp', 'crack'];
export function injuryMult(s: GameState, style: Style): number {
  if (!FINGERY.includes(style)) return 1;
  return s.talents.ids.reduce((m, id) => m * (TALENTS[id]?.injury ?? 1), 1);
}

export const payMult = (s: GameState): number => fx(s).pay ?? 1;
export const livingMult = (s: GameState): number => fx(s).living ?? 1;
export const shopMult = (s: GameState): number => fx(s).shop ?? 1;
export const originBill = (s: GameState): number => fx(s).bill ?? 0;
export const premiumOf = (s: GameState, plan: keyof typeof PLANS): number =>
  Math.round(PLANS[plan].premium * (fx(s).premium ?? 1));

// One good and one bad, dealt on the seed when you're made.
export function dealTalents(seed: string): string[] {
  const r = Rng.fromStream(seed, 'events').derive('talents');
  const good = Object.keys(TALENTS).filter((id) => TALENTS[id]!.good);
  const bad = Object.keys(TALENTS).filter((id) => !TALENTS[id]!.good);
  return [good[Math.floor(r.next() * good.length)]!, bad[Math.floor(r.next() * bad.length)]!];
}

// The talents that have just shown: a skill's come on far enough since you started, or, for
// tendons, you've been hurt on the fingers.
export function talentsShowing(s: GameState): string[] {
  return s.talents.ids.filter((id) => {
    if (s.talents.known.includes(id)) return false;
    const t = TALENTS[id];
    if (!t) return false;
    if (t.injury && s.injury && INJURY_NAME.fingers.includes(s.injury.kind)) return true;
    return s.climber.skills[t.skill] - (s.talents.from[t.skill] ?? 0) >= TALENT.reveal;
  });
}

// An origin's perk and cost in words, from its numbers: "Every shift pays 12% more."
const pct = (m: number): string => `${Math.round(Math.abs(1 - m) * 100)}%`;
export function originTerms(o: Origin): { perks: string[]; costs: string[] } {
  const f = o.fx;
  const perks: string[] = [];
  const costs: string[] = [];
  const put = (m: number | undefined, more: string, less: string, goodIfMore = true) => {
    if (m === undefined || m === 1) return;
    const up = m > 1;
    (up === goodIfMore ? perks : costs).push((up ? more : less).replace('%', pct(m)));
  };
  put(f.pay, 'Every shift pays % more.', 'Every shift pays % less.');
  put(f.gainIn, 'You learn % more climbing indoors.', 'You learn % less climbing indoors.');
  put(f.gainOut, 'You learn % more climbing outside.', 'You learn % less climbing outside.');
  put(f.gainTrain, 'You get % more from every session.', 'You get % less from every session.');
  put(f.spring, 'Power and fingers come % faster.', 'Power and fingers come % slower.');
  put(f.living, 'Nights cost % more.', 'Nights cost % less.', false);
  put(f.premium, 'Insurance costs % more.', 'Insurance costs % less.', false);
  put(f.shop, 'Everything you buy costs % more.', '% off everything you buy.', false);
  if (f.bill) costs.push(`$${f.bill} a week for ${o.billFor ?? 'old debts'}.`);
  if (f.cash)
    (f.cash > 0 ? perks : costs).push(
      f.cash > 0 ? `$${f.cash} more to start.` : `$${-f.cash} less to start.`,
    );
  return { perks, costs };
}
