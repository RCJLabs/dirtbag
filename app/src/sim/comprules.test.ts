// Phase 33.2: comp rules. Each problem's on the clock for a round, and the clock buys a set
// number of goes (Evan's call: a go budget), fewer after the qualifier. Isolation: nobody
// tells you anything on a comp's problem, and nobody shows you; your own falls still do.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { canAsk, sprayable } from './crowds';
import { clockFor, compClock, compField, compSet, goesFor, goesLeft } from './comps';
import { COMP_RULES, COMP_TIERS, DYNO_COMP } from './content/comps';
import { centerSet, weekOf } from './content/gym';
import { COMP } from './dials';
import { fill } from './format';
import { act, lessonAt, newGame } from './game';
import type { GameState, GoResult } from './types';

const NAT = 2;
// Nationals' first day, from the calendar.
const N = COMP_TIERS[NAT]!.on;
const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');
const why = (r: ReturnType<typeof act>) => r.events.find((e) => e.k === 'refused');
const lines = (r: ReturnType<typeof act>): string[] =>
  r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const k = needFor(13);
const base = (over: Partial<GameState> = {}): GameState => {
  const s = newGame('rules');
  return {
    ...s,
    day: N,
    at: 'center',
    min: 9 * 60,
    cash: 500,
    energy: 100,
    skin: 100,
    climber: {
      name: 'Kit',
      start: 'allrounder',
      skills: { power: k, fingers: k, endurance: k, technique: k, head: k },
    },
    comps: { ...s.comps, points: [{ day: N - 1, pts: 200 }] },
    ...over,
  };
};
const enter = (s = base()) => act(s, { t: 'comp', do: 'enter' }).state;
const fell = (hi = 1): GoResult => ({ sent: false, hi, fellAt: 'A', tried: ['A1'], skin: 0 });
const topped = (moves: number): GoResult => ({ sent: true, hi: moves, fellAt: null, tried: ['A1'], skin: 0 });
// A go and how it ended.
const goAt = (s: GameState, id: string, res: GoResult) =>
  act(act(s, { t: 'go', route: id }).state, { t: 'done', route: id, result: res });
// `n` goes off a problem, fresh between them.
const falls = (s: GameState, id: string, n: number): GameState => {
  for (let i = 0; i < n; i++) s = { ...goAt(s, id, fell()).state, energy: 100, skin: 100 };
  return s;
};

describe('the clock', () => {
  it('buys five goes a problem in a qualifier and four after it, from the dials; the dyno comp keeps its throws', () => {
    expect(goesFor(NAT, 0)).toBe(Math.floor(COMP.clock[0] / COMP.perGo));
    expect(goesFor(NAT, 0)).toBe(5);
    expect(goesFor(NAT, 1)).toBe(4);
    expect(goesFor(3, 2)).toBe(4);
    expect(goesFor(0)).toBe(5);
    expect(goesFor(DYNO_COMP)).toBe(COMP_TIERS[DYNO_COMP]!.side!.goes);
    expect(compClock(NAT, 1)).toBe(fill(COMP_RULES.clock, { min: clockFor(1), goes: goesFor(NAT, 1) }));
  });

  it('says so at the desk, as you’re in', () => {
    const r = act(base(), { t: 'comp', do: 'enter' });
    expect(lines(r)[0]).toContain(compClock(NAT, 0));
  });

  it('runs out: the goes it buys and no more, and a top in the last of them counts', () => {
    const s = enter();
    const p = compSet(s.seed, NAT, N)[0]!;
    expect(goesLeft(s, p.id)).toBe(5);
    const four = falls(s, p.id, 4);
    expect(goesLeft(four, p.id)).toBe(1);
    const last = goAt(four, p.id, topped(p.moves));
    expect(refused(last)).toBe(false);
    expect(last.state.comps.on!.tops[p.id]).toBe(5);
    expect(goesLeft(last.state, p.id)).toBe(0);
    const over = act({ ...last.state, energy: 100, skin: 100 }, { t: 'go', route: p.id });
    expect(why(over)).toEqual({ k: 'refused', why: `${COMP_RULES.time}.` });
    // Another problem has its own clock.
    expect(goesLeft(last.state, compSet(s.seed, NAT, N)[1]!.id)).toBe(5);
    // Nothing else is on one.
    expect(goesLeft(last.state, centerSet(s.seed, weekOf(N))[0]!.id)).toBeNull();
  });

  it('is shorter in the final', () => {
    const through = act(
      {
        ...enter(),
        comps: {
          ...enter().comps,
          on: {
            tier: NAT,
            day: N,
            round: 0,
            tops: Object.fromEntries(compSet('rules', NAT, N).map((p) => [p.id, 1])),
          },
        },
      },
      { t: 'comp', do: 'finish' },
    ).state;
    const day = { ...through, day: N + 1, min: 18 * 60, today: [] };
    const p = compSet(day.seed, NAT, N + 1)[0]!;
    const out = falls(day, p.id, goesFor(NAT, 1));
    expect(goesLeft(out, p.id)).toBe(0);
    expect(refused(act(out, { t: 'go', route: p.id }))).toBe(true);
  });

  it('holds the field to it too: no round’s goes past its clock’s', () => {
    for (const day of [N, N + 1]) {
      const goes = goesFor(NAT, day - N);
      for (const f of compField('rules', NAT, day)) expect(f.goes).toBeLessThanOrEqual(f.tops * goes);
    }
  });
});

describe('isolation', () => {
  it('nobody tells you the beta on a comp’s problem, packed or not', () => {
    const s = enter();
    const p = compSet(s.seed, NAT, N)[0]!;
    expect(p.cruxes[0]!.beta.length).toBeGreaterThan(1);
    expect(sprayable(s, p)).toEqual([]);
    expect(canAsk(s, p)).toBe(false);
    expect(why(act(s, { t: 'ask', route: p.id }))).toEqual({ k: 'refused', why: COMP_RULES.ask });
  });

  it('nobody shows you anything at the comp’s wall, not even the week’s set', () => {
    const outside = base({ comps: { ...base().comps, on: null } });
    const week = centerSet('rules', weekOf(N)).map((r) => r.id);
    expect(week).toContain(lessonAt(outside)?.r.id);
    expect(lessonAt(enter())).toBeNull();
    // Sage, asked there, says so.
    const s = enter();
    const asked = act(
      {
        ...s,
        people: {
          ...s.people,
          sage: {
            bond: 5,
            last: 1,
            since: 1,
            talked: true,
            invite: { day: N, place: 'center', from: 9 * 60 },
          },
        },
      },
      { t: 'say', talk: 'sage', node: 'again', opt: 0 },
    );
    expect(refused(asked)).toBe(false);
    expect(lines(asked)).toContain(fill(COMP_RULES.watch, { name: 'Sage' }));
    expect(asked.events.some((e) => e.k === 'learned')).toBe(false);
  });

  it('your own fall still shows you another way', () => {
    const s = enter();
    const p = compSet(s.seed, NAT, N)[0]!;
    const r = goAt(s, p.id, fell(Math.floor(p.cruxes[0]!.from) + 1));
    const need = p.beta.A2!.unlock?.falls ?? 1;
    const after =
      need > 1
        ? goAt({ ...r.state, energy: 100, skin: 100 }, p.id, fell(Math.floor(p.cruxes[0]!.from) + 1))
        : r;
    expect(after.events).toContainEqual(expect.objectContaining({ k: 'learned', beta: 'A2', how: 'fall' }));
  });
});
