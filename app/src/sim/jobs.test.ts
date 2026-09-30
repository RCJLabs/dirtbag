// Promotions: shifts worked (a double counts two) earn ranks, ranks raise the pay, and
// setting's ranks want you climbing too. Phase 22.1's week: shifts posted by the week, signed
// up for ahead, warnings for no-shows, and how you live.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { ACTS } from './content/places';
import { JOBS } from './content/jobs';
import { LIFESTYLE, MONEY, WORK, BODY } from './dials';
import { act, actCost, newGame } from './game';
import { isPosted, nextRank, postedIn, rankAt, signupBlocked } from './jobs';
import { tonight } from './tonight';
import type { GameState } from './types';

const at = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('jobs'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  at: 'cafe',
  min: 8 * 60,
  energy: 100,
  // Today's café shift, signed up for.
  shifts: [{ job: 'cafe', day: 1 }],
  ...over,
});
const sleepAt = (s: GameState) => act({ ...s, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' });
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));

describe('jobs', () => {
  it('pays the first rank what it always did, and counts a double as two shifts', () => {
    const s = at();
    expect(actCost(s, ACTS['cafe.shift']!).cash).toBe(28);
    const r = act(s, { t: 'act', act: 'cafe.double' });
    expect(r.state.cash).toBe(s.cash + 56);
    expect(r.state.jobs.cafe).toBe(2);
  });

  it('promotes on the shift that earns it, with a raise on every shift after', () => {
    const J = JOBS.cafe!;
    const s = at({ jobs: { cafe: J.at[1]! - 1 } });
    expect(rankAt(s, 'cafe')).toBe(0);
    const r = act(s, { t: 'act', act: 'cafe.shift' });
    expect(rankAt(r.state, 'cafe')).toBe(1);
    expect(lines(r).some((l) => l.startsWith(`Promoted: ${J.ranks[1]}.`))).toBe(true);
    // Paid at the old rank for the shift that promoted you; the raise from the next.
    expect(r.state.cash).toBe(s.cash + 28);
    expect(actCost(r.state, ACTS['cafe.double']!).cash).toBe(56 + 2 * J.raise);
    expect(nextRank(r.state, 'cafe')).toEqual({ name: J.ranks[2], shifts: J.at[2]! - J.at[1]!, grade: null });
  });

  it('holds a setter back until they climb the grade, however many shifts', () => {
    const J = JOBS.set!;
    const k = needFor(J.grade![2]! - 1);
    const weak = at({
      jobs: { set: J.at[3]! },
      climber: {
        name: 'Kit',
        start: 'allrounder',
        skills: { power: k, fingers: k, endurance: k, technique: k, head: k },
      },
    });
    expect(rankAt(weak, 'set')).toBe(1);
    expect(nextRank(weak, 'set')?.grade).toBe(J.grade![2]);
  });
});

