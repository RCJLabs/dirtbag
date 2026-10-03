// Phase 17.2, criterion 2: every core character has three or more milestones and a
// resolution, and the arcs' forks change who's around.
import { describe, expect, it } from 'vitest';
import { ARCS } from './content/arcs';
import { PEOPLE_END } from './content/epilogue';
import { TALK } from './content/people';
import { ARC, BOND } from './dials';
import { act, newGame, talkStart } from './game';
import { whereIs } from './presence';
import type { GameState, PersonLog } from './types';

const CORE = ['hazel', 'sage', 'dex', 'mara', 'rico', 'tam', 'ray', 'frank'];
const TREE: Record<string, string> = { hazel: 'hazel-crag' };
const tree = (who: string) => TALK[TREE[who] ?? who]!;
const beats = (who: string) =>
  Object.keys(tree(who).nodes)
    .filter((k) => k.startsWith('beat-'))
    .sort();

const made = (people: Record<string, PersonLog>, over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('arcs'), { t: 'create', name: 'Robin', start: 'allrounder' }).state,
  people,
  ...over,
});

describe('the cast’s milestones (Phase 17.2)', () => {
  it('gives every core character three or more beats and a resolution', () => {
    for (const who of CORE) {
      const b = beats(who);
      expect(b.length, who).toBeGreaterThanOrEqual(4);
      // Each beat opens on its turn in the arc.
      for (let n = 1; n <= b.length; n++)
        expect(tree(who).start.some((e) => e.when?.arc === `${who}/${n}` && e.node === `beat-${n}`)).toBe(
          true,
        );
      // The last one resolves it: ride-or-die, and a line in the epilogue either way.
      const last = tree(who).nodes[b[b.length - 1]!]!;
      expect(
        last.opts.some((o) => o.fx?.bondAtLeast === BOND.tiers[4]),
        who,
      ).toBe(true);
      expect(PEOPLE_END[who]?.close, who).toBeTruthy();
    }
  });

  it('lets every arc fork, and most forks change who’s around', () => {
    for (const who of Object.keys(ARCS)) {
      const forks = ARCS[who]!.filter((n) => n.opts.length > 1);
      expect(forks.length, who).toBeGreaterThanOrEqual(2);
      // Every beat moves the arc on, whichever way you answer.
      for (const n of ARCS[who]!) expect(n.opts.every((o) => o.fx?.arc)).toBe(true);
    }
    const away = Object.keys(ARCS).filter((w) => ARCS[w]!.some((n) => n.opts.some((o) => o.fx?.away)));
    // Ray's availability turns on his last season (17.3).
    expect(away.sort()).toEqual(['dex', 'frank', 'hazel', 'mara', 'rico', 'tam']);
  });

  it('plays Mara’s arc at her bonds, spaced out, and a no keeps her away', () => {
    const day = Array.from({ length: 200 }, (_, i) => i + 10).find((d) =>
      whereIs('arcs', 'mara', d, 12 * 60),
    )!;
    const at = (bond: number, p: Partial<PersonLog>, d = day) =>
      made(
        { mara: { bond, last: 0, since: 1, talked: true, ...p } },
        { day: d, min: 12 * 60, at: 'gorge', energy: 100 },
      );
    expect(talkStart(at(0, {}), 'mara')).toBe('again');
    expect(talkStart(at(1, {}), 'mara')).toBe('beat-1');
    const one = act(at(1, {}), { t: 'say', talk: 'mara', node: 'beat-1', opt: 1 }).state;
    expect(one.people.mara).toMatchObject({ arc: 1, beatDay: day });
    // Beat two waits for the bond, then for the spacing.
    expect(talkStart({ ...one, people: { mara: { ...one.people.mara!, bond: 3 } } }, 'mara')).toBe('again');
    const next = Array.from({ length: 200 }, (_, i) => day + ARC.spacing + i).find((d) =>
      whereIs('arcs', 'mara', d, 12 * 60, { ...one.people.mara!, bond: 3 }),
    )!;
    const later = { ...one, day: next, people: { mara: { ...one.people.mara!, bond: 3 } } };
    expect(talkStart(later, 'mara')).toBe('beat-2');
    const no = act(later, { t: 'say', talk: 'mara', node: 'beat-2', opt: 1 }).state;
    expect(no.people.mara!.away).toBe(later.day + ARC.maraCool);
    for (let d = later.day; d < later.day + ARC.maraCool; d++)
      expect(whereIs('arcs', 'mara', d, 12 * 60, no.people.mara)).toBeNull();
  });

  it('plays Hazel’s arc at the crag, and leaves the Lot’s mornings as they were', () => {
    const s = made({ hazel: { bond: 1, last: 0, since: 1 } }, { day: 3, min: 9 * 60 });
    expect(talkStart(s, 'hazel-crag')).toBe('beat-1');
    expect(talkStart(s, 'hazel-lot')).not.toMatch(/^beat/);
    // Gone to her sister's, she's nowhere.
    const dry = Array.from({ length: 60 }, (_, i) => i + 9).find(
      (d) => whereIs('arcs', 'hazel', d, 12 * 60) === 'road',
    )!;
    const home = act(
      {
        ...s,
        day: dry,
        min: 12 * 60,
        at: 'road',
        people: { hazel: { bond: 3, last: 0, since: 1, arc: 1, beatDay: 1 } },
      },
      {
        t: 'say',
        talk: 'hazel-crag',
        node: 'beat-2',
        opt: 0,
      },
    ).state;
    expect(home.people.hazel!.away).toBe(dry + ARC.hazelHome);
    expect(whereIs('arcs', 'hazel', dry + 1, 12 * 60, home.people.hazel)).toBeNull();
  });

  it('counts a day at the same crag as Dex toward knowing him', () => {
    const p: PersonLog = { bond: 0, last: 0, since: 1 };
    const day = Array.from({ length: 200 }, (_, i) => i + 5).find(
      (d) =>
        whereIs('arcs', 'dex', d, 12 * 60, p) === 'road' && whereIs('arcs', 'hazel', d, 12 * 60) === 'road',
    )!;
    const s = made({ dex: p }, { day, min: 12 * 60, at: 'road', energy: 100, skin: 100, today: ['warm'] });
    const went = act(s, { t: 'go', route: 'warm' });
    expect(went.events[0]?.k).not.toBe('refused');
    expect(went.state.people.dex!.bond).toBe(1);
  });
});
