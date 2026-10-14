// Phase 28.3: favours, both ways (Evan's call: two owed, no third till you've done one back).
// You ask the crew for a shift covered, a rack or a ride; each of them asks back on their own
// clock, and a no costs bond. Two asks on one day can start the crew's falling-out.
import { describe, expect, it } from 'vitest';
import { FAVOUR_EVEN, FAVOUR_NO, FAVOUR_REPAID } from './content/favours';
import { needFor } from './climber';
import { CREW, FAVOUR } from './dials';
import { fill, money } from './format';
import { act, favourBlocked, newGame, talkStart } from './game';
import { favourAsk } from './favours';
import { has } from './kit';
import { whereNow } from './presence';
import type { Action, FavourAsk, GameState, PersonLog } from './types';

const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');
const play = (s: GameState, ...as: Action[]): GameState => {
  for (const a of as) {
    const r = act(s, a);
    if (refused(r)) throw new Error(JSON.stringify(r.events));
    s = r.state;
  }
  return s;
};
const lines = (r: ReturnType<typeof act>): string[] =>
  r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const pal = (bond: number, over: Partial<PersonLog> = {}): PersonLog => ({
  bond,
  last: 0,
  since: 1,
  talked: true,
  arc: 9,
  beatDay: 1,
  life: 9,
  ...over,
});
// A day nobody in the crew is away on a stint.
const DAY = 30;
const k = needFor(6);
const crew = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('favours'),
  day: DAY,
  min: 9 * 60,
  cash: 200,
  climber: {
    name: 'Kit',
    start: 'allrounder',
    skills: { power: k, fingers: k, endurance: k, technique: k, head: k },
  },
  people: { hazel: pal(6), mara: pal(5), rico: pal(4) },
  crewName: { name: 'Gorge Rats', day: 3 },
  ...over,
});
const ask = (who: string, what: 'shift' | 'rack' | 'ride'): Action => ({ t: 'favour', who, what });

describe('asking the crew', () => {
  it('covers your next shift: off the schedule, no strike, no pay, owed back', () => {
    const s = crew({ shifts: [{ job: 'cafe', day: DAY + 1 }], jobs: { cafe: 0 } });
    const r = act(s, ask('hazel', 'shift'));
    expect(refused(r)).toBe(false);
    expect(r.state.shifts).toEqual([]);
    expect(r.state.cash).toBe(s.cash);
    expect(r.state.people.hazel!.owed).toBe(1);
    expect(favourBlocked(crew(), 'hazel', 'shift')).toBeTruthy();
  });

  it('lends a rack for the day, from those who have one, to those who haven’t', () => {
    const s = play(crew(), ask('mara', 'rack'));
    expect(has(s, 'rack')).toBe(true);
    expect(has({ ...s, today: [] }, 'rack')).toBe(false);
    expect(favourBlocked(crew(), 'rico', 'rack')).toMatch(/rack/);
    expect(favourBlocked(crew({ gear: { ...crew().gear, rack: 1 } }), 'mara', 'rack')).toMatch(/own/);
  });

  it('drives you: no gas, no wear, whatever state the van’s in', () => {
    const flat = crew({ at: 'lot', van: { ...crew().van, battery: 0 } });
    expect(refused(act(flat, { t: 'travel', to: 'gorge' }))).toBe(true);
    const s = play(flat, ask('hazel', 'ride'));
    const r = act(s, { t: 'travel', to: 'gorge' });
    expect(refused(r)).toBe(false);
    expect(r.state.cash).toBe(s.cash);
    expect(r.state.van).toEqual(s.van);
    expect(favourBlocked(crew(), 'rico', 'ride')).toMatch(/wheels/);
  });

  it('stops at two owed, once a day each, and squares what they owed you', () => {
    const s = play(crew(), ask('hazel', 'rack'));
    expect(refused(act(s, ask('hazel', 'ride')))).toBe(true);
    const owes2 = crew({ people: { ...crew().people, hazel: pal(6, { owed: FAVOUR.cap }) } });
    expect(favourBlocked(owes2, 'hazel', 'ride')).toMatch(/owe Hazel two/);
    const theyOwe = crew({ people: { ...crew().people, hazel: pal(6, { owed: -1 }) } });
    const r = act(theyOwe, ask('hazel', 'ride'));
    expect(r.state.people.hazel!.owed).toBe(0);
    expect(lines(r)).toContain(fill(FAVOUR_EVEN, { name: 'Hazel', what: 'A ride' }));
  });

  it('is only for the crew', () => {
    expect(favourBlocked(crew({ people: { hazel: pal(2) } }), 'hazel', 'ride')).toMatch(/crew/);
  });
});

