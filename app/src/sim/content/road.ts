// On the road (Phase 22.6b), as data: v0.956's eight hitchhikers, each with a second meeting,
// and its nine roadside stops, in its words. Its British turns are American here, as the
// valley is. v0.956 paid some of these in flat skill, which the rebuild doesn't (Phase 22's
// "no farms"): the old hand's line on the back of a receipt is a piece of real beta at the
// crag you're driving to, and the busker's three chords are guitar practice (Phase 22.5b).
// Its standing, reputation and crafting materials have no home here. Psyche is v0.956's
// scale; events.ts scales it to ours.

export interface RoadFx {
  psyche?: number;
  cash?: number;
  energy?: number;
  skin?: number;
  fed?: number;
  // A piece of beta you didn't have, at the crag you're driving to.
  beta?: true;
  // Sets toward your guitar playing.
  guitar?: number;
}

export interface RoadOpt {
  label: string;
  out: string;
  fx: RoadFx;
  // A second meeting's answer that needs what you did the first time: its option's index.
  when?: number;
}

export interface Hitcher {
  id: string;
  who: string;
  sign: string;
  look: string;
  pitch: string;
  opts: RoadOpt[];
  // The second time you pick them up.
  again: { open: string; opts: RoadOpt[] };
  // Who pulls up behind you at a breakdown, if they would.
  friend?: string;
}

