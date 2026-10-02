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

import type { Skills } from '../types';

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
  | { myth: true };

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

// Act II, V4 to V7: v0.956's "The Local's Project", with the crags past Roadside on the way.
const ACT_II: Goal[] = [
  {
    id: 'trust',
    title: 'Earn some trust',
    text: 'Nobody hands out project beta. Put in real outdoor mileage first, at a grade that means something.',
    aim: { outside: 3, grade: 4 },
    desc: 'Send {n} lines outside at V{g} or harder',
    done: 'The locals have started nodding at you. Not talking. Nodding. It is a start.',
  },
  {
    id: 'gorge',
    title: 'Past Roadside',
    text: 'Roadside is where everyone starts. Granite Gorge is where they find out whether they meant it: further out, colder, and the granite takes skin like rent.',
    aim: { at: 'gorge' },
    desc: 'Send a line at Granite Gorge',
    done: 'Granite does not care how you climb in the gym. You will be back anyway.',
  },
  {
    id: 'prove',
    title: 'Prove the grade',
    text: 'The line the local keeps looking at is stout. Show you can pull the grade before anyone tells you where it is.',
    aim: { outside: 2, grade: 6 },
    desc: 'Send {n} lines outside at V{g} or harder',
    done: 'Somebody at the fire mentions a line. Not by name. Just a direction and a grade, and a look to see what you do with it.',
    train: { head: 1 },
  },
  {
    id: 'moon',
    title: 'The Moonstone',
    text: 'Moonstone is quartzite highballs out in the desert: a real road trip, and the trip costs real money up front. Everyone pays it once and nobody regrets it.',
    aim: { at: 'moon' },
    desc: 'Send a line at Moonstone Boulders',
    done: 'Boulders the size of houses, and you topped one out. The drive home is shorter than the drive out. It always is.',
  },
  {
    id: 'project',
    title: 'The send',
    text: 'Beta in hand, conditions in. Go and put the project down.',
    aim: { outside: 1, grade: 7 },
    desc: 'Send a line outside at V{g} or harder',
    done: 'Sent. You did not whoop. You sat at the bottom for a while and let your hands stop shaking.',
    train: { technique: 1 },
  },
];

// Act III, V8 to V10: the road. The Big Stone, Send Season, El Cap, and Hazel's Pilgrimage.
const ACT_III: Goal[] = [
  {
    id: 'stone',
    title: 'The Big Stone',
    text: 'Some walls you see from the highway and spend a year pretending you are not going to try. The Big Stone is that wall.',
    aim: { at: 'stone' },
    desc: 'Send a line at The Big Stone',
    done: 'Up close it is bigger, and the holds are further apart than the photos said. That is the deal with big stone.',
  },
  {
    id: 'season',
    title: 'Peak form',
    text: 'You are fit and the conditions are gift-wrapped. Go and take down something at your limit.',
    aim: { outside: 1, grade: 8 },
    desc: 'Send a line outside at V{g} or harder',
    done: 'The best shape of your life, and you spent it on one line. Correctly.',
    train: { power: 1, endurance: 1 },
  },
  {
    id: 'nose',
    title: 'The Nose',
    text: 'Every climber has a photo of El Cap somewhere. Go and be in one.',
    aim: { summit: 'elcap' },
    desc: 'Top out The Nose on El Capitan',
    done: 'You stood at the top of El Cap and looked down at the meadow, where people were taking photos of the wall you were on.',
  },
  {
    id: 'wind',
    title: 'Where she started',
    text: '"It is a hell of a drive," Hazel says, "but some places you have to earn just getting to." Wind River is the wall that made her a climber. Send something worthy of it.',
    aim: { at: 'wind', grade: 9 },
    desc: 'Send a line at Wind River Walls at V{g} or harder',
    done: 'Hazel does not say much on the drive back. She does not need to.',
    train: { head: 2 },
  },
  {
    id: 'ten',
    title: 'Double digits',
    text: 'V10. The number people say quietly at the fire, in case it hears them.',
    aim: { outside: 1, grade: 10 },
    desc: 'Send a line outside at V{g} or harder',
    done: 'Ten. Nobody at the gym believes you until someone who was there tells them.',
  },
];

