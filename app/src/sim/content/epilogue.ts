// What became of you (Phase 16.4): the epilogue's words, keyed to what the save kept. Each is
// picked by epilogue.ts from your origin, your calling's rungs, your paths, where you stood
// with the crowds, the calls you made, your first ascents and summits, the dog, the people,
// and the book. {name} and the like are filled from the save.

// Who you were, said back at the end.
export const ORIGIN_END: Record<string, string> = {
  quit: 'The storage unit with the rest of your old life in it got sold off years ago. You never went back for any of it.',
  gymrat: 'You came out of a city gym with strong hands and no idea about rock. Rock taught you the rest.',
  desert:
    'You grew up under these walls. In the end you were one of the reasons people drove out to see them.',
  gymnast:
    'The gymnast never quite left you: the body tension, the drilled sessions, the habit of being judged.',
  late: 'You started late and ran out of time first, and you climbed like someone who knew it.',
  trustfund:
    'You turned up with the best of everything and something to prove. The scene stopped smelling the money on you somewhere along the way.',
  carried: 'You came across from another life on the rock and carried on as if you’d never stopped.',
};

// What you said you were climbing for, by how many of its three rungs you made.
export const CALLING_END: Record<string, [string, string, string, string]> = {
  purist: [
    'You said you were a purist. The rock never got the chance to find out.',
    'You said you were a purist, and you climbed outside like one: {rungs} of the three hard lines you set yourself.',
    'You said you were a purist, and you climbed outside like one: {rungs} of the three hard lines you set yourself.',
    'You said you were a purist and then proved it, every rung: the hard lines, outside, the way they come.',
  ],
  sendorbust: [
    'You said it was send or bust. Mostly, it was bust.',
    'Send or bust, you said, and {rungs} of the three flashes you went for went.',
    'Send or bust, you said, and {rungs} of the three flashes you went for went.',
    'Send or bust, and you sent: every flash you set yourself, first go, outside.',
  ],
  lifer: [
    'You said you were a lifer. The life is the point; the grades were never going to be.',
    'A lifer, you said, and you stuck around long enough to consolidate {rungs} of the three you meant to.',
    'A lifer, you said, and you stuck around long enough to consolidate {rungs} of the three you meant to.',
    'A lifer, all the way down: every grade you meant to own, you owned.',
  ],
};

// Where you stood with a crowd at the end, the far ends only.
export const CROWD_END = {
  old: {
    high: 'The old guard still tell your stories at the fire, and get most of the details wrong on purpose.',
    low: 'The old guard never forgave you. They still mention it, when your name comes up.',
  },
  gym: {
    high: 'The gym crowd put your photo up by the front desk. The kids who never saw you climb still know your name.',
    low: 'The gym crowd never warmed to you. You never noticed, which made it worse.',
  },
};

// The people, by how close you got; the rival by how it ended.
export const PEOPLE_END: Record<string, { close: string; far?: string }> = {
  hazel: {
    close: 'Hazel still has a coffee pot on at the Lot. There’s always a cup in it for you.',
    far: 'Hazel taught you the first things, and then the road took you somewhere else.',
  },
  sage: {
    close: 'Sage still sends you photos of lines she thinks you’d like. She’s always right.',
  },
  dex: {
    close: 'Dex and you ended up friends, which neither of you would have bet on.',
    far: 'Dex is still out there, a grade ahead or a grade behind, depending on who’s telling it.',
  },
};

export const DOG_END = {
  with: '{name} went everywhere you went, and never once cared what grade it was.',
  lost: 'You still have {name}’s collar in the glovebox.',
};

export const FA_END =
  '{name}, at {place}, carries your name, and will on every topo anyone ever draws of it.';
export const SUMMIT_END = 'You stood on top of {mountains}.';
export const PATH_END = {
  title: 'They called you {title}.',
  part: 'You walked {path} as far as {tier}.',
};
export const QUIRK_END = 'The scene had a name for how you climbed: {quirk}.';
export const MASTERY_END = 'You mastered {list}.';
export const HOME_END = 'The day of the Homecoming, everyone came.';
export const BOOK_END = 'The page in the Record Book you show people first is “{title}”.';
export const STANCE_END = 'In your own words: “{stance}”';
