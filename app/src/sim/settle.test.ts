// Phase 32.4: repeats settle every first ascent of yours, and a guide pays a little for each of
// them in it, never more than the poorest job's week.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ACTS } from './content/places';
import { gradeName, ROUTES } from './content/routes';
import { FA_NOTE, REPEAT_FIRST, REPEAT_WILD, REPEATERS, SETTLED } from './content/settle';
import { GUIDE, SETTLE } from './dials';
import { fill, money } from './format';
import { act, lineGrade, newGame } from './game';
import { fasIn, GUIDE_CRAGS, poorestWeek, royalties, royaltyOf } from './guides';
import { fromSave, validate } from './save';
import { faNote, repeatDays, repeatsOf, settled } from './settle';
import type { FirstAscent, GameState } from './types';

const V72 = readFileSync(new URL('./fixtures/save-v72.json', import.meta.url), 'utf8');
const made = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('settle'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  ...over,
});
const fa = (over: Partial<FirstAscent> = {}): FirstAscent => ({
  name: 'The Long Dark',
  call: 0,
  day: 50,
  ...over,
});
// Kit put up the Gorge's open boulder on day 50, and called it stout.
const kit = (over: Partial<FirstAscent> = {}, s: Partial<GameState> = {}) =>
  made({ day: 50, firsts: { gopen: fa({ call: 1, ...over }) }, ...s });
// A night in the van, the door quiet (a knock the night before keeps it so; Phase 22.6a).
const sleep = (s: GameState) =>
  act(
    { ...s, at: 'lot', x: null, min: 21 * 60, cash: 500, energy: 50, deck: { ...s.deck, knock: s.day } },
    { t: 'act', act: 'lot.sleep' },
  );
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const r = ROUTES.gopen!;

describe('repeats', () => {
  it('come to your own first ascents, seeded, a few weeks apart', () => {
    const s = kit();
    const days = repeatDays(s, 'gopen');
    expect(days).toHaveLength(SETTLE.repeats);
    let was = s.firsts.gopen!.day;
    for (const d of days) {
      expect(d - was).toBeGreaterThanOrEqual(SETTLE.gap[0]);
      expect(d - was).toBeLessThanOrEqual(SETTLE.gap[1]);
      was = d;
    }
    expect(repeatDays(kit(), 'gopen')).toEqual(days);
    // Somebody else's first ascent (Dex's, or the family's) isn't yours to settle.
    expect(repeatDays(kit({ by: 'dex' }), 'gopen')).toEqual([]);
    expect(repeatDays(kit(), 'mopen')).toEqual([]);
  });

  it('come slower to a wild place, where fewer people know the way', () => {
    const s = made({ day: 50, firsts: { hsplit: fa() } });
    let was = 50;
    for (const d of repeatDays(s, 'hsplit')) {
      expect(d - was).toBeGreaterThanOrEqual(SETTLE.gap[0] * SETTLE.wild);
      expect(d - was).toBeLessThanOrEqual(SETTLE.gap[1] * SETTLE.wild);
      was = d;
    }
  });

  it('settle the grade on the line: your call till the last of them, the line’s after', () => {
    for (const call of [-1, 0, 1] as const) {
      const s = kit({ call });
      const last = repeatDays(s, 'gopen').at(-1)!;
      expect(settled({ ...s, day: last }, 'gopen')).toBe(false);
      expect(lineGrade({ ...s, day: last }, r)).toBe(gradeName(r.disc, r.grade + call));
      expect(settled({ ...s, day: last + 1 }, 'gopen')).toBe(true);
      expect(lineGrade({ ...s, day: last + 1 }, r)).toBe(gradeName(r.disc, r.grade));
    }
    // Dex's call is always the line's.
    expect(lineGrade(kit({ by: 'dex', call: 0 }), r)).toBe(gradeName(r.disc, r.grade));
  });
});

