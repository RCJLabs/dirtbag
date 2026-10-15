// Phase 31.1: what the old climber leaves. A share of the money, capped; some of the old
// guard's regard; what they did, kept for the family; and their Record Book beside the kid's,
// which starts empty. And an heir's save from before the phase loads, its book split.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ageOf } from './ageing';
import { DREAMS } from './content/dreams';
import { routesAt } from './content/gym';
import { HEIR_MONEY } from './content/heir';
import { ACTS } from './content/places';
import { FACTION, FAMILY, MONEY } from './dials';
import { money } from './format';
import { act, emptyLog, newGame } from './game';
import { careerOf, leaveCap, moneyLeft, oldStart } from './heir';
import { fromSave } from './save';
import type { GameState } from './types';

const V69 = readFileSync(new URL('./fixtures/save-v69.json', import.meta.url), 'utf8');
const made = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('inherit'), { t: 'create', name: 'Robin', start: 'allrounder' }).state,
  ...over,
});
const done = (over: Partial<GameState> = {}): GameState =>
  made({ day: 300, life: { held: 0, told: 38, retired: { day: 300, forced: false } }, ...over });
const heir = (s: GameState) => act(s, { t: 'heir' }).state;
const kid = (s: GameState) => act(heir(s), { t: 'create', name: 'Jo', start: 'boulderer' });
const sent = { ...emptyLog(), goes: 3, sent: { day: 50, go: 3, style: 'redpoint' as const } };
const tried = (goes: number) => ({ ...emptyLog(), goes });