// A day this window when `who` asks, and what, from DAY on.
const askingOn = (who: string, kind?: FavourAsk, from = DAY) => {
  for (let d = from; d < from + 200; d++) {
    const s = crew({ day: d });
    const k = favourAsk(s, who);
    if (k && (!kind || k === kind)) return { s, k };
  }
  throw new Error(`no ${kind ?? 'ask'} from ${who}`);
};
// Hazel's at the Lot over the coffee: a minute when she is.
const atLot = (s: GameState): GameState => {
  for (let min = 7 * 60; min < 23 * 60; min += 10) {
    const t = { ...s, at: 'lot', min };
    if (whereNow(t, 'hazel') === 'lot' && talkStart(t, 'hazel-lot')?.startsWith('crew-favour-')) return t;
  }
  throw new Error('Hazel never at the Lot');
};

describe('their asks', () => {
  it('come once a window, as a beat on their talk, till answered', () => {
    const { s, k } = askingOn('hazel');
    const t = atLot(s);
    expect(talkStart(t, 'hazel-lot')).toBe(`crew-favour-${k}`);
    const r = act(t, { t: 'say', talk: 'hazel-lot', node: `crew-favour-${k}`, opt: 0 });
    expect(refused(r)).toBe(false);
    expect(r.state.people.hazel!.owed).toBe(-1);
    expect(favourAsk(r.state, 'hazel')).toBeNull();
  });

  it('cost bond when you say no', () => {
    const { s, k } = askingOn('hazel');
    const r = act(atLot(s), { t: 'say', talk: 'hazel-lot', node: `crew-favour-${k}`, opt: 1 });
    expect(r.state.people.hazel!.bond).toBe(6 - FAVOUR.no);
    expect(lines(r)).toContain(FAVOUR_NO.hazel);
    expect(r.state.people.hazel!.owed ?? 0).toBe(0);
  });

  it('lend money that comes back on the night it’s due', () => {
    const { s } = askingOn('hazel', 'loan');
    const t = atLot(s);
    const r = act(t, { t: 'say', talk: 'hazel-lot', node: 'crew-favour-loan', opt: 0 });
    expect(r.state.cash).toBe(t.cash - FAVOUR.loan);
    expect(r.state.people.hazel!.lent).toEqual({ cash: FAVOUR.loan, due: t.day + FAVOUR.loanDays });
    const due = { ...r.state, day: t.day + FAVOUR.loanDays, at: 'lot', min: 18 * 60 };
    const night = act(due, { t: 'act', act: 'lot.sleep' });
    expect(lines(night)).toContain(fill(FAVOUR_REPAID, { name: 'Hazel', cash: money(FAVOUR.loan) }));
    expect(night.state.people.hazel!.lent).toBeUndefined();
  });
});

describe('two of them wanting your day', () => {
  it('starts the falling-out, while nobody’s fallen out yet', () => {
    const time = (k: FavourAsk | null) => k === 'belay' || k === 'ride';
    let found: GameState | null = null;
    for (let d = Math.max(DAY, CREW.from); d < DAY + 300 && !found; d++) {
      const s = crew({ day: d, today: ['favour-yes-mara'] });
      if (time(favourAsk({ ...s, today: [] }, 'rico'))) found = s;
    }
    expect(found).not.toBeNull();
    const s = found!;
    // Rico asks after you said yes to Mara (the drama's own ask is on Mara's talk, the closer).
    expect(talkStart(s, 'rico')).toBe('crew-favour-clash-mara');
    // Not once it's happened.
    expect(talkStart({ ...s, crew: { a: 'mara', b: 'rico', day: 1, stage: 'mended' } }, 'rico')).not.toBe(
      'crew-favour-clash-mara',
    );
  });
});
