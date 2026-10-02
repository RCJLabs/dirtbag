// The next generation (Phase 16.5, Evan's call 4): the kid you coached, climbing on after you.
// Their own first act, "Their Shadow", in place of Act I: the same five stages' pace, ending
// on the line you named. {forebear} and {line} are filled from the family.

import type { Edge } from './paths';
import type { ActEnd, Goal } from './story';

export const HEIR_ACT: Goal[] = [
  {
    id: 'keys',
    title: 'The keys',
    text: '{forebear} left you the van, a crate of guidebooks with notes in every margin, and a lot to live up to. Start where everyone starts.',
    aim: { sends: 1 },
    desc: 'Send a line anywhere',
    done: 'One down. The van still smells like their chalk.',
  },
  {
    id: 'their-rock',
    title: 'Their rock',
    text: 'Some of the holds at Roadside still have {forebear}’s tick marks on them, if you know where to look.',
    aim: { sendsOutside: 2 },
    desc: 'Send {n} lines outside',
    done: 'You found one of their tick marks. You left it there.',
  },
  {
    id: 'own-name',
    title: 'Your own name',
    text: 'Everyone out here knew {forebear}. They keep calling you {forebear}’s kid. Climb with someone long enough and they will learn your name.',
    aim: { regular: true },
    desc: 'Be regulars with someone',
    done: 'Somebody called you by your own name today. You noticed.',
  },
  {
    id: 'shadow',
    title: 'Out of their shadow',
    text: 'Being somebody’s kid gets you a belay. It does not get you up anything. Go and be measurably better than you were.',
    aim: { grade: 4 },
    desc: 'Climb V{n}',
    done: 'A real grade, and nobody gave it to you.',
    train: { head: 2 },
  },
  {
    id: 'their-line',
    title: 'The line they named',
    text: '{line} is on the topo with {forebear}’s name on it. Go and get on it. Find out what they were on about.',
    aim: { kin: true },
    desc: 'Get on {line}',
    done: 'It is further than it looks. They always said that.',
  },
];

export const HEIR_END: ActEnd = {
  title: 'End of Act I',
  text: 'You came out here with somebody else’s van and somebody else’s name. You leave your first season with a grade, a face people know as yours, and one line you have tried that nobody is going to let you forget until you send it.',
  cash: 40,
};

// Who you are at the start, said once.
export const HEIR_OPEN =
  '{forebear} hung it up, and the kid they spent all those seasons coaching has the keys now. That’s you.';

// Dex coaches the kid of someone he climbed with (Evan's call 4) [proposed].
export const COACH_EDGE: Edge = { train: 1.15 };
export const COACH_LINE = 'Dex turns up at the gym and says he owes {forebear} one. He coaches you.';
