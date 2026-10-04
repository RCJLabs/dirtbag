// Phase 25.6: the shops' small talk. Each shop in town has its own pool, its old line in it;
// a line only when it's true; and none back before the rest have been round.
import { describe, expect, it } from 'vitest';
import { KEEPERS } from './content/keepers';
import { PLACES } from './content/places';
import { act, newGame } from './game';
import { keeperLine } from './keepers';
import type { GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('keepers'), { t: 'create', name: 'Robin', start: 'allrounder' }).state,
  ...over,
});

describe('the shops’ small talk', () => {
  it('gives each shop in town a pool with its own line in it', () => {
    for (const [id, pool] of Object.entries(KEEPERS)) {
      expect(PLACES[id], id).toBeTruthy();
      expect(pool.map((l) => l.text)).toContain(PLACES[id]!.here);
      expect(pool.filter((l) => !l.when).length, id).toBeGreaterThanOrEqual(6);
    }
    expect(keeperLine(base(), 'gorge')).toBeNull();
  });

  it('says a line only when it’s true', () => {
    const hurt = KEEPERS.clinic!.find((l) => l.when?.injured)!.text;
    const days = (s: GameState) =>
      Array.from({ length: 40 }, (_, d) => keeperLine({ ...s, day: d + 1 }, 'clinic'));
    expect(days(base())).not.toContain(hurt);
    const injured = base({
      injury: { kind: 'tweaked pulley', tier: 1, until: 99 },
    });
    expect(days(injured)).toContain(hurt);
  });

  it('doesn’t come back to a line till the rest have been round', () => {
    const s = base();
    const pool = KEEPERS.diner!.filter((l) => !l.when);
    // A dry, unhurt stretch outside winter, where the pool doesn't change under it.
    const run = Array.from({ length: 80 }, (_, d) => d + 15)
      .map((d) => ({ ...s, day: d }))
      .filter((x) => keeperLine(x, 'diner') !== null);
    const said = run.map((x) => keeperLine(x, 'diner')!);
    expect(new Set(said).size).toBeGreaterThanOrEqual(pool.length - 1);
  });
});
