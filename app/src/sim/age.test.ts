// Phase 16.1: a life's clock. v0.956's age, a year every 18 days; hanging it up from 30; your
// body calls it at 45, with a countdown from 43; the tally of a climbing life at the end.
import { describe, expect, it } from 'vitest';
import { ageOf, dayAtAge, daysLeft, epitaph, retireBlocked, tallyLines, tallyOf } from './age';
import { ORIGINS } from './content/origins';
import { AGE } from './dials';
import { act, newGame } from './game';
import { originTerms } from './identity';
import type { GameState } from './types';

const made = (origin?: string, over: Partial<GameState> = {}) => ({
  ...act(newGame('age'), { t: 'create', name: 'Lee', start: 'allrounder', origin }).state,
  ...over,
});
// A night in the van; anyone at the door gets the first answer, and then it's bed.
const night = (s: GameState) => {
  const bed = (x: GameState) =>
    act({ ...x, at: 'lot', min: 18 * 60, cash: 500, energy: 50 }, { t: 'act', act: 'lot.sleep' });
  let r = bed(s);
  for (let i = 0; i < 3 && r.state.encounter; i++) r = bed(act(r.state, { t: 'answer', opt: 0 }).state);
  return r;
};
const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');

describe('age', () => {
  it('starts at 22 and comes a year every 18 days; the Late Bloomer starts at 26', () => {
    const s = made();
    expect(ageOf(s)).toBe(AGE.start);
    expect(ageOf(s, AGE.days)).toBe(AGE.start);
    expect(ageOf(s, AGE.days + 1)).toBe(AGE.start + 1);
    expect(dayAtAge(s, AGE.from)).toBe(145);
    expect(dayAtAge(s, AGE.forced)).toBe(415);
    const late = made('late');
    expect(ageOf(late)).toBe(26);
    expect(dayAtAge(late, AGE.from)).toBe(73);
    expect(dayAtAge(late, AGE.forced)).toBe(343);
  });

  it('says the Late Bloomer’s cost from its numbers', () => {
    expect(originTerms(ORIGINS.late!).costs).toContain(
      'You start at 26: 4 years fewer before your body calls it, at 45.',
    );
  });

  it('says the birthdays that change something, once each', () => {
    const at30 = night(made(undefined, { day: dayAtAge(made(), AGE.from) - 1 }));
    expect(at30.state.life.told).toBe(AGE.from);
    expect(at30.state.log.some((l) => /^30\. Hanging it up is on the You page/.test(l.text))).toBe(true);
    const next = night(at30.state);
    expect(next.state.log.filter((l) => /^30\./.test(l.text))).toHaveLength(1);
    const at43 = night(made(undefined, { day: dayAtAge(made(), AGE.warn) - 1 }));
    expect(daysLeft(at43.state)).toBe(AGE.days * 2);
    expect(
      at43.state.log.some((l) => l.text.includes(`${AGE.days * 2} days before it calls it at ${AGE.forced}`)),
    ).toBe(true);
    expect(daysLeft(made())).toBeNull();
  });
});

describe('retiring', () => {
  it('is yours from 30, not before', () => {
    const young = made(undefined, { day: dayAtAge(made(), AGE.from) - 1 });
    expect(retireBlocked(young)).toBe('Not before 30. There’s too much left in you.');
    expect(refused(act(young, { t: 'retire' }))).toBe(true);
    expect(retireBlocked(made('late', { day: 73 }))).toBeNull();
  });

  it('ends the life: the line, the event, the book; nothing more after', () => {
    const s = made(undefined, { day: dayAtAge(made(), AGE.from) });
    const r = act(s, { t: 'retire' });
    expect(r.state.life.retired).toEqual({ day: s.day, forced: false });
    expect(r.events).toContainEqual({ k: 'retired', forced: false });
    expect(r.state.record.retired).toBe(s.day);
    expect(refused(act(r.state, { t: 'act', act: 'lot.rest' }))).toBe(true);
    expect(refused(act(r.state, { t: 'retire' }))).toBe(true);
  });

  it('comes on its own the first night in the van at 45', () => {
    const s = made(undefined, { day: dayAtAge(made(), AGE.forced) - 1 });
    const r = night(s);
    expect(r.state.day).toBe(dayAtAge(s, AGE.forced));
    expect(r.state.life.retired).toEqual({ day: r.state.day, forced: true });
    expect(r.events).toContainEqual({ k: 'retired', forced: true });
  });

  it('waits for you to get down off an expedition', () => {
    const s = made(undefined, { day: dayAtAge(made(), AGE.forced) });
    expect(retireBlocked({ ...s, wall: { id: 'x', next: 0 } })).toBe('Get down first.');
  });
});

describe('the tally', () => {
  it('says only what happened, and an epitaph from it', () => {
    const s = made();
    const t = tallyOf(s);
    expect(t.sends).toBe(0);
    expect(tallyLines(t)[0]).toBe('Nothing sent. You were there for the life, not the ticks.');
    expect(tallyLines(t)).toContain(
      'You never walked Crusher, Tendon, Nerve, Mover, Dirtbag and Scene. Somebody else did.',
    );
    expect(epitaph(t)).toBe('A life lived on rock. No regrets.');
    expect(epitaph({ ...t, firsts: 2 })).toBe('You left first ascents with your name on them.');
    expect(epitaph({ ...t, firsts: 2, myth: 'The Long Dark' })).toBe(
      'You put up a first ascent that’ll outlive you.',
    );
    expect(epitaph({ ...t, hardest: { name: 'x', grade: 12, outside: true } })).toBe(
      'You climbed harder than most ever will.',
    );
  });
});
