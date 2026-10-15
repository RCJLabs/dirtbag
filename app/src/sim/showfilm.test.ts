// Phase 34.4: trade shows and a film (Evan's call: both light), and money that says where it
// came from. A sponsor from Apex up wants a day on its stand each cycle; a film of your hardest
// line is yours to pay for, once; every payment is tagged for the harness's money table.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FILM_SAYS, SHOW_SAYS, SPONSORS } from './content/media';
import { ROUTES } from './content/routes';
import { FILM, MEDIA, SHOW } from './dials';
import { fill, money } from './format';
import { act, emptyLog, newGame } from './game';
import { cycleTasks, filmBlocked, filmLine, fromAudience, showBlocked } from './media';
import { aimEarned } from './record';
import { fromSave } from './save';
import type { GameState } from './types';

const V67 = readFileSync(new URL('./fixtures/save-v67.json', import.meta.url), 'utf8');
const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');
const lines = (r: ReturnType<typeof act>): string[] =>
  r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const paid = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'paid' ? [e] : []));

const D = 30;
const base = (over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('stands'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  return { ...s, day: D, at: 'lot', min: 8 * 60, energy: 100, cash: 300, ...over };
};
// Sponsored at a tier, the cycle ending on `due`.
const sponsored = (tier: number, due = D + SHOW.before, over: Partial<GameState> = {}): GameState => {
  const s = base(over);
  return {
    ...s,
    media: {
      ...s.media,
      followers: 10000,
      sponsor: { tier, terms: 'real', due, tasks: cycleTasks(s, tier, 'real', due), strikes: 0 },
    },
  };
};
const sleep = (s: GameState) => {
  let r = act({ ...s, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' });
  if (r.state.encounter) r = act(r.state, { t: 'answer', opt: 0 });
  return r;
};

describe('a save from before the stand and the film', () => {
  it('loads with no film, and its sponsor’s next cycle has a stand', () => {
    const r = fromSave(V67);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(67);
    const old = JSON.parse(V67).state;
    expect(r.state).toEqual({ ...old, media: { ...old.media, film: null } });
    expect(old.media.sponsor.tier).toBeGreaterThanOrEqual(SHOW.tier);
    expect(cycleTasks(r.state, old.media.sponsor.tier, 'real', D).some((t) => t.kind === 'show')).toBe(true);
  });
});

describe('the stand', () => {
  it('is an ask from Apex up, a set number of days before the cycle ends', () => {
    expect(cycleTasks(base(), 0, 'real', D).some((t) => t.kind === 'show')).toBe(false);
    expect(cycleTasks(base(), SHOW.tier, 'real', D)).toContainEqual({
      kind: 'show',
      day: D - SHOW.before,
      done: false,
    });
  });

  it('takes the day it’s on, for a fee and followers', () => {
    const s = sponsored(SHOW.tier);
    const fee = SHOW.fee[SHOW.tier]!;
    const r = act(s, { t: 'show' });
    expect(refused(r)).toBe(false);
    expect(r.state.cash).toBe(s.cash + fee);
    expect(r.state.min).toBe(s.min + SHOW.min);
    expect(r.state.media.followers).toBe(s.media.followers + fromAudience(s, SHOW.followers));
    expect(r.state.media.sponsor!.tasks.find((t) => t.kind === 'show')!.done).toBe(true);
    expect(paid(r)).toEqual([{ k: 'paid', from: 'show', cash: fee }]);
    expect(lines(r)).toContain(
      fill(SHOW_SAYS.done, { sponsor: SPONSORS[SHOW.tier]!.name, cash: money(fee) }),
    );
    expect(refused(act(r.state, { t: 'show' }))).toBe(true);
    expect(showBlocked({ ...s, min: SHOW.by + 1 })).toBe('The doors opened without you');
    expect(showBlocked({ ...s, day: D + 1 })).toBe('No stand to work today');
    expect(showBlocked(base())).toBe('No stand to work today');
  });

  it('missed, is an ask not done', () => {
    // Every other ask done, the stand skipped: the cycle ends on a warning, unpaid.
    const s = sponsored(SHOW.tier, D);
    const sp = s.media.sponsor!;
    const t = {
      ...s,
      media: {
        ...s.media,
        sponsor: { ...sp, tasks: sp.tasks.map((x) => ({ ...x, done: x.kind !== 'show' })) },
      },
    };
    const r = sleep(t);
    expect(r.state.media.sponsor!.strikes).toBe(1);
    expect(paid(r).some((p) => p.from === 'sponsor')).toBe(false);
    // Done, the cycle pays, and says so.
    const all = {
      ...t,
      media: { ...t.media, sponsor: { ...sp, tasks: sp.tasks.map((x) => ({ ...x, done: true })) } },
    };
    expect(paid(sleep(all))).toContainEqual({
      k: 'paid',
      from: 'sponsor',
      cash: SPONSORS[SHOW.tier]!.stipend,
    });
    expect(MEDIA.cycle).toBeGreaterThan(SHOW.before);
  });
});

describe('a film you pay for', () => {
  const hard = Object.values(ROUTES).find(
    (r) => r.grade >= FILM.from && !r.wall && !r.exped && r.place !== 'gym',
  )!;
  const sentIt = (over: Partial<GameState> = {}) =>
    base({
      routes: { [hard.id]: { ...emptyLog(), sent: { day: D - 3, go: 4, style: 'redpoint' } } },
      ...over,
    });

  it('is of your hardest line outside, once it’s hard enough', () => {
    expect(filmLine(base())).toBeNull();
    expect(filmBlocked(base({ cash: 9999 }))).toBe(`Send a V${FILM.from} outside first`);
    expect(filmLine(sentIt())).toBe(hard.id);
    expect(filmBlocked(sentIt())).toBe(`A film costs ${money(FILM.price)}`);
  });

  it('costs its price, brings followers, and goes in the Record Book, once', () => {
    const s = sentIt({ cash: FILM.price + 50 });
    const r = act(s, { t: 'film' });
    expect(refused(r)).toBe(false);
    expect(r.state.cash).toBe(50);
    expect(r.state.media.film).toEqual({ route: hard.id, day: D });
    expect(r.state.media.followers).toBe(s.media.followers + fromAudience(s, FILM.followers));
    expect(lines(r)).toContain(fill(FILM_SAYS.made, { line: hard.name }));
    expect(aimEarned(r.state, { commissioned: true })).toBe(true);
    expect(r.state.record.commissioned).toBe(D);
    expect(filmBlocked({ ...r.state, cash: 9999 })).toBe('There’s a film of you already');
  });
});

describe('money that says where it came from', () => {
  it('tags a shift’s pay as the job’s', () => {
    const s = base({ at: 'cafe', min: 9 * 60 });
    const r = act(s, { t: 'act', act: 'cafe.shift' });
    expect(refused(r)).toBe(false);
    expect(paid(r)).toEqual([{ k: 'paid', from: 'job', cash: r.state.cash - s.cash }]);
  });
});

describe('the stand’s and the film’s words', () => {
  it('come from the rules, with no number of their own', () => {
    for (const t of [...Object.values(SHOW_SAYS), ...Object.values(FILM_SAYS)]) expect(t).not.toMatch(/\d/);
  });
});
