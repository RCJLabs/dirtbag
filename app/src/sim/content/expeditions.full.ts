// The expeditions' objectives (Phase 24), the full game's only: the demo's build takes
// expeditions.demo.ts instead (Phase 14.5b, build/demo.ts).
import type { ExpeditionDef } from './expeditions';

export const EXPEDITION_DEFS: Record<string, ExpeditionDef> = {
  elcap: {
    name: 'El Capitan',
    region: 'Yosemite, USA',
    objective: 'The Nose',
    grade: 9,
    gradeReq: 7,
    pitches: 6,
    days: 10,
    stormOdds: 0.18,
    cost: 900,
    pays: 2400,
    blurb:
      'Three thousand feet of golden granite, the most famous big wall on Earth. A week living on portaledges.',
    thin: 0.6,
    out: 1,
    home: 1,
    getThere: 'A day’s drive to the Valley, and the haul bags up to the base of the Nose.',
    line: [
      ['Sickle Ledge', 7, 'endurance'],
      ['The Stovelegs', 8, 'crack'],
      ['The King Swing', 8, 'dyno'],
      ['The Great Roof', 9, 'technical'],
      ['The Changing Corners', 9, 'technical'],
      ['Up to the Bolt Ladder', 8, 'endurance'],
    ],
  },
  cerrotorre: {
    name: 'Cerro Torre',
    region: 'Patagonia, Argentina',
    // Evan's call (1 Oct 2026): the Compressor's line, climbed by fair means since its bolt
    // ladder was chopped in 2012.
    objective: 'the Southeast Ridge',
    grade: 12,
    gradeReq: 10,
    pitches: 8,
    days: 16,
    stormOdds: 0.44,
    cost: 2200,
    pays: 6000,
    blurb:
      'A fang of rime ice in the worst weather on the planet. You will wait out storms, and the good days are everything.',
    // No ice climbing in the game (Evan's call): rock pitches, narrowed by the cold and wind.
    thin: 0.65,
    melt: true,
    out: 2,
    home: 2,
    getThere: 'Two days of flights to El Chaltén, then the walk in under the Torre glacier.',
    line: [
      ['The Col of Patience', 10, 'endurance'],
      ['The Ice Towers', 11, 'crack'],
      ['The Rime Corners', 11, 'technical'],
      ['The Traverse', 11, 'technical'],
      ['The Headwall', 12, 'crack'],
      ['Where the Bolts Were', 12, 'crimp'],
      ['The Last Cracks', 12, 'crack'],
      ['The Mushroom', 11, 'endurance'],
    ],
  },
  trango: {
    name: 'Trango Tower',
    region: 'Karakoram, Pakistan',
    objective: 'Eternal Flame',
    grade: 14,
    gradeReq: 12,
    pitches: 11,
    days: 24,
    stormOdds: 0.56,
    cost: 4500,
    pays: 12000,
    blurb:
      'A twenty-thousand-foot granite spire at the edge of the world. Weeks in, and one shot at the top.',
    thin: 0.65,
    melt: true,
    out: 8,
    home: 6,
    getThere:
      'Three days of flights and a jeep to Skardu, then five days up the Baltoro, acclimatizing as you go.',
    line: [
      ['The Approach Gully', 11, 'endurance'],
      ['The Lower Cracks', 12, 'crack'],
      ['The Ramp', 12, 'technical'],
      ['The Snow Ledge', 12, 'endurance'],
      ['The Splitter', 13, 'crack'],
      ['The Pendulum', 13, 'dyno'],
      ['The Crux', 14, 'technical'],
      ['The Upper Cracks', 13, 'crack'],
      ['The Ice Chimney', 13, 'endurance'],
      ['The Headwall', 14, 'crimp'],
      ['The Summit Block', 13, 'power'],
    ],
  },
};
