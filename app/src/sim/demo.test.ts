// Phase 14.5 (Evan's calls): the demo's rules. Act I, then Dex's race week, at the Lot, in town
// and at Roadside and the Gorge; over the morning after the race is decided, and nothing more
// happens in it. Played here without building it; the full game is untouched.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { DEMO_END, DEMO_PLACES } from './content/demo';
import { RACE_ROUTE } from './content/people';
import { PLACES } from './content/places';
import { ACT_I } from './content/story';
import { asDemo, demoOver, raceDecided } from './edition';
import { act, emptyLog, newGame } from './game';
import { known } from './hollow';
import { currentGoal } from './story';
import type { FirstAscent, GameState } from './types';

const climber = (grade: number, over: Partial<GameState> = {}): GameState => {
  const k = needFor(grade);
  return {
    ...newGame('demo'),
    at: 'lot',
    min: 9 * 60,
    cash: 500,
    climber: {
      name: 'Kit',
      start: 'allrounder',
      skills: { power: k, fingers: k, endurance: k, technique: k, head: k },
    },
    ...over,
  };
};
const refused = (r: ReturnType<typeof act>) => {
  const e = r.events.find((x) => x.k === 'refused');
  return e?.k === 'refused' ? e.why : null;
};
// Dex's first ascent of the open line, overnight into `day`.
const dexFa = (day: number): Record<string, FirstAscent> => ({
  [RACE_ROUTE]: { name: 'Hers Now', call: 0, day, by: 'dex' },
});
// Act I done, on day 30.
const afterActI = (over: Partial<GameState> = {}) => climber(4, { day: 30, goals: ACT_I.length, ...over });

describe('the demo', () => {
  beforeEach(() => asDemo(true));
  afterEach(() => asDemo(false));

  it('knows only its own places, and won’t drive anywhere else', () => {
    const s = climber(9);
    for (const id of Object.keys(PLACES)) expect(known(s, id), id).toBe(DEMO_PLACES.includes(id));
    expect(refused(act(s, { t: 'travel', to: 'moon' }))).toBeTruthy();
    expect(refused(act(s, { t: 'travel', to: 'road' }))).toBeNull();
    // Every place it names is a place.
    for (const id of DEMO_PLACES) expect(PLACES, id).toHaveProperty([id]);
  });

  it('tells Act I, and no story after it', () => {
    expect(currentGoal(climber(0))?.id).toBe(ACT_I[0]!.id);
    expect(currentGoal(afterActI())).toBeNull();
    asDemo(false);
    expect(currentGoal(afterActI())).not.toBeNull();
  });

  it('ends the morning after Dex’s race is decided, his way or yours, and not before', () => {
    const racing = afterActI({ race: { route: RACE_ROUTE, until: 33 } });
    expect(raceDecided(racing)).toBeNull();
    expect(demoOver(racing)).toBe(false);
    // Dex takes it overnight: that morning's still yours, the next isn't.
    const dex = {
      ...afterActI({ day: 33 }),
      firsts: dexFa(33),
    };
    expect(demoOver(dex)).toBe(false);
    expect(demoOver({ ...dex, day: 34 })).toBe(true);
    // You send it: the day plays out, naming it included.
    const base = afterActI({ day: 32 });
    const you = {
      ...base,
      routes: {
        ...base.routes,
        [RACE_ROUTE]: { ...emptyLog(), sent: { day: 32, go: 3, style: 'redpoint' as const } },
      },
    };
    expect(raceDecided(you)).toBe(32);
    expect(demoOver(you)).toBe(false);
    expect(demoOver({ ...you, day: 33 })).toBe(true);
    // Not before Act I's done, whatever the race did.
    expect(demoOver({ ...dex, day: 34, goals: ACT_I.length - 1 })).toBe(false);
  });

  it('does nothing more once it’s over', () => {
    const over = {
      ...afterActI({ day: 34 }),
      firsts: dexFa(33),
    };
    const r = act(over, { t: 'travel', to: 'road' });
    expect(refused(r)).toBe(DEMO_END.refused);
    expect(r.state).toBe(over);
  });

  it('leaves the full game as it was', () => {
    asDemo(false);
    const over = {
      ...afterActI({ day: 34 }),
      firsts: dexFa(33),
    };
    expect(demoOver(over)).toBe(false);
    expect(known(climber(9), 'moon')).toBe(true);
    expect(refused(act(over, { t: 'travel', to: 'road' }))).toBeNull();
  });
});
