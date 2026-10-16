// Phase 14.2: a save as a file, named for who and when, and read back by the rules any save
// loads by.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { newGame, SAVE_VERSION, toSave } from '../sim';
import { readSave, saveFileName } from './savefile';

const V75 = readFileSync(new URL('../sim/fixtures/save-v75.json', import.meta.url), 'utf8');
const named = (name: string, day: number) => {
  const s = newGame('x');
  return { ...s, day, climber: { ...s.climber, name } };
};

describe('a save as a file', () => {
  it('is named for the climber and the day, in a name any system takes', () => {
    expect(saveFileName(named('Robin', 12))).toBe('dirtbag-robin-day-12.json');
    expect(saveFileName(named('Jo Ann  O’Neil', 3))).toBe('dirtbag-jo-ann-o-neil-day-3.json');
    expect(saveFileName(named('', 1))).toBe('dirtbag-climber-day-1.json');
  });

  it('reads back what was written, and an old one migrated as any save is', async () => {
    const s = named('Robin', 12);
    const r = await readSave(new Blob([toSave(s, 'test')]));
    expect(r).toMatchObject({ ok: true, state: s });
    const old = await readSave(new Blob([V75]));
    expect(old.ok && old.from).toBe(75);
    expect(SAVE_VERSION).toBeGreaterThan(75);
  });

  it('refuses what is not a save, with why', async () => {
    expect(await readSave(new Blob(['{"trunc']))).toEqual({ ok: false, why: 'not JSON' });
    expect(await readSave(new Blob(['{"hello":"there"}']))).toEqual({ ok: false, why: 'not a Dirtbag save' });
    expect(await readSave(new Blob([new Uint8Array(5 * 1024 * 1024)]))).toEqual({
      ok: false,
      why: 'too big to be a save',
    });
  });
});
