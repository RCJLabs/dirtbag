// Phase 26b (Evan's call, 13 Oct 2026): money in a day, as data. The day labor posted on the
// board by the market's door, and what the families at a busy crag say when you hang them a
// rope. The numbers are GIG's and TOURISTS' (dials.ts); the rules, gigs.ts.

import type { Season } from '../weather';

export interface GigDef {
  // What the notice says, and what the day was.
  label: string;
  says: string;
  // Only in these seasons, if it says.
  season?: Season[];
}

export const GIGS: Record<string, GigDef> = {
  move: {
    label: 'Help a family move house in Old Town',
    says: 'Nine hours of somebody else’s furniture up somebody else’s stairs. The couch fights you on the landing and wins twice.',
  },
  truck: {
    label: 'Unload a truck at the market',
    says: 'A refrigerated truck and a pallet jack with a wheel that sticks. Your forearms have opinions by noon.',
  },
  trail: {
    label: 'A day on the trail crew',
    says: 'A day moving rock for the trail crew, which is climbing with the fun taken out. The approach to the Gorge is a step better for it.',
    season: ['spring', 'summer', 'fall'],
  },
  hay: {
    label: 'Bring in Ed Miller’s hay',
    says: 'Bales off the field and into the barn till the light goes. Ed pays cash and throws in a dozen eggs, and doesn’t say much else.',
    season: ['summer', 'fall'],
  },
  fair: {
    label: 'Set up the crafts fair in the park',
    says: 'Tents, tables and a hundred zip ties, then all of it again in reverse. Somebody’s kid asks if you’re a climber. It’s the hands.',
    season: ['spring', 'summer', 'fall'],
  },
  shovel: {
    label: 'Shovel out the motel lot',
    says: 'Nine hours of snow that keeps falling into the places you’ve just cleared. The owner brings coffee at noon, and it’s terrible, and it’s the best thing all day.',
    season: ['winter'],
  },
};

// Said when a family at a busy crag asks you to hang them a rope, as you get there.
export const TOURISTS_ASK =
  'A family at the foot of the wall is reading a guidebook upside down. The dad catches your eye, then your rope.';

// Said of the hour, the line's name filled in.
export const TOURISTS_SAYS = [
  'You lead {line} and hang the rope for them. The kids go up it like it owes them money. Their dad goes up it like it doesn’t.',
  'You lead {line} and leave the rope up. The youngest gets to the top, looks down and announces she lives here now.',
  'You lead {line} and belay the whole family on it. Their mother gets highest, and nobody mentions it in the car.',
  'You hang a rope on {line}. The kids fight over who goes next, then over who has to come down.',
];
