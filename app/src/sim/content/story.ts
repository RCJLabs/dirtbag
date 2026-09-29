// Act I, the first season: v0.956's "Your First Season" quest, stage for stage and in its
// words, as the demo's goal ladder (Phase 7: the quest becomes the onboarding checklist).
// Where v0.956 counted something the rebuild doesn't have, the stage asks for the nearest
// thing it does: "Become a face" wanted 15 reputation, and here wants a regular to climb
// with. Its psyche and reputation rewards have nowhere to go; its skill and cash ones stay.

import type { Skills } from '../types';

// What a stage asks for. `desc` says it, with {n} for the number.
export type Aim =
  { cash: number } | { sends: number } | { sendsOutside: number } | { regular: true } | { grade: number };

export interface Goal {
  id: string;
  title: string;
  // Why, when it starts.
  text: string;
  aim: Aim;
  desc: string;
  // Said when it's done, and what it leaves you with.
  done: string;
  train?: Partial<Skills>;
}

export const ACT_I: Goal[] = [
  {
    id: 'settle',
    title: 'Get the wheels under you',
    text: 'Nobody climbs on an empty tank or an empty stomach. Get a little money together and a little food in you. The climbing keeps.',
    aim: { cash: 60 },
    desc: 'Have ${n} in hand',
    done: 'That is the floor sorted. Everything from here is a choice rather than a scramble.',
  },
  {
    id: 'climb',
    title: 'Find out what you are',
    text: 'Plastic first. It is cheap, it is always in condition, and it will tell you honestly where you are starting from.',
    aim: { sends: 3 },
    desc: 'Send {n} lines anywhere',
    done: 'A few ticks. Not a career yet, but it is a baseline, and you cannot improve on a number you never took.',
    train: { technique: 1 },
  },
  {
    id: 'outside',
    title: 'Get on real rock',
    text: 'The gym is training. Outside is the thing itself: worse holds, no colour-coded sequence, and nobody to tell you it goes.',
    aim: { sendsOutside: 2 },
    desc: 'Send {n} lines outside',
    done: 'Outside pays differently. The scene counts what you do on rock and quietly ignores the rest.',
  },
  {
    id: 'face',
    title: 'Become a face',
    text: 'You are a stranger with a van. That changes by being around, at the crag and the gym and the fire, until people stop asking who you are.',
    aim: { regular: true },
    desc: 'Be regulars with someone',
    done: 'People know your face now. That is worth more out here than it sounds: beta, belays, and a floor to sleep on come from it.',
  },
  {
    id: 'grade',
    title: 'Climb something that scares you',
    text: 'Everything so far has been groundwork. Now go and be measurably better than you were when you rolled into town.',
    aim: { grade: 4 },
    desc: 'Climb V{n}',
    done: 'That is a real grade. The season did what a season is for.',
    train: { head: 2 },
  },
];

// The end of the act: v0.956's closing words and its $40. Dex's race, which starts the same
// night, is the hook into what comes next.
export const ACT_I_END = {
  title: 'End of Act I',
  text: 'First season done. You showed up with a van and no plan and you leave it with a grade, a face people know and somewhere to be. Nobody is going to tell you what to do next. That was always the point.',
  cash: 40,
};
