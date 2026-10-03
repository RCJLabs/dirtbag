// Phase 17.7: the lines players read most. The fire's open a week at a time, unheard ones
// first; what's said at a send walks its pool without repeating till it's been round.
import { describe, expect, it } from 'vitest';
import { fireLine, ledgeLine, sendCheer } from './ambient';
import { FIRE_LINES, LEDGE_LINES, SEND_CHEERS } from './content/ambient';
import { FIRE_TALK } from './dials';
import { act, newGame } from './game';
import type { GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('ambient'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  min: 21 * 60,
  energy: 60,
  ...over,
});
const hazel = (day: number, heard?: number): GameState =>
  base({
    day,
    people: { hazel: { bond: 10, last: 0, since: 1, ...(heard === undefined ? {} : { heard }) } },
  });
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));

describe('the lines players read most', () => {
  it('are written once each, with nothing left to fill in', () => {
    const all = [FIRE_LINES, SEND_CHEERS, LEDGE_LINES].flatMap((pools) => Object.values(pools).flat());
    expect(new Set(all).size).toBe(all.length);
    expect(all.every((l) => !l.includes('{') && l.length < 160)).toBe(true);
  });

  it('open at the fire a week at a time, the unheard first', () => {
    const pool = FIRE_LINES.hazel!;
    expect(pool.length).toBeGreaterThan(FIRE_TALK.open + 300 / FIRE_TALK.every);
    expect(fireLine(hazel(2))).toEqual({ who: 'hazel', text: pool[0], fresh: true });
    expect(fireLine(hazel(2, 3))).toEqual({ who: 'hazel', text: pool[3], fresh: true });
    // All of the first week's heard: they come round, and nothing past them does.
    const open = pool.slice(0, FIRE_TALK.open);
    const said = Array.from({ length: 30 }, (_, k) => fireLine(hazel(2 + (k % 6), FIRE_TALK.open))!);
    expect(said.every((l) => !l.fresh && open.includes(l.text))).toBe(true);
    // A week on, the next one opens and comes first.
    expect(fireLine(hazel(1 + FIRE_TALK.every, FIRE_TALK.open))).toEqual({
      who: 'hazel',
      text: pool[FIRE_TALK.open],
      fresh: true,
    });
  });

  it('count a night’s line heard only when it was new', () => {
    const r = act(hazel(2), { t: 'act', act: 'lot.sit' });
    expect(lines(r)).toContain(FIRE_LINES.hazel![0]);
    expect(r.state.people.hazel!.heard).toBe(1);
    const again = act(hazel(2, FIRE_TALK.open), { t: 'act', act: 'lot.sit' });
    expect(again.state.people.hazel!.heard).toBe(FIRE_TALK.open);
  });

  it('say a send back without repeating till the pool’s been round', () => {
    const pool = SEND_CHEERS.rico!;
    const routes = (n: number) =>
      Object.fromEntries(Array.from({ length: n }, (_, i) => [`r${i}`, { sent: 'redpoint' }])) as never;
    const said = pool.map((_, n) => sendCheer(base({ routes: routes(n) }), 'rico'));
    expect(new Set(said).size).toBe(pool.length);
    expect(sendCheer(base(), 'scout')).toBeNull();
  });

  it('say a night on the wall by whoever’s up there, in order, and nothing alone', () => {
    const pool = LEDGE_LINES.tam!;
    const tam = (ledge?: number) =>
      base({ people: { tam: { bond: 40, last: 0, ...(ledge === undefined ? {} : { ledge }) } } });
    expect(ledgeLine(tam(), 'tam')).toEqual({ text: pool[0], fresh: true });
    expect(ledgeLine(tam(5), 'tam')).toEqual({ text: pool[5], fresh: true });
    const said = pool.map((_, d) => ledgeLine({ ...tam(pool.length), day: d + 1 }, 'tam')!);
    expect(said.every((l) => !l.fresh && pool.includes(l.text))).toBe(true);
    expect(new Set(said.map((l) => l.text)).size).toBe(pool.length);
    expect(ledgeLine(base(), null)).toBeNull();
  });
});
