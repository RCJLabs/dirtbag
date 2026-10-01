import { describe, expect, it } from 'vitest';
import { bodyNote, clock, clockShort, costLabel, duration, fill, money, wallNote } from './format';

describe('format', () => {
  it('writes clock times the way the HUD shows them', () => {
    expect(clock(7 * 60 + 40)).toBe('7:40 AM');
    expect(clock(12 * 60)).toBe('12:00 PM');
    expect(clock(0)).toBe('12:00 AM');
    expect(clock(24 * 60 + 30)).toBe('12:30 AM');
    expect(clockShort(14 * 60)).toBe('2 PM');
    expect(clockShort(7 * 60 + 10)).toBe('7:10 AM');
  });

  it('writes durations, money and price tags from the numbers', () => {
    expect(duration(20)).toBe('20 min');
    expect(duration(300)).toBe('5 h');
    expect(duration(70)).toBe('1 h 10 min');
    expect(money(-12)).toBe('−$12');
    expect(costLabel({ min: 300, cash: 52 })).toBe('5 h · +$52');
    expect(costLabel({ min: 20, cash: -2 })).toBe('20 min · $2');
    expect(costLabel({ min: 60, cash: -12 }, 'gas')).toBe('1 h · $12 gas');
    expect(bodyNote({ energy: -25, skin: -8 })).toBe('−25 energy · −8 skin');
    expect(bodyNote({ energy: 15 })).toBe('+15 energy');
    expect(wallNote({ day: true, energy: -10 })).toBe('The day goes · −10 energy');
    expect(wallNote({ food: -1 })).toBe('−1 day of food and water');
    expect(wallNote({ pitch: -2, bond: 1, psyche: 4 }, 'Hazel')).toBe(
      '−2 pitches fixed · +4 psyche · +1 bond with Hazel',
    );
    expect(bodyNote({ fed: 50, energy: 4 })).toBe('+50 food · +4 energy');
  });

  it('fills values and plurals, and leaves unknown names alone', () => {
    expect(fill("{goes} {goes|go|goes} today. How's the skin?", { goes: 1 })).toBe(
      "1 go today. How's the skin?",
    );
    expect(fill('{goes} {goes|go|goes}', { goes: 3 })).toBe('3 goes');
    expect(fill('Gas, {cash}. {nope}', { cash: '$12' })).toBe('Gas, $12. {nope}');
  });
});
