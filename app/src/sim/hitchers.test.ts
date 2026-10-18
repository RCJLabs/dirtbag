// Phase 35.1: the road remembers you. The hitchhikers you haven't met come first, and none
// comes a third time before everyone has come once (Phase 35's criterion 2); four more of
// them; and while his clue to the Hollow is due, the old hand waits at the pull-off on the
// Gorge road.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HITCHERS, PASS_BY } from './content/road';
import { EVENTS } from './dials';
import { driveEncounter, hitchersDue, hitchOpts, meets } from './events';
import { act, emptyLog, newGame } from './game';
import { hitchDue } from './hollow';
import { fromSave } from './save';
import type { GameState } from './types';

const V73 = readFileSync(new URL('./fixtures/save-v73.json', import.meta.url), 'utf8');
const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('hitchers'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 500,
  energy: 90,
  min: 9 * 60,
  day: 6,
  ...over,
});
const withMeets = (m: Record<string, number>, over: Partial<GameState> = {}) => {
  const s = base(over);
  return { ...s, deck: { ...s.deck, meets: m } };
};
const ids = HITCHERS.map((h) => h.id);
// Every hitchhiker a drive could bring, over many days and times of day.
const brought = (s: GameState, from = 'lot', to = 'road'): string[] => {
  const out: string[] = [];
  for (let day = 6; day < 300; day++)
    for (const min of [8 * 60, 11 * 60, 15 * 60]) {
      const e = driveEncounter({ ...s, day, min }, from, to);
      if (e?.kind === 'hitch') out.push(e.id);
    }
  return out;
};

