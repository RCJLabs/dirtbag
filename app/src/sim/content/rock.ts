// Phase 27.2 (Evan's calls, 13 Oct 2026): the rock's beta. Every outdoor line used to draw
// its cruxes from one plastic library, six pairs for the whole valley; now each crag climbs
// like its rock. Granite is friction, cracks and edges; quartzite sharp edges and high, slopey
// top-outs; sandstone slopers, splitters and varnish; gneiss incuts and compression;
// limestone tufas, pockets and kneebars. Within a crag no two cruxes start the same way.
//
// A crux plays as its kind always has: a move is written for a slot (what LIBRARY's pair for
// that style did), and routes.ts's inRock keeps the window and costs of the beta it replaces,
// checking the verb matches. So how hard a line is doesn't move; what moves is which of your
// skills it leans on, and what it's called. The gyms keep the plastic library.

import type { Style } from '../climber';
import type { Rock } from '../dials';
import type { BetaDef } from './routes';
import { laterRock } from './rock.full';

// The kind of crux a move stands in for, by LIBRARY's style: its verb, window and costs.
type Slot = 'crimp' | 'power' | 'technical' | 'dyno' | 'endurance' | 'crack';

// What the first way through each kind of crux plays as: LIBRARY's first of each pair. The
// verb is what counts; the numbers fill the type, and the line keeps its own.
const FIRST: Record<Slot, Pick<BetaDef, 'verb' | 'w' | 'rate' | 'need' | 'skin'>> = {
  crimp: { verb: 'tension', w: 0.12, rate: 1.5, need: 1.5, skin: 2 },
  power: { verb: 'load', w: 0.085 },
  technical: { verb: 'tension', w: 0.12, rate: 1.2, need: 1.6 },
  dyno: { verb: 'load', w: 0.08 },
  endurance: { verb: 'tension', w: 0.13, rate: 1.6, need: 1.8 },
  crack: { verb: 'timing', w: 0.13, skin: 3 },
};

// And the trick you earn: LIBRARY's second, and the falls it takes to see it.
const EARNED: Record<Slot, Pick<BetaDef, 'verb' | 'w' | 'rate' | 'need'> & { falls: number }> = {
  crimp: { verb: 'timing', w: 0.16, falls: 1 },
  power: { verb: 'tension', w: 0.15, rate: 1.3, need: 1.4, falls: 2 },
  technical: { verb: 'tension', w: 0.15, rate: 1.4, need: 1.4, falls: 1 },
  dyno: { verb: 'timing', w: 0.14, falls: 2 },
  endurance: { verb: 'timing', w: 0.16, falls: 1 },
  crack: { verb: 'tension', w: 0.15, rate: 1.4, need: 1.5, falls: 1 },
};

const HINT = [
  '',
  'Fall here and you might see another way.',
  'Fall here twice, or watch someone who knows it.',
];

// The way everyone tries first.
const first = (
  slot: Slot,
  style: Style,
  name: string,
  short: string,
  note: string,
  lines: BetaDef['lines'],
): BetaDef => ({
  ...FIRST[slot],
  style,
  name,
  short,
  note,
  lines,
  ...(style === 'crimp' ? { crimpy: true } : {}),
});

// The way you earn by falling, and the line that shows it you.
const earned = (
  slot: Slot,
  style: Style,
  name: string,
  short: string,
  note: string,
  found: string,
  lines: BetaDef['lines'],
): BetaDef => {
  const { falls, ...e } = EARNED[slot];
  return {
    ...e,
    style,
    name,
    short,
    note,
    hint: HINT[falls],
    unlock: { falls, line: found },
    lines,
    ...(style === 'crimp' ? { crimpy: true } : {}),
  };
};

// ---------------------------------------------------------------------------------------
// Granite: Roadside and the Gorge (the Big Stone's and Wind River's are in rock.full.ts).
// Friction, cracks, small edges.