export const HITCHERS: Hitcher[] = [
  {
    id: 'kid',
    who: 'A kid, maybe nineteen',
    sign: 'ANY WAY NORTH',
    look: 'Enormous pack, brand-new shoes clipped to the outside of it where everyone can see them, and a haircut somebody gave them in a kitchen.',
    pitch:
      'They have a comp in three days and no way of getting to it. They tell you the category twice in case you did not catch it the first time, and their hands do not stop moving the entire way.',
    opts: [
      {
        label: 'Ask them what they are trying',
        out: 'Everything. They are trying everything. You listen to a nineteen-year-old describe a route they have not done yet with total, unembarrassed certainty, and you remember being exactly that.',
        fx: { psyche: 7 },
      },
      {
        label: 'Tell them what you wish somebody had told you',
        out: 'You keep it short: rest more than you think, do not chase anybody, and the ones who last are the ones who liked it on the bad days. They go quiet and then ask three good questions.',
        fx: { psyche: 4 },
      },
      {
        label: 'Put music on and let them ride',
        out: 'Two hours, no talking, both of you looking at the same road. They say thanks at the drop-off like it cost you something.',
        fx: { psyche: 2 },
      },
    ],
    again: {
      open: 'Same enormous pack, same hands. They went to the comp. They came nineteenth out of forty and they tell you the number straight away, before anything else, the way you do when you have decided in advance not to be embarrassed about it.',
      opts: [
        {
          label: 'Tell them nineteenth is nineteenth',
          out: 'You point out that thirty-nine other people entered and twenty-one of them finished behind, and that the ones who quit are not on the list at all. They sit with that for a mile and then start talking about the next one.',
          fx: { psyche: 6 },
        },
        {
          label: 'Ask what they learned',
          out: 'A lot, it turns out, most of it about the twenty minutes before rather than the climbing. They have thought about it more carefully than you thought about your first ten comps combined.',
          fx: { psyche: 5 },
        },
      ],
    },
    friend: 'the kid from the comp',
  },
  {
    id: 'oldhand',
    who: 'A man in his sixties with a rope over one shoulder',
    sign: 'THE CANYON',
    look: 'Boots older than you. A rack that has been racked the same way for forty years. Absolutely no urgency about being picked up.',
    pitch:
      'He gets in, looks at your gear on the back seat for a while, and then starts telling you about a line at the crag you are driving to, with the kind of detail that only comes from having actually done it.',
    opts: [
      {
        label: 'Ask him about the line',
        out: 'He draws it on the back of a receipt. Where the good rest is, which hold to go from, and the one everybody misses because it is round the arête.',
        fx: { psyche: 5, beta: true },
      },
      {
        label: 'Ask what it was like back then',
        out: 'Bad gear, no money, and better company. He is not romantic about it. He tells you the names of two people who did not make it, and then talks about the food for twenty minutes.',
        fx: { psyche: 6 },
      },
      {
        label: 'Ask if he still climbs hard',
        out: '“Hard for me.” He says it without a shred of apology and it lands somewhere in you and stays there.',
        fx: { psyche: 8 },
      },
    ],
    again: {
      open: 'He is on the same stretch of road with the same rope over the same shoulder, and the first thing he says, before hello, is whether you did the line.',
      opts: [
        {
          label: 'Tell him the truth about how it went',
          out: 'He listens to the whole thing including the part where you backed off, and then says the part where you backed off was the right call, and moves on. It is the least dramatic absolution anybody has ever handed you.',
          fx: { psyche: 8 },
        },
        {
          label: 'Ask him for the next one',
          out: 'Another receipt, another line, harder than the last one and further from the road. He says he has not been up it in eleven years and would very much like somebody to.',
          fx: { psyche: 5, beta: true },
        },
      ],
    },
    friend: 'the old hand with the rope',
  },
  {
    id: 'nurse',
    who: 'A woman in scrubs',
    sign: 'TOWN, PLEASE',
    look: 'Coming off a night shift. Her car is somewhere behind her with a flat and a story attached to it.',
    pitch:
      'She is not a climber and has no interest in becoming one, and it is oddly restful to be in a van with somebody who does not want to talk about grades.',
    opts: [
      {
        label: 'Ask about the shift',
        out: 'She tells you one thing that happened at four in the morning, in the flat voice people use for the ones that stuck. Then she sleeps for forty minutes with her head on the glass.',
        fx: { psyche: 4 },
      },
      {
        label: 'Offer her the coffee in the flask',
        out: 'She takes it, and about a mile later says it is the best thing that has happened to her in eleven hours. She leaves twenty dollars on the seat and is gone before you notice.',
        fx: { psyche: 5, cash: 20 },
      },
      {
        label: 'Say nothing and drive',
        out: 'Comfortable silence with a stranger, which is a rarer thing than the other kind.',
        fx: { psyche: 3, energy: 3 },
      },
    ],
    again: {
      open: 'Different scrubs, same shift pattern. She has her own car back and is standing on the shoulder anyway, because it has broken down again, and she laughs about it before you have said anything.',
      opts: [
        {
          label: 'Offer to look at it',
          out: 'It is the battery terminals, which you know now, because a van teaches you exactly one thing at a time. Ten minutes and it starts. She looks at you like you did something enormous.',
          fx: { psyche: 7, energy: -5 },
        },
        {
          label: 'Just give her the ride again',
          out: 'She sleeps most of it. At the drop-off she says you are the only person she knows who lives like this, and that she thinks about it on the bad shifts.',
          fx: { psyche: 6 },
        },
      ],
    },
    friend: 'the nurse from the night shift',
  },
  {
    id: 'photog',
    who: 'Somebody with two cameras and a broken tripod',
    sign: 'ANYWHERE UP',
    look: 'Filthy jacket, immaculate lenses. Has clearly slept outside more recently than they have showered.',
    pitch:
      'They are shooting a piece about the valley and have burned through their budget and both their rides. They ask what you climb and then actually listen to the answer, which is a professional skill.',
    opts: [
      {
        label: 'Let them shoot you at the crag',
        out: 'Three hours of being told to do the move again. Two of the frames are the best photographs anybody has ever taken of you and they send them over without being asked.',
        fx: { psyche: 5, energy: -8 },
      },
      {
        label: 'Trade the ride for the tripod',
        out: 'It is broken, but the legs are aluminum and the clamps are good, and you can think of four things in the van that want them.',
        fx: { psyche: 2 },
      },
      {
        label: 'Just give them the ride',
        out: 'They offer three times to pay you and you say no three times, and at the drop-off they shake your hand like you did something.',
        fx: { psyche: 4 },
      },
    ],
    again: {
      open: 'The piece came out. They have a printed copy in the bag and hand it over before they have finished getting in, and their hands are not steady about it.',
      opts: [
        {
          label: 'Look at it properly, on the shoulder',
          out: 'You pull over and go through the whole thing while they pretend not to watch you. It is very good. You are in it twice, and neither shot is one you would have chosen, and both are better.',
          fx: { psyche: 9 },
        },
        {
          label: 'Ask what they are shooting next',
          out: 'Something harder, further out, and entirely unfunded. They ask if you would be in it. You say yes before working out what that means.',
          fx: { psyche: 6 },
        },
      ],
    },
    friend: 'the photographer',
  },
  {
    id: 'busker',
    who: 'A busker with a guitar in a trash bag',
    sign: 'WEST',
    look: 'The trash bag is the case. The guitar is worth more than the van.',
    pitch:
      'They ask if you mind if they play, which nobody has ever asked you before, and then play quietly for most of an hour with the cab open to the wind.',
    opts: [
      {
        label: 'Ask for something specific',
        out: 'They do not know it, so they work it out on the way, badly at first and then not badly at all, and by the drop-off it is a real thing that exists.',
        fx: { psyche: 7 },
      },
      {
        label: 'Sing along, badly',
        out: 'You are worse than you think and they are far too kind about it. Best hour of the week.',
        fx: { psyche: 6, energy: -3 },
      },
      {
        label: 'Ask them to teach you three chords',
        out: 'Three chords, one van, forty minutes. Your fingers are wrecked in an entirely new way and you can nearly play a song.',
        fx: { psyche: 5, guitar: 3 },
      },
    ],
    again: {
      open: 'They finished the song. They tell you this the way somebody tells you a person got better.',
      opts: [
        {
          label: 'Ask to hear it',
          out: 'It is genuinely a song now, with a shape and an ending, and the middle bit came from the two of you working it out in this exact van. They say so, out loud, without making a thing of it.',
          fx: { psyche: 10 },
        },
        {
          label: 'Ask if it is going anywhere',
          out: 'Four bars, three towns, one recording made in somebody’s kitchen. They are entirely unbothered about whether it goes anywhere, which is a discipline you recognize.',
          fx: { psyche: 6 },
        },
      ],
    },
    friend: 'the busker',
  },
  {
    id: 'runaway',
    who: 'A young woman with a trash bag of clothes',
    sign: 'no sign',
    look: 'No pack, no gear, no plan visible from the outside. She was walking, not hitching, and only put a hand out when she saw the van slowing.',
    pitch:
      'She does not say where she is going, and after a while it is clear that is because she does not know. She asks how much a night in a van costs, and she is not making conversation.',
    opts: [
      {
        label: 'Answer the question honestly',
        out: 'You tell her what it actually costs, including the parts she has not thought about: the cold, the laundry, the being looked at. She listens the whole way through. It is the first useful conversation she has had in a week.',
        fx: { psyche: 6 },
      },
      {
        label: 'Buy her a proper meal at the drop-off',
        out: 'Twelve dollars. She eats like somebody who was not going to say anything about it. You give her the number of the hostel in town and she writes it on her hand.',
        fx: { psyche: 9, cash: -12 },
      },
      {
        label: 'Drop her in town and leave it there',
        out: 'Not every stranger is yours to fix. You are still thinking about it four days later.',
        fx: { psyche: -2 },
      },
    ],
    again: {
      open: 'She is not carrying the trash bag. She has a pack, secondhand and properly packed, and she is on this road because she is going somewhere specific.',
      opts: [
        {
          label: 'Ask where she landed',
          out: 'A room above the laundromat and a job she does not hate. She says the thing you told her about the cold was the most useful sentence anybody said to her that year, which is a strange and heavy thing to be told.',
          fx: { psyche: 10 },
        },
        {
          label: 'Ask if she ever thought about the van',
          out: 'She did, seriously, for about a month. Then she got the room. She says it without any regret at all and asks how your winter was, and actually waits for the answer.',
          fx: { psyche: 7 },
        },
      ],
    },
    friend: 'the young woman you drove to town',
  },
  {
    id: 'grifter',
    who: 'A guy about your age, no pack at all',
    sign: 'CRAG',
    look: 'Says he climbs. Something about the way he says it does not sit right, and he gets in before you have finished deciding.',
    pitch:
      'He talks the entire way and none of it is quite about anything. Twenty minutes in he mentions his wallet got lifted at the last town, and he says it while looking at the glovebox rather than at you.',
    opts: [
      {
        label: 'Give him forty and wish him luck',
        out: 'He is out of the van and gone across the lot inside a minute, and you sit there for a while working out whether you were kind or just slow.',
        fx: { cash: -40, psyche: -3 },
      },
      {
        label: 'Say you have nothing, because you nearly do',
        out: 'He goes cold for a second, then friendly again, which tells you everything. He gets out at the next junction without saying goodbye.',
        fx: { psyche: -1 },
      },
      {
        label: 'Pull over and ask him to get out',
        out: 'He argues for about eight seconds and then goes, and there is nothing good in the feeling at all, just the flat certainty that you were right.',
        fx: { psyche: -4, energy: -3 },
      },
    ],
    again: {
      open: 'Same stretch, same no pack, same opening line about climbing, and this time you see him from two hundred yards out and you have already decided.',
      opts: [
        {
          label: 'Drive past without slowing',
          out: 'He does not recognize you. That is somehow the worst part of it: you were not memorable, you were just the one that worked.',
          fx: { psyche: -2 },
        },
        {
          label: 'Stop, and ask for your forty back',
          out: 'He does the whole routine again before it lands that you were the last one. He does not have it. He offers you a headlamp instead, which is almost certainly somebody else’s, and you take it because at least it goes back into the world.',
          fx: { psyche: 3 },
          when: 0,
        },
      ],
    },
  },
  {
    id: 'thief',
    who: 'Two of them, one doing the talking',
    sign: 'ANY',
    look: 'One is friendly and does all the talking. The other one does not talk at all and is very interested in the back of the van.',
    pitch:
      'The quiet one asks twice what you keep in there, in a way that is trying to sound like small talk and is not managing it.',
    opts: [
      {
        label: 'Drop them at the next town and check the glovebox',
        out: 'Fifty-five dollars and the good headlamp short, and you cannot prove a thing. The lesson is worth roughly what they took, which is not a comfort at the time.',
        fx: { psyche: -6, cash: -55 },
      },
      {
        label: 'Say the crag is your stop and turn round',
        out: 'You drive fifteen minutes in the wrong direction, drop them where there is nothing, and go back the way you came. You lose most of an hour and keep everything else.',
        fx: { energy: -6, psyche: -2 },
      },
      {
        label: 'Sit the quiet one up front where you can see him',
        out: 'The conversation dies completely. Nothing happens, which was the entire point, and both of you know exactly what the seating arrangement was about.',
        fx: { psyche: -1 },
      },
    ],
    again: {
      open: 'Only one of them this time, the quiet one, and he is standing on the shoulder on his own looking like the last few months have been a lot.',
      opts: [
        {
          label: 'Keep going',
          out: 'You do not owe him a thing and you do not stop, and you spend the next ten miles arguing with somebody who is not in the van.',
          fx: { psyche: -3 },
        },
        {
          label: 'Stop anyway',
          out: 'He does not mention the glovebox and neither do you. He is out of the game, out of the friendship, and going to his sister’s. It is a very quiet hour and you are not sorry you did it.',
          fx: { psyche: 5 },
        },
      ],
    },
  },
];

