// Phase 39: each crag's classics. Five hand-picked lines on each crag's card (`PlaceDef.classics`,
// across its grades and kinds), and every first ascent of yours there once its grade has settled
// (32.4). Any send ticks one. Tick every classic at a crag, at least `CLASSICS.list` of them, and
// you're a local there: no waiting on a busy day, and somebody there knows the beta on a quiet
// one. All of it is worked out from your sends and first ascents: nothing new is kept.

import { PLACES } from './content/places';
import { ROUTES } from './content/routes';
import { CLASSICS } from './dials';
import { settled } from './settle';
import type { GameState } from './types';

// A crag's classics: its hand-picked ones, then your first ascents there whose grades have settled.
export function classicsAt(s: GameState, place: string): string[] {
  const set = PLACES[place]?.classics ?? [];
  const yours = Object.keys(s.firsts).filter(
    (id) => !s.firsts[id]!.by && ROUTES[id]?.place === place && !set.includes(id) && settled(s, id),
  );
  return [...set, ...yours];
}

export const ticked = (s: GameState, id: string): boolean => !!s.routes[id]?.sent;

// A local: every classic at the crag ticked, and at least CLASSICS.list of them. Where the lines
// are still to be climbed, your own first ascents fill the list.
export function localAt(s: GameState, place: string): boolean {
  const c = classicsAt(s, place);
  return c.length >= CLASSICS.list && c.every((id) => ticked(s, id));
}

export const localPlaces = (s: GameState): string[] =>
  Object.keys(PLACES).filter((p) => PLACES[p]!.crag && localAt(s, p));
