// Your kit, as data: what each thing is, and how the state keeps it. A number per item in
// `GameState.gear`: condition 0..100 for what wears, uses left for what runs out, 1 for
// what you just own. Nothing here decides a go; climb.ts and game.ts read the kit.
import { HIGHBALL, KIT, UPGRADE, WINTER } from '../dials';

const less = (share: number) => `${Math.round((1 - share) * 100)}% less`;

export type GearKind = 'wears' | 'uses' | 'owned';

export interface GearDef {
  name: string;
  kind: GearKind;
  // The You page's line about it.
  what: string;
}

export const GEAR: Record<string, GearDef> = {
  shoes: { name: 'Shoes', kind: 'wears', what: 'Worn rubber makes every crux tighter, footwork most.' },
  chalk: {
    name: 'Chalk',
    kind: 'uses',
    what: `A block is ${KIT.chalk.uses} goes. Without it, every crux is tighter.`,
  },
  tape: { name: 'Tape', kind: 'uses', what: `A crack takes ${less(KIT.tape.skin)} skin through tape.` },
  pad: { name: 'A second pad', kind: 'owned', what: `Highball landings: ${less(HIGHBALL.pads)} risk.` },
  rope: { name: 'A rope', kind: 'owned', what: 'Seventy metres and a harness. Walls need your own.' },
  hangboard: {
    name: 'A hangboard',
    kind: 'owned',
    what: 'Over the van’s back doors. Fingers and pulling, on a rainy day.',
  },
  rack: { name: 'A rack', kind: 'owned', what: 'Cams, nuts and slings. What you place is what catches you.' },
  // Phase 22.6c.
  headlamp: {
    name: 'A headlamp',
    kind: 'owned',
    what: 'The walk out after dark, with the trail in front of you.',
  },
  // Phase 22.2c: the van's upgrades, fitted at the garage, and the heater's propane.
  bed: {
    name: 'A real bed',
    kind: 'owned',
    what: `+${UPGRADE.bed.energy} energy after every night in the van.`,
  },
  curtains: {
    name: 'Blackout curtains',
    kind: 'owned',
    what: `Tickets at the Lot ${less(UPGRADE.curtains.tickets)} likely.`,
  },
  toolkit: {
    name: 'A tool kit',
    kind: 'owned',
    what: `A roadside bodge holds ${Math.round(UPGRADE.toolkit.bodge * 10)} times in 10.`,
  },
  tuneup: { name: 'A tune-up', kind: 'owned', what: `${less(UPGRADE.tuneup.gas)} gas on every drive.` },
  heater: {
    name: 'A diesel heater',
    kind: 'owned',
    what: 'No cold on a winter night, while there’s propane. A tank a night.',
  },
  insulation: {
    name: 'Insulation',
    kind: 'owned',
    what: `${less(UPGRADE.insulation.cold)} cold on a winter night.`,
  },
  kitchen: {
    name: 'A camp kitchen',
    kind: 'owned',
    what: 'A stove at the van, and the recipes the market sells for.',
  },
  propane: {
    name: 'Propane',
    kind: 'uses',
    what: `Winter nights of heat, ${WINTER.propane.nights} to a tank.`,
  },
};

// The van's upgrades, in the order the garage offers them.
export const UPGRADES = ['bed', 'curtains', 'toolkit', 'tuneup', 'heater', 'insulation', 'kitchen'] as const;
export type UpgradeId = (typeof UPGRADES)[number];

// What a new climber has: the shoes they drove out in, and half a bag of chalk.
export const START_KIT: Record<string, number> = { shoes: KIT.shoes.startAt, chalk: KIT.chalk.startWith };
