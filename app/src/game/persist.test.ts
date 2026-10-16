// The save rules v0.956 broke, checked against a fake localStorage: a bad save is moved
// aside and never overwritten, the day before is there to fall back on, and a browser
// that won't store anything still starts a game.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, asDemo, newGame, toSave } from '../sim';
import { loadPlans, savePlans } from './plan';
import { boot, DEFAULT_SETTINGS, demoClimber, replace, save, saveSettings } from './persist';
import { keepIn } from './storage';

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
afterEach(() => {
  keepIn(undefined);
  vi.unstubAllGlobals();
});

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

  // Phase 14.2: a save from a file takes this one's place.
  it('puts a save from a file in place, keeping the one it replaced, with no fallback to it', () => {
    const kit = { ...newGame('x'), day: 3 };
    save({ ...kit, day: 2 });
    save(kit);
    expect(ls.data.has('dirtbag.save.prev')).toBe(true);
    const robin = { ...newGame('y'), day: 12 };
    expect(replace(robin)).toBe(true);
    expect(boot(seed).state).toEqual(robin);
    expect(JSON.parse(ls.data.get('dirtbag.save.replaced')!).state.day).toBe(3);
    // The day before was Kit's: a broken save must never fall back to somebody else.
    expect(ls.data.has('dirtbag.save.prev')).toBe(false);
    ls.broken = true;
    expect(replace(kit)).toBe(false);
  });

  // Phase 14.2: the desktop build keeps the game's keys in a store of its own.
  it('keeps the save and the plan wherever the game is told to, and nothing in the browser', () => {
    const own = new FakeStorage();
    keepIn(own as unknown as Storage);
    const s = { ...newGame('x'), day: 5 };
    expect(save(s)).toBe(true);
    expect(savePlans({ plan: [], yesterday: [] })).toBe(true);
    expect(boot(seed).state).toEqual(s);
    expect([...own.data.keys()].sort()).toEqual(['dirtbag.plan', 'dirtbag.save']);
    expect(ls.data.size).toBe(0);
    expect(loadPlans()).toEqual({ plan: [], yesterday: [] });
  });

  it('keeps the demo’s keys apart, and never sees the full game’s climber there', () => {
    const full = { ...newGame('full'), day: 40, climber: { ...newGame('full').climber, name: 'Robin' } };
    ls.setItem('dirtbag.save', toSave(full, '0.0.0-test'));
    asDemo(true);
    try {
      expect(boot(seed).state.day).toBe(1);
      const demo = { ...newGame('demo'), day: 20, climber: { ...newGame('demo').climber, name: 'Kit' } };
      expect(save(demo)).toBe(true);
      expect(saveSettings(DEFAULT_SETTINGS)).toBe(true);
      expect(savePlans({ plan: [], yesterday: [] })).toBe(true);
      expect([...ls.data.keys()].sort()).toEqual([
        'dirtbag.demo.plan',
        'dirtbag.demo.save',
        'dirtbag.demo.settings',
        'dirtbag.save',
      ]);
      // The full game's climber is where it was, untouched.
      expect(ls.getItem('dirtbag.save')).toBe(toSave(full, '0.0.0-test'));
      // The demo finds no demo climber to carry on with: it's the demo.
      expect(demoClimber()).toBeNull();
    } finally {
      asDemo(false);
    }
    // The full game finds its own climber, and the demo's beside it to carry on with.
    expect(boot(seed).state.climber.name).toBe('Robin');
    expect(demoClimber()?.climber.name).toBe('Kit');
  });

  it('offers no demo climber that isn’t one', () => {
    expect(demoClimber()).toBeNull();
    ls.setItem('dirtbag.demo.save', 'not a save');
    expect(demoClimber()).toBeNull();
    ls.setItem('dirtbag.demo.save', toSave(newGame('nobody'), '0.0.0-test'));
    expect(demoClimber()).toBeNull();
  });
});
