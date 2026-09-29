// Where you are in the story: Act I's goals, checked after everything you do, in order.

import { gradeOf } from './climber';
import { routeById } from './content/gym';
import { PLACES } from './content/places';
import { ACT_I, type Aim, type Goal } from './content/story';
import { BOND } from './dials';
import { fill } from './format';
import { PARTNERS } from './presence';
import type { GameState } from './types';

// How far along a stage is: what you have against what it asks.
export function progress(s: GameState, aim: Aim): { have: number; need: number } {
  if ('cash' in aim) return { have: Math.max(0, s.cash), need: aim.cash };
  if ('grade' in aim) return { have: gradeOf(s.climber.skills), need: aim.grade };
  if ('regular' in aim) {
    const best = Math.max(0, ...PARTNERS.map((w) => s.people[w]?.bond ?? 0));
    return { have: Math.min(best, BOND.tiers[2]!), need: BOND.tiers[2]! };
  }
  const sent = Object.entries(s.routes).filter(([, l]) => l.sent);
  if ('sends' in aim) return { have: sent.length, need: aim.sends };
  const outside = sent.filter(([id]) => PLACES[routeById(s.seed, id)?.place ?? '']?.crag);
  return { have: outside.length, need: aim.sendsOutside };
}

export const aimMet = (s: GameState, aim: Aim): boolean => {
  const p = progress(s, aim);
  return p.have >= p.need;
};

// The stage you're on, or null once the act's done.
export const currentGoal = (s: GameState): Goal | null => ACT_I[s.goals] ?? null;

// A stage's ask in words, from its own number.
export function goalDesc(g: Goal): string {
  const a = g.aim;
  const n =
    'cash' in a
      ? a.cash
      : 'grade' in a
        ? a.grade
        : 'sends' in a
          ? a.sends
          : 'sendsOutside' in a
            ? a.sendsOutside
            : 0;
  return fill(g.desc, { n });
}
