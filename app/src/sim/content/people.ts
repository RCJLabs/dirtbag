// People, where they are, and what they say. A conversation picks its opening node from
// `start` (the first entry whose condition holds), then follows the options. Options can
// cost time, teach beta, set a daily flag, run an act, add a line, or have them show you a
// line (`watch`); `next` continues the conversation. Text may use {goes} (goes today, all
// routes) with {goes|go|goes} for the plural, and {name}, your name.

import type { Cond } from '../cond';
import { ARC, BOND } from '../dials';
import { PLACES } from './places';
import type { Delta, Skills } from '../types';

export interface TalkFx {
  cost?: Delta;
  learn?: string; // "route/beta", learned by being told
  today?: string;
  act?: string;
  // A line for the log and the toast lane. {away} is the days they'll be gone; skills they
  // leave you with are added to the end.
  line?: string;
  // They climb a line you're working, and you watch their beta.
  watch?: true;
  // This plays the next beat of their arc.
  arc?: true;
  // Skills you come away with.
  train?: Partial<Skills>;
  // Bond: more of it, or at least this much.
  bond?: number;
  bondAtLeast?: number;
  // They're gone for this many days.
  away?: number;
  // They'll meet you at this place today.
  invite?: string;
}

export interface TalkOpt {
  label: string;
  primary?: boolean;
  when?: Cond;
  fx?: TalkFx;
  next?: string;
}

export interface TalkNode {
  text: string;
  opts: TalkOpt[];
  // They've something to tell you: the scene shows a speech mark over them.
  calls?: true;
}

export interface TalkDef {
  who: string;
  start: { when?: Cond; node: string }[];
  nodes: Record<string, TalkNode>;
}

export interface PersonDef {
  name: string;
  full?: string;
  // Someone you know from the first morning, before you've said a word to them.
  known?: true;
  // Beta they know, and will show you, at these places.
  shows?: string[];
  // Not a partner: someone who climbs against you. What they're like, in v0.956's words.
  rival?: string;
}

export const PEOPLE: Record<string, PersonDef> = {
  // Parked next to you, with the coffee on, since before the game began.
  hazel: { name: 'Hazel', known: true },
  // v0.956's Sage: technical, and the partner whose perk was beta.
  sage: { name: 'Sage', shows: ['road', 'gym'] },
  // v0.956's default rival.
  dex: { name: 'Dex', full: 'Dex Calloway', rival: 'A power monster, a bitter nemesis.' },
};

// The race Dex sets you at the end of Act I, and what he calls the line if he wins it:
// v0.956's rival names, picked by the seed.
export const RACE_ROUTE = 'rsopen';
export const RIVAL_FA_NAMES = [
  'Dead Reckoning',
  'The Long Con',
  'Salt',
  'Hollow Point',
  'Cold Start',
  'Bad Blood',
  'Iron Age',
  'Nightshade',
  'Static',
  'Slack Tide',
  'The Reckoning',
  'Quarry',
  'Bitter End',
  'Last Call',
];

const SIT: TalkOpt[] = [
  { label: 'Sit a while', primary: true, fx: { act: 'lot.sit' } },
  { label: 'Not tonight' },
];

