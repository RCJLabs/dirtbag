// Phase 15.2: what the error screen's report says, and what it doesn't take for a crash.
import { describe, expect, it } from 'vitest';
import { crashReport, notACrash } from './crash';

const where = { version: '1.2.3', demo: false, desktop: false, agent: 'Agent/1' };

describe('the crash report', () => {
  it('says the build, where it runs, and the error', () => {
    const e = new TypeError('cannot read the topo');
    const r = crashReport(e, where).split('\n');
    expect(r[0]).toBe('Dirtbag 1.2.3, web');
    expect(r[1]).toBe('Agent/1');
    expect(r[3]).toBe('TypeError: cannot read the topo');
    expect(r.length).toBeLessThanOrEqual(4 + 12);
  });

  it('names the demo and the desktop', () => {
    expect(crashReport(new Error('x'), { ...where, demo: true, desktop: true }).split('\n')[0]).toBe(
      'Dirtbag 1.2.3 (demo), desktop',
    );
  });

  it('ends on where the game was and the last moves, when it can say', () => {
    const trail = {
      seed: 'dirtbag-abc',
      day: 34,
      min: 14 * 60 + 20,
      at: 'road',
      moves: ['day 34 2:10 PM: go route=rswarm'],
    };
    const r = crashReport(new Error('x'), where, trail).split('\n');
    expect(r.slice(-3)).toEqual([
      'Day 34, 2:20 PM, at road; seed dirtbag-abc',
      'Last moves:',
      'day 34 2:10 PM: go route=rswarm',
    ]);
    expect(crashReport(new Error('x'), where, null)).not.toContain('Last moves');
  });

  it('takes a thrown string as well as an Error', () => {
    expect(crashReport('the van caught fire', where)).toContain('Error: the van caught fire');
  });

  it('keeps the browser’s resize notice and another site’s script off the screen', () => {
    expect(notACrash('ResizeObserver loop completed with undelivered notifications.', null)).toBe(true);
    expect(notACrash('Script error.', null)).toBe(true);
    expect(notACrash('Script error.', new Error('ours'))).toBe(false);
    expect(notACrash('Uncaught TypeError: x is undefined', new TypeError('x is undefined'))).toBe(false);
  });
});