const GRANITE: Record<string, BetaDef> = {
  longreach: first(
    'endurance',
    'endurance',
    'Stay low and reach',
    'stay low',
    'Seven moves of keeping your hips in, and a long reach at the end of them.',
    {
      fall: 'Your hips sag off the wall, and the reach goes with them.',
    },
  ),
  jumplip: first(
    'dyno',
    'dyno',
    'Jump for the lip',
    'jump',
    'Feet on two crystals, eyes on the lip, and no second chances.',
    {
      short: 'Short. You paw at the lip and drop.',
      long: 'Too much. You hit the lip and bounce off it.',
      held: 'You wait on the crystals too long, and your feet melt off.',
    },
  ),
  dimes: first(
    'crimp',
    'crimp',
    'Crimp the dimes',
    'dimes',
    'Edges the width of a coin. Thumb over, and hope.',
    {
      fall: 'A dime edge rolls out from under your fingertip.',
    },
  ),
  ringlock: first(
    'crack',
    'crack',
    'Ring-lock the seam',
    'ring-lock',
    'Thumb and fingers stacked in the seam, twisted till it bites.',
    {
      hit: 'Locked.',
      miss: 'The lock slips.',
      fall: 'Your fingers pull out of the seam.',
    },
  ),
  arete: first(
    'technical',
    'technical',
    'Slap up the arête',
    'slap the arête',
    'Both hands on the edge, feet high, and a lot of leaning out.',
    {
      fall: 'You barn-door off the arête.',
    },
  ),
  undercling: first(
    'power',
    'power',
    'Big pull off the undercling',
    'big pull',
    'Feet up under you, and pull the undercling into your hip till you can reach.',
    {
      short: 'Short. Your hand slaps the wall under the hold.',
      long: 'Too much. You fly past it and the undercling lets go.',
      held: 'Held it too long. Your arms empty.',
    },
  ),
  leap: first(
    'dyno',
    'dyno',
    'Leap off the sloper',
    'leap',
    'A sloper start and one long leap. Commit or don’t start.',
    {
      short: 'Short. Fingertips on the edge, then air.',
      long: 'Too much. You sail past the edge.',
      held: 'You hang on the sloper thinking about it, and it decides for you.',
    },
  ),
  smear: first(
    'technical',
    'technical',
    'Smear and trust it',
    'smear',
    'Friction and faith. Heels low, weight over your toes, no holds to speak of.',
    {
      fall: 'Your feet skate down the granite.',
    },
  ),
  razors: first(
    'crimp',
    'crimp',
    'Pull on the razors',
    'razors',
    'Square, sharp edges. They hold; your skin may not.',
    {
      fall: 'Your skin gives out before the edge does.',
    },
  ),
  layaway: first(
    'technical',
    'technical',
    'Layaway the arête',
    'layaway',
    'Lean off the arête, feet on the face, and walk it up.',
    {
      fall: 'The layaway pivots you off the face.',
    },
  ),
  flarejam: first(
    'crack',
    'crack',
    'Jam the flare',
    'jam the flare',
    'Where it flares, twist a hand jam in deep and trust the bit that bites.',
    {
      hit: 'Solid jam.',
      miss: 'The flare spits the jam.',
      fall: 'Your hand slides out of the flare.',
    },
  ),
  pinch: first(
    'power',
    'power',
    'Squeeze and pull',
    'squeeze',
    'One hold. Squeeze it like it owes you money, and move.',
    {
      short: 'Short. The pinch opens before you get there.',
      long: 'Too much. You overpull and the pinch spins you off.',
      held: 'You squeeze too long, and there’s nothing left to move with.',
    },
  ),
  throwbadfeet: first(
    'dyno',
    'dyno',
    'Throw off bad feet',
    'throw',
    'Feet on nothing in particular, and a throw that doesn’t care.',
    {
      short: 'Short. You touch it on the way down.',
      long: 'Too much. You hit the hold and keep going.',
      held: 'Your feet slip while you’re still winding up.',
    },
  ),
  crystals: first(
    'crimp',
    'technical',
    'Edge the crystals',
    'crystals',
    'Feldspar crystals for your feet, and the edges come to you if you stand on them.',
    {
      fall: 'A crystal snaps off under your toe.',
    },
  ),
  slabfinish: first(
    'technical',
    'technical',
    'Rock onto the slab',
    'rock onto the slab',
    'A high foot, a press, and the angle eases, if you can stand up on it.',
    {
      fall: 'You press, you wobble, you don’t stand up.',
    },
  ),
  roofjugs: first(
    'power',
    'power',
    'Cut loose and catch',
    'cut loose',
    'Feet off at the roof, swing, and catch the lip on the way back.',
    {
      short: 'Short. You swing under the lip and off.',
      long: 'Too much. The swing tears you off the jug.',
      held: 'You hang under the roof too long, and the swing never comes.',
    },
  ),
  longfinish: first(
    'endurance',
    'endurance',
    'Climb through the pump',
    'climb through',
    'No rest worth the name. Clip, breathe, move, before the pump catches you.',
    {
      fall: 'Your forearms go, a long way above the last bolt.',
    },
  ),
  chickenwing: first(
    'crack',
    'crack',
    'Chicken-wing the bulge',
    'chicken-wing',
    'Elbow in, hand out, and inch up the wide bit like nobody’s watching.',
    {
      hit: 'Wedged.',
      miss: 'The wing slips.',
      fall: 'The bulge shrugs you out of it.',
    },
  ),
  longcorner: first(
    'endurance',
    'endurance',
    'Keep stemming up',
    'stem up',
    'A long corner. Stem, jam, stem, and don’t stop to think about how long.',
    {
      fall: 'Your legs shake out of the stem.',
    },
  ),
  // What granite gives you when you fall at it.
  dropknee: earned(
    'endurance',
    'technical',
    'Drop-knee and reach',
    'drop-knee',
    'Turn the knee in and the reach comes for free.',
    'Off again, you notice the edge your knee keeps hitting. New beta: drop-knee.',
    {
      hit: 'Knee in.',
      miss: 'Your knee slips off.',
      fall: 'The drop-knee holds; your hand doesn’t.',
    },
  ),
  deadpoint: earned(
    'dyno',
    'power',
    'Deadpoint through the sidepull',
    'deadpoint',
    'A sidepull halfway. Catch it at the top of the move, then the lip.',
    'Twice off. There’s a sidepull halfway you never used. New beta: deadpoint.',
    {
      hit: 'Caught it.',
      miss: 'Missed the sidepull.',
      fall: 'You come off the sidepull.',
    },
  ),
  thumb: earned(
    'crimp',
    'technical',
    'Thumb the edge and step up',
    'thumb and step',
    'Thumb over the edge, a high step, and your fingers get a rest they didn’t earn.',
    'Sliding off, your foot finds a step you never looked at. New beta: thumb and step up.',
    {
      hit: 'Good step.',
      miss: 'Missed the step.',
      fall: 'Your foot skates off the high step.',
    },
  ),
  layback: earned(
    'crack',
    'power',
    'Layback off the flake',
    'layback',
    'Lean off the crack’s edge instead of jamming it, and walk your feet up.',
    'Off again. The crack has a clean edge to lean on. New beta: layback.',
    {
      fall: 'Your feet cut and you swing off the flake.',
    },
  ),
  crimpflake: earned(
    'technical',
    'crimp',
    'Pinch the hidden flake',
    'pinch the flake',
    'A flake you can’t see from below. Pinch it and pull.',
    'Coming off, your hand drags over a flake. New beta: pinch it.',
    {
      fall: 'The flake’s too small to keep pinching.',
    },
  ),
  heel: earned(
    'power',
    'technical',
    'Heel-hook and rock over',
    'heel-hook',
    'The heel does half the pulling, and the rock-over does the rest.',
    'Second time off. There’s heel rubber right by your hip. New beta: heel-hook.',
    {
      fall: 'Your heel pops.',
    },
  ),
  bump: earned(
    'dyno',
    'power',
    'Bump through the crimp',
    'bump',
    'Two small moves instead of one big one, through a crimp halfway.',
    'Twice off the leap. There’s a crimp halfway you walked past. New beta: bump through.',
    {
      hit: 'Caught it.',
      miss: 'Missed the crimp.',
      fall: 'You come off the crimp.',
    },
  ),
  edgecrystal: earned(
    'technical',
    'crimp',
    'Edge the crystal dike',
    'crystal dike',
    'A dike of crystals runs up through it. Less balance, more fingers.',
    'Off again, you notice a dike of crystals running through it. New beta: edge it.',
    {
      fall: 'A crystal snaps off the dike.',
    },
  ),
  footswap: earned(
    'crimp',
    'technical',
    'Swap feet on the crystal',
    'foot-swap',
    'One good crystal, two feet. Swap, and the next edge is in reach.',
    'You fall past a crystal the size of a thumbnail. New beta: swap feet on it.',
    {
      hit: 'Clean swap.',
      miss: 'Fumbled the swap.',
      fall: 'Your foot skates off the crystal mid-swap.',
    },
  ),
  stemrest: earned(
    'crack',
    'technical',
    'Stem and shake',
    'stem and shake',
    'Bridge out wide, take your hands off, and shake the jams out of them.',
    'Off again, you see how wide the walls would let you stem. New beta: stem and shake.',
    {
      fall: 'Your feet skid out of the stem.',
    },
  ),
  toehook: earned(
    'power',
    'technical',
    'Toe-hook the lip',
    'toe-hook',
    'Toe hooked over the edge, and you can let go of the hard hold long enough to reach.',
    'Second time off. Your toe brushes a hook on the way down. New beta: toe-hook.',
    {
      fall: 'Your toe slides off the hook.',
    },
  ),
  shake: earned(
    'endurance',
    'technical',
    'Shake out in the crack',
    'shake out',
    'A hand jam to hang off. Shake each arm, then go.',
    'You come off right by a jam you could hang off all day. New beta: shake there.',
    {
      hit: 'Good shake.',
      miss: 'Rushed it.',
      fall: 'Pumped off anyway.',
    },
  ),
};

