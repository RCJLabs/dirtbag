// Phase 14.6b: rebinding's rules.
import { describe, expect, it } from 'vitest';
import { bindKey, bindPad, buttonName, DEFAULT_BINDS, keyName, readBinds } from './binds';

describe('rebinding', () => {
  it('gives a role a button, and the role that had it the old one', () => {
    const b = bindPad(DEFAULT_BINDS, 'b', 2);
    expect(b.pad.b).toBe(2);
    expect(Object.values(b.pad)).not.toContain(1);
    const swapped = bindPad(DEFAULT_BINDS, 'a', 1);
    expect(swapped.pad).toMatchObject({ a: 1, b: 0 });
  });

  it('won’t take the D-pad, the right trigger or the guide button', () => {
    for (const i of [7, 12, 13, 14, 15, 16]) expect(bindPad(DEFAULT_BINDS, 'a', i)).toBe(DEFAULT_BINDS);
  });

  it('swaps keys among the roles read together, and lets J be the journal and a hand', () => {
    const b = bindKey(DEFAULT_BINDS, 'map', 'J');
    expect(b.keys).toMatchObject({ map: 'j', journal: 'm', right: 'j' });
    expect(bindKey(DEFAULT_BINDS, 'back', 'ArrowUp')).toBe(DEFAULT_BINDS);
    expect(bindKey(DEFAULT_BINDS, 'press', 'Enter')).toBe(DEFAULT_BINDS);
    expect(bindKey(DEFAULT_BINDS, 'back', 'q').keys.back).toBe('q');
  });

  it('keeps what’s kept, and falls back on anything broken', () => {
    const kept = bindKey(bindPad(DEFAULT_BINDS, 'b', 2), 'plan', 'o');
    expect(readBinds(JSON.parse(JSON.stringify(kept)))).toEqual(kept);
    expect(readBinds(undefined)).toEqual(DEFAULT_BINDS);
    expect(readBinds({ pad: { a: 1, b: 1 } }).pad).toEqual(DEFAULT_BINDS.pad);
    expect(readBinds({ pad: { a: 99 } }).pad.a).toBe(0);
    expect(readBinds({ keys: { map: 'p' } }).keys).toEqual(DEFAULT_BINDS.keys);
  });

  it('names the buttons as an Xbox pad or a Deck prints them, and the keys plainly', () => {
    expect([buttonName(4), buttonName(4, true), buttonName(9)]).toEqual(['LB', 'L1', 'Menu']);
    expect([keyName(' '), keyName('Escape'), keyName('m')]).toEqual(['Space', 'Esc', 'M']);
  });
});
