// Phase 25.6: what's going on at a shop in town when you're there: a line from its keepers'
// pool, of the ones true today, walked by the seed a day at a time.

import { walk } from './ambient';
import { holds } from './cond';
import { KEEPERS } from './content/keepers';
import { RENOWN_KEEPERS } from './content/renown';
import { fill } from './format';
import type { GameState } from './types';

// Phase 28.4: the crew's renown among them, by name, once it's known in town.
export function keeperLine(s: GameState, place: string): string | null {
  const pool = [...(KEEPERS[place] ?? []), ...(RENOWN_KEEPERS[place] ?? [])]
    .filter((l) => !l.when || holds(s, l.when))
    .map((l) => l.text);
  return pool.length
    ? fill(walk(s.seed, `keeper-${place}`, pool, s.day), { crew: s.crewName?.name ?? 'the crew' })
    : null;
}
