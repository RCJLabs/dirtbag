// Phase 19.1: the gate. Off, everyone plays the full game and every climber here is marked as
// here before it; its first start marks whoever wasn't, then remembers it has; a climber after
// that plays the demo's rules till the game's unlocked, on the full game's keys throughout.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asDemo, asDemoBuild, DEMO, newGame, toSave } from '../sim';
import { boot, save } from './persist';
import { keepIn } from './storage';
import { GATE, keepUnlock, openGate, opened, unlockIn } from './unlock';

// A Storage over a Map, as the browser's localStorage behaves; `full` turns writes away.
function storage(entries: Record<string, string> = {}): Storage & { m: Map<string, string>; full: boolean } {
  const m = new Map(Object.entries(entries));
  const s = {
    m,
    full: false,
    get length() {
      return m.size;
    },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (s.full) throw new Error('QuotaExceededError');
      m.set(k, String(v));
    },
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  };
  return s;
}

const named = (name: string) =>
  toSave({ ...newGame(name), day: 30, climber: { ...newGame(name).climber, name } }, '0.0.0-test');
const career = JSON.stringify({
  name: 'Robin Vance',
  skills: { power: 180, fingers: 220, endurance: 150, technique: 170, head: 90 },
});
const off = { gate: false, desktop: false, legacy: null };
const on = { gate: true, desktop: false, legacy: null };

beforeEach(() => {
  vi.stubGlobal('__APP_VERSION__', '0.0.0-test');
});
afterEach(() => {
  asDemo(false);
  keepIn(undefined);
  vi.unstubAllGlobals();
});

describe('the gate, off (until launch)', () => {
  it('is off in this build', () => {
    expect(GATE).toBe(false);
  });

  it('marks a climber here as here before it, and no one else', () => {
    const empty = storage();
    expect(opened(empty, off)).toBeNull();
    expect(empty.m.size).toBe(0);

    const unnamed = storage({ 'dirtbag.save': toSave(newGame('x'), '0.0.0-test') });
    expect(opened(unnamed, off)).toBeNull();
    expect(unlockIn(unnamed)).toBeNull();

    const robin = storage({ 'dirtbag.save': named('Robin') });
    expect(opened(robin, off)).toBe('before');
    expect(unlockIn(robin)).toBe('before');
    // Nothing's marked as gated: the gate hasn't started.
    expect(robin.m.has('dirtbag.gate')).toBe(false);
  });

  it('counts a v0.956 career, and the morning before a save that won’t load', () => {
    const legacy = storage({ 'dirtbag-save-v3': career });
    const ls = storage();
    expect(opened(ls, { ...off, legacy })).toBe('before');
    expect(unlockIn(ls)).toBe('before');

    const prev = storage({ 'dirtbag.save': 'not a save', 'dirtbag.save.prev': named('Sam') });
    expect(opened(prev, off)).toBe('before');
  });

  it('plays the full game for everyone, marked or not', () => {
    vi.stubGlobal('window', { localStorage: storage() });
    asDemo(true);
    expect(openGate(false)).toBeNull();
    expect(DEMO).toBe(false);
  });
});

describe('the gate, on (at launch)', () => {
  it('lets a climber from before it through, on its first start', () => {
    const ls = storage({ 'dirtbag.save': named('Robin') });
    expect(opened(ls, on)).toBe('before');
    expect(ls.m.get('dirtbag.gate')).toBe('1');
    // And every start after.
    expect(opened(ls, on)).toBe('before');
  });

  it('lets a v0.956 career through on its first start', () => {
    const ls = storage();
    expect(opened(ls, { ...on, legacy: storage({ 'dirtbag-save-v3': career }) })).toBe('before');
  });

  it('keeps one marked while it was off, even with the climber gone', () => {
    const ls = storage({ 'dirtbag.save': named('Robin') });
    opened(ls, off);
    ls.removeItem('dirtbag.save');
    ls.setItem('dirtbag.gate', '1');
    expect(opened(ls, on)).toBe('before');
  });

  it('locks a climber started after its first start', () => {
    const ls = storage();
    expect(opened(ls, on)).toBeNull();
    expect(ls.m.get('dirtbag.gate')).toBe('1');
    ls.setItem('dirtbag.save', named('Kit'));
    expect(opened(ls, on)).toBeNull();
    expect(unlockIn(ls)).toBeNull();
  });

  it('marks nothing it can’t keep the unlock for, so the next start looks again', () => {
    const ls = storage({ 'dirtbag.save': named('Robin') });
    ls.full = true;
    expect(opened(ls, on)).toBe('before');
    expect(ls.m.has('dirtbag.gate')).toBe(false);
    ls.full = false;
    expect(opened(ls, on)).toBe('before');
    expect(unlockIn(ls)).toBe('before');
  });

  it('marks no one after it, even under a build from before the flip', () => {
    const ls = storage();
    opened(ls, on);
    ls.setItem('dirtbag.save', named('Kit'));
    expect(opened(ls, off)).toBeNull();
    expect(opened(ls, on)).toBeNull();
  });

  it('takes an unlock it remembers, and nothing that only looks like one', () => {
    const ls = storage({ 'dirtbag.gate': '1' });
    for (const junk of ['yes', '{}', '{"how":"desktop"}', '{"how":"bought"}']) {
      ls.setItem('dirtbag.unlock', junk);
      expect(opened(ls, on), junk).toBeNull();
    }
    expect(keepUnlock(ls, 'play')).toBe(true);
    expect(opened(ls, on)).toBe('play');
  });

  it('opens the desktop’s full edition, writing nothing', () => {
    const ls = storage();
    expect(opened(ls, { ...on, desktop: true })).toBe('desktop');
    expect(ls.m.size).toBe(0);
  });

  it('locks a store that won’t read', () => {
    const ls = storage();
    ls.getItem = () => {
      throw new Error('SecurityError');
    };
    expect(opened(ls, on)).toBeNull();
    expect(opened(null, on)).toBeNull();
  });
});

describe('the locked full game', () => {
  it('keeps the full game’s keys, so the climber carries on once it’s unlocked', () => {
    const ls = storage();
    vi.stubGlobal('window', { localStorage: ls });
    asDemo(true);
    const kit = { ...newGame('kit'), climber: { ...newGame('kit').climber, name: 'Kit' } };
    expect(save(kit)).toBe(true);
    expect([...ls.m.keys()]).toEqual(['dirtbag.save']);
    asDemo(false);
    expect(boot(() => 'x').state.climber.name).toBe('Kit');
  });

  it('leaves the demo’s build the demo', () => {
    vi.stubGlobal('window', { localStorage: storage({ 'dirtbag.save': named('Robin') }) });
    asDemoBuild(true);
    try {
      expect(openGate(false)).toBeNull();
      expect(DEMO).toBe(true);
    } finally {
      asDemoBuild(false);
    }
  });
});