// ---------------------------------------------------------------------------------------
// The walls' pitches (Phase 27.3), all granite: written for each pitch's kind, so a slab
// pads, a crack jams and a roof swings, and none repeats a single-pitch line's moves at its
// crag.

const WALL_MOVES: Record<string, BetaDef> = {
  // The Long Prow, above Roadside.
  padslab: first(
    'technical',
    'technical',
    'Pad up the slab',
    'pad',
    'No holds worth the name. Flat feet, low heels, and keep moving before you think about it.',
    {
      fall: 'Your feet skate, and you slide down the slab onto the rope.',
    },
  ),
  dishslab: earned(
    'technical',
    'technical',
    'Stand in the dish',
    'the dish',
    'A shallow dish off to the side. Get a foot in it and stand, and the blank bit is a step.',
    'Sliding back down, you see a dish off to the side. New beta: stand in the dish.',
    {
      fall: 'You get the foot in the dish, and it isn’t enough.',
    },
  ),
  ladder: first(
    'crimp',
    'crimp',
    'Climb the ladder',
    'ladder',
    'Edges in a line up the face, a body length apart. Lock off each one and reach.',
    {
      fall: 'You lock off, reach, and the next rung isn’t there yet.',
    },
  ),
  ladderfeet: earned(
    'crimp',
    'technical',
    'Feet on the rungs',
    'rung feet',
    'The rung you just let go of is a foothold. Stand on it, and the next one comes to you.',
    'Off the ladder, you see the rung below is as good a foot as a hand. New beta: feet on the rungs.',
    {
      hit: 'Foot on the rung.',
      miss: 'Missed the rung.',
      fall: 'Your foot slips off the rung.',
    },
  ),
  roofreach: first(
    'power',
    'power',
    'Reach out the roof',
    'reach out',
    'Jugs to the lip, feet cut, and one long pull round it.',
    {
      short: 'Short. You slap the lip and swing.',
      long: 'Too much. You overshoot the lip, and the swing takes you.',
      held: 'You hang under the roof working up to it, and your arms go.',
    },
  ),
  roofbicycle: earned(
    'power',
    'technical',
    'Bicycle the lip',
    'bicycle',
    'One toe pulls, the other pushes, and the lip holds your feet while your hands move.',
    'Twice off the lip. Your feet could hold it while your hands move. New beta: bicycle.',
    {
      fall: 'One foot slips, and the bicycle comes apart.',
    },
  ),
  handjams: first(
    'endurance',
    'crack',
    'Hand jams to the top',
    'hand jams',
    'A splitter the width of your hand, the whole headwall. Jam, step, jam, and breathe.',
    {
      fall: 'Your jams get sloppy, and one slides out.',
    },
  ),
  jamrest: earned(
    'endurance',
    'endurance',
    'Hang off a foot jam',
    'foot jam',
    'Twist a foot into the crack and hang straight-armed. Then go.',
    'Off again near the top. Your feet could have been jamming too. New beta: hang off a foot jam.',
    {
      hit: 'Foot jammed.',
      miss: 'Your foot won’t seat.',
      fall: 'The foot jam rolls out.',
    },
  ),
};

