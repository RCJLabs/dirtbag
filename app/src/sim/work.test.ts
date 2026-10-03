// Phase 18.1: shifts played. The setter's puzzle: a brief a day, scored on the grade, the
// flow, the wall and the crowd; never solved, since the best set moves with the brief; never
// worse than working the shift. And leave: a rank's days off, called in, not warned.
import { describe, expect, it } from 'vitest';
import { ACTS } from './content/places';
import { JOBS } from './content/jobs';
import { PICKS, SET_MOVES } from './content/setting';
import { COACH, FLOOR, HAUL, PLAY, RUSH, SETTING } from './dials';
import { act, actCost, newGame } from './game';
import { isPosted } from './jobs';
import {
  coachSession,
  coached,
  dropChance,
  dropCost,
  haulOffer,
  pickWeight,
  rosterToday,
  type Focus,
  dinerFloor,
  floorBest,
  floorRefused,
  floorTips,
  leaveLeft,
  playBonus,
  rushBest,
  rushQueue,
  rushRefused,
  rushTips,
  scoreSet,
  setBrief,
  setRefused,
  type SetBrief,
} from './work';
import type { GameState } from './types';

const strong = { power: 400, fingers: 400, endurance: 400, technique: 400, head: 400 };
const base = (over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('work'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  return {
    ...s,
    at: 'gym',
    min: 8 * 60,
    energy: 100,
    climber: { ...s.climber, skills: strong },
    shifts: [{ job: 'set', day: 1 }],
    ...over,
  };
};
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));

function* perms(a: readonly string[], k: number, pre: string[] = []): Generator<string[]> {
  if (pre.length === k) {
    yield pre;
    return;
  }
  for (const x of a) if (!pre.includes(x)) yield* perms(a, k, [...pre, x]);
}
const best = (b: SetBrief) => {
  let top = { score: -1, set: [] as string[] };
  for (const p of perms(b.hand, SETTING.pick)) {
    const sc = scoreSet(b, p).score;
    if (sc > top.score) top = { score: sc, set: p };
  }
  return top;
};

describe('the setter’s puzzle', () => {
  it('briefs a day the same on a reload, with a rest in a hand that grows with your rank', () => {
    const s = base();
    expect(setBrief(s)).toEqual(setBrief(base()));
    for (let r = 0; r < JOBS.set!.ranks.length; r++) {
      const b = setBrief(base({ jobs: { set: JOBS.set!.at[r]! } }));
      expect(b.hand).toHaveLength(SETTING.hand[r]!);
      expect(b.hand.some((m) => SET_MOVES[m]!.kind === 'rest')).toBe(true);
      expect(b.want).toBeGreaterThanOrEqual(SETTING.want.step * r);
    }
  });

  it('scores the grade, the flow, the wall and the crowd', () => {
    const b: SetBrief = { wall: 'overhang', crowd: 'team', want: 4, hand: Object.keys(SET_MOVES) };
    const good = scoreSet(b, ['jug', 'undercling', 'slap', 'campus', 'deadpoint']);
    expect(good).toMatchObject({ crux: true, rest: true, linked: true, varied: true, crowd: true });
    expect(good.grade).toBe(4);
    expect(good.score).toBeGreaterThan(0.9);
    // Two dynos running, no rest before the crux, off the wall's style, over the grade.
    const bad = scoreSet(b, ['dyno', 'slap', 'mono', 'gaston', 'jug']);
    expect(bad).toMatchObject({ rest: false, linked: false });
    expect(bad.score).toBeLessThan(0.5);
  });

  it('isn’t solved: the best set moves with the brief (criterion 3)', () => {
    const optima = new Map<string, number>();
    const days = 60;
    for (let d = 1; d <= days; d++) {
      const k = best(setBrief(base({ day: d, jobs: { set: JOBS.set!.at[2]! } }))).set.join();
      optima.set(k, (optima.get(k) ?? 0) + 1);
    }
    expect(optima.size).toBeGreaterThan(days / 2);
    expect(Math.max(...optima.values())).toBeLessThan(days / 10);
  });

  it('pays a played shift at least the shift, and more for a good set', () => {
    expect(playBonus(30, 0)).toBe(0);
    expect(playBonus(30, PLAY.from)).toBe(0);
    expect(playBonus(30, 1)).toBe(Math.round(30 * PLAY.top));
    const s = base();
    const b = setBrief(s);
    const top = best(b);
    const worked = act(s, { t: 'act', act: 'gym.set' });
    const played = act(s, { t: 'act', act: 'gym.set', play: { set: top.set } });
    const pay = actCost(s, ACTS['gym.set']!).cash!;
    expect(played.state.cash - worked.state.cash).toBe(playBonus(pay, top.score));
    expect(lines(played).some((l) => l.startsWith('Your set: V'))).toBe(true);
    // Counted toward rank all the same.
    expect(played.state.jobs.set).toBe(1);
  });

  it('refuses a set that isn’t five, from today’s hand, each once, and play at a job without one', () => {
    const b = setBrief(base());
    expect(setRefused(b, b.hand.slice(0, 4))).toMatch(/5 moves/);
    expect(setRefused(b, [b.hand[0]!, ...b.hand.slice(0, 4)])).toMatch(/once/);
    const out = Object.keys(SET_MOVES).find((m) => !b.hand.includes(m))!;
    expect(setRefused(b, [out, ...b.hand.slice(0, 4)])).toMatch(/bucket/);
    const r = act(base(), { t: 'act', act: 'gym.set', play: { set: b.hand.slice(0, 4) } });
    expect(r.events[0]?.k).toBe('refused');
    const cafe = act(base({ at: 'cafe', shifts: [] }), { t: 'act', act: 'cafe.shift', play: { set: [] } });
    expect(cafe.events[0]).toMatchObject({ k: 'refused' });
  });
});

