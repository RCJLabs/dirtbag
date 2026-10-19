// Phase 20.1: what's new since the version that last wrote your save.
import { describe, expect, it } from 'vitest';
import { newer, newsSince, type News } from './news';
import { NEWS } from './news.full';

const notes: News[] = [
  { version: '0.999.108', text: 'c' },
  { version: '0.999.86', text: 'b' },
  { version: '0.999.20', text: 'a' },
];
const of = (ns: News[]) => ns.map((n) => n.version);

describe('what’s new', () => {
  it('orders versions part by part', () => {
    expect(newer('0.999.108', '0.999.86')).toBe(true);
    expect(newer('0.999.86', '0.999.108')).toBe(false);
    expect(newer('1.0.0', '0.999.200')).toBe(true);
    expect(newer('0.999.86', '0.999.86')).toBe(false);
  });

  it('shows what came since the save’s version, newest first and at most three, none past this build', () => {
    expect(of(newsSince('0.999.33', '0.999.108', 3, notes))).toEqual(['0.999.108', '0.999.86']);
    expect(of(newsSince('0.999.86', '0.999.108', 3, notes))).toEqual(['0.999.108']);
    expect(newsSince('0.999.108', '0.999.108', 3, notes)).toEqual([]);
    expect(of(newsSince('0.999.33', '0.999.100', 3, notes))).toEqual(['0.999.86']);
    // A save that doesn't say which version wrote it: the newest only.
    expect(of(newsSince('', '0.999.108', 3, notes))).toEqual(['0.999.108']);
    // From Settings, read again: the latest, up to the count.
    expect(of(newsSince('0', '0.999.108', 2, notes))).toEqual(['0.999.108', '0.999.86']);
  });

  it('has notes, each one Play would take', () => {
    expect(NEWS.length).toBeGreaterThan(0);
    for (const n of NEWS) expect([...n.text].length).toBeLessThanOrEqual(500);
  });
});
