// Phase 17.5: giving, not just getting. A gift a week, a line named for someone, Frank
// brought to the fire, Dex asked out.
import { describe, expect, it } from 'vitest';
import { FIRE_ASK, GIFTS, NAMED_FOR } from './content/gifts';
import { TALK } from './content/people';
import { GIVE } from './dials';
import { epilogue } from './epilogue';
import { atFire } from './fire';
import { act, emptyLog, honorees, newGame } from './game';
import { whereIs } from './presence';
import type { GameEvent, GameState, PersonLog } from './types';

const SEED = 'give';
const lines = (ev: GameEvent[]) => ev.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const friend = (bond: number, more: Partial<PersonLog> = {}): PersonLog => ({
  bond,
  last: 0,
  since: 2,
  talked: true,
  arc: 4,
  beatDay: 1,
  ...more,
});
const made = (people: Record<string, PersonLog>, over: Partial<GameState> = {}): GameState => ({
  ...act(newGame(SEED), { t: 'create', name: 'Robin', start: 'allrounder' }).state,
  cash: 200,
  people,
  ...over,
});
const optIndex = (talk: string, node: string, label: RegExp) =>
  TALK[talk]!.nodes[node]!.opts.findIndex((o) => label.test(o.label));

describe('giving (Phase 17.5)', () => {
  it('has something for each of them, priced from the same numbers the button says', () => {
    for (const who of ['hazel', 'sage', 'dex', 'mara', 'rico', 'tam', 'ray', 'frank']) {
      const g = GIFTS[who]!;
      const opts = Object.values(TALK)
        .filter((t) => t.who === who)
        .flatMap((t) => Object.values(t.nodes).flatMap((n) => n.opts));
      const gift = opts.find((o) => o.fx?.gift);
      expect(gift, who).toBeDefined();
      expect(gift!.label).toContain(`$${g.cost}`);
      expect(gift!.fx!.cost).toEqual({ cash: -g.cost });
    }
  });

  it('gives once a week: a bond, the cost, and their word for it', () => {
    const day = Array.from({ length: 200 }, (_, i) => i + 5).find((d) =>
      whereIs(SEED, 'mara', d, 12 * 60, friend(3)),
    )!;
    const s = made({ mara: friend(3) }, { day, min: 12 * 60, at: 'gorge' });
    const i = optIndex('mara', 'again', /^Give Mara/);
    const r = act(s, { t: 'say', talk: 'mara', node: 'again', opt: i });
    expect(r.state.people.mara).toMatchObject({ bond: 4, gave: day });
    expect(r.state.cash).toBe(s.cash - GIFTS.mara!.cost);
    expect(lines(r.events)).toContain(GIFTS.mara!.line);
    // Not again this week.
    expect(act(r.state, { t: 'say', talk: 'mara', node: 'again', opt: i }).events[0]?.k).toBe('refused');
    expect(
      act({ ...r.state, day: day + GIVE.every }, { t: 'say', talk: 'mara', node: 'again', opt: i }).events[0]
        ?.k,
    ).not.toBe('refused');
  });

  it('names a line for someone close, who hears about it, and the epilogue remembers', () => {
    const s = made(
      { hazel: friend(3), rico: friend(0) },
      { routes: { rsopen: { ...emptyLog(), goes: 2, sent: { day: 1, go: 2, style: 'redpoint' } } } },
    );
    expect(honorees(s)).toEqual(['hazel']);
    const r = act(s, { t: 'name', route: 'rsopen', name: NAMED_FOR.hazel!.name, call: 0, for: 'hazel' });
    expect(r.state.firsts.rsopen).toMatchObject({ name: 'Coffee’s On', for: 'hazel' });
    expect(r.state.people.hazel!.bond).toBe(3 + GIVE.named);
    expect(lines(r.events)).toContain(NAMED_FOR.hazel!.line);
    expect(epilogue(r.state).map((l) => l.text)).toContain(
      'You named Coffee’s On for Hazel. They never once let you forget it.',
    );
    // Someone you've never met can't be the one it's for.
    const nobody = act(s, { t: 'name', route: 'rsopen', name: 'Whatever', call: 0, for: 'tam' }).state;
    expect(nobody.firsts.rsopen!.for).toBeUndefined();
  });

  it('brings Frank to the fire for the night when you ask him', () => {
    const p = friend(2);
    const day = Array.from({ length: 200 }, (_, i) => i + 5).find(
      (d) => whereIs(SEED, 'frank', d, 19 * 60, p) === 'lot',
    )!;
    const s = made({ frank: p }, { day, min: 19 * 60, at: 'lot' });
    expect(atFire(s)).not.toContain('frank');
    const i = optIndex('frank', 'again', new RegExp(FIRE_ASK.label));
    const r = act(s, { t: 'say', talk: 'frank', node: 'again', opt: i });
    expect(atFire(r.state)).toContain('frank');
    expect(lines(r.events)).toContain(FIRE_ASK.line);
  });

  it('lets you ask Dex out, once you know him well enough', () => {
    for (const node of ['even', 'behind', 'ahead'])
      expect(optIndex('dex', node, /Come climbing/)).toBeGreaterThan(-1);
    expect(TALK.dex!.nodes.invite).toBeDefined();
  });
});