describe('what the old climber leaves', () => {
  it('passes on a share of the money, capped at the café’s pay for a fortnight of shifts', () => {
    expect(leaveCap()).toBe(ACTS['cafe.shift']!.cost.cash! * FAMILY.shifts);
    // A grace month, never a dream bought outright.
    expect(leaveCap()).toBeLessThan(Math.min(...Object.values(DREAMS).map((d) => d.cost)));
    expect(moneyLeft(done({ cash: 100, dream: { pick: 'rig', pot: 100, owned: [] } }))).toBe(
      Math.floor(FAMILY.share * 200),
    );
    expect(moneyLeft(done({ cash: 4000 }))).toBe(leaveCap());
    // A debt stays with them.
    expect(moneyLeft(done({ cash: -60 }))).toBe(0);
    const h = heir(done({ cash: 100, dream: { pick: null, pot: 0, owned: [] } }));
    expect(h.cash).toBe(MONEY.start + Math.floor(FAMILY.share * 100));
    expect(h.family?.career?.money).toBe(Math.floor(FAMILY.share * 100));
  });

  it('says so once, in the glovebox, and not when there was nothing to leave', () => {
    const lines = (s: GameState) => kid(s).events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
    const left = Math.floor(FAMILY.share * 100);
    expect(lines(done({ cash: 100 }))).toContain(
      HEIR_MONEY.replace('{cash}', money(left)).replace('{forebear}', 'Robin'),
    );
    expect(lines(done({ cash: 0 })).some((t) => t.includes('glovebox'))).toBe(false);
  });

  it('starts the kid part of the way to where the old guard had their forebear, either way', () => {
    const at = (old: number) => heir(done({ scene: { ...made().scene, old } })).scene.old;
    expect(at(FACTION.start)).toBe(FACTION.start);
    expect(at(80)).toBe(Math.round(FACTION.start + FAMILY.old * 30));
    expect(at(20)).toBe(Math.round(FACTION.start - FAMILY.old * 30));
    expect(oldStart(80)).toBeGreaterThan(FACTION.start);
  });

  it('keeps what they did: the lines sent outside, the one they never sent, and how it ended', () => {
    const gym = routesAt('inherit', 'gym', 300)[0]!.id;
    const s = done({
      routes: {
        rsopen: sent,
        pump: sent,
        [gym]: sent,
        project: tried(9),
        testpiece: tried(9),
        warm: tried(1),
      },
      scars: ['finger'],
      book: [
        { id: 'elcap', day: 200, end: 'summit', high: 30, partner: null, nights: 4, seen: [], told: false },
        { id: 'elcap', day: 250, end: 'summit', high: 30, partner: null, nights: 4, seen: [], told: false },
      ],
      crewName: { name: 'The Gorge Rats', day: 100 },
      scene: { ...made().scene, old: 70 },
      cash: 40,
    });
    const c = careerOf(s);
    // The gym's sets come down: only the rock's lines are kept.
    expect([...c.sent].sort()).toEqual(['pump', 'rsopen']);
    // Tried as often, the harder one: the project (V6) over the testpiece (V5).
    expect(c.project).toBe('project');
    expect(c).toMatchObject({
      age: ageOf(s, 300),
      how: 'chose',
      scars: ['finger'],
      summits: ['El Capitan'],
      crew: 'The Gorge Rats',
      old: 70,
      money: Math.floor(FAMILY.share * 40),
    });
    expect(heir(s).family?.career).toEqual(c);
    expect(careerOf(done({ life: { held: 0, told: 45, retired: { day: 300, forced: true } } })).how).toBe(
      'body',
    );
    expect(
      careerOf(done({ life: { held: 0, told: 30, retired: { day: 300, forced: false, home: true } } })).how,
    ).toBe('home');
    // Nothing tried and left: no project.
    expect(careerOf(done({ routes: { rsopen: sent } })).project).toBeNull();
  });

  it('gives the kid a fresh book, theirs beside it, and the days on the road are the kid’s own', () => {
    const s = done({
      record: { firstsend: 3, year: 57, retired: 300 },
      dog: { name: 'Scout', since: 100, fed: 80, bond: 60 },
    });
    const k = kid(s).state;
    expect(k.family?.books).toEqual([{ name: 'Robin', record: { firstsend: 3, year: 57, retired: 300 } }]);
    // The dog comes with its entry; a year on the road doesn't come with the day count.
    expect(k.record.dog).toBe(301);
    expect(k.record.year).toBeUndefined();
    expect(k.record.retired).toBeUndefined();
    const later = act({ ...k, day: k.life.held + 57 }, { t: 'travel', to: 'gym' });
    expect(later.events.some((e) => e.k === 'refused')).toBe(false);
    expect(later.state.record.year).toBe(k.life.held + 57);
  });

  it('adds a book a generation', () => {
    const jo = kid(done({ record: { firstsend: 3, retired: 300 } })).state;
    const jos = {
      ...jo,
      day: 500,
      record: { firstsend: 320 },
      life: { ...jo.life, retired: { day: 500, forced: false } },
    };
    const third = heir(jos);
    expect(third.family?.gen).toBe(3);
    expect(third.family?.forebear).toBe('Jo');
    expect(third.family?.books.map((b) => b.name)).toEqual(['Robin', 'Jo']);
    expect(third.family?.books[1]!.record).toEqual({ firstsend: 320 });
  });
});

describe('an heir from before Phase 31', () => {
  it('loads a real 0.999.61 save with an heir: the forebear’s entries on their own page', () => {
    const r = fromSave(V69);
    if (!r.ok) throw new Error(r.why);
    const s = r.state;
    expect(r.from).toBe(69);
    expect(s.family?.gen).toBe(2);
    expect(s.family?.career).toBeUndefined();
    const theirs = s.family!.books[0]!;
    expect(theirs.name).toBe(s.family!.forebear);
    expect(Object.keys(theirs.record).length).toBeGreaterThan(0);
    expect(Object.values(theirs.record).every((d) => d <= s.life.held)).toBe(true);
    expect(s.record).toEqual({});
    // It plays on.
    expect(act(s, { t: 'travel', to: 'lot' }).events.some((e) => e.k === 'refused')).toBe(false);
  });

  it('keeps what the kid earned after the day their forebear hung it up', () => {
    const file = JSON.parse(V69);
    const held = file.state.life.held as number;
    file.state.record = { ...file.state.record, comp: held + 1 };
    const r = fromSave(JSON.stringify(file));
    if (!r.ok) throw new Error(r.why);
    expect(r.state.record).toEqual({ comp: held + 1 });
    expect(r.state.family!.books[0]!.record.comp).toBeUndefined();
  });
});
