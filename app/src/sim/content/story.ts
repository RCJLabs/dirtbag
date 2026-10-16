// The story, five acts (Phase 16.2, Evan's call 3): Act I is v0.956's "Your First Season"
// quest, stage for stage and in its words, as the demo's goal ladder (Phase 7: the quest
// becomes the onboarding checklist). Acts II to V are built on what the rebuild has: the
// crags each grade opens, the walls, the expeditions and the myths, with beats from v0.956's
// side quests that run on them (The Local's Project, Send Season, The Vagabond, Hazel's
// Pilgrimage, The Tower's Due). Comps and media get their place with Phase 18. Where v0.956
// counted something the rebuild doesn't have, a stage asks for the nearest thing it does:
// "Become a face" wanted 15 reputation, and here wants a regular to climb with. Rewards are
// [proposed]: cash and skill, once each; v0.956's psyche and reputation ones have nowhere to
// go yet.
//
// Acts II to V and The Line are the full game's, in story.full.ts (Phase 14.5b): the demo's
// build has Act I alone.

import type { Skills } from '../types';
import { LATER_ACTS, LATER_PAID, LINE_SCENE } from './story.full';

// What a stage asks for. `desc` says it, with {n} for the number and {g} for the grade.
export type Aim =
  | { cash: number }
  | { sends: number }
  | { sendsOutside: number }
  | { regular: true }
  | { grade: number }
  // Lines sent outside at this grade or harder.
  | { outside: number; grade: number }
  // A send at this crag, at this grade or harder.
  | { at: string; grade?: number }
  // A wall topped: its last pitch sent.
  | { wall: string }
  // An expedition's summit.
  | { summit: string }
  // A myth you can read: the line under it sent.
  | { reveal: true }
  // A myth's first ascent, yours.
  | { myth: true }
  // A go on the line your forebear named (Phase 16.5).
  | { kin: true };

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

// How an act ends: a scene, not a toast. `with`: a line for each person close enough
// (Regular or better) to be there for it.
export interface ActEnd {
  title: string;
  text: string;
  cash: number;
  with?: Record<string, string>;
}

export interface Act {
  title: string;
  goals: Goal[];
  end: ActEnd;
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
export const ACT_I_END: ActEnd = {
  title: 'End of Act I',
  text: 'First season done. You showed up with a van and no plan and you leave it with a grade, a face people know and somewhere to be. Nobody is going to tell you what to do next. That was always the point.',
  cash: 40,
};

export const STORY: Act[] = [{ title: 'The First Season', goals: ACT_I, end: ACT_I_END }, ...LATER_ACTS];

// Where each act's money comes from, said when it's paid.
export const ACT_PAID = [
  "First season done. There's {cash} in the glovebox you'd forgotten about.",
  ...LATER_PAID,
];

// The Line's scene: the full game's (story.full.ts).
export { LINE_SCENE };