// Act IV, V11 to V14: The Crucible, Patagonia, and The Tower's Due. One expedition (Evan's
// call: two was a cash gate between a player and the act's end).
const ACT_IV: Goal[] = [
  {
    id: 'crucible',
    title: 'The Crucible',
    text: 'The Crucible is where grades stop being numbers and start being names. Most climbers never drive out there. Go.',
    aim: { at: 'crucible' },
    desc: 'Send a line at The Crucible',
    done: 'The lines out here have reputations. Now one of them has a story with you in it.',
  },
  {
    id: 'cerro',
    title: 'Patagonia',
    text: 'Cerro Torre. The wind is a character in every story anyone tells about it, and it is never the hero.',
    aim: { summit: 'cerrotorre' },
    desc: 'Top out Cerro Torre',
    done: 'The summit of Cerro Torre, and the wind let you have it. This time.',
  },
  {
    id: 'twelve',
    title: 'Twelve',
    text: 'Somewhere around V12 the climbing stops being about strength and starts being about whether you believe it goes.',
    aim: { outside: 1, grade: 12 },
    desc: 'Send a line outside at V{g} or harder',
    done: 'It went. You believed it would, mostly.',
  },
  {
    id: 'tower',
    title: 'The Tower’s Due',
    text: 'Someone fell from the Obsidian Roof years back and never topped out. Every pitch of the Obsidian Tower, to the summit: for them.',
    aim: { wall: 'obsidian' },
    desc: 'Top out the Obsidian Tower',
    done: 'You sat on the summit longer than you needed to. It felt like the polite thing to do.',
    train: { head: 2 },
  },
  {
    id: 'fourteen',
    title: 'Fourteen',
    text: 'A handful of people have done this. You could be one of them, if you go now.',
    aim: { outside: 1, grade: 14 },
    desc: 'Send a line outside at V{g} or harder',
    done: 'Fourteen, outside. The kind of number that gets you a nickname you did not choose.',
  },
];

// Act V, V15 to V18: The Line. A myth's first ascent, the best ending there is (Evan's call 1).
const ACT_V: Goal[] = [
  {
    id: 'anvil',
    title: 'The Anvil',
    text: 'The last line at The Crucible before the myths. Nobody calls it easy, including the people who have done it.',
    aim: { at: 'crucible', grade: 16 },
    desc: 'Send a line at The Crucible at V{g} or harder',
    done: 'Past the Anvil there is nothing with a grade. Just the stories.',
  },
  {
    id: 'seventeen',
    title: 'Seventeen',
    text: 'The grades run out soon. Go and find out how close to the end you can get.',
    aim: { outside: 1, grade: 17 },
    desc: 'Send a line outside at V{g} or harder',
    done: 'One grade left on the scale, and it is the one nobody has climbed.',
  },
  {
    id: 'read',
    title: 'Read it',
    text: 'You have heard about the myth for years. You cannot even read the thing until you have done the line under it.',
    aim: { reveal: true },
    desc: 'Send the line under a myth',
    done: 'Now you can see it: every hold, every move nobody has made. It is not impossible. It is just not done.',
  },
  {
    id: 'line',
    title: 'The Line',
    text: 'Nobody has climbed it. Somebody will. Go and be the one.',
    aim: { myth: true },
    desc: 'Put up the first ascent of a myth',
    done: 'It goes. You did it.',
  },
];

