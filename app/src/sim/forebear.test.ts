// Phase 31.2: the old climber stays in the valley. At the fire the first night after dark and
// some nights after; a story from their life; beta on the lines they sent.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FOREBEAR_BETA, FOREBEAR_LINES, FOREBEAR_MEET, FOREBEAR_NO_BETA } from './content/forebear';
import { ROUTES } from './content/routes';
import { FAMILY } from './dials';
import { act, emptyLog, newGame } from './game';
import { betaLine, forebearAtFire, forebearSays, MET, theirLines } from './forebear';
import { fromSave } from './save';
import type { GameState } from './types';

const V69 = readFileSync(new URL('./fixtures/save-v69.json', import.meta.url), 'utf8');
const sent = { ...emptyLog(), goes: 3, sent: { day: 50, go: 3, style: 'redpoint' as const } };
const made = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('forebear'), { t: 'create', name: 'Robin', start: 'allrounder' }).state,
  ...over,
});
// Robin sent the Pump and the Testpiece and put up Second Wind; went home at the end, with a
// crew and a bad shoulder.
const robin = (over: Partial<GameState> = {}): GameState =>
  made({
    day: 300,
    routes: { pump: sent, testpiece: sent, rsopen: sent, project: { ...emptyLog(), goes: 12 } },
    firsts: { rsopen: { name: 'Second Wind', call: 0, day: 120 } },
    scars: ['shoulder'],
    crewName: { name: 'The Gorge Rats', day: 90 },
    life: { held: 0, told: 38, retired: { day: 300, forced: false } },
    ...over,
  });
const kidOf = (s: GameState): GameState =>
  act(act(s, { t: 'heir' }).state, { t: 'create', name: 'Jo', start: 'boulderer' }).state;
const night = (s: GameState, day = s.day): GameState => ({ ...s, day, at: 'lot', min: 20 * 60, energy: 80 });
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');

