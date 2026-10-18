// Phase 39: each crag's classics. The five on its card and your settled first ascents there;
// any send ticks one; every one ticked, and at least five, makes you a local, who doesn't wait on
// a busy day and finds somebody who knows the beta on a quiet one; the send that does it says
// so, once; the Record Book's entry; and nothing new in the save.
import { describe, expect, it } from 'vitest';
import { classicsAt, localAt, localPlaces } from './classics';
import { CLASSIC_SAYS } from './content/classics';
import { PLACES } from './content/places';
import { ROUTES } from './content/routes';
import { canAsk, crowdNow, queueMin } from './crowds';
import { CLASSICS, CROWD, SETTLE } from './dials';
import { fill } from './format';
import { act, newGame } from './game';
import { repeatDays } from './settle';
import type { GameState, GoResult, RouteLog } from './types';

const ROAD = PLACES.road!.classics!;
const sent = (day = 1): RouteLog => ({
  known: [],
  told: [],
  pick: {},
  falls: {},
  goes: 1,
  goesToday: 0,
  hi: 99,
  sent: { day, go: 1, style: 'redpoint' },
  sentToday: false,
});
const ticks = (ids: readonly string[]): Record<string, RouteLog> =>
  Object.fromEntries(ids.map((id) => [id, sent()]));
const at = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('classics'),
  climber: {
    name: 'Test',
    start: 'allrounder',
    skills: { power: 900, fingers: 900, endurance: 900, technique: 900, head: 900 },
  },
  at: 'road',
  x: null,
  min: 10 * 60,
  energy: 100,
  skin: 100,
  today: ['crag', 'warm'],
  ...over,
});
// A day at Roadside with the crowd `want`, open and dry.
function dayWith(want: string[], over: Partial<GameState> = {}): GameState {
  for (let d = 30; d < 900; d++) {
    const s = at({ day: d, ...over });
    if (want.includes(crowdNow(s, 'road'))) return s;
  }
  throw new Error(`no ${want.join('/')} day at Roadside`);
}
// Your own first ascent, long enough ago that its repeats have settled it.
const yours = (name: string) => ({ name, call: 0 as const, day: 1 });
const SENT: GoResult = { sent: true, hi: 99, fellAt: null, tried: [], skin: 0 };

describe('Phase 39: each crag’s classics', () => {
  it('lists a crag’s five, then your first ascents there once their grades settle', () => {
    expect(classicsAt(at(), 'road')).toEqual(ROAD);
    // The open project, yours: not a classic till its repeats settle it.
    const fa = at({ firsts: { rsopen: yours('Lot Lizard') }, routes: { rsopen: sent() } });
    const settles = repeatDays(fa, 'rsopen');
    expect(settles).toHaveLength(SETTLE.repeats);
    expect(classicsAt({ ...fa, day: settles.at(-1)! }, 'road')).toEqual(ROAD);
    expect(classicsAt({ ...fa, day: settles.at(-1)! + 1 }, 'road')).toEqual([...ROAD, 'rsopen']);
    // Somebody else's, or the family's, is theirs.
    const theirs = at({ day: 900, firsts: { rsopen: { ...yours('Dex Was Here'), by: 'dex' } } });
    expect(classicsAt(theirs, 'road')).toEqual(ROAD);
  });

  it('makes you a local with every classic ticked, by any send, and not one short', () => {
    expect(localAt(at({ routes: ticks(ROAD.slice(1)) }), 'road')).toBe(false);
    const all = at({ routes: ticks(ROAD) });
    expect(localAt(all, 'road')).toBe(true);
    expect(localPlaces(all)).toEqual(['road']);
    const flashed = { ...all.routes.warm!, sent: { day: 1, go: 1, style: 'flash' as const } };
    expect(localAt({ ...all, routes: { ...all.routes, warm: flashed } }, 'road')).toBe(true);
    // A first ascent of yours that's settled is on the list, and ticked: it was a send.
    const day = 900;
    const more = at({
      day,
      firsts: { rsopen: yours('Lot Lizard') },
      routes: { ...ticks(ROAD), rsopen: sent() },
    });
    expect(localAt(more, 'road')).toBe(true);
  });

  it('fills a crag of unclimbed lines from your settled first ascents, five of them', () => {
    const bluff = Object.values(ROUTES)
      .filter((r) => r.place === 'bluff')
      .map((r) => r.id);
    expect(PLACES.bluff!.classics ?? []).toEqual([]);
    const firsts = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, yours(id)]));
    const four = at({ day: 900, firsts: firsts(bluff.slice(0, 4)), routes: ticks(bluff.slice(0, 4)) });
    expect(classicsAt(four, 'bluff')).toHaveLength(4);
    expect(localAt(four, 'bluff')).toBe(false);
    const five = at({ day: 900, firsts: firsts(bluff.slice(0, 5)), routes: ticks(bluff.slice(0, 5)) });
    expect(classicsAt(five, 'bluff')).toHaveLength(CLASSICS.list);
    expect(localAt(five, 'bluff')).toBe(true);
  });

  it('lets a local on without the queue on a busy day', () => {
    const pump = ROUTES.pump!;
    const busy = dayWith(['busy', 'packed'], { routes: ticks(ROAD.filter((id) => id !== 'pump')) });
    expect(queueMin(busy, pump)).toBe(CROWD.queue.rope[crowdNow(busy, 'road') as 'busy' | 'packed']);
    const local = { ...busy, routes: { ...busy.routes, pump: sent() } };
    expect(localAt(local, 'road')).toBe(true);
    expect(queueMin(local, ROUTES.tradarete!)).toBe(0);
  });

  it('finds a local somebody who knows the beta on a quiet day, and nobody on an empty one', () => {
    const quiet = dayWith(['quiet'], { routes: ticks(ROAD.filter((id) => id !== 'warm')) });
    const r = ROUTES.project!;
    expect(canAsk(quiet, r)).toBe(false);
    const local = { ...quiet, routes: { ...quiet.routes, warm: sent() } };
    expect(canAsk(local, r)).toBe(true);
    const asked = act(local, { t: 'ask', route: 'project' });
    expect(asked.events[0]?.k).not.toBe('refused');
    expect(asked.state.routes.project!.told).toHaveLength(1);
    const empty = dayWith(['empty'], { routes: ticks(ROAD) });
    expect(canAsk(empty, r)).toBe(false);
  });

  it('says so the send that makes you a local, once, and puts it in the Record Book', () => {
    const s = at({ routes: ticks(ROAD.filter((id) => id !== 'warm')) });
    const go = act(s, { t: 'go', route: 'warm' });
    expect(go.events[0]?.k).not.toBe('refused');
    const done = act(go.state, { t: 'done', route: 'warm', result: SENT });
    const says = fill(CLASSIC_SAYS.local, { place: PLACES.road!.name });
    expect(done.events.some((e) => e.k === 'line' && e.text === says)).toBe(true);
    expect(done.state.record.local).toBe(done.state.day);
    // Already a local: another send says nothing of it.
    const again = act(act(done.state, { t: 'go', route: 'dyno' }).state, {
      t: 'done',
      route: 'dyno',
      result: SENT,
    });
    expect(again.events.some((e) => e.k === 'line' && e.text === says)).toBe(false);
    // A save that was a local before the classics existed: no line, the entry on its next act.
    const old = at({ routes: ticks(ROAD), record: {} });
    const next = act(old, { t: 'go', route: 'dyno' });
    expect(next.events.some((e) => e.k === 'line' && e.text === says)).toBe(false);
    expect(next.state.record.local).toBe(old.day);
  });
});
