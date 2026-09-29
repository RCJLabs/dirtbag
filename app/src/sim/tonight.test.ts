// The van's "Tonight" says what sleeping will do; sleeping has to do exactly that.
import { describe, expect, it } from 'vitest';
import { act, newGame } from './game';
import { MONEY } from './dials';
import { tonight } from './tonight';
import type { GameState } from './types';

const bed = (s: GameState) => act({ ...s, at: 'lot', min: 18 * 60 }, { t: 'act', act: 'lot.sleep' }).state;

describe('tonight', () => {
  const base = { ...newGame('tonight'), at: 'lot', min: 18 * 60 };

  it('an ordinary night: the van spot, the morning’s cash, energy back, tomorrow’s sky', () => {
    const s = { ...base, day: 2, cash: 100, energy: 20 };
    const t = tonight(s);
    expect(t).toMatchObject({ spot: MONEY.vanSpot, rough: false, billsIn: 5, cash: 100 - MONEY.vanSpot });
    const m = bed(s);
    expect(m.cash).toBe(t.cash);
    expect(m.energy).toBe(Math.min(100, 20 + t.energy));
    expect(t.runway).toBeGreaterThan(0);
  });

  it('a seventh night: the week’s bills land too', () => {
    const s = { ...base, day: 7, cash: 100 };
    const t = tonight(s);
    expect(t.billsIn).toBe(0);
    expect(bed(s).cash).toBe(t.cash);
    expect(t.cash).toBe(100 - MONEY.vanSpot - MONEY.registration - MONEY.insurance);
  });

  it('a night the card won’t cover: the pullout, free and cold', () => {
    const s = { ...base, day: 3, cash: -MONEY.cardLimit + 5, energy: 10, fed: 10 };
    const t = tonight(s);
    expect(t).toMatchObject({ rough: true, spot: 0, hungry: true, runway: 0 });
    const m = bed(s);
    expect(m.cash).toBe(t.cash);
    expect(m.energy).toBe(10 + t.energy);
  });
});
