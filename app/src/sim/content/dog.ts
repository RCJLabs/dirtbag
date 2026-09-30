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

// Phase 22.7: his life, in v0.956's words (its "they" is "he", as ever). {name} and {years}
// are filled in: a stray after Scout has a name of his own.

// Said the morning he reaches each age.
export const DOG_AGE_LINE = {
  gray: '{name} is going gray around the muzzle. {years} years of this. He is slower on the boulders now and he still will not be left behind.',
  senior:
    '{name} waited at the bottom of the approach today instead of running it twice. {years} years. You carried the pack a bit slower to match and neither of you mentioned it.',
};

// The vet, at the ages in DOG.vet, in order.
export const DOG_VET = [
  {
    title: 'The Limp',
    sit: 'He comes off the approach trail three-legged and will not let you look at the front left. It is not dramatic. That is somehow worse.',
    out: 'A torn pad and a course of something expensive. The vet says keep him off the talus for a fortnight, which you both know is aspirational.',
  },
  {
    title: 'The Lump',
    sit: 'There is something under the skin behind the shoulder that was not there in the spring, and you find it while he is asleep against your leg.',
    out: 'A fatty lump. Nothing. The vet says it very casually and you sit in the van afterwards for a while before starting it.',
  },
];

// Out at the crag, once he's gray.
export const DOG_GRAY_CRAG = [
  '{name} picks a flat rock in the sun at the base and stays on it all day.',
  '{name} walks the approach slower now and gets there anyway.',
  '{name} does not chase the boulder hoppers any more. {name} supervises.',
];

// Each perk, the day his bond earns it.
export const DOG_PERK_LINE = {
  settle: 'From now on, {name} lies down at the fire instead of pacing the whole camp.',
  find: 'From now on, {name} goes looking on purpose on his rounds at night.',
  watch: 'From now on, {name} knows a uniform from a person, and says so.',
};

// What he brings back, with the perk.
export const DOG_FIND_LINE =
  '{name} comes back from his rounds with {what} in his mouth. Nobody is asking where from.';

// The last day.
export const DOG_FAREWELL = {
  sit: 'He is not getting up the step into the van on his own any more, and this morning he did not really try. You have known for a while. You have been not-knowing on purpose for a while. How you spend it is up to you. There is no right one.',
  opts: [
    {
      label: 'Drive out to the crag one more time',
      out: 'He does not climb the approach so much as agree to it. You sit at the base of the first route you ever did here, together, for a couple of hours, and you do not get on anything. Best crag day in years.',
      legacy: 'went to the crag one last time',
    },
    {
      label: 'Nowhere. Just the two of you and the van doors open',
      out: 'You park somewhere with a view, open the back, and do nothing at all until the light goes. He sleeps against your leg the whole time. It is the thing you have done together ten thousand times and it is the last one.',
      legacy: 'spent it with the van doors open',
    },
    {
      label: 'Take him round everybody',
      out: 'The fire, the crew, the ones who have been feeding him behind your back for years. Everybody says the same thing in a slightly different way, and nobody rushes it.',
      legacy: 'was seen off by the whole Lot',
    },
  ],
  close: {
    best: '{years} years in a van with somebody who thought you were the best thing that ever happened. He was not wrong and neither were you.',
    other:
      '{years} years. He found you at a crag and stayed, which was the whole of his opinion on the matter.',
  },
};
