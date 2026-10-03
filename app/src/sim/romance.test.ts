// Phase 17.4: romance, with Sage or Mara (Evan's call), one a life. The spark at a Partner's
// bond, beats a week apart that fork, a year together counted overnight, and an end, in a
// scene of its own, when it goes too long without a day together.
import { describe, expect, it } from 'vitest';
import { ROMANCES } from './content/romance';
import { AGE, ROMANCE } from './dials';
import { epilogue } from './epilogue';
import { act, newGame, talkStart } from './game';
import { whereIs } from './presence';
import { romanceDue, strained, together } from './romance';
import type { GameEvent, GameState, PersonLog } from './types';

const SEED = 'romance';
const lines = (ev: GameEvent[]) => ev.flatMap((e) => (e.k === 'line' ? [e.text] : []));
// Their own arc played out, so a friend's beats aren't waiting ahead of the romance's.
const friend = (bond: number, more: Partial<PersonLog> = {}): PersonLog => ({
  bond,
  last: 0,
  since: 2,
  talked: true,
  arc: 4,
  beatDay: 1,
  ...more,
});
// A day from `from` when they're at their crag at noon, and you are too.
const meetAt = (s: GameState, who: string, from: number): GameState => {
  for (let d = from; d < from + 300; d++) {
    const at = whereIs(SEED, who, d, 12 * 60, s.people[who]);
    if (at) return { ...s, day: d, min: 12 * 60, at };
  }
  throw new Error(`${who} never turns up`);
};
const made = (people: Record<string, PersonLog>): GameState => ({
  ...act(newGame(SEED), { t: 'create', name: 'Robin', start: 'allrounder' }).state,
  people,
});
const say = (s: GameState, who: string, node: string, opt = 0) => act(s, { t: 'say', talk: who, node, opt });

describe('romance (Phase 17.4)', () => {
  it('offers the spark at a Partner’s bond, to Sage and Mara only, once each', () => {
    const s = made({ sage: friend(ROMANCE.from), mara: friend(ROMANCE.from - 1), rico: friend(7) });
    expect(romanceDue(s, 'sage/1')).toBe(true);
    expect(romanceDue(s, 'mara/1')).toBe(false);
    expect(romanceDue(s, 'rico/1')).toBe(false);
    // "Let's keep climbing together": a friend, and it isn't asked again.
    const friends = say(meetAt(s, 'sage', 10), 'sage', 'love-1', 1).state;
    expect(friends.romance).toBeNull();
    expect(friends.people.sage!.sparked).toBe(true);
    expect(romanceDue(friends, 'sage/1')).toBe(false);
  });

  it('starts one, and nobody else’s spark comes while it lasts', () => {
    const s = meetAt(made({ sage: friend(7), mara: friend(7) }), 'sage', 10);
    expect(talkStart(s, 'sage')).toBe('love-1');
    const on = say(s, 'sage', 'love-1').state;
    expect(on.romance).toEqual({ who: 'sage', stage: 1, since: s.day, beatDay: s.day });
    expect(together(on, 'sage')).toBe(true);
    expect(romanceDue(on, 'mara/1')).toBe(false);
  });

  it('plays its beats a week apart, and the forks keep them away a while', () => {
    let s = say(meetAt(made({ mara: friend(7) }), 'mara', 10), 'mara', 'love-1').state;
    const started = s.day;
    expect(romanceDue(s, 'mara/2')).toBe(false);
    // Keep climbing together, so it isn't strained, and come back a week on.
    s = meetAt(
      { ...s, people: { mara: { ...s.people.mara!, last: started + ROMANCE.spacing } } },
      'mara',
      started + ROMANCE.spacing,
    );
    s = { ...s, people: { mara: { ...s.people.mara!, last: s.day } } };
    expect(talkStart(s, 'mara')).toBe('love-2');
    const dug = say(s, 'mara', 'love-2', 1).state;
    expect(dug.romance!.stage).toBe(2);
    expect(dug.people.mara!.away).toBe(s.day + ROMANCE.cool);
    expect(whereIs(SEED, 'mara', s.day + 1, 12 * 60, dug.people.mara)).toBeNull();
    // Five beats in all, the last of them "together".
    expect(ROMANCES.mara!.beats).toHaveLength(5);
    expect(ROMANCES.sage!.beats).toHaveLength(5);
  });

  it('ends, in a scene, after too long without a day together, their time away not counted', () => {
    const on: GameState = {
      ...made({ sage: friend(7, { last: 20 }) }),
      romance: { who: 'sage', stage: 3, since: 10, beatDay: 20 },
    };
    expect(strained({ ...on, day: 20 + ROMANCE.neglect - 1 }, 'sage')).toBe(false);
    expect(strained({ ...on, day: 20 + ROMANCE.neglect }, 'sage')).toBe(true);
    // Away on her season up north, it doesn't run down.
    const north = {
      ...on,
      people: { sage: friend(7, { last: 20, away: 40 }) },
      day: 40 + ROMANCE.neglect - 1,
    };
    expect(strained(north, 'sage')).toBe(false);
    const s = meetAt({ ...on, people: { sage: friend(7, { last: 20 }) } }, 'sage', 20 + ROMANCE.neglect);
    expect(talkStart(s, 'sage')).toBe('love-end');
    const r = say(s, 'sage', 'love-end');
    expect(r.state.romance!.over).toBe(s.day);
    expect(together(r.state)).toBe(false);
    expect(r.state.people.sage!.bond).toBe(ROMANCE.after);
    expect(r.state.people.sage!.away).toBe(s.day + ROMANCE.distance);
    // One a life: no spark after it, with her or anyone.
    const later = { ...r.state, people: { ...r.state.people, mara: friend(7) } };
    expect(romanceDue(later, 'mara/1')).toBe(false);
    expect(epilogue(r.state).map((l) => l.text)).toContain(
      'You were with Sage for a while. You still think about it on long drives.',
    );
  });

  it('counts a year together overnight', () => {
    const on: GameState = {
      ...made({ mara: friend(7, { last: 10 + AGE.days }) }),
      romance: { who: 'mara', stage: 5, since: 10, beatDay: 10 + AGE.days - 2 },
    };
    const bed = act(
      { ...on, day: 10 + AGE.days - 1, at: 'lot', min: 18 * 60, cash: 500, energy: 50 },
      { t: 'act', act: 'lot.sleep' },
    );
    expect(lines(bed.events).some((l) => l.startsWith('A year with Mara'))).toBe(true);
    expect(epilogue(on).map((l) => l.text)).toContain(
      'Mara is still the first person you tell when a line goes.',
    );
  });
});
