// Phase 19.4: the last few moves, for the error screen's report: in order, as the state stood,
// walking folded into one line, no more than TRAIL of them, and no name the player typed.
import { describe, expect, it } from 'vitest';
import { newGame } from '../sim';
import { moveOf, Moves, TRAIL } from './trail';

describe('a move, as a line', () => {
  it('says its kind and its fields', () => {
    expect(moveOf({ t: 'act', act: 'cafe.coffee' })).toBe('act act=cafe.coffee');
    expect(moveOf({ t: 'comp', do: 'enter' })).toBe('comp do=enter');
  });

  it('leaves out any name the player typed', () => {
    expect(moveOf({ t: 'create', name: 'Wren', start: 'technician' })).toBe('create name=… start=technician');
    expect(moveOf({ t: 'name', route: 'rsopen', name: 'Hers Now', call: 0 })).toBe(
      'name route=rsopen name=… call=0',
    );
    expect(moveOf({ t: 'nameCrew', name: 'The Gorge Rats' })).not.toContain('Gorge Rats');
  });
});

describe('the trail', () => {
  const s = { ...newGame('trail'), day: 12, min: 9 * 60 + 5 };

  it('keeps the last moves, as the state stood, with the seed and where', () => {
    const m = new Moves();
    m.push(s, { t: 'act', act: 'cafe.coffee' });
    const t = m.trail({ ...s, min: 10 * 60 });
    expect(t).toMatchObject({ seed: s.seed, day: 12, min: 600, at: s.at });
    expect(t.moves).toEqual(['day 12 9:05 AM: act act=cafe.coffee']);
  });

  it('folds a walk into its last step', () => {
    const m = new Moves();
    for (let x = 0; x < 30; x++) m.push(s, { t: 'stand', x });
    m.push(s, { t: 'act', act: 'cafe.coffee' });
    m.push(s, { t: 'stand', x: 5 });
    expect(m.trail(s).moves).toEqual([
      'day 12 9:05 AM: stand x=29',
      'day 12 9:05 AM: act act=cafe.coffee',
      'day 12 9:05 AM: stand x=5',
    ]);
  });

  it('keeps no more than its few', () => {
    const m = new Moves();
    for (let i = 0; i < TRAIL + 5; i++) m.push({ ...s, day: i }, { t: 'act', act: 'cafe.coffee' });
    const moves = m.trail(s).moves;
    expect(moves).toHaveLength(TRAIL);
    expect(moves[0]).toMatch(/^day 5 /);
  });
});
