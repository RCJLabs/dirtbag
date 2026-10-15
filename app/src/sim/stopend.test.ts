// Phase 30.4 (criterion 2): careers that end at 30 and at 45 both read right. The epilogue says
// when it ended and how, and a late bloomer who chose the day didn't run out of time.
import { describe, expect, it } from 'vitest';
import { dayAtAge } from './ageing';
import { HOME_FOR_GOOD, LATE_CHOSE, ORIGIN_END, STOP_END } from './content/epilogue';
import { AGEING } from './dials';
import { epilogue } from './epilogue';
import { fill } from './format';
import { act, newGame } from './game';
import type { GameState } from './types';

const ended = (age: number, forced: boolean, origin?: string, home?: true): GameState => {
  const s = act(newGame('stop'), { t: 'create', name: 'Kit', start: 'allrounder', origin }).state;
  const day = dayAtAge(s, age);
  return { ...s, day, life: { ...s.life, retired: { day, forced, ...(home ? { home } : {}) } } };
};
const texts = (s: GameState) => epilogue(s).map((l) => l.text);

describe('the epilogue’s last word on when it ended', () => {
  it('says a career stopped at 30 stopped young, by choice', () => {
    const t = texts(ended(30, false));
    expect(30).toBeLessThan(AGEING.power.from);
    expect(t).toContain(fill(STOP_END.early, { age: 30 }));
    expect(t.join(' ')).not.toMatch(/body made the call|ran out of time/);
  });

  it('says a career the body ended at 45 was the body’s call', () => {
    const t = texts(ended(45, true));
    expect(t).toContain(fill(STOP_END.body, { age: 45 }));
  });

  it('says a stop chosen once the years had started was chosen', () => {
    expect(texts(ended(38, false))).toContain(fill(STOP_END.chose, { age: 38 }));
  });

  it('gives a late bloomer who chose the day the line for it, and one the body ended its own', () => {
    const chose = texts(ended(30, false, 'late'));
    expect(chose).toContain(LATE_CHOSE);
    expect(chose).not.toContain(ORIGIN_END.late);
    expect(texts(ended(45, true, 'late'))).toContain(ORIGIN_END.late);
  });

  it('leaves going home to its own line, and says nothing of a career still going', () => {
    const home = texts(ended(32, false, undefined, true));
    expect(home).toContain(HOME_FOR_GOOD);
    expect(home.some((x) => x.startsWith('You hung it up'))).toBe(false);
    const going = act(newGame('stop'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
    expect(texts(going).some((x) => x.includes('hung it up') || x.includes('made the call'))).toBe(false);
  });

  it('is said from the rules, with no number of its own', () => {
    for (const t of [...Object.values(STOP_END), LATE_CHOSE]) expect(t).not.toMatch(/\d/);
  });
});
