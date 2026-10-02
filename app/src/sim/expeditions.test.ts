// Phase 24.1: expeditions climbed. Each objective's pitches are lines, led in blocks with a
// partner; theirs go on the seed against their grade, and you can hand them one of yours. A
// night on the portaledge gives back less each time. The odds shown are worked out from the
// go's own model, and the bots' trips land near them.
import { describe, expect, it } from 'vitest';
import { gradeOf, needFor } from './climber';
import { EXPED_ROUTES, EXPEDITIONS, expedPitches } from './content/expeditions';
import { WALL_EVENTS } from './content/wallevents';
import { EXPED } from './dials';
import {
  bagKg,
  defaultPlan,
  forecastCall,
  highPoint,
  nightBack,
  nightGives,
  partners,
  planCost,
  planOdds,
  stormChance,
  stormOn,
  summitOdds,
  storyBlocked,
  tripBond,
  tripPay,
  tripWords,
  yourPitch,
} from './expeditions';
import { TRIP_END, TRIP_STORY } from './content/tripstories';
import { act, newGame } from './game';
import { expedTrip } from './harness';
import type { Action, GameState, TripPlan } from './types';

const k = (g: number) => {
  const n = needFor(g) + 0.3;
  return { power: n, fingers: n, endurance: n, technique: n, head: n };
};
const refused = (r: ReturnType<typeof act>) => {
  const e = r.events.find((x) => x.k === 'refused');
  return e?.k === 'refused' ? e.why : null;
};
const play = (s: GameState, ...as: Action[]): GameState => {
  for (const a of as) {
    const r = act(s, a);
    const why = refused(r);
    if (why) throw new Error(`${JSON.stringify(a)}: ${why}`);
    s = r.state;
  }
  return s;
};
const ready = (grade: number, seed = 'exped', over: Partial<GameState> = {}): GameState => ({
  ...act(newGame(seed), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  at: 'lot',
  cash: 5000,
  energy: 100,
  fed: 90,
  climber: { name: 'Kit', start: 'allrounder', skills: k(grade) },
  people: { hazel: { bond: 8, last: 0 }, sage: { bond: 4, last: 0 } },
  ...over,
});
const sent = { sent: true, hi: 16, fellAt: null, tried: ['A1'], skin: 0 };
// Book the plan the planner starts from (or this one), and leave today.
const leave = (s: GameState, id = 'elcap', over: Partial<TripPlan> = {}): GameState =>
  play(
    s,
    { t: 'exped', id, do: 'book', plan: { ...defaultPlan(s, id)!, ...over } },
    { t: 'exped', id, do: 'go' },
  );
// A clear day on El Cap for this seed, from day `from`.
const clear = (s: GameState, from = s.day) => {
  for (let d = from; ; d++) if (!stormOn(s.seed, 'elcap', EXPEDITIONS.elcap!, d)) return d;
};

describe('expedition pitches', () => {
  it('are lines with a crux, one for every pitch, nowhere in the valley', () => {
    for (const [id, e] of Object.entries(EXPEDITIONS)) {
      const ps = expedPitches(id);
      expect(ps).toHaveLength(e.pitches);
      expect(ps.map((r) => r.id)).toEqual(ps.map((_, i) => `${id}-${i + 1}`));
      for (const r of ps) {
        expect(r.exped).toBe(id);
        expect(r.wall).toBeUndefined();
        expect(r.cruxes.length).toBeGreaterThan(0);
        expect(r.grade).toBeLessThanOrEqual(e.grade);
      }
    }
    expect(EXPEDITIONS.cerrotorre!.objective).toBe('the Southeast Ridge');
    expect(Object.keys(EXPED_ROUTES)).toHaveLength(6 + 8 + 11);
  });

  it('go in blocks: yours first, then your partner’s; alone, every one is yours', () => {
    expect([0, 1, 2, 3, 4, 5].map((p) => yourPitch(p, false))).toEqual([
      true,
      true,
      false,
      false,
      true,
      true,
    ]);
    expect([0, 1, 2, 3].every((p) => yourPitch(p, true))).toBe(true);
  });
});

describe('booking and going', () => {
  it('needs the grade, the money in hand, and a partner close enough, unless you solo', () => {
    const plan = defaultPlan(ready(8), 'elcap')!;
    expect(refused(act(ready(6), { t: 'exped', id: 'elcap', do: 'book', plan }))).toMatch(/V7/);
    const cost = planCost(ready(8), 'elcap', plan);
    expect(cost).toBe(EXPEDITIONS.elcap!.cost + plan.food * EXPED.food);
    expect(
      refused(act(ready(8, 'x', { cash: cost - 1 }), { t: 'exped', id: 'elcap', do: 'book', plan })),
    ).toMatch(new RegExp(`\\$${cost}`));
    const lonely = ready(8, 'x', { people: { hazel: { bond: 1, last: 0 } } });
    expect(defaultPlan(lonely, 'elcap')).toBeNull();
    expect(refused(act(lonely, { t: 'exped', id: 'elcap', do: 'book', plan }))).toMatch(/close enough/);
    expect(leave({ ...lonely, mode: 'solo' }).expedition?.partner).toBeNull();
    // The closest comes, unless you choose.
    expect(partners(ready(8))).toEqual(['hazel', 'sage']);
    expect(leave(ready(8), 'elcap', { partner: 'sage' }).expedition?.partner).toBe('sage');
    const s = leave(ready(8));
    expect(s.expedition).toEqual({
      id: 'elcap',
      day: 1,
      pitch: 0,
      partner: 'hazel',
      nights: 0,
      food: plan.food,
      ledge: true,
      stove: false,
      seen: [],
    });
    expect(s.cash).toBe(5000 - cost);
    expect(s.booked).toBeNull();
    expect(refused(act(s, { t: 'travel', to: 'gym' }))).toMatch(/El Capitan/);
  });

  it('books up to a week out; you leave on the day, and miss it if you don’t', () => {
    const s = ready(9);
    const plan = { ...defaultPlan(s, 'elcap')!, day: s.day + 3 };
    expect(
      refused(act(s, { t: 'exped', id: 'elcap', do: 'book', plan: { ...plan, day: s.day + 8 } })),
    ).toMatch(/7 days/);
    const booked = play(s, { t: 'exped', id: 'elcap', do: 'book', plan });
    expect(booked.booked).toMatchObject({ id: 'elcap', day: s.day + 3 });
    expect(refused(act(booked, { t: 'exped', id: 'elcap', do: 'go' }))).toMatch(/flight is on day/);
    // Day three comes and goes at the van.
    let late = booked;
    for (let n = 0; n < 4; n++)
      late = play(
        { ...late, min: 21 * 60, deck: { ...late.deck, knock: late.day, last: late.day } },
        { t: 'act', act: 'lot.sleep' },
      );
    expect(late.booked).toBeNull();
    expect(late.log.some((l) => /left without you/.test(l.text))).toBe(true);
  });

  it('gives half back if you cancel', () => {
    const s = ready(9);
    const plan = defaultPlan(s, 'elcap')!;
    const c = play(
      s,
      { t: 'exped', id: 'elcap', do: 'book', plan },
      { t: 'exped', id: 'elcap', do: 'cancel' },
    );
    expect(c.booked).toBeNull();
    expect(c.cash).toBe(
      5000 - planCost(s, 'elcap', plan) + Math.round(planCost(s, 'elcap', plan) * EXPED.refund),
    );
  });

  it('packs a bag under its limit: water twice the weight without a stove where it’s snow', () => {
    const torre = EXPEDITIONS.cerrotorre!;
    expect(bagKg(torre, 5, true, false)).toBe(5 * EXPED.haul.perDay * 2 + EXPED.haul.ledge);
    expect(bagKg(torre, 5, true, true)).toBe(5 * EXPED.haul.perDay + EXPED.haul.ledge + EXPED.haul.stove);
    expect(bagKg(EXPEDITIONS.elcap!, 5, false, false)).toBe(5 * EXPED.haul.perDay);
    const s = ready(12);
    const heavy = { ...defaultPlan(s, 'cerrotorre')!, food: 15, stove: false };
    expect(refused(act(s, { t: 'exped', id: 'cerrotorre', do: 'book', plan: heavy }))).toMatch(
      /won’t take it/,
    );
    // Every kg over the free load costs a night's energy, and no portaledge halves it.
    expect(nightGives(0, true, EXPED.haul.free)).toBe(nightBack(0));
    expect(nightGives(0, true, EXPED.haul.free + 10)).toBe(Math.round(nightBack(0) - 10 * EXPED.haul.perKg));
    expect(nightGives(0, false, 0)).toBe(Math.round(nightBack(0) * EXPED.noLedge));
  });
});

describe('getting there and back', () => {
  it('takes days each way, and the valley’s weeks go on without you', () => {
    const s = ready(9, 'travel');
    const e = EXPEDITIONS.trango!;
    const t = leave(ready(14, 'travel', { people: { sage: { bond: 8, last: 0 } } }), 'trango');
    expect(t.day).toBe(s.day + e.out);
    expect(t.expedition!.day).toBe(1);
    const home = play(t, { t: 'exped', id: 'trango', do: 'bail' });
    expect(home.day).toBe(s.day + e.out + e.home);
    expect(home.at).toBe('lot');
    expect(home.log.some((l) => /Back at the Lot after 6 days/.test(l.text))).toBe(true);
  });

  it('drops the shifts in the trip with a week’s notice; with less, they’re yours to miss', () => {
    const s = { ...ready(9, 'notice'), shifts: [{ job: 'cafe', day: 9 }] };
    const plan = defaultPlan(s, 'elcap')!;
    const early = play(s, { t: 'exped', id: 'elcap', do: 'book', plan: { ...plan, day: s.day + 7 } });
    expect(early.shifts).toEqual([]);
    const late = play(s, { t: 'exped', id: 'elcap', do: 'book', plan: { ...plan, day: s.day + 6 } });
    expect(late.shifts).toEqual([{ job: 'cafe', day: 9 }]);
    // And you can't sign up for a day you'll be away.
    expect(refused(act(early, { t: 'signup', job: 'cafe', day: s.day + 7, on: true }))).toMatch(
      /away on El Capitan/,
    );
  });
});

describe('the forecast', () => {
  it('knows today, gets the days ahead right less often the further out, and the odds use it', () => {
    const s = ready(9, 'fc');
    const e = EXPEDITIONS.elcap!;
    expect(stormChance(s, 'elcap', s.day)).toBe(stormOn(s.seed, 'elcap', e, s.day) ? 1 : 0);
    const right = (lead: number) => {
      let n = 0;
      for (let d = 0; d < 400; d++) {
        const t = { ...s, day: s.day + d };
        const day = t.day + lead;
        if ((forecastCall(t, 'elcap', day) === 'storm') === stormOn(s.seed, 'elcap', e, day)) n++;
      }
      return n / 400;
    };
    expect(right(1)).toBeGreaterThan(right(8));
    expect(right(1)).toBeGreaterThan(0.85);
    // A storm called is likelier than the climate, a clear call less likely.
    for (let d = 1; d < EXPED.forecast.horizon; d++) {
      const c = stormChance(s, 'elcap', s.day + d);
      if (forecastCall(s, 'elcap', s.day + d) === 'storm') expect(c).toBeGreaterThan(e.stormOdds);
      else expect(c).toBeLessThan(e.stormOdds);
    }
  });

  it('moves the odds with the plan: a better partner, a dry week, a bag that’s too light', () => {
    const s = ready(9, 'plan');
    const plan = defaultPlan(s, 'elcap')!;
    const base = planOdds(s, 'elcap', plan);
    expect(planOdds(s, 'elcap', { ...plan, partner: 'sage' })).toBeGreaterThan(base);
    expect(planOdds(s, 'elcap', { ...plan, food: 2 })).toBeLessThan(base);
    const days = Array.from({ length: EXPED.ahead + 1 }, (_, d) =>
      planOdds(s, 'elcap', { ...plan, day: s.day + d }),
    );
    expect(Math.max(...days)).toBeGreaterThan(Math.min(...days));
  });
});

describe('up there', () => {
  const start = (grade = 9) => {
    let s = ready(grade);
    // Leave so the first day on the wall is a clear one.
    s = { ...s, day: clear(s, s.day + EXPEDITIONS.elcap!.out) - EXPEDITIONS.elcap!.out };
    return leave(s);
  };

  it('climbs your pitches as goes, in order, and only yours', () => {
    let s = start();
    expect(refused(act(s, { t: 'go', route: 'elcap-2' }))).toMatch(/Pitch 1 is next/);
    s = play(s, { t: 'go', route: 'elcap-1' }, { t: 'done', route: 'elcap-1', result: sent });
    expect(s.expedition!.pitch).toBe(1);
    expect(s.energy).toBe(100 - EXPED.pitch.energy);
    s = play(s, { t: 'go', route: 'elcap-2' }, { t: 'done', route: 'elcap-2', result: sent });
    // Pitch 3 is Hazel's.
    expect(refused(act(s, { t: 'go', route: 'elcap-3' }))).toMatch(/Hazel’s block/);
  });

  it('seconds your partner’s block for the day, on the seed; or hands them one of yours', () => {
    let s = start();
    const handed = act(s, { t: 'exped', id: 'elcap', do: 'follow' });
    expect(refused(handed)).toBeNull();
    expect(handed.state.today).toContain('exped');
    expect(handed.state.energy).toBe(100 - EXPED.follow);
    expect(refused(act(handed.state, { t: 'exped', id: 'elcap', do: 'follow' }))).toMatch(/the day/);
    // Alone, there's nobody to hand it to.
    s = leave({
      ...ready(9),
      mode: 'solo',
      day: clear(ready(9), 1 + EXPEDITIONS.elcap!.out) - EXPEDITIONS.elcap!.out,
    });
    expect(refused(act(s, { t: 'exped', id: 'elcap', do: 'follow' }))).toMatch(/alone/);
  });

  it('gives back less every night on the portaledge, and feeds you from the rations', () => {
    expect(nightBack(1)).toBeLessThan(nightBack(0));
    let s = start();
    s = play(s, { t: 'go', route: 'elcap-1' }, { t: 'done', route: 'elcap-1', result: sent });
    const e0 = s.energy;
    s = play(s, { t: 'exped', id: 'elcap', do: 'camp' });
    expect(s.expedition).toMatchObject({ day: 2, nights: 1 });
    const x = s.expedition!;
    expect(s.energy).toBe(
      Math.min(100, e0 + nightGives(0, true, bagKg(EXPEDITIONS.elcap!, x.food, true, false))),
    );
    expect(s.fed).toBeGreaterThanOrEqual(EXPED.ration);
    expect(s.expedition!.food).toBe(defaultPlan(ready(9), 'elcap')!.food - 1);
  });

  it('won’t lead in a storm or in the dark', () => {
    let s = ready(9);
    let d = s.day;
    while (!stormOn(s.seed, 'elcap', EXPEDITIONS.elcap!, d + EXPEDITIONS.elcap!.out)) d++;
    s = leave({ ...s, day: d });
    expect(refused(act(s, { t: 'go', route: 'elcap-1' }))).toMatch(/storm/);
    const dark = leave({
      ...ready(9),
      day: clear(ready(9), 1 + EXPEDITIONS.elcap!.out) - EXPEDITIONS.elcap!.out,
    });
    expect(refused(act({ ...dark, min: 20 * 60 }, { t: 'go', route: 'elcap-1' }))).toMatch(/dark/);
  });

  it('pays at the summit, and comes home with nothing when time runs out or you bail', () => {
    let s = start();
    s = { ...s, expedition: { ...s.expedition!, pitch: 5 } };
    // Pitch 6 is yours (the third block).
    const cash = s.cash;
    s = play(s, { t: 'go', route: 'elcap-6' }, { t: 'done', route: 'elcap-6', result: sent });
    expect(s.expedition).toBeNull();
    expect(s.cash).toBe(cash + EXPEDITIONS.elcap!.pays);
    let out = start();
    out = { ...out, expedition: { ...out.expedition!, day: EXPEDITIONS.elcap!.days } };
    out = play(out, { t: 'exped', id: 'elcap', do: 'camp' });
    expect(out.expedition).toBeNull();
    expect(play(start(), { t: 'exped', id: 'elcap', do: 'bail' }).expedition).toBeNull();
    // Out of food and water: down at the next night.
    let dry = start();
    dry = { ...dry, expedition: { ...dry.expedition!, food: 0 } };
    dry = play(dry, { t: 'exped', id: 'elcap', do: 'camp' });
    expect(dry.expedition).toBeNull();
    expect(dry.log.some((l) => /water's gone/.test(l.text))).toBe(true);
  });
});

describe('what happens up there', () => {
  // Camp out a whole trip, answering whatever comes with `opt`, and say what came.
  const sitOut = (s: GameState, id = 'elcap', opt = 0) => {
    const came: string[] = [];
    while (s.expedition) {
      if (s.encounter?.kind === 'wall') {
        came.push(s.encounter.id);
        s = play(s, { t: 'answer', opt });
      } else s = play(s, { t: 'exped', id, do: 'camp' });
    }
    return came;
  };
  const trips = (n: number, over: Partial<TripPlan> = {}, id = 'elcap') =>
    Array.from({ length: n }, (_, i) => sitOut(leave(ready(12, `wall-${i}`), id, over), id));

  it('comes some mornings, never twice a trip, never more than a couple', () => {
    const all = trips(40);
    expect(all.some((c) => c.length > 0)).toBe(true);
    expect(all.some((c) => c.length === 0)).toBe(true);
    for (const c of all) {
      expect(new Set(c).size).toBe(c.length);
      expect(c.length).toBeLessThanOrEqual(EXPED.events.max);
    }
  });

  it('brings the stove only where there’s one and the water’s snow, and a stranger only to a pair', () => {
    expect(EXPEDITIONS.elcap!.melt).toBeFalsy();
    expect(trips(40).flat()).not.toContain('stove');
    const alone = Array.from({ length: 40 }, (_, i) => {
      const s = leave(ready(12, `wall-${i}`));
      return sitOut({ ...s, expedition: { ...s.expedition!, partner: null } });
    });
    expect(alone.flat()).not.toContain('party');
    const torre = trips(40, {}, 'cerrotorre').flat();
    expect(new Set(torre).size).toBeGreaterThan(3);
  });

  it('waits on your call, and the call costs what it says', () => {
    const at = (id: string) => {
      const s = leave(ready(12, 'call'));
      return { ...s, encounter: { kind: 'wall' as const, id } };
    };
    // Nothing else while it's asking.
    expect(refused(act(at('cam'), { t: 'exped', id: 'elcap', do: 'camp' }))).toBeTruthy();
    // Food cut loose.
    const pig = at('haulbag');
    expect(play(pig, { t: 'answer', opt: 1 }).expedition!.food).toBe(pig.expedition!.food - 2);
    // A day gone: a night up there, and still on the wall.
    const fall = at('rockfall');
    const sat = play(fall, { t: 'answer', opt: 0 });
    expect(sat.encounter?.kind === 'wall' ? null : sat.encounter).toBeNull();
    expect(sat.expedition).toMatchObject({ day: fall.expedition!.day + 1, nights: 1 });
    // Hurt by going through it.
    expect(play(fall, { t: 'answer', opt: 1 }).energy).toBe(fall.energy - 30);
    // A pitch to fix again, and never below the ground.
    const sq = at('squall');
    expect(play(sq, { t: 'answer', opt: 1 }).expedition!.pitch).toBe(0);
    const up = { ...sq, expedition: { ...sq.expedition!, pitch: 3 } };
    expect(play(up, { t: 'answer', opt: 1 }).expedition!.pitch).toBe(2);
    // Your partner sees you help.
    const party = at('party');
    const p = party.expedition!.partner!;
    expect(play(party, { t: 'answer', opt: 0 }).people[p]!.bond).toBe(party.people[p]!.bond + 1);
    // An answer that isn't there.
    expect(refused(act(at('cam'), { t: 'answer', opt: 5 }))).toBeTruthy();
  });

  it('shows in the odds: a trip where nothing can happen is likelier', () => {
    const s = leave(ready(9, 'odds'));
    const from = { ...s.expedition!, day: 1, on: s.day, energy: s.energy };
    const calm = summitOdds(s, 'elcap', {
      ...from,
      seen: WALL_EVENTS.slice(0, EXPED.events.max).map((w) => w.id),
    });
    expect(summitOdds(s, 'elcap', from)).toBeLessThan(calm);
  });

  it('every event has two calls, each with a cost', () => {
    for (const w of WALL_EVENTS) {
      expect(w.opts).toHaveLength(2);
      for (const o of w.opts) expect(Object.keys(o.fx).length).toBeGreaterThan(0);
    }
  });
});

describe('coming home', () => {
  // Away on El Cap with Hazel, the first day on the wall a clear one.
  const away = (seed = 'home') => {
    let s = ready(9, seed);
    s = { ...s, day: clear(s, s.day + EXPEDITIONS.elcap!.out) - EXPEDITIONS.elcap!.out };
    return leave(s);
  };
  const at = (s: GameState, pitch: number): GameState => ({ ...s, expedition: { ...s.expedition!, pitch } });
  const E = EXPEDITIONS.elcap!;
  const B = EXPED.home.bond;

  it('tops out: paid, Hazel closer, the trip in the book, and its card', () => {
    let s = away();
    const last = E.pitches - 1;
    expect(yourPitch(last, false)).toBe(true);
    s = at(s, last);
    const bond0 = s.people.hazel!.bond;
    const cash0 = s.cash;
    const go = act(s, { t: 'go', route: `elcap-${E.pitches}` });
    const r = act(go.state, { t: 'done', route: `elcap-${E.pitches}`, result: sent });
    expect(refused(r)).toBeNull();
    s = r.state;
    expect(s.expedition).toBeNull();
    expect(s.cash).toBeGreaterThanOrEqual(cash0 + E.pays - 1);
    expect(s.people.hazel!.bond).toBeGreaterThanOrEqual(bond0 + B.summit);
    expect(s.book).toEqual([
      {
        id: 'elcap',
        day: s.day,
        end: 'summit',
        high: E.pitches,
        partner: 'hazel',
        nights: 0,
        seen: [],
        told: false,
      },
    ]);
    expect(r.events).toContainEqual({ k: 'home', id: 'elcap' });
    expect(highPoint(s, 'elcap')).toEqual({ high: E.pitches, summit: true });
  });

  it('pays once: a second summit of the same objective pays nothing', () => {
    const top = (s: GameState) => {
      const last = E.pitches - 1;
      const at_ = at(s, last);
      const go = act(at_, { t: 'go', route: `elcap-${E.pitches}` }).state;
      return act(go, { t: 'done', route: `elcap-${E.pitches}`, result: sent });
    };
    const first = top(away('pay-1')).state;
    expect(tripPay(away('pay-1'), 'elcap')).toBe(E.pays);
    expect(tripPay(first, 'elcap')).toBe(0);
    expect(tripPay(first, 'cerrotorre')).toBe(EXPEDITIONS.cerrotorre!.pays);
    // Back for it again: up there with the book from the first, the top pays nothing.
    let again = { ...away('pay-2'), book: first.book };
    const cash0 = again.cash;
    const r = top(again);
    again = r.state;
    expect(again.book.filter((t) => t.end === 'summit')).toHaveLength(2);
    expect(again.cash).toBeLessThan(cash0 + 1);
    expect(r.events.some((e) => e.k === 'line' && /same photos twice/.test(e.text))).toBe(true);
  });

  it('a trip that fails keeps its high point, and Hazel moves with how far you got', () => {
    const bail = (pitch: number) => {
      const s = at(away(), pitch);
      const b = s.people.hazel!.bond;
      const h = play(s, { t: 'exped', id: 'elcap', do: 'bail' });
      return { d: h.people.hazel!.bond - b, h };
    };
    expect(bail(1).d).toBe(0);
    const half = Math.ceil(E.pitches / 2);
    expect(bail(half).d).toBe(B.half);
    expect(bail(half).h.book[0]).toMatchObject({ end: 'bail', high: half });
    // Out of water: down, and Hazel a little further off.
    const dry = { ...away(), expedition: { ...away().expedition!, food: 0 } };
    const b0 = dry.people.hazel!.bond;
    const wet = play(dry, { t: 'exped', id: 'elcap', do: 'camp' });
    expect(wet.book[0]!.end).toBe('water');
    expect(wet.people.hazel!.bond).toBe(b0 + B.water);
    // A high point is the best of every trip there.
    const two = { ...bail(half).h, expedition: null };
    const both = { ...two, book: [...two.book, { ...two.book[0]!, high: 2 }] };
    expect(highPoint(both, 'elcap')).toEqual({ high: half, summit: false });
    expect(highPoint(both, 'cerrotorre')).toBeNull();
    expect(tripBond(E, 'time', 1)).toBe(0);
  });

  it('is told at the fire once: psyche, and a night with whoever’s there', () => {
    const home = play(at(away(), 3), { t: 'exped', id: 'elcap', do: 'bail' });
    expect(storyBlocked({ ...home, min: 10 * 60 })).toMatch(/dark/);
    const night = { ...home, at: 'lot', min: 21 * 60, psyche: { ...home.psyche, level: 50 } };
    expect(storyBlocked(night)).toBeNull();
    const r = act(night, { t: 'story' });
    expect(refused(r)).toBeNull();
    expect(r.state.psyche.level).toBe(50 + EXPED.story.psyche.short);
    expect(r.state.min).toBe(night.min + EXPED.story.min);
    expect(r.state.book[0]!.told).toBe(true);
    expect(r.state.people.hazel!.last).toBe(r.state.day);
    expect(refused(act(r.state, { t: 'story' }))).toMatch(/told/);
  });

  it('says every ending in words, nothing left unfilled', () => {
    for (const end of ['summit', 'bail', 'water', 'time'] as const) {
      const w = tripWords({
        id: 'elcap',
        day: 1,
        end,
        high: 4,
        partner: 'hazel',
        nights: 2,
        seen: [],
        told: false,
      });
      for (const t of [TRIP_STORY[end], TRIP_END[end]]) {
        const out = t.replace(/\{(\w+)\}/g, (m, k: string) => String(w[k] ?? m));
        expect(out).not.toMatch(/[{}]/);
      }
    }
  });
});

describe('the odds', () => {
  const from = (s: GameState) => ({ ...s.expedition!, day: 1, on: s.day, energy: s.energy });
  it('rise with your grade and a stronger partner, and the gate hardly ever goes', () => {
    const odds = (g: number, people: GameState['people']) => {
      const s = leave(ready(g, 'odds', { people }));
      return summitOdds(s, 'elcap', from(s));
    };
    const hazel = { hazel: { bond: 8, last: 0 } };
    const sage = { sage: { bond: 8, last: 0 } };
    expect(odds(7, hazel)).toBeLessThan(0.1);
    expect(odds(9, hazel)).toBeGreaterThan(odds(8, hazel));
    expect(odds(11, hazel)).toBeGreaterThan(odds(9, hazel));
    expect(odds(9, sage)).toBeGreaterThan(odds(9, hazel));
  });

  it('are near what climbers’ hands get on the wall', () => {
    let shown = 0;
    let got = 0;
    const N = 40;
    for (let i = 0; i < N; i++) {
      const s0 = ready(9, `cal-${i}`);
      const s = leave(s0);
      shown += summitOdds(s, 'elcap', from(s));
      if (expedTrip(s0, 'elcap', `hands-${i}`)) got++;
    }
    expect(gradeOf(k(9))).toBe(9);
    expect(Math.abs(shown / N - got / N)).toBeLessThan(0.2);
    // Forty whole trips, each choosing every day from the odds: past vitest's 5 s on CI.
  }, 60_000);
});
