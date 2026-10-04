// Phase 25.6: a word from a stranger in the crowd at a crag. The pool, of the lines true
// today, walked by the seed, a few a day: the nth stranger you stop by today hears the next.

import { walk } from './ambient';
import { holds } from './cond';
import { CROWD, CROWD_DONE, CROWD_PER_DAY } from './content/crowd';
import type { GameState } from './types';

export function crowdLine(s: GameState, n: number): string {
  if (n >= CROWD_PER_DAY) return CROWD_DONE;
  const pool = CROWD.filter((l) => !l.when || holds(s, l.when)).map((l) => l.text);
  return walk(s.seed, 'crowd', pool, s.day * CROWD_PER_DAY + n);
}
