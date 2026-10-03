// Climbing above your grade (Phase 16, Evan's call): one style carries you only so far past
// your grade, windows close faster past a grade over and shut at the limit, and each full
// grade over adds a crux that's yours alone.
import { describe, expect, it } from 'vitest';
import { carefulHands, playGo } from './bot';
import { attemptInput, goResult, startAttempt, stepAttempt } from './climb';
import { levelOf, mix, needFor } from './climber';
import { ROUTES } from './content/routes';
import { OVER } from './dials';
import { act, emptyLog, goBlocked, newGame } from './game';
import { beyond, extraCruxes, overhead, reachOf } from './reach';
import type { GameState } from './types';

const even = (g: number) => {
  const k = needFor(g);
  return { power: k, fingers: k, endurance: k, technique: k, head: k };
};
const climber = (skills: GameState['climber']['skills'], over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('reach'), { t: 'create', name: 'Ash', start: 'allrounder' }).state;
  return { ...s, energy: 100, skin: 100, today: ['warm'], climber: { ...s.climber, skills }, ...over };
};

describe('climbing above your grade', () => {
  it('counts one style only so far past your grade', () => {
    // A V12 who's trained power far past the rest.
    const skills = { ...even(11), power: needFor(17) };
    const s = climber(skills);
    expect(levelOf(mix(skills, 'power'))).toBeGreaterThan(15);
    expect(reachOf(s, 'power')).toBeLessThan(levelOf(mix(skills, 'power')));
    const avg = levelOf(
      (skills.power + skills.fingers + skills.endurance + skills.technique + skills.head) / 5,
    );
    expect(reachOf(s, 'power')).toBeCloseTo(avg + OVER.specialist);
    // Even all round, the cap never bites.
    expect(reachOf(climber(even(6)), 'crimp')).toBeCloseTo(6);
  });

  it('won’t let you tie in at the limit, and says so', () => {
    const s = climber(even(4), { at: 'road', min: 9 * 60 });
    const proj = ROUTES.rsopen!;
    expect(proj.grade - 4).toBeGreaterThanOrEqual(OVER.limit);
    expect(beyond(s, proj)).toBe(true);
    expect(goBlocked(s, proj)).toMatch(/^Beyond you, for now/);
    expect(beyond(s, ROUTES.project!)).toBe(false);
  });

  it('judges the limit by the grade a line is given, so a sandbag keeps its secret', () => {
    const dyno = ROUTES.gdyno!;
    expect(dyno.trueGrade).toBeGreaterThan(dyno.grade);
    const s = climber(even(dyno.grade - OVER.limit + 0.5));
    expect(beyond(s, dyno)).toBe(false);
  });

  it('adds a crux a grade and a half over, two a grade on, never more, and only on your go', () => {
    const r = ROUTES.project!;
    expect(extraCruxes(climber(even(r.grade)), r)).toBe(0);
    expect(extraCruxes(climber(even(r.grade - 1)), r)).toBe(0);
    expect(extraCruxes(climber(even(r.grade - OVER.cruxFrom - 0.01)), r)).toBe(1);
    expect(extraCruxes(climber(even(r.grade - 2.6)), r)).toBe(OVER.most);
    const s = climber(even(r.grade - 2.6));
    const met = overhead(s, r);
    expect(met.cruxes).toHaveLength(r.cruxes.length + OVER.most);
    // In the line's free stretches, in order, none on another, each borrowing its beta.
    for (let i = 1; i < met.cruxes.length; i++)
      expect(met.cruxes[i]!.from).toBeGreaterThan(met.cruxes[i - 1]!.to);
    for (const c of met.cruxes.filter((c) => c.of))
      expect(c.beta).toEqual(r.cruxes.find((x) => x.id === c.of)!.beta);
    expect(met.cruxes[met.cruxes.length - 1]!.to).toBeLessThan(r.moves);
    // Named in the order you meet them, each on the beta of the line's own crux nearest it.
    const pump = overhead(climber(even(ROUTES.pump!.grade - 2.9)), ROUTES.pump!);
    const mine = pump.cruxes.filter((c) => c.of);
    expect(mine.map((c) => [c.name, c.of])).toEqual([
      ['A move that’s a crux for you', 'A'],
      ['Another one', 'B'],
    ]);
    // On a rope, above the first bolt: a crux of yours is never a fall to the ground.
    expect(mine[0]!.from).toBeGreaterThan(ROUTES.pump!.bolts[0]!);
    // The topo keeps the line's own.
    expect(ROUTES.project!.cruxes).toHaveLength(r.cruxes.length);
  });

  it('counts a fall at an added crux against the crux it borrowed from', () => {
    const r = ROUTES.project!;
    const s = climber(even(r.grade - 2.6), { at: 'road', min: 9 * 60 });
    let a = startAttempt(s, r);
    const first = a.def.cruxes[0]!;
    expect(first.of).toBeDefined();
    // Hold the whole way, pressing again at the crux: the throw over-charges.
    for (let i = 0; i < 60 * 30 && a.phase !== 'fall' && a.phase !== 'lowered'; i++) {
      if (!a.hold) a = attemptInput(a, true).att;
      a = stepAttempt(a).att;
    }
    expect(a.fall).toMatchObject({ crux: first.of, extra: first.name });
    expect(goResult(a).fellAt).toBe(first.of);
  });

  it('keeps the Crucible’s myths from a V12 who’s only strong', () => {
    const s = climber({ ...even(11), power: needFor(17) }, { at: 'crucible', min: 10 * 60 });
    const sent = { day: 1, go: 1, style: 'redpoint' as const };
    const read = { ...s, routes: { chorizon: { ...emptyLog(), sent } } };
    expect(goBlocked(read, ROUTES.cgenesis!)).toMatch(/^Beyond you/);
    // Careful hands, a skilled player's ceiling, don't get through what isn't there.
    expect(playGo(read, ROUTES.cgenesis!, carefulHands()).sent).toBe(false);
  });
});