// Driving past, the first time: they aren't anyone to you yet.
export const PASS_BY = {
  label: 'Drive on past',
  out: 'You keep your foot down. In the mirror, the sign goes down.',
};

export interface RoadStop {
  id: string;
  name: string;
  blurb: string;
  // What pulling over does, the first time; after that, a smaller share (EVENTS.stop.again).
  fx: RoadFx;
}

// v0.956's roadside finds. It paid some in flat skill (head, power) and reputation; here
// they're psyche, as the rest of the stop is.
export const STOPS: RoadStop[] = [
  {
    id: 'overlook',
    name: 'Scenic Overlook',
    blurb: 'A pull-off with a hundred-mile view. Worth every minute of the detour.',
    fx: { psyche: 12 },
  },
  {
    id: 'bigrock',
    name: 'World’s Largest Boulder',
    blurb: 'A house-sized erratic a glacier left behind. Naturally, you had to top it out.',
    fx: { psyche: 14, energy: -4 },
  },
  {
    id: 'balanced',
    name: 'Balanced Rock',
    blurb: 'A boulder perched on a slender spire like it is about to topple. It is not. Probably.',
    fx: { psyche: 14 },
  },
  {
    id: 'lonetree',
    name: 'The Lone Sentinel',
    blurb: 'A wind-twisted pine alone on a bald ridge. A good place to just stop and breathe.',
    fx: { psyche: 12, energy: 8 },
  },
  {
    id: 'piediner',
    name: 'Ma’s Pie Stop',
    blurb: 'A chrome-trimmed diner famous three counties over for one perfect slice of pie.',
    fx: { psyche: 12, fed: 30, cash: -6 },
  },
  {
    id: 'hotspring',
    name: 'Backcountry Hot Spring',
    blurb:
      'A steaming rock pool a short scramble off the road. Locals keep it clean and mostly keep it quiet.',
    fx: { psyche: 12, energy: 18, skin: 14 },
  },
  {
    id: 'ghosttown',
    name: 'The Ghost Town',
    blurb:
      'A silver-boom town the mountain outlived. Sagging timber, a leaning church, and wind through the empty doorways.',
    fx: { psyche: 10 },
  },
  {
    id: 'shrine',
    name: 'The Roadside Shrine',
    blurb:
      'A weathered cross and a jar of fresh flowers at a bend that has claimed more than one driver. People still stop.',
    fx: { psyche: 12 },
  },
  {
    id: 'firelookout',
    name: 'The Fire Lookout',
    blurb:
      'An old ranger tower on the high point for miles. Climb the stairs and the whole range opens under you.',
    fx: { psyche: 14 },
  },
];
