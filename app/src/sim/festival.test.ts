// Phase 20.3: the crag day at Moonstone (Evan's calls, 19 Oct 2026). Its calendar and rain date,
// the morning's word, the crowd, the card on the way in and its three ways, the trail work's
// regard, the scramble's scorecard (goes in its time, a top once, the go in hand), handed in when
// it's over and paid on the podium within a week of the café's shifts, the fire that night, and
// the save.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { FESTIVAL_SAYS } from './content/festival';
import { crowdNow } from './crowds';
import { FESTIVAL, HOLIDAY, KIT, YEAR } from './dials';
import {
  canGo,
  festivalBlocked,
  festivalDay,
  festivalMorning,
  festivalOn,
  festivalSet,
  scrambleField,
  scramblePrize,
  scrambleProblems,
  SCRAMBLE_END,
} from './festival';
import { act, newGame } from './game';
import { poorestWeek } from './guides';
import { fromSave, toSave } from './save';
import type { Action, GameEvent, GameState, GoResult, PersonLog } from './types';
import { seasonOf, skyAt } from './weather';

const V83 = readFileSync(new URL('./fixtures/save-v83.json', import.meta.url), 'utf8');
const SEED = 'festival';
const friend = (bond: number): PersonLog => ({ bond, last: 0, since: 2, talked: true });
const V9 = needFor(9);
const set = (year: number) => year * YEAR.days + FESTIVAL.on;

// The first year whose crag day falls as `want` has it, for a seed.
function yearWhere(want: (day: number | null, year: number) => boolean, seed = SEED): number {
  for (let y = 0; y < 60; y++) if (want(festivalDay(seed, y), y)) return y;
  throw new Error(`no such year for ${seed}`);
}

// The morning of a crag day at the Lot: a V9 climber with the Moonstone trip paid for, Hazel and
// Rico close, Ray known.
function morning(over: Partial<GameState> = {}, seed = SEED): GameState {
  const base = act(newGame(seed), { t: 'create', name: 'Robin', start: 'allrounder' }).state;
  return {
    ...base,
    day: festivalDay(
      seed,
      yearWhere((d) => d !== null, seed),
    )!,
    at: 'lot',
    x: null,
    min: 7 * 60 + 10,
    energy: 100,
    skin: 100,
    fed: 90,
    cash: 300,
    today: [],
    climber: { ...base.climber, skills: { power: V9, fingers: V9, endurance: V9, technique: V9, head: V9 } },
    unlocked: [...base.unlocked, FESTIVAL.at],
    people: { hazel: friend(3), rico: friend(3), ray: friend(1) },
    ...over,
  };
}

const run = (s: GameState, a: Action) => act(s, a);
function ok(s: GameState, a: Action): GameState {
  const r = act(s, a);
  if (r.events[0]?.k === 'refused') throw new Error(`${a.t} refused: ${r.events[0].why}`);
  return r.state;
}
const lines = (evs: GameEvent[]) => evs.flatMap((e) => (e.k === 'line' ? [e.text] : []));
// Driven out to Moonstone, its card up.
const there = (over: Partial<GameState> = {}) => ok(morning(over), { t: 'travel', to: FESTIVAL.at });
// Signed up for the scramble, at a given minute.
const signed = (min = FESTIVAL.scramble.from, over: Partial<GameState> = {}): GameState => ({
  ...ok(there(over), { t: 'answer', opt: 1 }),
  min,
});
const SENT: GoResult = { sent: true, hi: 99, fellAt: null, tried: [], skin: 0 };
const FELL: GoResult = { sent: false, hi: 1, fellAt: null, tried: [], skin: 0 };
// A go and how it went, on a line at the crag.
function go(s: GameState, route: string, res: GoResult): { state: GameState; events: GameEvent[] } {
  const g = ok(s, { t: 'go', route });
  const moves = scrambleProblems().find((r) => r.id === route)?.moves ?? 99;
  return run(g, { t: 'done', route, result: { ...res, hi: Math.min(res.hi, moves) } });
}

