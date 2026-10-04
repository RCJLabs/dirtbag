// Phase 25.6: a word from the crowd at a crag: the lines true today, a few a day, none back
// before the rest have been round.
import { describe, expect, it } from 'vitest';
import { CROWD, CROWD_DONE, CROWD_PER_DAY } from './content/crowd';
import { crowdLine } from './crowdtalk';
import { act, newGame } from './game';
import type { GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('crowd'), { t: 'create', name: 'Robin', start: 'allrounder' }).state,
  ...over,
});

describe('the crowd at a crag', () => {
  it('has a few words a day, then goes back to climbing', () => {
    const s = base({ day: 30 });
    const day = Array.from({ length: CROWD_PER_DAY }, (_, n) => crowdLine(s, n));
    expect(new Set(day).size).toBe(CROWD_PER_DAY);
    expect(crowdLine(s, CROWD_PER_DAY)).toBe(CROWD_DONE);
  });

  it('says only what’s true, and recognizes you only once you’re good', () => {
    const fame = CROWD.filter((l) => l.when?.grade).map((l) => l.text);
    const said = (s: GameState) =>
      new Set(
        Array.from({ length: 60 }, (_, d) => d + 10).flatMap((d) =>
          [0, 1, 2, 3, 4].map((n) => crowdLine({ ...s, day: d }, n)),
        ),
      );
    const fresh = said(base());
    for (const t of fame) expect(fresh.has(t)).toBe(false);
    for (const t of fresh) expect(CROWD.some((l) => l.text === t)).toBe(true);
  });

  it('comes round to every everyday line in a fortnight of stopping by', () => {
    const s = base();
    const plain = CROWD.filter((l) => !l.when).map((l) => l.text);
    const heard = new Set(
      Array.from({ length: 14 }, (_, d) => d + 40).flatMap((d) =>
        [0, 1, 2, 3, 4].map((n) => crowdLine({ ...s, day: d }, n)),
      ),
    );
    for (const t of plain) expect(heard.has(t), t).toBe(true);
  });
});
