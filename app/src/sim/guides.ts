// Phase 25.1: a guide of your own, after v0.956's (a crag you knew well enough let you write
// one). Here: every line at a crag sent, and one of them yours, then a few evenings at the van.
// Out, it pays royalties every week.

import { bolted } from './business';
import { GUIDE } from './dials';
import { PLACES } from './content/places';
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

// The crags a guide could be written for.
export const GUIDE_CRAGS = Object.keys(PLACES).filter((id) => PLACES[id]!.crag);

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
