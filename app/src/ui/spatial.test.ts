// Phase 14.1: a controller's moves, on boxes laid out the way the screens lay them.
import { describe, expect, it } from 'vitest';
import { nearest, type Box } from './spatial';

const b = (x: number, y: number, w = 40, h = 30): Box => ({ x, y, w, h });

describe('moving focus', () => {
  // A sheet's list: full-width rows, one under another.
  const rows = [b(10, 0, 300), b(10, 40, 300), b(10, 80, 300), b(10, 120, 300)];
  it('steps down and up a list a row at a time, and stops at either end', () => {
    expect(nearest(rows[0]!, rows, 'down')).toBe(1);
    expect(nearest(rows[1]!, rows, 'down')).toBe(2);
    expect(nearest(rows[2]!, rows, 'up')).toBe(1);
    expect(nearest(rows[3]!, rows, 'down')).toBe(-1);
    expect(nearest(rows[0]!, rows, 'up')).toBe(-1);
    // Nothing beside a full-width row.
    expect(nearest(rows[1]!, rows, 'left')).toBe(-1);
  });

  it('prefers what lies straight that way over what is a little nearer but off to the side', () => {
    const from = b(100, 100);
    const straight = b(100, 200);
    const aside = b(260, 170);
    expect(nearest(from, [from, aside, straight], 'down')).toBe(2);
  });

  it('never takes a button beside you as above or below you', () => {
    // A row of three, as a sheet's grade calls or a beta's choices sit.
    const three = [b(0, 50), b(60, 50), b(120, 50)];
    expect(nearest(three[1]!, three, 'right')).toBe(2);
    expect(nearest(three[1]!, three, 'left')).toBe(0);
    expect(nearest(three[1]!, three, 'down')).toBe(-1);
    expect(nearest(three[1]!, three, 'up')).toBe(-1);
  });

  it('crosses a scene to the next thing that way, the nearer first', () => {
    // The scene's things: tall boxes spread across the screen, the HUD a strip above.
    const hud = b(0, 0, 360, 30);
    const fire = b(40, 200, 80, 300);
    const van = b(160, 260, 120, 240);
    const hazel = b(300, 220, 50, 280);
    const all = [hud, fire, van, hazel];
    expect(nearest(fire, all, 'right')).toBe(2);
    expect(nearest(van, all, 'right')).toBe(3);
    expect(nearest(van, all, 'left')).toBe(1);
    expect(nearest(van, all, 'up')).toBe(0);
  });
});
