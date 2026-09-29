// Your kit, as data: what each thing is, and how the state keeps it. A number per item in
// `GameState.gear`: condition 0..100 for what wears, uses left for what runs out, 1 for
// what you just own. Nothing here decides a go; climb.ts and game.ts read the kit.
import { HIGHBALL, KIT } from '../dials';

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
};

// What a new climber has: the shoes they drove out in, and half a bag of chalk.
export const START_KIT: Record<string, number> = { shoes: KIT.shoes.startAt, chalk: KIT.chalk.startWith };
