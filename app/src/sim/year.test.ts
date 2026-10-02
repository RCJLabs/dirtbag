// Phase 23.7: the year. A recap the day each 56-day year ends, from what the game already
// keeps; and the Homecoming, once a life, once enough people are close.
import { describe, expect, it } from 'vitest';
import { indoor } from './content/gym';
import { ROUTES } from './content/routes';
import { BOND, HOME, YEAR } from './dials';
import { act, newGame } from './game';
import type { GameState } from './types';
import { homeCrowd, homeReady, recapLines, recapOf, yearsDone } from './year';

const made = (over: Partial<GameState> = {}) => ({
  ...act(newGame('year'), { t: 'create', name: 'Lee', start: 'allrounder' }).state,
  ...over,
});
const outside = Object.values(ROUTES).filter((r) => !indoor(r.place) && !r.exped);
const log = (day: number) => ({
  known: [],
  told: [],
  pick: {},
  falls: {},
  goes: 1,
  goesToday: 0,
  hi: 0,
  sent: { day, go: 1, style: 'redpoint' as const },
  sentToday: false,
});
const close = { bond: BOND.tiers[HOME.tier]!, last: 1 };

describe('the year', () => {
  it('is 56 days, and its recap comes the day the next begins, once', () => {
    expect(yearsDone(YEAR.days)).toBe(0);
    expect(yearsDone(YEAR.days + 1)).toBe(1);
    const s = { ...made(), day: YEAR.days + 1, at: 'lot', min: 9 * 60 };
    const r = act(s, { t: 'act', act: 'lot.rest' });
    expect(r.events.filter((e) => e.k === 'year')).toEqual([{ k: 'year', n: 1 }]);
    expect(r.state.year.recapped).toBe(1);
    const again = act({ ...r.state, min: 9 * 60 }, { t: 'act', act: 'lot.rest' });
    expect(again.events.some((e) => e.k === 'year')).toBe(false);
  });

  it('recaps a year from what happened in it, and only that', () => {
    const sorted = [...outside].sort((x, y) => x.grade - y.grade);
    const b = sorted.at(-1)!;
    const a = sorted.find((x) => x.grade < b.grade)!;
    const c = sorted.at(-2)!;
    const s = made({ day: 60, cash: 412, routes: { [a!.id]: log(10), [b!.id]: log(30), [c!.id]: log(58) } });
    const r = recapOf(s, 1);
    expect(r.sends).toBe(2);
    expect(r.hardest?.grade).toBe(b!.grade);
    const lines = recapLines(r);
    expect(lines[0]).toBe('2 lines sent.');
    expect(lines).toContain(`The hardest: ${b!.name}, V${b!.grade}, outside.`);
    expect(lines.at(-1)).toBe('$412 in hand.');
    expect(recapLines(recapOf(made(), 1))[0]).toBe('Nothing sent. Some years are like that.');
  });
});

describe('the Homecoming', () => {
  it('opens once enough people are close, counting people, not the diary', () => {
    expect(homeReady(made())).toBe(false);
    const one = made({ people: { hazel: close, sage: { bond: 0, last: 1 } } });
    expect(homeReady(one)).toBe(false);
    const two = made({ people: { hazel: close, sage: close } });
    expect(homeCrowd(two)).toEqual(['Hazel', 'Sage']);
    expect(homeReady(two)).toBe(true);
    expect(act(one, { t: 'home', arm: true }).events[0]?.k).toBe('refused');
  });

  it('pays once, on the next send outside after it’s armed, with who came', () => {
    const s = made({
      people: { hazel: close, sage: close },
      at: 'road',
      min: 9 * 60,
      energy: 100,
      climber: {
        name: 'Lee',
        start: 'allrounder',
        skills: { power: 30, fingers: 30, endurance: 30, technique: 30, head: 30 },
      },
    });
    const armed = act(s, { t: 'home', arm: true }).state;
    expect(armed.year.home).toBe('armed');
    expect(act(armed, { t: 'home', arm: false }).state.year.home).toBe('none');
    const r = ROUTES.warm!;
    const went = act(armed, { t: 'go', route: r.id });
    const sent = { sent: true, hi: r.moves, fellAt: null, tried: [], skin: 0 };
    const done = act(went.state, { t: 'done', route: r.id, result: sent });
    expect(done.events.find((e) => e.k === 'homecoming')).toEqual({
      k: 'homecoming',
      route: r.id,
      who: ['Hazel', 'Sage'],
    });
    expect(done.state.year.home).toBe(armed.day);
    expect(done.state.psyche.level).toBe(Math.min(100, went.state.psyche.level + HOME.psyche));
    // Once a life.
    expect(act(done.state, { t: 'home', arm: true }).events[0]?.k).toBe('refused');
  });
});
