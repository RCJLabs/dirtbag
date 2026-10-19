// Phase 42: belaying, played. The rope: a perfect hand makes a clean belay, a hand that never
// moves or brakes through the fall doesn't, and a clip pulls slack and gives some back. The
// belay itself: at a crag with them, once a day each, for its time and energy; the day
// together, never on top of one; a clean belay's beta on your line and a hard catch's grumble;
// their favour's belay, but not a boulderer's spot; and the talk option only when it's allowed.
import { describe, expect, it } from 'vitest';
import {
  belayBlocked,
  belayLine,
  cleanBelay,
  playRope,
  ropeInput,
  ropeResult,
  startRope,
  stepRope,
  type Rope,
} from './belay';
import { holds } from './cond';
import { BELAY_ANY, BELAY_SAYS } from './content/belay';
import { TALK } from './content/people';
import { PLACES } from './content/places';
import { ROUTES, roped } from './content/routes';
import { sprayable } from './crowds';
import { BELAY, CLIMB } from './dials';
import { favourAsk } from './favours';
import { fill } from './format';
import { act, lineName, newGame, talkStart } from './game';
import { whereNow } from './presence';
import { Rng } from './rng';
import type { BelayResult, GameState, PersonLog, RouteLog } from './types';
import { conditions, conditionsAt } from './weather';

const pal = (bond: number, over: Partial<PersonLog> = {}): PersonLog => ({
  bond,
  last: 0,
  since: 1,
  talked: true,
  arc: 9,
  beatDay: 1,
  life: 9,
  ...over,
});
const at = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('belay'),
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
  today: ['crag'],
  people: { hazel: pal(3) },
  ...over,
});
// An open day, when Hazel spends it at Roadside.
function openDay(over: Partial<GameState> = {}): GameState {
  for (let d = 30; d < 300; d++) {
    const s = at({ day: d, ...over });
    if (conditions(s.seed, d).open && whereNow(s, 'hazel') === 'road') return s;
  }
  throw new Error('no open day at Roadside');
}
const worked = (goes: number): RouteLog => ({
  known: [],
  told: [],
  pick: {},
  falls: {},
  goes,
  goesToday: 0,
  hi: 3,
  sent: null,
  sentToday: false,
});
const lines = (r: ReturnType<typeof act>): string[] =>
  r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const refusal = (r: ReturnType<typeof act>): string | undefined =>
  r.events.flatMap((e) => (e.k === 'refused' ? [e.why] : []))[0];
const CLEAN: BelayResult = { band: 1, soft: true };
const HARD: BelayResult = { band: 1, soft: false };
const toEnd = (b: Rope, hand: (b: Rope) => boolean): Rope => {
  while (b.phase !== 'caught') b = stepRope(ropeInput(b, hand(b)));
  return b;
};

describe('Phase 42: the rope', () => {
  const s = openDay();
  const line = belayLine(s, 'road')!;

  it('makes a clean belay of a perfect hand, and not of one that never moves', () => {
    const good = playRope(startRope(s, 'hazel', line));
    expect(good.phase).toBe('caught');
    expect(cleanBelay(ropeResult(good))).toBe(true);
    // Hands off the whole way: the slack runs out of the band, and nothing gave at the catch.
    const off = toEnd(startRope(s, 'hazel', line), () => false);
    expect(ropeResult(off).soft).toBe(false);
    expect(ropeResult(off).band).toBeLessThan(BELAY.clean);
  });

  it('catches hard if you brake through the fall, or give too soon', () => {
    const climbWell = (b: Rope) =>
      b.phase === 'clip' ? false : b.slack > 0.55 ? true : b.slack < 0.45 ? false : b.hold;
    const braked = toEnd(startRope(s, 'hazel', line), (b) => (b.phase === 'fall' ? true : climbWell(b)));
    expect(ropeResult(braked).soft).toBe(false);
    // Let go the moment they come off, with the whole fall still to come.
    const early = toEnd(startRope(s, 'hazel', line), (b) => (b.phase === 'fall' ? false : climbWell(b)));
    expect(ropeResult(early).soft).toBe(false);
    expect(ropeResult(early).band).toBeGreaterThanOrEqual(BELAY.clean);
  });

  it('pulls slack on a clip, and gives some back once it’s clipped', () => {
    let b = startRope(s, 'hazel', line);
    while (b.phase !== 'clip') b = stepRope(b);
    const before = b.slack;
    while (b.phase === 'clip') {
      const was = b;
      b = stepRope(b);
      if (b.phase === 'clip') expect(b.slack).toBeLessThan(was.slack);
      else
        expect(b.slack).toBeCloseTo(
          Math.min(1, was.slack + (BELAY.pay - BELAY.clip.pull / BELAY.clip.s) / 60 + BELAY.clip.back),
          5,
        );
    }
    expect(b.next).toBe(1);
    expect(before).toBeGreaterThan(0);
  });

  it('gives a bot’s hands a person’s misses, and the same belay for the same hands', () => {
    let clean = 0;
    for (let k = 0; k < 200; k++) {
      const b = playRope(startRope(s, 'hazel', line), Rng.fromSeed(`hands-${k}`));
      if (cleanBelay(ropeResult(b))) clean++;
    }
    expect(clean).toBeGreaterThan(80);
    expect(clean).toBeLessThan(195);
    const a = playRope(startRope(s, 'hazel', line), Rng.fromSeed('same'));
    expect(playRope(startRope(s, 'hazel', line), Rng.fromSeed('same'))).toEqual(a);
  });
});

