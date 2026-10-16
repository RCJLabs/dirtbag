// Phase 32.2: the Hollow's quest, in words. Three people each know a piece of the way in; with
// all three, the walk up the wash from the Gorge (content/epics.ts, `hollow`). The full game's
// only (Phase 14.5b): the demo's build takes hollow.demo.ts.

import type { HollowClue } from '../types';
import type { Epic } from './epics';
import type { TalkNode } from './people';
import type { RecordEntry } from './record';
import type { Stance } from './scene';

// The old-timer's word: Ray's unsent line wasn't at Roadside at all (Phase 17's arc beat 3);
// once he's gone, Frank has it from him.
export const OLD_WORD: Record<string, TalkNode> = {
  ray: {
    calls: true,
    text: '“That line I never sent,” Ray says, and stops. “It isn’t here. Past the Gorge there’s a wash with no sign on it. Follow it till the walls close in. Take your time in there.” He doesn’t say any more about it, then or ever.',
    opts: [{ label: 'Remember it', fx: { clue: 'old' } }],
  },
  frank: {
    calls: true,
    text: '“Ray told me something once, so somebody would know,” Frank says. “A canyon past the Gorge. Up the wash with no sign on it, and slow in the narrow bit. That’s all I’ve got, and now you’ve got it.”',
    opts: [{ label: 'Remember it', fx: { clue: 'old' } }],
  },
};

// The old hand on the road: his sign says THE CANYON, and now you ask.
export const HITCH_ASK = {
  label: 'Ask about the canyon on his sign',
  out: 'He looks at you a long time, then draws on the back of a receipt: the Gorge road, a wash, a dead juniper where it forks. “Take the left. Everybody takes the right.”',
};

// The old guidebook at the gear shop.
export const BOOK_ROW = {
  label: 'Leaf through the old guidebook',
  note: 'Under the new topos, one so old the cover’s gone.',
  says: 'In pencil, in the margin past the Gorge: a wash, a slot, a small cross, and NO in capitals beside it, twice. Somebody went in there once, and buried somebody, or meant to be.',
};

// What each clue is, held, for the van's row.
export const CLUE_NAME: Record<HollowClue, string> = {
  old: 'an old-timer’s word on the wash',
  hitch: 'the old hand’s receipt',
  book: 'the margin of the old guidebook',
};

// The walk in, from the van at the Gorge.
export const WALK_ROW = {
  label: 'Look for the canyon',
  note: 'Up the wash with no sign on it. A day of looking, and no knowing what’s at the end.',
};

// The third clue: enough to go on.
export const WALK_READY =
  'Three people, three pieces: a wash past the Gorge, a left fork at a dead juniper, a cross in a margin. Enough to go and look.';

// Found, after the walk in's last line; and not, with the clues still good.
export const FOUND = 'You’re standing in the Hollow. Nobody has a topo for this. You could make one.';
export const NOT_FOUND = 'The directions still hold. The canyon’s still up there.';

// Phase 32.3: a crack in the Hollow, cleaned to climb on gear the way it was always going to be.
export const GEAR_CLEANED =
  'You rap {line} with a brush and a nut tool, pull the loose flakes and the dirt out of the crack, and leave it as you found it, only cleaner. It takes gear all the way. Nobody’s ever been up it.';

