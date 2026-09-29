// Scout: the Lot's stray, who picks you after your tenth trip out. His lines are v0.956's,
// which called its dog "they"; Scout was always a he.

// What he gets up to, by where you are and how close you are: hungry first, then by bond
// (new pup under 30, good buddy under 70, best friend).
export const DOG_LINES = {
  crag: {
    hungry: [
      'Scout is working the crowd at the base for food, and doing well out of it.',
      'Scout keeps checking the pack. Scout knows what is in the pack.',
    ],
    tiers: [
      [
        'Scout will not settle and keeps going to the end of the lead.',
        'Scout is very interested in a hole. It has been twenty minutes.',
        'Scout barks at a crow, twice, on principle.',
      ],
      [
        'Scout does a full lap of the base, greets everybody, and comes back to your pack.',
        "Scout has found somebody else's lunch. It is being handled.",
        'Scout is asleep on the crash pad, which is what the crash pad is for.',
      ],
      [
        'Scout lies exactly at the bottom of your route and does not move until you come down.',
        'Scout watches you the whole way up, which is more than most belayers manage.',
        'Scout has picked a spot in the shade with a view of you, and that is not a coincidence.',
      ],
    ],
  },
  drive: {
    hungry: [
      'Scout spends the whole drive with his nose in the footwell where a crisp went once, in another year.',
      'Scout will not settle. Scout is thinking about breakfast, which did not happen.',
    ],
    tiers: [
      [
        'Scout does three laps of the back before settling somewhere inconvenient.',
        'Scout is asleep in the footwell before the town is behind you.',
      ],
      [
        'Scout rides shotgun and watches the road like he is navigating.',
        'Scout rides shotgun with his head out and his eyes shut, which cannot be comfortable and clearly is.',
      ],
      ['Scout sits up front like it was agreed years ago, because it was.'],
    ],
  },
  play: [
    'A stick roughly the size of a canoe. He will not be talked out of it.',
    'Full-lot zoomies, twice, at a speed that seems structurally unwise.',
    'Twenty minutes of tug with an old sling. He wins. He always wins.',
    'He brings the ball back to a spot four feet away from you, every time, on principle.',
    'He digs a hole for no reason anybody could establish, and then lies in it looking delighted.',
  ],
};

// The day he picks you, and what you say.
export const DOG_OFFER = {
  first: 'Scout watched the van pull out this morning. He has been doing that lately.',
  sub: "Scout's been sleeping by your van, not the fire. When you open the door he's already standing there, ears up, like it was decided while you were out.",
  yes: '“Come on then. You’re with me.”',
  took: "Scout hops in the van like he's always been yours.",
  no: 'Give him your water, walk away',
  left: 'Scout drinks the water and watches you go.',
};

export const DOG_TIER_NAME = ['New pup', 'Good buddy', 'Best friend'];