describe('word of the repeats', () => {
  it('comes the night of the first, and of the one that settles it, once each', () => {
    const s = kit();
    const [first, , last] = repeatDays(s, 'gopen');
    const one = sleep({ ...s, day: first! });
    const heard = lines(one).filter((t) => t.includes('repeated The Long Dark'));
    expect(heard).toHaveLength(1);
    expect(REPEATERS.some((w) => heard[0] === fill(REPEAT_FIRST, { who: w, line: 'The Long Dark' }))).toBe(
      true,
    );
    expect(one.state.firsts.gopen!.heard).toBe(1);
    // Nothing the next night, nor at the second.
    expect(lines(sleep(one.state)).join(' ')).not.toContain('The Long Dark');
    const settles = sleep({ ...one.state, day: last! });
    const said = fill(SETTLED[1], {
      line: 'The Long Dark',
      grade: gradeName(r.disc, r.grade),
      called: gradeName(r.disc, r.grade + 1),
    });
    expect(lines(settles)).toContain(said);
    expect(settles.state.firsts.gopen!.heard).toBe(SETTLE.repeats);
    expect(lines(sleep(settles.state)).join(' ')).not.toContain('The Long Dark');
  });

  it('is only the settling, back from months away', () => {
    const s = kit({ call: -1 });
    const last = repeatDays(s, 'gopen').at(-1)!;
    const t = lines(sleep({ ...s, day: last + 30 })).filter((x) => x.includes('The Long Dark'));
    expect(t).toEqual([
      fill(SETTLED[-1], {
        line: 'The Long Dark',
        grade: gradeName(r.disc, r.grade),
        called: gradeName(r.disc, r.grade - 1),
      }),
    ]);
  });

  it('comes from nobody you’ll meet, in the Hollow', () => {
    const s = made({ day: 50, firsts: { hsplit: fa() } });
    const first = repeatDays(s, 'hsplit')[0]!;
    expect(lines(sleep({ ...s, day: first }))).toContain(fill(REPEAT_WILD, { line: 'The Long Dark' }));
  });

  it('is on the line’s sheet, and in words with no numbers typed in', () => {
    const s = kit();
    const [first, , last] = repeatDays(s, 'gopen');
    expect(faNote(s, 'gopen', lineGrade(s, r))).toBe(FA_NOTE.none);
    expect(faNote({ ...s, day: first! + 1 }, 'gopen', '')).toBe(
      fill(FA_NOTE.some, { n: 1, of: SETTLE.repeats }),
    );
    const done = { ...s, day: last! + 1 };
    expect(faNote(done, 'gopen', lineGrade(done, r))).toBe(
      fill(FA_NOTE.settled, { grade: gradeName(r.disc, r.grade) }),
    );
    for (const t of [
      REPEAT_FIRST,
      REPEAT_WILD,
      ...Object.values(SETTLED),
      ...Object.values(FA_NOTE),
      ...REPEATERS,
    ])
      expect(t).not.toMatch(/\d/);
  });
});

describe('royalties', () => {
  // The Gorge's guide out on day 60, with Kit's line in it; the Moon's, with Kit's put up after.
  const shelf = (over: Partial<GameState> = {}) =>
    made({
      day: 63,
      firsts: {
        gopen: fa({ day: 50 }),
        mopen: fa({ name: 'Late', day: 70 }),
        sopen: fa({ by: 'dex', day: 10 }),
      },
      guides: {
        gorge: { pages: GUIDE.pages, out: 60 },
        moon: { pages: GUIDE.pages, out: 60 },
        mesa: { pages: GUIDE.pages, out: 60 },
      },
      ...over,
    });

  it('pay a little more for each first ascent of yours in the guide', () => {
    const s = shelf();
    expect(fasIn(s, 'gorge')).toBe(1);
    expect(royaltyOf(s, 'gorge')).toBe(GUIDE.royalty + GUIDE.perFa);
    // Put up after it came out: not in it. Dex's: not yours.
    expect(royaltyOf(s, 'moon')).toBe(GUIDE.royalty);
    expect(royaltyOf(s, 'mesa')).toBe(GUIDE.royalty);
    // Not out: nothing.
    expect(fasIn({ ...s, guides: { gorge: { pages: 2, out: null } } }, 'gorge')).toBe(0);
    expect(royalties(s)).toBe(3 * GUIDE.royalty + GUIDE.perFa);
  });

  it('come with the week’s bills', () => {
    const s = shelf();
    expect(s.day % 7).toBe(0);
    expect(lines(sleep(s))).toContain(`Royalties from your 3 guides: ${money(royalties(s))}.`);
  });

  it('never come to more than the poorest job’s week, however many guides', () => {
    expect(poorestWeek()).toBe(ACTS['cafe.shift']!.cost.cash! * GUIDE.week);
    const all = shelf({
      guides: Object.fromEntries(GUIDE_CRAGS.map((id) => [id, { pages: GUIDE.pages, out: 60 }])),
    });
    const sum = GUIDE_CRAGS.reduce((t, id) => t + royaltyOf(all, id), 0);
    expect(sum).toBeGreaterThan(poorestWeek());
    expect(royalties(all)).toBe(poorestWeek());
  });
});

describe('a save from before', () => {
  it('loads a real 0.999.68 save, its old repeats heard of quietly and its new ones to come', () => {
    const r = fromSave(V72);
    if (!r.ok) throw new Error(r.why);
    expect(r.from).toBe(72);
    const old = JSON.parse(V72).state;
    // The Moon's line, put up on day 91, settled by day 161; the Big Stone's, day 155, not yet.
    expect(repeatsOf(r.state, 'mopen')).toBe(SETTLE.repeats);
    expect(repeatsOf(r.state, 'bproject')).toBe(0);
    expect(r.state).toEqual({
      ...old,
      firsts: { ...old.firsts, mopen: { ...old.firsts.mopen, heard: SETTLE.repeats } },
    });
    // The first night says nothing of the Moon's line.
    const t = lines(sleep(r.state)).join(' ');
    expect(t).not.toContain(old.firsts.mopen.name);
  });

  it('won’t load more repeats heard than settle a line', () => {
    const s = kit({ heard: SETTLE.repeats });
    expect(validate(s)).toEqual([]);
    expect(validate(kit({ heard: SETTLE.repeats + 1 }))).toContain('firsts');
    expect(validate(kit({ heard: -1 }))).toContain('firsts');
  });
});
