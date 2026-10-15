// Phase 32.2: the Hollow's quest, in words. Three people each know a piece of the way in; with
// all three, the walk up the wash from the Gorge (content/epics.ts, `hollow`).

import type { HollowClue } from '../types';
import type { TalkNode } from './people';

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
