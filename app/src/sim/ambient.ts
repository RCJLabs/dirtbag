// The lines players read most (Phase 17.7): a night at the fire said by whoever's there, and
// a send said back by whoever was with you. Each pool, or the open part of it, is shuffled
// once by the seed and walked in order, so a line doesn't come round again till the rest have.

import { FIRE_LINES, LEDGE_LINES, SEND_CHEERS } from './content/ambient';
import { FIRE_TALK } from './dials';
import { atFire } from './fire';
import { Rng } from './rng';
import type { GameState } from './types';

// The kth line of a pool, walking a seeded shuffle of it.
export function walk(seed: string, key: string, pool: readonly string[], k: number): string {
  const order = pool.map((_, i) => i);
  const r = Rng.fromStream(seed, 'events').derive(`ambient-${key}`);
  for (let i = order.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return pool[order[k % pool.length]!]!;
}

// What a night at the fire comes to, said by one of whoever's there (a different one some
// nights), or null with nobody to say it. Lines open a week at a time (FIRE_TALK), and one
// you haven't heard comes before any you have; `fresh` says to count it heard.
export function fireLine(s: GameState): { who: string; text: string; fresh: boolean } | null {
  const here = atFire(s).filter((w) => FIRE_LINES[w]);
  const who = here[s.day % Math.max(1, here.length)];
  if (!who) return null;
  const pool = FIRE_LINES[who]!;
  const log = s.people[who];
  const known = Math.max(0, s.day - (log?.since ?? 1));
  const open = Math.min(pool.length, FIRE_TALK.open + Math.floor(known / FIRE_TALK.every));
  const heard = log?.heard ?? 0;
  if (log && heard < open) return { who, text: pool[heard]!, fresh: true };
  const k = Math.floor(s.day / Math.max(1, here.length));
  return { who, text: walk(s.seed, `fire-${who}`, pool.slice(0, open), k), fresh: false };
}

// What someone says when you send with them there; the pool walked a line a send.
export function sendCheer(s: GameState, who: string): string | null {
  const pool = SEND_CHEERS[who];
  if (!pool) return null;
  const sends = Object.values(s.routes).filter((l) => l.sent).length;
  return walk(s.seed, `send-${who}`, pool, sends);
}

// A night on the portaledge, said by whoever's up there with you: theirs in order till you've
// heard them all, then walked a night at a time; `fresh` says to count it heard.
export function ledgeLine(s: GameState, who: string | null): { text: string; fresh: boolean } | null {
  const pool = who ? LEDGE_LINES[who] : undefined;
  if (!who || !pool) return null;
  const heard = s.people[who]?.ledge ?? 0;
  if (s.people[who] && heard < pool.length) return { text: pool[heard]!, fresh: true };
  return { text: walk(s.seed, `ledge-${who}`, pool, s.day), fresh: false };
}
