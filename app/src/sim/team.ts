// Phase 25.4: a young team's trip you pay for. Only to an objective you've stood on top of:
// what you can tell them is their odds, with the weather. They're gone as long as your own
// trip would be, and the night they're back, the story's yours to hear.

import { EXPEDITIONS, tripDays } from './content/expeditions';
import { TEAMS } from './content/team';
import { expedCost } from './dreams';
import { TEAM } from './dials';
import { Rng } from './rng';
import type { GameState } from './types';

// What their trip costs you.
export const teamCost = (s: GameState, id: string): number =>
  Math.round(expedCost(s, EXPEDITIONS[id]!.cost) * TEAM.cost);

// Who'd go: a pair by the seed and the day, led by the kid you coach once they're good enough.
export function teamNames(s: GameState): [string, string] {
  const [a, b] = TEAMS[(s.seed.length + s.day) % TEAMS.length]!;
  return s.mentee && s.mentee.level >= TEAM.mentee ? [s.mentee.name, b] : [a, b];
}

// Their odds, from what you know of the objective, the weather there, and who leads.
export function teamOdds(s: GameState, id: string): number {
  const e = EXPEDITIONS[id]!;
  const trips = s.book.filter((t) => t.id === id);
  const tops = trips.filter((t) => t.end === 'summit').length;
  const know =
    TEAM.base +
    TEAM.summit * Math.min(TEAM.cap, tops) +
    TEAM.tried * Math.min(TEAM.cap, trips.length - tops) +
    (s.mentee && s.mentee.level >= TEAM.mentee ? TEAM.coached : 0);
  return Math.min(TEAM.max, (1 - e.stormOdds) * know);
}

// Why you can't pay for one now, or null.
export function teamBlocked(s: GameState, id: string): string | null {
  const e = EXPEDITIONS[id]!;
  if (s.team) return `${s.team.names.join(' and ')} are still away`;
  if (!s.book.some((t) => t.id === id && t.end === 'summit'))
    return `Only somewhere you’ve stood on top: ${e.objective} isn’t yet`;
  if (s.cash < teamCost(s, id)) return 'Not enough cash';
  return null;
}

// The night they're back: the summit, or how high they got.
export function teamHome(s: GameState): { summit: boolean; high: number } {
  const t = s.team!;
  const e = EXPEDITIONS[t.id]!;
  const r = Rng.fromStream(s.seed, 'events').derive(`team-${t.id}-${t.left}`);
  if (r.next() < t.odds) return { summit: true, high: e.pitches };
  return { summit: false, high: r.int(0, e.pitches - 1) };
}

// The last day they're away: as long as your own trip, leaving today.
export const teamBack = (id: string, day: number): number => tripDays(id, day).to;
