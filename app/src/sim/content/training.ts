// Training protocols, as data: where each is done, what it costs, what it trains and how
// hard it is on you. training.ts turns them into sessions. Six of v0.956's sixteen, one or
// two for each thing climbing can't give you on demand, and prehab.

import type { Style } from '../climber';
import type { Skills } from '../types';

export interface ProtocolDef {
  name: string;
  // The van (with a hangboard) or the gym (with a pass).
  where: 'van' | 'gym';
  // What it costs: minutes, energy, food, skin.
  min: number;
  energy: number;
  fed: number;
  skin: number;
  // Each skill's share of the session's lesson.
  trains: Partial<Skills>;
  // What it's hard on, for the injury roll: a style's risk (LOAD.typeRisk) and injury names.
  style: Style;
  // Load against a go of the same energy: a max hang is short and brutal, ARC is gentle.
  intensity: number;
  // The train sheet's line under it.
  what: string;
}

export const PROTOCOLS: Record<string, ProtocolDef> = {
  maxhangs: {
    name: 'Max hangs',
    where: 'van',
    min: 40,
    energy: 10,
    fed: 4,
    skin: 2,
    trains: { fingers: 1, power: 0.25 },
    style: 'crimp',
    intensity: 1.4,
    what: 'Ten seconds on the smallest edge you can hold, and a long wait between.',
  },
  repeaters: {
    name: 'Repeaters',
    where: 'van',
    min: 45,
    energy: 12,
    fed: 5,
    skin: 3,
    trains: { fingers: 0.6, endurance: 0.6 },
    style: 'crimp',
    intensity: 1.1,
    what: 'Seven on, three off, until the edge wins.',
  },
  pullups: {
    name: 'Pull-ups and core',
    where: 'van',
    min: 40,
    energy: 10,
    fed: 5,
    skin: 1,
    trains: { power: 1, technique: 0.2 },
    style: 'power',
    intensity: 1,
    what: 'Off the board’s jugs, then leg raises until the van rocks.',
  },
  campus: {
    name: 'Campus board',
    where: 'gym',
    min: 40,
    energy: 14,
    fed: 5,
    skin: 4,
    trains: { power: 1, fingers: 0.5 },
    style: 'power',
    intensity: 1.5,
    what: 'Rungs, no feet. The fastest way to strong, and to a pulley.',
  },
  fourbyfours: {
    name: '4x4s',
    where: 'gym',
    min: 60,
    energy: 14,
    fed: 6,
    skin: 5,
    trains: { endurance: 1, power: 0.4 },
    style: 'endurance',
    intensity: 1.2,
    what: 'Four problems, four times, no rest. The last lap is the point.',
  },
  arc: {
    name: 'ARC laps',
    where: 'gym',
    min: 60,
    energy: 8,
    fed: 5,
    skin: 4,
    trains: { endurance: 0.6, technique: 0.6 },
    style: 'endurance',
    intensity: 0.6,
    what: 'Easy traversing, never pumped, for as long as it takes to get bored.',
  },
};

// Prehab: bands, wrist curls, antagonists. No lesson, less risk for a week.
export const PREHAB = { name: 'Prehab', min: 30, energy: 3, fed: 2 };