// Phase 32.3 (Evan's call: a stance at the fire argues it out): you bolted a crack in the
// Hollow. Pulling the bolts puts it back on gear (game.ts).
export const HOLLOW_STANCE: Stance = {
  after: 0,
  crack: true,
  title: 'You bolted a crack',
  sit: 'Word gets round that there’s a canyon past the Gorge, and that whoever found it put bolts beside a crack that would have taken gear all the way. Nobody says who out loud. Everybody at the fire looks at you anyway.',
  opts: [
    {
      label: 'My lines, my call.',
      stance: 'Bolted a crack in the Hollow and said so.',
      out: 'You say you found it, you cleaned it, you put up the line, and you’ll protect it how you like. The gym crowd likes that a lot. The old guard goes very quiet, which is worse than anything they could say.',
      fx: { old: -6, gym: 6 },
    },
    {
      label: 'Pull the bolts. It goes on gear.',
      stance: 'Pulled my own bolts out of a crack in the Hollow. It goes on gear now.',
      out: 'You go back up with a crowbar and a bag of epoxy and take them out, and patch the holes so nobody will ever find them. It goes on gear now, the way it was always going to. It costs you a day and the gym crowd’s good opinion, and Ray buys you a coffee for the first time.',
      fx: { old: 12, gym: -4, psyche: -2, energy: -20 },
    },
    {
      label: 'Nobody else was going to climb it.',
      stance: 'Bolted a crack because nobody else was ever going to climb it.',
      out: 'It’s true, and everybody knows it’s true, and it doesn’t help. People climb it, though. That’s something.',
      fx: { gym: 4, psyche: 2 },
    },
  ],
  elder: {
    label: 'Leave them, and say why.',
    stance: 'Kept the bolts in a crack in the Hollow, and told the old guard why.',
    out: 'You tell the fire about the flake you pulled off it with your hands, the one that would have taken any gear with it, and nobody argues. They don’t agree, either. But they listen, which they wouldn’t have done five years ago.',
    fx: { old: -2, gym: 4 },
  },
};

// Phase 32.2: the walk in to the Hollow, with all three clues. Each stage has the way the
// clues point (the old hand's left fork, waiting in the slot, the margin's headstones), and
// a way that doesn't. A clean or rough ending finds it; a bad one walks you back out.
export const HOLLOW_EPIC: Epic = {
  kind: 'hollow',
  title: 'The Wash',
  open: 'You leave the van at the Gorge and walk up the wash with no sign on it, three sets of directions in your head and none of them quite agreeing.',
  stages: [
    {
      sit: 'The wash forks at a dead juniper. The left looks like nothing. The right looks like a trail.',
      opts: [
        { label: 'Take the left', sub: 'what the old hand drew', risk: 0, energy: -6 },
        { label: 'Take the right', sub: 'everybody takes the right', risk: 3, energy: -6 },
        {
          label: 'Climb the rise and look',
          sub: 'slow, and you’ll see more',
          risk: -1,
          energy: -10,
          hours: 2,
        },
      ],
    },
    {
      sit: 'The walls close in. The wash turns to a slot a shoulder wide, and the light goes grey.',
      opts: [
        { label: 'Squeeze on', sub: 'fast, and it takes skin', risk: 3, skin: -8, energy: -6 },
        {
          label: 'Go round over the rim',
          sub: 'long, and hot up there',
          risk: 1,
          energy: -14,
          fed: -6,
          hours: 2,
        },
        { label: 'Wait for your eyes', sub: 'Ray’s way: he was never in a hurry', risk: 0, energy: -4 },
      ],
    },
    {
      sit: 'A bend that doubles back on itself, then another. Somewhere ahead, crows.',
      opts: [
        { label: 'Look for the headstones', sub: 'the cross in the margin', risk: -1, energy: -6 },
        { label: 'Follow the crows', sub: 'they know something', risk: 1, energy: -6 },
        { label: 'Keep to the left wall', sub: 'a rule, at least', risk: 2, energy: -8 },
      ],
    },
  ],
  ends: {
    clean:
      'The slot opens out into a canyon nobody has put on a map. Headstones under the far wall, red rock nobody has touched, and not one tick mark.',
    rough:
      'You find it late, scraped and out of water, but you find it: a canyon of red rock, headstones under the far wall, and not one tick mark.',
    bad: 'The light goes before the canyon shows. You walk back down the wash in the dark with three sets of directions, none of them wrong yet.',
  },
  story: {
    clean: 'up the wash with no sign on it, and into a canyon nobody has put on a map',
    rough: 'a long day up the wash, and a canyon at the end of it',
    bad: 'up the wash and back down it in the dark, without the canyon',
  },
};

// Phase 32.2: the Hollow found, up the wash with three people's directions.
export const HOLLOW_RECORD: RecordEntry[] = [
  {
    id: 'hollow',
    title: 'Off the Map',
    desc: 'Find the Hollow.',
    story:
      'Three people each knew a piece of the way, and you were the one who put it together and walked in. There is a canyon past the Gorge that isn’t on any map, and you know where it is.',
    from: [],
    aim: { hollow: true },
  },
];
