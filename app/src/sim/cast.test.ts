// Phase 17.1: the cast past Hazel, Sage and Dex. No two people share a name; each turns up
// where and when they climb; talking is meeting them; a local's sit is a bond a day.
import { describe, expect, it } from 'vitest';
import { isWeekend } from './cond';
import { PEOPLE, TALK, TOWN } from './content/people';
import { CAST } from './dials';
import { act, belayer, newGame } from './game';
import { RAY_GONE } from './lives';
import { PARTNERS, whereIs } from './presence';
import type { GameState } from './types';
import { conditionsAt, seasonOf } from './weather';

const NEW = ['ray', 'frank', 'mara', 'rico', 'tam'];
const SEED = 'cast';
const days = Array.from({ length: 224 }, (_, i) => i + 1);
const at = (who: string, day: number, min: number) => whereIs(SEED, who, day, min);

describe('the cast (Phase 17.1)', () => {
  it('has no two people with the same name, in town or out', () => {
    const names = [...Object.values(PEOPLE).map((p) => p.name), ...Object.values(TOWN)];
    expect(new Set(names).size).toBe(names.length);
    // A full name starts with the name.
    for (const p of Object.values(PEOPLE)) if (p.full) expect(p.full.startsWith(p.name)).toBe(true);
  });

  it('gives everyone a talk that opens on meeting them', () => {
    for (const who of NEW) {
      const t = TALK[who]!;
      expect(t.who).toBe(who);
      expect(t.start[0]).toEqual({ when: { notMet: who }, node: 'meet' });
      expect(t.nodes.meet).toBeDefined();
    }
  });

  it('puts Ray at Roadside on dry weekend mornings, and nowhere else', () => {
    let seen = 0;
    for (const d of days)
      for (const m of [7 * 60, 10 * 60, 15 * 60]) {
        const w = at('ray', d, m);
        const want =
          d < RAY_GONE &&
          isWeekend(d) &&
          m >= CAST.ray.from &&
          m < CAST.ray.till &&
          conditionsAt(SEED, d, 'road').open;
        expect(w).toBe(want ? 'road' : null);
        if (w) seen++;
      }
    expect(seen).toBeGreaterThan(20);
  });

  it('parks Frank in the Lot on some evenings, fewer in winter', () => {
    const nights = (winter: boolean) => {
      const ds = days.filter((d) => (seasonOf(d) === 'winter') === winter);
      return ds.filter((d) => at('frank', d, 19 * 60) === 'lot').length / ds.length;
    };
    expect(nights(false)).toBeGreaterThan(0.25);
    expect(nights(false)).toBeLessThan(0.55);
    expect(nights(true)).toBeLessThan(nights(false));
    expect(days.every((d) => at('frank', d, 12 * 60) === null)).toBe(true);
  });

  it('keeps each partner at their own crag: Mara the Gorge, Rico the Cave or Moonstone, Tam the Mesa', () => {
    const where = (who: string, m: number) => new Set(days.map((d) => at(who, d, m)).filter(Boolean));
    expect(where('mara', 12 * 60)).toEqual(new Set(['gorge']));
    expect(where('rico', 14 * 60)).toEqual(new Set(['cave', 'moon']));
    expect(where('tam', 9 * 60)).toEqual(new Set(['mesa']));
    // Tam's done before the sandstone heats up.
    expect(days.every((d) => at('tam', d, 15 * 60) === null)).toBe(true);
    // Only on dry days at the crags; the Cave's indoors.
    for (const d of days) {
      if (at('mara', d, 12 * 60)) expect(conditionsAt(SEED, d, 'gorge').open).toBe(true);
      if (at('tam', d, 9 * 60)) expect(conditionsAt(SEED, d, 'mesa').open).toBe(true);
    }
    expect(PARTNERS).toEqual(expect.arrayContaining(['mara', 'rico', 'tam']));
    expect(PARTNERS).not.toContain('ray');
    expect(PARTNERS).not.toContain('frank');
  });

  it('turns them up more as you get closer, as Sage does', () => {
    const count = (bond: number) =>
      days.filter((d) => whereIs(SEED, 'mara', d, 12 * 60, { bond, last: 0, since: 1 })).length;
    expect(count(7)).toBeGreaterThan(count(0));
  });

  it('has Mara belay you at the Gorge when she’s there', () => {
    const d = days.find((x) => at('mara', x, 12 * 60) === 'gorge')!;
    const s: GameState = { ...newGame(SEED), day: d, min: 12 * 60, at: 'gorge' };
    expect(belayer(s)).toBe('mara');
  });

  it('meets Ray when you talk to him, and his sit is a bond once a day', () => {
    const d = days.find((x) => at('ray', x, 10 * 60) === 'road')!;
    const s0 = act(newGame(SEED), { t: 'create', name: 'Robin', start: 'allrounder' }).state;
    const s: GameState = { ...s0, day: d, min: 10 * 60, at: 'road' };
    const met = act(s, { t: 'say', talk: 'ray', node: 'meet', opt: 1 }).state;
    expect(met.people.ray).toMatchObject({ bond: 0, since: d });
    const sat = act(met, { t: 'say', talk: 'ray', node: 'again', opt: 0 }).state;
    expect(sat.people.ray!.bond).toBe(1);
    expect(sat.min).toBe(met.min + 20);
    expect(act(sat, { t: 'say', talk: 'ray', node: 'again', opt: 0 }).events[0]?.k).toBe('refused');
  });
});
