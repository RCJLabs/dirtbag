// Dex Calloway: his own curve, the day he notices you, the first-ascent race, and the
// overnight news about who's ahead.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { RACE_ROUTE, RIVAL_FA_NAMES } from './content/people';
import { ROUTES } from './content/routes';
import { dexHurt, dexLevel, dexSeason, gradeOfPerson, sageLevel } from './curves';
import { CURVES, RIVAL } from './dials';
import { act, emptyLog, lineName, newGame, talkStart } from './game';
import { whereNow } from './presence';
import type { Action, GameEvent, GameState, GoResult } from './types';

const lines = (ev: GameEvent[]) => ev.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const climber = (g: number) => {
  const k = needFor(g) + 0.5;
  return {
    name: 'Robin',
    start: 'allrounder',
    skills: { power: k, fingers: k, endurance: k, technique: k, head: k },
  };
};
const at = (g: number, over: Partial<GameState> = {}): GameState => ({
  ...newGame('rival'),
  climber: climber(g),
  day: 4,
  at: 'road',
  min: 11 * 60,
  today: ['warm'],
  cash: 200,
  ...over,
});
function play(s: GameState, ...actions: Action[]) {
  const events: GameEvent[] = [];
  for (const a of actions) {
    const r = act(s, a);
    const no = r.events.find((e) => e.k === 'refused');
    if (no) throw new Error(`${JSON.stringify(a)} refused: ${no.k === 'refused' && no.why}`);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}
const sent: GoResult = { sent: true, hi: 8, fellAt: null, tried: ['A1'], skin: 0 };
const send = (s: GameState, route: string) => play(s, { t: 'go', route }, { t: 'done', route, result: sent });
// Home to the Lot and to bed.
const night = (s: GameState) =>
  // No knocks (Phase 22.6a has its own tests).
  play(
    { ...s, at: 'lot', min: 18 * 60, cash: Math.max(s.cash, 100), deck: { ...s.deck, knock: s.day } },
    { t: 'act', act: 'lot.sleep' },
  );
const met = (day: number): GameState['people'] => ({ dex: { bond: 0, last: 0, since: day - 3 } });

describe('Dex’s curve', () => {
  it('is his own: steady to a peak, flat while he’s hurt, with streaks on top', () => {
    const d = dexSeason('rival');
    expect(d.peak).toBeGreaterThanOrEqual(RIVAL.peak[0]!);
    expect(d.peak).toBeLessThanOrEqual(RIVAL.peak[1]!);
    expect(d.hurtTo - d.hurtFrom).toBeGreaterThanOrEqual(RIVAL.hurtDays[0]!);
    for (let day = 1; day < 300; day++) {
      const level = dexLevel('rival', day);
      expect(level).toBeLessThanOrEqual(d.peak + RIVAL.streak);
      expect(level).toBeGreaterThanOrEqual(CURVES.dex.start - RIVAL.streak);
    }
    // He gains nothing while he's hurt: across the stretch only his form moves him.
    const across = dexLevel('rival', d.hurtTo) - dexLevel('rival', d.hurtFrom);
    expect(Math.abs(across)).toBeLessThanOrEqual(2 * RIVAL.streak);
    expect(dexHurt('rival', d.hurtFrom)).toBe(true);
    expect(dexHurt('rival', d.hurtTo)).toBe(false);
    // And it's the seed's: the same every time, different for another seed.
    expect(dexLevel('rival', 40)).toBe(dexLevel('rival', 40));
    expect(dexSeason('other')).not.toEqual(d);
  });

  it('puts Sage a grade up every twenty days', () => {
    expect(gradeOfPerson('x', 'sage', 1)).toBe(4);
    expect(sageLevel(21) - sageLevel(1)).toBeCloseTo(1, 9);
    expect(gradeOfPerson('x', 'hazel', 1)).toBeNull();
  });
});

describe('meeting Dex', () => {
  it('happens over your first V4, and he stays to say so', () => {
    const three = send(at(4), 'dyno');
    expect(three.state.people.dex).toBeUndefined();
    const four = send(at(4), 'crimpfest');
    expect(four.state.people.dex).toMatchObject({ since: 4, invite: { day: 4, place: 'road' } });
    expect(lines(four.events)).toContain('Somebody was watching that.');
    expect(whereNow(four.state, 'dex')).toBe('road');
    expect(talkStart(four.state, 'dex')).toBe('meet');
    // Only the once.
    const again = send(four.state, 'fingercrack');
    expect(lines(again.events)).not.toContain('Somebody was watching that.');
  });
});

describe('the first-ascent race', () => {
  it('starts the night you’re climbing V4, if he knows you', () => {
    const s = at(RIVAL.raceGrade, { people: met(4) });
    const slept = night(s);
    expect(slept.state.race).toEqual({ route: RACE_ROUTE, until: 4 + RIVAL.raceDays });
    expect(lines(slept.events)).toContain(
      `Word is Dex is eyeing an unclaimed line at Roadside Crag (V7): get the first ascent before he does, or it's his forever. ${RIVAL.raceDays} days.`,
    );
    expect(talkStart({ ...slept.state, at: 'road', min: 11 * 60 }, 'dex')).toBe('race');
    // Not a grade sooner, not before you've met him, and not for a line that's gone.
    expect(night(at(RIVAL.raceGrade - 1, { people: met(4) })).state.race).toBeNull();
    expect(night(at(RIVAL.raceGrade)).state.race).toBeNull();
    const taken = { ...s, firsts: { [RACE_ROUTE]: { name: 'Mine', call: 0 as const, day: 3 } } };
    expect(night(taken).state.race).toBeNull();
    expect(
      night({
        ...s,
        routes: { [RACE_ROUTE]: { ...emptyLog(), sent: { day: 3, go: 4, style: 'redpoint' as const } } },
      }).state.race,
    ).toBeNull();
  });

  it('is yours if you send it in time', () => {
    const s = at(8, { people: met(4), race: { route: RACE_ROUTE, until: 6 } });
    const won = send(s, RACE_ROUTE);
    expect(won.state.race).toBeNull();
    expect(lines(won.events)).toContain("You sent it before Dex could. That one's yours.");
    expect(won.events).toContainEqual({ k: 'fa', route: RACE_ROUTE });
  });

  it('is his if you don’t: he names it, and it carries his name', () => {
    let s = at(4, { people: met(4), race: { route: RACE_ROUTE, until: 5 } });
    s = night(s).state;
    expect(s.race).not.toBeNull();
    const lost = night({ ...s, day: 5 });
    const fa = lost.state.firsts[RACE_ROUTE]!;
    expect(fa).toMatchObject({ by: 'dex', call: 0, day: 5 });
    expect(RIVAL_FA_NAMES).toContain(fa.name);
    expect(lost.state.race).toBeNull();
    expect(lines(lost.events)).toContain(
      `Dex opened the line at Roadside Crag. He calls it "${fa.name}" (V7). That first ascent was there for you. It carries his name now, and it always will.`,
    );
    expect(lineName(lost.state, ROUTES[RACE_ROUTE]!)).toBe(fa.name);
    // Your send is a second ascent now.
    const second = send(
      { ...lost.state, climber: climber(8), at: 'road', min: 11 * 60, today: ['warm'] },
      RACE_ROUTE,
    );
    expect(second.events.some((e) => e.k === 'fa')).toBe(false);
  });
});

describe('overnight news', () => {
  it('says when you pass Dex and when he pulls ahead again', () => {
    const day = 10;
    const g = gradeOfPerson('rival', 'dex', day + 1)!;
    const behind = at(g - 1, { day, people: { dex: { bond: 0, last: 0, since: 3, ahead: false } } });
    expect(lines(night(behind).events).some((l) => l.includes('passed Dex'))).toBe(false);
    const past = night({ ...behind, climber: climber(g + 1) });
    expect(lines(past.events)).toContain("You've passed Dex. Don't get comfortable.");
    expect(past.state.people.dex?.ahead).toBe(true);
    const dropped = night({ ...past.state, climber: climber(g - 1), day });
    expect(lines(dropped.events)).toContain(`Dex pulled back ahead of you, climbing V${g} now.`);
  });

  it('says once when you climb harder than Sage', () => {
    const s = at(8, { day: 10, people: { sage: { bond: 3, last: 9, since: 2, ahead: false } } });
    const n = night(s);
    expect(lines(n.events)).toContain(
      'You climb harder than Sage now. She noticed before you did, and she is completely fine about it, which somehow makes it worse.',
    );
    expect(lines(night({ ...n.state, day: 11 }).events).some((l) => l.includes('harder than Sage'))).toBe(
      false,
    );
  });

  it('brings word when Dex gets hurt, and when he’s back', () => {
    const d = dexSeason('rival');
    const hurt = night(at(4, { day: d.hurtFrom - 1, people: met(d.hurtFrom) }));
    expect(lines(hurt.events).some((l) => l.startsWith('Word from the gym: Dex blew a pulley.'))).toBe(true);
    expect(whereNow({ ...hurt.state, at: 'road', min: 11 * 60 }, 'dex')).toBeNull();
    const back = night(at(4, { day: d.hurtTo - 1, people: met(d.hurtTo) }));
    expect(lines(back.events)).toContain(
      'Dex is quietly back on the wall, picking up right where he left off.',
    );
  });
});
