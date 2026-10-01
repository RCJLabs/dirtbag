// Phase 24.1: expeditions climbed. Each objective's pitches are lines, led in blocks with a
// partner; theirs go on the seed against their grade, and you can hand them one of yours. A
// night on the portaledge gives back less each time. The odds shown are worked out from the
// go's own model, and the bots' trips land near them.
import { describe, expect, it } from 'vitest';
import { gradeOf, needFor } from './climber';
import { EXPED_ROUTES, EXPEDITIONS, expedPitches } from './content/expeditions';
import { EXPED } from './dials';
import { nightBack, partners, stormOn, summitOdds, yourPitch } from './expeditions';
import { act, newGame } from './game';
import { expedTrip } from './harness';
import type { Action, GameState } from './types';

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

describe('going', () => {
  it('needs the grade, the money in hand, and a partner close enough, unless you solo', () => {
    expect(refused(act(ready(6), { t: 'exped', id: 'elcap', do: 'go' }))).toMatch(/V7/);
    expect(refused(act(ready(8, 'x', { cash: 800 }), { t: 'exped', id: 'elcap', do: 'go' }))).toMatch(
      /\$900/,
    );
    const lonely = ready(8, 'x', { people: { hazel: { bond: 1, last: 0 } } });
    expect(refused(act(lonely, { t: 'exped', id: 'elcap', do: 'go' }))).toMatch(/close enough/);
    expect(
      act({ ...lonely, mode: 'solo' }, { t: 'exped', id: 'elcap', do: 'go' }).state.expedition?.partner,
    ).toBeNull();
    // The closest comes.
    expect(partners(ready(8))).toEqual(['hazel', 'sage']);
    const s = play(ready(8), { t: 'exped', id: 'elcap', do: 'go' });
    expect(s.expedition).toEqual({ id: 'elcap', day: 1, pitch: 0, partner: 'hazel', nights: 0 });
    expect(s.cash).toBe(5000 - EXPEDITIONS.elcap!.cost);
    expect(refused(act(s, { t: 'travel', to: 'gym' }))).toMatch(/El Capitan/);
  });
});

describe('up there', () => {
  const start = (grade = 9) => {
    let s = ready(grade);
    s = { ...s, day: clear(s) };
    return play(s, { t: 'exped', id: 'elcap', do: 'go' });
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
    s = play({ ...ready(9), mode: 'solo', day: clear(ready(9)) }, { t: 'exped', id: 'elcap', do: 'go' });
    expect(refused(act(s, { t: 'exped', id: 'elcap', do: 'follow' }))).toMatch(/alone/);
  });

  it('gives back less every night on the portaledge, and feeds you from the rations', () => {
    expect(nightBack(1)).toBeLessThan(nightBack(0));
    let s = start();
    s = play(s, { t: 'go', route: 'elcap-1' }, { t: 'done', route: 'elcap-1', result: sent });
    const e0 = s.energy;
    s = play(s, { t: 'exped', id: 'elcap', do: 'camp' });
    expect(s.expedition).toMatchObject({ day: 2, nights: 1 });
    expect(s.energy).toBe(Math.min(100, e0 + nightBack(0)));
    expect(s.fed).toBeGreaterThanOrEqual(EXPED.ration);
  });

  it('won’t lead in a storm or in the dark', () => {
    let s = ready(9);
    let d = s.day;
    while (!stormOn(s.seed, 'elcap', EXPEDITIONS.elcap!, d)) d++;
    s = play({ ...s, day: d }, { t: 'exped', id: 'elcap', do: 'go' });
    expect(refused(act(s, { t: 'go', route: 'elcap-1' }))).toMatch(/storm/);
    const dark = play({ ...ready(9), day: clear(ready(9)) }, { t: 'exped', id: 'elcap', do: 'go' });
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
  });
});

describe('the odds', () => {
  const from = (s: GameState) => ({
    day: 1,
    pitch: 0,
    energy: s.energy,
    nights: 0,
    partner: s.expedition!.partner,
  });
  it('rise with your grade and a stronger partner, and the gate hardly ever goes', () => {
    const odds = (g: number, people: GameState['people']) => {
      const s = play(ready(g, 'odds', { people }), { t: 'exped', id: 'elcap', do: 'go' });
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
      const s = play(s0, { t: 'exped', id: 'elcap', do: 'go' });
      shown += summitOdds(s, 'elcap', from(s));
      if (expedTrip(s0, 'elcap', `hands-${i}`)) got++;
    }
    expect(gradeOf(k(9))).toBe(9);
    expect(Math.abs(shown / N - got / N)).toBeLessThan(0.2);
  });
});
