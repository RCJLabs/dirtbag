// Phase 27.4: calling the flash or the onsight before a first go (Evan's call: it stakes
// psyche both ways, and ten called sends go in the Record Book).
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { CALL_SAYS } from './content/routes';
import { PSYCHE } from './dials';
import { fill } from './format';
import { act, emptyLog, newGame } from './game';
import { psycheDay } from './psyche';
import { aimEarned } from './record';
import { fromSave, toSave } from './save';
import type { Action, GameState, GoResult } from './types';
import { conditionsAt } from './weather';

const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');
const play = (s: GameState, ...as: Action[]): GameState => {
  for (const a of as) {
    const r = act(s, a);
    if (refused(r)) throw new Error(JSON.stringify(r.events));
    s = r.state;
  }
  return s;
};
const lines = (s: GameState, a: Action): string[] =>
  act(s, a).events.flatMap((e) => (e.k === 'line' ? [e.text] : []));

// A dry morning at Roadside, warmed up, at the Warm Boulder.
const dry = Array.from({ length: 60 }, (_, i) => i + 2).find((d) => conditionsAt('call', d, 'road').open)!;
const n = needFor(6);
const atRoad = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('call'),
  day: dry,
  at: 'road',
  min: 9 * 60,
  today: ['warm'],
  climber: {
    name: 'Kit',
    start: 'allrounder',
    skills: { power: n, fingers: n, endurance: n, technique: n, head: n },
  },
  ...over,
});
const SENT: GoResult = { sent: true, hi: 8, fellAt: null, tried: ['A1'], skin: 0 };
const FELL: GoResult = { sent: false, hi: 3, fellAt: 'A', tried: ['A1'], skin: 0 };
const go = (call?: true): Action => ({ t: 'go', route: 'warm', ...(call ? { call } : {}) });
const done = (result: GoResult): Action => ({ t: 'done', route: 'warm', result });

describe('calling it', () => {
  it('keeps a called send in the log, and pays its psyche past the day’s cap', () => {
    const s = play(atRoad(), go(true), done(SENT));
    expect(s.routes.warm!.sent).toMatchObject({ go: 1, style: 'onsight', called: true });
    expect(s.today).toContain('called-sent');
    const plain = play(atRoad(), go(), done(SENT));
    expect(plain.routes.warm!.sent!.called).toBeUndefined();
    expect(psycheDay(s).delta - psycheDay(plain).delta).toBe(PSYCHE.called);
    expect(psycheDay(s).up).toContain('a send you called');
  });

  it('costs psyche that night when the called go falls, and the second go isn’t called', () => {
    const fell = play(atRoad(), go(true), done(FELL));
    expect(fell.today).toContain('called-fell');
    const plain = play(atRoad(), go(), done(FELL));
    expect(psycheDay(plain).delta - psycheDay(fell).delta).toBe(PSYCHE.calledFell);
    const after = play(fell, { t: 'rest', route: 'warm' }, go(true), done(SENT));
    expect(after.routes.warm!.sent).toEqual({ day: dry, go: 2, style: 'redpoint' });
    expect(after.today).not.toContain('called-sent');
  });

  it('only calls a first go at a line you’ve never sent', () => {
    const sent = atRoad({
      routes: { warm: { ...emptyLog(), goes: 1, sent: { day: 1, go: 1, style: 'onsight' } } },
    });
    expect(play(sent, go(true)).today).not.toContain('called-warm');
    expect(play(atRoad(), go()).today).not.toContain('called-warm');
  });

  it('says what you called: the onsight, or the flash once you’ve been told the beta', () => {
    expect(lines(atRoad(), go(true))).toContain(fill(CALL_SAYS.call, { style: 'onsight' }));
    const told = atRoad({ routes: { warm: { ...emptyLog(), told: ['A1'] } } });
    expect(lines(told, go(true))).toContain(fill(CALL_SAYS.call, { style: 'flash' }));
    const s = play(told, go(true), done(SENT));
    expect(s.routes.warm!.sent).toMatchObject({ style: 'flash', called: true });
  });

  it('puts ten called sends in the Record Book, and not nine', () => {
    const many = (k: number): GameState =>
      atRoad({
        routes: Object.fromEntries(
          Array.from({ length: 12 }, (_, i) => [
            `line${i}`,
            {
              ...emptyLog(),
              goes: 1,
              sent: { day: 1, go: 1, style: 'onsight', ...(i < k ? { called: true } : {}) },
            },
          ]),
        ),
      });
    expect(aimEarned(many(9), { called: 10 })).toBe(false);
    expect(aimEarned(many(10), { called: 10 })).toBe(true);
  });

  it('saves a called send, and refuses a send whose call is anything but true', () => {
    const s = play(atRoad(), go(true), done(SENT));
    const back = fromSave(toSave(s, 'test'));
    expect(back.ok && back.state.routes.warm!.sent!.called).toBe(true);
    const bad = JSON.parse(toSave(s, 'test'));
    bad.state.routes.warm.sent.called = 'yes';
    expect(fromSave(JSON.stringify(bad)).ok).toBe(false);
  });
});
