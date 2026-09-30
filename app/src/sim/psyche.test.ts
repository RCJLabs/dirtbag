// Phase 22.4d: psyche. The day settles it at night: variety and company lift it, a shift and
// a run of samey days wear it, and a drift back to even means no one ritual holds it up.
import { describe, expect, it } from 'vitest';
import { PSYCHE } from './dials';
import { act, emptyLog, newGame } from './game';
import { psycheBy, psycheDay, psycheWindows, psycheWord } from './psyche';
import { tonight } from './tonight';
import type { GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('psyche'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 400,
  min: 21 * 60,
  psyche: { level: 50, stale: 0 },
  ...over,
});
// No knock tonight (Phase 22.6a has its own tests): a knock the night before keeps the door quiet.
const sleep = (s: GameState) =>
  act({ ...s, deck: { ...s.deck, knock: s.day } }, { t: 'act', act: 'lot.sleep' });
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const drifted = (l: number) => Math.round(l + (PSYCHE.even - l) * PSYCHE.drift);
const sent = { ...emptyLog(), goes: 1, sentToday: true, sent: { day: 1, go: 1, style: 'onsight' as const } };

describe('psyche', () => {
  it('starts keen for a new climber, and moves every window a little', () => {
    const s = act(newGame('p'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
    expect(s.psyche.level).toBe(PSYCHE.start);
    expect(psycheWindows(base())).toBe(1);
    expect(psycheWindows(base({ psyche: { level: 100, stale: 0 } }))).toBeCloseTo(1 + PSYCHE.windows);
    expect(psycheWindows(base({ psyche: { level: 0, stale: 0 } }))).toBeCloseTo(1 - PSYCHE.windows);
  });

  it('lifts for a new send, company and the fire, and says why', () => {
    const s = base({
      routes: { pump: sent },
      people: { hazel: { bond: 2, last: 1 } },
      today: ['fire'],
    });
    const d = psycheDay(s);
    expect(d.up).toEqual(['a new send', 'company', 'the fire']);
    expect(d.delta).toBe(Math.min(PSYCHE.cap, PSYCHE.send + PSYCHE.company + PSYCHE.fire));
    expect(sleep(s).state.psyche).toEqual({ level: drifted(50 + d.delta), stale: 0 });
    // A repeat isn't a new send.
    expect(psycheDay(base({ routes: { pump: { ...sent, sent: { ...sent.sent, day: 0 } } } })).up).toEqual([]);
  });

  it('counts somewhere new more than a day out, and only the first time', () => {
    const there = act(base({ min: 9 * 60 }), { t: 'travel', to: 'road' }).state;
    expect(psycheDay(there).up).toEqual(['somewhere new']);
    expect(there.crags).toEqual(['road']);
    const again = act({ ...there, today: [] }, { t: 'travel', to: 'lot' }).state;
    const back = act(again, { t: 'travel', to: 'road' }).state;
    expect(psycheDay(back).up).toEqual(['a day out']);
  });

  it('wears down with a shift, and more with every samey day in a row', () => {
    expect(psycheDay(base({ today: ['worked'] }))).toMatchObject({ delta: PSYCHE.shift, down: ['a shift'] });
    let s = base();
    const deltas: number[] = [];
    for (let n = 0; n < 7; n++) {
      deltas.push(psycheDay(s).delta);
      s = sleep({ ...s, min: 21 * 60 }).state;
    }
    expect(deltas).toEqual([0, -1, -2, -3, -4, -4, -4]);
    expect(s.psyche.stale).toBe(7);
    // Anything to lift it ends the run.
    expect(psycheDay({ ...s, today: ['fire'] }).stale).toBe(0);
  });

  it('never moves more than the cap in a day', () => {
    const s = base({
      routes: { pump: sent },
      people: { hazel: { bond: 2, last: 1 } },
      today: ['new-crag', 'fire'],
    });
    expect(psycheDay(s).delta).toBe(PSYCHE.cap);
    // The worst day is a shift at the end of a long samey run, inside it too.
    const worst = psycheDay(base({ today: ['worked'], psyche: { level: 50, stale: 9 } })).delta;
    expect(worst).toBe(PSYCHE.shift - PSYCHE.staleMax);
    expect(worst).toBeGreaterThanOrEqual(-PSYCHE.cap);
  });

  it('can’t be held up by one ritual: the fire every night settles short of psyched', () => {
    let s = base();
    for (let n = 0; n < 60; n++) s = sleep({ ...s, min: 21 * 60, today: ['fire'] }).state;
    expect(psycheWord(s.psyche.level)).toBe('keen');
    expect(psycheBy({ ...s, today: ['fire'] }).level).toBe(s.psyche.level);
  });

  it('says so the morning it tips into either end', () => {
    const up = sleep(
      base({
        psyche: { level: 78, stale: 0 },
        routes: { pump: sent },
        people: { hazel: { bond: 2, last: 1 } },
        today: ['fire'],
      }),
    );
    expect(up.state.psyche.level).toBeGreaterThanOrEqual(PSYCHE.bands[3]!);
    expect(lines(up).some((l) => /thinking about the next line/.test(l))).toBe(true);
    const down = sleep(base({ psyche: { level: 26, stale: 5 }, today: ['worked'] }));
    expect(psycheWord(down.state.psyche.level)).toBe('low');
    expect(lines(down).some((l) => /what the plan was/.test(l))).toBe(true);
  });

  it('shows on Tonight: the word by morning, and why', () => {
    const t = tonight(base({ today: ['worked', 'fire'] }));
    expect(t.psyche).toEqual({ word: 'steady', up: ['the fire'], down: ['a shift'] });
  });
});
