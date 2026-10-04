// Phase 25.2: a guiding day. The day's clients (seeded by the day), each to be put on a
// different line at the crag: not so easy they're bored, not so far past their goal they're
// frightened, and their goal if they can send it. Scored against the best the day allowed.
// Then, at Lead guide, an outfit of your own.

import { GUIDE_CLIENTS } from './content/guiding';
import { ROUTES, type RouteDef } from './content/routes';
import { GUIDING } from './dials';
import { rankAt } from './jobs';
import { Rng } from './rng';
import type { GameState } from './types';

export interface Guest {
  name: string;
  level: number;
  goal: number;
  nervous: boolean;
}

// The lines a guided day uses: the crag's, up to the top grade a client ever wants; not an
// open project, which nobody's climbed.
export const guideCragLines = (): RouteDef[] =>
  Object.values(ROUTES)
    .filter(
      (r) =>
        r.place === GUIDING.crag &&
        !r.exped &&
        !r.wall &&
        !r.hiddenUntil &&
        !r.open &&
        r.grade <= GUIDING.maxGrade,
    )
    .sort((a, b) => a.grade - b.grade || a.id.localeCompare(b.id));

// Today's clients: more of them as you rise, and stronger.
export function guestsToday(s: GameState): Guest[] {
  const rank = rankAt(s, 'guide');
  const n = GUIDING.clients[Math.min(rank, GUIDING.clients.length - 1)]!;
  const r = Rng.fromStream(s.seed, 'events').derive(`guide-${s.day}`);
  const start = r.int(0, GUIDE_CLIENTS.length - 1);
  // Their goal first, never past the crag's hardest line, and harder as you rise; then where
  // they climb, a grade or two under it.
  const top = Math.max(...guideCragLines().map((x) => x.grade));
  return Array.from({ length: n }, (_, i) => {
    const goal = r.int(GUIDING.goal0[0]!, Math.min(top, GUIDING.goal0[1]! + rank));
    return {
      name: GUIDE_CLIENTS[(start + i) % GUIDE_CLIENTS.length]!,
      level: Math.max(0, goal - r.int(1, 2)),
      goal,
      nervous: r.next() < GUIDING.nerves,
    };
  });
}

// The chance a client sends a line of this grade.
export const sendChance = (g: Guest, grade: number): number =>
  1 / (1 + Math.exp(-GUIDING.steep * (g.level + 1 - grade - (g.nervous ? 1 : 0))));

// What a line is worth to a client's day.
export function guestValue(g: Guest, grade: number): number {
  if (grade < g.level - 1) return GUIDING.bored;
  if (grade > g.goal) return g.nervous ? 0 : GUIDING.scared;
  if (grade < g.goal) return 1;
  // Their goal: the day of their life if they send it, and a frightening one if they don't.
  const p = sendChance(g, grade);
  return p * (1 + GUIDING.goal) + (1 - p) * GUIDING.fail;
}

// A plan's worth: a line each, all different.
export function planValue(guests: Guest[], ids: readonly string[]): number {
  return guests.reduce((a, g, i) => a + guestValue(g, ROUTES[ids[i]!]?.grade ?? 0), 0);
}

// The best the day allowed.
export function bestPlan(guests: Guest[]): { value: number; ids: string[] } {
  const lines = guideCragLines();
  let best = { value: -1, ids: [] as string[] };
  const go = (i: number, ids: string[]) => {
    if (i === guests.length) {
      const v = planValue(guests, ids);
      if (v > best.value) best = { value: v, ids: [...ids] };
      return;
    }
    for (const r of lines) if (!ids.includes(r.id)) go(i + 1, [...ids, r.id]);
  };
  go(0, []);
  return best;
}

// Why a plan can't be guided, or null.
export function planRefused(guests: Guest[], ids: readonly string[]): string | null {
  if (ids.length !== guests.length) return 'A line for each client.';
  if (new Set(ids).size !== ids.length) return 'One rope to a line.';
  const ok = new Set(guideCragLines().map((r) => r.id));
  if (ids.some((id) => !ok.has(id))) return 'That’s not a line you guide on.';
  return null;
}

// ---- the outfit ----

// Why you can't start your own outfit, or null.
export function outfitBlocked(s: GameState): string | null {
  if (s.outfit) return 'You run one already';
  if (rankAt(s, 'guide') < 2) return 'The shop backs its lead guides, and only them';
  if (s.cash < GUIDING.outfit.price) return `It’s $${GUIDING.outfit.price.toLocaleString('en-US')}, in hand`;
  return null;
}

// A day's money for the outfit: each guide out on an open day, the insurance always.
export function outfitDay(guides: number, open: boolean): number {
  const O = GUIDING.outfit;
  return (open ? guides * (O.fee - O.wage) : 0) - O.insurance;
}
