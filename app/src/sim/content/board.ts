// The Board (Phase 23.6) [proposed numbers]: v0.956's café board, daily and weekly
// challenges and club jobs, one weekly board (Evan's call; the audit's "three boards with
// near-identical criteria" de-duplicated). Three jobs a week, drawn on the seed; each pays
// once, on its own, the moment it's done, and lapses with the week. Small cash, under the
// harness's no-farm target: a week's best board never pays two days of the worst shift.
//
// A grade job is pitched at you: `over` grades from the grade you climb when the board goes
// up, so it means the same at V2 as at V12.

import type { Style } from '../climber';

export type Crit =
  | { k: 'send' }
  | { k: 'grade'; over: number }
  | { k: 'outside' }
  | { k: 'outsideGrade'; over: number }
  | { k: 'type'; type: Style }
  | { k: 'train' }
  | { k: 'work' };

export interface BoardJob {
  title: string;
  crit: Crit;
  n: number;
  cash: number;
}

export const BOARD_JOBS: Record<string, BoardJob> = {
  volume: { title: 'Volume Week', crit: { k: 'send' }, n: 5, cash: 12 },
  big: { title: 'Big Week', crit: { k: 'send' }, n: 10, cash: 18 },
  step: { title: 'Step It Up', crit: { k: 'grade', over: -1 }, n: 3, cash: 14 },
  push: { title: 'Pushing Grades', crit: { k: 'grade', over: 0 }, n: 2, cash: 18 },
  rock: { title: 'Touch Real Rock', crit: { k: 'outside' }, n: 3, cash: 14 },
  real: { title: 'Something Real', crit: { k: 'outsideGrade', over: -1 }, n: 2, cash: 18 },
  crimp: { title: 'Skin in the Game', crit: { k: 'type', type: 'crimp' }, n: 3, cash: 12 },
  power: { title: 'Pure Power', crit: { k: 'type', type: 'power' }, n: 3, cash: 12 },
  dyno: { title: 'Send It', crit: { k: 'type', type: 'dyno' }, n: 2, cash: 14 },
  crack: { title: 'Crack Duty', crit: { k: 'type', type: 'crack' }, n: 2, cash: 14 },
  slab: { title: 'The Quiet Art', crit: { k: 'type', type: 'technical' }, n: 3, cash: 12 },
  endurance: { title: 'Marathon Week', crit: { k: 'type', type: 'endurance' }, n: 3, cash: 12 },
  train: { title: 'Put In the Work', crit: { k: 'train' }, n: 3, cash: 8 },
  work: { title: 'Make Rent', crit: { k: 'work' }, n: 3, cash: 8 },
};