// Phase 18.2. The rule a player might settle on, played every day, falls short of what
// thinking about the day's queue or floor gets: the best order, or wave by wave, moves.
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const DAYS = Array.from({ length: 60 }, (_, d) => d + 1);

describe('the café’s rush', () => {
  it('queues the same on a reload, longer as you rise, with regulars waiting longer', () => {
    expect(rushQueue(base())).toEqual(rushQueue(base()));
    expect(rushQueue(base())).toHaveLength(RUSH.queue[0]!);
    expect(rushQueue(base({ jobs: { cafe: JOBS.cafe!.at[4]! } }))).toHaveLength(RUSH.queue[4]!);
  });

  it('tips a drink only if it’s made before they give up', () => {
    const q = [
      { who: 'A', drink: 'pourover', waits: 4, tip: 6, regular: false },
      { who: 'B', drink: 'espresso', waits: 1, tip: 1, regular: false },
    ];
    expect(rushTips(q, [0, 1])).toBe(6);
    expect(rushTips(q, [1, 0])).toBe(1);
    expect(rushBest(q)).toBe(6);
  });

  it('isn’t solved by a rule: tips first, or who’ll give up first (criterion 3)', () => {
    const rule = (key: (o: ReturnType<typeof rushQueue>[number]) => number) =>
      mean(
        DAYS.map((d) => {
          const q = rushQueue(base({ day: d }));
          const o = q.map((_, i) => i).sort((a, b) => key(q[a]!) - key(q[b]!));
          return rushTips(q, o) / rushBest(q);
        }),
      );
    expect(rule((o) => -o.tip)).toBeLessThan(RUSH.from);
    expect(rule((o) => o.waits)).toBeLessThan(RUSH.from);
  });

  it('pays the shift and the rush’s bonus, and refuses a queue not made whole', () => {
    const s = base({ at: 'cafe', shifts: [{ job: 'cafe', day: 1 }] });
    const q = rushQueue(s);
    expect(rushRefused(q, [0])).toMatch(/Every order/);
    let best: number[] = [];
    const perm = (pre: number[]) => {
      if (pre.length === q.length) {
        if (!best.length || rushTips(q, pre) > rushTips(q, best)) best = pre;
        return;
      }
      for (let i = 0; i < q.length; i++) if (!pre.includes(i)) perm([...pre, i]);
    };
    perm([]);
    const worked = act(s, { t: 'act', act: 'cafe.shift' });
    const played = act(s, { t: 'act', act: 'cafe.shift', play: { queue: best } });
    expect(played.state.cash - worked.state.cash).toBe(
      playBonus(actCost(s, ACTS['cafe.shift']!).cash!, 1, RUSH.from),
    );
    expect(lines(played).some((l) => l.startsWith('The rush:'))).toBe(true);
  });
});

