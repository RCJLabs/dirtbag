// Romance (Phase 17.4): one a life, with Sage or Mara. The spark is offered once each, at
// a Partner's bond; then the beats come a week apart, each forking. Go three weeks without
// a day climbing together, their days away aside, and it ends, in a scene of its own.

import { ROMANCE } from './dials';
import type { GameState } from './types';

// Whether you're with someone now.
export const together = (s: GameState, who?: string): boolean =>
  !!s.romance && s.romance.over === undefined && (who === undefined || s.romance.who === who);

// Whether beat n of a romance with them is due: "who/n". The first is the spark.
export function romanceDue(s: GameState, ref: string): boolean {
  const [who, n] = ref.split('/');
  const beat = Number(n);
  const p = s.people[who ?? ''];
  if (!p || !ROMANCE.who.includes(who ?? '')) return false;
  if (beat === 1) return !s.romance && !p.sparked && p.bond >= ROMANCE.from;
  const r = s.romance;
  return !!r && together(s, who) && r.stage === beat - 1 && s.day - r.beatDay >= ROMANCE.spacing;
}

// Whether it's run out: too long without a day together, their time away not counted.
export function strained(s: GameState, who: string): boolean {
  const p = s.people[who];
  const r = s.romance;
  if (!p || !r || !together(s, who)) return false;
  const since = Math.max(p.last, p.away ?? 0, r.beatDay);
  return s.day - since >= ROMANCE.neglect;
}
