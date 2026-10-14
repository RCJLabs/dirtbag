// Phase 28.1: the crew's name. With two partners a Regular or closer, one of them brings it
// up; you name it once, from your record or your own words, and it's named for good.
import { describe, expect, it } from 'vitest';
import { CREW_NAME_SAYS, CREW_NAMES } from './content/crew';
import { CREW_NAME, PSYCHE } from './dials';
import { fill } from './format';
import { act, crewSuggestions, emptyLog, newGame, talkStart, talkValues } from './game';
import { crewNameable, crewNameDue, crewOf } from './crew';
import { psycheDay } from './psyche';
import { whereNow } from './presence';
import type { GameState, PersonLog } from './types';

const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');
// Close to someone, with no beat of their arc due today.
const pal = (bond: number, day: number): PersonLog => ({
  bond,
  last: day - 1,
  since: 1,
  talked: true,
  beatDay: day,
});
const DAY = 20;
const withCrew = (bonds: Record<string, number>, over: Partial<GameState> = {}): GameState => ({
  ...newGame('crewname'),
  day: DAY,
  climber: {
    name: 'Kit',
    start: 'allrounder',
    skills: { power: 20, fingers: 20, endurance: 20, technique: 20, head: 20 },
  },
  people: Object.fromEntries(Object.entries(bonds).map(([w, b]) => [w, pal(b, DAY)])),
  ...over,
});
// A minute today when Hazel's at the Lot, so she can say it to your face.
const withHazel = (s: GameState): GameState => {
  for (let min = 6 * 60; min < 23 * 60; min += 10) {
    const t = { ...s, at: 'lot', min };
    if (whereNow(t, 'hazel') === 'lot') return t;
  }
  throw new Error('Hazel never at the Lot');
};

describe('the crew', () => {
  it('is the partners you’re a Regular with or closer, closest first', () => {
    const s = withCrew({ hazel: 9, sage: 3, mara: 2, dex: 12, frank: 20 });
    expect(crewOf(s)).toEqual(['hazel', 'sage']);
    expect(crewNameable(s)).toBe(true);
    expect(crewNameable(withCrew({ hazel: 9, sage: 2 }))).toBe(false);
  });

  it('brings the name up with two, once, and not with one', () => {
    const s = withCrew({ hazel: 5, mara: 4 });
    expect(talkStart(s, 'mara')).toBe('crew-name');
    expect(talkStart(s, 'hazel-lot')).toBe('crew-name');
    expect(talkValues(s, 'mara').other).toBe('Hazel');
    expect(talkStart(withCrew({ hazel: 5, mara: 2 }), 'mara')).not.toBe('crew-name');
    // Not from someone outside it.
    expect(crewNameDue(withCrew({ hazel: 5, mara: 4, rico: 1 }), 'rico')).toBe(false);
    // Later: it waits on the People list, and nobody brings it up again.
    const later = act(withHazel(s), { t: 'say', talk: 'hazel-lot', node: 'crew-name', opt: 1 });
    expect(refused(later)).toBe(false);
    expect(later.events).toContainEqual({ k: 'line', text: CREW_NAME_SAYS.later });
    expect(talkStart(later.state, 'mara')).not.toBe('crew-name');
    expect(crewNameable(later.state)).toBe(true);
  });

  it('opens the naming when you say you’ll name it', () => {
    const r = act(withHazel(withCrew({ hazel: 5, sage: 4 })), {
      t: 'say',
      talk: 'hazel-lot',
      node: 'crew-name',
      opt: 0,
    });
    expect(r.events).toContainEqual({ k: 'crewName' });
  });
});

describe('naming it', () => {
  it('takes a name once, trimmed, and lifts the night', () => {
    const s = withCrew({ hazel: 5, sage: 4 });
    const r = act(s, { t: 'nameCrew', name: '  Gorge Rats  ' });
    expect(refused(r)).toBe(false);
    expect(r.state.crewName).toEqual({ name: 'Gorge Rats', day: DAY });
    expect(r.events).toContainEqual({ k: 'line', text: fill(CREW_NAME_SAYS.named, { name: 'Gorge Rats' }) });
    expect(crewNameable(r.state)).toBe(false);
    expect(psycheDay(r.state).up).toContain('a name for the crew');
    expect(psycheDay(r.state).delta - psycheDay(s).delta).toBe(PSYCHE.crewNamed);
    // Named for good.
    expect(refused(act(r.state, { t: 'nameCrew', name: 'Something Else' }))).toBe(true);
  });

  it('refuses a name too short, cuts one too long, and needs a crew', () => {
    const s = withCrew({ hazel: 5, sage: 4 });
    expect(refused(act(s, { t: 'nameCrew', name: ' x ' }))).toBe(true);
    const long = act(s, { t: 'nameCrew', name: 'y'.repeat(CREW_NAME.max + 10) }).state.crewName!;
    expect(long.name.length).toBe(CREW_NAME.max);
    expect(refused(act(withCrew({ hazel: 5 }), { t: 'nameCrew', name: 'Just Me' }))).toBe(true);
  });

  it('suggests names from the record: where you send most, your dog, your crowd, the van', () => {
    const s = withCrew({ hazel: 5, sage: 4 });
    // Nothing sent, no dog, both crowds even: the crowd's "neither", then the van.
    expect(crewSuggestions(s)).toEqual([CREW_NAMES.none, ...CREW_NAMES.rest]);
    const sent = { day: 3, go: 2, style: 'redpoint' as const };
    const t: GameState = {
      ...s,
      routes: { rsopen: { ...emptyLog(), sent }, pump: { ...emptyLog(), sent } },
      dog: { name: 'Scout', since: 5, fed: 80, bond: 40 },
      scene: { ...s.scene, old: 90 },
    };
    const names = crewSuggestions(t);
    expect(names).toHaveLength(4);
    expect(names[0]).toBe(CREW_NAMES.place.road);
    expect(names[1]).toBe('Scout’s Pack');
    expect(names[2]).toBe(CREW_NAMES.old);
    expect(new Set(names).size).toBe(4);
  });
});
