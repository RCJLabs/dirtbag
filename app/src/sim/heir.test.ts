// Phase 16.5: the kid you coached climbs on after you, in the same world, with what carries,
// and a first act of their own that ends on the line you named.
import { describe, expect, it } from 'vitest';
import { ageOf } from './age';
import { COACH_EDGE, HEIR_OPEN } from './content/heir';
import { ROUTES } from './content/routes';
import { BOND, HOME, MONEY } from './dials';
import { epilogue } from './epilogue';
import { act, emptyLog, newGame } from './game';
import { byName, kinLine } from './heir';
import { dealTalents } from './identity';
import { edgeTrain } from './paths';
import { actOf, currentGoal, goalDesc, progress, storyOf } from './story';
import type { GameState } from './types';
import { yearsDone } from './year';

const open = Object.values(ROUTES).find((r) => r.open && r.place === 'road')!;
const made = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('heir'), { t: 'create', name: 'Robin', start: 'allrounder', origin: 'quit' }).state,
  ...over,
});
const close = { bond: BOND.tiers[HOME.tier]!, last: 1 };
// A life, hung up: a first ascent, a dog, a paid trip, the van worn, the book, Dex close.
const retired = (over: Partial<GameState> = {}): GameState =>
  made({
    day: 300,
    firsts: {
      [open.id]: { name: 'Second Wind', call: 0, day: 120 },
      cmyth: { name: 'Dex Was Here', call: 0, day: 200, by: 'dex' },
    },
    dog: { name: 'Scout', since: 100, fed: 80, bond: 60 },
    unlocked: ['moon', 'bluff'],
    bolted: ['bbarn'],
    gym: {
      since: 200,
      members: 120,
      quality: 0.6,
      till: 300,
      last: 40,
      setter: true,
      upgrades: [],
      peak: 130,
      set: 0,
    },
    van: { tires: 0.4, engine: 0.3, battery: 0.9 },
    record: { firstsend: 3, fa: 120 },
    people: { dex: close, hazel: close },
    cash: 4000,
    mode: 'rope',
    life: { held: 0, told: 38, retired: { day: 300, forced: false } },
    ...over,
  });
const heir = (s: GameState) => act(s, { t: 'heir' }).state;

describe('the next generation', () => {
  it('only comes once you’ve hung it up', () => {
    expect(act(made(), { t: 'heir' }).events[0]?.k).toBe('refused');
  });

  it('starts the morning after, in the same world, with what carries and nothing else', () => {
    const s = retired();
    const h = heir(s);
    expect(h.seed).toBe(s.seed);
    expect(h.day).toBe(301);
    expect(h.climber.name).toBe('');
    expect(h.family).toEqual({ gen: 2, forebear: 'Robin', lines: [open.id], coach: true });
    // Your first ascents stay on the topos, under your name; Dex's stay his.
    expect(h.firsts[open.id]).toEqual({ name: 'Second Wind', call: 0, day: 120, by: 'kin:Robin' });
    expect(h.firsts.cmyth!.by).toBe('dex');
    expect(byName(h.firsts[open.id]!.by!)).toBe('Robin');
    expect(byName('dex')).toBe('Dex Calloway');
    // The van, the trips, the dog, the book, how you climbed.
    expect(h.van).toEqual(s.van);
    expect(h.unlocked).toEqual(['moon', 'bluff']);
    // The bluff's bolts stay in the rock; the gym doesn't pass down.
    expect(h.bolted).toEqual(['bbarn']);
    expect(h.gym).toBeNull();
    expect(h.dog?.name).toBe('Scout');
    expect(h.record).toEqual(s.record);
    // Not the money, the people or the sends: those are theirs to earn.
    expect(h.cash).toBe(MONEY.start);
    expect(h.people).toEqual({});
    expect(h.routes).toEqual({});
    expect(h.goals).toBe(0);
    expect(h.year.recapped).toBe(yearsDone(301));
    expect(h.life).toEqual({ held: 300, told: 0, retired: null });
  });

  it('makes the kid on the next screen: 22, their own talents, and a first act of their own', () => {
    const s = retired();
    const kid = act(heir(s), { t: 'create', name: 'Jo', start: 'boulderer', origin: 'desert' });
    const k = kid.state;
    expect(ageOf(k)).toBe(22);
    // Dealt for this generation, not their forebear's hand again.
    expect(k.talents.ids).toEqual(dealTalents('heir:2'));
    const said = kid.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
    expect(said).toContain(HEIR_OPEN.replace('{forebear}', 'Robin'));
    expect(said.some((t) => t.startsWith('Dex turns up at the gym'))).toBe(true);
    expect(storyOf(k)[0]!.title).toBe('Their Shadow');
    expect(actOf(k)).toBe(1);
    expect(currentGoal(k)?.id).toBe('keys');
    expect(edgeTrain(k)).toBeCloseTo(COACH_EDGE.train!);
  });

  it('ends its first act on a go on the line you named', () => {
    const k = act(heir(retired()), { t: 'create', name: 'Jo', start: 'boulderer', origin: 'desert' }).state;
    const last = { ...k, goals: 4 };
    expect(currentGoal(last)?.id).toBe('their-line');
    expect(goalDesc(currentGoal(last)!, last)).toBe('Get on Second Wind');
    expect(kinLine(last)).toMatchObject({ id: open.id, name: 'Second Wind', place: 'Roadside Crag' });
    expect(progress(last, { kin: true }).have).toBe(0);
    const tried = { ...last, routes: { [open.id]: { ...emptyLog(), goes: 1 } } };
    expect(progress(tried, { kin: true }).have).toBe(1);
    // Nothing of theirs on the topos: nothing to get on, and it's done.
    const none = act(heir(retired({ firsts: {} })), { t: 'create', name: 'Jo', start: 'boulderer' }).state;
    expect(progress({ ...none, goals: 4 }, { kin: true }).have).toBe(1);
  });

  it('carries no coaching from a Dex you never got close to', () => {
    expect(heir(retired({ people: {} })).family?.coach).toBe(false);
  });

  it('says in the epilogue who you climbed on after, and their line once you’ve sent it', () => {
    const k = act(heir(retired()), { t: 'create', name: 'Jo', start: 'boulderer', origin: 'desert' }).state;
    const text = () => epilogue(sent).map((l) => l.text);
    const sent = {
      ...k,
      routes: {
        [open.id]: { ...emptyLog(), goes: 3, sent: { day: 400, go: 3, style: 'redpoint' as const } },
      },
    };
    expect(text()).toContain(
      'You climbed on after Robin, and in the end people stopped calling you their kid.',
    );
    expect(text().some((t) => t.startsWith('You repeated Second Wind, the line Robin named.'))).toBe(true);
  });
});