// ---------------------------------------------------------------------------------------
// The highballs' top-outs (Phase 27.5), each in its rock: a granite mantel, a quartzite
// sloper, a sandstone top gone to sand, a cold gneiss lip, a limestone top under the grass.
// They stand in for LIBRARY's technical pair (routes.ts's topOut).

const TOP_OUTS: Pick<Record<Rock, Record<string, BetaDef>>, 'granite'> = {
  granite: {
    hbpress: first(
      'technical',
      'technical',
      'Press out the top',
      'press out',
      'Palms flat on top, elbows locked, and press. It feels higher than it is.',
      {
        fall: 'Your elbows buckle, and you go back down the way you came.',
      },
    ),
    hbheel: earned(
      'technical',
      'technical',
      'Heel over the lip',
      'heel over',
      'Throw a heel onto the top and roll onto it, instead of pressing.',
      'Off the top, you see a heel would have done it. New beta: heel over the lip.',
      {
        fall: 'The heel skates off the rounded top.',
      },
    ),
    naveslab: first(
      'technical',
      'technical',
      'Smear onto the summit slab',
      'smear on',
      'The top rolls back into a slab. Get your feet up and trust the friction to stand.',
      {
        fall: 'Your feet skate on the summit slab.',
      },
    ),
    naveknob: earned(
      'technical',
      'power',
      'Grab the summit knob',
      'the knob',
      'A knob just over the lip, out of sight. Reach over blind and find it.',
      'Off the top. From the ground you can see a knob over the lip. New beta: grab the summit knob.',
      {
        fall: 'You find the knob, and it’s slicker than it looked.',
      },
    ),
  },
};

