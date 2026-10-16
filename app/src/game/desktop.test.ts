// Phase 14.3: the desktop's file of keys, as the game's store sees it.
import { describe, expect, it } from 'vitest';
import { fileStorage, type Desktop } from './desktop';

const bridge = (start: Record<string, string> = {}) => {
  const file = { ...start };
  let full = false;
  let broken = false;
  const d: Desktop = {
    all: () => ({ ...file }),
    set: (k, v) => !broken && ((file[k] = v), true),
    remove: (k) => !broken && (delete file[k], true),
    fullscreen: (on) => (on === undefined ? full : (full = on)),
    quit: () => undefined,
    achieve: () => 0,
  };
  return { d, file, breakIt: () => (broken = true) };
};

describe('the desktop’s save file', () => {
  it('starts from what the file holds, and writes each change through to it', () => {
    const { d, file } = bridge({ 'dirtbag.save': 'old' });
    const s = fileStorage(d);
    expect(s.getItem('dirtbag.save')).toBe('old');
    s.setItem('dirtbag.save', 'new');
    s.setItem('dirtbag.plan', '[]');
    expect(file).toEqual({ 'dirtbag.save': 'new', 'dirtbag.plan': '[]' });
    expect(s.length).toBe(2);
    s.removeItem('dirtbag.plan');
    expect(file).toEqual({ 'dirtbag.save': 'new' });
    expect(s.getItem('dirtbag.plan')).toBeNull();
  });

  it('throws when the file won’t take a write, and keeps what it had', () => {
    const { d, breakIt } = bridge({ 'dirtbag.save': 'old' });
    const s = fileStorage(d);
    breakIt();
    expect(() => s.setItem('dirtbag.save', 'new')).toThrow();
    expect(s.getItem('dirtbag.save')).toBe('old');
  });
});
