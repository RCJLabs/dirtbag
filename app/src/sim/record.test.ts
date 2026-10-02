// Phase 23.1: the Record Book. Every feat, milestone and story card v0.956 had is in it,
// merged, each moment once; what's built is earned from what the game keeps, once, on the
// day it's first true, and one moment gives one card.
import { describe, expect, it } from 'vitest';
import { RECORD, V0956_RECORD } from './content/record';
import { act, newGame } from './game';
import { OPEN_RECORD, aimEarned, newlyEarned } from './record';
import type { GameState } from './types';

const fresh = (): GameState => act(newGame('book'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;

describe('the record book', () => {
  it('holds every feat, milestone and story card v0.956 had, each once', () => {
    const from = RECORD.flatMap((r) => r.from);
    for (const [book, ids] of Object.entries(V0956_RECORD))
      for (const id of ids) expect(from.filter((f) => f === `${book}:${id}`)).toHaveLength(1);
    expect(new Set(RECORD.map((r) => r.id)).size).toBe(RECORD.length);
  });

  it('gives every entry it can hold a story and an aim; the rest say what they wait for', () => {
    for (const r of RECORD) {
      if (r.waits) expect(r.aim).toBeUndefined();
      else {
        expect(r.aim).toBeDefined();
        expect(r.story.length).toBeGreaterThan(40);
        expect(r.story).not.toMatch(/[{}]/);
      }
    }
    expect(OPEN_RECORD.length).toBeGreaterThan(20);
  });

  it('is empty for a new climber', () => {
    expect(fresh().record).toEqual({});
    expect(newlyEarned(fresh())).toEqual([]);
  });

  it('earns from what the game keeps, once, on the day, and one moment is one card', () => {
    let s = fresh();
    s = { ...s, cash: 999 };
    expect(aimEarned(s, { cash: 1000 })).toBe(false);
    // A dollar over the line, then anything you do puts it in the book, on that day.
    const s2 = act({ ...s, cash: 1001, day: 7 }, { t: 'stand', x: 200 }).state;
    expect(s2.record.grand).toBe(7);
    // Once: it stays on the day it went in.
    const s3 = act({ ...s2, day: 9 }, { t: 'stand', x: 200 });
    expect(s3.state.record.grand).toBe(7);
    expect(s3.events.some((e) => e.k === 'record')).toBe(false);
    // Several at once: one event, all of them.
    const many = act({ ...s, cash: 6000, day: 60 }, { t: 'stand', x: 200 });
    const ev = many.events.filter((e) => e.k === 'record');
    expect(ev).toHaveLength(1);
    expect(ev[0]?.k === 'record' && ev[0].ids).toEqual(expect.arrayContaining(['grand', 'loaded', 'year']));
  });

  it('counts a walk-in as a shift, and a year as 56 days', () => {
    const s = fresh();
    expect(aimEarned({ ...s, today: ['worked'] }, { shift: true })).toBe(true);
    expect(aimEarned({ ...s, day: 56 }, { day: 56 })).toBe(false);
    expect(aimEarned({ ...s, day: 57 }, { day: 56 })).toBe(true);
  });
});