describe('Phase 42: giving a belay', () => {
  it('costs its time and energy, once a day each, and is the day together', () => {
    const s = openDay();
    expect(belayBlocked(s, 'hazel')).toBeNull();
    const r = act(s, { t: 'belay', who: 'hazel', result: CLEAN });
    expect(refusal(r)).toBeUndefined();
    expect(r.state.min).toBe(s.min + BELAY.min);
    expect(r.state.energy).toBe(s.energy - BELAY.energy);
    expect(r.state.people.hazel).toMatchObject({ bond: 4, last: s.day });
    expect(refusal(act(r.state, { t: 'belay', who: 'hazel', result: CLEAN }))).toBe(
      'You’ve belayed them today.',
    );
  });

  it('never adds to a day you’ve already climbed together', () => {
    const s = openDay();
    const together = { ...s, people: { hazel: pal(3, { last: s.day }) } };
    const r = act(together, { t: 'belay', who: 'hazel', result: CLEAN });
    expect(r.state.people.hazel!.bond).toBe(3);
  });

  it('gets a clean belay a beta on the line you’ve worked most there, and a hard one a grumble', () => {
    const s = openDay({ routes: { pump: worked(4), crimpfest: worked(1) } });
    const r = belayLine(s, 'road')!;
    expect(r.id).toBe('pump');
    const beta = sprayable(s, r)[0]!;
    const clean = act(s, { t: 'belay', who: 'hazel', result: CLEAN });
    expect(clean.state.routes.pump!.known).toContain(beta);
    expect(clean.state.routes.pump!.told).toContain(beta);
    expect(lines(clean)).toContain(
      fill(BELAY_SAYS.hazel!.clean, { name: 'Hazel', line: lineName(s, r), beta: r.beta[beta]!.name }),
    );
    const hard = act(s, { t: 'belay', who: 'hazel', result: HARD });
    expect(hard.state.routes.pump!.known).toEqual([]);
    expect(lines(hard)).toContain(BELAY_SAYS.hazel!.hard);
    // The day together either way.
    expect(hard.state.people.hazel!.bond).toBe(4);
    // A slack belay with a soft catch isn't clean either.
    const slack = act(s, { t: 'belay', who: 'hazel', result: { band: BELAY.clean - 0.1, soft: true } });
    expect(slack.state.routes.pump!.known).toEqual([]);
  });

  it('is refused away from them, late, tired, or where nothing’s on a rope', () => {
    const s = openDay();
    expect(belayBlocked({ ...s, at: 'lot' }, 'hazel')).toBe('Not at a crag with you');
    expect(belayBlocked({ ...s, min: CLIMB.darkFrom - BELAY.min + 1 }, 'hazel')).toBe('Too late for a rope');
    expect(belayBlocked({ ...s, energy: BELAY.energy - 1 }, 'hazel')).toBe('Too tired to hold a rope');
    expect(belayBlocked(s, 'dex')).toBe('Not someone you climb with');
    const pads = Object.keys(PLACES).find(
      (p) => PLACES[p]!.crag && !Object.values(ROUTES).some((r) => r.place === p && roped(r)),
    );
    // A crag of boulders, on a day it's open, with Hazel asked along.
    expect(pads).toBeDefined();
    const there = Array.from({ length: 300 }, (_, i) => i + 30)
      .map((day) =>
        at({ day, at: pads!, people: { hazel: pal(3, { invite: { day, place: pads!, from: 0 } }) } }),
      )
      .find((t) => {
        const c = conditionsAt(t.seed, t.day, pads!);
        return c.open && !c.closed && whereNow(t, 'hazel') === pads;
      })!;
    expect(belayBlocked(there, 'hazel')).toBe('Nothing here on a rope');
    expect(refusal(act({ ...s, at: 'lot' }, { t: 'belay', who: 'hazel', result: CLEAN }))).toBe(
      'Not at a crag with you.',
    );
    expect(refusal(act(s, { t: 'belay', who: 'hazel', result: { band: 2, soft: true } }))).toBe(
      'Not a belay.',
    );
  });

  it('is on their talk only while you could give it', () => {
    const s = openDay();
    expect(holds(s, { belay: 'hazel' })).toBe(true);
    const done = act(s, { t: 'belay', who: 'hazel', result: CLEAN }).state;
    expect(holds(done, { belay: 'hazel' })).toBe(false);
    // Asked from her talk, it puts the rope in your hands; the time is the belay's.
    const node = talkStart(s, 'hazel-crag')!;
    const opt = TALK['hazel-crag']!.nodes[node]!.opts.findIndex((o) => o.label.startsWith('Want a belay?'));
    expect(opt).toBeGreaterThan(-1);
    const r = act(s, { t: 'say', talk: 'hazel-crag', node, opt });
    expect(r.events).toContainEqual({ k: 'belay', who: 'hazel' });
    expect(r.state.min).toBe(s.min);
  });
});