// ---------------------------------------------------------------------------------------
// The signature lines, by hand: one a crag, the one people drive in for (Phase 27.2). The
// Pump at Roadside was hand-made already.

const SIGNATURE: Pick<Record<Rock, Record<string, BetaDef>>, 'granite'> = {
  granite: {
    overlap: first(
      'power',
      'power',
      'Undercling the overlap and stand',
      'undercling',
      'Hands in the overlap, feet up the face, and stand into the reach.',
      {
        short: 'Short. You stand and don’t get there.',
        long: 'Too much. You stand up out of the undercling.',
        held: 'You hang in the overlap too long. Your arms are spent.',
      },
    ),
    overlapknee: earned(
      'power',
      'technical',
      'Kneebar under the overlap',
      'kneebar',
      'There’s a kneebar under the overlap. Nobody on granite looks for one.',
      'Second time off. Your knee scraped a slot under the overlap. New beta: kneebar.',
      {
        fall: 'The kneebar slides out.',
      },
    ),
    headwall: first(
      'crimp',
      'crimp',
      'Crimp the headwall in the shade',
      'crimp',
      'Cold, square edges up the headwall, a long way above the overlap.',
      {
        fall: 'Your fingers open on the headwall.',
      },
    ),
    headwallflake: earned(
      'crimp',
      'technical',
      'Back-step onto the flake',
      'back-step',
      'A back-step onto the flake turns your hip in and the edges get closer.',
      'Off the headwall, you see a flake for a back-step. New beta: back-step.',
      {
        hit: 'Hip in.',
        miss: 'Missed the back-step.',
        fall: 'Your back-step slips off the flake.',
      },
    ),
  },
};

