// Expeditions, as v0.956 had them (docs/audit/climbing.md §2.3): the big objectives far
// from the valley, weeks away, with the weather deciding as much as you do. A grade to be
// allowed, a cost up front in cash, a number of pitches to fix and days to do it in, the
// chance any day is a storm, and what the summit pays. v0.956 also wanted reputation; the
// rebuild has none yet, so the grade gate stands alone.
//
// Phase 24 climbs them: each objective's pitches are lines with a crux, led in blocks with a
// partner, and `thin` is how much narrower every window is up there: the length of the
// pitches, the cold, the wind and the altitude [proposed]. Tuned (Phase 24.1) so El Cap at its
// grade goes a little over half the time with Hazel and at its gate hardly ever, as 21.5's
// did; the further objectives are harder, and a stronger partner counts.

import type { Style } from '../climber';
import { EXPED } from '../dials';
import { EXPEDITION_DEFS } from './expeditions.full';
import { libraryPitch, type RouteDef } from './routes';

export interface ExpeditionDef {
  name: string;
  region: string;
  objective: string;
  // v0.956's grade for the objective, on the V scale your skills are measured on.
  grade: number;
  // The lowest grade that'll take you: v0.956's gradeReq.
  gradeReq: number;
  pitches: number;
  days: number;
  stormOdds: number;
  cost: number;
  pays: number;
  blurb: string;
  thin: number;
  // Phase 24.2: the water up there is snow, melted on a stove (Cerro Torre, Trango).
  melt?: true;
  // Phase 24.3 [proposed]: the days getting there and getting home, and what they are.
  out: number;
  home: number;
  getThere: string;
  // The pitches, bottom to top: a name, a grade and a style each.
  line: [string, number, Style][];
}

// The objectives themselves are the full game's (Phase 14.5b): the demo's build has none.
export const EXPEDITIONS: Record<string, ExpeditionDef> = EXPEDITION_DEFS;

// Every expedition's pitches as lines: `elcap-1` is El Cap's first. They're nowhere in the
// valley: their place is the expedition.
export const EXPED_ROUTES: Record<string, RouteDef> = Object.fromEntries(
  Object.entries(EXPEDITIONS).flatMap(([id, e]) =>
    e.line.map(([name, grade, type], i) => {
      const r = libraryPitch(id, i + 1, name, grade, type, id);
      return [r.id, { ...r, wall: undefined, exped: id }];
    }),
  ),
);
export const expedPitches = (id: string): RouteDef[] =>
  Object.values(EXPED_ROUTES).filter((r) => r.exped === id);

// What the cold, the wind, the altitude and the days up there do to every window.
export const expedWindows = (e: ExpeditionDef, onWall: number): number =>
  e.thin * Math.max(EXPED.fatigue.floor, 1 - EXPED.fatigue.perDay * Math.max(0, onWall - 1));

// Phase 24.3. The days a trip leaving on `day` keeps you from the valley, at most: getting
// there, every day of the wall, and getting home.
export const tripDays = (id: string, day: number): { from: number; wall: number; to: number } => {
  const e = EXPEDITIONS[id]!;
  return { from: day, wall: day + e.out, to: day + e.out + e.days + e.home - 1 };
};