export const TALK: Record<string, TalkDef> = {
  'hazel-lot': {
    who: 'hazel',
    start: [
      { when: { night: true, sentToday: 'pump' }, node: 'night-sent' },
      { when: { night: true, wentToday: 'pump' }, node: 'night-goes' },
      { when: { night: true }, node: 'night' },
      { when: { sky: 'rain' }, node: 'rain' },
      { when: { knows: 'pump/B2' }, node: 'known' },
      { node: 'morning' },
    ],
    nodes: {
      'night-sent': { text: 'You sent it. Now you need a new one.', opts: SIT },
      'night-goes': { text: "{goes} {goes|go|goes} today. How's the skin?", opts: SIT },
      night: { text: "Fire's warm. Sit.", opts: SIT },
      rain: {
        text: "Rock's soaked. Gym, or a nap. I'm doing the nap.",
        opts: [{ label: 'Fair enough' }],
      },
      known: { text: "Heel on the lip. Trust the pinch. That's all I've got.", opts: [{ label: 'Thanks' }] },
      morning: {
        text: "You're staring at The Pump again. I can tell from here.",
        opts: [
          { label: 'Ask about the roof', primary: true, fx: { learn: 'pump/B2' }, next: 'roof' },
          {
            label: 'Just coffee',
            when: { notToday: 'coffee' },
            fx: { cost: { min: 10, energy: 5 }, today: 'coffee' },
            next: 'coffee',
          },
          { label: 'Just coffee', when: { today: 'coffee' }, next: 'no-coffee' },
        ],
      },
      roof: {
        text: 'Everyone throws right at the roof. Everyone comes off right at the roof. Hook your left heel on the lip and cross to the pinch.',
        opts: [{ label: 'Got it', primary: true, fx: { line: 'New beta: heel-hook the lip.' } }],
      },
      coffee: { text: "She pours you half a cup. It's mostly grounds.", opts: [{ label: 'Thanks' }] },
      'no-coffee': { text: "Pot's empty. You had the good half.", opts: [{ label: 'Fair' }] },
    },
  },
  'hazel-crag': {
    who: 'hazel',
    start: [
      { when: { sentToday: 'pump' }, node: 'sent' },
      { when: { wentToday: 'pump' }, node: 'goes' },
      { node: 'start' },
    ],
    nodes: {
      sent: { text: "That's the one. Lower off, I'm hungry.", opts: [{ label: 'OK' }] },
      goes: { text: 'Clean catch. Rest up, go again.', opts: [{ label: 'OK' }] },
      start: { text: "Rope's flaked. I'll belay whatever you want to get on.", opts: [{ label: 'OK' }] },
    },
  },
  // Sage's arc is v0.956's, beat for beat. Her guiding stint is a week here, not v0.956's
  // sixteen days, so the text says less about how long; the last beat needs real rock.
  sage: {
    who: 'sage',
    start: [
      { when: { notMet: 'sage' }, node: 'meet' },
      { when: { arc: 'sage/1' }, node: 'beat-1' },
      { when: { arc: 'sage/2' }, node: 'beat-2' },
      { when: { arc: 'sage/3' }, node: 'beat-3' },
      { when: { arc: 'sage/4', outside: true }, node: 'beat-4' },
      { when: { today: 'sage' }, node: 'done' },
      { node: 'again' },
    ],
    nodes: {
      meet: {
        text: "You're the one Hazel says keeps staring at The Pump. I'm Sage. I climb slow and I read everything first.",
        opts: [
          { label: 'Show me something', primary: true, fx: { watch: true } },
          { label: 'Just saying hi', next: 'hi' },
        ],
      },
      hi: { text: "Hi. Come find me when you're stuck on something.", opts: [{ label: 'Will do' }] },
      again: {
        text: "Stuck on something, {name}? Point at it and I'll show you how I'd go.",
        opts: [
          { label: 'Show me the beta', primary: true, fx: { watch: true } },
          {
            label: 'Come out to the Gorge?',
            when: {
              bond: `sage/${BOND.invite}`,
              grade: PLACES.gorge!.minGrade,
              open: 'gorge',
              before: BOND.inviteBefore,
              notToday: 'invite',
            },
            fx: {
              invite: 'gorge',
              today: 'invite',
              line: 'Sage: "Meet you at the pullout. I\'ll bring the rope."',
            },
          },
          { label: 'Not now' },
        ],
      },
      done: { text: "That's all you get from me today. Go climb.", opts: [{ label: 'Fair' }] },
      'beat-1': {
        calls: true,
        text: 'Sage doesn\'t say much. She just watches you flail at a sequence, points two feet left, and suddenly it\'s trivial. "You were fighting it." She climbs like water finding the easy way down.',
        opts: [
          {
            label: 'Climb with her',
            primary: true,
            fx: { arc: true, train: { technique: 2 }, line: 'Sage quietly fixes your footwork.' },
          },
        ],
      },
      'beat-2': {
        calls: true,
        text: 'Sage is sitting on her pad, turning her phone over and over. "Got the call: a guiding stint up in the Bugaboos. Real money, real alpine." She looks genuinely torn. "Tell me straight."',
        opts: [
          {
            label: '"Go. You\'d be crazy not to."',
            primary: true,
            fx: {
              arc: true,
              away: ARC.sageAway,
              bond: 1,
              line: 'You send her off with a blessing. "Go get it." Sage is off guiding, back in {away} days.',
            },
          },
          {
            label: '"I\'ll miss having you out here."',
            fx: {
              arc: true,
              away: ARC.sageAway,
              train: { head: 2 },
              line: 'She squeezes your shoulder. "I\'ll be back before you know it." Sage is off guiding, back in {away} days.',
            },
          },
        ],
      },
      'beat-3': {
        calls: true,
        text: 'Sage is back from the Bugaboos, browner and leaner, with granite in her hands. She drops her pack and grins. "Missed this rock. Missed this crew." Then she steps onto your project and flashes the crux you\'ve been stuck on, just to show you it goes.',
        opts: [
          {
            label: 'Welcome her back',
            primary: true,
            fx: {
              arc: true,
              train: { technique: 3, endurance: 2 },
              line: 'Sage is back, and dialed from the granite.',
            },
          },
        ],
      },
      'beat-4': {
        calls: true,
        text: 'That long technical testpiece Sage always eyed: today\'s the day. She reads it move by move, you trade leads, every foot placement dialed. At the chains she bumps your fist. "Couldn\'t have done it without you. Either of us."',
        opts: [
          {
            label: 'Top it out together',
            primary: true,
            when: { energy: 12 },
            fx: {
              arc: true,
              cost: { min: 120, energy: -12 },
              train: { technique: 6 },
              bondAtLeast: 7,
              line: 'You and Sage top out the testpiece together. Partners for good.',
            },
          },
          { label: "Not today, I'm spent" },
        ],
      },
    },
  },
  // Dex sizes you up. His lines are v0.956's: he met you over your first V4, the race is
  // his dare, and the rest depends on who's climbing harder.
  dex: {
    who: 'dex',
    start: [
      { when: { metToday: 'dex' }, node: 'meet' },
      { when: { racing: true }, node: 'race' },
      { when: { lead: 'dex/1' }, node: 'behind' },
      { when: { trail: 'dex/2' }, node: 'ahead' },
      { node: 'even' },
    ],
    nodes: {
      meet: {
        calls: true,
        text: 'Dex Calloway eyes you from the boulders. "Heard you sent your first V{grade}." A beat. "...Nice." Looks like it cost him something to say.',
        opts: [
          { label: 'Nod back', primary: true },
          { label: '"Who\'s asking?"', next: 'who' },
        ],
      },
      who: {
        text: '"Dex." Like you should know. "Dex Calloway. I\'ll see you out here."',
        opts: [{ label: 'Guess you will' }],
      },
      race: {
        calls: true,
        text: 'Dex nods at the open project. "{left} {left|day|days}, {name}. Then it\'s got my name on it."',
        opts: [{ label: '"We\'ll see."' }],
      },
      behind: {
        text: 'Dex watches you pull on, jaw tight. "...You\'ve been climbing well. Don\'t get comfortable."',
        opts: [{ label: 'Fair' }],
      },
      ahead: {
        text: 'Dex smirks from the boulders. "Still working that V{grade}? I sent it last season, kid."',
        opts: [{ label: 'Let your climbing answer' }],
      },
      even: {
        text: 'Dex gives you a nod and goes back to brushing holds. "May the best climber send."',
        opts: [{ label: 'Nod back' }],
      },
    },
  },
};

// Things you can look at. `night` falls back to `day`; `nightAct` runs an act instead;
// `away` is what you see while its owner is somewhere else.
export interface ThingDef {
  // What it's called to a screen reader, and on the button a keyboard lands on.
  name: string;
  day: string;
  night?: string;
  nightAct?: string;
  away?: { who: string; text: string };
}

export const THINGS: Record<string, ThingDef> = {
  scout: { name: 'Scout', day: 'Scout thumps his tail twice and goes back to sleep.' },
  'hazel-van': {
    name: "Hazel's van",
    day: "Hazel's van. Curtains still shut.",
    night: "Hazel's van. The lantern's on.",
    away: { who: 'hazel', text: "Hazel's van, locked. She's out at the crag till five." },
  },
  fire: { name: 'The fire', day: 'Coals and a coffee pot. Hazel got up first.', nightAct: 'lot.sit' },
  desk: {
    name: 'The desk',
    day: "The kid at the desk doesn't look up. A sign says: DAY PASS, NO REFUNDS, NO CAMPUS.",
  },
};
