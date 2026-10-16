// Phase 25.1: a guide of your own, after v0.956's (a crag you knew well enough let you write
// one). Here: every line at a crag sent, and one of them yours, then a few evenings at the van.
// Out, it pays royalties every week.

import { bolted } from './business';
import { GUIDE } from './dials';
import { inEdition } from './edition';
import { ACTS, PLACES } from './content/places';
import { ROUTES, type RouteDef } from './content/routes';
import type { GameState } from './types';

// The lines a crag's guide covers: everything on its rock you can read, walls and expeditions
// aside (they have topos of their own).
export const guideLines = (s: GameState, place: string): RouteDef[] =>
  Object.values(ROUTES).filter(
    (r) =>
      r.place === place &&
      !r.exped &&
      !r.wall &&
      (!r.hiddenUntil || !!s.routes[r.hiddenUntil]?.sent) &&
      bolted(s, r),
  );

// The crags a guide could be written for: the demo's own, in the demo (Phase 14.5b). Asked each
// time, since the full game playing the demo's rules till it's unlocked (19.1) only knows which
// it is once it starts.
export const guideCrags = (): string[] =>
  Object.keys(PLACES).filter((id) => PLACES[id]!.crag && inEdition(id));

// What's still to do before you can write one: lines unsent, and whether one's your own.
export function guideLeft(s: GameState, place: string): { unsent: number; fa: boolean } {
  const lines = guideLines(s, place);
  return {
    unsent: lines.filter((r) => !s.routes[r.id]?.sent).length,
    fa: lines.some((r) => s.firsts[r.id] && !s.firsts[r.id]!.by),
  };
}

// Why you can't write tonight's pages of this crag's guide, or null.
export function guideBlocked(s: GameState, place: string): string | null {
  const p = PLACES[place];
  if (!p?.crag) return 'Not a crag';
  if (s.guides[place]?.out) return `${p.name}’s guide is out already`;
  const left = guideLeft(s, place);
  if (left.unsent) return `${left.unsent} line${left.unsent > 1 ? 's' : ''} there you haven’t sent`;
  if (!left.fa) return `Put up a line of your own at ${p.name} first`;
  if (s.at !== 'lot') return 'You write it at the van';
  if (s.today.includes('guide')) return 'You’ve written tonight’s pages';
  if (s.energy < GUIDE.energy) return 'Too tired to write';
  return null;
}

// The guides you have out.
export const guidesOut = (s: GameState): string[] =>
  Object.entries(s.guides)
    .filter(([, g]) => g.out !== null)
    .map(([id]) => id);

// Phase 32.4 (Evan's call): what a guide pays a week. Its royalty, and a little for each first
// ascent of yours in it: those you'd put up by the day it came out (later ones aren't in it).
export const fasIn = (s: GameState, place: string): number => {
  const out = s.guides[place]?.out;
  if (out === null || out === undefined) return 0;
  return guideLines(s, place).filter((r) => {
    const f = s.firsts[r.id];
    return !!f && !f.by && f.day <= out;
  }).length;
};
export const royaltyOf = (s: GameState, place: string): number =>
  GUIDE.royalty + GUIDE.perFa * fasIn(s, place);

// The poorest job's week: the least a first-rank shift pays, `GUIDE.week` times. Every guide's
// royalties together never come to more: a guide's a bonus, never a living.
export const poorestWeek = (): number =>
  Math.min(
    ...Object.values(ACTS)
      .filter((a) => a.job?.shifts === 1 && (a.cost.cash ?? 0) > 0)
      .map((a) => a.cost.cash!),
  ) * GUIDE.week;

export const royalties = (s: GameState): number =>
  Math.min(
    poorestWeek(),
    guidesOut(s).reduce((t, id) => t + royaltyOf(s, id), 0),
  );
