// Phase 17.6: the year's holidays, as nights at the fire with your people in them, and the
// family back home, as calls across the years, returned from the van, the last of them asking
// you home for good.

import type { Season } from '../weather';

export interface Holiday {
  name: string;
  // The night, before who's there.
  text: string;
  // When nobody you're close to is around.
  alone: string;
}

// One a season, mid-season (HOLIDAY.on).
export const HOLIDAYS: Record<Season, Holiday> = {
  fall: {
    name: 'Harvest',
    text: 'Harvest at the Lot: somebody’s roasting squash in the coals, somebody else has brought cider nobody asks about.',
    alone: 'Harvest at the Lot, and nobody you know is about. You eat the squash anyway.',
  },
  winter: {
    name: 'Longest Night',
    text: 'The longest night of the year. The fire’s bigger than it needs to be, which is the point.',
    alone: 'The longest night, and you spend it with the stove and a book. It is very long.',
  },
  spring: {
    name: 'First Dry Rock',
    text: 'First Dry Rock: the night the valley decides the season’s on. Someone’s brought a cake shaped badly like a hold.',
    alone: 'First Dry Rock, and the valley’s celebrating without you. You can hear it from the van.',
  },
  summer: {
    name: 'Midsummer',
    text: 'Midsummer. It’s light till ten and nobody wants to go to bed while it is.',
    alone: 'Midsummer, light till ten, and nobody to stay up for.',
  },
};

// Who's there, a line each.
export const HOLIDAY_WITH: Record<string, string> = {
  hazel: 'Hazel’s on coffee duty, as ever, and has made it worse than usual on purpose.',
  sage: 'Sage reads the tick list out loud, and everyone pretends not to care whose name is on it.',
  dex: 'Dex turns up late with something expensive and leaves early, and you’re glad he came.',
  mara: 'Mara stays the whole night, which surprises everyone, Mara included.',
  rico: 'Rico tells the story of your worst fall. It’s better every year.',
  tam: 'Tam sits furthest from the fire and closest to the view, and says the one thing worth hearing.',
  ray: 'Ray tells the one about the first bolt. You could tell it yourself now.',
  frank: 'Frank brings his chair and a pot of something that’s been on the stove since noon.',
};

// The family back home: a call every two years on the age clock (FOLKS), the last asking you
// home. The first answer always keeps you climbing; going home is never the default.
export interface FolksCall {
  title: string;
  sit: string;
  opts: { label: string; out: string; psyche?: number; cash?: number; home?: true }[];
}

export const FOLKS_CALLS: FolksCall[] = [
  {
    title: 'Your mum',
    sit: 'Your phone goes as you’re turning in. Your mum, asking if you’re eating. You say you are. She asks what.',
    opts: [
      {
        label: 'Tell her about the climbing',
        out: 'You tell her about the climbing. She doesn’t follow any of it and listens to all of it.',
        psyche: 6,
      },
      { label: '"I’m fine, Mum"', out: '"You always say that," she says, and lets it go.' },
    ],
  },
  {
    title: 'Your dad’s birthday',
    sit: 'A text from your sister: "Dad’s birthday was yesterday. Just saying." It was.',
    opts: [
      {
        label: 'Text him',
        out: 'You text him. He replies with one word and a thumbs up, which is a lot, for him.',
      },
      {
        label: 'Call him properly',
        out: 'You call him properly. He talks about the garden for twenty minutes. You let him.',
        psyche: 8,
      },
    ],
  },
  {
    title: 'Your sister',
    sit: 'Your sister, late, giddy: she’s having a baby. "You’re going to be the aunt or uncle who lives in a van," she says. "It’s the best kind."',
    opts: [
      {
        label: '"I’ll come and meet them"',
        out: 'You promise to come and meet them. She says she’ll hold you to it.',
        psyche: 6,
      },
      {
        label: 'Send something for the baby',
        out: 'You send a tiny chalk bag. She sends back a photo of it, full of socks.',
        cash: -25,
        psyche: 10,
      },
    ],
  },
  {
    title: 'Your dad',
    sit: 'Your mum, careful: your dad’s had a scare. He’s fine, mostly. He’s home. He asked if you’d called.',
    opts: [
      {
        label: 'Call him now',
        out: 'You call him now. He’s fine, mostly, and pleased you called, mostly.',
        psyche: 4,
      },
      {
        label: 'Go home for a long weekend',
        out: 'You take the bus home for a long weekend. He’s fine. You’re glad you went.',
        cash: -80,
        psyche: 14,
      },
    ],
  },
  {
    title: 'Home',
    sit: 'Your mum again. "Your dad and I were talking. Your room’s still your room. There’s a crag an hour from here, your sister says." A pause. "Come home for good?"',
    opts: [
      {
        label: '"Not yet"',
        out: '"Not yet," you say. "Not yet" is what she expected. She says the room will keep.',
      },
      {
        label: 'Come home for good',
        out: 'You say yes. The van goes up for sale on the Lot’s noticeboard by morning.',
        home: true,
      },
    ],
  },
];
