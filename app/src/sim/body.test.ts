import { describe, expect, it } from 'vitest';
import { goLoad, injuryChance, projected, ratio, rollInjury, zone } from './body';
import { needFor } from './climber';
import { ROUTES } from './content/routes';
import { INJURY, LOAD, MONEY } from './dials';
import { act, goBlocked, newGame } from './game';
import type { GameState, GoResult, Load } from './types';

const crag = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('body'),
  at: 'road',
  min: 9 * 60,
  climber: {
    name: 'T',
    start: 'allrounder',
    skills: { power: 30, fingers: 30, endurance: 30, technique: 30, head: 30 },
  },
  ...over,
});
// Folds a day of `today` load into the averages, as a night's sleep does.
const night = (l: Load, today: number): Load => {
  const p = projected({ ...l, today });
  return { acute: p.acute, chronic: p.chronic, today: 0 };
};
const fell: GoResult = { sent: false, hi: 12, fellAt: null, tried: [], skin: 0 };

describe('training load', () => {
  it('counts a go by its effort, its grade and how far you got', () => {
    expect(goLoad(10, 0, 1)).toBe(10);
    expect(goLoad(10, 9, 1)).toBe(20);
    expect(goLoad(10, 0, 0)).toBe(6);
  });

  it('starts seeded, so a steady first week reads as steady', () => {
    let l = newGame('x').load;
    // Read after a moderate day's goes: steady from the first morning.
    expect(ratio({ ...l, today: LOAD.start })).toBeCloseTo(1, 5);
    for (let d = 0; d < 7; d++) l = night(l, LOAD.start);
    expect(ratio({ ...l, today: LOAD.start })).toBeCloseTo(1, 5);
    // With nothing done yet today, it reads as if today were a rest day.
    expect(ratio(l)).toBeLessThan(1);
  });

  it('spikes on a run of big days, and a rest day pays it back', () => {
    let l = newGame('x').load;
    const big = LOAD.start * 3;
    // The ratio at the end of each big day, before sleep folds it in.
    const seen: number[] = [];
    for (let d = 0; d < 4; d++) {
      seen.push(ratio({ ...l, today: big }));
      l = night(l, big);
    }
    expect(seen[0]).toBeGreaterThan(LOAD.risk);
    expect(Math.max(...seen)).toBeGreaterThan(LOAD.slow);
    const before = ratio(l);
    l = night(l, 0);
    expect(ratio(l)).toBeLessThan(before);
    expect(zone(0.5)).toBe('easy');
    expect(zone(1)).toBe('steady');
    expect(zone(1.4)).toBe('talking');
    expect(zone(1.6)).toBe('slow');
    expect(zone(1.8)).toBe('fried');
  });

  it('counts today’s goes straight away', () => {
    const l = newGame('x').load;
    expect(ratio({ ...l, today: LOAD.start * 4 })).toBeGreaterThan(ratio(l));
  });
});