// The later crags' rock (Phase 14.5b): quartzite, sandstone, gneiss and limestone, and the
// granite moves only the Big Stone's and Wind River's lines and walls climb, are the full
// game's (rock.full.ts). The demo's build has Roadside's and the Gorge's alone (rock.demo.ts).
export interface RockMakers {
  first: typeof first;
  earned: typeof earned;
}
const LATER = laterRock({ first, earned });

// Each rock's moves, the signature lines' with them.
export const ROCK_MOVES: Record<Rock, Record<string, BetaDef>> = {
  ...LATER.moves,
  granite: { ...GRANITE, ...SIGNATURE.granite, ...TOP_OUTS.granite, ...WALL_MOVES, ...LATER.moves.granite },
};

// Each outdoor line's cruxes, in order: the first way through and the earned one, from its
// crag's rock. Roadside's warm-up, the Roadside Route and The Pump were made by hand before.
export const ROCK_LINES: Record<string, [string, string][]> = {
  // Roadside: granite.
  warm: [['longreach', 'dropknee']],
  dyno: [['jumplip', 'deadpoint']],
  crimpfest: [['dimes', 'thumb']],
  fingercrack: [['ringlock', 'layback']],
  highball: [
    ['arete', 'crimpflake'],
    ['hbpress', 'hbheel'],
  ],
  project: [['undercling', 'heel']],
  rsopen: [['leap', 'bump']],
  testpiece: [
    ['smear', 'edgecrystal'],
    ['razors', 'footswap'],
  ],
  tradarete: [
    ['layaway', 'crimpflake'],
    ['flarejam', 'stemrest'],
  ],
  // The Gorge: granite, in the shade.
  gslab: [['smear', 'edgecrystal']],
  gserenity: [['flarejam', 'layback']],
  gpinch: [['pinch', 'heel']],
  gdyno: [['throwbadfeet', 'deadpoint']],
  gcathedral: [
    ['razors', 'thumb'],
    ['naveslab', 'naveknob'],
  ],
  gopen: [['dimes', 'footswap']],
  gintro: [
    ['crystals', 'thumb'],
    ['slabfinish', 'crimpflake'],
  ],
  gclassic: [
    ['overlap', 'overlapknee'],
    ['headwall', 'headwallflake'],
  ],
  gpe: [
    ['roofjugs', 'toehook'],
    ['longfinish', 'shake'],
  ],
  gtrad: [
    ['chickenwing', 'stemrest'],
    ['longcorner', 'dropknee'],
  ],
  // The walls' pitches (Phase 27.3): granite, by kind.
  'prow-1': [['padslab', 'dishslab']],
  'prow-2': [['ladder', 'ladderfeet']],
  'prow-3': [['roofreach', 'roofbicycle']],
  'prow-4': [['handjams', 'jamrest']],
  ...LATER.lines,
};
