// R2's crags: the rest of Roadside, Granite Gorge's gate, closure and shade, sandbags, and
// first ascents.
import { describe, expect, it } from 'vitest';
import { betaScale } from './climb';
import { needFor } from './climber';
import { ROUTES } from './content/routes';
import { HIGHBALL } from './dials';
import { act, belayer, faSuggestions, goBlocked, landingChance, lineGrade, lineName, newGame } from './game';
import type { Action, GameEvent, GameState } from './types';
import { conditions, conditionsAt, skyOn } from './weather';

const lines = (ev: GameEvent[]) => ev.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const at = (grade: number, over: Partial<GameState> = {}): GameState => {
  const k = needFor(grade);
  return {
    ...newGame('crags'),
    climber: {
      name: 'Robin Vance',
      start: 'allrounder',
      skills: { power: k, fingers: k, endurance: k, technique: k, head: k },
    },
    today: ['warm'],
    cash: 100,
    ...over,
  };
};
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
const days = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('Granite Gorge', () => {
  it('opens to you at V4', () => {
    const r = act(at(3), { t: 'travel', to: 'gorge' });
    expect(r.events[0]).toEqual({
      k: 'refused',
      why: 'Granite Gorge: V5 and up. It’s no place to learn: come back when you’re climbing V4.',
    });
    const s = play(at(4), { t: 'travel', to: 'gorge' }).state;
    expect(s).toMatchObject({ at: 'gorge', cash: 100 - 22, min: newGame('x').min + 120 });
  });

  it('closes in spring for the raptors, whatever the weather', () => {
    const spring = days(29, 42).find((d) => skyOn('crags', d) !== 'rain')!;
    const s = at(5, { at: 'gorge', day: spring, min: 10 * 60 });
    expect(goBlocked(s, ROUTES.gslab!)).toBe('Closed for nesting raptors till summer');
    expect(goBlocked({ ...s, day: spring - 14, at: 'gorge' }, ROUTES.gslab!) ?? '').not.toMatch(/raptors/);
  });

  it('stays in the shade: no afternoon grease, and heat doesn’t hurt it', () => {
    const hot = days(2, 120).find((d) => skyOn('crags', d) === 'hot')!;
    expect(conditions('crags', hot).windows).toBeLessThan(1);
    expect(conditionsAt('crags', hot, 'gorge')).toMatchObject({ windows: 1, greaseFrom: 24 * 60 });
    const r = play(at(5, { at: 'gorge', min: 16 * 60 }), { t: 'go', route: 'gslab' });
    expect(lines(r.events).some((l) => l.startsWith("Sun's on"))).toBe(false);
  });

  it('keeps its sport routes for when someone comes to belay', () => {
    expect(goBlocked(at(5, { at: 'gorge', min: 10 * 60 }), ROUTES.gintro!)).toBe('Nobody here to belay you');
  });
});