describe('injuries', () => {
  // Averages whose ratio, read now with nothing done today, is x.
  const spiked = (x: number): Load => ({
    acute: (x * LOAD.start * (1 - LOAD.chronicRate)) / (1 - LOAD.acuteRate),
    chronic: LOAD.start,
    today: 0,
  });
  it('spikes to order', () => expect(ratio(spiked(1.6))).toBeCloseTo(1.6, 9));

  it('only risk a go over the line, more on crimps, cold or hungry', () => {
    const r = ROUTES.crimpfest!;
    expect(injuryChance(crag(), r, 10, false)).toBe(0);
    const hot = crag({ load: spiked(1.6) });
    const p = injuryChance(hot, r, 10, false);
    expect(p).toBeGreaterThan(0);
    expect(injuryChance(hot, ROUTES.warm!, 10, false)).toBeLessThan(p);
    expect(injuryChance(hot, r, 10, true)).toBeCloseTo(p * LOAD.coldRisk);
    expect(injuryChance({ ...hot, fed: 0 }, r, 10, false)).toBeGreaterThan(p);
    expect(injuryChance(crag({ load: spiked(9) }), r, 10, false)).toBeLessThanOrEqual(
      LOAD.riskCap * LOAD.typeRisk.crimp,
    );
  });

  it('roll from the seed: the same go always rolls the same, and bigger spikes hurt worse', () => {
    const r = ROUTES.crimpfest!;
    const s = crag({ load: spiked(2.2) });
    const rolls = Array.from({ length: 60 }, (_, n) => rollInjury(s, r, 20, true, n));
    expect(rolls).toEqual(Array.from({ length: 60 }, (_, n) => rollInjury(s, r, 20, true, n)));
    const hurt = rolls.filter((x) => x !== null);
    expect(hurt.length).toBeGreaterThan(0);
    for (const h of hurt) {
      const [lo, hi] = INJURY.days[h.tier - 1]!;
      expect(h.until - s.day - 1).toBeGreaterThanOrEqual(lo);
      expect(h.until - s.day - 1).toBeLessThanOrEqual(hi);
      expect(h.kind).toMatch(/finger|pulley/);
    }
    expect(Math.max(...hurt.map((h) => h.tier))).toBeGreaterThan(1);
  });

  it('keep you off the rock until they heal, and the first clinic visit is free', () => {
    // Find a go that hurts, deterministically, by walking the seeds.
    let hit: { s: GameState; events: ReturnType<typeof act>['events'] } | null = null;
    for (let k = 0; k < 400 && !hit; k++) {
      const s0 = crag({ seed: `hurt-${k}`, load: spiked(2.4), today: [] });
      const went = act(s0, { t: 'go', route: 'crimpfest' });
      const done = act(went.state, { t: 'done', route: 'crimpfest', result: fell });
      if (done.events.some((e) => e.k === 'injured')) hit = { s: done.state, events: done.events };
    }
    expect(hit).not.toBeNull();
    const { s, events } = hit!;
    const ev = events.find((e) => e.k === 'injured');
    expect(ev?.k === 'injured' && ev.days).toBeGreaterThan(0);
    expect(s.hurt).toBe(1);
    expect(s.injury).not.toBeNull();
    expect(goBlocked(s, ROUTES.warm!)).toMatch(new RegExp(`^Your ${s.injury!.kind} needs \\d+ more days?$`));
    // The first bill is waived, whatever the tier.
    const lines = events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
    if (s.injury!.tier > 1)
      expect(lines).toContain('The clinic waves off the bill. First one’s on the house, apparently.');
    // Sleep it off.
    let t = { ...s, min: 18 * 60, at: 'lot' };
    const until = s.injury!.until;
    let healed: string[] = [];
    while (t.day < until) {
      let r = act({ ...t, min: 18 * 60, at: 'lot', cash: 100 }, { t: 'act', act: 'lot.sleep' });
      // Someone knocks (Phase 22.6a): answer, and the night goes on.
      if (r.state.encounter) r = act(r.state, { t: 'answer', opt: 0 });
      t = r.state;
      healed = r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
    }
    expect(t.injury).toBeNull();
    expect(healed).toContain(`Your ${s.injury!.kind} feels normal again. Ease back in.`);
    expect(goBlocked(t, ROUTES.warm!) ?? '').not.toMatch(/needs/);
    expect(MONEY.vanSpot).toBeGreaterThan(0);
  });

  it('fry you past 1.7, and teach less past 1.5', () => {
    expect(goBlocked(crag({ load: spiked(2) }), ROUTES.warm!)).toBe(
      "You're fried. Your body wants a rest day",
    );
    const fresh = act(act(crag(), { t: 'go', route: 'warm' }).state, {
      t: 'done',
      route: 'warm',
      result: { sent: true, hi: 7, fellAt: null, tried: ['A1'], skin: 0 },
    });
    const slow = act(act(crag({ load: spiked(1.6), seed: 'slow-1' }), { t: 'go', route: 'warm' }).state, {
      t: 'done',
      route: 'warm',
      result: { sent: true, hi: 7, fellAt: null, tried: ['A1'], skin: 0 },
    });
    const g = (e: typeof fresh.events) => {
      const x = e.find((v) => v.k === 'skills');
      return x?.k === 'skills' ? (x.gains.endurance ?? 0) : 0;
    };
    expect(g(slow.events)).toBeCloseTo(g(fresh.events) * LOAD.slowGains, 1);
  });

  it('warm you up with your first go, and fold the day into the averages at night', () => {
    const s = act(crag(), { t: 'go', route: 'warm' }).state;
    const done = act(s, { t: 'done', route: 'warm', result: fell }).state;
    expect(done.today).toContain('warm');
    expect(done.load.today).toBeGreaterThan(0);
    const slept = act({ ...done, at: 'lot', min: 18 * 60 }, { t: 'act', act: 'lot.sleep' }).state;
    expect(slept.load.today).toBe(0);
    expect(slept.load.acute).toBeCloseTo(projected(done.load).acute, 1);
    expect(needFor(0)).toBe(0);
  });
});
