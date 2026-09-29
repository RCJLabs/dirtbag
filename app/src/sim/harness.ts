// The balance harness: bots play whole seasons on the sim, and this reads the curves Phase
// 6's targets are written against. Pure like the rest of the sim; `npm run harness` prints
// the tables (harness/season.harness.ts).

import { humanHands, playDays, type BotRun, type Strategy } from './bot';
import { ACTS } from './content/places';
import { MONEY } from './dials';
import { Rng } from './rng';

// A day with no trips out: the van spot, two packets of ramen, and a seventh of the week's
// bills. Runway is how many of those days your cash covers without a shift.
export const BASE_BURN =
  MONEY.vanSpot + 2 * -(ACTS['lot.cook']!.cost.cash ?? 0) + (MONEY.registration + MONEY.insurance) / 7;

export interface SeasonOpts {
  start: string;
  strategy: Strategy;
  days: number;
  // Human-ish hands (seeded per go) or careful ones.
  human: boolean;
  reckless?: boolean;
}

export function season(seed: string, o: SeasonOpts): BotRun {
  let n = 0;
  return playDays(seed, {
    start: o.start,
    strategy: o.strategy,
    days: o.days,
    reckless: o.reckless,
    hands: o.human ? () => humanHands(Rng.fromStream(seed, 'session').derive(`bot-go-${n++}`)) : undefined,
  });
}

export const runway = (cash: number): number => Math.max(0, cash) / BASE_BURN;

export interface Checkpoint {
  day: number;
  grade: number;
  cash: number;
  runway: number;
  // Days worked in the seven days up to here.
  workDays: number;
  sends: number;
}

export function checkpoints(run: BotRun, at: number[]): Checkpoint[] {
  return at.map((day) => {
    const d = run.days[day - 1];
    if (!d) throw new Error(`the run ended before day ${day}`);
    const week = run.days.slice(Math.max(0, day - 7), day);
    return {
      day,
      grade: d.grade,
      cash: d.cash,
      runway: runway(d.cash),
      workDays: week.filter((w) => w.workMin > 0).length,
      sends: run.sends.filter((x) => Number(/^day (\d+)/.exec(x)?.[1]) <= day).length,
    };
  });
}

// The first day the bot tied into a line of this grade or harder, or null.
export const firstTry = (run: BotRun, grade: number): number | null =>
  run.days.find((d) => d.hardest >= grade)?.day ?? null;

// The first day an injury landed, or null.
export const firstInjury = (run: BotRun): number | null =>
  run.injuries.length ? Number(/^day (\d+)/.exec(run.injuries[0]!)?.[1]) : null;

// The first day there was nothing left within reach anywhere, or null.
export const contentOut = (run: BotRun): number | null =>
  run.days.find((d) => d.where === 'nothing')?.day ?? null;

export const median = (xs: number[]): number => {
  const a = [...xs].sort((x, y) => x - y);
  return a.length ? (a[Math.floor((a.length - 1) / 2)]! + a[Math.ceil((a.length - 1) / 2)]!) / 2 : NaN;
};
