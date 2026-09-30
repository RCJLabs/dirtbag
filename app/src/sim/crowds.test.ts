// Phase 21.6: crowds. Who's out, from the crag's draw, the weekend, the hour and the sky; the
// queue they make for the ropes; and the beta they know, asked for or not.
import { describe, expect, it } from 'vitest';
import { isWeekend } from './cond';
import { ROUTES, WALLS } from './content/routes';
import { canAsk, crowdAt, crowdLevel, sprayable, sprayedOn, type Crowd } from './crowds';
import { CLIMB, CROWD } from './dials';
import { act, goCost, newGame } from './game';
import type { GameEvent, GameState, GoResult } from './types';
import { conditionsAt } from './weather';

const refused = (ev: GameEvent[]) => (ev.find((e) => e.k === 'refused') as { why?: string } | undefined)?.why;
const lines = (ev: GameEvent[]) => ev.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const sent = (hi: number, tried: string[]): GoResult => ({ sent: true, hi, fellAt: null, tried, skin: 0 });

// The first seed and day with this crowd at Roadside at this minute, as a game standing there.
function find(want: Crowd, min = 12 * 60, ok: (s: GameState) => boolean = () => true): GameState {
  for (let n = 0; n < 400; n++)
    for (let day = 1; day <= 56; day++) {
      const s: GameState = { ...newGame(`c${n}`), at: 'road', day, min };
      if (crowdAt(s.seed, day, min, 'road') === want && ok(s)) return s;
    }
  throw new Error(`no ${want} day`);
}

describe('crowds', () => {
  it('build from the crag, the weekend, the hour and the sky', () => {
    let we = 0;
    let wd = 0;
    let nWe = 0;
    let nWd = 0;
    for (let n = 0; n < 60; n++)
      for (let day = 1; day <= 56; day++) {
        const seed = `w${n}`;
        const v = crowdLevel(seed, day, 12 * 60, 'road');
        expect(v).toBe(crowdLevel(seed, day, 12 * 60, 'road'));
        // Nobody at dawn or after dark; nobody on wet rock.
        expect(crowdAt(seed, day, 6 * 60, 'road')).toBe('empty');
        expect(crowdAt(seed, day, 20 * 60, 'road')).toBe('empty');
        if (!conditionsAt(seed, day, 'road').open) expect(v).toBe(0);
        if (isWeekend(day)) ((we += v), nWe++);
        else ((wd += v), nWd++);
      }
    expect(we / nWe / (wd / nWd)).toBeGreaterThan(1.4);
    // A crag that draws fewer is quieter; a place with no draw never has a crowd.
    let road = 0;
    let crucible = 0;
    for (let day = 1; day <= 56; day++) {
      road += crowdLevel('x', day, 12 * 60, 'road');
      crucible += crowdLevel('x', day, 12 * 60, 'crucible');
      expect(crowdAt('x', day, 12 * 60, 'lot')).toBe('empty');
    }
    expect(crucible).toBeLessThan(road);
  });

  it('queue for the ropes when busy, and for the boulders only when packed', () => {
    const busy = find('busy');
    const packed = find('packed');
    const quiet = find('quiet');
    const pump = ROUTES.pump!;
    const warm = ROUTES.warm!;
    expect(goCost(pump, quiet).min).toBe(CLIMB.go.sport.min);
    expect(goCost(pump, busy).min).toBe(CLIMB.go.sport.min + CROWD.queue.rope.busy);
    expect(goCost(pump, packed).min).toBe(CLIMB.go.sport.min + CROWD.queue.rope.packed);
    expect(goCost(warm, busy).min).toBe(CLIMB.go.boulder.min);
    expect(goCost(warm, packed).min).toBe(CLIMB.go.boulder.min + CROWD.queue.boulder.packed);
    // A wall's pitches are above the queue.
    const pitch = ROUTES[WALLS.prow!.pitches[0]!]!;
    expect(goCost(pitch, packed).min).toBe(goCost(pitch, quiet).min);
  });

  it('tell you beta when you ask, and it costs you the onsight', () => {
    const warm = ROUTES.warm!;
    expect(sprayable(newGame('t'), warm).length).toBeGreaterThan(0);
    const quiet = find('quiet');
    expect(canAsk(quiet, warm)).toBe(false);
    expect(refused(act(quiet, { t: 'ask', route: 'warm' }).events)).toMatch(/Nobody here/);
    const busy = find('busy');
    const r = act(busy, { t: 'ask', route: 'warm' });
    expect(refused(r.events)).toBeUndefined();
    const b = sprayable(busy, warm)[0]!;
    expect(r.state.routes.warm).toMatchObject({ known: [b], told: [b] });
    expect(r.state.min).toBe(busy.min + CROWD.ask);
    // A send on the first go after it is a flash.
    const go = act(r.state, { t: 'go', route: 'warm' }).state;
    const done = act(go, { t: 'done', route: 'warm', result: sent(warm.moves, [b]) });
    expect(done.events).toContainEqual({ k: 'sent', route: 'warm', style: 'flash', go: 1 });
  });

  it('shout it at you anyway on a first go when packed, seeded', () => {
    const warm = ROUTES.warm!;
    const packed = find('packed', 12 * 60, (s) => sprayedOn(s, warm));
    const r = act(packed, { t: 'go', route: 'warm' });
    expect(lines(r.events).some((l) => l.includes('So much for the onsight'))).toBe(true);
    expect(r.state.routes.warm!.told).toHaveLength(1);
    // Never on a second go, and never when it isn't packed.
    expect(sprayedOn(r.state, warm)).toBe(false);
    expect(sprayedOn(find('busy'), warm)).toBe(false);
    // About CROWD.spray of packed first goes get it.
    let hit = 0;
    let all = 0;
    for (let n = 0; n < 200; n++)
      for (let day = 1; day <= 56; day++) {
        const s: GameState = { ...newGame(`p${n}`), at: 'road', day, min: 12 * 60 };
        if (crowdAt(s.seed, day, s.min, 'road') !== 'packed') continue;
        all++;
        if (sprayedOn(s, warm)) hit++;
      }
    expect(Math.abs(hit / all - CROWD.spray)).toBeLessThan(0.08);
  });
});
