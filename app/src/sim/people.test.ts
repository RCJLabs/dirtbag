// Partners: bond tiers, presence that grows with them, days climbed together, Sage's arc,
// and asking her out to the Gorge.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { beatDue } from './cond';
import { TALK } from './content/people';
import { routesAt } from './content/gym';
import { ROUTES } from './content/routes';
import { ARC, BOND } from './dials';
import { act, goBlocked, newGame, talkStart } from './game';
import { tierOf, whereIs, whereNow } from './presence';
import type { Action, GameEvent, GameState, PersonLog } from './types';
import { conditionsAt, skyOn } from './weather';

const lines = (ev: GameEvent[]) => ev.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const grade = (g: number) => {
  const k = needFor(g);
  return {
    name: 'Robin',
    start: 'allrounder',
    skills: { power: k, fingers: k, endurance: k, technique: k, head: k },
  };
};
const withSage = (p: Partial<PersonLog>, over: Partial<GameState> = {}): GameState => ({
  ...newGame('people'),
  climber: grade(4),
  people: { sage: { bond: 0, last: 0, since: 2, ...p } },
  ...over,
});
function play(s: GameState, ...actions: Action[]) {
  const events: GameEvent[] = [];
  for (const a of actions) {
    const r = act(s, a);
    const no = r.events.find((e) => e.k === 'refused');
    if (no) throw new Error(`${JSON.stringify(a)} refused: ${no.k === 'refused' && no.why}`);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}
// The first day from `from` that Sage is at `place` at 10 AM, with this bond.
const sageDay = (place: string, p: Partial<PersonLog>, from = 3) => {
  for (let d = from; d < from + 200; d++)
    if (whereIs('people', 'sage', d, 10 * 60, { bond: 0, last: 0, ...p }) === place) return d;
  throw new Error(`no ${place} day`);
};
// Sage's talk, taking the given option at each node the conversation opens.
const say = (s: GameState, opt = 0) => {
  const node = talkStart(s, 'sage')!;
  return { node, ...play(s, { t: 'say', talk: 'sage', node, opt }) };
};

describe('bonds', () => {
  it('climb v0.956’s tiers', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 30].map(tierOf)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it('bring a partner round more often as they grow', () => {
    const seen = (bond: number) => {
      let n = 0;
      for (let d = 3; d < 403; d++) if (whereIs('people', 'sage', d, 10 * 60, { bond, last: 0 })) n++;
      return n / 400;
    };
    expect(seen(0)).toBeCloseTo(0.55, 1);
    expect(seen(7)).toBeCloseTo(0.55 + 4 * BOND.perTier, 1);
    // The same day's roll: a closer partner turns up on every day a stranger would.
    for (let d = 3; d < 60; d++)
      if (whereIs('people', 'sage', d, 10 * 60, { bond: 0, last: 0 }))
        expect(whereIs('people', 'sage', d, 10 * 60, { bond: 7, last: 0 })).not.toBeNull();
  });

  it('grow a day at a time when you climb where they are, once you’ve met', () => {
    const day = sageDay('gym', { bond: 0 });
    const gym = (people: GameState['people']): GameState => ({
      ...newGame('people'),
      climber: grade(4),
      day,
      at: 'gym',
      min: 10 * 60,
      today: ['pass'],
      people,
    });
    const id = routesAt('people', 'gym', day)[0]!.id;
    const met = play(gym({ sage: { bond: 2, last: 0, since: 1 } }), { t: 'go', route: id });
    expect(met.state.people.sage).toMatchObject({ bond: 3, last: day });
    expect(lines(met.events)).toContain('You and Sage are regulars.');
    // Once a day, however many goes.
    expect(play(met.state, { t: 'go', route: id }).state.people.sage?.bond).toBe(3);
    // Someone you haven't met is just someone else at the gym.
    expect(play(gym({}), { t: 'go', route: id }).state.people.sage).toBeUndefined();
  });
});

describe("Sage's arc", () => {
  it('waits for the bond, a day past meeting, and five days between beats', () => {
    const s = withSage({ bond: 1, since: 2 }, { day: 2 });
    expect(beatDue(s, 'sage/1')).toBe(false);
    expect(beatDue({ ...s, day: 3 }, 'sage/1')).toBe(true);
    expect(beatDue(withSage({ bond: 0 }, { day: 5 }), 'sage/1')).toBe(false);
    const after1 = withSage({ bond: 3, arc: 1, beatDay: 10 }, { day: 14 });
    expect(beatDue(after1, 'sage/2')).toBe(false);
    expect(beatDue({ ...after1, day: 10 + ARC.spacing }, 'sage/2')).toBe(true);
    expect(beatDue({ ...after1, day: 10 + ARC.spacing }, 'sage/3')).toBe(false);
  });

  it('plays v0.956’s four beats, and sends her guiding for a week', () => {
    // Beat one, at the gym on a day she's there.
    const d1 = sageDay('gym', { bond: 1 });
    const s1 = withSage({ bond: 1 }, { day: d1, at: 'gym', min: 10 * 60 });
    const b1 = say(s1);
    expect(b1.node).toBe('beat-1');
    expect(b1.state.climber.skills.technique).toBe(s1.climber.skills.technique + 2);
    expect(lines(b1.events)).toEqual(['Sage quietly fixes your footwork. +2 technique.']);
    expect(b1.state.people.sage).toMatchObject({ arc: 1, beatDay: d1 });

    // Beat two: she's off guiding, whichever way you send her.
    const d2 = sageDay('gym', { bond: 3 }, d1 + ARC.spacing);
    const s2 = {
      ...b1.state,
      day: d2,
      min: 10 * 60,
      people: { sage: { ...b1.state.people.sage!, bond: 3 } },
    };
    const b2 = say(s2, 1);
    expect(b2.node).toBe('beat-2');
    expect(lines(b2.events)).toEqual([
      `She squeezes your shoulder. "I'll be back before you know it." Sage is off guiding, back in ${ARC.sageAway} days. +2 head.`,
    ]);
    const away = b2.state.people.sage!;
    expect(away.away).toBe(d2 + ARC.sageAway);
    for (let d = d2 + 1; d < d2 + ARC.sageAway; d++)
      expect(whereIs('people', 'sage', d, 10 * 60, away)).toBeNull();
    const blessed = say(s2, 0);
    expect(blessed.state.people.sage?.bond).toBe(4);

    // Beat three, when she's back and you're close enough.
    const d3 = sageDay('gym', { bond: 5, away: away.away }, away.away!);
    const s3 = { ...b2.state, day: d3, min: 10 * 60, people: { sage: { ...away, bond: 5 } } };
    const b3 = say(s3);
    expect(b3.node).toBe('beat-3');
    expect(b3.state.climber.skills).toMatchObject({
      technique: s3.climber.skills.technique + 3,
      endurance: s3.climber.skills.endurance + 2,
    });

    // Beat four needs real rock.
    const d4 = sageDay('road', { bond: 7 }, d3 + ARC.spacing);
    const atGym = {
      ...b3.state,
      day: d4,
      min: 10 * 60,
      people: { sage: { ...b3.state.people.sage!, bond: 7 } },
    };
    expect(talkStart(atGym, 'sage')).not.toBe('beat-4');
    const s4 = { ...atGym, at: 'road' };
    const b4 = say(s4);
    expect(b4.node).toBe('beat-4');
    expect(b4.state.people.sage).toMatchObject({ arc: 4, bond: 7 });
    expect(b4.state.min).toBe(s4.min + 120);
    expect(lines(b4.events)).toEqual([
      'You and Sage top out the testpiece together. Partners for good. +6 technique.',
    ]);
    expect(talkStart({ ...b4.state, day: d4 + 30 }, 'sage')).not.toMatch(/^beat/);
  });

  it('keeps every beat’s text in the talk data', () => {
    for (let n = 1; n <= 4; n++) expect(TALK.sage!.nodes[`beat-${n}`]?.text.length).toBeGreaterThan(80);
  });
});

describe('asking Sage out to the Gorge', () => {
  const dry = (from: number) => {
    for (let d = from; ; d++) {
      const c = conditionsAt('people', d, 'gorge');
      if (c.open && !c.closed && whereIs('people', 'sage', d, 10 * 60, { bond: 3, last: 0 }) === 'gym')
        return d;
    }
  };

  it('takes a Regular, a V4, dry Gorge rock and a morning', () => {
    const d = dry(3);
    const s = withSage({ bond: 3 }, { day: d, at: 'gym', min: 10 * 60, today: ['sage'] });
    const opts = (x: GameState) =>
      TALK.sage!.nodes.again!.opts.filter(
        (o) =>
          !o.when ||
          act(x, { t: 'say', talk: 'sage', node: 'again', opt: TALK.sage!.nodes.again!.opts.indexOf(o) })
            .events[0]?.k !== 'refused',
      ).map((o) => o.label);
    expect(opts(s)).toContain('Come out to the Gorge?');
    expect(opts({ ...s, people: { sage: { ...s.people.sage!, bond: 2 } } })).not.toContain(
      'Come out to the Gorge?',
    );
    expect(opts({ ...s, climber: grade(3) })).not.toContain('Come out to the Gorge?');
    expect(opts({ ...s, min: BOND.inviteBefore })).not.toContain('Come out to the Gorge?');
    expect(skyOn('people', d)).not.toBe('rain');
  });

  it('puts her at the Gorge for the day, on belay', () => {
    const d = dry(3);
    const s = withSage({ bond: 3 }, { day: d, at: 'gym', min: 10 * 60, today: ['sage'] });
    const asked = play(s, { t: 'say', talk: 'sage', node: 'again', opt: 1 });
    expect(asked.state.people.sage?.invite).toEqual({ day: d, place: 'gorge', from: 10 * 60 });
    expect(whereNow(asked.state, 'sage')).toBe('gorge');
    expect(lines(asked.events)).toEqual(['Sage: "Meet you at the pullout. I\'ll bring the rope."']);
    const there = play(asked.state, { t: 'travel', to: 'gorge' }).state;
    expect(goBlocked(there, ROUTES.gintro!)).toBeNull();
    // And home in the evening, and not tomorrow.
    expect(whereNow({ ...there, min: 18 * 60 }, 'sage')).toBeNull();
    expect(whereIs('people', 'sage', d + 1, 10 * 60, there.people.sage)).not.toBe('gorge');
  });
});
