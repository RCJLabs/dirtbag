// What you're climbing for (Phase 23.3) [proposed numbers]: v0.956's four callings, each a
// temperament with a perk and a three-rung ambition. Not picked at creation (Evan's call 1):
// offered once you've climbed enough to know (CALLING.offerAt sends), and taken up or put off.
// `fx` is all a perk is; its words come from these numbers (calling.ts), never the blurb.
//   gainOut: skill from goes outside ×   firstGo: crux windows on a line's first go ×
//   injury: the odds of getting hurt, on anything ×   living: the night's spot and how you live ×
// A rung's aim counts only sends made since you took the calling up:
//   outside: a line sent outside at this grade or harder
//   flashOutside: one flashed or onsighted outside at this grade or harder
//   consolidate: this many grades, each with CALLING.consolidate lines sent at it
//   followers: this many following you (Phase 18.5); `reach`: followers a post brings ×

export interface CallingFx {
  gainOut?: number;
  firstGo?: number;
  injury?: number;
  living?: number;
  // Followers a post brings × (Phase 18.5).
  reach?: number;
}

export type RungAim =
  | { outside: number }
  | { flashOutside: number }
  | { consolidate: number }
  // Followers (Phase 18.5).
  | { followers: number };

export interface Calling {
  name: string;
  // Who you are, said on the offer.
  blurb: string;
  fx: CallingFx;
  // Three, for one on offer.
  rungs: RungAim[];
  // Said when each rung's met.
  said: string[];
  // Out of the offer until what it needs is built.
  wait?: string;
}

export const CALLINGS: Record<string, Calling> = {
  purist: {
    name: 'The Purist',
    blurb: 'Hard outdoor sends, done right. Disciplined, a little solitary.',
    fx: { gainOut: 1.15 },
    rungs: [{ outside: 8 }, { outside: 11 }, { outside: 14 }],
    said: [
      'Done on rock, done right. That one counts.',
      'Nobody saw it. It still counts. It counts more.',
      'Outside, clean, at the top of the scale. There’s nothing left on the list you wrote.',
    ],
  },
  sendorbust: {
    name: 'Send-or-Bust',
    blurb: 'Throw yourself at it. Bold, impulsive, and a bit hard on your body.',
    fx: { firstGo: 1.05, injury: 1.1 },
    rungs: [{ flashOutside: 6 }, { flashOutside: 9 }, { flashOutside: 12 }],
    said: [
      'First go, outside. You didn’t give it time to scare you.',
      'First try again, and harder. Your hands were shaking after, not during.',
      'Flashed, at a grade people project for seasons. They’ll ask how. You won’t really know.',
    ],
  },
  lifer: {
    name: 'The Lifer',
    blurb: 'In it forever. Steady, consistent, low-key.',
    fx: { living: 0.8, injury: 0.75 },
    rungs: [{ consolidate: 5 }, { consolidate: 9 }, { consolidate: 13 }],
    said: [
      'Grades you own, not just touched. That’s a base.',
      'Deeper still. You don’t have bad days on the easy ones any more.',
      'Grade after grade, solid. You’ll be doing this when the rest have sold their pads.',
    ],
  },
  influencer: {
    name: 'The Influencer',
    blurb: 'It’s about the scene and the clout. Social, pragmatic.',
    fx: { reach: 1.25 },
    rungs: [{ followers: 2000 }, { followers: 15000 }, { followers: 60000 }],
    said: [
      'People you’ve never met know your name. Some of them can pronounce it.',
      'A brand reposts you without asking. You decide to be flattered.',
      'Sixty thousand people watch you fall off things. You’ve started falling better.',
    ],
  },
};

// The callings on offer: the ones whose ambitions the game can see.
export const OPEN_CALLINGS = Object.keys(CALLINGS).filter((id) => !CALLINGS[id]!.wait);
