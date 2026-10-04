// Phase 25.6: crew drama. Two of the crew ask for the same weekend; whoever you let down
// falls out with the other and keeps away from them; three weeks on, the one you picked asks
// about it, and a night at the fire mends it or sets it. Once a life.
import { describe, expect, it } from 'vitest';
import { CREW } from './dials';
import { crewDue, crewPair, mendOdds, mends } from './crew';
import { act, newGame, talkStart } from './game';
import { whereIs } from './presence';
import type { GameState, PersonLog } from './types';

const done: Partial<PersonLog> = { last: 0, since: 1, talked: true, arc: 4, beatDay: 0, sparked: true };
const made = (people: Record<string, Partial<PersonLog>>, over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('crew'), { t: 'create', name: 'Robin', start: 'allrounder' }).state;
  const logs = Object.fromEntries(
    Object.entries(people).map(([w, p]) => [w, { bond: 0, ...done, ...p } as PersonLog]),
  );
  return { ...s, people: logs, energy: 100, ...over };
};
// A moment Mara's out, and where: to talk to her there.
function withMara(s: GameState, from: number): GameState {
  for (let d = from; d < from + 200; d++)
    for (let m = 9 * 60; m < 17 * 60; m += 30) {
      const at = whereIs(s.seed, 'mara', d, m, s.people.mara, s.people);
      if (at) return { ...s, day: d, min: m, at };
    }
  throw new Error('Mara never out');
}
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const PAIR = { mara: { bond: 4 }, rico: { bond: 3 } };

describe('crew drama', () => {
  it('asks once two of the crew are Regulars, the closer asking, from day 28', () => {
    expect(crewPair(made({ mara: { bond: 4 } }))).toBeNull();
    expect(crewPair(made(PAIR))).toEqual(['mara', 'rico']);
    expect(crewPair(made({ ...PAIR, rico: { bond: 3, away: 999 } }))).toBeNull();
    expect(crewDue(made(PAIR, { day: CREW.from - 1 }), 'mara/ask/rico')).toBe(false);
    const s = made(PAIR, { day: CREW.from });
    expect(crewDue(s, 'mara/ask/rico')).toBe(true);
    expect(crewDue(s, 'rico/ask/mara')).toBe(false);
    expect(talkStart(s, 'mara')).toBe('crew-ask-rico');
  });

  it('lets down whoever you don’t pick: bond lost, and they keep away from the other', () => {
    const s = withMara(made(PAIR), CREW.from);
    const r = act(s, { t: 'say', talk: 'mara', node: 'crew-ask-rico', opt: 0 });
    expect(r.state.crew).toEqual({ a: 'mara', b: 'rico', day: s.day, stage: 'rift' });
    expect(r.state.people.rico).toMatchObject({ bond: 3 - CREW.cost, avoid: 'mara' });
    expect(r.state.people.mara!.bond).toBe(4);
    expect(lines(r)[0]).toMatch(/Rico says it’s fine/);
    // Away a week; then asked to the same crag as Mara, Rico won't come.
    expect(r.state.people.rico!.away).toBe(s.day + CREW.sulk);
    const later = s.day + CREW.sulk;
    const both = {
      ...r.state.people,
      mara: { ...r.state.people.mara!, invite: { day: later, place: 'gorge', from: 9 * 60 } },
      rico: { ...r.state.people.rico!, invite: { day: later, place: 'gorge', from: 9 * 60 } },
    };
    expect(whereIs(s.seed, 'mara', later, 12 * 60, both.mara, both)).toBe('gorge');
    expect(whereIs(s.seed, 'rico', later, 12 * 60, both.rico)).toBe('gorge');
    expect(whereIs(s.seed, 'rico', later, 12 * 60, both.rico, both)).toBeNull();
    // Once a life.
    expect(crewDue({ ...r.state, day: r.state.day + 100 }, 'mara/ask/rico')).toBe(false);
  });

  it('keeping your word turns it round: the one who asked falls out instead', () => {
    const s = withMara(made(PAIR), CREW.from);
    const r = act(s, { t: 'say', talk: 'mara', node: 'crew-ask-rico', opt: 1 });
    expect(r.state.crew).toMatchObject({ a: 'rico', b: 'mara', stage: 'rift' });
    expect(r.state.people.mara).toMatchObject({
      bond: 4 - CREW.cost,
      avoid: 'rico',
      away: s.day + CREW.sulk,
    });
    expect(r.state.people.rico!.avoid).toBeUndefined();
  });

  it('three weeks on, a night at the fire mends it or sets it; leaving it asks again later', () => {
    const rift = (day: number, bond = 5): GameState =>
      made(
        { mara: { bond: 4 }, rico: { bond, avoid: 'mara' } },
        { crew: { a: 'mara', b: 'rico', day, stage: 'rift' } },
      );
    expect(crewDue({ ...rift(30), day: 30 + CREW.mend - 1 }, 'mara/mend/rico')).toBe(false);
    expect(crewDue({ ...rift(30), day: 30 + CREW.mend }, 'mara/mend/rico')).toBe(true);
    // Making up with the one you let down first helps.
    expect(mendOdds(rift(30, 5))).toBeGreaterThan(mendOdds(rift(30, 1)));
    // Both ways, over the days.
    const outcomes = new Set<string>();
    for (let from = 60; outcomes.size < 2 && from < 400; from += 3) {
      const s = withMara(rift(from - CREW.mend - 200), from);
      const r = act(s, { t: 'say', talk: 'mara', node: 'crew-mend-rico', opt: 0 });
      const c = r.state.crew!;
      outcomes.add(c.stage);
      expect(c.stage).toBe(mends(s) ? 'mended' : 'set');
      if (c.stage === 'mended') {
        expect(r.state.people.rico!.avoid).toBeUndefined();
        expect(r.state.people.rico!.bond).toBe(6);
        expect(r.state.people.mara!.bond).toBe(5);
      } else expect(r.state.people.rico!.avoid).toBe('mara');
      expect(crewDue({ ...r.state, day: r.state.day + 100 }, 'mara/mend/rico')).toBe(false);
    }
    expect([...outcomes].sort()).toEqual(['mended', 'set']);
    const s = withMara(rift(0), CREW.mend + 10);
    const left = act(s, { t: 'say', talk: 'mara', node: 'crew-mend-rico', opt: 1 });
    expect(left.state.crew).toMatchObject({ stage: 'rift', day: s.day });
    expect(crewDue(left.state, 'mara/mend/rico')).toBe(false);
    expect(crewDue({ ...left.state, day: s.day + CREW.mend }, 'mara/mend/rico')).toBe(true);
  });
});
