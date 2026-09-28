// The save rules v0.956 broke, checked against a fake localStorage: a bad save is moved
// aside and never overwritten, the day before is there to fall back on, and a browser
// that won't store anything still starts a game.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, newGame, toSave } from '../sim';
import { boot, save } from './persist';

class FakeStorage {
  data = new Map<string, string>();
  broken = false;
  getItem(k: string) {
    if (this.broken) throw new Error('SecurityError');
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (this.broken) throw new Error('QuotaExceededError');
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

let ls: FakeStorage;
const seed = () => 'test-seed';

beforeEach(() => {
  ls = new FakeStorage();
  vi.stubGlobal('window', { localStorage: ls });
  vi.stubGlobal('navigator', {});
  vi.stubGlobal('__APP_VERSION__', '0.0.0-test');
});
afterEach(() => vi.unstubAllGlobals());

describe('persist', () => {
  it('starts a new game when there is no save, and loads the one it wrote', () => {
    expect(boot(seed)).toEqual({ state: newGame('test-seed'), note: null });
    const s = act(newGame('x'), { t: 'act', act: 'lot.cook' }).state;
    expect(save(s)).toBe(true);
    expect(boot(seed)).toEqual({ state: s, note: null });
  });

  it('keeps the last save from an earlier day as a fallback', () => {
    const day1 = newGame('x');
    save(day1);
    save({ ...day1, min: day1.min + 30 });
    expect(ls.data.has('dirtbag.save.prev')).toBe(false);
    const day2 = { ...day1, day: 2 };
    save(day2);
    expect(JSON.parse(ls.data.get('dirtbag.save.prev')!).state.day).toBe(1);
  });

  it('moves a damaged save aside and falls back to the day before', () => {
    const day1 = newGame('x');
    save(day1);
    save({ ...day1, day: 2 });
    ls.data.set('dirtbag.save', '{"format":"dirtbag","v":1,"state":{"trunc');
    const b = boot(seed);
    expect(b.state.day).toBe(1);
    expect(b.note).toMatch(/wouldn't load \(not JSON\)/);
    const kept = [...ls.data.keys()].filter((k) => k.startsWith('dirtbag.save.corrupt.'));
    expect(kept).toHaveLength(1);
    expect(ls.data.get(kept[0]!)).toBe('{"format":"dirtbag","v":1,"state":{"trunc');
    expect(ls.data.has('dirtbag.save')).toBe(false);
  });

  it('starts fresh, keeping the damaged save, when there is nothing to fall back on', () => {
    ls.data.set('dirtbag.save', toSave({ ...newGame('x'), energy: 400 }, 'old'));
    const b = boot(seed);
    expect(b.state).toEqual(newGame('test-seed'));
    expect(b.note).toMatch(/invalid: energy/);
    expect([...ls.data.values()].some((v) => v.includes('"energy":400'))).toBe(true);
  });

  it('plays on when storage is off, and says a failed write failed', () => {
    ls.broken = true;
    const b = boot(seed);
    expect(b.state).toEqual(newGame('test-seed'));
    expect(b.note).toMatch(/won't keep a save/);
    expect(save(b.state)).toBe(false);
  });
});