describe('the week', () => {
  it('posts every job on its own days, the same every time, and the café every day', () => {
    for (const [id, j] of Object.entries(JOBS)) {
      const days = postedIn('week', id, 3);
      expect(days, id).toHaveLength(j.posts ?? 7);
      expect(
        days.every((d) => d >= 15 && d <= 21),
        id,
      ).toBe(true);
      expect(postedIn('week', id, 3), id).toEqual(days);
    }
    expect(postedIn('week', 'set', 3)).not.toEqual(postedIn('week', 'set', 4).map((d) => d - 7));
  });

  it('turns you away on a day with no shift posted', () => {
    const off = [1, 2, 3, 4, 5, 6, 7].find((d) => !isPosted('jobs', 'warehouse', d))!;
    const s = at({ at: 'warehouse', day: off, shifts: [] });
    expect(act(s, { t: 'act', act: 'warehouse.shift' }).events[0]).toMatchObject({ k: 'refused' });
  });

  it('pays a walk-in, but only counts a shift you signed up for', () => {
    const r = act(at({ shifts: [] }), { t: 'act', act: 'cafe.shift' });
    expect(r.state.cash).toBe(at().cash + 28);
    expect(r.state.jobs.cafe ?? 0).toBe(0);
    expect(lines(r).some((l) => l.startsWith('A walk-in'))).toBe(true);
    const booked = act(at(), { t: 'act', act: 'cafe.shift' });
    expect(booked.state.jobs.cafe).toBe(1);
    expect(booked.state.shifts).toEqual([]);
  });

  it('signs you up for posted days up to a week ahead, one shift a day, and lets you drop them', () => {
    const s = at({ shifts: [] });
    const day = postedIn('jobs', 'warehouse', 1).find((d) => d > 1)!;
    const r = act(s, { t: 'signup', job: 'warehouse', day, on: true });
    expect(r.state.shifts).toEqual([{ job: 'warehouse', day }]);
    expect(signupBlocked(r.state, 'cafe', day)).toMatch(/shift that day/);
    expect(signupBlocked(s, 'cafe', 1)).toMatch(/walk-ins/);
    expect(signupBlocked(s, 'cafe', 2 + WORK.ahead)).toMatch(/Not posted/);
    expect(signupBlocked(s, 'coach', 2)).toMatch(/V5/);
    expect(act(r.state, { t: 'signup', job: 'warehouse', day, on: false }).state.shifts).toEqual([]);
  });

  it('warns you for a no-show, and the third costs the job and a week off its schedule', () => {
    let s = at({ jobs: { cafe: JOBS.cafe!.at[2]! } });
    expect(rankAt(s, 'cafe')).toBe(2);
    for (let n = 1; n < WORK.strikes; n++) {
      const r = sleepAt({ ...s, shifts: [{ job: 'cafe', day: s.day }] });
      expect(r.state.strikes.cafe).toBe(n);
      expect(lines(r).some((l) => l.includes(`warning, ${n} of`))).toBe(true);
      s = r.state;
    }
    const r = sleepAt({
      ...s,
      shifts: [
        { job: 'cafe', day: s.day },
        { job: 'cafe', day: s.day + 2 },
      ],
    });
    expect(rankAt(r.state, 'cafe')).toBe(0);
    expect(r.state.strikes.cafe).toBeUndefined();
    expect(r.state.shifts).toEqual([]);
    expect(r.state.benched.cafe).toBe(s.day + 1 + WORK.benchDays);
    const next = { ...r.state, at: 'cafe', min: 8 * 60 };
    expect(act(next, { t: 'act', act: 'cafe.shift' }).events[0]).toMatchObject({ k: 'refused' });
    expect(signupBlocked(next, 'cafe', next.day + 1)).toMatch(/Off the schedule/);
    // Back after the week, from the bottom.
    const back = { ...next, day: r.state.benched.cafe! };
    expect(act(back, { t: 'act', act: 'cafe.shift' }).events[0]?.k).not.toBe('refused');
  });

  it('charges how you live every night at the van, and gives it back by morning', () => {
    const s = { ...at({ lifestyle: 'plush' as const, energy: 20, skin: 20 }), cash: 200 };
    const r = sleepAt(s);
    const P = LIFESTYLE.plush;
    expect(r.state.cash).toBe(200 - MONEY.vanSpot - P.cost);
    expect(r.state.energy).toBe(20 + BODY.sleepEnergy + P.energy);
    expect(r.state.skin).toBe(20 + BODY.sleepSkin + P.skin);
    expect(tonight(s).cash).toBe(r.state.cash);
    expect(tonight(s).energy).toBe(BODY.sleepEnergy + P.energy);
    // When the card won't stretch to it, a dirtbag's night.
    const broke = { ...s, cash: MONEY.vanSpot - MONEY.cardLimit };
    expect(tonight(broke).living.skimped).toBe(true);
    expect(sleepAt(broke).state.cash).toBe(-MONEY.cardLimit);
    expect(act(s, { t: 'lifestyle', tier: 'comfortable' }).state.lifestyle).toBe('comfortable');
  });
});