describe('Phase 42: what they say', () => {
  it('holds no number, straight quote or doubled space, and a clean line names the line and the beta', () => {
    for (const says of [...Object.values(BELAY_SAYS), BELAY_ANY])
      for (const [k, t] of Object.entries(says)) {
        expect(t).not.toMatch(/\d|'|"| {2}/);
        if (k === 'clean') expect(t).toMatch(/\{line\}.*\{beta\}/);
      }
  });
});

describe('Phase 42: their favour', () => {
  // A day this window Hazel asks for a belay, and a minute she's at the Lot to ask it.
  const asked = (who: string) => {
    for (let d = 30; d < 400; d++) {
      const s = at({ day: d, at: 'lot', people: { [who]: pal(6) }, crewName: { name: 'Rats', day: 3 } });
      if (favourAsk(s, who) !== 'belay') continue;
      for (let min = 7 * 60; min < 23 * 60; min += 10) {
        const t = { ...s, min, at: whereNow({ ...s, min }, who) ?? 'lot' };
        if (
          talkStart(t, who === 'hazel' ? (t.at === 'road' ? 'hazel-crag' : 'hazel-lot') : who) ===
          'crew-favour-belay'
        )
          return t;
      }
    }
    throw new Error(`no belay asked by ${who}`);
  };

  it('puts the rope in your hands on a yes, and the yes paid for it', () => {
    const t = asked('hazel');
    const talk = t.at === 'road' ? 'hazel-crag' : 'hazel-lot';
    const r = act(t, { t: 'say', talk, node: 'crew-favour-belay', opt: 0 });
    expect(r.events).toContainEqual({ k: 'belay', who: 'hazel', favour: true });
    const held = act(r.state, { t: 'belay', who: 'hazel', result: CLEAN, favour: true });
    expect(refusal(held)).toBeUndefined();
    expect(held.state.min).toBe(r.state.min);
    expect(held.state.people.hazel!.last).toBe(t.day);
    // Without the yes, there's no favour to belay.
    expect(refusal(act(t, { t: 'belay', who: 'hazel', result: CLEAN, favour: true }))).toBe(
      'Nobody asked you for a belay.',
    );
  });

  it('leaves a boulderer’s ask a spot', () => {
    const t = asked('rico');
    const r = act(t, { t: 'say', talk: 'rico', node: 'crew-favour-belay', opt: 0 });
    expect(r.events.some((e) => e.k === 'belay')).toBe(false);
  });
});
