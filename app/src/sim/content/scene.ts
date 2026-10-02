// The scene (Phase 23.5) [proposed numbers]: where you stand with the two crowds, the five
// calls v0.956 put to you, and the echoes that come back for some of them. Evan's calls: two
// factions now, the old guard (v0.956's trad, and the locals) and the gym crowd (its gym and
// comp); no rep and no followers, so a call moves standing, psyche and your legs; v0.956's
// clubs are perks of standing (FACTION_PERKS).
//
// v0.956's numbers came over as: trad → old; gym and comp → gym; media, purism, rep,
// followers and the access fund dropped (nothing here holds them). Its text is kept,
// tightened where it leaned on the internet as a character.

import type { Edge } from './paths';

export type Faction = 'old' | 'gym';

export const FACTIONS: Record<Faction, { name: string; blurb: string }> = {
  old: {
    name: 'the old guard',
    blurb:
      'The purists and the locals. Earn it clean, outdoors, no gimmicks. Respects restraint and real risk.',
  },
  gym: {
    name: 'the gym crowd',
    blurb: 'Indoor climbers, coaches, the comp kids and the scene that trains together. Easy to keep onside.',
  },
};

// What a call does to you: standing with each crowd, psyche, energy.
export interface SceneFx {
  old?: number;
  gym?: number;
  psyche?: number;
  energy?: number;
}

export interface StanceOpt {
  label: string;
  // What it says about you, in the journal.
  stance: string;
  out: string;
  fx: SceneFx;
}

export interface Stance {
  // Not before this day: long enough to have a project, or to be a local (v0.956's tiers).
  after: number;
  // Only once you've a first ascent of your own.
  fa?: true;
  title: string;
  sit: string;
  opts: StanceOpt[];
  // A fourth answer, for someone the old guard listens to (FACTION.elder).
  elder: StanceOpt;
}

