// Phase 15.4: each trailer beat is a save the game loads as it is, where the beat says, dry.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { conditionsAt, fromSave, PLACES, toSave } from '../sim';
import { BEATS } from './beats';

const raw = readFileSync(join(__dirname, '..', 'sim', 'fixtures', 'save-v75.json'), 'utf8');
const loaded = fromSave(raw);
if (!loaded.ok) throw new Error(`the fixture won't load: ${loaded.why}`);
const base = loaded.state;

describe('the trailer’s beats', () => {
  for (const b of BEATS)
    it(`${b.id}: loads as a save, at its place, dry and open`, () => {
      const s = b.make(base);
      const again = fromSave(toSave(s, 'test'));
      expect(again.ok).toBe(true);
      expect(PLACES[s.at]).toBeDefined();
      const c = conditionsAt(s.seed, s.day, s.at);
      expect(c.sky).not.toBe('rain');
      expect(c.closed).toBeNull();
      expect(s.climber.name).toBe(base.climber.name);
    });

  it('clears the line a send beat climbs, so its send is a first one', () => {
    const s = BEATS.find((b) => b.id === 'send')!.make(base);
    expect(s.routes.highball).toBeUndefined();
  });
});
