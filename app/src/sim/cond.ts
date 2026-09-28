// Conditions content can ask about, as data. Every field present must hold. A small fixed
// vocabulary keeps content JSON-shaped and keeps rules out of content files.

import { DAY } from './dials';
import { clockShort, fill } from './format';
import type { GameState } from './types';

export interface Cond {
  night?: boolean; // true: only at night; false: only by day
  before?: number; // clock earlier than this (minutes since midnight)
  from?: number; // clock at or after this
  cash?: number; // at least this much money
  energy?: number; // at least
  skin?: number; // at least
  today?: string; // a daily flag is set
  notToday?: string; // a daily flag is not set
  knows?: string; // "route/beta" is known
  notKnows?: string;
  sentToday?: string; // route id sent today
  wentToday?: string; // route id tried today
}

// A condition an act needs, with the line shown when it fails. `why` may use {t}, the
// clock time in the condition, so the words can't drift from the number.
export interface Need extends Cond {
  why?: string;
}

export const isNight = (min: number): boolean => min >= DAY.nightFrom || min % (24 * 60) < DAY.nightUntil;

function knows(s: GameState, ref: string): boolean {
  const [route, beta] = ref.split('/');
  return !!route && !!beta && !!s.routes[route]?.known.includes(beta);
}

export function holds(s: GameState, c: Cond): boolean {
  if (c.night !== undefined && isNight(s.min) !== c.night) return false;
  if (c.before !== undefined && !(s.min < c.before)) return false;
  if (c.from !== undefined && !(s.min >= c.from)) return false;
  if (c.cash !== undefined && s.cash < c.cash) return false;
  if (c.energy !== undefined && s.energy < c.energy) return false;
  if (c.skin !== undefined && s.skin < c.skin) return false;
  if (c.today !== undefined && !s.today.includes(c.today)) return false;
  if (c.notToday !== undefined && s.today.includes(c.notToday)) return false;
  if (c.knows !== undefined && !knows(s, c.knows)) return false;
  if (c.notKnows !== undefined && knows(s, c.notKnows)) return false;
  if (c.sentToday !== undefined && !s.routes[c.sentToday]?.sentToday) return false;
  if (c.wentToday !== undefined && !s.routes[c.wentToday]?.goesToday) return false;
  return true;
}

// The first unmet need's line, or null when everything holds.
export function unmet(s: GameState, needs: readonly Need[] = []): string | null {
  for (const n of needs) {
    if (holds(s, n)) continue;
    if (n.why) return fill(n.why, { t: clockShort(n.before ?? n.from ?? 0) });
    if (n.cash !== undefined) return `You're $${n.cash - s.cash} short.`;
    if (n.energy !== undefined) return 'Too tired.';
    if (n.skin !== undefined) return 'Your skin is done for today.';
    if (n.before !== undefined) return `Only before ${clockShort(n.before)}.`;
    if (n.from !== undefined) return `Not until ${clockShort(n.from)}.`;
    return 'Not now.';
  }
  return null;
}