describe('Moonstone Boulders', () => {
  const refused = (s: GameState, a: Action) => {
    const e = act(s, a).events.find((x) => x.k === 'refused');
    return e?.k === 'refused' ? e.why : null;
  };

  it('opens at V6, and only once you have paid for the haul, in cash', () => {
    expect(refused(at(5, { cash: 500 }), { t: 'unlock', place: 'moon' })).toMatch(/V6/);
    expect(refused(at(6, { cash: 500 }), { t: 'travel', to: 'moon' })).toMatch(/haven't paid for yet: \$400/);
    // The card doesn't count: it's cash in hand or nothing.
    expect(refused(at(6, { cash: 399 }), { t: 'unlock', place: 'moon' })).toMatch(/\$400, in hand/);
    const paid = play(at(6, { cash: 450 }), { t: 'unlock', place: 'moon' });
    expect(paid.state).toMatchObject({ cash: 50, unlocked: ['moon'] });
    expect(lines(paid.events)[0]).toMatch(/on your map for good/);
    expect(refused(paid.state, { t: 'unlock', place: 'moon' })).toMatch(/already yours/);
    expect(refused(at(6), { t: 'unlock', place: 'road' })).toMatch(/nothing to pay for/);
  });

  it('charges a permit every trip in, and won’t let the card pay it', () => {
    const s = at(6, { cash: 100, unlocked: ['moon'] });
    const r = play(s, { t: 'travel', to: 'moon' });
    expect(r.state.cash).toBe(100 - 30 - 20);
    expect(r.state.at).toBe('moon');
    expect(lines(r.events)).toContain("Permit, $20. The ranger doesn't look up.");
    // Back out and in again: another permit.
    const again = play(r.state, { t: 'travel', to: 'road' }, { t: 'travel', to: 'moon' });
    expect(again.state.cash).toBe(50 - 20 - 20 - 20);
    expect(refused(at(6, { cash: -1000, unlocked: ['moon'] }), { t: 'travel', to: 'moon' })).toMatch(
      /\$20 permit, and the card won't cover it/,
    );
  });

  it('bakes: every window a little tighter in the desert, and the sun crosses it', () => {
    const day = days(2, 60).find(
      (d) => conditions('crags', d).sky === 'fair' && !conditions('crags', d).seeping,
    )!;
    expect(conditionsAt('crags', day, 'moon').windows).toBeCloseTo(conditions('crags', day).windows * 0.92);
    const s = at(8, { at: 'moon', day, min: 10 * 60, unlocked: ['moon'] });
    expect(betaScale(s, ROUTES.megg!, 'A1')).toBeLessThan(
      betaScale({ ...s, at: 'road' }, { ...ROUTES.megg!, place: 'road' }, 'A1'),
    );
  });
});

describe('highballs [proposed]', () => {
  it('can land you badly off a fall: more from higher, less with the haul’s pads and a spotter', () => {
    const tall = ROUTES.marete!;
    const s = at(8, { at: 'moon', min: 10 * 60 });
    // A boulder that isn't a highball, and a fall from under the safe height, land fine.
    expect(landingChance(s, ROUTES.megg!, 5)).toBe(0);
    expect(landingChance(s, tall, 3)).toBe(0);
    const top = landingChance(s, tall, tall.moves);
    expect(top).toBeCloseTo(HIGHBALL.perFoot * (tall.heightFt - HIGHBALL.safeFt));
    expect(landingChance(s, tall, 6)).toBeLessThan(top);
    expect(landingChance({ ...s, unlocked: ['moon'] }, tall, tall.moves)).toBeCloseTo(top * HIGHBALL.pads);
    // Roadside's Highball Arête: Hazel's there in the morning to spot you, gone by evening.
    const hb = ROUTES.highball!;
    const morning = at(5, { at: 'road', day: 1, min: 9 * 60 });
    const evening = { ...morning, min: 17 * 60 };
    expect(belayer(morning)).toBe('hazel');
    expect(belayer(evening)).toBeNull();
    expect(landingChance(morning, hb, hb.moves)).toBeCloseTo(
      landingChance(evening, hb, hb.moves) * HIGHBALL.spotter,
    );
  });

  it('turns a bad landing into an ankle, worst from the top, and never on a send', () => {
    const tall = ROUTES.marete!;
    const fall = { sent: false, hi: tall.moves, fellAt: 'A', tried: ['A1'], skin: 0 };
    const kinds: string[] = [];
    for (const day of days(1, 80)) {
      if (!conditions('crags', day).open) continue;
      const s = at(8, { at: 'moon', day, min: 10 * 60 });
      const r = play(s, { t: 'go', route: 'marete' }, { t: 'done', route: 'marete', result: fall });
      for (const e of r.events) if (e.k === 'injured') kinds.push(e.kind);
      const sent = play(
        s,
        { t: 'go', route: 'marete' },
        { t: 'done', route: 'marete', result: { ...fall, sent: true } },
      );
      expect(sent.events.some((e) => e.k === 'injured')).toBe(false);
    }
    // A fall from 22 ft is 14 over the safe height: a broken ankle, about one fall in six.
    expect(kinds.length).toBeGreaterThan(3);
    expect(new Set(kinds)).toEqual(new Set(['broken ankle']));
  });
});

describe('sandbags', () => {
  it('climb at their true grade, and show it on your first go', () => {
    const s = at(5, { at: 'gorge', min: 10 * 60 });
    const dyno = ROUTES.gdyno!;
    expect(dyno.trueGrade).toBe(8);
    const honest = { ...dyno, trueGrade: undefined };
    expect(betaScale(s, dyno, 'A1')).toBeLessThan(betaScale(s, honest, 'A1'));
    const first = play(s, { t: 'go', route: 'gdyno' });
    expect(lines(first.events)).toContain("That's no V7. Locals have been sandbagging it.");
    const second = play(first.state, { t: 'rest', route: 'gdyno' }, { t: 'go', route: 'gdyno' });
    expect(lines(second.events).some((l) => l.includes('sandbagging'))).toBe(false);
  });
});

describe('first ascents', () => {
  const sendOpen = (s: GameState) =>
    play(
      s,
      { t: 'go', route: 'rsopen' },
      { t: 'done', route: 'rsopen', result: { sent: true, hi: 6, fellAt: null, tried: ['A1'], skin: 0 } },
    );

  it('are yours to name when you send an open line first', () => {
    const s = at(7, { at: 'road', min: 10 * 60 });
    expect(lineName(s, ROUTES.rsopen!)).toBe('The open project');
    expect(lineGrade(s, ROUTES.rsopen!)).toBe('V7?');
    expect(act(s, { t: 'name', route: 'rsopen', name: 'Too Soon', call: 0 }).events[0]?.k).toBe('refused');
    const sent = sendOpen(s);
    expect(sent.events).toContainEqual({ k: 'fa', route: 'rsopen' });
    expect(act(sent.state, { t: 'name', route: 'rsopen', name: ' x ', call: 0 }).events[0]).toEqual({
      k: 'refused',
      why: 'Give it a name.',
    });
    const named = play(sent.state, { t: 'name', route: 'rsopen', name: '  Rent’s Due  ', call: 1 });
    expect(named.state.firsts.rsopen).toEqual({ name: 'Rent’s Due', call: 1, day: s.day });
    expect(lineName(named.state, ROUTES.rsopen!)).toBe('Rent’s Due');
    expect(lineGrade(named.state, ROUTES.rsopen!)).toBe('V8');
    expect(lines(named.events)).toEqual(['First ascent: Rent’s Due, called stout at V8. Let them find out.']);
    expect(act(named.state, { t: 'name', route: 'rsopen', name: 'Again', call: 0 }).events[0]?.k).toBe(
      'refused',
    );
  });

  it('come with names from your record', () => {
    const s = sendOpen(at(7, { at: 'road', min: 10 * 60 })).state;
    const names = faSuggestions(s, ROUTES.rsopen!);
    expect(names).toHaveLength(4);
    expect(names[0]).toBe('Robin’s Leap');
    expect(names[1]).toBe('First Try, Somehow');
    expect(names[2]).toBe('The Fall Project');
    expect(new Set(names).size).toBe(4);
  });

  it('only for open lines', () => {
    const s = play(
      at(4, { at: 'road', min: 10 * 60 }),
      { t: 'go', route: 'crimpfest' },
      { t: 'done', route: 'crimpfest', result: { sent: true, hi: 6, fellAt: null, tried: ['A1'], skin: 0 } },
    );
    expect(s.events.some((e) => e.k === 'fa')).toBe(false);
    expect(act(s.state, { t: 'name', route: 'crimpfest', name: 'Mine', call: 0 }).events[0]?.k).toBe(
      'refused',
    );
  });
});
