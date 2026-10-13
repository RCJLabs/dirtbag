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
// Granite: Roadside, the Gorge, the Big Stone, Wind River. Friction, cracks, small edges.

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
  lipthrow: first(
    'power',
    'power',
    'Throw for the lip',
    'throw',
    'Two moves and a throw to the lip. Approach shoes optional.',
    {
      short: 'Short. You slap granite below the lip.',
      long: 'Too much. You catch the lip and keep travelling.',
      held: 'You crouch too long and the throw goes flat.',
    },
  ),
  fingerlock: first(
    'crack',
    'crack',
    'Finger-lock and pull',
    'finger-lock',
    'A perfect lock, every time, if you put it in the right place.',
    {
      hit: 'Perfect lock.',
      miss: 'Wrong spot. It flares.',
      fall: 'The lock pops a long way off the ground.',
    },
  ),
  cornerjam: first(
    'crack',
    'crack',
    'Jam the corner crack',
    'jam the corner',
    'Hand jams up the back of the corner, feet smearing either wall.',
    {
      hit: 'Good jam.',
      miss: 'The jam rattles.',
      fall: 'You pull out of the corner crack.',
    },
  ),
  traverse: first(
    'technical',
    'technical',
    'Edge sideways',
    'edge sideways',
    'Step across on edges. Hands are for balance, nothing more.',
    {
      fall: 'Your feet go and you swing into the corner.',
    },
  ),
  frozen: first(
    'crimp',
    'crimp',
    'Crimp them cold',
    'cold crimps',
    'Numb fingers on cold edges. You won’t feel them hold; trust that they are.',
    {
      fall: 'Your fingers open, and you never felt them go.',
    },
  ),
  facets: first(
    'technical',
    'technical',
    'Palm up the facets',
    'palm the facets',
    'Palm a facet, smear between them, and keep your weight out over your feet.',
    {
      fall: 'The facet you palmed was steeper than it looked.',
    },
  ),
  armbar: first(
    'crack',
    'crack',
    'Arm-bar the offwidth',
    'arm-bar',
    'Arm in to the shoulder, heel-toe below, and move an inch at a time.',
    {
      hit: 'Wedged.',
      miss: 'It spits your arm.',
      fall: 'The offwidth shrugs you out, and takes skin as a fee.',
    },
  ),
  lunge: first(
    'power',
    'power',
    'Lunge for the edge',
    'lunge',
    'At this altitude a lunge is a gamble you make once.',
    {
      short: 'Short. The thin air takes the last inch.',
      long: 'Too much. You pass the edge, gasping.',
      held: 'You wind up too long, and run out of breath before the move.',
    },
  ),
  skyline: first(
    'endurance',
    'endurance',
    'Clip and keep going',
    'keep going',
    'The drag is the second crux. Clip, pull the rope up, go.',
    {
      fall: 'The rope drag and the pump win together.',
    },
  ),
  handjam: first(
    'crack',
    'crack',
    'Hand-jam the splitter',
    'hand-jam',
    'Thumbs up, cup and twist, and the crack does the rest.',
    {
      hit: 'Bomber jam.',
      miss: 'The jam rotates out.',
      fall: 'Your hand slides out of the splitter.',
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
// Quartzite: Moonstone. Sharp edges, tall arêtes, and slopey top-outs a long way up.

const QUARTZITE: Record<string, BetaDef> = {
  hugarete: first(
    'technical',
    'technical',
    'Hug the arête',
    'hug',
    'Both arms around it, feet smearing the faces, and keep your nerve at the top.',
    {
      fall: 'You peel off the arête, a long way up.',
    },
  ),
  heave: first(
    'power',
    'power',
    'Heave onto the lip',
    'heave',
    'Pull, get your chest over, and the mantel is half done.',
    {
      short: 'Short. You don’t get high enough over it.',
      long: 'Too much. You overshoot and slide back off.',
      held: 'You hang under the lip too long to heave at all.',
    },
  ),
  throwsloper: first(
    'dyno',
    'dyno',
    'Throw for the sloper',
    'throw',
    'One hold, one throw, one smooth sloper to catch and keep.',
    {
      short: 'Short. You touch it and it touches back.',
      long: 'Too much. You slap past the sloper.',
      held: 'You wind up so long the start hold gives up first.',
    },
  ),
  pockets: first(
    'crimp',
    'crimp',
    'Two-finger the pockets',
    'two-finger',
    'Pockets the size of two fingers, sharp-lipped. Middle and ring, and pull.',
    {
      fall: 'A finger slides out of the pocket.',
    },
  ),
  jamsplitter: first(
    'crack',
    'crack',
    'Jam the splitter',
    'jam',
    'Hand jams in quartzite, which is sharp, which is why there’s tape.',
    {
      hit: 'Solid jam.',
      miss: 'The jam slips.',
      fall: 'You pull out of the splitter, high up.',
    },
  ),
  cutfeet: first(
    'power',
    'power',
    'Cut feet and catch the lip',
    'catch the lip',
    'Out the roof on your arms, feet swinging, and catch the lip as you come round.',
    {
      short: 'Short. The lip goes past your fingertips.',
      long: 'Too much. You catch it and the swing rips you off.',
      held: 'You hang in the dark too long to catch anything.',
    },
  ),
  snatch: first(
    'power',
    'crimp',
    'Snatch the razor',
    'snatch',
    'A sharp crimp a long way up and a long way off. Snatch it and hold it.',
    {
      short: 'Short. You claw at the rock below it.',
      long: 'Too much. You hit the razor and it cuts you loose.',
      held: 'You stare at the razor too long. Your feet go first.',
    },
  ),
  jumphorn: first(
    'dyno',
    'dyno',
    'Jump for the horn',
    'jump',
    'A horn of quartzite halfway up the spire, and a jump to it off small feet.',
    {
      short: 'Short. The horn goes by.',
      long: 'Too much. You hit the horn and bounce off.',
      held: 'You wait too long and your feet blow.',
    },
  ),
  smearblock: first(
    'technical',
    'technical',
    'Smear onto the summit block',
    'smear',
    'Slick quartzite and nothing to hold. Smear high, press, stand.',
    {
      fall: 'Your feet skate off the summit block.',
    },
  ),

  edgearete: earned(
    'technical',
    'crimp',
    'Crimp the arête’s edge',
    'crimp the edge',
    'A sharp edge on the arête itself. Pull on it and let the feet go where they like.',
    'On the way down your hand catches a sharp edge on the arête. New beta: crimp it.',
    {
      fall: 'The arête’s edge bites your fingers and wins.',
    },
  ),
  heelrock: earned(
    'power',
    'technical',
    'Heel on the lip and rock over',
    'heel and rock over',
    'Throw a heel over the lip and roll onto it.',
    'Second time off the lip. Your heel would fit right over it. New beta: heel and rock over.',
    {
      fall: 'Your heel slides back off the lip.',
    },
  ),
  pastebump: earned(
    'dyno',
    'power',
    'Paste a foot and bump',
    'bump',
    'A foot pasted on the egg, a small bump, then the sloper.',
    'Twice off the throw. There’s a dimple for a foot halfway. New beta: paste and bump.',
    {
      hit: 'Caught it.',
      miss: 'Missed the bump.',
      fall: 'The pasted foot goes.',
    },
  ),
  toepocket: earned(
    'crimp',
    'technical',
    'Toe into a pocket and step',
    'toe and step',
    'A pocket low for a toe. Step up into it and the next pocket comes to you.',
    'Sliding off, your toe catches in a pocket. New beta: step into it.',
    {
      hit: 'Toe in.',
      miss: 'Missed the pocket.',
      fall: 'Your toe slides out of the pocket.',
    },
  ),
  laybacksplitter: earned(
    'crack',
    'power',
    'Layback the splitter',
    'layback',
    'Lean off the splitter’s edge and run your feet up the face.',
    'Off again. The splitter has an edge clean enough to lean off. New beta: layback.',
    {
      fall: 'Your feet cut and the layback swings you off.',
    },
  ),
  toehookroof: earned(
    'power',
    'technical',
    'Toe-hook the roof',
    'toe-hook',
    'A toe hooked in the roof holds you while you reach for the lip.',
    'Second time off. There’s a toe-hook in the roof right by your foot. New beta: toe-hook.',
    {
      fall: 'Your toe-hook slides out of the roof.',
    },
  ),
  heeltoe: earned(
    'power',
    'technical',
    'Heel-toe in the scoop',
    'heel-toe',
    'Heel and toe cammed in a scoop, and the last hard move is half as hard.',
    'Second time off. There’s a scoop that would take a heel and toe. New beta: cam in it.',
    {
      fall: 'The cam slips out of the scoop.',
    },
  ),
  bumprail: earned(
    'dyno',
    'power',
    'Bump through the crimp rail',
    'bump',
    'A rail halfway to the horn. Two moves, not one.',
    'Twice off the jump. There’s a rail halfway you never touched. New beta: bump through.',
    {
      hit: 'Caught it.',
      miss: 'Missed the rail.',
      fall: 'You come off the rail.',
    },
  ),
  crimpsummit: earned(
    'technical',
    'crimp',
    'Crimp the summit edge',
    'crimp the edge',
    'One edge on the summit block. Pull on it instead of trusting the smear.',
    'Coming off, your hand drags over an edge on the block. New beta: crimp it.',
    {
      fall: 'The summit edge spits you off.',
    },
  ),
};

// ---------------------------------------------------------------------------------------
// Sandstone: the Mesa. Slopers, splitters, varnish, and holds that might be next year’s talus.

const SANDSTONE: Record<string, BetaDef> = {
  keepslap: first(
    'endurance',
    'endurance',
    'Keep slapping',
    'keep slapping',
    'Ten moves of sloper to sloper. None of them are bad. All of them add up.',
    {
      fall: 'The last sloper is one too many.',
    },
  ),
  gentleflakes: first(
    'crimp',
    'crimp',
    'Pull gently on the flakes',
    'gently',
    'Thin flakes. Pull down, never out, and they’ll probably still be there.',
    {
      fall: 'You pull out, not down, and the flake has opinions.',
    },
  ),
  redsplitter: first(
    'crack',
    'crack',
    'Hand-jam the red splitter',
    'jam',
    'A splitter through red rock. Tape up, twist, trust.',
    {
      hit: 'Solid jam.',
      miss: 'Sand in the jam. It slips.',
      fall: 'Your hand slides out of the splitter.',
    },
  ),
  slapsloper: first(
    'power',
    'power',
    'Slap for the sloper',
    'slap',
    'Out the roof to a sloper that doesn’t care how strong you are.',
    {
      short: 'Short. You slap the roof under it.',
      long: 'Too much. You slap past it and slide.',
      held: 'You hang under the roof too long, and the slap has nothing in it.',
    },
  ),
  launch: first(
    'dyno',
    'dyno',
    'Launch for the hueco',
    'launch',
    'A hueco a long way off, further than it looks, and it looks far.',
    {
      short: 'Short. Fingertips in the hueco, then out.',
      long: 'Too much. You hit the back of the hueco and rebound.',
      held: 'You crouch so long your feet slide off the sandstone.',
    },
  ),
  crimpvarnish: first(
    'crimp',
    'crimp',
    'Crimp the varnish',
    'varnish crimps',
    'Black varnish crimps, hard and sharp, and further apart than they should be.',
    {
      fall: 'A varnish crimp rolls out of your fingers.',
    },
  ),
  pinchrail: first(
    'crimp',
    'power',
    'Pinch the varnish rail',
    'pinch the rail',
    'A rail of varnish to pinch and walk. Thumbs do the work.',
    {
      fall: 'Your thumb gives out on the rail.',
    },
  ),
  smearred: first(
    'technical',
    'technical',
    'Smear the red slab',
    'smear',
    'Gritty sandstone and good friction, as long as nobody brushed it yesterday.',
    {
      fall: 'Sand under your toe, and you’re off.',
    },
  ),
  jughaul: first(
    'endurance',
    'endurance',
    'Haul the jugs and keep going',
    'keep going',
    'Big holds, a long way. It isn’t hard. It is long.',
    {
      fall: 'Your arms are done before the headwall is.',
    },
  ),
  roundedges: first(
    'crimp',
    'crimp',
    'Crimp the rounded edges',
    'rounded edges',
    'Edges worn round by wind. Crimp them flat, and keep your feet on.',
    {
      fall: 'The rounded edge rolls under your fingers.',
    },
  ),
  compress: first(
    'technical',
    'power',
    'Compress the bulge',
    'compress',
    'Squeeze the bulge between hands and feet, and inch up it.',
    {
      fall: 'The squeeze lets go, all at once.',
    },
  ),
  throwlip: first(
    'power',
    'power',
    'Throw for the rounded lip',
    'throw',
    'A rounded lip that takes a throw and a lot of faith.',
    {
      short: 'Short. You paw at the lip.',
      long: 'Too much. You slap over the lip and slide back.',
      held: 'You wait too long; the lip rounds off further.',
    },
  ),
  softcrack: first(
    'crack',
    'crack',
    'Finger-lock the soft crack',
    'finger-lock',
    'A thin crack in soft rock. Lock gently; it holds if you did.',
    {
      hit: 'Locked.',
      miss: 'The lock grinds sand.',
      fall: 'The lock crumbles out.',
    },
  ),
  padup: first(
    'technical',
    'technical',
    'Pad up the runout',
    'pad up',
    'Palms and smears on a blank face, a long way from the last piece.',
    {
      fall: 'Your palms slide on the grit.',
    },
  ),

  smearstep: earned(
    'crimp',
    'technical',
    'Smear and step past',
    'step past',
    'A smear you can stand on, and the bad flake becomes a hand you don’t need.',
    'Off again, you see a smear you could step past on. New beta: step past.',
    {
      hit: 'Good step.',
      miss: 'Missed the smear.',
      fall: 'Your foot skates off the smear.',
    },
  ),
  rockscoop: earned(
    'crimp',
    'technical',
    'Rock onto the scoop',
    'rock onto the scoop',
    'A scoop for your foot, and a rock-over that takes your fingers out of it.',
    'You fall past a scoop that would take a foot. New beta: rock onto it.',
    {
      hit: 'Good foot.',
      miss: 'Missed the scoop.',
      fall: 'Your foot skates out of the scoop.',
    },
  ),
  edgevarnish: earned(
    'technical',
    'crimp',
    'Edge the varnish',
    'edge the varnish',
    'A strip of varnish runs through it. Less balance, more fingers.',
    'Coming off, your hand finds varnish you hadn’t seen. New beta: edge it.',
    {
      fall: 'The varnish edge spits you off.',
    },
  ),
  ironstone: earned(
    'technical',
    'crimp',
    'Pull on the ironstone',
    'ironstone',
    'A knob of ironstone, harder than the sandstone round it. Pull on it.',
    'On the way down your hand grabs a knob of ironstone. New beta: pull on it.',
    {
      fall: 'The ironstone knob holds; your fingers don’t.',
    },
  ),
  heelsloper: earned(
    'power',
    'technical',
    'Heel-hook the sloper',
    'heel-hook',
    'A heel on the sloper takes the weight off your arms.',
    'Second time off. The sloper would take a heel. New beta: heel-hook.',
    {
      fall: 'Your heel slides off the sloper.',
    },
  ),
  toehooklip: earned(
    'power',
    'technical',
    'Toe-hook over the lip',
    'toe-hook',
    'A toe over the lip holds you in while you reach.',
    'Second time off. There’s a toe-hook over the lip. New beta: toe-hook.',
    {
      fall: 'Your toe slides off the lip.',
    },
  ),
  laybacksplitter: earned(
    'crack',
    'power',
    'Layback the crack',
    'layback',
    'Lean off the crack’s edge and walk your feet up the red rock.',
    'Off again. The crack has an edge to lean off. New beta: layback.',
    {
      fall: 'Your feet cut and you swing off.',
    },
  ),
  shakevarnish: earned(
    'endurance',
    'technical',
    'Shake on the varnish jug',
    'shake out',
    'One good jug of varnish halfway. Shake each arm, then go.',
    'You come off beside a jug of varnish. New beta: shake out there.',
    {
      hit: 'Good shake.',
      miss: 'Rushed it.',
      fall: 'Pumped off anyway.',
    },
  ),
  stemshake: earned(
    'endurance',
    'technical',
    'Stem the scoop and shake',
    'stem and shake',
    'Bridge across a scoop, take your hands off, and get them back.',
    'Off again, you see the scoop you could stem. New beta: stem and shake.',
    {
      hit: 'Good shake.',
      miss: 'Rushed it.',
      fall: 'Your feet skid out of the stem.',
    },
  ),
  bumphueco: earned(
    'dyno',
    'power',
    'Bump through the hueco',
    'bump',
    'A small hueco halfway. Two moves instead of one big one.',
    'Twice off the launch. There’s a hueco halfway. New beta: bump through.',
    {
      hit: 'Caught it.',
      miss: 'Missed the hueco.',
      fall: 'You come off the hueco.',
    },
  ),
};

// ---------------------------------------------------------------------------------------
// Gneiss: the Crucible. Incuts, compression, and cold rock that hits back.

const GNEISS: Record<string, BetaDef> = {
  razorgneiss: first(
    'crimp',
    'crimp',
    'Crimp the razor gneiss',
    'razor crimps',
    'Edges sharp enough to shave with, in rock cold enough that you won’t feel it.',
    {
      fall: 'The razor wins.',
    },
  ),
  vise: first(
    'crack',
    'crack',
    'Jam the vise',
    'jam',
    'A crack that closes on your hand like it means it. Let it.',
    {
      hit: 'It holds you.',
      miss: 'It spits your hand.',
      fall: 'The vise lets go of you.',
    },
  ),
  ghost: first(
    'power',
    'power',
    'Throw blind for the ghost hold',
    'throw blind',
    'You can’t see it from here. You know where it is. Throw.',
    {
      short: 'Short. You find it a hand too low.',
      long: 'Too much. You hit it and keep going.',
      held: 'You wait to see it. You don’t.',
    },
  ),
  strike: first(
    'power',
    'power',
    'Strike for the incut',
    'strike',
    'A big move to an incut that hits back. Hit it first.',
    {
      short: 'Short. The incut stays out of reach.',
      long: 'Too much. You catch it and it throws you.',
      held: 'You load too long, and the strike has nothing in it.',
    },
  ),
  commit: first(
    'dyno',
    'dyno',
    'Commit to the jump',
    'commit',
    'Past here there’s no down-climbing. The jump is the only way off.',
    {
      short: 'Short. And there is no way back.',
      long: 'Too much. You fly past the hold.',
      held: 'You hesitate past the point of no return.',
    },
  ),
  flyedge: first(
    'dyno',
    'dyno',
    'Fly for the flat edge',
    'fly',
    'Full extension from the undercut, to an edge nobody has held.',
    {
      short: 'Short. Fingertips, and then nothing.',
      long: 'Too much. You pass the edge at full stretch.',
      held: 'You stay coiled in the undercut too long, and uncoil off it.',
    },
  ),
  gneissrail: first(
    'dyno',
    'dyno',
    'Dyno off the gneiss rail',
    'dyno',
    'A rail to set up on, and a dyno to a jug. The warm-up, they say.',
    {
      short: 'Short. The jug goes by.',
      long: 'Too much. You hit the jug and swing off.',
      held: 'You hang on the rail too long to go anywhere.',
    },
  ),
  coldincuts: first(
    'crimp',
    'crimp',
    'Crimp the cold incuts',
    'cold incuts',
    'Incuts, which is good, at altitude, which isn’t.',
    {
      fall: 'Your cold fingers open.',
    },
  ),
  seampull: first(
    'crimp',
    'crimp',
    'Pull on the seam',
    'pull the seam',
    'One thin seam all the way. Fingertips in it, and nothing either side.',
    {
      fall: 'Your fingertips slide out of the seam.',
    },
  ),
  smeargneiss: first(
    'technical',
    'technical',
    'Smear the blank gneiss',
    'smear',
    'Dark, smooth rock with nothing for your feet but trust.',
    {
      fall: 'Your feet skate off the gneiss.',
    },
  ),
  together: first(
    'endurance',
    'endurance',
    'Keep it together',
    'keep it together',
    'Thirty-six moves with nowhere to hide. Breathe on the clips.',
    {
      fall: 'It comes apart, a long way up.',
    },
  ),
  cutroof: first(
    'power',
    'power',
    'Cut loose under the roof',
    'cut loose',
    'Feet off, swing, and catch the last hold before the lip.',
    {
      short: 'Short. The swing goes under the hold.',
      long: 'Too much. You catch it and the swing peels you.',
      held: 'You hang under the roof until there’s nothing to swing with.',
    },
  ),

  thumbstep: earned(
    'crimp',
    'technical',
    'Thumb-catch and step',
    'thumb and step',
    'Thumb over the incut, a high step, and the next edge comes closer.',
    'You fall past a step you never looked at. New beta: thumb-catch and step.',
    {
      hit: 'Good step.',
      miss: 'Missed it.',
      fall: 'Your foot skates off the step.',
    },
  ),
  rockincut: earned(
    'crimp',
    'technical',
    'Rock over the incut',
    'rock over',
    'A high foot on the incut takes the weight off your fingers.',
    'Coming off, you see the incut would take a foot. New beta: rock over it.',
    {
      hit: 'Good foot.',
      miss: 'Missed the foot.',
      fall: 'Your foot slides off the incut.',
    },
  ),
  laybackvise: earned(
    'crack',
    'power',
    'Layback out of the vise',
    'layback',
    'Lean off the crack’s edge and let the vise have someone else.',
    'Off again, you see the edge you could lean off. New beta: layback.',
    {
      fall: 'Your feet cut and you swing off.',
    },
  ),
  toehooksee: earned(
    'power',
    'technical',
    'Toe-hook to see it',
    'toe-hook',
    'A toe-hook lets you lean out far enough to see the ghost hold.',
    'Second time off. A toe-hook would let you lean out and look. New beta: toe-hook.',
    {
      fall: 'Your toe slides out of the hook.',
    },
  ),
  squeezeblock: earned(
    'power',
    'power',
    'Squeeze the block',
    'squeeze',
    'Hands and heels on opposite edges, and squeeze your way up it.',
    'Second time off. There’s an edge on the far side to squeeze against. New beta: compress.',
    {
      fall: 'The squeeze lets go.',
    },
  ),
  bumpundercut: earned(
    'dyno',
    'power',
    'Bump through the incut',
    'bump',
    'An incut halfway. Two moves instead of one big one.',
    'Twice off. There’s an incut halfway you never touched. New beta: bump through.',
    {
      hit: 'Caught it.',
      miss: 'Missed the incut.',
      fall: 'You come off the incut.',
    },
  ),
  doubleclutch: earned(
    'dyno',
    'power',
    'Double-clutch the edge',
    'double-clutch',
    'Hit the edge, let go, and catch it again where it holds.',
    'Twice off. You touched the edge both times; you just didn’t catch it twice. New beta: double-clutch.',
    {
      hit: 'Caught it.',
      miss: 'Missed the second clutch.',
      fall: 'The edge slips out of your second clutch.',
    },
  ),
  crimpcrystal: earned(
    'technical',
    'crimp',
    'Crimp a crystal',
    'crimp a crystal',
    'A crystal in the gneiss, the only hold for a body length.',
    'On the way down your hand catches a crystal. New beta: crimp it.',
    {
      fall: 'The crystal snaps.',
    },
  ),
  shakeincut: earned(
    'endurance',
    'technical',
    'Shake on the incut',
    'shake out',
    'One incut deep enough to hang. Shake each arm, then go.',
    'You come off beside an incut you could hang off. New beta: shake there.',
    {
      hit: 'Good shake.',
      miss: 'Rushed it.',
      fall: 'Pumped off anyway.',
    },
  ),
};

// ---------------------------------------------------------------------------------------
// Limestone: the Cove and Miller’s Bluff. Tufas, pockets, and kneebars that almost count.

const LIMESTONE: Record<string, BetaDef> = {
  waterline: first(
    'endurance',
    'endurance',
    'Traverse the waterline',
    'traverse',
    'Sideways a foot above the swell, on pockets the sea polished.',
    {
      fall: 'Your arms go, and the sea takes you.',
    },
  ),
  saltjug: first(
    'dyno',
    'dyno',
    'Launch for the salty jug',
    'launch',
    'Climb up, jump for the jug, and if you miss, that’s the name.',
    {
      short: 'Short. Splash.',
      long: 'Too much. You hit the jug and peel into the water.',
      held: 'You wait too long; the salt on your feet decides.',
    },
  ),
  smearsalt: first(
    'technical',
    'technical',
    'Smear the salt',
    'smear',
    'Salt on every foothold. Smear anyway.',
    {
      fall: 'Your feet slide on the salt.',
    },
  ),
  barnacles: first(
    'crimp',
    'crimp',
    'Crimp past the barnacles',
    'crimp',
    'The crimps are fine. The barnacles on them are not.',
    {
      fall: 'A barnacle bites and your fingers open.',
    },
  ),
  leapgap: first(
    'dyno',
    'dyno',
    'Leap the gap',
    'leap',
    'A gap you’d walk round on land, thirty feet over the sea.',
    {
      short: 'Short. A long way down to the water.',
      long: 'Too much. You hit the far side and slide off it.',
      held: 'You stare at the gap too long. The gap wins.',
    },
  ),
  catchtufa: first(
    'power',
    'power',
    'Cut loose and catch the tufa',
    'catch the tufa',
    'Feet off under the roof, swing, and catch the tufa as the swell comes in.',
    {
      short: 'Short. The tufa goes by.',
      long: 'Too much. You catch it and the swing peels you off.',
      held: 'You hang too long, and the sea gets impatient.',
    },
  ),
  limearete: first(
    'technical',
    'technical',
    'Layaway the arête',
    'layaway',
    'Lean off the cove’s tall arête, feet on salt-pocked limestone.',
    {
      fall: 'The layaway barn-doors you into the sea.',
    },
  ),
  greyedges: first(
    'crimp',
    'crimp',
    'Crimp the grey edges',
    'grey edges',
    'Grey limestone edges nobody has pulled on. Some of them will be there tomorrow.',
    {
      fall: 'An edge you trusted turns out to be loose.',
    },
  ),
  greyslab: first(
    'technical',
    'technical',
    'Smear the grey slab',
    'smear',
    'Rough grey limestone, and better friction than it looks.',
    {
      fall: 'Your feet slip on the slab.',
    },
  ),
  bridgegroove: first(
    'technical',
    'technical',
    'Bridge the groove',
    'bridge',
    'A foot on each side of the groove, and walk it up.',
    {
      fall: 'The bridge collapses.',
    },
  ),
  pullean: first(
    'power',
    'power',
    'Pull through the lean',
    'pull through',
    'The groove leans out at the top. Pull through it before it pulls you off.',
    {
      short: 'Short. You don’t get round the lean.',
      long: 'Too much. You overpull and swing off.',
      held: 'You hang in the lean too long.',
    },
  ),
  crimppillar: first(
    'crimp',
    'crimp',
    'Crimp up the pillar',
    'crimp',
    'Small edges up the face of the pillar, sharp on both sides.',
    {
      fall: 'An edge on the pillar spits you off.',
    },
  ),
  pillararete: first(
    'technical',
    'technical',
    'Slap the pillar’s arête',
    'slap the arête',
    'Both hands on the pillar’s edge, feet on the face, and lean.',
    {
      fall: 'You barn-door off the pillar.',
    },
  ),
  swingroof: first(
    'power',
    'power',
    'Swing out the roof',
    'swing out',
    'Fifteen feet of roof, sideways, jug to jug with your feet off.',
    {
      short: 'Short. The next jug stays out of reach.',
      long: 'Too much. The swing tears you off.',
      held: 'You hang under the roof too long to swing at all.',
    },
  ),
  throwlimelip: first(
    'dyno',
    'dyno',
    'Throw for the lip',
    'throw',
    'Out of the roof and a throw to the lip, with nothing to lose but the swing.',
    {
      short: 'Short. The lip goes by.',
      long: 'Too much. You catch it and peel.',
      held: 'You wind up so long the roof wins.',
    },
  ),
  hiddenedges: first(
    'crimp',
    'crimp',
    'Crimp the hidden edges',
    'hidden edges',
    'Blank from the field, holds when you’re on it. Find them by feel.',
    {
      fall: 'You reach for an edge that isn’t there.',
    },
  ),
  tufaline: first(
    'endurance',
    'endurance',
    'Pinch the tufas to the top',
    'pinch the tufas',
    'Tufa after tufa, pinch and step. None of them are hard. All of them add up.',
    {
      fall: 'Your forearms give out on the last tufa.',
    },
  ),
  rockbale: first(
    'technical',
    'technical',
    'Rock onto the bale',
    'rock onto it',
    'A high foot on the edge of the block and a press onto the top.',
    {
      fall: 'You press, you wobble, you sit back down in the field.',
    },
  ),
  crimprim: first(
    'crimp',
    'crimp',
    'Crimp along the rim',
    'crimp the rim',
    'Small, sharp edges along a leaning rim beside the trough.',
    {
      fall: 'The rim’s edges spit you into the field.',
    },
  ),
  silojump: first(
    'dyno',
    'dyno',
    'Jump between the two holds',
    'jump',
    'Two good holds a long way apart, and one jump between them.',
    {
      short: 'Short. The second hold stays a long way off.',
      long: 'Too much. You hit it and keep going.',
      held: 'You stay on the first hold too long to reach the second.',
    },
  ),

  kneeshake: earned(
    'endurance',
    'technical',
    'Kneebar and shake',
    'kneebar',
    'A knee jammed under a tufa, hands off, and shake them out.',
    'You come off beside a slot that would take a knee. New beta: kneebar and shake.',
    {
      hit: 'Knee in.',
      miss: 'Your knee slips.',
      fall: 'The kneebar holds; you don’t.',
    },
  ),
  twofinger: earned(
    'technical',
    'crimp',
    'Two-finger the pocket',
    'two-finger',
    'A pocket for two fingers. Pull on it instead of trusting your feet.',
    'On the way down your fingers catch a pocket. New beta: two-finger it.',
    {
      fall: 'Your fingers slide out of the pocket.',
    },
  ),
  bumptufa: earned(
    'dyno',
    'power',
    'Bump off the tufa',
    'bump',
    'A tufa halfway. Two moves instead of one big one.',
    'Twice off. There’s a tufa halfway you never touched. New beta: bump.',
    {
      hit: 'Caught it.',
      miss: 'Missed the tufa.',
      fall: 'You come off the tufa.',
    },
  ),
  kneeroof: earned(
    'power',
    'technical',
    'Kneebar the roof',
    'kneebar',
    'A knee under the roof holds you while you reach.',
    'Second time off. There’s a kneebar in the roof. New beta: kneebar.',
    {
      fall: 'The kneebar slips out.',
    },
  ),
  pincharete: earned(
    'technical',
    'crimp',
    'Pinch the arête’s pockets',
    'pinch the pockets',
    'Pockets along the arête itself, to pinch and pull.',
    'Coming off, your hand drags over pockets on the arête. New beta: pinch them.',
    {
      fall: 'Your fingers slide out of the pockets.',
    },
  ),
  steppocket: earned(
    'crimp',
    'technical',
    'Step onto the pocket',
    'step up',
    'A pocket for your toe, and the next edge comes to you.',
    'You fall past a pocket that would take a toe. New beta: step onto it.',
    {
      hit: 'Good foot.',
      miss: 'Missed the pocket.',
      fall: 'Your toe slides out of the pocket.',
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

  // Golden Buttress, at the Big Stone.
  goldenpad: first(
    'technical',
    'technical',
    'Trust the gold',
    'trust it',
    'The gold patina grips better than it looks. Weight your toes and don’t look down.',
    {
      fall: 'You stop trusting it for a second, and so do your feet.',
    },
  ),
  ripple: earned(
    'technical',
    'crimp',
    'Pinch the ripple',
    'ripple',
    'A ripple in the slab, just big enough to pinch. It takes enough weight off your feet.',
    'Back on the rope, you see a ripple in the slab at your shoulder. New beta: pinch the ripple.',
    {
      fall: 'The ripple slips through your fingers.',
    },
  ),
  stemcorner: first(
    'endurance',
    'technical',
    'Stem the corner',
    'stem',
    'A foot on each wall, and walk it up. Your legs do the work, until the corner closes.',
    {
      fall: 'The corner closes, your stem goes, and so do you.',
    },
  ),
  cornerlayback: earned(
    'endurance',
    'endurance',
    'Layback the corner’s edge',
    'layback the edge',
    'Where it closes, grab the edge of the crack in the back, lean off it and run your feet up.',
    'Off where it closes. The crack in the back has an edge to lean on. New beta: layback the edge.',
    {
      hit: 'Feet set.',
      miss: 'Your feet skid.',
      fall: 'You barn-door out of the corner.',
    },
  ),
  goldcrimps: first(
    'crimp',
    'crimp',
    'Crimp the gold',
    'crimp',
    'Rounded little crimps, the gold rubbed off them by everyone before you. Squeeze.',
    {
      fall: 'A polished crimp slides out from under your fingers.',
    },
  ),
  goldside: earned(
    'crimp',
    'technical',
    'Sidepull and step through',
    'sidepull',
    'Turn the crimps into sidepulls and step your feet through. Less squeeze, more lean.',
    'Off the crimps. They’re sidepulls, if you turn your hips. New beta: sidepull and step through.',
    {
      hit: 'Hips in.',
      miss: 'Your hip swings out.',
      fall: 'The sidepull lets go as you step through.',
    },
  ),
  bulgeslap: first(
    'power',
    'power',
    'Slap over the bulge',
    'slap',
    'Feet high under the bulge, and slap blind for whatever’s over it.',
    {
      short: 'Short. Your hand slides back down the bulge.',
      long: 'Too much. You slap past the hold, and the bulge pushes you off.',
      held: 'You crouch under the bulge too long, and your feet go.',
    },
  ),
  bulgehip: earned(
    'power',
    'technical',
    'Hips into the bulge',
    'hips in',
    'Get your hips up against the bulge and press. It’s a mantel, not a pull.',
    'Twice off the bulge. It wants a press, not a pull. New beta: hips in.',
    {
      fall: 'You press, and your hips slide back off the bulge.',
    },
  ),
  twincracks: first(
    'endurance',
    'crack',
    'A hand in each crack',
    'twin cracks',
    'Two thin cracks side by side. A hand in each, and your feet where they can go.',
    {
      fall: 'Your fingers come out of both cracks at once.',
    },
  ),
  switchcracks: earned(
    'endurance',
    'crack',
    'Switch cracks',
    'switch',
    'The left crack keeps going where the right one closes. Step across at the right moment.',
    'Off the cracks, you see the left one keeps going where the right one doesn’t. New beta: switch cracks.',
    {
      hit: 'Across.',
      miss: 'Too early.',
      fall: 'You step across, and the new crack spits your foot.',
    },
  ),

  // Obsidian Tower.
  dihedral: first(
    'crimp',
    'crimp',
    'Crimp up the dihedral',
    'crimp the corner',
    'The dihedral’s too slick to stem, and the edges are all on its right wall.',
    {
      fall: 'Your feet slide down the slick left wall, and your crimps follow.',
    },
  ),
  dimple: earned(
    'crimp',
    'technical',
    'Stem off the dimple',
    'stem the dimple',
    'One dimple on the left wall, the only one. Get a toe on it and the crimps get easier.',
    'Sliding off the dihedral, you see a dimple on the left wall. New beta: stem off the dimple.',
    {
      hit: 'Toe on it.',
      miss: 'Missed the dimple.',
      fall: 'The dimple’s too smooth for your toe.',
    },
  ),
  glass: first(
    'technical',
    'technical',
    'Smear the glass',
    'smear the glass',
    'Black, and polished smooth. You can’t stand on it. You can stand on the friction.',
    {
      fall: 'Your feet go out from under you all at once.',
    },
  ),
  glassseam: earned(
    'technical',
    'technical',
    'Toe the seam',
    'toe the seam',
    'A seam runs up the slab, hairline. Your toe fits it, and nothing else does.',
    'Off the glass, you see a seam you took for a scratch. New beta: toe the seam.',
    {
      fall: 'Your toe pops out of the seam.',
    },
  ),
  swingout: first(
    'power',
    'power',
    'Swing out the roof',
    'swing out',
    'Big holds, a huge roof, and a swing when your feet cut that you have to hold.',
    {
      short: 'Short. You reach for the lip and swing back under the roof.',
      long: 'Too much. The swing takes you off the lip.',
      held: 'You hang under the roof working out the swing, and your arms quit.',
    },
  ),
  roofjam: earned(
    'power',
    'crack',
    'Jam the roof crack',
    'roof jam',
    'A crack splits the roof. Jam it upside down, and the swing never comes.',
    'Twice off the roof. There’s a crack in it you could jam. New beta: jam the roof crack.',
    {
      fall: 'Your jam twists out, and you swing.',
    },
  ),
  leapflake: first(
    'dyno',
    'dyno',
    'Leap for the flake',
    'leap',
    'A flake far above, nothing in between, and two good footholds to launch off.',
    {
      short: 'Short. Your fingers brush the flake.',
      long: 'Too much. You hit the flake and bounce off it.',
      held: 'You crouch on the footholds too long, and your legs go flat.',
    },
  ),
  pebble: earned(
    'dyno',
    'power',
    'Tag the pebble',
    'tag',
    'A pebble halfway. Tag it, and the leap’s two jumps.',
    'Twice off the leap. There’s a pebble halfway you could tag. New beta: tag the pebble.',
    {
      hit: 'Tagged.',
      miss: 'Missed the pebble.',
      fall: 'You tag the pebble, and it doesn’t hold you.',
    },
  ),
  shuffle: first(
    'endurance',
    'endurance',
    'Shuffle up the crack',
    'shuffle',
    'A long crack, steeper than it looks. Hand jams, no rests, and the pump starts early.',
    {
      fall: 'The pump wins. Your jam slides out.',
    },
  ),
  thumbsdown: earned(
    'endurance',
    'crack',
    'Thumbs-down jams',
    'thumbs down',
    'Turn your thumbs down, and the jams lock. Less squeeze, longer arms.',
    'Off again, you remember the thumb-down jam. New beta: thumbs down.',
    {
      hit: 'Locked.',
      miss: 'The jam won’t turn.',
      fall: 'The thumb-down jam rolls out.',
    },
  ),
  crimpacross: first(
    'crimp',
    'crimp',
    'Crimp across',
    'across',
    'Sharp edges going sideways, your feet smearing below them. Keep your weight on your toes.',
    {
      fall: 'Your feet swing out from under the crimps.',
    },
  ),
  crossthrough: earned(
    'crimp',
    'endurance',
    'Cross through',
    'cross through',
    'Cross your hands instead of matching, and the traverse is half as many moves.',
    'Off the traverse. You were matching on every edge. New beta: cross through.',
    {
      hit: 'Crossed.',
      miss: 'Your hand misses the edge.',
      fall: 'You cross through, and your feet cut.',
    },
  ),
  keepmoving: first(
    'endurance',
    'endurance',
    'Don’t stop',
    'don’t stop',
    'Good edges, a long way of them. Don’t stop, or you’ll never start again.',
    {
      fall: 'You stop for one breath, and the pump catches up.',
    },
  ),
  outrightjug: earned(
    'endurance',
    'endurance',
    'Go and get the jug',
    'jug',
    'One jug out right, half a body length off the line. Go and get it, and shake.',
    'Off the headwall, you see a jug out right. New beta: go and get the jug.',
    {
      hit: 'Jug.',
      miss: 'Missed the jug.',
      fall: 'You reach the jug too pumped to hold it.',
    },
  ),

  // The Ascendant.
  backfoot: first(
    'endurance',
    'technical',
    'Back and foot',
    'back and foot',
    'Back on one wall, feet on the other, and shuffle. It’s slow, and it doesn’t stop.',
    {
      fall: 'You shuffle too far, and the chimney lets go of your back.',
    },
  ),
  stackfeet: earned(
    'endurance',
    'technical',
    'Stack your feet',
    'stack feet',
    'Where it flares, turn your feet across it: heel on one wall, toe on the other.',
    'Off where it flares, you remember heel-toe. New beta: stack your feet.',
    {
      hit: 'Wedged.',
      miss: 'Your heel slides.',
      fall: 'The heel-toe slips out of the flare.',
    },
  ),
  seam: first(
    'crimp',
    'crimp',
    'Crimp the hairline',
    'crimp the hairline',
    'A crack too thin for fingers. Crimp its edges and stand on nothing.',
    {
      fall: 'Your fingers pull out of the seam.',
    },
  ),
  pinscar: earned(
    'crimp',
    'crack',
    'The pin scar',
    'pin scar',
    'An old pin scar where the seam widens. One finger in it, and you can move.',
    'Off the seam, you see where someone hammered a pin once. New beta: the pin scar.',
    {
      hit: 'Finger in.',
      miss: 'Your finger misses the scar.',
      fall: 'You get the finger in, and it isn’t enough.',
    },
  ),
  standup: first(
    'technical',
    'technical',
    'Stand up on nothing',
    'stand up',
    'A slab so smooth it shines. Every move is a stand-up, and none of them are on anything.',
    {
      fall: 'You stand up, and you slide down.',
    },
  ),
  palms: earned(
    'technical',
    'technical',
    'Palm and press',
    'palm',
    'Flat hands on the slab, and press down. Your palms are footholds too.',
    'Off the mirror, you notice your hands were doing nothing. New beta: palm and press.',
    {
      fall: 'Your palms skate.',
    },
  ),
  throwlip: first(
    'power',
    'power',
    'Throw off the roof crack',
    'throw',
    'Out along the roof, feet in a crack, and one throw for the lip when the crack runs out.',
    {
      short: 'Short. Your hand touches the lip, and the roof drops you.',
      long: 'Too much. You hit the lip too hard to hold.',
      held: 'You hang under the roof winding up, and your fingers open.',
    },
  ),
  roofcrackfeet: earned(
    'power',
    'crack',
    'Toes in the roof crack',
    'toes in',
    'Keep your toes in the roof crack right to the lip, and the throw’s a reach.',
    'Twice off the roof. Your feet came out too soon. New beta: toes in the roof crack.',
    {
      fall: 'Your toes pull out of the crack.',
    },
  ),
  faith: first(
    'dyno',
    'dyno',
    'Leap of faith',
    'leap of faith',
    'A blind jump for a hold you’ve only seen from the belay. You have to believe it’s there.',
    {
      short: 'Short. It’s there; you aren’t.',
      long: 'Too much. You fly past it.',
      held: 'You crouch, you doubt, and your feet go.',
    },
  ),
  lookfirst: earned(
    'dyno',
    'dyno',
    'Look first',
    'look',
    'Lean out and look before you go. It’s further left than it seemed.',
    'Twice off. From the rope you see the hold’s further left. New beta: look first.',
    {
      hit: 'Seen.',
      miss: 'It’s not where you thought.',
      fall: 'You see it, you jump, and it’s still too far.',
    },
  ),
  barely: first(
    'crimp',
    'crimp',
    'Crimp what barely counts',
    'crimp across',
    'Three moves sideways on edges that barely count, with the whole wall under your heels.',
    {
      fall: 'An edge that barely counts stops counting.',
    },
  ),
  handfoot: earned(
    'crimp',
    'technical',
    'Hand-foot match',
    'hand-foot',
    'Bring your foot up to the edge your hand’s on, and stand on it. The only way across.',
    'Off the crux, you see the edge is a foot too. New beta: hand-foot match.',
    {
      hit: 'Matched.',
      miss: 'Your foot misses the edge.',
      fall: 'You match, and your hand peels off.',
    },
  ),
  fingercrack: first(
    'endurance',
    'crack',
    'Fingers up the headwall',
    'finger crack',
    'A finger crack up the middle of the headwall, and pitches of air under you.',
    {
      fall: 'Your fingers twist out of the crack.',
    },
  ),
  pods: earned(
    'endurance',
    'technical',
    'Toe into the pods',
    'pods',
    'The crack pods out in places, wide enough for your toes. Use them.',
    'Off again, you see the pods are footholds. New beta: toe into the pods.',
    {
      hit: 'Toe in.',
      miss: 'The pod’s too shallow.',
      fall: 'Your toe skates out of the pod.',
    },
  ),
  pullover: first(
    'power',
    'power',
    'Pull over the block',
    'pull over',
    'A block on top of everything. Hands on its top edge, and pull.',
    {
      short: 'Short. The edge is still above you.',
      long: 'Too much. You pull past the edge and lose it.',
      held: 'You hang off the block too long, and your arms empty.',
    },
  ),
  mantelblock: earned(
    'power',
    'technical',
    'Mantel the block',
    'mantel',
    'Palms flat on top, and press. Down, not up.',
    'Twice off the block. It’s a mantel. New beta: mantel the block.',
    {
      fall: 'You press out, and your elbow buckles.',
    },
  ),
};

// ---------------------------------------------------------------------------------------
// The highballs' top-outs (Phase 27.5), each in its rock: a granite mantel, a quartzite
// sloper, a sandstone top gone to sand, a cold gneiss lip, a limestone top under the grass.
// They stand in for LIBRARY's technical pair (routes.ts's topOut).

const TOP_OUTS: Record<Rock, Record<string, BetaDef>> = {
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
    shelf: first(
      'technical',
      'endurance',
      'Belly onto the shelf',
      'belly on',
      'No style to it: get your chest on the shelf and wriggle.',
      {
        fall: 'You wriggle, and slide back off the shelf.',
      },
    ),
    shelffoot: earned(
      'technical',
      'technical',
      'Foot on the shelf first',
      'foot first',
      'Get a foot up on the shelf before your hands, and stand.',
      'Off the shelf. Your foot reaches it before your chest does. New beta: foot on the shelf first.',
      {
        fall: 'Your foot slides off the shelf’s edge.',
      },
    ),
    jamout: first(
      'technical',
      'crack',
      'Jam out the top of the crack',
      'jam out',
      'The crack runs right over the lip. Jam it to the end, then let go of it for the top.',
      {
        fall: 'The last jam pulls out where the crack flares.',
      },
    ),
    crackrock: earned(
      'technical',
      'technical',
      'Rock over the crack’s lip',
      'rock over',
      'A high foot in the crack and a rock-over, and you’re standing on top.',
      'Off again at the top. Your foot fits the crack right at the lip. New beta: rock over.',
      {
        fall: 'You rock over, and your foot pops out of the crack.',
      },
    ),
    squirm: first(
      'technical',
      'endurance',
      'Squirm out the top',
      'squirm',
      'The offwidth spits you out onto the top. It isn’t pretty, and it doesn’t need to be.',
      {
        fall: 'You squirm out, and the top’s too rounded to hold you.',
      },
    ),
    lipwing: earned(
      'technical',
      'crack',
      'Chicken-wing the lip',
      'chicken-wing',
      'Fold an arm into the last of the crack, and lever up onto the top.',
      'Off the top. There’s room in the crack for an arm, right at the lip. New beta: chicken-wing the lip.',
      {
        fall: 'The chicken-wing slides out of the crack.',
      },
    ),
    coldlip: first(
      'technical',
      'technical',
      'Mantel the cold lip',
      'cold mantel',
      'The lip’s in the wind and colder than the rest. Press it out before your hands go numb.',
      {
        fall: 'Your numb palms slip off the lip.',
      },
    ),
    lipcrystal: earned(
      'technical',
      'crimp',
      'Pinch the lip crystal',
      'crystal',
      'One crystal on the lip. Pinch it, and pull your feet up under you.',
      'Off the top. There’s a crystal on the lip you could pinch. New beta: pinch the lip crystal.',
      {
        fall: 'The crystal turns in your fingers.',
      },
    ),
  },
  quartzite: {
    hugtop: first(
      'technical',
      'technical',
      'Ride the arête over',
      'ride it over',
      'The arête rounds off into the top. Lean over it, and walk your feet up behind you.',
      {
        fall: 'Your hug slides off the rounded arête.',
      },
    ),
    aretemantel: earned(
      'technical',
      'technical',
      'Mantel where it flattens',
      'mantel',
      'Where the arête flattens, get a palm on it and press.',
      'Off the top. The arête flattens enough to mantel. New beta: mantel where it flattens.',
      {
        fall: 'Your palm slides on the flat.',
      },
    ),
    pressit: first(
      'technical',
      'power',
      'Press it out',
      'press out',
      'The mantel. Palms flat, one elbow over, and press like you mean it.',
      {
        fall: 'You press, and your palms slide off the sloping top.',
      },
    ),
    kneetop: earned(
      'technical',
      'technical',
      'Knee onto the top',
      'knee',
      'Not elegant: a knee on the top, then a foot.',
      'Off the mantel, you think: a knee. New beta: knee onto the top.',
      {
        fall: 'Your knee skates on the sloper.',
      },
    ),
    summithueco: first(
      'technical',
      'power',
      'Pull into the summit hueco',
      'summit hueco',
      'A hueco right on top, big enough for both hands. Get there, and pull.',
      {
        fall: 'You reach the hueco a move too late.',
      },
    ),
    stepin: earned(
      'technical',
      'technical',
      'Step into the hueco',
      'step in',
      'Pull your feet up into the hueco you were holding, and stand in it.',
      'Off the top, you see the hueco’s a foothold too. New beta: step into the hueco.',
      {
        fall: 'Your foot slips out of the hueco’s lip.',
      },
    ),
    liebackend: first(
      'technical',
      'crack',
      'Lieback the splitter’s end',
      'lieback',
      'The splitter ends at the lip. Lean off it for the last moves.',
      {
        fall: 'You lean, and your feet skid on the clean quartzite.',
      },
    ),
    topjug: earned(
      'technical',
      'power',
      'Find the jug on top',
      'top jug',
      'There’s a jug over the top, well back, if you go up and look for it.',
      'Off the top. Someone walking past says there’s a jug over the lip. New beta: find the jug on top.',
      {
        fall: 'You reach for the jug, and it’s further back than you thought.',
      },
    ),
    rollon: first(
      'technical',
      'technical',
      'Roll onto the slab top',
      'roll on',
      'The top is a sloping slab. Roll onto it on your belly, and stand when it lets you.',
      {
        fall: 'You roll on, and the slab rolls you back off.',
      },
    ),
    summitrib: earned(
      'technical',
      'crimp',
      'Pinch the summit rib',
      'rib',
      'A thin rib runs over the top. Pinch it, and walk your feet past your hands.',
      'Off the top. There’s a rib running over it. New beta: pinch the summit rib.',
      {
        fall: 'The rib’s too thin to stop you.',
      },
    ),
  },
  sandstone: {
    sandpalm: first(
      'technical',
      'technical',
      'Top out the prow',
      'top out',
      'The prow ends in rounded sandstone with sand on it. Don’t trust the sand. Trust your palms.',
      {
        fall: 'Sand under your palm, and nothing under the sand.',
      },
    ),
    whale: earned(
      'technical',
      'endurance',
      'Whale onto the top',
      'whale',
      'Belly on the rounded top, legs kicking, and drag yourself on.',
      'Off the top. It’s a belly flop, not a mantel. New beta: whale onto the top.',
      {
        fall: 'You belly onto the top, and slide back off it.',
      },
    ),
    fisttop: first(
      'technical',
      'crack',
      'Fist-jam the top of the split',
      'fist jam',
      'The split widens at the lip. Stack a fist in, and pull over.',
      {
        fall: 'The fist jam slides out of the soft sandstone.',
      },
    ),
    varnishstep: earned(
      'technical',
      'technical',
      'Stand on the varnish strip',
      'varnish strip',
      'A strip of varnish below the lip takes a toe. Stand on it, and the top comes.',
      'Off the top, you see the varnish strip below the lip. New beta: stand on the varnish strip.',
      {
        fall: 'The varnish crumbles under your toe.',
      },
    ),
    roundtop: first(
      'technical',
      'technical',
      'Press onto the rounded top',
      'press',
      'Rounded, sandy, and higher than it looked. Press it out slowly.',
      {
        fall: 'The top rolls away under your hands.',
      },
    ),
    roundheel: earned(
      'technical',
      'power',
      'Heel-hook the rounded lip',
      'heel the lip',
      'A heel on the lip, and you can let go of the press.',
      'Off the top. The lip will take a heel. New beta: heel-hook the rounded lip.',
      {
        fall: 'Your heel rolls off the rounded lip.',
      },
    ),
  },
  gneiss: {
    summitblock: first(
      'technical',
      'power',
      'Squeeze the summit block',
      'squeeze',
      'The top’s a block you can get your arms round. Squeeze, and walk your feet up.',
      {
        fall: 'The block’s too wide to hold, and you slide.',
      },
    ),
    blindincut: earned(
      'technical',
      'crimp',
      'Find the incut on top',
      'incut',
      'Over the lip there’s an incut edge you can’t see. Reach over blind.',
      'Off the top. There’s an incut over the lip. New beta: find the incut on top.',
      {
        fall: 'You find the incut, and your fingers are too cold to close.',
      },
    ),
    blacklip: first(
      'technical',
      'technical',
      'Mantel the black lip',
      'mantel',
      'A flat black lip, cold as metal. Mantel it before your palms go.',
      {
        fall: 'Your palms slide on the cold lip.',
      },
    ),
    compresstop: earned(
      'technical',
      'power',
      'Compress the summit',
      'compress',
      'Two sidepulls at the lip. Squeeze them together, and step up.',
      'Off the top. The lip has two sidepulls to squeeze. New beta: compress the summit.',
      {
        fall: 'You squeeze, and one hand slips.',
      },
    ),
    incutsover: first(
      'technical',
      'crimp',
      'Pull over on the incuts',
      'incuts',
      'Square incuts all the way over the top. Just keep pulling.',
      {
        fall: 'One incut’s colder than the rest, and you let go of it.',
      },
    ),
    lipstep: earned(
      'technical',
      'technical',
      'High-step onto the lip',
      'high step',
      'Get a foot up on the lip itself, and stand up off it.',
      'Off the top, you see the lip is a foothold. New beta: high-step onto the lip.',
      {
        fall: 'The high step slips.',
      },
    ),
  },
  limestone: {
    grasstop: first(
      'technical',
      'technical',
      'Pull onto the grassy top',
      'grassy top',
      'Grass and dirt over the lip. Grab the rock under it, not the grass.',
      {
        fall: 'You grab the grass. The grass lets go.',
      },
    ),
    dirtpocket: earned(
      'technical',
      'crimp',
      'Clean the pocket over the lip',
      'dirt pocket',
      'A pocket over the lip, full of dirt. Clean it with a finger, and pull.',
      'Off the top. There’s a pocket under the dirt over the lip. New beta: clean the pocket over the lip.',
      {
        fall: 'Your finger hooks dirt, not rock.',
      },
    ),
  },
};

// ---------------------------------------------------------------------------------------
// The signature lines, by hand: one a crag, the one people drive in for (Phase 27.2). The
// Pump at Roadside was hand-made already.

const SIGNATURE: Record<Rock, Record<string, BetaDef>> = {
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
    roof: first(
      'power',
      'power',
      'Campus the roof crack',
      'campus',
      'Hand jams out the roof, feet swinging, and a campus move to the lip.',
      {
        short: 'Short. The lip goes by.',
        long: 'Too much. You hit the lip and the jam lets go.',
        held: 'You hang in the roof too long to move.',
      },
    ),
    roofheel: earned(
      'power',
      'technical',
      'Heel-toe out the roof',
      'heel-toe',
      'Heel and toe cammed in the roof crack, and the campus move becomes a step.',
      'Second time off. The roof crack would take a heel and toe. New beta: cam in it.',
      {
        fall: 'The heel-toe pops.',
      },
    ),
    valleyhead: first(
      'crimp',
      'crimp',
      'Crimp the clean headwall',
      'crimp',
      'A clean headwall of small edges, four hours from anywhere and worth it.',
      {
        fall: 'Your fingers open, high on the headwall.',
      },
    ),
    valleystem: earned(
      'crimp',
      'technical',
      'Stem the shallow corner',
      'stem',
      'A shallow corner beside the edges. Stem it and the edges become handholds you don’t need.',
      'Off the headwall, you see the corner beside it. New beta: stem it.',
      {
        hit: 'Stemmed.',
        miss: 'The stem slips.',
        fall: 'Your foot slides out of the stem.',
      },
    ),
    harding: first(
      'crack',
      'crack',
      'Squeeze up the Harding slot',
      'squeeze',
      'A slot too narrow to be comfortable and too wide to jam. Breathe out and wriggle.',
      {
        hit: 'Wedged.',
        miss: 'Stuck.',
        fall: 'The slot spits you out.',
      },
    ),
    hardingface: earned(
      'crack',
      'technical',
      'Back-and-foot the slot',
      'back-and-foot',
      'Back on one wall, feet on the other, and walk it up.',
      'Off again, you notice the slot is just wide enough for your back. New beta: back-and-foot.',
      {
        fall: 'You slide down the slot.',
      },
    ),
    roofcrack: first(
      'power',
      'power',
      'Jam out the roof crack',
      'jam out',
      'Hand jams out a roof, feet off, and a last pull to the lip.',
      {
        short: 'Short. The lip stays out of reach.',
        long: 'Too much. You pull past the lip and the jam lets go.',
        held: 'You hang in the jams too long.',
      },
    ),
    roofcracktoe: earned(
      'power',
      'technical',
      'Toe-jam out the roof',
      'toe-jam',
      'Toes in the roof crack, and the jams have someone to share the load with.',
      'Second time off. Your toes would fit in the roof crack. New beta: toe-jam.',
      {
        fall: 'Your toe-jam slips out.',
      },
    ),
  },
  quartzite: {
    moonarete: first(
      'technical',
      'technical',
      'Lean off the moonlit arête',
      'lean off',
      'Lean off the arête, feet on the face, and let the quartzite hold you.',
      {
        fall: 'You barn-door off the arête.',
      },
    ),
    moonaretepinch: earned(
      'technical',
      'crimp',
      'Pinch the arête’s crystals',
      'pinch',
      'Crystals along the arête, to pinch instead of lean.',
      'Coming off, your hand catches crystals on the arête. New beta: pinch them.',
      {
        fall: 'The crystals bite and you let go.',
      },
    ),
    moonhead: first(
      'crimp',
      'crimp',
      'Crimp the headwall',
      'crimp',
      'Sharp quartzite edges on a headwall high above the desert.',
      {
        fall: 'An edge cuts and your fingers open.',
      },
    ),
    moonheadstep: earned(
      'crimp',
      'technical',
      'High-step and stand',
      'high-step',
      'A high step onto a crystal ledge takes your weight off the edges.',
      'Off the headwall, you notice a ledge for a high step. New beta: high-step.',
      {
        hit: 'Good step.',
        miss: 'Missed the ledge.',
        fall: 'Your foot slides off the ledge.',
      },
    ),
  },
  sandstone: {
    prow: first(
      'technical',
      'technical',
      'Ride the prow',
      'ride the prow',
      'Climb the prow on its edge, a heel on one side and a toe on the other.',
      {
        fall: 'You slide off the prow.',
      },
    ),
    prowheel: earned(
      'technical',
      'power',
      'Squeeze the prow',
      'squeeze',
      'Hug the prow between your arms and squeeze up it.',
      'Off again, you feel how the prow would squeeze. New beta: compress.',
      {
        fall: 'The squeeze lets go.',
      },
    ),
  },
  gneiss: {
    mythroof: first(
      'power',
      'power',
      'Cut loose and kneebar',
      'cut loose',
      'Feet cut out the roof, swing, and catch the kneebar that almost counts.',
      {
        short: 'Short. The kneebar goes by.',
        long: 'Too much. You swing past it.',
        held: 'You hang under the roof too long.',
      },
    ),
    mythroofknee: earned(
      'power',
      'technical',
      'Make the kneebar count',
      'kneebar',
      'The kneebar almost counts. Press it till it does.',
      'Second time off, you see how the kneebar would hold if you meant it. New beta: make it count.',
      {
        fall: 'The kneebar slips out.',
      },
    ),
    mono: first(
      'crimp',
      'crimp',
      'Pull on the mono',
      'mono',
      'At forty metres, a left-hand mono. One finger. Nothing else.',
      {
        fall: 'Your finger slides out of the mono.',
      },
    ),
    monostep: earned(
      'crimp',
      'technical',
      'Step through to the mono',
      'step through',
      'A high step makes the mono a handhold you only need for a moment.',
      'Off the mono, you see the step you could have used. New beta: step through.',
      {
        hit: 'Good step.',
        miss: 'Missed it.',
        fall: 'Your foot slides off, and the mono goes with it.',
      },
    ),
  },
  limestone: {
    deepbulge: first(
      'power',
      'power',
      'Throw for the last bulge',
      'throw',
      'Forty-five feet over the sea, a throw over the last bulge.',
      {
        short: 'Short. A long way down to the water.',
        long: 'Too much. You hit the bulge and peel.',
        held: 'You stare at the drop too long.',
      },
    ),
    deepknee: earned(
      'power',
      'technical',
      'Kneebar under the bulge',
      'kneebar',
      'A kneebar under the bulge holds you while you reach over it.',
      'Second time in the sea, you remember the slot under the bulge. New beta: kneebar.',
      {
        fall: 'The kneebar slips.',
      },
    ),
    tufapinch: first(
      'power',
      'power',
      'Pinch the tufa and pull',
      'pinch',
      'A single tufa like a drip of candle wax. Pinch it and pull.',
      {
        short: 'Short. The pinch goes out of reach.',
        long: 'Too much. You overpull and swing off.',
        held: 'You squeeze too long, and there’s nothing left to pull with.',
      },
    ),
    tufaheel: earned(
      'power',
      'technical',
      'Heel-hook the tufa',
      'heel-hook',
      'A heel on the tufa takes half the weight off your arms.',
      'Second time off. The tufa would take a heel. New beta: heel-hook.',
      {
        fall: 'Your heel slides off the tufa.',
      },
    ),
    tufapump: first(
      'endurance',
      'endurance',
      'Climb the tufa through the pump',
      'climb through',
      'Pinch, step, pinch, all the way up the tufa, and the pump comes with you.',
      {
        fall: 'The pump wins, high on the tufa.',
      },
    ),
    tufashake: earned(
      'endurance',
      'technical',
      'Kneebar the tufa and shake',
      'kneebar',
      'A knee behind the tufa, hands off, and shake them out.',
      'You come off beside a slot behind the tufa. New beta: kneebar and shake.',
      {
        hit: 'Knee in.',
        miss: 'Your knee slips.',
        fall: 'Pumped off anyway.',
      },
    ),
  },
};

// Each rock's moves, the signature lines' with them.
export const ROCK_MOVES: Record<Rock, Record<string, BetaDef>> = {
  granite: { ...GRANITE, ...SIGNATURE.granite, ...TOP_OUTS.granite, ...WALL_MOVES },
  quartzite: { ...QUARTZITE, ...SIGNATURE.quartzite, ...TOP_OUTS.quartzite },
  sandstone: { ...SANDSTONE, ...SIGNATURE.sandstone, ...TOP_OUTS.sandstone },
  gneiss: { ...GNEISS, ...SIGNATURE.gneiss, ...TOP_OUTS.gneiss },
  limestone: { ...LIMESTONE, ...SIGNATURE.limestone, ...TOP_OUTS.limestone },
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
  // Moonstone: quartzite.
  marete: [
    ['hugarete', 'edgearete'],
    ['hugtop', 'aretemantel'],
  ],
  mmantel: [
    ['heave', 'heelrock'],
    ['pressit', 'kneetop'],
  ],
  megg: [['throwsloper', 'pastebump']],
  mhueco: [
    ['pockets', 'toepocket'],
    ['summithueco', 'stepin'],
  ],
  msplitter: [
    ['jamsplitter', 'laybacksplitter'],
    ['liebackend', 'topjug'],
  ],
  mroof: [['cutfeet', 'toehookroof']],
  mopen: [
    ['snatch', 'heeltoe'],
    ['rollon', 'summitrib'],
  ],
  mspire: [
    ['jumphorn', 'bumprail'],
    ['smearblock', 'crimpsummit'],
  ],
  mmoon: [
    ['moonarete', 'moonaretepinch'],
    ['moonhead', 'moonheadstep'],
  ],
  // The Mesa: sandstone.
  svarnish: [['keepslap', 'shakevarnish']],
  scrimps: [['gentleflakes', 'smearstep']],
  sprow: [
    ['prow', 'prowheel'],
    ['sandpalm', 'whale'],
  ],
  ssplit: [
    ['redsplitter', 'laybacksplitter'],
    ['fisttop', 'varnishstep'],
  ],
  spowerhouse: [['slapsloper', 'heelsloper']],
  smega: [['launch', 'bumphueco']],
  sopen: [
    ['crimpvarnish', 'rockscoop'],
    ['roundtop', 'roundheel'],
  ],
  sdlap: [
    ['pinchrail', 'smearstep'],
    ['smearred', 'edgevarnish'],
  ],
  senduro: [
    ['jughaul', 'stemshake'],
    ['roundedges', 'rockscoop'],
  ],
  sbiglink: [
    ['compress', 'ironstone'],
    ['throwlip', 'toehooklip'],
  ],
  sdtrad: [
    ['softcrack', 'laybacksplitter'],
    ['padup', 'edgevarnish'],
  ],
  // The Big Stone: granite.
  bbase: [['lipthrow', 'heel']],
  bwarm: [
    ['dimes', 'thumb'],
    ['shelf', 'shelffoot'],
  ],
  bsplit: [
    ['fingerlock', 'layback'],
    ['jamout', 'crackrock'],
  ],
  btrad: [
    ['cornerjam', 'stemrest'],
    ['traverse', 'edgecrystal'],
  ],
  bclassic: [
    ['roof', 'roofheel'],
    ['valleyhead', 'valleystem'],
  ],
  // Wind River: alpine granite.
  walpine: [['frozen', 'thumb']],
  wdiamond: [['facets', 'crimpflake']],
  woffwidth: [
    ['armbar', 'stemrest'],
    ['squirm', 'lipwing'],
  ],
  wthin: [['lunge', 'toehook']],
  wopen: [
    ['arete', 'edgecrystal'],
    ['coldlip', 'lipcrystal'],
  ],
  wglacier: [
    ['dimes', 'footswap'],
    ['smear', 'crimpflake'],
  ],
  wskyline: [
    ['traverse', 'edgecrystal'],
    ['skyline', 'shake'],
  ],
  wastroman: [
    ['harding', 'hardingface'],
    ['roofcrack', 'roofcracktoe'],
  ],
  wtrad: [
    ['handjam', 'layback'],
    ['longcorner', 'dropknee'],
  ],
  // The Crucible: gneiss.
  creckoning: [['razorgneiss', 'thumbstep']],
  cvise: [
    ['vise', 'laybackvise'],
    ['summitblock', 'blindincut'],
  ],
  capparition: [['ghost', 'toehooksee']],
  canvil: [['strike', 'squeezeblock']],
  chorizon: [
    ['commit', 'bumpundercut'],
    ['blacklip', 'compresstop'],
  ],
  cgenesis: [
    ['flyedge', 'doubleclutch'],
    ['incutsover', 'lipstep'],
  ],
  ccrux: [
    ['gneissrail', 'bumpundercut'],
    ['coldincuts', 'rockincut'],
  ],
  clifeline: [
    ['seampull', 'thumbstep'],
    ['smeargneiss', 'crimpcrystal'],
  ],
  cthreshold: [
    ['together', 'shakeincut'],
    ['cutroof', 'squeezeblock'],
  ],
  cmyth: [
    ['mythroof', 'mythroofknee'],
    ['mono', 'monostep'],
  ],
  // The Cove: limestone over the sea.
  ptide: [['waterline', 'kneeshake']],
  pplunge: [['saltjug', 'bumptufa']],
  pslab: [['smearsalt', 'twofinger']],
  pbarnacle: [['barnacles', 'steppocket']],
  pleap: [['leapgap', 'bumptufa']],
  poverhang: [['catchtufa', 'kneeroof']],
  parete: [['limearete', 'pincharete']],
  pdeep: [['deepbulge', 'deepknee']],
  // Miller's Bluff: limestone on a farm.
  bbarn: [
    ['greyedges', 'steppocket'],
    ['greyslab', 'twofinger'],
  ],
  btufa: [
    ['tufapinch', 'tufaheel'],
    ['tufapump', 'tufashake'],
  ],
  bcow: [
    ['bridgegroove', 'twofinger'],
    ['pullean', 'kneeroof'],
  ],
  bpillar: [
    ['crimppillar', 'steppocket'],
    ['pillararete', 'pincharete'],
  ],
  broof: [
    ['swingroof', 'kneeroof'],
    ['throwlimelip', 'bumptufa'],
  ],
  blong: [
    ['hiddenedges', 'steppocket'],
    ['tufaline', 'kneeshake'],
  ],
  bhay: [['rockbale', 'twofinger']],
  btrough: [['crimprim', 'steppocket']],
  bsilo: [
    ['silojump', 'bumptufa'],
    ['grasstop', 'dirtpocket'],
  ],
  // The walls' pitches (Phase 27.3): granite, by kind.
  'prow-1': [['padslab', 'dishslab']],
  'prow-2': [['ladder', 'ladderfeet']],
  'prow-3': [['roofreach', 'roofbicycle']],
  'prow-4': [['handjams', 'jamrest']],
  'golden-1': [['goldenpad', 'ripple']],
  'golden-2': [['stemcorner', 'cornerlayback']],
  'golden-3': [['goldcrimps', 'goldside']],
  'golden-4': [['bulgeslap', 'bulgehip']],
  'golden-5': [['twincracks', 'switchcracks']],
  'obsidian-1': [['dihedral', 'dimple']],
  'obsidian-2': [['glass', 'glassseam']],
  'obsidian-3': [['swingout', 'roofjam']],
  'obsidian-4': [['leapflake', 'pebble']],
  'obsidian-5': [['shuffle', 'thumbsdown']],
  'obsidian-6': [['crimpacross', 'crossthrough']],
  'obsidian-7': [['keepmoving', 'outrightjug']],
  'ascendant-1': [['backfoot', 'stackfeet']],
  'ascendant-2': [['seam', 'pinscar']],
  'ascendant-3': [['standup', 'palms']],
  'ascendant-4': [['throwlip', 'roofcrackfeet']],
  'ascendant-5': [['faith', 'lookfirst']],
  'ascendant-6': [['barely', 'handfoot']],
  'ascendant-7': [['fingercrack', 'pods']],
  'ascendant-8': [['pullover', 'mantelblock']],
};
