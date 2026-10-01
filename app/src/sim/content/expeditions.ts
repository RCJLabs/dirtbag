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

export const EXPEDITIONS: Record<string, ExpeditionDef> = {
  elcap: {
    name: 'El Capitan',
    region: 'Yosemite, USA',
    objective: 'The Nose',
    grade: 9,
    gradeReq: 7,
    pitches: 6,
    days: 10,
    stormOdds: 0.18,
    cost: 900,
    pays: 2400,
    blurb:
      'Three thousand feet of golden granite, the most famous big wall on Earth. A week living on portaledges.',
    thin: 0.6,
    out: 1,
    home: 1,
    getThere: 'A day’s drive to the Valley, and the haul bags up to the base of the Nose.',
    line: [
      ['Sickle Ledge', 7, 'endurance'],
      ['The Stovelegs', 8, 'crack'],
      ['The King Swing', 8, 'dyno'],
      ['The Great Roof', 9, 'technical'],
      ['The Changing Corners', 9, 'technical'],
      ['Up to the Bolt Ladder', 8, 'endurance'],
    ],
  },
  cerrotorre: {
    name: 'Cerro Torre',
    region: 'Patagonia, Argentina',
    // Evan's call (1 Oct 2026): the Compressor's line, climbed by fair means since its bolt
    // ladder was chopped in 2012.
    objective: 'the Southeast Ridge',
    grade: 12,
    gradeReq: 10,
    pitches: 8,
    days: 16,
    stormOdds: 0.44,
    cost: 2200,
    pays: 6000,
    blurb:
      'A fang of rime ice in the worst weather on the planet. You will wait out storms, and the good days are everything.',
    // No ice climbing in the game (Evan's call): rock pitches, narrowed by the cold and wind.
    thin: 0.65,
    melt: true,
    out: 2,
    home: 2,
    getThere: 'Two days of flights to El Chaltén, then the walk in under the Torre glacier.',
    line: [
      ['The Col of Patience', 10, 'endurance'],
      ['The Ice Towers', 11, 'crack'],
      ['The Rime Corners', 11, 'technical'],
      ['The Traverse', 11, 'technical'],
      ['The Headwall', 12, 'crack'],
      ['Where the Bolts Were', 12, 'crimp'],
      ['The Last Cracks', 12, 'crack'],
      ['The Mushroom', 11, 'endurance'],
    ],
  },
  trango: {
    name: 'Trango Tower',
    region: 'Karakoram, Pakistan',
    objective: 'Eternal Flame',
    grade: 14,
    gradeReq: 12,
    pitches: 11,
    days: 24,
    stormOdds: 0.56,
    cost: 4500,
    pays: 12000,
    blurb:
      'A twenty-thousand-foot granite spire at the edge of the world. Weeks in, and one shot at the top.',
    thin: 0.65,
    melt: true,
    out: 8,
    home: 6,
    getThere:
      'Three days of flights and a jeep to Skardu, then five days up the Baltoro, acclimatizing as you go.',
    line: [
      ['The Approach Gully', 11, 'endurance'],
      ['The Lower Cracks', 12, 'crack'],
      ['The Ramp', 12, 'technical'],
      ['The Snow Ledge', 12, 'endurance'],
      ['The Splitter', 13, 'crack'],
      ['The Pendulum', 13, 'dyno'],
      ['The Crux', 14, 'technical'],
      ['The Upper Cracks', 13, 'crack'],
      ['The Ice Chimney', 13, 'endurance'],
      ['The Headwall', 14, 'crimp'],
      ['The Summit Block', 13, 'power'],
    ],
  },
};

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
