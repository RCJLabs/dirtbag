// "Who's around" on a place card: who you'd find there when you got there, in words, and
// what that means for a belay or a spot.
import { describe, expect, it } from 'vitest';
import { newGame } from '../sim/game';
import { whereIs } from '../sim/presence';
import type { GameState } from '../sim/types';
import { whoAround } from './who';

const at = (over: Partial<GameState> = {}): GameState => ({ ...newGame('who'), ...over });

describe("who's around", () => {
  it('says who and till when, and that means a belayer and a spotter at a crag', () => {
    // Day one is prime: Hazel's at Roadside from 8 to 5, and at the Lot either side.
    expect(whoAround(at(), 'road', 8 * 60 + 10)).toEqual({
      at: 8 * 60 + 10,
      lines: ['Hazel, till 5 PM'],
      cover: 'A belayer and a spotter till 5 PM.',
    });
    expect(whoAround(at(), 'lot', 7 * 60 + 40).lines).toEqual(['Hazel, till 8 AM, and from 5 PM']);
    // No routes at the Lot, so nothing about belays.
    expect(whoAround(at(), 'lot', 7 * 60 + 40).cover).toBeNull();
    // Get there before anyone: the cover starts when Hazel does.
    expect(whoAround(at(), 'road', 7 * 60 + 30)).toMatchObject({
      lines: ['Hazel, from 8 AM till 5 PM'],
      cover: 'A belayer and a spotter from 8 AM till 5 PM.',
    });
  });

  it("calls someone you haven't met just someone", () => {
    const gym = whoAround(at({ day: 2 }), 'gym', 7 * 60 + 22);
    expect(gym.lines).toEqual(["Someone you haven't met, from 9 AM till 6 PM"]);
    const met = whoAround(at({ day: 2, people: { sage: { bond: 1, last: 0 } } }), 'gym', 7 * 60 + 22);
    expect(met.lines).toEqual(['Sage, from 9 AM till 6 PM']);
  });

  it('joins partners who overlap into one stretch of cover', () => {
    const sage = { bond: 3, last: 0, since: 2 };
    let d = 3;
    while (
      whereIs('who', 'sage', d, 10 * 60, sage) !== 'road' ||
      whereIs('who', 'hazel', d, 10 * 60) !== 'road'
    )
      d++;
    const w = whoAround(at({ day: d, people: { sage } }), 'road', 8 * 60 + 10);
    expect(w.lines).toEqual(['Hazel, till 5 PM', 'Sage, from 9 AM till 6 PM']);
    expect(w.cover).toBe('A belayer and a spotter till 6 PM.');
  });

  it("says when there's nobody to belay or spot you, and what that leaves", () => {
    expect(whoAround(at(), 'moon', 10 * 60)).toEqual({
      at: 10 * 60,
      lines: ['Nobody.'],
      cover: 'Nobody to belay you or spot you.',
    });
    // Crimp Cathedral is 16 ft: the Gorge wants a spotter as well as a belayer now.
    expect(whoAround(at(), 'gorge', 9 * 60).cover).toBe('Nobody to belay you or spot you.');
  });
});
