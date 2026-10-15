// Phase 34.2: the costs of ambition (Evan's call: opt-in retainers, and comp travel). A physio
// and a coach, each paid a week at a time from the day they're taken on; the travel to
// Nationals, the World Series and the Games paid with the fee.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { carePrice } from './clinic';
import { compBlocked, compCost } from './comps';
import { COMP_TIERS } from './content/comps';
import { RETAINER_SAYS } from './content/retainers';
import { CLINIC, RETAINER } from './dials';
import { fill, money } from './format';
import { act, newGame } from './game';
import { retainerNote } from './retainers';
import { fromSave } from './save';
import { protocolOf, sessionGains } from './sessions';
import type { GameState } from './types';

const V65 = readFileSync(new URL('./fixtures/save-v65.json', import.meta.url), 'utf8');
const refused = (r: ReturnType<typeof act>) => r.events.find((e) => e.k === 'refused');
const lines = (r: ReturnType<typeof act>): string[] =>
  r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const base = (over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('retain'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  return { ...s, day: 10, min: 10 * 60, cash: 300, ...over };
};
const sleep = (s: GameState) => {
  let r = act({ ...s, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' });
  if (r.state.encounter) r = act(r.state, { t: 'answer', opt: 0 });
  return r;
};

describe('a save from before the retainers', () => {
  it('loads with neither, and plays on', () => {
    const r = fromSave(V65);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(65);
    const old = JSON.parse(V65).state;
    expect(r.state).toEqual({
      ...old,
      retainers: { physio: null, coach: null },
      media: { ...old.media, photos: [], piece: null, film: null },
    });
    const took = act(r.state, { t: 'retainer', what: 'physio', on: true });
    expect(refused(took)).toBeUndefined();
    expect(took.state.retainers.physio).toBe(r.state.day);
  });
});

describe('a physio on retainer', () => {
  it('is taken on at the clinic, the first week up front, and once', () => {
    const s = base({ at: 'clinic' });
    const r = act(s, { t: 'retainer', what: 'physio', on: true });
    expect(r.state.cash).toBe(s.cash - RETAINER.physio.weekly);
    expect(r.state.retainers.physio).toBe(s.day);
    expect(lines(r)).toContain(RETAINER_SAYS.physio.taken);
    expect(refused(act(r.state, { t: 'retainer', what: 'physio', on: true }))).toBeDefined();
    expect(refused(act(base({ at: 'lot' }), { t: 'retainer', what: 'physio', on: true }))).toBeDefined();
    expect(
      refused(act(base({ at: 'clinic', cash: 10 }), { t: 'retainer', what: 'physio', on: true })),
    ).toBeDefined();
  });

  it('makes physio free, and each session takes more off', () => {
    const s = act(base({ at: 'clinic' }), { t: 'retainer', what: 'physio', on: true }).state;
    expect(carePrice(base(), 'physio')).toBeGreaterThan(0);
    expect(carePrice(s, 'physio')).toBe(0);
    const hurt = { ...s, injury: { kind: 'tweaked finger', tier: 1, until: s.day + 6 } } as GameState;
    const r = act(hurt, { t: 'act', act: 'clinic.physio' });
    expect(refused(r)).toBeUndefined();
    expect(r.state.injury!.until).toBe(hurt.injury!.until - RETAINER.physio.days);
    expect(r.state.cash).toBe(hurt.cash);
    expect(RETAINER.physio.days).toBeGreaterThan(CLINIC.physio.days);
  });

  it('is paid a week at a time from the day it was taken on, till it’s let go', () => {
    let s = act(base({ at: 'clinic' }), { t: 'retainer', what: 'physio', on: true }).state;
    const bill = fill(RETAINER_SAYS.physio.bill, { cash: money(RETAINER.physio.weekly) });
    const nights: number[] = [];
    for (let i = 0; i < 14; i++) {
      const r = sleep(s);
      if (lines(r).includes(bill)) nights.push(s.day);
      s = r.state;
    }
    // Taken on day 10 (days 10 to 16 paid); due the nights that end days 16 and 23.
    expect(nights).toEqual([16, 23]);
    const gone = act({ ...s, at: 'clinic' }, { t: 'retainer', what: 'physio', on: false });
    expect(gone.state.retainers.physio).toBeNull();
    expect(lines(gone)).toContain(RETAINER_SAYS.physio.dropped);
    let t = gone.state;
    for (let i = 0; i < 8; i++) {
      const r = sleep(t);
      expect(lines(r)).not.toContain(bill);
      t = r.state;
    }
  });
});

describe('a coach of your own', () => {
  it('is one of the Cave’s, and puts more on every session', () => {
    expect(refused(act(base({ at: 'clinic' }), { t: 'retainer', what: 'coach', on: true }))).toBeDefined();
    const s = act(base({ at: 'cave' }), { t: 'retainer', what: 'coach', on: true }).state;
    expect(s.retainers.coach).toBe(10);
    const p = protocolOf('maxhangs')!;
    const plain = sessionGains(base(), p);
    const coached = sessionGains(s, p);
    for (const k of Object.keys(plain) as (keyof typeof plain)[])
      expect(coached[k]!).toBeCloseTo(plain[k]! * (1 + RETAINER.coach.gain), 1);
  });
});

describe('the retainers’ words', () => {
  it('come from the dials, with no number of their own', () => {
    for (const say of Object.values(RETAINER_SAYS))
      for (const t of Object.values(say)) expect(t).not.toMatch(/\d/);
    expect(retainerNote('physio')).toContain(String(RETAINER.physio.days));
    expect(retainerNote('coach')).toContain(`${Math.round(RETAINER.coach.gain * 100)}%`);
  });
});

describe('travel to the big comps', () => {
  it('is paid with the fee from Nationals up, and kept out of it if you can’t', () => {
    const NAT = 2;
    const t = COMP_TIERS[NAT]!;
    expect(compCost(NAT)).toBe(t.fee + t.travel!);
    expect(compCost(0)).toBe(COMP_TIERS[0]!.fee);
    const s = base({
      day: t.on,
      at: 'center',
      min: 9 * 60,
      comps: { ...base().comps, points: [{ day: t.on - 1, pts: 200 }] },
    });
    const r = act(s, { t: 'comp', do: 'enter' });
    expect(refused(r)).toBeUndefined();
    expect(r.state.cash).toBe(s.cash - compCost(NAT));
    const short = { ...s, cash: t.fee + 1 };
    expect(compBlocked(short)).toBe(`The fee and travel come to ${money(compCost(NAT))}`);
  });
});
