// Phase 17.6: holidays, as nights at the fire with your people in them, and the family back
// home, as calls returned from the van, the last asking you home for good: a third ending.
import { describe, expect, it } from 'vitest';
import { FOLKS_CALLS, HOLIDAYS } from './content/folks';
import { AGE, FOLKS, HOLIDAY, YEAR } from './dials';
import { epilogue } from './epilogue';
import { crew, folksDue, holidayOn } from './folks';
import { act, newGame } from './game';
import type { GameEvent, GameState, PersonLog } from './types';
import { seasonOf } from './weather';

const lines = (ev: GameEvent[]) => ev.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const friend = (bond: number): PersonLog => ({ bond, last: 0, since: 2, talked: true });
const made = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('folks'), { t: 'create', name: 'Robin', start: 'allrounder' }).state,
  cash: 300,
  ...over,
});
// A night in the van; a knock at the door is answered, and that answer is the night.
const bed = (s: GameState, day: number) => {
  const r = act({ ...s, day, at: 'lot', min: 18 * 60, energy: 50 }, { t: 'act', act: 'lot.sleep' });
  return r.state.encounter?.kind === 'knock' ? act(r.state, { t: 'answer', opt: 0 }) : r;
};

describe('holidays (Phase 17.6)', () => {
  it('come once a season, on its middle day of the year', () => {
    const days = Array.from({ length: YEAR.days * 2 }, (_, i) => i + 1).filter((d) => holidayOn(d));
    expect(days).toHaveLength(HOLIDAY.on.length * 2);
    expect(new Set(days.map(seasonOf)).size).toBe(4);
    expect(holidayOn(HOLIDAY.on[0]!)).toBe(HOLIDAYS[seasonOf(HOLIDAY.on[0]!)]);
  });

  it('make a night at the fire with whoever’s close and around: a lift, and a day together each', () => {
    const night = HOLIDAY.on[1]!;
    const s = made({
      people: { hazel: friend(3), rico: friend(1), mara: { ...friend(5), away: night + 5 } },
    });
    expect(crew({ ...s, day: night })).toEqual(['hazel']);
    const r = bed(s, night);
    const card = r.events.find((e) => e.k === 'holiday');
    expect(card).toEqual({ k: 'holiday', id: seasonOf(night), who: ['hazel'] });
    expect(r.state.people.hazel!.bond).toBe(4);
    expect(r.state.people.rico!.bond).toBe(1);
    // Not on an ordinary night.
    expect(bed(s, night + 1).events.some((e) => e.k === 'holiday')).toBe(false);
  });
});

describe('the family back home (Phase 17.6)', () => {
  it('calls on the age clock, a missed call that waits for you', () => {
    const first = FOLKS.from * AGE.days + 1;
    expect(folksDue(made({ day: first - 1 }))).toBeNull();
    expect(folksDue(made({ day: first }))).toBe(0);
    const r = bed(made(), first - 1);
    expect(lines(r.events)).toContain('A missed call from home. It’ll keep till you call back.');
    // Sleep isn't interrupted: it waits.
    expect(r.state.encounter).toBeNull();
    expect(r.state.day).toBe(first);
  });

  it('plays a call when you call back, and the next comes two years on', () => {
    const s = made({ day: FOLKS.from * AGE.days + 1 });
    const rang = act(s, { t: 'call' }).state;
    expect(rang.encounter).toEqual({ kind: 'folks', id: '0' });
    const said = act(rang, { t: 'answer', opt: 0 }).state;
    expect(said.folks.calls).toBe(1);
    expect(said.encounter).toBeNull();
    expect(folksDue(said)).toBeNull();
    expect(folksDue({ ...said, day: (FOLKS.from + FOLKS.every) * AGE.days + 1 })).toBe(1);
    expect(act(said, { t: 'call' }).events[0]?.k).toBe('refused');
  });

  it('asks you home for good last: never the first answer, and yes ends it', () => {
    const last = FOLKS_CALLS[FOLKS_CALLS.length - 1]!;
    expect(last.opts[0]!.home).toBeUndefined();
    expect(last.opts.some((o) => o.home)).toBe(true);
    for (const c of FOLKS_CALLS) expect(c.opts[0]!.home).toBeUndefined();
    const n = FOLKS_CALLS.length - 1;
    const s = made({ day: (FOLKS.from + n * FOLKS.every) * AGE.days + 1, folks: { calls: n } });
    const home = act(act(s, { t: 'call' }).state, { t: 'answer', opt: last.opts.findIndex((o) => o.home) });
    expect(home.state.life.retired).toEqual({ day: s.day, forced: false, home: true });
    expect(home.events).toContainEqual({ k: 'retired', forced: false });
    expect(epilogue(home.state)[0]!.text).toMatch(/^You went home for good/);
    // "Not yet": on climbing, and nobody asks again.
    const stay = act(act(s, { t: 'call' }).state, { t: 'answer', opt: 0 }).state;
    expect(stay.life.retired).toBeNull();
    expect(folksDue({ ...stay, day: stay.day + 1000 })).toBeNull();
  });
});
