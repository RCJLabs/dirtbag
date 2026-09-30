// Walk-outs (Phase 22.6c), as data: v0.956's five epics, in its words. Each is three stages
// of three calls, every call adding to the risk; how much risk you took decides how you get
// out (events.ts). v0.956's "rattled" has no home in the rebuild, so it's gone; its hunger
// is food. Its British turns are American here, as the valley is.

export interface EpicOpt {
  label: string;
  // What it is, in a few words, under the label.
  sub: string;
  risk: number;
  energy?: number;
  fed?: number;
  skin?: number;
  psyche?: number;
  // Hours it takes; an hour when it doesn't say.
  hours?: number;
}

export type EpicKind = 'dark' | 'storm' | 'lost' | 'cold' | 'stuck';
export type EpicEnd = 'clean' | 'rough' | 'bad';

export interface Epic {
  kind: EpicKind;
  title: string;
  open: string;
  stages: { sit: string; opts: EpicOpt[] }[];
  ends: Record<EpicEnd, string>;
  // The journal's line for it.
  story: Record<EpicEnd, string>;
}

export const EPICS: Epic[] = [
  {
    kind: 'dark',
    title: 'The Walk Out',
    open: 'The last rappel put you on the ground at dusk and the trail did not wait for you. Twenty minutes in, the trees close over and you cannot see your feet.',
    stages: [
      {
        sit: 'The trail forks and you genuinely cannot tell which side you came up. Both look like a trail. Neither looks like THE trail.',
        opts: [
          {
            label: 'Sit down and wait for the moon',
            sub: 'lose two hours, keep everything else',
            risk: -1,
            energy: -6,
            hours: 2,
          },
          {
            label: 'Take the left one and commit',
            sub: 'fifty-fifty, and you know it',
            risk: 2,
            energy: -10,
          },
          {
            label: 'Phone light, one step at a time',
            sub: 'slow, and the battery is what it is',
            risk: 0,
            energy: -8,
            hours: 1,
          },
        ],
      },
      {
        sit: 'A creek you do not remember crossing. In the dark, moving water sounds much bigger than it is.',
        opts: [
          {
            label: 'Wade it, boots and all',
            sub: 'wet feet all night, but you keep moving',
            risk: 1,
            energy: -8,
            skin: -4,
          },
          {
            label: 'Follow the bank down until it narrows',
            sub: 'longer, and the bank is loose',
            risk: 0,
            energy: -12,
            hours: 1,
          },
          { label: 'Rock-hop it in the dark', sub: 'fast, if it works', risk: 3, energy: -5 },
        ],
      },
      {
        sit: 'You can see the parking lot lights through the trees. Between you and them is a slope of loose scree you would not walk down at noon.',
        opts: [
          {
            label: 'Contour around, however long it takes',
            sub: 'the boring right answer',
            risk: -1,
            energy: -12,
            hours: 1,
          },
          { label: 'Straight down, heels dug in', sub: 'you are so close', risk: 2, energy: -6 },
          {
            label: 'Sit and scoot the whole thing',
            sub: 'undignified, effective',
            risk: 0,
            energy: -8,
            skin: -3,
          },
        ],
      },
    ],
    ends: {
      clean:
        'You reach the van at a reasonable hour with your dignity mostly intact and one very clear thought: buy a headlamp.',
      rough:
        'You reach the van somewhere past midnight, scratched, soaked to the shins, and far too tired to be annoyed about it.',
      bad: 'You get to the van at gray light with something in your ankle that is not right, and no real memory of the last hour of trail.',
    },
    story: {
      clean: 'the night you walked out by phone light and swore you would never leave the lamp behind again',
      rough: 'the night the trail disappeared and you got out on feel, hours after dark',
      bad: 'the night the walk-out went properly wrong and you limped into the lot at first light',
    },
  },
  {
    kind: 'storm',
    title: 'The Weather Came In',
    open: 'The sky goes the color of a bruise in about four minutes. The first hail hits while you are still coiling the rope.',
    stages: [
      {
        sit: 'Everything is suddenly water. The trail is a creek and the creek is a river.',
        opts: [
          {
            label: 'Get under the boulder and wait it out',
            sub: 'cold, dry-ish, patient',
            risk: -1,
            energy: -5,
            hours: 2,
          },
          {
            label: 'Shell on, walk straight through it',
            sub: 'you will be soaked, but moving is warm',
            risk: 1,
            energy: -12,
          },
          { label: 'Run for it', sub: 'wet rock, running, in the dark', risk: 3, energy: -14, skin: -3 },
        ],
      },
      {
        sit: 'Lightning, and then thunder, and the gap between them is getting shorter.',
        opts: [
          {
            label: 'Off the ridge, down, now',
            sub: 'the only correct answer, and it costs',
            risk: -2,
            energy: -14,
            hours: 1,
          },
          {
            label: 'Crouch on your pack and count',
            sub: 'the textbook says this. The textbook is cold.',
            risk: 0,
            energy: -6,
            psyche: -4,
            hours: 1,
          },
          { label: 'Push on across the open ground', sub: 'do not do this', risk: 4, energy: -10 },
        ],
      },
      {
        sit: 'The rain quits as fast as it came. You have stopped shivering, which is the part that should worry you.',
        opts: [
          {
            label: 'Stop, strip the wet layers, eat everything',
            sub: 'the boring right answer, again',
            risk: -2,
            energy: -4,
            fed: -25,
            hours: 1,
          },
          {
            label: 'Keep walking and make your own heat',
            sub: 'works right up until it does not',
            risk: 1,
            energy: -10,
          },
          { label: 'Just get to the van', sub: 'one gear: forward', risk: 2, energy: -8 },
        ],
      },
    ],
    ends: {
      clean: 'You get to the van soaked and laughing, heater on full, and the whole thing is already funny.',
      rough:
        'You sit in the driver’s seat shaking hard enough to rattle the keys, and it takes twenty minutes before you can work the heater.',
      bad: 'You do not really remember getting to the van. You remember being cold, then being warm, and being frightened by how good the warm felt.',
    },
    story: {
      clean: 'the afternoon the sky opened up and you got out ahead of it, laughing',
      rough: 'the storm that caught you on the walk-out and had you shaking too hard to hold the keys',
      bad: 'the storm that got properly inside you, the one you do not tell the funny version of',
    },
  },
  {
    kind: 'lost',
    title: 'Off Route',
    open: 'The descent gully looked exactly like the descent gully. It was not the descent gully.',
    stages: [
      {
        sit: 'The ground steepens under you until you are downclimbing, and downclimbing is not walking.',
        opts: [
          {
            label: 'Climb back up to the last thing you knew',
            sub: 'the expensive, correct thing',
            risk: -2,
            energy: -16,
            hours: 2,
          },
          { label: 'Keep going down and hope it opens', sub: 'it might', risk: 3, energy: -8 },
          {
            label: 'Traverse across, looking for the real gully',
            sub: 'loose, sideways, slow',
            risk: 1,
            energy: -12,
            hours: 1,
          },
        ],
      },
      {
        sit: 'You are cliffed out. Twenty feet of nothing between you and easy ground.',
        opts: [
          {
            label: 'Rappel it, leave a sling behind',
            sub: 'gear is cheaper than a night out',
            risk: -2,
            energy: -6,
            psyche: -3,
          },
          {
            label: 'Downclimb it: it is only twenty feet',
            sub: 'twenty feet is plenty',
            risk: 4,
            energy: -8,
          },
          {
            label: 'Back up and go the long way round',
            sub: 'hours you do not have',
            risk: 0,
            energy: -14,
            hours: 2,
          },
        ],
      },
      {
        sit: 'You find a trail. You are not certain it is your trail, but it is a trail, and it goes down.',
        opts: [
          { label: 'Follow it wherever it goes', sub: 'down is down', risk: 0, energy: -10, hours: 1 },
          {
            label: 'Cut cross-country toward the road noise',
            sub: 'you can hear cars; how hard can it be',
            risk: 3,
            energy: -14,
            skin: -4,
          },
          {
            label: 'Stop, sit, and actually think for five minutes',
            sub: 'the thing nobody does',
            risk: -2,
            energy: -3,
            hours: 1,
          },
        ],
      },
    ],
    ends: {
      clean:
        'You pop out on the road half a mile below the pull-off and walk the shoulder back: entirely fine, mildly embarrassed.',
      rough:
        'You get down eventually, several hours and one abandoned sling later, having learned the descent properly the hard way.',
      bad: 'You get down. You are not sure how, and something in you went off somewhere in that gully and did not fully come back.',
    },
    story: {
      clean: 'the time the descent gully was the wrong descent gully and you walked home down the road',
      rough: 'the wrong gully, the cliffed-out ledge, and the sling you left behind to get off it',
      bad: 'the descent that went wrong in a way you still do not tell the whole truth about',
    },
  },
  {
    kind: 'cold',
    title: 'The Long Cold',
    open: 'The temperature drops the way it does in winter: not gradually, but like somebody threw a switch. You are an hour from the van in a layer that was fine at three in the afternoon.',
    stages: [
      {
        sit: 'Your hands stop working properly. Not painful yet, which is worse.',
        opts: [
          {
            label: 'Everything you own, on, right now',
            sub: 'stop and layer up properly',
            risk: -2,
            energy: -5,
            hours: 1,
          },
          { label: 'Hands in armpits, keep marching', sub: 'the dirtbag classic', risk: 1, energy: -8 },
          { label: 'Push the pace to make heat', sub: 'burns what you have left', risk: 2, energy: -14 },
        ],
      },
      {
        sit: 'The wind gets up on the exposed section and takes whatever warmth you had left.',
        opts: [
          {
            label: 'Drop below the ridge, add the distance',
            sub: 'longer, out of the wind',
            risk: -2,
            energy: -12,
            hours: 1,
          },
          { label: 'Head down and straight into it', sub: 'shortest line', risk: 2, energy: -10 },
          {
            label: 'Get behind a rock and eat everything',
            sub: 'calories are heat',
            risk: -1,
            energy: -4,
            fed: -20,
            hours: 1,
          },
        ],
      },
      {
        sit: 'You have stopped shivering. Some part of you knows that is not the good news it feels like.',
        opts: [
          {
            label: 'Wake yourself up and move deliberately',
            sub: 'name it, act on it',
            risk: -2,
            energy: -8,
            psyche: -3,
          },
          { label: 'Just keep the feet going', sub: 'autopilot', risk: 2, energy: -6 },
          { label: 'Sit down for a minute', sub: 'you know better than this', risk: 5, energy: -2 },
        ],
      },
    ],
    ends: {
      clean:
        'The van is a small warm miracle. You sit with the engine running and both hands on the vents until they hurt, which means they work.',
      rough:
        'You get in, get the heater going, and spend a long time unable to do up a zip. It comes back slowly.',
      bad: 'You lose an hour somewhere in there. You get warm eventually, and what you remember afterward is how completely fine it felt to stop.',
    },
    story: {
      clean: 'the winter walk-out where the cold came on like a switch and you beat it back to the van',
      rough: 'the cold night on the trail where your hands stopped working and stayed stopped for an hour',
      bad: 'the winter night you sat down when you should not have, and got up again anyway',
    },
  },
  {
    kind: 'stuck',
    title: 'The Rope Does Not Come',
    open: 'You pull. The rope moves six inches and stops. You pull harder. It does not move at all. Above you, in the dark, most of a rope is welded into a crack you cannot see.',
    stages: [
      {
        sit: 'Half the rope is stuck up there and the light is entirely gone.',
        opts: [
          {
            label: 'Climb the stuck strand and free it',
            sub: 'exactly as bad as it sounds',
            risk: 4,
            energy: -16,
          },
          {
            label: 'Cut it, keep the half you can use',
            sub: 'expensive, safe, final',
            risk: -2,
            energy: -4,
            psyche: -6,
          },
          {
            label: 'Flick, walk, swear, repeat',
            sub: 'sometimes it just comes',
            risk: 0,
            energy: -10,
            hours: 1,
          },
        ],
      },
      {
        sit: 'You are on a ledge two rappels off the ground with less rope than you started with.',
        opts: [
          {
            label: 'Short rappels off whatever you can build',
            sub: 'leave gear, get down',
            risk: -1,
            energy: -12,
            psyche: -4,
            hours: 1,
          },
          {
            label: 'Bivy right here, sort it at first light',
            sub: 'a long, cold, honest night',
            risk: 0,
            energy: -6,
            fed: -20,
            hours: 3,
          },
          {
            label: 'Downclimb the easy-looking corner',
            sub: 'it looks easy from up here',
            risk: 4,
            energy: -10,
          },
        ],
      },
      {
        sit: 'Ground, finally, and the walk out still has to happen, in the dark, on the legs you have left.',
        opts: [
          {
            label: 'Slow and deliberate the whole way',
            sub: 'nothing left to prove',
            risk: -2,
            energy: -12,
            hours: 2,
          },
          { label: 'March it out', sub: 'get it over with', risk: 1, energy: -10 },
          {
            label: 'Sleep at the base, walk at dawn',
            sub: 'a rock for a pillow',
            risk: -1,
            energy: -4,
            fed: -18,
            hours: 3,
          },
        ],
      },
    ],
    ends: {
      clean:
        'You get down with most of a rope and all of yourself. The rope was cheap. Everything else was not.',
      rough:
        'You get down at some indeterminate hour, short one rope, two cams and a sling, and entirely out of opinions.',
      bad: 'You get down. The rope stayed up there, and so did some of your confidence, and your body is going to bill you for the rest.',
    },
    story: {
      clean: 'the night the rope stuck on the last rappel and you got it back anyway',
      rough: 'the stuck rope, the ledge, and the improvised rappels that got you off it in the dark',
      bad: 'the stuck rope that turned into the whole night, the one that actually scared you',
    },
  },
];