describe('the old climber at the fire', () => {
  it('is only a family’s, only at the Lot’s fire after dark, and there the first night', () => {
    expect(forebearAtFire(night(made()))).toBe(false);
    const k = kidOf(robin());
    expect(forebearAtFire(night(k))).toBe(true);
    expect(forebearAtFire({ ...night(k), min: 12 * 60 })).toBe(false);
    expect(forebearAtFire({ ...night(k), at: 'road' })).toBe(false);
    // Till you've sat with them, every night.
    for (let d = k.day; d < k.day + 10; d++) expect(forebearAtFire(night(k, d))).toBe(true);
  });

  it('is there some nights once you’ve met, about FAMILY.fire of them', () => {
    const k = { ...kidOf(robin()), seen: [MET] };
    const days = Array.from({ length: 200 }, (_, i) => k.day + i);
    const there = days.filter((d) => forebearAtFire(night(k, d))).length / days.length;
    expect(there).toBeGreaterThan(FAMILY.fire - 0.1);
    expect(there).toBeLessThan(FAMILY.fire + 0.1);
  });

  it('meets you with a chair and a story, once a night, for the minutes it takes', () => {
    const k = night(kidOf(robin()));
    const r = act(k, { t: 'forebear', do: 'talk' });
    expect(refused(r)).toBe(false);
    const said = lines(r);
    expect(said[0]).toBe(FOREBEAR_MEET.replace('{forebear}', 'Robin'));
    expect(said[1]).toBe(FOREBEAR_LINES[0]!.text);
    expect(r.state.seen).toContain(MET);
    expect(r.state.min).toBe(k.min + FAMILY.talk);
    expect(r.state.today).toContain('fire');
    expect(refused(act(r.state, { t: 'forebear', do: 'talk' }))).toBe(true);
  });

  it('tells what the family kept, every line once before any comes round again', () => {
    let s = { ...night(kidOf(robin())), seen: [MET] };
    const heard: string[] = [];
    for (let i = 0; i < FOREBEAR_LINES.length + 2; i++) {
      const t = forebearSays(s);
      if (!t.fresh) break;
      heard.push(t.text);
      s = { ...s, seen: [...s.seen, t.id] };
    }
    expect(new Set(heard).size).toBe(heard.length);
    const all = heard.join(' ');
    // From the career: the hardest send (Second Wind, their V7), the first ascent, the project,
    // the scar, the crew, how it ended.
    expect(all).toContain('Second Wind took me a season');
    expect(all).toContain('about Second Wind for a week');
    expect(all).toContain(`“${ROUTES.project!.name}. I had all the moves.`);
    expect(all).toContain('The Gorge Rats');
    expect(all).toContain('their shoulder');
    expect(all).toContain('I stopped on a good day');
    // Not what the family didn't keep: no summit, no call from the body or from home.
    expect(all).not.toContain('The body called it');
    expect(all).not.toContain('I went home');
    expect(all).not.toContain('{');
    // Then they come round, walked.
    expect(forebearSays(s).fresh).toBe(false);
    expect(forebearSays(s).text).not.toContain('{');
  });

  it('gives beta on the line of theirs you’ve worked most, told, once a night', () => {
    const k = { ...night(kidOf(robin())), seen: [MET] };
    expect(theirLines(k).sort()).toEqual(['pump', 'rsopen', 'testpiece']);
    // Nothing tried yet: the easiest of theirs.
    expect(betaLine(k)?.id).toBe('pump');
    const worked = { ...k, routes: { testpiece: { ...emptyLog(), goes: 4 } } };
    expect(betaLine(worked)?.id).toBe('testpiece');
    const r = act(worked, { t: 'forebear', do: 'beta' });
    expect(refused(r)).toBe(false);
    const L = r.state.routes.testpiece!;
    expect(L.told).toHaveLength(1);
    expect(L.known).toEqual(L.told);
    expect(
      lines(r)[0]!.startsWith(`Robin draws ${ROUTES.testpiece!.name} in the dirt with a stick and taps `),
    ).toBe(true);
    expect(r.state.min).toBe(worked.min + FAMILY.beta);
    expect(refused(act(r.state, { t: 'forebear', do: 'beta' }))).toBe(true);
    expect(FOREBEAR_BETA).toContain('{Beta}');
    // No number typed into the words (CLAUDE.md).
    for (const t of [FOREBEAR_MEET, FOREBEAR_BETA, FOREBEAR_NO_BETA, ...FOREBEAR_LINES.map((l) => l.text)])
      expect(t).not.toMatch(/\d/);
  });

  it('has nothing to tell on lines you’ve sent, or once you know everything they do', () => {
    const k = { ...night(kidOf(robin())), seen: [MET] };
    const done = { ...k, routes: { pump: sent, testpiece: sent, rsopen: sent } };
    expect(betaLine(done)).toBeNull();
    const r = act(done, { t: 'forebear', do: 'beta' });
    expect(lines(r)[0]).toBe(FOREBEAR_NO_BETA.replace('{forebear}', 'Robin'));
    // Every beta of one line known: on to the next.
    const pump = ROUTES.pump!;
    const all = pump.cruxes.flatMap((c) => c.beta.slice(1));
    const knowsPump = { ...k, routes: { pump: { ...emptyLog(), goes: 9, known: all } } };
    expect(betaLine(knowsPump)?.id).not.toBe('pump');
  });

  it('knows only their first ascents in an heir’s save from before Phase 31', () => {
    const r = fromSave(V69);
    if (!r.ok) throw new Error(r.why);
    const s = night({ ...r.state, x: null });
    expect(forebearAtFire(s)).toBe(true);
    expect(theirLines(s).sort()).toEqual([...s.family!.lines].sort());
    const t = act(s, { t: 'forebear', do: 'talk' });
    expect(refused(t)).toBe(false);
    expect(lines(t).join(' ')).not.toContain('{');
  });
});
