// Phase 25.6: a word from a stranger in the crowd at a crag. The pool, of the lines true
// today, walked by the seed, a few a day: the nth stranger you stop by today hears the next.

import { walk } from './ambient';
import { holds } from './cond';
import { CROWD, CROWD_DONE, CROWD_PER_DAY } from './content/crowd';
import { KIN_CROWD } from './content/kin';
import { RENOWN_CROWD } from './content/renown';
import { fill } from './format';
import type { GameState } from './types';

// Phase 28.4: the crew's renown in it too, by name. Phase 31.3: and whose kid you are.
export function crowdLine(s: GameState, n: number): string {
  if (n >= CROWD_PER_DAY) return CROWD_DONE;
  const pool = [...CROWD, ...RENOWN_CROWD, ...KIN_CROWD]
    .filter((l) => !l.when || holds(s, l.when))
    .map((l) => l.text);
  return fill(walk(s.seed, 'crowd', pool, s.day * CROWD_PER_DAY + n), {
    crew: s.crewName?.name ?? 'the crew',
    forebear: s.family?.forebear ?? '',
  });
}