export const STANCES: Record<string, Stance> = {
  chip: {
    after: 14,
    title: 'Somebody chipped your project',
    sit: 'The crux move is gone. Where the blank section was, there is now a hold: drilled, filed, and painted to match. Whoever did it did it well, and did it for you as much as for themselves. A season of work on that sequence, and it took them an afternoon to make it go.',
    opts: [
      {
        label: 'Fill it. Restore the line.',
        stance: 'Filled a chipped hold and gave the line its crux back.',
        out: 'Epoxy, rock dust, an afternoon on a rope with a putty knife. It’ll never be quite what it was, but it’s honest again, and the sequence is a sequence, not a ladder.',
        fx: { old: 12, gym: -3, psyche: -4 },
      },
      {
        label: 'Climb it. It goes now.',
        stance: 'Climbed a chipped line and logged it anyway.',
        out: 'It goes at your limit, easily, and it feels like nothing. The tick will always have an asterisk, and you’ll always know what the asterisk is for.',
        fx: { old: -14, gym: 4, psyche: 3 },
      },
      {
        label: 'Name whoever did it.',
        stance: 'Named the chipper. Made an enemy, made a point.',
        out: 'You tell everyone at the crag who did it, and by the weekend everyone in the valley knows. The route is a scandal, and one local will not be speaking to you again.',
        fx: { old: 8, gym: -8 },
      },
    ],
    elder: {
      label: 'Have a quiet word.',
      stance: 'Ended the chipping quietly. Nobody ever knew who did it.',
      out: 'You know exactly who did it, because you know everybody. So you drive over, and you sit in their kitchen, and you don’t raise your voice once. The hold is filled by the weekend, nobody is destroyed, and the route is a route again. It is a power you didn’t used to have, and it’s less satisfying than you thought it would be.',
      fx: { old: 12, gym: -4, psyche: -3, energy: -10 },
    },
  },
  closure: {
    after: 14,
    title: 'The crag is closed. Your project is inside it.',
    sit: 'Raptor nesting, a fixed sign, and a season on it. Your project is forty metres from the nest and you have never once seen a bird on that face. The gate is a strand of wire you could step over without breaking stride.',
    opts: [
      {
        label: 'Respect it. Lose the season.',
        stance: 'Respected a closure that cost me my project for a season.',
        out: 'You go and climb somewhere else, and you’re a little insufferable about it for a week. The route will still be there. Probably.',
        fx: { old: 10, psyche: -5 },
      },
      {
        label: 'Dawn patrol. Nobody will know.',
        stance: 'Poached a closure. Somebody always knows.',
        out: 'You’re on it at first light and off it by seven, and it goes, and it’s the best you’ve climbed all year, right up until somebody’s photo turns up with the closure sign in the corner of the frame. The land manager extends the closure. Everyone knows who to thank.',
        fx: { old: -18 },
      },
      {
        label: 'Tell the manager who’s poaching it.',
        stance:
          'Gave the land manager the names of locals poaching a closure. Access held. Nobody speaks to me.',
        out: 'Three people are on it every dawn and the manager is one bad photo away from closing the whole area. So you give him the names. The crag survives, and you are, from this morning on, the person who did that. Nobody is rude to you. Nobody sits with you either.',
        fx: { old: 9, gym: -14, psyche: -8 },
      },
    ],
    elder: {
      label: 'Go and talk to the landowner yourself.',
      stance: 'Sat down with the landowner and got the closure worked out. Everyone climbs again.',
      out: 'You’ve known him for years, and you turn up with coffee rather than a petition. It takes an afternoon. The closure gets a boundary instead of a padlock, the nest is protected, everybody climbs the west face, and nobody outside two people ever knows there was a problem. That is the entire job, and nobody will ever thank you for it.',
      fx: { old: 14, gym: 8, psyche: -2, energy: -20 },
    },
  },
  retrobolt: {
    after: 28,
    title: 'They want to bolt the runout',
    sit: 'A committee of exactly three people has decided the old highball trad line needs bolts. It’s “dangerous”, it’s “unclimbable as it stands”, and it would make a very good sport route. The person who put it up ground-up is dead. You’re a local now. They’re asking what you think.',
    opts: [
      {
        label: 'It stays as it is.',
        stance: 'Argued against retrobolting a ground-up line. It stays as it is.',
        out: 'You say the thing everyone says: the route isn’t dangerous, the route is honest, and if you can’t climb it as it was climbed, climb something else. The old guard buys your beer. The gym crowd thinks you’re a fossil.',
        fx: { old: 14, gym: -10 },
      },
      {
        label: 'Bolt it. More people should climb.',
        stance: 'Backed bolting an old trad line. More people climb it now.',
        out: 'You point out that nobody has repeated it in eleven years and that a route nobody climbs is a museum piece. It goes in as a sport route, it gets climbed forty times that season, and something is gone.',
        fx: { old: -16, gym: 18 },
      },
      {
        label: 'Not my line, not my call.',
        stance: 'Stayed out of a bolting argument. Everyone noticed.',
        out: 'You say it’s not your rock and not your call, which is true, and which everybody hears as somebody with nothing to say. Neither side counts you as theirs after this.',
        fx: { old: -4, gym: -4, psyche: -2 },
      },
    ],
    elder: {
      label: 'Settle it.',
      stance: 'Settled the bolting argument. It stayed as it was, because I said so.',
      out: 'You tell the room what the man who put it up would have said, and the room goes quiet, and that is the end of it: not because you were right, but because of who you are now. Nobody drills anything. You sit in the van for a while after, because you’ve become the person who decides, and the person who decides is never the person on the sharp end.',
      fx: { old: 10, gym: -12, psyche: -6 },
    },
  },
  fa: {
    after: 28,
    fa: true,
    title: 'Someone else is claiming your first ascent',
    sit: 'A kid from out of town is telling everyone they did the first ascent of the line you cleaned, worked for months, and sent. They didn’t know. They genuinely didn’t know: nobody wrote it down, because the person who was going to write it down was you.',
    opts: [
      {
        label: 'Correct the record.',
        stance: 'Claimed my FA back from someone who took it honestly.',
        out: 'You show the date, the photos, the belayer’s name. They apologise and take it back, and they’re nineteen, and you watch them learn what the scene is like.',
        fx: { old: 3, psyche: -3 },
      },
      {
        label: 'Let them have it.',
        stance: 'Let a kid keep an FA that was mine. Nobody will ever know.',
        out: 'You let it stand. They name it after their grandmother. It goes in the guidebook under their name, and the only two who will ever know otherwise are you and the rock. Nobody claps. That is the entire point of doing it.',
        fx: { psyche: 6 },
      },
      {
        label: 'Ask them to share it.',
        stance: 'Shared an FA credit with the kid who repeated it.',
        out: 'You find them at the crag and suggest a shared credit. They are so relieved they nearly cry. It goes in as both names, which is not how it works, and which nobody objects to.',
        fx: { old: -2, gym: 6, psyche: 3 },
      },
    ],
    elder: {
      label: 'Give them the line, and the story.',
      stance: 'Gave a kid an FA and told everyone it was theirs.',
      out: 'You tell them the line is theirs, and then, because it costs you nothing now, you tell the scene the same thing, loudly. It becomes their FA in the guidebook and in the way people talk. They’ll climb harder than you ever did. You sit in the van for a bit, and it is fine. It’s fine.',
      fx: { old: 8, gym: 8, psyche: -1 },
    },
  },
  trashed: {
    after: 14,
    title: 'The base of the crag is a tip',
    sit: 'Tape, a shattered thermos, dog mess in bags that somebody carried in and left, and enough finger tape to knit a scarf. The place is being loved to death and the landowner has started using the word “liability”.',
    opts: [
      {
        label: 'Spend the day picking it up.',
        stance: 'Spent a climbing day picking up other people’s rubbish.',
        out: 'Two hours, six bags, no climbing, and you drive home with your hands smelling of somebody else’s lunch. Nobody sees you do it, except somebody always does, and by the weekend three other people are doing it too.',
        fx: { old: 8, gym: 5, psyche: -2, energy: -30 },
      },
      {
        label: 'Organise a proper clean-up.',
        stance: 'Organised a crag clean-up. Made it the scene’s problem, not just mine.',
        out: 'You put the word round and buy the bin bags yourself, and twenty people turn up because twenty people were waiting for somebody to ask. The landowner drives past, sees it, and says nothing, which from him is a standing ovation.',
        fx: { old: 10, gym: 6, psyche: 3, energy: -25 },
      },
      {
        label: 'It isn’t your mess.',
        stance: 'Walked past the mess at the crag. It wasn’t mine.',
        out: 'You climb well, you have a good day, and you step over a bag of dog mess on the way out, twice.',
        fx: { old: -6, psyche: -3 },
      },
    ],
    elder: {
      label: 'Ask, once, and let them do it.',
      stance: 'Asked the scene to clean up its own crag. It did.',
      out: 'You don’t pick anything up. You stand at the base with your coffee and say, to nobody in particular and to everybody, that this used to be a nice place. Nineteen people clean the crag that weekend and you’re not one of them. It works because it’s you saying it, and you’re not entirely comfortable with that.',
      fx: { old: 12, gym: 10, psyche: -2 },
    },
  },
};

