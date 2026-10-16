// Phase 14.1: a controller's state, frame by frame, turned into presses and moves.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Pad, PAD } from './pad';

let gp: {
  connected: boolean;
  mapping: string;
  axes: number[];
  buttons: { pressed: boolean; value: number }[];
};
const set = (b: keyof typeof PAD, on: boolean, value = on ? 1 : 0) => {
  gp.buttons[PAD[b]] = { pressed: on, value };
};

beforeEach(() => {
  gp = {
    connected: true,
    mapping: 'standard',
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
  };
  vi.stubGlobal('navigator', { getGamepads: () => [null, gp] });
});
afterEach(() => vi.unstubAllGlobals());

describe('a controller', () => {
  it('presses and lets go once each, and a trigger past half is a press', () => {
    const pad = new Pad();
    set('a', true);
    expect(pad.poll(0)).toEqual([{ k: 'down', b: 'a' }]);
    expect(pad.poll(0.016)).toEqual([]);
    set('a', false);
    expect(pad.poll(0.032)).toEqual([{ k: 'up', b: 'a' }]);
    set('rt', false, 0.6);
    expect(pad.poll(0.048)).toEqual([{ k: 'down', b: 'rt' }]);
  });

  it('reads each role from the button Settings gave it, and says which went down', () => {
    const pad = new Pad();
    pad.binds = { ...pad.binds, b: PAD.x };
    set('x', true);
    expect(pad.poll(0)).toEqual([{ k: 'down', b: 'b' }]);
    expect(pad.fresh).toEqual([PAD.x]);
    set('x', false);
    set('b', true);
    expect(pad.poll(0.016)).toEqual([{ k: 'up', b: 'b' }]);
    expect(pad.fresh).toEqual([PAD.b]);
  });

  it('doesn’t count a button given a role while it’s held as a press of it', () => {
    const pad = new Pad();
    set('x', true);
    expect(pad.poll(0)).toEqual([]);
    pad.binds = { ...pad.binds, b: PAD.x };
    expect(pad.poll(0.016)).toEqual([]);
    set('x', false);
    expect(pad.poll(0.032)).toEqual([]);
    set('x', true);
    expect(pad.poll(0.048)).toEqual([{ k: 'down', b: 'b' }]);
  });

  it('repeats a held direction after a beat, then quicker, like a held arrow key', () => {
    const pad = new Pad();
    set('down', true);
    const moves = (t: number) => pad.poll(t).filter((e) => e.k === 'move');
    expect(moves(0)).toEqual([{ k: 'move', dir: 'down', stick: false }]);
    expect(moves(0.2)).toEqual([]);
    expect(moves(0.41)).toHaveLength(1);
    expect(moves(0.5)).toEqual([]);
    expect(moves(0.55)).toHaveLength(1);
    set('down', false);
    expect(moves(0.6)).toEqual([]);
  });

  it('leans the stick across, holding the lean till it comes well back, and moves with it', () => {
    const pad = new Pad();
    gp.axes[0] = 0.8;
    expect(pad.poll(0)).toEqual([
      { k: 'lean', x: 1 },
      { k: 'move', dir: 'right', stick: true },
    ]);
    gp.axes[0] = 0.4;
    expect(pad.poll(0.1).filter((e) => e.k === 'lean')).toEqual([]);
    gp.axes[0] = 0.2;
    expect(pad.poll(0.2)).toEqual([{ k: 'lean', x: 0 }]);
  });

  it('lets go of everything held when it comes unplugged', () => {
    const pad = new Pad();
    set('a', true);
    gp.axes[0] = -0.9;
    pad.poll(0);
    gp.connected = false;
    expect(pad.poll(0.1)).toEqual([
      { k: 'up', b: 'a' },
      { k: 'lean', x: 0 },
    ]);
    expect(pad.poll(0.2)).toEqual([]);
  });
});
