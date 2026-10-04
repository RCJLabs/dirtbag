// People, where they are, and what they say. A conversation picks its opening node from
// `start` (the first entry whose condition holds), then follows the options. Options can
// cost time, teach beta, set a daily flag, run an act, add a line, or have them show you a
// line (`watch`); `next` continues the conversation. Text may use {goes} (goes today, all
// routes) with {goes|go|goes} for the plural, and {name}, your name.

import type { Cond } from '../cond';
import { ARC, BOND } from '../dials';
import { arcNodes, arcStarts } from './arcs';
import { FIRE_ASK, GIFTS } from './gifts';
import { money } from '../format';
import { romanceNodes, romanceStarts } from './romance';
import { crewNodes, crewStarts } from './crew';
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
  // They've told you the next moment of their life (lives.ts).
  life?: true;
  // A romance (Phase 17.4): it starts, it's friends instead, a beat plays, or it ends.
  romance?: 'start' | 'friends' | 'next' | 'end';
  // A gift (Phase 17.5): the day goes on their log.
  gift?: true;
  // Skills you come away with.
  train?: Partial<Skills>;
  // Bond: more of it, or at least this much.
  bond?: number;
  bondAtLeast?: number;
  // They're gone for this many days.
  away?: number;
  // They'll meet you at this place today.
  invite?: string;
  // Crew drama (Phase 25.6): you go with them, keep your word to `with`, try to mend it, or leave it.
  crew?: { do: 'pick' | 'keep' | 'mend' | 'leave'; with: string };
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
  // What they lead on an expedition (Phase 24) [proposed]: a grade over yours (or under),
  // since they've been climbing all this time too.
  grade?: number;
}

export const PEOPLE: Record<string, PersonDef> = {
  // Parked next to you, with the coffee on, since before the game began.
  hazel: { name: 'Hazel', known: true, grade: -1 },
  // v0.956's Sage: technical, and the partner whose perk was beta.
  sage: { name: 'Sage', shows: ['road', 'gym'], grade: 1 },
  // v0.956's default rival.
  dex: { name: 'Dex', full: 'Dex Calloway', rival: 'A power monster, a bitter nemesis.' },
  // Phase 17.1: v0.956's people, back as one cast with no two names alike. Ray was its
  // Roadside local and Frank one of its caravan; Mara and Rico its partners (crimps and
  // power), and Tam its elder.
  ray: { name: 'Ray' },
  frank: { name: 'Frank' },
  mara: { name: 'Mara', grade: 2 },
  rico: { name: 'Rico', grade: -1 },
  tam: { name: 'Tam', full: 'Tam Okonkwo', grade: -1 },
};

// The named people at work in town, who aren't climbers you'll get to know: here so no
// one in the cast shares their names.
export const TOWN: Record<string, string> = { wren: 'Wren', otis: 'Otis' };

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

// Asking a partner out climbing: every crag they'd come to, each needing its bond
// (PlaceDef.invite), your grade for it, dry rock, and the haul paid where there is one.
// `say` is their answer, with {place}.
function inviteOpts(who: string, say: string): TalkOpt[] {
  const out: TalkOpt[] = [];
  for (const [id, p] of Object.entries(PLACES)) {
    if (p.invite === undefined) continue;
    out.push({
      label: p.name,
      when: {
        bond: `${who}/${p.invite}`,
        open: id,
        ...(p.minGrade !== undefined ? { grade: p.minGrade } : {}),
        ...(p.unlock !== undefined ? { unlocked: id } : {}),
      },
      fx: { invite: id, today: 'invite', line: say.replace('{place}', p.name) },
    });
  }
  return [...out, { label: 'Never mind' }];
}

// The ask itself: once a day, in the morning, with anyone you've got to know.
const askOut = (who: string): TalkOpt => ({
  label: 'Come climbing?',
  when: { bond: `${who}/${BOND.tiers[1]}`, before: BOND.inviteBefore, notToday: 'invite' },
  next: 'invite',
});

