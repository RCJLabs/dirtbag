// Phase 45: the problem of the day's date, from this device's calendar or the page's address.
import { describe, expect, it } from 'vitest';
import { dayParam, localDate } from './day';

describe('the day’s date', () => {
  it('is this device’s own, up to its midnight', () => {
    expect(localDate(new Date(2026, 9, 19, 0, 0))).toBe('2026-10-19');
    expect(localDate(new Date(2026, 9, 19, 23, 59))).toBe('2026-10-19');
    expect(localDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('is today’s for ?day, the one asked for when it’s on the calendar, and none otherwise', () => {
    const now = new Date(2026, 9, 19, 9, 30);
    expect(dayParam('?day', now)).toBe('2026-10-19');
    expect(dayParam('?day=', now)).toBe('2026-10-19');
    expect(dayParam('?day=2026-10-05', now)).toBe('2026-10-05');
    expect(dayParam('?day=2028-02-29', now)).toBe('2028-02-29');
    expect(dayParam('?day=2026-02-29', now)).toBe('2026-10-19');
    expect(dayParam('?day=next-tuesday', now)).toBe('2026-10-19');
    expect(dayParam('', now)).toBeNull();
    expect(dayParam('?gate=try', now)).toBeNull();
  });
});
