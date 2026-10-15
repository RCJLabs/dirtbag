// Phase 32.1: the Hollow, the crag nobody has a topo for. On no map and no road you know of
// till it's found; its lines all open projects, in sandstone, held to every line's rules.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { PLACES } from './content/places';
import { ROCK_LINES } from './content/rock';
import { ROUTES } from './content/routes';
import { routeById } from './content/gym';
import { act, newGame } from './game';
import { known } from './hollow';
import { aimEarned } from './record';
import type { GameState } from './types';

const n = needFor(10);
const strong = (over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('hollow'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  return {
    ...s,
    climber: { ...s.climber, skills: { power: n, fingers: n, endurance: n, technique: n, head: n } },
    at: 'gorge',
    min: 9 * 60,
    energy: 100,
    cash: 200,
    ...over,
  };
};
const lines = Object.values(ROUTES).filter((r) => r.place === 'hollow');

describe('the Hollow', () => {
  it('is on no road you know of till it’s found, however hard you climb', () => {
    const s = strong();
    expect(known(s, 'hollow')).toBe(false);
    expect(known(s, 'gorge')).toBe(true);
    const r = act(s, { t: 'travel', to: 'hollow' });
    expect(r.events.find((e) => e.k === 'refused')).toMatchObject({
      why: 'There’s no road there you know of.',
    });
    // And it isn't one of the crags a circuit asks for until it is.
    const everywhere = { ...s, unlocked: ['moon'] };
    expect(aimEarned(everywhere, { circuit: true })).toBe(false);
  });

  it('is a drive like any other once found', () => {
    const s = strong({ unlocked: ['hollow'] });
    expect(known(s, 'hollow')).toBe(true);
    const r = act(s, { t: 'travel', to: 'hollow' });
    expect(r.events.some((e) => e.k === 'refused')).toBe(false);
    expect(r.state.at).toBe('hollow');
  });

  it('is a shaded sandstone canyon with no crowd, and no way to buy your way in', () => {
    const p = PLACES.hollow!;
    expect(p).toMatchObject({ hidden: true, crag: true, rock: 'sandstone', shaded: true });
    expect(p.unlock).toBeUndefined();
    expect(p.crowd).toBeUndefined();
  });

  it('has boulders, cracks and faces, every one an open project, in its own rock', () => {
    expect(lines.map((r) => r.disc).sort()).toEqual([
      'boulder',
      'boulder',
      'boulder',
      'sport',
      'sport',
      'trad',
      'trad',
    ]);
    for (const r of lines) {
      expect(r.open).toBe(true);
      expect(routeById('hollow', r.id)?.id).toBe(r.id);
      expect(ROCK_LINES[r.id]?.length).toBe(r.cruxes.length);
    }
    expect(Math.min(...lines.map((r) => r.grade))).toBeGreaterThanOrEqual(PLACES.hollow!.minGrade!);
  });
});
