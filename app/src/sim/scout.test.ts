// Phase 22.7: Scout's life. Perks earned by bond, dog-years from the day he picked you, the
// vet's two scares and their bills, the last day and how you spend it, and no new stray for
// a month after.
import { describe, expect, it } from 'vitest';
import { DOG_FAREWELL } from './content/dog';
import { DOG, PSYCHE } from './dials';
import { dogOffered } from './cond';
import { act, newGame } from './game';
import { psycheDay } from './psyche';
import { dogAge, hasPerk, nextDogName, scoutFinds, strayDue } from './scout';
import { ticketTonight } from './spots';
import type { DogLog, GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('scout'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 300,
  min: 21 * 60,
  trips: 12,
  // No knock tonight: the knocks have their own tests.
  ...over,
});
const dog = (over: Partial<DogLog> = {}): DogLog => ({ name: 'Scout', since: 1, fed: 90, bond: 50, ...over });
const sleep = (s: GameState) =>
  act({ ...s, min: 21 * 60, deck: { ...s.deck, knock: s.day } }, { t: 'act', act: 'lot.sleep' });
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
// The night before he turns `age`.
const eve = (age: number, d: Partial<DogLog> = {}) => base({ day: 1 + age * DOG.year - 1, dog: dog(d) });

describe('Scout’s life', () => {
  it('ages in dog-years from the day he picked you', () => {
    expect(dogAge(dog({ since: 10 }), 10 + DOG.year * 3)).toBe(3);
    expect(dogAge(dog({ since: 10 }), 10 + DOG.year * 3 - 1)).toBe(2);
  });

  it('earns his perks by bond, and says so the day he does', () => {
    const s = base({ dog: dog({ bond: DOG.perks.watch - 1, fed: 50 }) });
    const r = act(s, { t: 'act', act: 'lot.kibble' });
    expect(r.state.dog!.bond).toBeGreaterThanOrEqual(DOG.perks.watch);
    expect(lines(r).some((l) => /knows a uniform from a person/.test(l))).toBe(true);
    expect(hasPerk(base({ dog: dog({ bond: 10 }) }), 'settle')).toBe(false);
    // A hungry dog does none of it.
    expect(hasPerk(base({ dog: dog({ bond: 90, fed: 10 }) }), 'watch')).toBe(false);
  });

  it('settles at the fire, and watches the van: tickets halved, not blocked', () => {
    const s = base({ dog: dog({ bond: DOG.perks.settle }), today: ['fire'] });
    expect(psycheDay(s).up).toContain('the fire, and Scout');
    expect(psycheDay(s).delta).toBe(PSYCHE.fire + DOG.settle);
    const lot = { lotNights: 8 };
    const none = ticketTonight(base(lot));
    const watched = ticketTonight(base({ ...lot, dog: dog({ bond: DOG.perks.watch }) }));
    expect(none).toBeGreaterThan(0);
    expect(watched).toBeCloseTo(none * DOG.watch);
  });

  it('finds food on his rounds with the perk, now and then', () => {
    let found = 0;
    for (let day = 5; day < 105; day++)
      if (scoutFinds(base({ day, dog: dog({ bond: DOG.perks.find }) }))) found++;
    expect(found).toBeGreaterThan(10);
    expect(found).toBeLessThan(45);
    expect(scoutFinds(base({ dog: dog({ bond: DOG.perks.find - 1 }) }))).toBeNull();
  });

  it('goes gray, slows down, and scares you at the vet, with the bill', () => {
    expect(lines(sleep(eve(DOG.gray))).some((l) => /going gray around the muzzle/.test(l))).toBe(true);
    expect(lines(sleep(eve(DOG.senior))).some((l) => /waited at the bottom of the approach/.test(l))).toBe(
      true,
    );
    const v = DOG.vet[0]!;
    const s = eve(v.age);
    const r = sleep(s);
    expect(lines(r).some((l) => /The Limp/.test(l))).toBe(true);
    const plain = sleep({ ...s, dog: null });
    expect(plain.state.cash - r.state.cash).toBe(v.cost);
  });

  it('has a last day: how you spend it, and then he’s gone, into the journal', () => {
    const s = eve(DOG.end, { bond: 80 });
    const r = sleep(s);
    expect(r.state.encounter).toMatchObject({ kind: 'farewell' });
    expect(act(r.state, { t: 'act', act: 'lot.cook' }).events[0]).toMatchObject({ k: 'refused' });
    const a = act(r.state, { t: 'answer', opt: 1 });
    expect(a.state.dog).toBeNull();
    expect(a.state.dogs).toEqual([{ name: 'Scout', years: DOG.end, day: r.state.day }]);
    expect(lines(a)).toContain(DOG_FAREWELL.opts[1]!.out);
    expect(lines(a).some((l) => /best thing that ever happened/.test(l))).toBe(true);
    expect(a.state.log.at(-1)?.text).toMatch(/Scout, 16 years\. Spent it with the van doors open/);
  });

  it('sends no new stray for a month, and the next one has a name of his own', () => {
    const gone = base({ day: 300, dog: null, dogs: [{ name: 'Scout', years: 16, day: 300 }] });
    expect(strayDue(gone)).toBe(false);
    expect(dogOffered(gone)).toBe(false);
    const later = { ...gone, day: 300 + DOG.gone };
    expect(dogOffered(later)).toBe(true);
    expect(nextDogName(later)).toBe('Moss');
    const r = act({ ...later, at: 'lot' }, { t: 'act', act: 'lot.adopt' });
    expect(r.state.dog?.name).toBe('Moss');
  });
});
