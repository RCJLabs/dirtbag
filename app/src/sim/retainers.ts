// Phase 34.2: the costs of ambition, as opt-in retainers (Evan's call). A physio and a coach,
// each paid a week at a time from the day you take them on, the first week up front; let go,
// the payments stop and nothing comes back.

import { RETAINER_SAYS } from './content/retainers';
import { RETAINER } from './dials';
import { fill, money } from './format';
import type { GameState } from './types';

export type RetainerId = keyof typeof RETAINER;
export const RETAINERS = Object.keys(RETAINER) as RetainerId[];

// Where each is taken on: the clinic, and the Cave, whose coaches it is.
export const RETAINER_AT: Record<RetainerId, string> = { physio: 'clinic', coach: 'cave' };

export const retained = (s: GameState, id: RetainerId): boolean => (s.retainers?.[id] ?? null) !== null;

// Whether a retainer's next week falls due on the night a day ends: a week from the day it
// was taken on, and every week after.
export const dueTonight = (s: GameState, id: RetainerId, ended: number): boolean => {
  const since = s.retainers?.[id] ?? null;
  return since !== null && ended >= since && (ended - since + 1) % 7 === 0;
};

// Why you can't take one on, or let it go, now; null when you can.
export function retainerBlocked(s: GameState, id: RetainerId, on: boolean): string | null {
  if (s.at !== RETAINER_AT[id]) return 'Not here';
  if (on && retained(s, id)) return 'You’ve one already';
  if (!on && !retained(s, id)) return 'You haven’t one to let go';
  if (on && s.cash < RETAINER[id].weekly) return `The first week’s ${money(RETAINER[id].weekly)}, up front`;
  return null;
}

// What each does, in words, from the dials.
export const retainerNote = (id: RetainerId, kept = false): string => {
  const say = RETAINER_SAYS[id];
  const values: Record<string, string | number> = {
    days: RETAINER.physio.days,
    gain: `${Math.round(RETAINER.coach.gain * 100)}%`,
  };
  return fill(kept ? say.kept : say.note, values);
};
