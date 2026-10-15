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

// Phase 35.4 (Evan's call): a scene each, with your people there: a choice or two, and what
// each does. The first never needs anything (a dish in the pantry, the money for cider), so
// it's always there to take. {dish}: the ingredient you bring.
export interface HolidayFx {
  psyche?: number;
  energy?: number;
  skin?: number;
  fed?: number;
  cash?: number;
  // With each of your people who's there.
  bond?: number;
  // Two servings of what the pantry holds most of.
  dish?: true;
}
export interface HolidayOpt {
  label: string;
  out: string;
  fx: HolidayFx;
}

export const HOLIDAY_SCENES: Record<Season, { scene: string; opts: HolidayOpt[] }> = {
  fall: {
    scene:
      'Sendsgiving: a potluck on the picnic table, every dish a guess at what everyone else is bringing.',
    opts: [
      {
        label: 'Bring a fork and an appetite',
        out: 'You eat like it is your job. Somebody sends you back to the van with leftovers, which is the highest honor the Lot has.',
        fx: { psyche: 8, fed: 25 },
      },
      {
        label: 'Bring a dish from the pantry',
        out: 'Your dish of {dish} goes first, which is either a compliment or a warning. Everyone has seconds anyway.',
        fx: { psyche: 14, fed: 20, bond: 1, dish: true },
      },
      {
        label: 'Bring the cider nobody asks about',
        out: 'Nobody asks where it came from. Everybody has a cup, and then another.',
        fx: { psyche: 12, fed: 15, cash: -8 },
      },
    ],
  },
  winter: {
    scene:
      'Somebody has strung headlamps along the boulders behind the Lot, and the problems everyone knows by heart look new in the dark.',
    opts: [
      {
        label: 'Stay by the fire',
        out: 'Somebody else can climb in the dark. You hold your mug in both hands and watch the lamps bob on the boulders like slow fireflies.',
        fx: { psyche: 8, energy: 6 },
      },
      {
        label: 'Climb by headlamp',
        out: 'The holds look like nothing in the lamplight and feel like everything. You top out the warm-up in the dark and the whole Lot cheers as if it were a first ascent.',
        fx: { psyche: 14, energy: -10, skin: -6 },
      },
      {
        label: 'Hold the lamps for everyone else',
        out: 'You spot, you shine, you shout. By midnight everyone has sent something, and you are hoarse and happier than any of them.',
        fx: { psyche: 10, energy: -4, bond: 1 },
      },
    ],
  },
  spring: {
    scene:
      'Tomorrow the whole valley will be at Roadside for the opener. Tonight it is at the fire, arguing about whether the rock is really dry.',
    opts: [
      {
        label: 'Toast the season',
        out: 'Somebody makes a speech about friction. It is not a good speech. Everyone cheers it anyway.',
        fx: { psyche: 10 },
      },
      {
        label: 'Write the season’s tick list on the cake board',
        out: 'Everybody adds a line. Yours goes in the middle, small, where nobody will read it out loud. Somebody reads it out loud.',
        fx: { psyche: 12, bond: 1 },
      },
      {
        label: 'Turn in early for the opener',
        out: 'You are asleep before the cake is cut, and first at Roadside in the morning, and the rock is exactly as dry as everyone said.',
        fx: { psyche: 6, energy: 12 },
      },
    ],
  },
  summer: {
    scene:
      'The solstice fire: nobody is going to bed while it is still light, and it is going to be light for a long time.',
    opts: [
      {
        label: 'Stay up for the sunrise',
        out: 'Light till ten, dark for a blink, light again before four. You are still at the fire when it comes up, and so are the people who matter.',
        fx: { psyche: 12, energy: -12 },
      },
      {
        label: 'Walk up the hill for the last light',
        out: 'The light goes the color of a peach and stays that way for an hour. Nobody says anything, and nobody needs to.',
        fx: { psyche: 10, energy: -6, bond: 1 },
      },
      {
        label: 'Turn in at a sensible hour',
        out: 'You hear them till three. You sleep anyway, which is its own kind of celebration.',
        fx: { psyche: 4, energy: 10 },
      },
    ],
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
    title: 'Your mom',
    sit: 'Your phone goes as you’re turning in. Your mom, asking if you’re eating. You say you are. She asks what.',
    opts: [
      {
        label: 'Tell her about the climbing',
        out: 'You tell her about the climbing. She doesn’t follow any of it and listens to all of it.',
        psyche: 6,
      },
      { label: '"I’m fine, Mom"', out: '"You always say that," she says, and lets it go.' },
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
    sit: 'Your mom, careful: your dad’s had a scare. He’s fine, mostly. He’s home. He asked if you’d called.',
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
    sit: 'Your mom again. "Your dad and I were talking. Your room’s still your room. There’s a crag an hour from here, your sister says." A pause. "Come home for good?"',
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