describe('the diner’s floor', () => {
  it('seats the same waves on a reload, more tables a wave as you rise', () => {
    const f = dinerFloor(base());
    expect(f).toEqual(dinerFloor(base()));
    expect(f.waves).toHaveLength(FLOOR.waves);
    expect(f.waves[0]).toHaveLength(FLOOR.wave[0]!);
    expect(dinerFloor(base({ jobs: { diner: JOBS.diner!.at[3]! } })).waves[0]).toHaveLength(FLOOR.wave[3]!);
  });

  it('isn’t solved by a rule: every table, or none of the fussy ones (criterion 3)', () => {
    const rule = (keep: (t: { mood: string }) => boolean) =>
      mean(
        DAYS.slice(0, 30).map((d) => {
          const f = dinerFloor(base({ day: d }));
          return (
            floorTips(
              f,
              f.waves.map((w) => w.map((_, i) => i).filter((i) => keep(w[i]!))),
            ) / floorBest(f)
          );
        }),
      );
    expect(rule(() => true)).toBeLessThan(FLOOR.from);
    expect(rule((t) => t.mood !== 'fussy')).toBeLessThan(FLOOR.from + 0.05);
  });

  it('refuses tables that aren’t there or none at all, and pays a floor played', () => {
    const day = DAYS.find((d) => isPosted(base().seed, 'diner', d))!;
    const s = base({ day, at: 'diner', shifts: [{ job: 'diner', day }] });
    const f = dinerFloor(s);
    expect(floorRefused(f, [[], [], []])).toMatch(/at least/);
    expect(floorRefused(f, [[9], [], []])).toMatch(/once/);
    const take = f.waves.map((w) => w.map((_, i) => i));
    const r = act(s, { t: 'act', act: 'diner.shift', play: { tables: take } });
    expect(r.events.some((e) => e.k === 'refused')).toBe(false);
    expect(lines(r).some((l) => /tables on your section/.test(l))).toBe(true);
  });
});

describe('the coach’s roster', () => {
  const coach = (over: Partial<GameState> = {}) => base({ at: 'cave', jobs: { coach: 0 }, ...over });

  it('turns up as big as your rank’s, the same on a reload, rested by the day', () => {
    expect(rosterToday(coach())).toHaveLength(COACH.roster[0]!);
    expect(rosterToday(coach())).toEqual(rosterToday(coach()));
    expect(rosterToday(coach({ jobs: { coach: JOBS.coach!.at[2]! } }))).toHaveLength(COACH.roster[2]!);
    const c = { name: 'Kai', style: 'crimp' as const, gap: 2, progress: 40, tired: 3, scared: false };
    const later = rosterToday(coach({ day: 3, coach: { clients: [c], next: 1, last: 1 } }));
    expect(later[0]!.tired).toBe(1);
  });

  it('moves a client by the hour: burns fastest fresh, nothing much scared or tired', () => {
    const c = { name: 'Kai', style: 'crimp' as const, gap: 2, progress: 0, tired: 0, scared: false };
    expect(coached(c, 'burns').progress).toBe(COACH.burns.gain);
    expect(coached({ ...c, scared: true }, 'burns').progress).toBe(COACH.burns.scared);
    expect(coached({ ...c, tired: 3 }, 'burns').progress).toBeLessThan(
      coached({ ...c, tired: 3 }, 'drill').progress,
    );
    expect(coached({ ...c, scared: true }, 'head').scared).toBe(false);
    expect(coached({ ...c, tired: 3 }, 'rest').tired).toBe(1);
  });

  it('isn’t solved by one focus: reading each client beats any of them every time (criterion 3)', () => {
    const run = (pick: (c: { tired: number; scared: boolean }) => Focus) => {
      let s = base({ jobs: { coach: JOBS.coach!.at[1]! } });
      let sends = 0;
      for (let k = 0; k < 40; k++) {
        s = { ...s, day: 1 + 2 * k };
        const r = coachSession(s, rosterToday(s).map(pick));
        sends += r.sent.length;
        s = { ...s, coach: r.coach };
      }
      return sends;
    };
    const read = run((c) => (c.scared ? 'head' : c.tired >= 2 ? 'rest' : 'burns'));
    for (const f of ['burns', 'drill', 'head', 'rest'] as Focus[])
      expect(run(() => f)).toBeLessThan(read * 0.75);
  });

  it('pays a send, and a new client takes the slot', () => {
    const near = { name: 'Kai', style: 'dyno' as const, gap: 3, progress: 95, tired: 0, scared: false };
    const s = coach({ coach: { clients: [near, { ...near, name: 'Bea', progress: 0 }], next: 2, last: 1 } });
    const day = Array.from({ length: 60 }, (_, d) => d + 1).find((d) => isPosted(s.seed, 'coach', d))!;
    const t = { ...s, day, shifts: [{ job: 'coach', day }], coach: { ...s.coach!, last: day } };
    const today = rosterToday(t);
    const foci = today.map((c) => (c.scared ? 'head' : 'drill')) as Focus[];
    const r = act(t, { t: 'act', act: 'cave.coach', play: { coach: foci } });
    expect(r.events.some((e) => e.k === 'refused')).toBe(false);
    if (!today[0]!.scared) {
      expect(lines(r).some((l) => l.startsWith('Kai sends'))).toBe(true);
      expect(r.state.coach!.clients.map((c) => c.name)).not.toContain('Kai');
    }
    expect(act(t, { t: 'act', act: 'cave.coach', play: { coach: ['burns'] } }).events[0]?.k).toBe('refused');
  });
});

