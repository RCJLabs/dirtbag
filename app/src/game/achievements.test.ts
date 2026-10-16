// Phase 14.4: the Record Book as Steam achievements: one each, names Steam takes, everything a
// family has earned, and the list for the Steamworks site kept in step with the book.
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { newGame, RECORD } from '../sim';
import { earnedEver, steamAchievements, steamName } from './achievements';

const LIST = new URL('../../../desktop/steam/achievements.json', import.meta.url);

describe('the Record Book on Steam', () => {
  it('names each entry once, in a name Steam takes', () => {
    const names = steamAchievements().map((a) => a.name);
    expect(names).toHaveLength(RECORD.length);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(n).toMatch(/^[A-Z0-9_]{1,64}$/);
    expect(steamName('firstsend')).toBe('FIRSTSEND');
  });

  it('counts what an heir’s forebears earned on the save as earned', () => {
    const s = newGame('x');
    const heir = {
      ...s,
      record: { flash: 40 },
      family: {
        gen: 2,
        forebear: 'Robin',
        lines: [],
        coach: true,
        books: [{ name: 'Robin', record: { firstsend: 3, flash: 9 } }],
      },
    };
    expect(earnedEver(heir)).toEqual(['firstsend', 'flash']);
    expect(earnedEver(s)).toEqual([]);
  });

  // `WRITE=1 npx vitest run src/game/achievements.test.ts` rewrites it after the book changes.
  it('keeps the list for the Steamworks site in step with the book', () => {
    const want = `${JSON.stringify(steamAchievements(), null, 2)}\n`;
    if (process.env.WRITE) writeFileSync(LIST, want);
    expect(readFileSync(LIST, 'utf8')).toBe(want);
  });
});
