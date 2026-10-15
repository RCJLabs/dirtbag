// Phase 34.1: the perks a job's rank brings (Evan's call: on the jobs there are). Each is a
// dial (PERKS): the job, the rank it comes with, and its share off a price. Read off your
// rank, never kept: a perk is yours while the rank is.

import { INDOOR } from './content/gym';
import { JOBS, PERK_SAYS } from './content/jobs';
import { PERKS } from './dials';
import { fill } from './format';
import { rankAt } from './jobs';
import type { GameState } from './types';

export type PerkId = keyof typeof PERKS;
const IDS = Object.keys(PERKS) as PerkId[];

export const hasJobPerk = (s: GameState, id: PerkId): boolean => rankAt(s, PERKS[id].job) >= PERKS[id].from;

// What a perk leaves of a price: all of it, or what's left after its share off.
export const perkMult = (s: GameState, id: PerkId): number => (hasJobPerk(s, id) ? 1 - PERKS[id].off : 1);

// A share off, in words: "20% off", or "on the house".
export const offWords = (off: number): string =>
  off >= 1 ? 'on the house' : `${Math.round(off * 100)}% off`;

// A perk, said: what it is, from its dial.
export const perkSays = (id: PerkId): string => fill(PERK_SAYS[id]!, { off: offWords(PERKS[id].off) });

// The perks a job's ranks bring, in rank order.
export const jobPerks = (job: string): PerkId[] =>
  IDS.filter((id) => PERKS[id].job === job).sort((a, b) => PERKS[a].from - PERKS[b].from);

// A job's perks for its row: what you have of them, and the next, with the rank it takes.
export function perksNote(s: GameState, job: string): string {
  const all = jobPerks(job);
  const held = all.filter((id) => hasJobPerk(s, id));
  const next = all.find((id) => !hasJobPerk(s, id));
  const parts = [
    held.length ? `Perks: ${held.map(perkSays).join('; ')}` : '',
    next ? `At ${JOBS[job]!.ranks[PERKS[next].from]}, ${perkSays(next)}` : '',
  ];
  return parts.filter(Boolean).join('. ');
}

// The day passes a setter's rank puts in your pocket each morning.
export function perkPasses(s: GameState): string[] {
  if (hasJobPerk(s, 'everyGym')) return Object.values(INDOOR).map((i) => i.pass);
  return hasJobPerk(s, 'sendCity') ? [INDOOR.gym!.pass] : [];
}