// Phase 17.1: the cast's first words. Each has a meeting, then the ordinary day; a local's
// is a sit once a day, worth a bond, and a partner's the ask out. Their arcs are 17.2's.
const sitWith = (who: string, label: string, min: number, next: string): TalkOpt => ({
  label,
  primary: true,
  when: { notToday: who },
  fx: { cost: { min }, today: who, bond: 1 },
  next,
});

// Phase 17.5: something for them, once a week, said back in their voice.
const giftOpt = (who: string): TalkOpt => {
  const g = GIFTS[who]!;
  return {
    label: `Give ${PEOPLE[who]?.name ?? who} ${g.what} (${money(g.cost)})`,
    when: { giftDue: who, pay: g.cost },
    fx: { gift: true, cost: { cash: -g.cost }, bond: 1, line: g.line },
  };
};
// Frank, brought to the fire for the night.
const fireAsk: TalkOpt = {
  label: FIRE_ASK.label,
  when: { night: true, notToday: 'fire-frank' },
  fx: { today: 'fire-frank', line: FIRE_ASK.line },
};

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
          askOut('hazel'),
          giftOpt('hazel'),
        ],
      },
      invite: {
        text: 'Where? Somewhere I’ve been, and somewhere dry.',
        opts: inviteOpts('hazel', 'Hazel: "{place}. Fine. You’re driving, I’m choosing the music."'),
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
    // Her arc plays here, at the crag (Phase 17.2): the Lot's mornings are the tip and the coffee.
    start: [
      ...arcStarts('hazel'),
      { when: { sentToday: 'pump' }, node: 'sent' },
      { when: { wentToday: 'pump' }, node: 'goes' },
      { node: 'start' },
    ],
    nodes: {
      ...arcNodes('hazel'),
      sent: { text: "That's the one. Lower off, I'm hungry.", opts: [{ label: 'OK' }] },
      goes: { text: 'Clean catch. Rest up, go again.', opts: [{ label: 'OK' }] },
      start: {
        text: "Rope's flaked. I'll belay whatever you want to get on.",
        opts: [{ label: 'OK' }, askOut('hazel')],
      },
      invite: {
        text: 'Leave here? Where?',
        opts: inviteOpts('hazel', 'Hazel: "{place}. Fine. You’re driving, I’m choosing the music."'),
      },
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
      // A romance after the arc's due beats (Phase 17.4): a friend's moment comes first.
      ...romanceStarts('sage'),
      // Crew drama (Phase 25.6).
      ...crewStarts('sage'),
      { when: { today: 'sage' }, node: 'done' },
      { node: 'again' },
    ],
    nodes: {
      ...romanceNodes('sage'),
      ...crewNodes('sage'),
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
          askOut('sage'),
          { label: 'Not now' },
          giftOpt('sage'),
        ],
      },
      invite: {
        text: 'Where are we going? Somewhere dry, and somewhere I trust you on.',
        opts: inviteOpts('sage', 'Sage: "{place}. Meet you there. I’ll bring the rope."'),
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
      ...arcStarts('dex'),
      { when: { lead: 'dex/1' }, node: 'behind' },
      { when: { trail: 'dex/2' }, node: 'ahead' },
      { node: 'even' },
    ],
    nodes: {
      ...arcNodes('dex'),
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
        opts: [{ label: 'Fair' }, giftOpt('dex'), askOut('dex')],
      },
      ahead: {
        text: 'Dex smirks from the boulders. "Still working that V{grade}? I sent it last season, kid."',
        opts: [{ label: 'Let your climbing answer' }, giftOpt('dex'), askOut('dex')],
      },
      // Phase 17.5: Dex can be asked out, as a partner can, once he knows you.
      invite: {
        text: '"Climbing? With you?" Dex thinks about it longer than he needs to. "Where?"',
        opts: inviteOpts('dex', 'Dex: "{place}. Fine. Try to keep up."'),
      },
      even: {
        text: 'Dex gives you a nod and goes back to brushing holds. "May the best climber send."',
        opts: [{ label: 'Nod back' }, giftOpt('dex'), askOut('dex')],
      },
    },
  },
  // Phase 17.1's cast.
  ray: {
    who: 'ray',
    start: [
      { when: { notMet: 'ray' }, node: 'meet' },
      { when: { life: 'ray/1' }, node: 'last-season' },
      ...arcStarts('ray'),
      { when: { today: 'ray' }, node: 'done' },
      { node: 'again' },
    ],
    nodes: {
      ...arcNodes('ray'),
      'last-season': {
        calls: true,
        text: '"Last season," Ray says, to the wall more than to you. "Knees, mostly. The wall won’t notice." He pours you a lid of coffee. "You will. That’s enough."',
        opts: [
          {
            label: 'Sit with him',
            primary: true,
            fx: {
              life: true,
              cost: { min: 20 },
              bond: 1,
              line: 'Ray’s last season at Roadside. He’ll be on the rail at the weekends till it’s done.',
            },
          },
        ],
      },
      meet: {
        text: 'An old man on the guardrail with a thermos, watching the wall like it owes him money. "Ray. I bolted half of what’s on that wall and fell off the other half." He looks you over. "You’re the one who keeps coming back."',
        opts: [
          { label: '"What would you get on?"', primary: true, next: 'pick' },
          { label: 'Just saying hi', next: 'hi' },
        ],
      },
      pick: {
        text: '"The one you’re scared of. Then the one next to it, so it doesn’t feel left out."',
        opts: [{ label: 'Fair' }],
      },
      hi: {
        text: '"Hi yourself. I’m here weekends. The wall’s here all week."',
        opts: [{ label: 'See you' }],
      },
      again: {
        text: 'Ray pours you half a lid of something from the thermos. "Sit. The rock’s not going anywhere."',
        opts: [sitWith('ray', 'Sit a while', 20, 'sat'), { label: 'Not now' }, giftOpt('ray')],
      },
      sat: {
        text: 'He tells you who bolted what, who fell off it, and who lied about it after. Most of them were him.',
        opts: [{ label: 'Thanks, Ray' }],
      },
      done: { text: '"Two stories a day and you’ll start believing them."', opts: [{ label: 'Fair' }] },
    },
  },
  frank: {
    who: 'frank',
    start: [
      { when: { notMet: 'frank' }, node: 'meet' },
      { when: { life: 'frank/1' }, node: 'parked' },
      ...arcStarts('frank'),
      { when: { today: 'frank' }, node: 'done' },
      { node: 'again' },
    ],
    nodes: {
      ...arcNodes('frank'),
      parked: {
        calls: true,
        text: 'Frank’s truck is up on blocks next to your van, its wheels in a neat stack. "Nine years passing through," he says, "and it was the truck that decided." He seems fine about it. Better than fine.',
        opts: [
          {
            label: 'Welcome him',
            primary: true,
            fx: {
              life: true,
              bond: 1,
              line: 'Frank’s parked next to you for good. His stove’s going most nights.',
            },
          },
        ],
      },
      meet: {
        text: 'A box truck you haven’t seen is nosed in past Hazel’s van, a stovepipe through its roof. Its owner is splitting kindling. "Frank. Passing through." He thinks about it. "Nine years now, passing through." He nods at your van. "Yours leaks on the left. I can hear it from here."',
        opts: [
          { label: '"Can you fix it?"', primary: true, next: 'fix' },
          { label: 'Good night, Frank', next: 'night' },
        ],
      },
      fix: { text: '"Everything leaks. You just pick which side."', opts: [{ label: 'Right' }] },
      night: {
        text: 'He lifts the axe an inch, which you take to mean good night.',
        opts: [{ label: 'OK' }],
      },
      again: {
        text: 'Frank’s stove is going. There’s an upturned bucket by it that seems to be yours.',
        opts: [
          sitWith('frank', 'Sit with him', 30, 'sat'),
          { label: 'Not tonight' },
          giftOpt('frank'),
          fireAsk,
        ],
      },
      sat: {
        text: 'You sit. He talks about engines like they’re people and people like they’re weather. Neither of you mentions the leak.',
        opts: [{ label: 'Night, Frank' }],
      },
      done: { text: '"Bucket’s still yours. Tomorrow."', opts: [{ label: 'Fair' }] },
    },
  },
  mara: {
    who: 'mara',
    start: [
      { when: { notMet: 'mara' }, node: 'meet' },

      ...arcStarts('mara'),
      ...romanceStarts('mara'),
      ...crewStarts('mara'),
      { node: 'again' },
    ],
    nodes: {
      ...romanceNodes('mara'),
      ...crewNodes('mara'),
      ...arcNodes('mara'),
      meet: {
        text: 'A woman on the next line lowers off, looks at your chalk bag, then at you. "Mara. You’re on my warm-up." She doesn’t move you off it. "Go on, then. Don’t celebrate if you get it."',
        opts: [
          { label: 'Get on it', primary: true },
          { label: '"Nice to meet you too"', next: 'nice' },
        ],
      },
      nice: { text: '"It might be. Ask me after you’ve fallen off something."', opts: [{ label: 'OK' }] },
      again: {
        text: '"You again. Good. What are you trying?"',
        opts: [{ label: 'Climbing', primary: true }, askOut('mara'), giftOpt('mara')],
      },
      invite: {
        text: '"Where? Somewhere with edges."',
        opts: inviteOpts('mara', 'Mara: "{place}. Be there early or I start without you."'),
      },
    },
  },
  rico: {
    who: 'rico',
    start: [
      { when: { notMet: 'rico' }, node: 'meet' },
      ...arcStarts('rico'),
      ...crewStarts('rico'),
      { node: 'again' },
    ],
    nodes: {
      ...arcNodes('rico'),
      ...crewNodes('rico'),
      meet: {
        text: 'Someone in a sleeveless tee is hanging off the steepest thing here by one heel, arguing with it. He drops, sees you watching, and grins. "Rico. You want next go? It’s horrible. You’ll love it."',
        opts: [
          { label: 'Take the next go', primary: true },
          { label: '"Maybe after you send it"', next: 'after' },
        ],
      },
      after: { text: '"Then you’ll be here a while. Pull up a pad."', opts: [{ label: 'OK' }] },
      again: {
        text: '"{name}! I found a new way to fall off it. Come and see."',
        opts: [{ label: 'In a minute', primary: true }, askOut('rico'), giftOpt('rico')],
      },
      invite: {
        text: '"Out? Somewhere steep. Somewhere I can yell."',
        opts: inviteOpts('rico', 'Rico: "{place}! I’ll bring the pads and the noise."'),
      },
    },
  },
  tam: {
    who: 'tam',
    start: [
      { when: { notMet: 'tam' }, node: 'meet' },
      { when: { life: 'tam/1' }, node: 'slowing' },
      ...arcStarts('tam'),
      ...crewStarts('tam'),
      { node: 'again' },
    ],
    nodes: {
      ...arcNodes('tam'),
      ...crewNodes('tam'),
      slowing: {
        calls: true,
        text: 'Tam takes the first pitch slower than you’ve seen him take anything, and doesn’t pretend otherwise. At the ledge he says, "The good seasons are getting shorter. Or I am."',
        opts: [
          {
            label: 'Wait with him',
            primary: true,
            fx: { life: true, bond: 1, line: 'Tam’s slowing down. He comes out less, and starts earlier.' },
          },
        ],
      },
      meet: {
        text: 'An older climber is coiling a rope in the shade of the wall, slow and exact, the way you’d fold a flag. "Tam Okonkwo. I climb long, and I climb early, before the rock gets hot." He looks at your hands. "You’ll want tape for this sandstone."',
        opts: [
          { label: 'Nod', primary: true },
          { label: '"How long have you been at it?"', next: 'long' },
        ],
      },
      long: {
        text: '"Long enough to count what’s left. Five good seasons, maybe." He says it like a weather report.',
        opts: [{ label: 'OK' }],
      },
      again: {
        text: '"Early start, {name}. The shade won’t wait for us."',
        opts: [{ label: 'Coming', primary: true }, askOut('tam'), giftOpt('tam')],
      },
      invite: {
        text: '"Somewhere long. I don’t drive far for short."',
        opts: inviteOpts('tam', 'Tam: "{place}. I’ll be there before the sun is."'),
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
