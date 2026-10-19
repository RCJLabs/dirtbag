// Phase 45: the problem of the day. A date makes the same day every time (Phase 45's criterion
// 1): a boulder at a crag in the edition, climbable at first light, a climber made for it.
// The day ends when the line goes or nothing more can be tried; nobody puts a call to you
// on it.
import { afterEach, describe, expect, it } from 'vitest';
import { humanHands, playGo } from './bot';
import { gradeOf, margin } from './climber';
import { DEMO_PLACES } from './content/demo';
import { ROUTES } from './content/routes';
import { DAILY, DAY, YEAR } from './dials';
import { asDemo } from './edition';
import { act, goBlocked } from './game';
import { Rng } from './rng';
import { toSave } from './save';
import { dailyState, dateLabel, dateOf, dayLines, dayOf, dayOver, dayResult, daySeed, isDate } from './daily';
import type { GameState } from './types';

const DATES = Array.from({ length: 60 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 9, 1 + i * 3));
  return d.toISOString().slice(0, 10);
});

// A day played by human-ish hands: a go, rest if it fell, again, till the day's over.
function playDay(s0: GameState, route: string, date: string): GameState {
  const r = ROUTES[route]!;
  let s = s0;
  for (let i = 0; i < 40 && !dayOver(s, route); i++) {
    const went = act(s, { t: 'go', route });
    if (went.events.some((e) => e.k === 'refused')) break;
    const hands = humanHands(Rng.fromStream(date, 'session').derive(`go-${i}`));
    s = act(went.state, { t: 'done', route, result: playGo(went.state, r, hands) }).state;
    if (!s.routes[route]?.sent) s = act(s, { t: 'rest', route }).state;
  }
  return s;
}

afterEach(() => asDemo(false));

describe('Phase 45: the problem of the day', () => {
  it('makes the same day from the same date, and another from another', () => {
    // On every device, this build: the date's seeded draw over the edition's boulders, taken
    // in the order of their ids. A boulder added at a crag, or a new crag, moves these; that's
    // a new build's days, and this is where it shows.
    expect(dayOf('2026-10-19')).toEqual({ route: 'mhueco', day: 22 });
    expect(dayOf('2026-10-20')).toEqual({ route: 'walpine', day: 11 });
    asDemo(true);
    expect(dayOf('2026-10-19')).toEqual({ route: 'gpinch', day: 21 });
    asDemo(false);
    const a = dailyState('2026-10-19');
    expect(dailyState('2026-10-19')).toEqual(a);
    expect(toSave(dailyState('2026-10-19'), 'x')).toBe(toSave(a, 'x'));
    expect(dateOf(a)).toBe('2026-10-19');
    expect(a.seed).toBe(daySeed('2026-10-19'));
    const lines = new Set(DATES.map((d) => dayOf(d).route));
    expect(lines.size).toBeGreaterThan(5);
    expect(isDate('2026-10-19')).toBe(true);
    expect(isDate('19 Oct')).toBe(false);
    expect(isDate('2026-13-01')).toBe(false);
    expect(isDate('2026-02-29')).toBe(false);
    expect(isDate('2028-02-29')).toBe(true);
    expect(isDate('2100-02-29')).toBe(false);
    expect(dateLabel('2026-10-19')).toBe('19 October 2026');
    expect(dateLabel('2026-01-05', true)).toBe('5 Jan');
    expect(dateOf({ seed: 'career' })).toBeNull();
  });

  it('draws a boulder at a crag in the edition, climbable at first light, for a climber under its grade', () => {
    const pool = new Set(dayLines().map((r) => r.id));
    for (const date of DATES) {
      const { route, day } = dayOf(date);
      const r = ROUTES[route]!;
      const s = dailyState(date);
      expect(pool.has(route)).toBe(true);
      expect(r.disc).toBe('boulder');
      expect(day).toBeGreaterThanOrEqual(2);
      expect(day).toBeLessThanOrEqual(YEAR.days);
      expect(s).toMatchObject({ at: r.place, day, min: DAY.firstMin, energy: 100, skin: 100 });
      expect(goBlocked(s, r)).toBeNull();
      // DAILY.under below it in every skill: in its style too.
      expect(gradeOf(s.climber.skills)).toBe(Math.floor(r.grade - DAILY.under));
      expect(margin(s.climber.skills, r.type, r.grade)).toBeCloseTo(-DAILY.under, 2);
    }
  });

  it('draws from the demo’s crags in the demo', () => {
    asDemo(true);
    for (const date of DATES.slice(0, 20)) expect(DEMO_PLACES).toContain(ROUTES[dayOf(date).route]!.place);
  });

  it('ends when the line goes, or when nothing more can be tried today, and puts no call to you', () => {
    let sent = 0;
    for (const date of DATES.slice(0, 20)) {
      const s0 = dailyState(date);
      const { route } = dayOf(date);
      const s = playDay(s0, route, date);
      expect(dayOver(s, route)).toBe(true);
      expect(s.encounter).toBeNull();
      const res = dayResult(s, route);
      expect(res.goes).toBeGreaterThan(0);
      if (res.sent) {
        sent++;
        expect(res.hi).toBe(res.moves);
        // A lap after the send doesn't count against it.
        const lap = act(s, { t: 'go', route });
        if (lap.events.some((e) => e.k === 'refused')) continue;
        const r = ROUTES[route]!;
        const after = act(lap.state, { t: 'done', route, result: playGo(lap.state, r) }).state;
        expect(after.routes[route]!.goes).toBe(s.routes[route]!.goes + 1);
        expect(dayResult(after, route)).toEqual(res);
      } else expect(goBlocked(s, ROUTES[route]!)).not.toBeNull();
    }
    // Human-ish hands send it most days and run out on some: a day at your limit.
    expect(sent).toBeGreaterThan(10);
    expect(sent).toBeLessThan(20);
    // And dark ends it whatever's left.
    const s = dailyState('2026-10-19');
    expect(dayOver({ ...s, min: 19 * 60 }, dayOf('2026-10-19').route)).toBe(true);
  });
});