describe('the hitchhikers', () => {
  it('are twelve, each with a first meeting, a second, and words with nothing typed in', () => {
    expect(ids).toHaveLength(12);
    expect(new Set(ids).size).toBe(12);
    // The four new ones' signs in capitals, as a sign is (one of v0.956's is a lowercase joke).
    for (const id of ['guide', 'setter', 'stranded', 'ranger']) {
      const sign = HITCHERS.find((h) => h.id === id)?.sign ?? '';
      expect(sign).toBe(sign.toUpperCase());
    }
    for (const h of HITCHERS) {
      expect(h.opts).toHaveLength(3);
      expect(h.again.opts.length).toBeGreaterThanOrEqual(2);
      const words = [
        h.who,
        h.look,
        h.pitch,
        h.again.open,
        ...[...h.opts, ...h.again.opts].flatMap((o) => [o.label, o.out]),
      ];
      for (const t of words) {
        expect(t, t).not.toMatch(/\d/);
        expect(t, t).not.toMatch(/'/);
      }
    }
  });

  it('never come a third time before everyone has come once', () => {
    const s = withMeets({ kid: 2 });
    expect(hitchersDue(s).map((h) => h.id)).not.toContain('kid');
    expect(brought(s)).not.toContain('kid');
    // Everyone once: the kid can come a third time now.
    const all = withMeets({ ...Object.fromEntries(ids.map((id) => [id, 1])), kid: 2 });
    expect(hitchersDue(all).map((h) => h.id)).toContain('kid');
  });

  it('bring the ones who have come least first', () => {
    const half = Object.fromEntries(ids.slice(0, 6).map((id) => [id, 1]));
    const seen = brought(withMeets(half));
    expect(seen.length).toBeGreaterThan(100);
    const fresh = seen.filter((id) => !(id in half)).length / seen.length;
    // `fresh` times likelier, six and six: three in four, near enough.
    expect(fresh).toBeGreaterThan(EVENTS.hitch.fresh / (EVENTS.hitch.fresh + 1) - 0.1);
  });

  it('count every time one comes, picked up or driven past', () => {
    const s = base({ at: 'road', encounter: { kind: 'hitch', id: 'guide' } });
    const past = act(s, {
      t: 'answer',
      opt:
        hitchOpts(
          s,
          HITCHERS.find((h) => h.id === 'guide')!,
        ).length - 1,
    });
    expect(past.state.deck.met.guide).toBeUndefined();
    expect(meets(past.state, 'guide')).toBe(1);
    const again = act({ ...past.state, encounter: { kind: 'hitch', id: 'guide' } }, { t: 'answer', opt: 0 });
    expect(again.state.deck.met.guide).toBe(0);
    expect(meets(again.state, 'guide')).toBe(2);
    expect(PASS_BY.label).toBeTruthy();
  });

  it('come no third time before every one has come once, in two years of drives', () => {
    let s = base();
    const came: string[] = [];
    for (let day = 6; day < 6 + 112; day++) {
      for (const to of ['road', 'lot']) {
        s = {
          ...s,
          day,
          min: to === 'road' ? 9 * 60 : 15 * 60,
          cash: 500,
          energy: 90,
          fed: 80,
          injury: null,
          encounter: null,
          breakdown: null,
          van: { ...s.van, tires: 100, engine: 100, battery: 100 },
        };
        const r = act(s, { t: 'travel', to });
        s = r.state;
        const e = s.encounter;
        if (e?.kind === 'hitch') came.push(e.id);
        if (e) s = act(s, { t: 'answer', opt: 0 }).state;
      }
    }
    expect(came.length).toBeGreaterThan(ids.length);
    const n: Record<string, number> = {};
    for (const id of came) {
      n[id] = (n[id] ?? 0) + 1;
      if (n[id] === 3)
        expect(
          ids.every((x) => (n[x] ?? 0) >= 1),
          `${id} a third time`,
        ).toBe(true);
    }
  });
});

describe('the old hand at the pull-off', () => {
  // V9 sent outside: everyone who knows the way to the Hollow is asking.
  const sent = { gopen: { ...emptyLog(), goes: 4, sent: { day: 20, go: 4, style: 'redpoint' as const } } };
  const asking = (over: Partial<GameState> = {}) => base({ day: 30, routes: sent, ...over });

  it('waits on the Gorge road every drive, while his clue is due and it is his turn', () => {
    const s = asking();
    expect(hitchDue(s)).toBe(true);
    for (let day = 30; day < 40; day++) {
      expect(driveEncounter({ ...s, day }, 'lot', 'gorge')).toEqual({ kind: 'hitch', id: 'oldhand' });
      expect(driveEncounter({ ...s, day }, 'gorge', 'lot')).toEqual({ kind: 'hitch', id: 'oldhand' });
    }
    // Not on another road, not once the day's had its encounter, not out of turn.
    expect(new Set(brought(s, 'lot', 'road')).size).toBeGreaterThan(1);
    expect(driveEncounter({ ...s, deck: { ...s.deck, last: s.day } }, 'lot', 'gorge')).toBeNull();
    const twice = { ...s, deck: { ...s.deck, meets: { oldhand: 2 } } };
    expect(driveEncounter(twice, 'lot', 'gorge')).not.toEqual({ kind: 'hitch', id: 'oldhand' });
    // His clue had: just a hitchhiker again.
    const told = { ...s, hollow: { clues: ['hitch' as const], tries: 0 } };
    expect(hitchDue(told)).toBe(false);
    const days = Array.from({ length: 20 }, (_, i) =>
      driveEncounter({ ...told, day: 30 + i }, 'lot', 'gorge'),
    );
    expect(days.filter((e) => e?.id === 'oldhand').length).toBeLessThan(10);
  });
});

describe('a save from before', () => {
  it('loads a real 0.999.70 save, the hitchhikers it met counted as come once', () => {
    const r = fromSave(V73);
    if (!r.ok) throw new Error(r.why);
    expect(r.from).toBe(73);
    const old = JSON.parse(V73).state;
    expect(Object.keys(old.deck.met).length).toBeGreaterThan(0);
    expect(r.state).toEqual({
      sesh: null,
      seshFirsts: 0,
      ...old,
      // And Phase 35.3's: no knocks owed a return.
      deck: {
        ...old.deck,
        meets: Object.fromEntries(Object.keys(old.deck.met).map((id) => [id, 1])),
        back: [],
      },
    });
  });
});
