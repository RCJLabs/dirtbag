// Phase 28.2: the crew project (Evan's calls: you pick it, two grades or more above your
// hardest send; your send starts the train). Crew days call the crew to its crag once a week;
// each of them there goes first and shows you a way through; your send takes them up it.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { CREW_DAY_YES, CREW_TRAIN, PROJECT_SAYS } from './content/crew';
import { ROUTES } from './content/routes';
import { CREW_PROJECT } from './dials';
import { fill } from './format';
import { act, crewDayAnswers, emptyLog, newGame, projectable } from './game';
import { crewDayFor, crewDayFrom, crewHere } from './crew';
import { sprayable } from './crowds';
import { psycheDay } from './psyche';
import { aimEarned } from './record';
import type { Action, GameState, GoResult, PersonLog } from './types';
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
const lines = (r: ReturnType<typeof act>): string[] =>
  r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));

// A dry morning at Roadside with a named crew: Hazel and Sage, both close.
const dry = Array.from({ length: 40 }, (_, i) => i + 10).find((d) => conditionsAt('crewp', d, 'road').open)!;
const pal = (bond: number, over: Partial<PersonLog> = {}): PersonLog => ({
  bond,
  last: dry - 1,
  since: 1,
  talked: true,
  beatDay: dry,
  ...over,
});
const n = needFor(4);
const crew = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('crewp'),
  day: dry,
  at: 'road',
  min: 10 * 60,
  today: ['warm'],
  climber: {
    name: 'Kit',
    start: 'allrounder',
    skills: { power: n, fingers: n, endurance: n, technique: n, head: n },
  },
  people: { hazel: pal(6), sage: pal(4) },
  crewName: { name: 'Gorge Rats', day: 3 },
  ...over,
});
// The Warm Boulder: V2, at Roadside, two grades over nothing sent.
const warm = ROUTES.warm!;
const SENT: GoResult = { sent: true, hi: warm.moves, fellAt: null, tried: [], skin: 0 };
const picked = (over: Partial<GameState> = {}) => play(crew(over), { t: 'crewProject', route: 'warm' });
// Both of them here today, by a crew day called this morning.
const withCrew = (over: Partial<GameState> = {}) => play(picked(over), { t: 'crewDay' });

describe('the crew project', () => {
  it('is a line well above your hardest send of its kind, at a crag the crew can come to', () => {
    expect(projectable(crew(), warm)).toBe(true);
    // A V2 sent already makes a V2 too easy.
    const sentV2 = crew({ routes: { rsopen: { ...emptyLog(), sent: { day: 2, go: 1, style: 'onsight' } } } });
    expect(ROUTES.rsopen!.grade).toBeGreaterThanOrEqual(warm.grade);
    expect(projectable(sentV2, warm)).toBe(false);
    // No crew name, no project; one at a time.
    expect(projectable(crew({ crewName: null }), warm)).toBe(false);
    const s = picked();
    expect(s.crewProject).toEqual({ route: 'warm', day: dry });
    expect(projectable(s, ROUTES.pump!)).toBe(false);
    expect(refused(act(s, { t: 'crewProject', route: 'pump' }))).toBe(true);
    // Dropped, the slot's free again.
    const dropped = act(s, { t: 'crewProject', route: null });
    expect(dropped.state.crewProject).toBeNull();
    expect(lines(dropped)).toContain(PROJECT_SAYS.dropped);
  });
});

