// Phase 27.1: rock as a rule. Each crag is made of something, its skin costs what that rock
// costs, sandstone's shut the day after rain, and Moonstone's pads stay at Moonstone.
import { describe, expect, it } from 'vitest';
import { PLACES, SANDSTONE_WET } from './content/places';
import { ROUTES } from './content/routes';
import { CLIMB, ROCK } from './dials';
import { goCost, morePads, newGame } from './game';
import { conditionsAt } from './weather';

const days = Array.from({ length: 300 }, (_, i) => i + 2);

describe('the rock', () => {
  it('gives every crag a rock, and costs its skin by it', () => {
    for (const [id, p] of Object.entries(PLACES)) if (p.crag) expect(p.rock, id).toBeDefined();
    const crimp = (place: string) =>
      Object.values(ROUTES).find((r) => r.place === place && r.type === 'crimp' && !r.wall)!;
    for (const place of ['road', 'mesa', 'moon', 'bluff', 'crucible']) {
      const r = crimp(place);
      const want = Math.round(CLIMB.skin.crimp * CLIMB.rockSkin * ROCK.skin[PLACES[place]!.rock!]);
      expect(-goCost(r).skin, place).toBe(want);
    }
    expect(-goCost(crimp('mesa')).skin).toBeGreaterThan(-goCost(crimp('bluff')).skin);
  });

  it('shuts sandstone the day after rain, and nothing else for it', () => {
    const seepingAt = (place: string) => days.filter((d) => conditionsAt('rock', d, place).seeping);
    const mesa = seepingAt('mesa');
    expect(mesa.length).toBeGreaterThan(0);
    for (const d of mesa) {
      const c = conditionsAt('rock', d, 'mesa');
      // Summer's heat shuts it on its own terms.
      expect(c.closed === SANDSTONE_WET || c.closed === PLACES.mesa!.closed!.why).toBe(true);
    }
    for (const place of ['moon', 'gorge'])
      for (const d of seepingAt(place)) expect(conditionsAt('rock', d, place).closed).not.toBe(SANDSTONE_WET);
    const dry = days.find(
      (d) => !conditionsAt('rock', d, 'mesa').seeping && conditionsAt('rock', d, 'mesa').open,
    )!;
    expect(conditionsAt('rock', dry, 'mesa').closed).not.toBe(SANDSTONE_WET);
  });

  it('keeps the Moonstone haul’s pads at Moonstone; a pad of your own goes everywhere', () => {
    const s = { ...newGame('rock'), unlocked: ['moon'] };
    expect(morePads(s, 'moon')).toBe(true);
    expect(morePads(s, 'road')).toBe(false);
    const owned = { ...s, gear: { ...s.gear, pad: 1 } };
    expect(morePads(owned, 'road')).toBe(true);
    expect(morePads({ ...newGame('rock') }, 'moon')).toBe(false);
  });
});