// An echo: a call coming back, weeks on, for one answer to it. Hold to what you said, or
// turn.
export interface Echo {
  stance: string;
  // The answer it comes back for (its index in the stance's opts; the elder's is 3).
  opt: number;
  title: string;
  sit: string;
  hold: StanceOpt;
  turn: StanceOpt;
}

export const ECHOES: Record<string, Echo> = {
  chip_climbed: {
    stance: 'chip',
    opt: 1,
    title: 'The chipped line has a queue',
    sit: 'The line you logged is a “modern classic” now. There are four people on it on a Tuesday, none of whom know it was drilled. A kid at the base asks you straight out, because you’re the name in the logbook: is it real?',
    hold: {
      label: '“It goes. That’s all a route is.”',
      stance: 'Told a kid the chipped line counts. Stood by the tick.',
      out: 'You say what you’ve been saying since the day you logged it, and the kid nods and pulls on. You watch them climb a ladder somebody made and call it a route. It’s exactly what you said it was.',
      fx: { old: -8, gym: 6, psyche: -3 },
    },
    turn: {
      label: '“No. It was chipped, and I climbed it anyway.”',
      stance: 'Admitted the line I logged was chipped. Took the asterisk.',
      out: 'You tell them the whole thing, standing at the base, including your part in it. The kid goes quiet, then thanks you, and tells somebody, and it gets around. The tick keeps its asterisk. You stop flinching at it.',
      fx: { old: 10, gym: -3, psyche: 4 },
    },
  },
  chip_filled: {
    stance: 'chip',
    opt: 0,
    title: 'The one who chipped it is standing in front of you',
    sit: 'They’ve been waiting to say it, and they say it in the gym car park with their hands shaking: they drilled it because they were never going to climb anything otherwise, and you took that away, and they haven’t been out since.',
    hold: {
      label: '“The rock isn’t yours to change.”',
      stance: 'Held the line on a filled chip, to the face of the person who drilled it.',
      out: 'You don’t soften it, because softening it would be a lie. They walk off. The rule you kept is the right rule and it cost a person their season, and both of those things are true at once.',
      fx: { old: 8, gym: -5, psyche: -6 },
    },
    turn: {
      label: '“I should have talked to you first.”',
      stance: 'Filled a chip, then admitted I should have spoken to them first.',
      out: 'You don’t un-fill the hold, and you don’t pretend the drilling was fine. But you say the other true thing, that you erased a person’s work without once speaking to them, and you offer them a belay. They take it, eventually.',
      fx: { old: -2, gym: 8, psyche: 5 },
    },
  },
  closure_poached: {
    stance: 'closure',
    opt: 1,
    title: 'The closure is back, and so is your photo',
    sit: 'The raptors came back, the closure went back up, and the access meeting opens with your photo on the projector. Not as a villain, exactly. As the reason the landowner wants the whole area gated this time.',
    hold: {
      label: '“The closure was overcautious and it still is.”',
      stance: 'Defended poaching a closure, at the access meeting, with my photo on the wall.',
      out: 'You make the argument about nesting distances and you’re not entirely wrong. The room doesn’t care that you’re not entirely wrong. The gate goes up anyway, and now it has a name on it.',
      fx: { old: -12 },
    },
    turn: {
      label: 'Stand up and own it.',
      stance: 'Owned poaching a closure in front of the whole access meeting.',
      out: 'You stand up in a village hall and say that the photo is you, that you were wrong, and that you’ll do the nest-monitoring rota every weekend of the season. The room shifts. The gate doesn’t go up. You spend a lot of Saturdays in a hide.',
      fx: { old: 14, gym: 4, psyche: -4 },
    },
  },
  closure_respected: {
    stance: 'closure',
    opt: 0,
    title: 'Now it’s somebody else’s project inside the tape',
    sit: 'Same closure, new season, and this time it’s a friend of yours on the wrong side of the wire: two goes from the send of their life, with a job that ends their climbing in a month. They’re asking you, specifically, to say it’s fine.',
    hold: {
      label: '“I lost a season to that tape. So do you.”',
      stance: 'Held a friend to the same closure that cost me a season.',
      out: 'You say it kindly and it lands like a slap. They respect it, and they don’t send, and the job starts, and something between you is a degree cooler for a long time. The rule survived. Rules are like that.',
      fx: { old: 10, psyche: -5 },
    },
    turn: {
      label: '“Go. I’ll say nothing.”',
      stance: 'Let a friend poach the closure I once respected. Said nothing.',
      out: 'You look at the wire, and at your friend, and you find that a season of your own principle weighs less than one person’s last month of climbing. They send it at dawn. Nobody ever finds out, which is somehow worse and better at the same time.',
      fx: { old: -8, gym: 5, psyche: 3 },
    },
  },
  retro_kept: {
    stance: 'retrobolt',
    opt: 0,
    title: 'Somebody decked on the runout you protected',
    sit: 'They’re fine: a broken ankle and a very bad week. But it was the runout you argued to keep, and the argument is on again, louder, with a photograph of the ankle attached to it.',
    hold: {
      label: '“The route is honest. Climb it or don’t.”',
      stance: 'Held the runout after somebody decked on it.',
      out: 'You say the route tells you exactly what it is before you leave the ground, and that removing that is removing the route. Half the scene agrees with you. The half that doesn’t has a photo of an ankle.',
      fx: { old: 12, gym: -10, psyche: -4 },
    },
    turn: {
      label: '“One bolt. I was wrong.”',
      stance: 'Changed my mind on a runout after somebody decked. Added one bolt.',
      out: 'You place one, in the obvious place, and you tell people it was your call to change. The old guard are quietly furious in a way that lasts years. The route gets climbed forty times that season by people who would never have touched it.',
      fx: { old: -12, gym: 12, psyche: 2 },
    },
  },
  fa_conceded: {
    stance: 'fa',
    opt: 1,
    title: 'They’re telling your story at the fire',
    sit: 'The first ascent you handed over is a chapter of somebody else’s origin story now, told well, at somebody else’s fire, to people who’ve heard of them. Every detail is your day. Your name isn’t in it anywhere.',
    hold: {
      label: 'Let it stay theirs.',
      stance: 'Let a given-away FA stay given away, even when it became a legend.',
      out: 'You listen to the whole thing, and then you go climbing. Some things you give away stay given. It costs you something every time you hear it, and you decide that is a price and not a wound.',
      fx: { old: 4, psyche: -6 },
    },
    turn: {
      label: 'Put the record straight, finally.',
      stance: 'Reclaimed an FA I had let go, once it became somebody else’s legend.',
      out: 'You show the date, the photos, the logbook page. It isn’t graceful and it isn’t in doubt either. Some people say you should have said it a year ago. You agree with them, which is why you’re saying it now.',
      fx: { old: 5, psyche: 4 },
    },
  },
};

// v0.956's clubs, as what standing with a crowd gets you (Evan's call). The old guard's are
// the Alpine Club's local knowledge and the Access Coalition's permits; the gym crowd's, the
// Program's coaching.
export const FACTION_PERKS: Record<Faction, { at: number; name: string; edge: Edge; permits?: true }[]> = {
  old: [
    { at: 56, name: 'Local knowledge', edge: { outside: 1.02 } },
    { at: 76, name: 'The old guard vouches for you', edge: { outside: 1.02 }, permits: true },
  ],
  gym: [
    { at: 56, name: 'Coached sessions', edge: { train: 1.15 } },
    { at: 76, name: 'A real season plan', edge: { train: 1.13 } },
  ],
};

// v0.956's crowd shifts for taking up a calling, on two crowds.
export const CALLING_SCENE: Record<string, SceneFx> = {
  purist: { old: 15 },
  sendorbust: { gym: 13 },
  lifer: { old: 8, gym: 5 },
};