describe('a crew day', () => {
  it('brings everyone who can make it, today before the invite hour, tomorrow after', () => {
    const r = act(picked(), { t: 'crewDay' });
    expect(refused(r)).toBe(false);
    for (const w of ['hazel', 'sage'])
      expect(r.state.people[w]!.invite).toEqual({ day: dry, place: 'road', from: 10 * 60 });
    expect(lines(r)).toContain(fill(CREW_DAY_YES.hazel!, { place: 'Roadside Crag' }));
    expect(crewHere(r.state).sort()).toEqual(['hazel', 'sage']);
    // In the evening it's for tomorrow, from the morning.
    const late = act(picked({ min: 15 * 60 }), { t: 'crewDay' }).state;
    expect(crewDayFor(picked({ min: 15 * 60 }))).toBe(dry + 1);
    expect(late.people.sage!.invite).toEqual({ day: dry + 1, place: 'road', from: CREW_PROJECT.from });
  });

  it('can be called once a week, answered or not', () => {
    const s = withCrew();
    expect(crewDayFrom(s)).toBe(dry + CREW_PROJECT.every);
    expect(refused(act(s, { t: 'crewDay' }))).toBe(true);
    expect(refused(act({ ...s, day: dry + CREW_PROJECT.every }, { t: 'crewDay' }))).toBe(false);
    // Dropping the project and picking another doesn't buy another day.
    const again = play(s, { t: 'crewProject', route: null }, { t: 'crewProject', route: 'warm' });
    expect(refused(act(again, { t: 'crewDay' }))).toBe(true);
  });

  it('gets a no from anyone away, not close enough for the crag, or keeping clear of a yes', () => {
    const at = (people: Record<string, PersonLog>, place = 'road') =>
      crewDayAnswers(crew({ people }), place, dry).map((a) => `${a.who}:${a.no ?? 'yes'}`);
    expect(at({ hazel: pal(6, { away: dry + 2 }), sage: pal(4) })).toEqual(['hazel:away', 'sage:yes']);
    // Moonstone wants more than a Regular.
    expect(at({ hazel: pal(6), sage: pal(4) }, 'moon')).toEqual(['hazel:yes', 'sage:bond']);
    // A falling-out, either way round: whoever answers second says no.
    expect(at({ hazel: pal(6), sage: pal(4, { avoid: 'hazel' }) })).toEqual(['hazel:yes', 'sage:avoid']);
    expect(at({ hazel: pal(6, { avoid: 'sage' }), sage: pal(4) })).toEqual(['hazel:yes', 'sage:avoid']);
    const none = act(
      picked({ people: { hazel: pal(6, { away: dry + 2 }), sage: pal(4, { away: dry + 2 }) } }),
      {
        t: 'crewDay',
      },
    );
    expect(lines(none)).toContain(PROJECT_SAYS.nobody);
  });
});

describe('the crew goes first', () => {
  it('each of them here shows you a way through, once a day, into what you were told', () => {
    const s = withCrew();
    const before = sprayable(s, warm);
    expect(before.length).toBeGreaterThan(0);
    const r = act(s, { t: 'crewGo' });
    expect(refused(r)).toBe(false);
    const shown = before.slice(0, Math.min(2, before.length));
    expect(r.state.routes.warm!.told).toEqual(shown);
    expect(r.state.min).toBe(s.min + 2 * CREW_PROJECT.watch);
    expect(refused(act(r.state, { t: 'crewGo' }))).toBe(true);
  });

  it('isn’t to be had away from the project’s crag', () => {
    expect(refused(act({ ...withCrew(), at: 'gorge' }, { t: 'crewGo' }))).toBe(true);
  });
});

describe('the send train', () => {
  it('takes the crew up it after you, and goes in the Record Book', () => {
    const s = play(
      withCrew(),
      { t: 'crewGo' },
      { t: 'go', route: 'warm' },
      { t: 'done', route: 'warm', result: SENT },
    );
    // Told by the crew first, so a first-go send is a flash.
    expect(s.routes.warm!.sent).toMatchObject({ go: 1, style: 'flash' });
    expect(s.crewProject).toBeNull();
    expect(s.crewSends).toEqual([
      { route: 'warm', day: dry, train: expect.arrayContaining(['hazel', 'sage']) },
    ]);
    expect(s.today).toContain('crew-sent');
    expect(aimEarned(s, { train: 1 })).toBe(true);
    expect(psycheDay(s).up).toContain('the send train');
    const r = act(play(withCrew(), { t: 'go', route: 'warm' }), { t: 'done', route: 'warm', result: SENT });
    expect(lines(r)).toContain(CREW_TRAIN.hazel);
    expect(lines(r)).toContain(fill(PROJECT_SAYS.train, { crew: 'Gorge Rats', line: warm.name }));
  });

  it('runs empty when you send it alone, and the book waits', () => {
    const away = { hazel: pal(6, { away: dry + 2 }), sage: pal(4, { away: dry + 2 }) };
    const r = act(play(picked({ people: away }), { t: 'go', route: 'warm' }), {
      t: 'done',
      route: 'warm',
      result: SENT,
    });
    expect(r.state.crewSends).toEqual([{ route: 'warm', day: dry, train: [] }]);
    expect(lines(r)).toContain(PROJECT_SAYS.alone);
    expect(aimEarned(r.state, { train: 1 })).toBe(false);
    expect(psycheDay(r.state).up).not.toContain('the send train');
  });
});