describe('the crag day at Moonstone', () => {
  it('falls in winter, on its day or the first dry one after, the same for everyone', () => {
    let moved = 0;
    let onTime = 0;
    for (const seed of ['festival', 'a', 'b', 'c', 'd']) {
      for (let y = 0; y < 12; y++) {
        const d = festivalDay(seed, y);
        const from = set(y);
        // Clear of every holiday, and in winter, every day it could fall on.
        for (let x = from; x <= from + FESTIVAL.rain; x++) {
          expect(seasonOf(x)).toBe('winter');
          expect(HOLIDAY.on).not.toContain(x - y * YEAR.days);
        }
        if (d === null) {
          for (let x = from; x <= from + FESTIVAL.rain; x++) expect(skyAt(seed, x, FESTIVAL.at)).toBe('rain');
          continue;
        }
        expect(d).toBeGreaterThanOrEqual(from);
        expect(d).toBeLessThanOrEqual(from + FESTIVAL.rain);
        expect(skyAt(seed, d, FESTIVAL.at)).not.toBe('rain');
        for (let x = from; x < d; x++) expect(skyAt(seed, x, FESTIVAL.at)).toBe('rain');
        expect(festivalOn(seed, d)).toBe(true);
        expect(festivalOn(seed, d - 1) || festivalOn(seed, d + 1)).toBe(false);
        if (d === from) onTime++;
        else moved++;
        expect(festivalSet(from)).toBe(true);
        expect(festivalSet(d + 1)).toBe(false);
      }
    }
    // Mostly on the day it's set for; put off for rain now and then.
    expect(onTime).toBeGreaterThan(moved);
    expect(moved).toBeGreaterThan(0);
  });

  it('is said in the morning: on, put off, or off for the winter, and to someone who can’t go yet', () => {
    const s = morning();
    expect(canGo(s)).toBe(true);
    expect(festivalMorning(s)).toBe(FESTIVAL_SAYS.morning.replace('{time}', '1 PM'));
    expect(festivalMorning({ ...s, unlocked: [] })).toBe(FESTIVAL_SAYS.notYet);
    expect(festivalMorning({ ...s, day: s.day + 1 })).toBeNull();
    // A year it rained on its day: put off, said only to someone who could go.
    const y = yearWhere((d, yr) => d !== null && d > set(yr));
    const wet = morning({ day: set(y) });
    expect(festivalMorning(wet)).toBe(FESTIVAL_SAYS.rained);
    expect(festivalMorning({ ...wet, unlocked: [] })).toBeNull();
    // A winter it rained through: off, on the last day it could have been.
    const seed = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].find((x) => {
      try {
        yearWhere((d) => d === null, x);
        return true;
      } catch {
        return false;
      }
    })!;
    const yd = yearWhere((d) => d === null, seed);
    const off = { ...morning({}, seed), day: set(yd) + FESTIVAL.rain };
    expect(festivalMorning(off)).toBe(FESTIVAL_SAYS.washed);
  });

  it('packs the crag all day', () => {
    for (const min of [9 * 60, 13 * 60, 16 * 60])
      expect(crowdNow({ ...morning(), at: FESTIVAL.at, min })).toBe('packed');
  });

  it('brings its card on the way in, before the scramble, once; and the day as it is after', () => {
    const s = there();
    expect(s.at).toBe(FESTIVAL.at);
    expect(s.encounter).toEqual({ kind: 'festival', id: String(s.day) });
    // Nothing else till it's answered.
    expect(run(s, { t: 'go', route: 'marete' }).events[0]?.k).toBe('refused');
    // Answered, then back again the same day: no second card.
    const climbing = ok(s, { t: 'answer', opt: 2 });
    expect(climbing.festival).toEqual({ day: s.day, way: 'climb' });
    const away = ok({ ...climbing, min: 11 * 60 }, { t: 'travel', to: 'road' });
    const back = ok(away, { t: 'travel', to: FESTIVAL.at });
    expect(back.encounter?.kind).not.toBe('festival');
    // In after the scramble's started: no card, and the day's yours to climb.
    const late = run(morning({ min: FESTIVAL.scramble.from - 30 }), { t: 'travel', to: FESTIVAL.at });
    expect(late.state.encounter?.kind).not.toBe('festival');
    expect(late.state.festival).toEqual({ day: late.state.day, way: 'climb' });
    expect(lines(late.events)).toContain(FESTIVAL_SAYS.late);
    // Not on another day.
    const other = ok(morning({ day: morning().day + 3 }), { t: 'travel', to: FESTIVAL.at });
    expect(other.encounter?.kind).not.toBe('festival');
    expect(other.festival).toBeNull();
  });

  it('offers three ways in, the first never needing anything', () => {
    const broke = { ...there(), cash: 0 };
    expect(festivalBlocked(broke, 'trail')).toBeNull();
    expect(festivalBlocked(broke, 'climb')).toBeNull();
    expect(festivalBlocked(broke, 'scramble')).not.toBeNull();
    expect(run(broke, { t: 'answer', opt: 1 }).events[0]?.k).toBe('refused');
    // The trail work: the morning's time and legs, and the old guard's regard; Ray leads it.
    const s = there();
    const r = run(s, { t: 'answer', opt: 0 });
    expect(r.state.festival).toEqual({ day: s.day, way: 'trail' });
    expect(r.state.min).toBe(s.min + FESTIVAL.trail.min);
    expect(r.state.energy).toBe(s.energy - FESTIVAL.trail.energy);
    expect(r.state.fed).toBe(s.fed - FESTIVAL.trail.fed);
    expect(r.state.scene.old).toBe(s.scene.old + FESTIVAL.trail.old);
    expect(lines(r.events).join(' ')).toMatch(/^Ray hands you a rake/);
    // Without Ray or Frank about, one of the old guard.
    const anon = run(there({ people: {} }), { t: 'answer', opt: 0 });
    expect(lines(anon.events).join(' ')).toMatch(/^One of the old guard hands you a rake/);
    // The scramble: the entry, and a blank scorecard.
    const sc = ok(s, { t: 'answer', opt: 1 });
    expect(sc.cash).toBe(s.cash - FESTIVAL.scramble.fee);
    expect(sc.festival).toEqual({ day: s.day, way: 'scramble', goes: {}, tops: {} });
  });

  it('holds its words to the rules: none typed in, no straight quotes', () => {
    const words = (x: unknown): string[] =>
      typeof x === 'string' ? [x] : typeof x === 'object' && x ? Object.values(x).flatMap(words) : [];
    for (const t of words(FESTIVAL_SAYS)) {
      expect(t, t).not.toMatch(/\d/);
      expect(t, t).not.toMatch(/['"]/);
      expect(t, t).not.toMatch(/ {2}/);
    }
  });

  it('counts goes on the crag’s boulders while the scramble’s on, and each top once', () => {
    // Before it starts: a send, but not on the card.
    const early = go(signed(FESTIVAL.scramble.from - 60), 'marete', SENT).state;
    expect(early.festival?.tops).toEqual({});
    expect(early.festival?.goes).toEqual({});
    // On: a fall and a send on the mantel, a first-go send on the arête; a repeat counts a go,
    // not a second top.
    let s = signed();
    s = go(s, 'mmantel', FELL).state;
    s = go(s, 'mmantel', SENT).state;
    s = go(s, 'marete', SENT).state;
    s = go(s, 'marete', SENT).state;
    expect(s.festival?.goes).toEqual({ mmantel: 2, marete: 2 });
    expect(s.festival?.tops).toEqual({ mmantel: 2, marete: 1 });
    // A sport line isn't on the sheet.
    s = go(s, 'mspire', SENT).state;
    expect(s.festival?.goes).not.toHaveProperty('mspire');
    expect(s.festival?.on).toBeUndefined();
  });

  it('counts a top on a go started in its time, then hands the card in when it’s over', () => {
    // A go stepped up to just before the end, topped after it: counted, then the card's in.
    const s = signed(SCRAMBLE_END - 1);
    const g = ok(s, { t: 'go', route: 'marete' });
    expect(g.min).toBeGreaterThanOrEqual(SCRAMBLE_END);
    expect(g.festival?.place).toBeUndefined();
    const done = run(g, { t: 'done', route: 'marete', result: { ...SENT, hi: 9 } });
    expect(done.state.festival?.tops).toEqual({ marete: 1 });
    expect(done.state.festival?.place).toBeGreaterThanOrEqual(1);
    // Of everyone in it: the field, and Dex once you've met him out here.
    expect(done.state.festival?.of).toBe(scrambleField(done.state, s.day).length + 1);
    expect(lines(done.events).some((l) => l.startsWith('The scramble: 1 problem in 1 go,'))).toBe(true);
    // A go after it's over isn't on the card.
    const after = go(done.state, 'mmantel', SENT).state;
    expect(after.festival?.tops).toEqual({ marete: 1 });
  });

  it('takes the card when you leave or the day ends, and early from the van', () => {
    // Driving off once it's started.
    const left = ok({ ...signed(), min: FESTIVAL.scramble.from + 30 }, { t: 'travel', to: 'road' });
    expect(left.festival?.place).toBeGreaterThanOrEqual(1);
    // Off before it started, and back for it: still yours.
    const off = ok(signed(10 * 60), { t: 'travel', to: 'road' });
    expect(off.festival?.place).toBeUndefined();
    // Never handed in: at night.
    const night = ok({ ...signed(), at: 'lot', min: 19 * 60 }, { t: 'act', act: 'lot.sleep' });
    expect(night.festival?.place).toBeGreaterThanOrEqual(1);
    // Early, from the van: not before it starts.
    expect(run(signed(11 * 60), { t: 'scramble' }).events[0]?.k).toBe('refused');
    expect(ok(signed(), { t: 'scramble' }).festival?.place).toBeGreaterThanOrEqual(1);
    expect(run(there(), { t: 'scramble' }).events[0]?.k).toBe('refused');
  });

  it('draws the same field for the day, Dex in it once you know him and he’s fit', () => {
    const s = signed();
    const field = scrambleField(s, s.day);
    expect(field).toHaveLength(FESTIVAL.scramble.field);
    expect(scrambleField(s, s.day)).toEqual(field);
    expect(new Set(field.map((f) => f.name)).size).toBe(field.length);
    for (const f of field) expect(f.tops).toBeLessThanOrEqual(scrambleProblems().length);
    const withDex = scrambleField({ ...s, people: { ...s.people, dex: friend(1) } }, s.day);
    expect(withDex.length).toBeGreaterThanOrEqual(field.length);
    expect(withDex.slice(0, field.length)).toEqual(field);
  });

  it('pays the podium, new shoes first, none of it more than a week of the café’s shifts', () => {
    const s = signed();
    expect(scramblePrize({ ...s, gear: { ...s.gear, shoes: 60 } }, 1)).toEqual({ shoes: true, cash: 0 });
    expect(scramblePrize({ ...s, gear: { ...s.gear, shoes: 100 } }, 1)).toEqual({
      shoes: false,
      cash: KIT.shoes.price,
    });
    expect(scramblePrize(s, 2)).toEqual({ shoes: false, cash: FESTIVAL.scramble.purse[0] });
    expect(scramblePrize(s, 3)).toEqual({ shoes: false, cash: FESTIVAL.scramble.purse[1] });
    expect(scramblePrize(s, 4)).toEqual({ shoes: false, cash: 0 });
    for (const prize of [KIT.shoes.price, ...FESTIVAL.scramble.purse])
      expect(prize).toBeLessThanOrEqual(poorestWeek());
    // Every problem topped in a go each: nobody can beat it, and the shoes are yours.
    let w: GameState = { ...signed(), gear: { ...s.gear, shoes: 40 } };
    for (const r of scrambleProblems()) w = go(w, r.id, SENT).state;
    const won = run(w, { t: 'scramble' });
    expect(won.state.festival?.place).toBe(1);
    expect(won.state.gear.shoes).toBe(100);
    // And the Record Book's page for it; not for second.
    expect(won.state.record.scramble).toBe(won.state.day);
    expect(won.events.some((e) => e.k === 'record' && e.ids.includes('scramble'))).toBe(true);
    expect(ok(signed(), { t: 'scramble' }).record.scramble).toBeUndefined();
    expect(lines(won.events).join(' ')).toContain(FESTIVAL_SAYS.shoes);
  });

  it('ends at the fire, with your people and the old guard you know, and not if you weren’t there', () => {
    const day = ok(there(), { t: 'answer', opt: 2 });
    const home = { ...day, at: 'lot', min: 19 * 60 };
    const r = run(home, { t: 'act', act: 'lot.sleep' });
    const fire = r.events.find((e) => e.k === 'festival');
    expect(fire).toEqual({ k: 'festival', way: 'climb', place: 0, of: 0, who: ['hazel', 'rico', 'ray'] });
    for (const w of ['hazel', 'rico', 'ray'])
      expect(r.state.people[w]!.bond).toBeGreaterThanOrEqual(home.people[w]!.bond + FESTIVAL.fire.bond);
    // Nobody knocks at the van that night: you're at the fire. A night someone would knock,
    // with the crag day behind it, nobody does.
    const sleep = (x: number, festival: GameState['festival']) =>
      run(
        { ...home, day: x, deck: { ...home.deck, last: 0, knock: 0 }, festival },
        { t: 'act', act: 'lot.sleep' },
      ).state.encounter?.kind;
    const knock = Array.from({ length: 400 }, (_, i) => home.day + i).find((x) => sleep(x, null) === 'knock');
    expect(knock).toBeDefined();
    expect(sleep(knock!, { day: knock!, way: 'climb' })).not.toBe('knock');
    // Stayed home: no fire.
    const stayed = run({ ...morning(), min: 19 * 60 }, { t: 'act', act: 'lot.sleep' });
    expect(stayed.events.some((e) => e.k === 'festival')).toBe(false);
  });

  it('leaves a save from before with no crag day, and keeps one through a save', () => {
    const r = fromSave(V83);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(83);
    expect(r.state).toEqual({ ...JSON.parse(V83).state, festival: null });
    const s = signed();
    const back = fromSave(toSave(go(s, 'marete', SENT).state, 'test'));
    expect(back.ok && back.state.festival).toEqual({
      day: s.day,
      way: 'scramble',
      goes: { marete: 1 },
      tops: { marete: 1 },
    });
    // The card, mid-answer, keeps too.
    const card = fromSave(toSave(there(), 'test'));
    expect(card.ok && card.state.encounter).toEqual({ kind: 'festival', id: String(s.day) });
  });
});
