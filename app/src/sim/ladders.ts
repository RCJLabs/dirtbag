// Phase 18.7: the four ladders a career climbs, on one screen. Each is a list of rungs, the
// last its capstone, and how many of them you've climbed. The rules for each live with their
// system (the story, comps, media, the business); this only reads them.

import { businessRung } from './business';
import { COMP_LADDER, COMP_TIERS } from './content/comps';
import { JOBS } from './content/jobs';
import { SPONSORS } from './content/media';
import { MEDIA, OWN_GYM } from './dials';
import { mediaRung } from './media';
import { actOf, storyOf } from './story';
import type { GameState } from './types';

export type LadderId = 'outdoor' | 'comp' | 'media' | 'business';

export interface Ladder {
  id: LadderId;
  name: string;
  // Each rung's name, bottom to top: the last is the capstone.
  rungs: (s: GameState) => string[];
  // How many you've climbed, 0 to the rungs' length.
  at: (s: GameState) => number;
}

// Comps: each rung once you've competed at it; the Games, by invitation, on top. A podium
// there is the Record Book's, not the ladder's: the comp bots make the Games at V13 or so and
// place sixth at best (Phase 18.7).
// The highest rung you've competed on; the side comps aren't rungs (Phase 25.5).
const compAt = (s: GameState): number =>
  s.comps.results.reduce((a, r) => Math.max(a, COMP_LADDER.indexOf(r.tier) + 1), 0);

export const LADDERS: Ladder[] = [
  {
    id: 'outdoor',
    name: 'Outdoors',
    // The story's acts: projects, first ascents, the crew's line, expeditions, The Line.
    rungs: (s) => storyOf(s).map((a) => a.title),
    at: (s) => Math.min(storyOf(s).length, actOf(s) - 1),
  },
  {
    id: 'comp',
    name: 'Comps',
    rungs: () => COMP_LADDER.map((i) => COMP_TIERS[i]!.name),
    at: compAt,
  },
  {
    id: 'media',
    name: 'Media',
    rungs: () => [
      `${MEDIA.known.toLocaleString('en-US')} followers`,
      ...SPONSORS.map((x) => x.name),
      'The film',
    ],
    at: mediaRung,
  },
  {
    id: 'business',
    name: 'Work and business',
    rungs: () => [...JOBS.set!.ranks, 'Your own gym', `${OWN_GYM.members.top} members at Send City`],
    at: businessRung,
  },
];

export const ladderById = (id: LadderId): Ladder => LADDERS.find((l) => l.id === id)!;

// Whether a ladder's top rung is climbed.
export const capstone = (s: GameState, id: LadderId): boolean => {
  const l = ladderById(id);
  return l.at(s) >= l.rungs(s).length;
};
