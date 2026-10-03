// Phase 18.5: the media ladder. A post a day from what the day gave you, and followers alone
// paying nothing; sponsors with followers, a cycle's asks paid or missed; the rival for the
// headline deal; a thread answered by sending; the film.
import { describe, expect, it } from 'vitest';
import { SPONSORS } from './content/media';
import { MEDIA } from './dials';
import { act, newGame } from './game';
import { cycleTasks, mediaRung, postGain, rivalFollowers, todaysWorth } from './media';
import type { GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('media'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  energy: 100,
  ...over,
});
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const withMedia = (s: GameState, m: Partial<GameState['media']>): GameState => ({
  ...s,
  media: { ...s.media, ...m },
});
// A line sent today, outside, by id.
const sentToday = (s: GameState, id = 'warm'): GameState => ({
  ...s,
  routes: {
    ...s.routes,
    [id]: {
      known: [],
      told: [],
      pick: {},
      falls: {},
      goes: 1,
      goesToday: 1,
      hi: 9,
      sent: { day: s.day, go: 1, style: 'flash' },
      sentToday: true,
    },
  },
});
const sleep = (s: GameState) => {
  let r = act({ ...s, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' });
  if (r.state.encounter) r = act(r.state, { t: 'answer', opt: 0 });
  return r;
};

describe('posting', () => {
  it('turns what you did today into followers, and nothing into nothing', () => {
    const s = base();
    expect(todaysWorth(s)).toBe(0);
    expect(postGain(s, 'straight')).toBe(0);
    const sent = sentToday(s);
    expect(postGain(sent, 'straight')).toBeGreaterThan(0);
    expect(postGain(sent, 'bait')).toBeGreaterThan(postGain(sent, 'straight'));
    expect(postGain(sent, 'story')).toBeLessThan(postGain(sent, 'straight'));
  });

  it('posts once a day; followers pay nothing on their own', () => {
    const s = sentToday(base());
    const r = act(s, { t: 'post', style: 'straight' });
    expect(r.state.media.followers).toBe(postGain(s, 'straight'));
    expect(r.state.cash).toBe(s.cash);
    expect(r.state.media.engagement).toBe(s.media.engagement + MEDIA.engage.post);
    expect(act(r.state, { t: 'post', style: 'story' }).events[0]?.k).toBe('refused');
    expect(act(s, { t: 'post', style: 'ad' }).events[0]?.k).toBe('refused');
  });

  it('slips when you go quiet, and loses followers when it slumps', () => {
    const s = withMedia(base({ day: 10 }), { posted: 1, engagement: MEDIA.engage.slump, followers: 1000 });
    const r = sleep(s);
    expect(r.state.media.engagement).toBe(MEDIA.engage.slump - MEDIA.engage.fade);
    expect(r.state.media.followers).toBeLessThan(1000);
  });
});

describe('sponsors', () => {
  it('come with followers, and sign on your terms', () => {
    const s = withMedia(base({ day: 5 }), { followers: SPONSORS[0]!.followers, posted: 5 });
    const r = sleep(s);
    expect(r.state.media.offer).toEqual({ kind: 'sponsor', tier: 0 });
    const signed = act(r.state, { t: 'offer', take: 'brand' });
    expect(signed.state.media.sponsor).toMatchObject({ tier: 0, terms: 'brand', strikes: 0 });
    expect(signed.state.media.sponsor!.tasks.map((t) => t.kind)).toEqual(['send', 'ad']);
  });

  it('pay a cycle with its asks done, warn once, and drop you on the second', () => {
    const s0 = base({ day: 20 });
    const sp = { tier: 1, terms: 'real' as const, due: 20, tasks: cycleTasks(s0, 1, 'real'), strikes: 0 };
    const done = withMedia(s0, {
      posted: 20,
      followers: 8000,
      sponsor: { ...sp, tasks: sp.tasks.map((t) => ({ ...t, done: true })) },
    });
    const paid = sleep(done);
    expect(paid.state.cash).toBeGreaterThanOrEqual(done.cash + SPONSORS[1]!.stipend - 40);
    expect(lines(paid).some((l) => /pays the cycle/.test(l))).toBe(true);
    const missed = sleep(withMedia(s0, { posted: 20, followers: 8000, sponsor: sp }));
    expect(missed.state.media.sponsor!.strikes).toBe(1);
    const again = sleep(withMedia(s0, { posted: 20, followers: 8000, sponsor: { ...sp, strikes: 1 } }));
    expect(again.state.media.sponsor).toBeNull();
  });

  it('mark a send posted at the grade, and a shoot at the crag they want', () => {
    const s0 = base();
    const tasks = cycleTasks(s0, 1, 'real');
    const shoot = tasks.find((t) => t.kind === 'shoot')!;
    let s = withMedia(sentToday(s0), { sponsor: { tier: 1, terms: 'real', due: 30, tasks, strikes: 0 } });
    s = act(s, { t: 'post', style: 'straight' }).state;
    expect(s.media.sponsor!.tasks.find((t) => t.kind === 'send')!.done).toBe(true);
    if (shoot.kind === 'shoot') {
      expect(act({ ...s, at: 'lot' }, { t: 'shoot' }).events[0]?.k).toBe('refused');
      const r = act({ ...s, at: shoot.place, min: 9 * 60 }, { t: 'shoot' });
      expect(r.state.media.sponsor!.tasks.find((t) => t.kind === 'shoot')!.done).toBe(true);
    }
  });

  it('lose the headline deal to the rival when her numbers are better', () => {
    const top = SPONSORS.length - 1;
    const day = MEDIA.rival.mid + 60;
    expect(rivalFollowers(day)).toBeGreaterThan(SPONSORS[top]!.followers);
    const s = withMedia(base({ day }), {
      followers: SPONSORS[top]!.followers,
      posted: day,
      sponsor: { tier: 1, terms: 'real', due: day + 9, tasks: [], strikes: 0 },
    });
    const r = sleep(s);
    expect(r.state.media.offer).toBeNull();
    expect(r.state.media.lost).toBe(day);
    // Ahead of her, it's yours.
    const ahead = sleep(withMedia(s, { followers: rivalFollowers(day) + 1000 }));
    expect(ahead.state.media.offer).toEqual({ kind: 'sponsor', tier: top });
  });
});

describe('a thread, and the film', () => {
  it('quiets a thread with a send at its grade, and costs followers if it runs out', () => {
    const s = withMedia(base({ at: 'road', min: 10 * 60 }), { followers: 10000, heat: { grade: 0, due: 9 } });
    const r = act(s, { t: 'go', route: 'warm' });
    expect(r.events.some((e) => e.k === 'refused')).toBe(false);
    const done = act(r.state, {
      t: 'done',
      route: 'warm',
      result: { sent: true, hi: 9, fellAt: null, tried: [], skin: 1 },
    });
    expect(done.state.media.heat).toBeNull();
    expect(done.state.media.followers).toBeGreaterThan(10000);
    const lapsed = sleep(
      withMedia(base({ day: 9 }), { followers: 10000, posted: 9, heat: { grade: 5, due: 9 } }),
    );
    expect(lapsed.state.media.followers).toBeLessThan(10000);
  });

  it('offers the film at the top, and airs it on a hard line outside', () => {
    const top = SPONSORS.length - 1;
    const s = withMedia(base({ day: 30 }), {
      followers: MEDIA.doc.followers,
      posted: 30,
      sponsor: { tier: top, terms: 'real', due: 40, tasks: [], strikes: 0 },
    });
    const r = sleep(s);
    expect(r.state.media.offer).toEqual({ kind: 'doc' });
    const yes = act(r.state, { t: 'offer', take: 'yes' });
    expect(yes.state.media.doc).toMatchObject({ due: r.state.day + MEDIA.doc.days });
    expect(mediaRung(withMedia(yes.state, { doc: { aired: 31 } }))).toBe(5);
    expect(mediaRung(base())).toBe(0);
  });
});