export const STORY: Act[] = [
  { title: 'The First Season', goals: ACT_I, end: ACT_I_END },
  {
    title: 'The Local’s Project',
    goals: ACT_II,
    end: {
      title: 'End of Act II',
      text: 'The local who watched you all season walks over after the send, says nothing for a long while, then tells you what the line is really called: the name that never made it into a guidebook. Then they go back to their own project, and you understand you have been let in on something.',
      cash: 120,
      with: {
        hazel:
          'Hazel was at the bottom with the coffee pot, pretending she had not been watching the whole time.',
        sage: 'Sage had the rope, and the look she gives you when you have done something she will not say out loud was good.',
        dex: 'Dex heard by evening. He sent a text with no words in it, just a fist.',
      },
    },
  },
  {
    title: 'The Road',
    goals: ACT_III,
    end: {
      title: 'End of Act III',
      text: 'Back at the Lot after the long road, Hazel finally tells you the story she has never told anyone: why she stopped competing, and why she stayed in the van after. You had more than earned it. The fire burns down and neither of you gets up.',
      cash: 200,
      with: {
        sage: 'Sage turns up late with beers and the tact not to ask what you were talking about.',
        dex: 'Dex hears you have done El Cap and asks, very casually, how long it took.',
      },
    },
  },
  {
    title: 'The Crucible',
    goals: ACT_IV,
    end: {
      title: 'End of Act IV',
      text: 'The scene has started telling stories about you that are only half true. Your body was supposed to call it by now. It has not, yet. Something out there is still worth the climb, and as long as you are on The Line, your body waits on you: no countdown.',
      cash: 300,
      with: {
        hazel: 'Hazel says the myth was never meant for anyone. Then she says, "So?"',
        sage: 'Sage says she will belay. She does not ask which line.',
        dex: 'Dex says nobody is doing the myth. He says it twice, which is how you know he is thinking about it too.',
      },
    },
  },
  {
    title: 'The Line',
    goals: ACT_V,
    end: {
      title: 'The Line',
      text: 'You climbed the thing nobody had climbed. The grades have nothing left to say to you. Whatever happens now, that line goes in the book with your name on it, and every climber who ever looks up at it will know.',
      cash: 500,
      with: {
        hazel: 'Hazel is at the bottom. She is not pretending she was not watching.',
        sage: 'Sage lowers you off and does not let go of the rope for a long moment.',
        dex: 'Dex was there. He says nothing at all, and shakes your hand like it means something, because it does.',
      },
    },
  },
];

// Where each act's money comes from, said when it's paid.
export const ACT_PAID = [
  "First season done. There's {cash} in the glovebox you'd forgotten about.",
  'A guidebook author pays {cash} for the beta and the photos of the project.',
  'The magazine that ran your El Cap photos sends {cash} and asks for more.',
  '{cash} from a brand that wants its logo in the next story anyone tells about you.',
  '{cash} for the photos. You would have done it for nothing, and everyone knows it.',
];

// The Line (Phase 16.3): how the story's last act ends, in place of a card. The naming at the
// fire, who was there (Act V's `with`, and the dog), the credits, then what now.
export const LINE_SCENE = {
  naming: {
    title: 'The naming',
    text: 'That night everyone you know is at the fire at the Lot. Somebody has written “{name}” on a scrap of cardboard and propped it against the cooler, as if it were an award. It is the closest thing climbing has to one. {grade}, at {place}, and nobody had done it until you.',
  },
  there: {
    title: 'Who was there',
    alone:
      'The fire burns down. You sit with it longer than anyone, the way you sat under the line before it went.',
    dog: '{name} slept through the whole thing, on your feet, which is exactly right.',
  },
  credits: { title: 'The Line', sub: 'A climbing life, so far.' },
  choice: {
    title: 'What now?',
    text: 'The grades have nothing left to say to you. The rock has plenty.',
    retire: { label: 'Hang it up', note: 'Now, on the best day there will ever be. A perfect ending.' },
    keep: { label: 'Keep climbing', note: 'The Line is done. The rest of it isn’t. Your body waits on you.' },
  },
};