describe('the warehouse’s picks', () => {
  const day = (s: GameState) =>
    Array.from({ length: 60 }, (_, d) => d + 1).find((d) => isPosted(s.seed, 'warehouse', d))!;
  const at = () => {
    const s = base({ at: 'warehouse', min: 6 * 60 });
    const d = day(s);
    return { ...s, day: d, shifts: [{ job: 'warehouse', day: d }] };
  };
  // The best expected take from here, and when to stop doing it.
  const best = (s: GameState, n: number, fat: number, pay: number): { ev: number; stops: number } => {
    if (n >= HAUL.picks) return { ev: pay, stops: n };
    let top = { ev: pay, stops: n };
    for (const id of haulOffer(s, n)) {
      const f = fat + pickWeight(s, id);
      const p = dropChance(f);
      const on = best(s, n + 1, f, pay + PICKS[id]!.pay);
      const ev = p * pay * (1 - dropCost(s)) + (1 - p) * on.ev;
      if (ev > top.ev) top = { ev, stops: on.stops };
    }
    return top;
  };

  it('starts on the shift, picks till you stop, and banks it', () => {
    let r = act(at(), { t: 'act', act: 'warehouse.shift', play: { haul: true } });
    expect(r.state.haul).toMatchObject({ picks: 0, pay: 0 });
    const before = r.state.cash;
    r = act(r.state, { t: 'haul', pick: 0 });
    const h = r.state.haul;
    if (h) {
      expect(h.picks).toBe(1);
      r = act(r.state, { t: 'haul' });
      expect(r.state.haul).toBeNull();
      expect(r.state.cash).toBe(before + h.pay);
    }
    expect(act(r.state, { t: 'haul', pick: 0 }).events[0]?.k).toBe('refused');
  });

  it('banks picks left on the go at bed', () => {
    const r = act(at(), { t: 'act', act: 'warehouse.shift', play: { haul: true } });
    const night = act({ ...r.state, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' });
    expect(night.state.haul).toBeNull();
  });

  it('isn’t solved: when to stop moves with the day, and no fixed rule gets near the best (criterion 3)', () => {
    const stops = new Set<number>();
    let opt = 0;
    const rules = new Map<string, number>();
    for (let d = 1; d <= 60; d++) {
      const s = base({ day: d });
      const b = best(s, 0, 0, 0);
      opt += b.ev;
      stops.add(b.stops);
      for (const k of [2, 3, 4, 6]) {
        const go = (n: number, fat: number, pay: number): number => {
          if (n >= k) return pay;
          const id = [...haulOffer(s, n)].sort(
            (a, c) => PICKS[c]!.pay / PICKS[c]!.weight - PICKS[a]!.pay / PICKS[a]!.weight,
          )[0]!;
          const f = fat + pickWeight(s, id);
          const p = dropChance(f);
          return p * pay * (1 - dropCost(s)) + (1 - p) * go(n + 1, f, pay + PICKS[id]!.pay);
        };
        rules.set(`stop at ${k}`, (rules.get(`stop at ${k}`) ?? 0) + go(0, 0, 0));
      }
    }
    expect(stops.size).toBeGreaterThanOrEqual(4);
    for (const v of rules.values()) expect(v).toBeLessThan(opt * 0.9);
  });
});

describe('leave', () => {
  const missed = (s: GameState) =>
    act(
      { ...s, at: 'lot', min: 22 * 60, shifts: [{ job: 'set', day: s.day }] },
      { t: 'act', act: 'lot.sleep' },
    );

  it('calls in a missed shift at a rank with leave, and warns once it’s gone', () => {
    // The first rank has none: a warning.
    expect(leaveLeft(base(), 'set')).toBe(0);
    expect(missed(base()).state.strikes.set).toBe(1);
    // A senior setter's days, then a warning.
    let s = base({ jobs: { set: JOBS.set!.at[2]! } });
    const days = JOBS.set!.leave![2]!;
    expect(leaveLeft(s, 'set')).toBe(days);
    for (let i = 0; i < days; i++) {
      const r = missed(s);
      expect(lines(r).some((l) => /called in/.test(l))).toBe(true);
      expect(r.state.strikes.set).toBeUndefined();
      s = { ...r.state, energy: 100 };
    }
    expect(leaveLeft(s, 'set')).toBe(0);
    expect(missed(s).state.strikes.set).toBe(1);
  });

  it('comes back each year', () => {
    const s = base({ jobs: { set: JOBS.set!.at[1]! }, leave: { set: [1] } });
    expect(leaveLeft(s, 'set')).toBe(0);
    expect(leaveLeft({ ...s, day: 60 }, 'set')).toBe(JOBS.set!.leave![1]);
  });
});
