// Phase 30.3 (Evan's call: all three, from 35): a late career's runway. A clinic at the Cave, a
// comp's problems set the day before, and a sponsor's ambassador terms; paid like work, never
// more than a job's.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dayAtAge } from './ageing';
import { needFor } from './climber';
import { isWeekend } from './cond';
import { COMP_TIERS } from './content/comps';
import { JOBS } from './content/jobs';
import { ACTS } from './content/places';
import { ROUTES } from './content/routes';
import { RUNWAY_SAYS } from './content/runway';
import { RUNWAY } from './dials';
import { act, emptyLog, newGame } from './game';
import { cyclePay, cycleTasks } from './media';
import { SPONSORS } from './content/media';
import { clinicBlocked, clinicHeads, clinicPay, setCompBlocked } from './runway';
import { fromSave, MIGRATIONS } from './save';
import type { GameState } from './types';

const V68 = readFileSync(new URL('./fixtures/save-v68.json', import.meta.url), 'utf8');
const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');
const paid = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'paid' ? [e] : []));
const n = needFor(10);
const strong = (age: number, pick: (d: number) => boolean, over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('runway'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  const t = {
    ...s,
    climber: { ...s.climber, skills: { power: n, fingers: n, endurance: n, technique: n, head: n } },
  };
  let day = dayAtAge(t, age);
  while (!pick(day)) day++;
  return { ...t, day, min: 9 * 60, energy: 100, cash: 100, ...over };
};
const coach = (rank: number) => ({ coach: JOBS.coach!.at[rank]! });
// A weekend morning at the Cave, 36 and a Coach.
const clinicDay = (over: Partial<GameState> = {}) =>
  strong(36, isWeekend, {
    at: 'cave',
    jobs: { ...newGame('runway').jobs, ...coach(RUNWAY.clinic.coach) },
    ...over,
  });
// The day before League night at Send City, 36 and a Senior setter.
const LEAGUE = COMP_TIERS[0]!;
const eve = (d: number) => (d + 1) % LEAGUE.every === LEAGUE.on % LEAGUE.every;
const setDay = (over: Partial<GameState> = {}) =>
  strong(36, eve, {
    at: 'gym',
    jobs: { ...newGame('runway').jobs, set: JOBS.set!.at[RUNWAY.setComp.rank]! },
    ...over,
  });

describe('a save from before the runway', () => {
  it('loads as it was, and its sponsor’s next cycle asks a 35-year-old for a clinic', () => {
    const r = fromSave(V68);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(68);
    // Phase 32.2: and no clues to the Hollow.
    const old = JSON.parse(V68).state;
    // Phase 32.4: its first ascents' repeats so far, heard of quietly.
    expect(r.state).toEqual({
      sesh: null,
      seshFirsts: 0,
      vanPlan: expect.any(Object),
      ...old,
      hollow: { clues: [], tries: 0 },
      boltedCracks: [],
      firsts: (MIGRATIONS[72]!(old) as GameState).firsts,
      deck: { ...(MIGRATIONS[73]!(old) as GameState).deck, back: [] },
    });
    const sp = r.state.media.sponsor!;
    const next = cycleTasks(r.state, sp.tier, sp.terms);
    expect(next[0]).toEqual({ kind: 'clinic', done: false });
    expect(next.some((t) => t.kind === 'send')).toBe(false);
  });
});

describe('ambassador terms', () => {
  it('pay half an athlete’s stipend', () => {
    const young = strong(34, () => true);
    const old = strong(RUNWAY.from, () => true);
    const athlete = { tier: 1, terms: 'real' as const, tasks: cycleTasks(young, 1, 'real') };
    const ambassador = { tier: 1, terms: 'real' as const, tasks: cycleTasks(old, 1, 'real') };
    expect(cyclePay(athlete)).toBe(SPONSORS[1]!.stipend);
    expect(cyclePay(ambassador)).toBe(Math.round(SPONSORS[1]!.stipend * RUNWAY.ambassador));
  });

  it('ask for a clinic from 35, a send before', () => {
    expect(
      cycleTasks(
        strong(34, () => true),
        0,
        'real',
      )[0]!.kind,
    ).toBe('send');
    expect(
      cycleTasks(
        strong(RUNWAY.from, () => true),
        0,
        'real',
      )[0],
    ).toEqual({ kind: 'clinic', done: false });
  });
});

describe('a clinic', () => {
  it('is a weekend morning at the Cave, from 35, for a Coach or a sponsored climber', () => {
    expect(clinicBlocked(clinicDay())).toBeNull();
    expect(
      clinicBlocked(strong(34, isWeekend, { at: 'cave', jobs: { ...newGame('runway').jobs, ...coach(1) } })),
    ).toMatch(/35/);
    expect(clinicBlocked(clinicDay({ jobs: newGame('runway').jobs }))).toMatch(/coach/);
    expect(clinicBlocked(clinicDay({ at: 'gym' }))).toMatch(/Cave/);
    expect(clinicBlocked(clinicDay({ min: RUNWAY.clinic.by + 1 }))).toMatch(/morning/);
    const weekday = strong(36, (d) => !isWeekend(d), {
      at: 'cave',
      jobs: { ...newGame('runway').jobs, ...coach(1) },
    });
    expect(clinicBlocked(weekday)).toMatch(/weekend/);
    // A sponsor's name is enough.
    const s = clinicDay({ jobs: newGame('runway').jobs });
    const sp = {
      tier: 0,
      terms: 'real' as const,
      due: s.day + 5,
      tasks: cycleTasks(s, 0, 'real'),
      strikes: 0,
    };
    expect(clinicBlocked({ ...s, media: { ...s.media, sponsor: sp } })).toBeNull();
  });

  it('fills from what you’ve climbed, pays as work, once a day, and answers the sponsor', () => {
    const s = clinicDay();
    expect(clinicHeads(s)).toBe(RUNWAY.clinic.base);
    const hard = Object.values(ROUTES).find((r) => r.grade >= 12 && !r.wall && !r.exped)!;
    const sent = clinicDay({
      routes: { [hard.id]: { ...emptyLog(), sent: { day: 3, go: 2, style: 'redpoint' } } },
    });
    expect(clinicHeads(sent)).toBe(
      Math.min(RUNWAY.clinic.most, RUNWAY.clinic.base + Math.floor(hard.grade / RUNWAY.clinic.per)),
    );
    const sp = {
      tier: 0,
      terms: 'real' as const,
      due: sent.day + 5,
      tasks: cycleTasks(sent, 0, 'real'),
      strikes: 0,
    };
    const t = { ...sent, media: { ...sent.media, sponsor: sp } };
    const r = act(t, { t: 'clinic' });
    expect(refused(r)).toBe(false);
    expect(r.state.cash).toBe(t.cash + clinicPay(t));
    expect(r.state.min).toBe(t.min + RUNWAY.clinic.min);
    expect(paid(r)).toEqual([{ k: 'paid', from: 'job', cash: clinicPay(t) }]);
    expect(r.state.media.sponsor!.tasks.find((x) => x.kind === 'clinic')!.done).toBe(true);
    expect(refused(act({ ...r.state, min: 9 * 60 }, { t: 'clinic' }))).toBe(true);
  });
});

describe('setting a comp', () => {
  it('is the day before one, at its venue, for a Senior setter from 35, paid as a long day', () => {
    const s = setDay();
    expect(setCompBlocked(s)).toBeNull();
    const r = act(s, { t: 'setComp' });
    expect(refused(r)).toBe(false);
    expect(r.state.cash).toBe(s.cash + RUNWAY.setComp.pay);
    expect(paid(r)).toEqual([{ k: 'paid', from: 'job', cash: RUNWAY.setComp.pay }]);
    expect(refused(act(r.state, { t: 'setComp' }))).toBe(true);
    expect(setCompBlocked(setDay({ day: s.day + 1 }))).toMatch(/No comp/);
    expect(setCompBlocked(setDay({ jobs: { ...newGame('runway').jobs, set: JOBS.set!.at[1]! } }))).toMatch(
      /senior/,
    );
  });
});

describe('the runway’s pay', () => {
  it('never comes to more than a job’s', () => {
    const shift = (job: string, rank: number) => {
      const a = Object.values(ACTS).find((x) => x.job?.id === job && x.job.shifts === 1)!;
      return { pay: (a.cost.cash ?? 0) + JOBS[job]!.raise * rank, hours: (a.cost.min ?? 60) / 60 };
    };
    const head = shift('coach', JOBS.coach!.ranks.length - 1);
    expect(RUNWAY.clinic.most * RUNWAY.clinic.fee).toBeLessThan(head.pay);
    const setter = shift('set', JOBS.set!.ranks.length - 1);
    expect(RUNWAY.setComp.pay / (RUNWAY.setComp.min / 60)).toBeLessThanOrEqual(setter.pay / setter.hours);
  });

  it('is said from the rules, with no number of its own', () => {
    for (const say of Object.values(RUNWAY_SAYS))
      for (const t of Object.values(say)) expect(t).not.toMatch(/\d/);
  });
});
