// The later crags' lines (Phase 14.5b): Moonstone, the Mesa, the Big Stone and its walls, Wind
// River, the Crucible, the Cove, Miller's Bluff and the Hollow. The full game's only: the demo's
// build takes routes.demo.ts instead (build/demo.ts). routes.ts calls laterLines with its
// makers once they're ready, so nothing here runs before routes.ts has.
import type { Style } from '../climber';
import type { libraryBoulder, librarySport, libraryTrad, PitchKind, RouteDef, WallDef } from './routes';

export interface LineMakers {
  libraryBoulder: typeof libraryBoulder;
  librarySport: typeof librarySport;
  libraryTrad: typeof libraryTrad;
  pitches: (wall: string, place: string, list: [string, number, Style, PitchKind][]) => RouteDef[];
}

export function laterLines({ libraryBoulder, librarySport, libraryTrad, pitches }: LineMakers): {
  lines: Record<string, RouteDef>;
  pitches: RouteDef[];
  walls: Record<string, WallDef>;
} {
  // ---- Moonstone Boulders: v0.956's desert highball crag, three hours out ----
  // v0.956 named two lines Highball Arête, one here and one at Roadside; this one is the Tall
  // Arête, so a log or a card can't mix them up.

  const mArete = libraryBoulder('marete', 'Tall Arête', 6, 'technical', 'moon', {
    moves: 9,
    from: 5.6,
    to: 7.4,
    cruxName: 'The rounded arête',
    heightFt: 22,
    line: 'An arête as tall as a house, and the hard part is at the top of it.',
  });
  const mMantel = libraryBoulder('mmantel', 'Moonstone Mantel', 7, 'power', 'moon', {
    moves: 5,
    from: 3.0,
    to: 4.4,
    cruxName: 'The lip',
    heightFt: 16,
    line: 'Up to the lip, then the mantel everybody gets wrong the first time.',
  });
  const mEgg = libraryBoulder('megg', 'The Egg', 8, 'dyno', 'moon', {
    moves: 5,
    from: 2.4,
    to: 3.6,
    cruxName: 'The throw',
    heightFt: 15,
    line: 'A smooth egg of quartzite: one hold, one throw, one sloper to catch.',
  });
  const mHueco = libraryBoulder('mhueco', 'Hueco Pockets', 9, 'crimp', 'moon', {
    moves: 7,
    from: 3.2,
    to: 5.0,
    cruxName: 'The pockets',
    heightFt: 17,
    line: 'Pockets all the way up. The guidebook says V9. The guidebook is generous.',
    trueGrade: 8,
  });
  const mSplitter = libraryBoulder('msplitter', 'Moonstone Splitter', 8, 'crack', 'moon', {
    moves: 8,
    from: 4.0,
    to: 6.0,
    cruxName: 'The flare',
    heightFt: 20,
    line: 'A splitter up a boulder the size of a van. Tape up.',
  });
  const mRoof = libraryBoulder('mroof', 'Lunar Roof', 11, 'power', 'moon', {
    moves: 9,
    from: 4.4,
    to: 7.0,
    cruxName: 'The lip',
    heightFt: 14,
    line: 'Nine moves out the roof in the dark under the boulder, and then the lip.',
  });
  const mOpen = libraryBoulder('mopen', 'The Moonstone project', 12, 'power', 'moon', {
    moves: 8,
    from: 3.6,
    to: 6.2,
    cruxName: 'The hard move',
    heightFt: 22,
    line: 'Nobody’s done it. The chalk stops two-thirds of the way up a very tall boulder.',
    open: true,
  });
  const mSpire = librarySport('mspire', 'Desert Spire', 8, 'dyno', 'moon', {
    moves: 24,
    heightFt: 90,
    line: 'A lone spire of quartzite, bolted to its summit. The jump is halfway.',
    rest: 13,
    a: { style: 'dyno', name: 'The jump', from: 9.0, to: 10.8, win: 'Stuck it.' },
    b: { style: 'technical', name: 'The summit block', from: 18.6, to: 21.2, win: 'Chains, and the view.' },
  });
  const mMoon = librarySport('mmoon', 'Moonlight Arête', 10, 'technical', 'moon', {
    moves: 28,
    heightFt: 110,
    line: 'An arête that catches the moon. Climb it by day anyway.',
    rest: 15.4,
    a: { style: 'technical', name: 'The arête', from: 8.4, to: 11.0, win: 'Off the arête.' },
    b: { style: 'crimp', name: 'The headwall', from: 20.2, to: 23.6, win: 'Chains.' },
  });

  // ---- Sandstone Mesa: v0.956's fourth crag, desert sandstone three hours out ----
  // Its eleven lines, names and grades as v0.956 had them: V7 to the open V13, three bolted
  // lines and a trad line. It opens at V7 and shuts for the summer heat.

  const sVarnish = libraryBoulder('svarnish', 'Desert Varnish', 7, 'endurance', 'mesa', {
    moves: 10,
    from: 6.0,
    to: 8.4,
    cruxName: 'The last slopers',
    heightFt: 15,
    line: 'Ten moves across black varnish. The holds are fine; there are just a lot of them.',
  });
  const sCrimps = libraryBoulder('scrimps', 'Sandstone Crimps', 8, 'crimp', 'mesa', {
    moves: 7,
    from: 3.4,
    to: 5.2,
    cruxName: 'The flakes',
    heightFt: 14,
    line: 'Thin flakes that might be holds or might be next year’s talus.',
  });
  const sProw = libraryBoulder('sprow', 'The Prow', 9, 'technical', 'mesa', {
    moves: 8,
    from: 4.2,
    to: 6.2,
    cruxName: 'The prow',
    heightFt: 17,
    line: 'A sharp prow, climbed on its edge. The guidebook says V9.',
    trueGrade: 10,
  });
  const sSplit = libraryBoulder('ssplit', 'Desert Splitter', 9, 'crack', 'mesa', {
    moves: 8,
    from: 3.8,
    to: 5.8,
    cruxName: 'The flare',
    heightFt: 16,
    line: 'A splitter through a boulder the size of a van. Tape up.',
  });
  const sPowerhouse = libraryBoulder('spowerhouse', 'Powerhouse', 10, 'power', 'mesa', {
    moves: 6,
    from: 2.6,
    to: 4.2,
    cruxName: 'The roof',
    heightFt: 12,
    line: 'Six moves out a roof on slopers that don’t care how strong you are.',
  });
  const sMega = libraryBoulder('smega', 'The Megaproject', 11, 'dyno', 'mesa', {
    moves: 6,
    from: 3.0,
    to: 4.4,
    cruxName: 'The jump',
    heightFt: 15,
    line: 'Everyone’s project, for a reason. The jump is further than it looks, and it looks far.',
  });
  const sOpen = libraryBoulder('sopen', 'The Mesa project', 13, 'crimp', 'mesa', {
    moves: 8,
    from: 4.4,
    to: 6.6,
    cruxName: 'The blank bit',
    heightFt: 16,
    line: 'Unclimbed. Chalk on two holds, and a long blank stretch nobody has chalked.',
    open: true,
  });
  const sLap = librarySport('sdlap', 'Desert Lap', 8, 'crimp', 'mesa', {
    moves: 22,
    heightFt: 85,
    line: 'The warm-up here, which says something about here.',
    rest: 11.4,
    a: { style: 'crimp', name: 'The varnish', from: 6.4, to: 8.6, win: 'Onto the ledge.' },
    b: { style: 'technical', name: 'The slab', from: 16.2, to: 18.4, win: 'Chains.' },
  });
  const sEnduro = librarySport('senduro', 'Desert Enduro', 9, 'endurance', 'mesa', {
    moves: 28,
    heightFt: 110,
    line: 'A hundred and ten feet, and none of it is a rest you’d call a rest.',
    rest: 14.8,
    a: {
      style: 'endurance',
      name: 'The first headwall',
      from: 9.2,
      to: 12.0,
      win: 'A shake, if you’re quick.',
    },
    b: {
      style: 'crimp',
      name: 'The top edges',
      from: 21.6,
      to: 24.6,
      win: 'Chains. Your forearms file a complaint.',
    },
  });
  const sLink = librarySport('sbiglink', 'The Big Link', 11, 'technical', 'mesa', {
    moves: 30,
    heightFt: 120,
    line: 'Two routes linked through a blank bulge. The link is the whole point.',
    rest: 15.2,
    a: { style: 'technical', name: 'The bulge', from: 9.6, to: 12.4, win: 'Through the link.' },
    b: { style: 'power', name: 'The lip', from: 23.0, to: 25.8, win: 'Chains. All of it, in one go.' },
  });
  const sTrad = libraryTrad('sdtrad', 'Desert Trad Line', 11, 'technical', 'mesa', {
    moves: 26,
    heightFt: 105,
    line: 'Soft sandstone and a thin crack. Place carefully; it holds if you did.',
    rest: 13.4,
    a: { style: 'crack', name: 'The thin crack', from: 7.6, to: 10.2, win: 'Out of the crack.' },
    b: { style: 'technical', name: 'The runout face', from: 19.0, to: 21.8, win: 'Top out onto the mesa.' },
  });

  // ---- The Big Stone: v0.956's valley of granite big walls, four hours out ----
  // Its five single-pitch lines, names and grades as v0.956 had them, and four more from Phase
  // 27.6: a V8 to match the grade it opens at, a highball, an open project and a slab. Its
  // multi-pitch walls come with Phase 21.5. It opens at V8, once you've paid for the trip, and
  // it's shaded.

  const bBase = libraryBoulder('bbase', 'Base Camp Boulder', 6, 'power', 'stone', {
    moves: 6,
    from: 2.8,
    to: 4.4,
    cruxName: 'The lip',
    heightFt: 13,
    line: 'Everyone’s first problem here, done in approach shoes by people waiting on a wall.',
  });
  const bWarm = libraryBoulder('bwarm', 'The Warm-Up Wall', 9, 'crimp', 'stone', {
    moves: 8,
    from: 4.0,
    to: 6.0,
    cruxName: 'The dime edges',
    heightFt: 16,
    line: 'A warm-up, if you warm up on V10. The guidebook says V9.',
    trueGrade: 10,
  });
  const bSplit = libraryBoulder('bsplit', 'The Splitter Pitch', 10, 'crack', 'stone', {
    moves: 9,
    from: 5.2,
    to: 7.4,
    cruxName: 'The finger lock',
    heightFt: 22,
    line: 'A perfect finger crack that ends a long way off the ground.',
  });
  const bTrad = libraryTrad('btrad', 'The Trad Pitch', 11, 'technical', 'stone', {
    moves: 28,
    heightFt: 120,
    line: 'One long pitch up a corner on the big wall. Bring the rack and a lot of patience.',
    rest: 14.2,
    a: { style: 'crack', name: 'The corner', from: 8.4, to: 11.2, win: 'Out of the corner.' },
    b: {
      style: 'technical',
      name: 'The slab traverse',
      from: 20.6,
      to: 23.4,
      win: 'Top out. The valley goes quiet.',
    },
  });
  const bClassic = librarySport('bclassic', 'Valley Classic', 12, 'power', 'stone', {
    moves: 30,
    heightFt: 125,
    line: 'The one everybody drives four hours for. Steep, clean and famous.',
    rest: 15.4,
    a: { style: 'power', name: 'The roof', from: 9.2, to: 12.0, win: 'Over the roof.' },
    b: { style: 'crimp', name: 'The headwall', from: 22.8, to: 26.0, win: 'Chains, and a very long lower.' },
  });

  // Phase 27.6: the meadow's boulders and the apron below the wall.
  const bMeadow = libraryBoulder('bmeadow', 'Meadow Arête', 8, 'technical', 'stone', {
    moves: 7,
    from: 3.4,
    to: 5.4,
    cruxName: 'The blank side',
    heightFt: 14,
    line: 'A clean arête in the grass, where people warm up while they wait on a partner for the wall.',
  });
  const bErratic = libraryBoulder('berratic', 'The Erratic', 11, 'power', 'stone', {
    moves: 7,
    from: 3.8,
    to: 5.8,
    cruxName: 'The overhang',
    heightFt: 18,
    line: 'A boulder the glacier dropped at the foot of the wall, steep on the side that faces the valley.',
  });
  const bProject = libraryBoulder('bproject', 'The Big Stone project', 13, 'crimp', 'stone', {
    moves: 7,
    from: 3.2,
    to: 5.6,
    cruxName: 'The seam',
    heightFt: 15,
    line: 'Unclimbed. A seam up a block at the end of the valley, and edges nobody’s held for long.',
    open: true,
  });
  const bApron = librarySport('bapron', 'The Apron', 9, 'technical', 'stone', {
    moves: 22,
    heightFt: 90,
    line: 'Bolts up the low-angle slab under the big wall. Your calves give out before your fingers.',
    rest: 11,
    a: { style: 'technical', name: 'The polished bit', from: 6.4, to: 8.8, win: 'Off the polish.' },
    b: {
      style: 'crimp',
      name: 'The water streak',
      from: 15.6,
      to: 18.2,
      win: 'Chains, and the long walk off.',
    },
  });

  // ---- Wind River Walls: v0.956's high alpine granite, past the Gorge ----
  // Its nine lines, names and grades as v0.956 had them: V9 to an open V15, three bolted
  // and a trad line. V9 and a trip to pay for, a permit every time, and snowed in all winter.

  const wAlpine = libraryBoulder('walpine', 'Alpine Crimps', 9, 'crimp', 'wind', {
    moves: 7,
    from: 3.6,
    to: 5.4,
    cruxName: 'The frozen edges',
    heightFt: 13,
    line: 'Edges on a block by the lake. Your fingers go numb before they go pumped.',
  });
  const wDiamond = libraryBoulder('wdiamond', 'The Diamond', 11, 'technical', 'wind', {
    moves: 8,
    from: 4.2,
    to: 6.2,
    cruxName: 'The facet',
    heightFt: 15,
    line: 'A diamond-shaped face climbed on its facets. Soft for V11, and everyone knows it.',
    trueGrade: 10,
  });
  const wOffwidth = libraryBoulder('woffwidth', 'Offwidth Horror', 12, 'crack', 'wind', {
    moves: 7,
    from: 3.4,
    to: 5.6,
    cruxName: 'The chimney-that-isn’t',
    heightFt: 16,
    line: 'Too wide for a fist, too narrow for a body. It costs skin you didn’t know you had.',
  });
  const wThin = libraryBoulder('wthin', 'Thin Air', 13, 'power', 'wind', {
    moves: 6,
    from: 2.8,
    to: 4.4,
    cruxName: 'The lunge',
    heightFt: 14,
    line: 'Eleven thousand feet up, a lunge that’s hard at sea level.',
  });
  const wOpen = libraryBoulder('wopen', 'The Wind River project', 15, 'technical', 'wind', {
    moves: 9,
    from: 4.6,
    to: 7.0,
    cruxName: 'The blank arête',
    heightFt: 18,
    line: 'Unclimbed. An arête with no holds on it that anyone’s found yet.',
    open: true,
  });
  const wGlacier = librarySport('wglacier', 'Glacier Point', 10, 'crimp', 'wind', {
    moves: 24,
    heightFt: 95,
    line: 'Clean alpine granite over a glacier. Crimps all the way, and cold ones.',
    rest: 12.2,
    a: { style: 'crimp', name: 'The seam', from: 7.2, to: 9.6, win: 'Off the seam.' },
    b: {
      style: 'technical',
      name: 'The slab',
      from: 17.8,
      to: 20.2,
      win: 'Chains, and a view that goes on.',
    },
  });
  const wSkyline = librarySport('wskyline', 'Skyline Traverse', 12, 'technical', 'wind', {
    moves: 30,
    heightFt: 110,
    line: 'Sideways along the skyline for half its length. The rope drag is the second crux.',
    rest: 15.0,
    a: { style: 'technical', name: 'The traverse', from: 8.8, to: 12.4, win: 'Across.' },
    b: {
      style: 'endurance',
      name: 'The last bolts',
      from: 23.2,
      to: 26.6,
      win: 'Chains. Lower slowly; it wanders.',
    },
  });
  const wAstro = librarySport('wastroman', 'Astroman', 14, 'crack', 'wind', {
    moves: 32,
    heightFt: 130,
    line: 'A bolted crack line, the hardest thing on the wall. It’s everything, the whole way.',
    rest: 16.4,
    a: { style: 'crack', name: 'The Harding slot', from: 10.0, to: 13.2, win: 'Out of the slot.' },
    b: {
      style: 'power',
      name: 'The roof crack',
      from: 24.6,
      to: 28.2,
      win: 'Chains. You’ll be telling people.',
    },
  });
  const wTrad = libraryTrad('wtrad', 'Alpine Trad', 13, 'endurance', 'wind', {
    moves: 30,
    heightFt: 125,
    line: 'A long crack up the wall, gear the whole way, and the weather watching.',
    rest: 15.6,
    a: { style: 'crack', name: 'The long hands', from: 9.4, to: 12.6, win: 'Out of the hands section.' },
    b: { style: 'endurance', name: 'The upper corner', from: 22.4, to: 25.8, win: 'Top out into the wind.' },
  });

  // ---- The Crucible: v0.956's remote, frigid wall, where the grades run out ----
  // Its lines as v0.956 had them, V13 to its two V18 myths, and one it didn't have: The Anvil,
  // V16, so the grades run out without a hole in them [proposed]. A myth can't be read until
  // you've sent the hardest known line under it (v0.956's revealAfter), and nobody has
  // climbed one: its first ascent is yours to name.

  const cReckoning = libraryBoulder('creckoning', 'The Reckoning', 13, 'crimp', 'crucible', {
    moves: 8,
    from: 4.0,
    to: 6.2,
    cruxName: 'The razor edges',
    heightFt: 15,
    line: 'Edges in cold gneiss, sharp enough to shave with. The first thing here, and it’s V13.',
  });
  const cVise = libraryBoulder('cvise', 'The Vise', 14, 'crack', 'crucible', {
    moves: 7,
    from: 3.4,
    to: 5.6,
    cruxName: 'The squeeze',
    heightFt: 16,
    line: 'A crack that closes on your hand like it means it.',
  });
  const cApparition = libraryBoulder('capparition', 'Apparition', 15, 'power', 'crucible', {
    moves: 6,
    from: 2.8,
    to: 4.6,
    cruxName: 'The ghost hold',
    heightFt: 14,
    line: 'A hold you only see from the move before it. The guidebook says V15; it isn’t quite.',
    trueGrade: 14,
  });
  const cAnvil = libraryBoulder('canvil', 'The Anvil', 16, 'power', 'crucible', {
    moves: 7,
    from: 3.2,
    to: 5.2,
    cruxName: 'The strike',
    heightFt: 15,
    line: 'A block of black gneiss with one way up it, and every move of it hits back.',
  });
  const cHorizon = libraryBoulder('chorizon', 'Event Horizon', 17, 'dyno', 'crucible', {
    moves: 8,
    from: 4.4,
    to: 6.0,
    cruxName: 'The point of no return',
    heightFt: 17,
    line: 'Past the third move there’s no down-climbing it. The jump is the only way off.',
  });
  const cGenesis = libraryBoulder('cgenesis', 'The Crucible myth', 18, 'dyno', 'crucible', {
    moves: 5,
    from: 1.8,
    to: 3.6,
    cruxName: 'The move',
    heightFt: 16,
    line: 'The undercut setup, feet at your ears. Then the move: full extension, double-clutch, to a flat edge nobody has held. Then the mantel.',
    open: true,
    hiddenUntil: 'chorizon',
  });
  const cCrux = librarySport('ccrux', 'Crucible Crux', 13, 'dyno', 'crucible', {
    moves: 26,
    heightFt: 100,
    line: 'The warm-up, if you’ve driven this far to warm up on 5.14.',
    rest: 13.2,
    a: { style: 'dyno', name: 'The dyno', from: 8.2, to: 10.0, win: 'Stuck it.' },
    b: { style: 'crimp', name: 'The cold edges', from: 19.6, to: 22.4, win: 'Chains.' },
  });
  const cLifeline = librarySport('clifeline', 'The Lifeline', 15, 'crimp', 'crucible', {
    moves: 30,
    heightFt: 115,
    line: 'One thin seam, all the way. The seam is the lifeline; there’s nothing either side of it.',
    rest: 15.0,
    a: { style: 'crimp', name: 'The seam', from: 9.2, to: 12.4, win: 'Off the thin bit.' },
    b: { style: 'technical', name: 'The blank finish', from: 23.4, to: 26.8, win: 'Chains, somehow.' },
  });
  const cThreshold = librarySport('cthreshold', 'Threshold', 17, 'endurance', 'crucible', {
    moves: 36,
    heightFt: 130,
    line: 'The hardest known line on the wall: thirty-six moves with nowhere to hide.',
    rest: 17.6,
    a: { style: 'endurance', name: 'The long middle', from: 11.2, to: 15.0, win: 'Still on.' },
    b: {
      style: 'power',
      name: 'The last roof',
      from: 28.0,
      to: 31.8,
      win: 'Chains. The whole valley heard that.',
    },
  });
  const cMyth = {
    ...librarySport('cmyth', 'The myth above Threshold', 18, 'power', 'crucible', {
      moves: 38,
      heightFt: 140,
      line: 'The opening slab, a two-finger pull, the roof with feet cut, a kneebar that almost counts. Then, at forty metres, a left-hand mono.',
      rest: 19.0,
      a: { style: 'power', name: 'The roof', from: 12.0, to: 15.2, win: 'Feet back on.' },
      b: {
        style: 'crimp',
        name: 'The mono',
        from: 30.0,
        to: 33.6,
        win: 'The victory jugs, and you’re still on.',
      },
    }),
    open: true as const,
    hiddenUntil: 'cthreshold',
  };

  // ---- Psicobloc Cove: v0.956's deep-water solos, two hours out on the coast ----
  // Its eight lines, names and grades as v0.956 had them, V2 to V9, up a limestone sea cliff.
  // A fall is a splash. V4 to get in, and open in summer only.

  const dws = (
    id: string,
    name: string,
    grade: number,
    type: Style,
    shape: Omit<Parameters<typeof libraryBoulder>[5], 'dws'>,
  ): RouteDef => libraryBoulder(id, name, grade, type, 'cove', { ...shape, dws: true });

  const pTide = dws('ptide', 'Tide Pool Traverse', 2, 'endurance', {
    moves: 12,
    from: 7.0,
    to: 9.6,
    cruxName: 'The wet bit',
    heightFt: 12,
    line: 'Sideways along the waterline, a foot above the swell. Everyone’s first go, and first swim.',
  });
  const pPlunge = dws('pplunge', 'The Plunge', 3, 'dyno', {
    moves: 7,
    from: 4.2,
    to: 5.6,
    cruxName: 'The jump',
    heightFt: 22,
    line: 'Climb up, jump for the jug, and if you miss, well, that’s the name.',
  });
  const pSlab = dws('pslab', 'Saltwater Slab', 4, 'technical', {
    moves: 9,
    from: 5.0,
    to: 7.0,
    cruxName: 'The salty smear',
    heightFt: 25,
    line: 'A slab above the sea, and salt on every foothold.',
  });
  const pBarnacle = dws('pbarnacle', 'Barnacle Crimps', 5, 'crimp', {
    moves: 9,
    from: 4.4,
    to: 6.6,
    cruxName: 'The barnacles',
    heightFt: 28,
    line: 'The crimps are fine. The barnacles on them are sharp.',
  });
  const pLeap = dws('pleap', 'Leap of Faith', 6, 'dyno', {
    moves: 8,
    from: 5.0,
    to: 6.4,
    cruxName: 'The leap',
    heightFt: 32,
    line: 'Thirty feet up, a leap across a gap you’d walk round on land. The guidebook says V6.',
    trueGrade: 7,
  });
  const pTide2 = dws('poverhang', 'Overhanging Tide', 7, 'power', {
    moves: 10,
    from: 5.6,
    to: 7.8,
    cruxName: 'The roof',
    heightFt: 30,
    line: 'A roof over the sea. Your feet cut, the swell comes in, and you hang on anyway.',
  });
  const pArete = dws('parete', 'Psicobloc Arête', 8, 'technical', {
    moves: 11,
    from: 6.8,
    to: 9.0,
    cruxName: 'The arête',
    heightFt: 38,
    line: 'The cove’s tall arête. The top is high enough that you think about the landing, even in water.',
  });
  const pDeep = dws('pdeep', 'The Deep End', 9, 'power', {
    moves: 12,
    from: 8.2,
    to: 10.4,
    cruxName: 'The last bulge',
    heightFt: 45,
    line: 'The tallest thing in the cove. The hard part is the top, and the drop is a long one.',
  });

  // Phase 18.6: Miller's Bluff, limestone on the back of a farm, never climbed: yours to buy,
  // bolt and name. Every line here is an open project, and none is there to climb till you've
  // bolted it (or cleaned it, a boulder); the names are what Ed Miller calls them.
  const bluffSport = (
    id: string,
    name: string,
    grade: number,
    type: Style,
    shape: Parameters<typeof librarySport>[5],
  ): RouteDef => ({ ...librarySport(id, name, grade, type, 'bluff', shape), open: true });
  const bBarn = bluffSport('bbarn', 'The barn wall', 7, 'crimp', {
    moves: 20,
    heightFt: 60,
    line: 'Grey limestone above the hay barn, edges all the way. Nobody has ever pulled on it.',
    rest: 11,
    a: { style: 'crimp', name: 'The first edges', from: 6.0, to: 8.2, win: 'Onto the ledge.' },
    b: { style: 'technical', name: 'The slab', from: 14.4, to: 16.6, win: 'Where the chains would go.' },
  });
  const bTufa = bluffSport('btufa', 'The tufa', 8, 'power', {
    moves: 22,
    heightFt: 70,
    line: 'A single tufa down the middle of the wall, like a drip of candle wax.',
    rest: 12,
    a: { style: 'power', name: 'The pinch', from: 7.2, to: 9.4, win: 'Round it.' },
    b: { style: 'endurance', name: 'The pump', from: 16.0, to: 19.0, win: 'Top.' },
  });
  const bCow = bluffSport('bcow', 'Cow corner', 10, 'technical', {
    moves: 24,
    heightFt: 70,
    line: 'The corner the cows shelter in, up into a groove that leans out at the top.',
    rest: 13,
    a: { style: 'technical', name: 'The groove', from: 8.0, to: 10.4, win: 'Bridged.' },
    b: { style: 'power', name: 'The lean', from: 17.6, to: 20.0, win: 'Over the lip.' },
  });
  const bPillar = bluffSport('bpillar', 'The pillar', 11, 'crimp', {
    moves: 26,
    heightFt: 80,
    line: 'A pillar stood off the wall, sharp on both edges.',
    rest: 14,
    a: { style: 'crimp', name: 'The edges', from: 8.4, to: 10.8, win: 'Onto the pillar.' },
    b: { style: 'technical', name: 'The arête', from: 18.6, to: 21.2, win: 'The top of it.' },
  });
  const bRoof = bluffSport('broof', 'The big roof', 13, 'power', {
    moves: 26,
    heightFt: 70,
    line: 'Fifteen feet of roof, sideways. Ed Miller says his grandfather sheltered under it in a storm.',
    rest: 12,
    a: { style: 'power', name: 'The roof', from: 7.6, to: 10.6, win: 'Out of it.' },
    b: { style: 'dyno', name: 'The lip', from: 18.0, to: 20.0, win: 'Stood up.' },
  });
  const bLong = bluffSport('blong', 'The long wall', 15, 'endurance', {
    moves: 30,
    heightFt: 90,
    line: 'The tallest stretch of the bluff, blank-looking from the field, holds when you’re on it.',
    rest: 16,
    a: { style: 'crimp', name: 'The blank bit', from: 9.0, to: 11.6, win: 'Through it.' },
    b: { style: 'endurance', name: 'Everything after', from: 21.0, to: 26.0, win: 'The top of the bluff.' },
  });
  const bHay = libraryBoulder('bhay', 'The hay bale', 6, 'technical', 'bluff', {
    moves: 6,
    from: 2.8,
    to: 4.2,
    cruxName: 'The slab',
    heightFt: 11,
    line: 'A square block in the field that the farm kids call the hay bale.',
    open: true,
  });
  const bTrough = libraryBoulder('btrough', 'The trough', 9, 'crimp', 'bluff', {
    moves: 7,
    from: 3.4,
    to: 5.0,
    cruxName: 'The rim',
    heightFt: 12,
    line: 'Beside the cattle trough, a leaning face of small, sharp edges.',
    open: true,
  });
  const bSilo = libraryBoulder('bsilo', 'The silo stone', 12, 'dyno', 'bluff', {
    moves: 6,
    from: 3.2,
    to: 4.6,
    cruxName: 'The jump',
    heightFt: 16,
    line: 'The tall stone by the old silo: two good holds a long way apart.',
    open: true,
  });

  // Phase 32.1: the Hollow, a slot canyon nobody has a topo for. Every line is an open project:
  // the first to send it names it. Until then they're only what you'd call them to someone who'd
  // never been. Three boulders on the canyon floor, two cracks, and two faces.
  const hollowOpen = (r: RouteDef): RouteDef => ({ ...r, open: true });
  const hCrow = libraryBoulder('hcrow', 'The crow traverse', 9, 'technical', 'hollow', {
    moves: 9,
    from: 3.6,
    to: 5.4,
    cruxName: 'The blank bit',
    heightFt: 8,
    line: 'A low traverse along the canyon floor, under the ledge the crows use.',
    open: true,
  });
  const hStone = libraryBoulder('hstone', 'The headstone boulder', 10, 'crimp', 'hollow', {
    moves: 7,
    from: 3.2,
    to: 4.8,
    cruxName: 'The edges',
    heightFt: 12,
    line: 'A leaning block behind the headstones. Whoever was here climbed around them, never on them.',
    open: true,
  });
  const hGap = libraryBoulder('hgap', 'The gap', 12, 'dyno', 'hollow', {
    moves: 6,
    from: 3.0,
    to: 4.4,
    cruxName: 'The jump',
    heightFt: 14,
    line: 'Two good holds either side of the slot, and nothing between them but air.',
    open: true,
  });
  const hSplit = hollowOpen(
    libraryTrad('hsplit', 'The split', 8, 'crack', 'hollow', {
      moves: 22,
      heightFt: 70,
      line: 'A crack that splits the canyon wall top to bottom, hands all the way.',
      rest: 11,
      a: { style: 'crack', name: 'The flare', from: 6.4, to: 8.6, win: 'Locked in.' },
      b: { style: 'endurance', name: 'The long hands', from: 15.0, to: 18.0, win: 'The rim.' },
    }),
  );
  const hCorner = hollowOpen(
    libraryTrad('hcorner', 'The black corner', 10, 'crack', 'hollow', {
      moves: 24,
      heightFt: 80,
      line: 'A corner streaked black where the water runs, with a seam in the back of it.',
      rest: 12,
      a: { style: 'crack', name: 'The seam', from: 7.0, to: 9.4, win: 'Out of the seam.' },
      b: { style: 'power', name: 'The roof', from: 17.0, to: 19.6, win: 'Over it.' },
    }),
  );
  const hWall = hollowOpen(
    librarySport('hwall', 'The sunless wall', 9, 'crimp', 'hollow', {
      moves: 22,
      heightFt: 70,
      line: 'A smooth wall the sun never reaches, small edges all the way up.',
      rest: 11,
      a: { style: 'crimp', name: 'The edges', from: 6.2, to: 8.4, win: 'On the ledge.' },
      b: { style: 'technical', name: 'The slab above', from: 15.6, to: 17.8, win: 'The rim.' },
    }),
  );
  const hLean = hollowOpen(
    librarySport('hlean', 'The leaning wall', 11, 'power', 'hollow', {
      moves: 24,
      heightFt: 70,
      line: 'Where the canyon narrows, one wall leans out over the other.',
      rest: 12,
      a: { style: 'power', name: 'The lean', from: 7.4, to: 9.8, win: 'Through it.' },
      b: { style: 'endurance', name: 'The pump', from: 17.2, to: 20.2, win: 'Top.' },
    }),
  );

  const pitchList: RouteDef[] = [
    ...pitches('golden', 'stone', [
      ['Friction Slab', 7, 'technical', 'slab'],
      ['The Long Corner', 8, 'endurance', 'corner'],
      ['Golden Crimps', 9, 'crimp', 'face'],
      ['The Bulge', 8, 'power', 'roof'],
      ['Exit Cracks', 7, 'endurance', 'crack'],
    ]),
    ...pitches('obsidian', 'stone', [
      ['Black Dihedral', 11, 'crimp', 'corner'],
      ['Glass Slab', 12, 'technical', 'slab'],
      ['The Obsidian Roof', 13, 'power', 'roof'],
      ['The Leap', 12, 'dyno', 'face'],
      ['Pumpfest', 11, 'endurance', 'crack'],
      ['Razor Traverse', 12, 'crimp', 'traverse'],
      ['Tower Headwall', 11, 'endurance', 'face'],
    ]),
    ...pitches('ascendant', 'stone', [
      ['The Approach Pitch', 14, 'endurance', 'chimney'],
      ['Hairline', 15, 'crimp', 'crack'],
      ['The Mirror', 16, 'technical', 'slab'],
      ['The Great Roof', 16, 'power', 'roof'],
      ['The Leap of Faith', 17, 'dyno', 'face'],
      ['The Ascendant Crux', 18, 'crimp', 'traverse'],
      ['The Headwall', 16, 'endurance', 'crack'],
      ['Summit Block', 15, 'power', 'face'],
    ]),
  ];

  const walls: Record<string, WallDef> = {
    golden: {
      name: 'Golden Buttress',
      place: 'stone',
      grade: 9,
      pitches: pitchList.filter((r) => r.wall === 'golden').map((r) => r.id),
      line: 'Five pitches of golden granite. Most people spend a night on it.',
    },
    obsidian: {
      name: 'Obsidian Tower',
      place: 'stone',
      grade: 13,
      pitches: pitchList.filter((r) => r.wall === 'obsidian').map((r) => r.id),
      line: 'Seven pitches of black rock, a roof in the middle, and a leap nobody likes.',
    },
    ascendant: {
      name: 'The Ascendant',
      place: 'stone',
      grade: 18,
      pitches: pitchList.filter((r) => r.wall === 'ascendant').map((r) => r.id),
      line: 'Eight pitches, the hardest in the valley, and the sixth is the hardest thing anyone’s done.',
    },
  };

  const lines: Record<string, RouteDef> = {
    marete: mArete,
    mmantel: mMantel,
    megg: mEgg,
    mhueco: mHueco,
    msplitter: mSplitter,
    mroof: mRoof,
    mopen: mOpen,
    mspire: mSpire,
    mmoon: mMoon,
    svarnish: sVarnish,
    scrimps: sCrimps,
    sprow: sProw,
    ssplit: sSplit,
    spowerhouse: sPowerhouse,
    smega: sMega,
    sopen: sOpen,
    sdlap: sLap,
    senduro: sEnduro,
    sbiglink: sLink,
    sdtrad: sTrad,
    bbase: bBase,
    bwarm: bWarm,
    bsplit: bSplit,
    btrad: bTrad,
    bclassic: bClassic,
    bmeadow: bMeadow,
    berratic: bErratic,
    bproject: bProject,
    bapron: bApron,
    walpine: wAlpine,
    wdiamond: wDiamond,
    woffwidth: wOffwidth,
    wthin: wThin,
    wopen: wOpen,
    wglacier: wGlacier,
    wskyline: wSkyline,
    wastroman: wAstro,
    wtrad: wTrad,
    creckoning: cReckoning,
    cvise: cVise,
    capparition: cApparition,
    canvil: cAnvil,
    chorizon: cHorizon,
    cgenesis: cGenesis,
    ccrux: cCrux,
    clifeline: cLifeline,
    cthreshold: cThreshold,
    cmyth: cMyth,
    ptide: pTide,
    pplunge: pPlunge,
    pslab: pSlab,
    pbarnacle: pBarnacle,
    pleap: pLeap,
    poverhang: pTide2,
    parete: pArete,
    pdeep: pDeep,
    bbarn: bBarn,
    btufa: bTufa,
    bcow: bCow,
    bpillar: bPillar,
    broof: bRoof,
    blong: bLong,
    bhay: bHay,
    btrough: bTrough,
    bsilo: bSilo,
    hcrow: hCrow,
    hstone: hStone,
    hgap: hGap,
    hsplit: hSplit,
    hcorner: hCorner,
    hwall: hWall,
    hlean: hLean,
  };

  return { lines, pitches: pitchList, walls };
}
