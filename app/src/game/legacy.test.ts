// Reading a retired v0.956 career out of the browser, and keeping it whole.
import { describe, expect, it } from 'vitest';
import { findLegacy, legacyFile } from './legacy';

// A Storage over a Map, as the browser's localStorage behaves.
function storage(entries: Record<string, string>): Storage {
  const m = new Map(Object.entries(entries));
  return {
    get length() {
      return m.size;
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
  };
}

const career = {
  name: 'Robin Vance',
  day: 212,
  skills: { power: 180, fingers: 220, endurance: 150, technique: 170, head: 90 },
  needs: { cash: 3120 },
};

describe('a v0.956 career in this browser', () => {
  it('reads the one it was playing', () => {
    const got = findLegacy(storage({ 'dirtbag-save-v3': JSON.stringify(career) }));
    expect(got).toEqual({ name: 'Robin Vance', skills: career.skills, grade: 6 });
  });

  it('falls back to the manual save written last', () => {
    const older = { ...career, name: 'Old Robin' };
    const got = findLegacy(
      storage({
        'dirtbag-slot-0': JSON.stringify(older),
        'dirtbag-slot-0-meta': JSON.stringify({ savedAt: 100 }),
        'dirtbag-slot-2': JSON.stringify(career),
        'dirtbag-slot-2-meta': JSON.stringify({ savedAt: 900 }),
      }),
    );
    expect(got?.name).toBe('Robin Vance');
  });

  it('finds nothing where there’s no career, or only the rebuild’s own save', () => {
    expect(findLegacy(storage({}))).toBeNull();
    expect(findLegacy(storage({ 'dirtbag-whatsnew-seen': '0.956.0' }))).toBeNull();
    expect(findLegacy(storage({ 'dirtbag.save': '{}' }))).toBeNull();
    expect(findLegacy(storage({ 'dirtbag-save-v3': 'not json' }))).toBeNull();
    expect(findLegacy(null)).toBeNull();
  });

  it('keeps every key v0.956 kept, byte for byte, and none of the rebuild’s', () => {
    const raw = {
      'dirtbag-save-v3': JSON.stringify(career),
      'dirtbag-slot-1': 'whatever v0.956 wrote',
      'dirtbag-whatsnew-seen': '0.956.0',
      'dirtbag.save': '{"not":"theirs"}',
    };
    const file = JSON.parse(legacyFile(storage(raw), new Date('2026-10-01T09:00:00Z'))!);
    expect(file).toEqual({
      format: 'dirtbag-v0956-export',
      exported: '2026-10-01T09:00:00.000Z',
      keys: {
        'dirtbag-save-v3': raw['dirtbag-save-v3'],
        'dirtbag-slot-1': 'whatever v0.956 wrote',
        'dirtbag-whatsnew-seen': '0.956.0',
      },
    });
    expect(legacyFile(storage({ 'dirtbag.save': '{}' }))).toBeNull();
  });
});
