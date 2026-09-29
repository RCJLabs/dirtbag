// The send card's words: the line as it goes by, how and when it went, and whose it is.
import { describe, expect, it } from 'vitest';
import { emptyLog, newGame } from '../sim/game';
import type { GameState, RouteLog } from '../sim/types';
import { cardFile, cardOf, cardText } from './card';

const sent = (day: number, go: number, style: 'onsight' | 'flash' | 'redpoint'): RouteLog => ({
  ...emptyLog(),
  goes: go + 2,
  hi: 24,
  sent: { day, go, style },
});
const robin = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('card'),
  climber: {
    name: 'Robin',
    start: 'allrounder',
    skills: { power: 10, fingers: 10, endurance: 10, technique: 10, head: 10 },
  },
  ...over,
});

describe('the send card', () => {
  it('says the line, how it went on your first send, and where and when', () => {
    const c = cardOf(robin({ routes: { pump: sent(18, 6, 'redpoint') } }), 'pump')!;
    expect(c).toMatchObject({
      name: 'The Pump',
      grade: '5.12a',
      style: 'Redpoint, go 6',
      where: 'Roadside Crag',
      when: 'Day 18, winter',
      who: 'Robin',
      fa: null,
    });
    expect(cardText(c)).toBe('The Pump, 5.12a. Redpoint, go 6. Roadside Crag, day 18, winter.');
    expect(cardFile(c)).toBe('dirtbag-the-pump.png');
    expect(cardOf(robin({ routes: { warm: sent(2, 1, 'flash') } }), 'warm')?.style).toBe('Flash');
  });

  it('has nothing for a line you haven’t sent', () => {
    expect(cardOf(robin(), 'pump')).toBeNull();
    expect(cardOf(robin({ routes: { pump: { ...emptyLog(), goes: 4, hi: 20 } } }), 'pump')).toBeNull();
  });

  it('carries a first ascent: your name for it and your call, or who got there first', () => {
    const mine = cardOf(
      robin({
        routes: { rsopen: sent(30, 4, 'redpoint') },
        firsts: { rsopen: { name: 'Glovebox Money', call: 1, day: 30 } },
      }),
      'rsopen',
    )!;
    expect(mine).toMatchObject({ name: 'Glovebox Money', grade: 'V8', fa: { mine: true, by: 'Robin' } });
    const theirs = cardOf(
      robin({
        routes: { rsopen: sent(33, 9, 'redpoint') },
        firsts: { rsopen: { name: 'Sandbag Supreme', by: 'dex', call: 0, day: 31 } },
      }),
      'rsopen',
    )!;
    expect(theirs.fa).toEqual({ mine: false, by: 'Dex Calloway' });
    expect(cardFile({ ...mine, name: 'Arête ¡Ya!' })).toBe('dirtbag-arete-ya.png');
  });
});
