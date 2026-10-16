// The later crags' layouts (Phase 14.5b): where each one's wall, lines and boulders stand, and
// what its sign says. The full game's only: the demo's build takes layout.demo.ts.
import type { CragSpec } from './layout';

export const LATER_CRAGS: Record<string, CragSpec> = {
  // Moonstone: sand, sky and quartzite boulders the size of houses, and a spire in the
  // middle with two bolted lines on it.
  moon: {
    width: 1400,
    wall: [620, 1040],
    lines: [
      { n: 1, x: 680, route: 'mspire' },
      { n: 2, x: 750, route: 'mmoon' },
    ],
    boulders: [
      { x: 380, w: 92, h: 150, route: 'marete' },
      { x: 500, w: 80, h: 90, route: 'mmantel' },
      { x: 590, w: 70, h: 84, route: 'megg' },
      { x: 850, w: 84, h: 104, route: 'mhueco' },
      { x: 970, w: 96, h: 132, route: 'msplitter' },
      { x: 1110, w: 116, h: 78, route: 'mroof' },
      { x: 1262, w: 104, h: 150, route: 'mopen' },
    ],
    sign: 272,
    hint: 'Highballs on the sand. The spire needs a belayer.',
    // The spire, with a highball either side.
    frame: 760,
  },
  // Psicobloc Cove: a limestone sea cliff, its eight deep-water lines up it from a rock
  // shelf above the water. No boulders: the sea's where they'd be.
  cove: {
    width: 1500,
    wall: [480, 1500],
    lines: [
      { n: 1, x: 560, route: 'ptide' },
      { n: 2, x: 670, route: 'pplunge' },
      { n: 3, x: 780, route: 'pslab' },
      { n: 4, x: 890, route: 'pbarnacle' },
      { n: 5, x: 1000, route: 'pleap' },
      { n: 6, x: 1110, route: 'poverhang' },
      { n: 7, x: 1220, route: 'parete' },
      { n: 8, x: 1330, route: 'pdeep' },
    ],
    boulders: [],
    sign: 272,
    hint: 'Pick a line and pull on. The sea catches you.',
    frame: 900,
  },
  // Miller's Bluff (Phase 18.6): a grey limestone wall on the back of a farm, six lines up it
  // and three boulders in the field, none of them ever climbed till you bolt them.
  bluff: {
    width: 1500,
    wall: [480, 1240],
    lines: [
      { n: 1, x: 580, route: 'bbarn' },
      { n: 2, x: 700, route: 'btufa' },
      { n: 3, x: 820, route: 'bcow' },
      { n: 4, x: 940, route: 'bpillar' },
      { n: 5, x: 1060, route: 'broof' },
      { n: 6, x: 1180, route: 'blong' },
    ],
    boulders: [
      { x: 360, w: 70, h: 52, route: 'bhay' },
      { x: 1320, w: 76, h: 58, route: 'btrough' },
      { x: 1430, w: 72, h: 84, route: 'bsilo' },
    ],
    sign: 272,
    hint: 'Nobody’s ever climbed here. Pick a line and bolt it.',
    frame: 880,
  },
  // Phase 32.1: the Hollow, a slot canyon: four roped lines up the red wall, two cracks and
  // two faces, the crow traverse along the floor before it, and two boulders past it. The
  // headstones stand between the traverse and the wall (paint/scenes.ts).
  hollow: {
    width: 1500,
    wall: [560, 1160],
    lines: [
      { n: 1, x: 640, route: 'hsplit' },
      { n: 2, x: 760, route: 'hwall' },
      { n: 3, x: 880, route: 'hcorner' },
      { n: 4, x: 1000, route: 'hlean' },
    ],
    boulders: [
      { x: 360, w: 96, h: 40, route: 'hcrow' },
      { x: 1270, w: 72, h: 56, route: 'hstone' },
      { x: 1400, w: 80, h: 64, route: 'hgap' },
    ],
    sign: 272,
    hint: 'No topo, and no chalk. Every line here is yours to name.',
    frame: 860,
  },
  // The Crucible: a black gneiss wall with four roped lines, the myth the last of them, and
  // boulders on the frozen ground either side; the boulder myth out past Event Horizon.
  crucible: {
    width: 1600,
    wall: [640, 1220],
    lines: [
      { n: 1, x: 720, route: 'ccrux' },
      { n: 2, x: 840, route: 'clifeline' },
      { n: 3, x: 960, route: 'cthreshold' },
      { n: 4, x: 1080, route: 'cmyth' },
    ],
    boulders: [
      { x: 340, w: 80, h: 54, route: 'creckoning' },
      { x: 460, w: 70, h: 60, route: 'cvise' },
      { x: 570, w: 64, h: 50, route: 'capparition' },
      { x: 1290, w: 76, h: 62, route: 'canvil' },
      { x: 1400, w: 84, h: 68, route: 'chorizon' },
      { x: 1510, w: 72, h: 58, route: 'cgenesis' },
    ],
    sign: 272,
    hint: 'Nothing here is easy. The wall needs a belayer.',
    frame: 920,
  },
  // Wind River: an alpine wall with four roped lines, boulders by the lake either side.
  wind: {
    width: 1560,
    wall: [620, 1240],
    lines: [
      { n: 1, x: 700, route: 'wglacier' },
      { n: 2, x: 820, route: 'wskyline' },
      { n: 3, x: 940, route: 'wastroman' },
      { n: 4, x: 1060, route: 'wtrad' },
    ],
    boulders: [
      { x: 340, w: 80, h: 52, route: 'walpine' },
      { x: 480, w: 70, h: 60, route: 'wdiamond' },
      { x: 1300, w: 84, h: 70, route: 'woffwidth' },
      { x: 1400, w: 66, h: 56, route: 'wthin' },
      { x: 1500, w: 60, h: 64, route: 'wopen' },
    ],
    sign: 272,
    hint: 'Boulders by the lake. The wall needs a belayer, and a jacket.',
    // The wall.
    frame: 900,
  },
  // The Big Stone: a granite big wall filling the right of the scene, its single pitches
  // on it, and boulders in the meadow at its foot. Phase 27.6: the Apron on the slab
  // between the Classic and the corner, two more boulders in the meadow, and the project
  // at the far end.
  stone: {
    width: 1400,
    wall: [560, 1400],
    lines: [
      { n: 1, x: 780, route: 'bclassic' },
      { n: 2, x: 870, route: 'bapron' },
      // Up the corner system.
      { n: 3, x: 966, route: 'btrad' },
    ],
    boulders: [
      { x: 350, w: 90, h: 54, route: 'bbase' },
      { x: 460, w: 82, h: 56, route: 'bmeadow' },
      { x: 590, w: 96, h: 92, route: 'berratic' },
      { x: 1110, w: 84, h: 70, route: 'bwarm' },
      { x: 1260, w: 80, h: 96, route: 'bsplit' },
      { x: 1350, w: 70, h: 62, route: 'bproject' },
    ],
    sign: 272,
    hint: 'Boulders in the meadow. The wall needs a belayer.',
    walls: [
      { x: 640, wall: 'golden' },
      { x: 1060, wall: 'obsidian' },
      { x: 1200, wall: 'ascendant' },
    ],
    // The foot of the wall.
    frame: 820,
  },
  // Sandstone Mesa: a red wall with three bolted lines and a crack, boulders on the sand
  // either side, and the Megaproject's block out past the end of it.
  mesa: {
    width: 1560,
    wall: [620, 1140],
    lines: [
      { n: 1, x: 700, route: 'sdlap' },
      { n: 2, x: 820, route: 'senduro' },
      { n: 3, x: 940, route: 'sbiglink' },
      { n: 4, x: 1060, route: 'sdtrad' },
    ],
    boulders: [
      { x: 340, w: 96, h: 50, route: 'svarnish' },
      { x: 470, w: 60, h: 48, route: 'scrimps' },
      { x: 590, w: 84, h: 60, route: 'ssplit' },
      { x: 1170, w: 74, h: 70, route: 'sprow' },
      { x: 1270, w: 72, h: 44, route: 'spowerhouse' },
      { x: 1370, w: 60, h: 56, route: 'smega' },
      { x: 1480, w: 66, h: 54, route: 'sopen' },
    ],
    sign: 272,
    hint: 'Boulders on the sand. The wall needs a belayer.',
    // The wall, and the Prow past its end.
    frame: 900,
  },
};
