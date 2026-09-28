import { describe, expect, it } from 'vitest';
import { ACTS } from './content/places';
import { BODY, CLIMB, DAY, MONEY } from './dials';
import { act, goBlocked, LOG_MAX, newGame, talkStart } from './game';
import type { Action, GameEvent, GameState } from './types';

const lines = (ev: GameEvent[]) => ev.flatMap((e) => (e.k === 'line' ? [e.text] : []));

function play(s: GameState, ...actions: Action[]): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  for (const a of actions) {
    const r = act(s, a);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}

const at = (s: GameState, min: number): GameState => ({ ...s, min });

describe('the day', () => {
  it('starts scrappy: $41, a van, and Hazel at the fire', () => {
    const s = newGame('test');
    expect(s).toMatchObject({ day: 1, min: DAY.firstMin, cash: MONEY.start, at: 'lot', x: null });
    expect(talkStart(s, 'hazel-lot')).toBe('morning');
  });

  it('only moves the clock on actions', () => {
    const s = newGame('test');
    const stood = act(s, { t: 'stand', x: 512.4 }).state;
    expect(stood.min).toBe(s.min);
    expect(stood.x).toBe(512);
    const cooked = act(stood, { t: 'act', act: 'lot.cook' });
    expect(cooked.state.min).toBe(s.min + 20);
    expect(cooked.state.cash).toBe(s.cash - 2);
    expect(cooked.state.energy).toBe(s.energy + 15);
    expect(lines(cooked.events)).toEqual(['Ramen again. It works.']);
  });

  it('refuses what the rules forbid, with a reason and no change', () => {
    const late = at(newGame('test'), 15 * 60);
    const r = act(late, { t: 'act', act: 'diner.shift' });
    expect(r.state).toBe(late);
    expect(r.events).toEqual([{ k: 'refused', why: 'Shifts start by 2 PM.' }]);
    const tired = { ...newGame('test'), energy: 20 };
    expect(act(tired, { t: 'act', act: 'diner.shift' }).events[0]).toEqual({
      k: 'refused',
      why: "You're too tired to carry plates.",
    });
    const broke = { ...newGame('test'), cash: 5 };
    expect(act(broke, { t: 'act', act: 'diner.special' }).events[0]).toEqual({
      k: 'refused',
      why: "You're $4 short.",
    });
  });

  it('charges gas and time for a drive, and puts the debt on the card', () => {
    const s = { ...newGame('test'), cash: 5 };
    const r = act(s, { t: 'travel', to: 'road' });
    expect(r.state).toMatchObject({
      at: 'road',
      min: s.min + 60,
      cash: -7,
      energy: s.energy - BODY.driveEnergy,
    });
    expect(lines(r.events)).toEqual([
      "You're $7 in the hole. It goes on the card.",
      'Gas, $12. The van starts on the second try.',
    ]);
    expect(act(s, { t: 'travel', to: 'nowhere' }).events[0]?.k).toBe('refused');
  });

  it('sleeps only in the evening, and a night resets the day', () => {
    const s = newGame('test');
    expect(act(s, { t: 'act', act: 'lot.sleep' }).events[0]).toEqual({
      k: 'refused',
      why: "Not yet. The day's still going.",
    });
    const evening = play(
      at(s, DAY.bedFrom),
      { t: 'say', talk: 'hazel-lot', node: 'morning', opt: 1 }, // coffee: sets a daily flag
    ).state;
    expect(evening.today).toContain('coffee');
    const slept = act({ ...evening, energy: 90, cash: 10 }, { t: 'act', act: 'lot.sleep' });
    expect(slept.state).toMatchObject({
      day: 2,
      min: DAY.wakeMin,
      energy: 100,
      cash: 10 - MONEY.vanSpot,
      today: [],
    });
    expect(lines(slept.events)).toEqual([`Van spot, $${MONEY.vanSpot}. You're $8 in the hole.`]);
  });

  it('works a shift for the money the card says', () => {
    const r = act(newGame('test'), { t: 'act', act: 'diner.shift' });
    const cost = ACTS['diner.shift']!.cost;
    expect(r.state.cash).toBe(MONEY.start + cost.cash!);
    expect(r.state.min).toBe(DAY.firstMin + cost.min!);
  });

  it('keeps the message log to its cap', () => {
    let s = newGame('test');
    for (let i = 0; i < LOG_MAX + 20; i++)
      s = act({ ...s, cash: 100, energy: 50 }, { t: 'act', act: 'lot.cook' }).state;
    expect(s.log).toHaveLength(LOG_MAX);
  });
});

describe('beta', () => {
  it('Hazel tells you the heel hook, and you can pick it', () => {
    const s = newGame('test');
    expect(act(s, { t: 'pick', route: 'pump', crux: 'B', beta: 'B2' }).events[0]?.k).toBe('refused');
    const told = act(s, { t: 'say', talk: 'hazel-lot', node: 'morning', opt: 0 });
    expect(told.events).toContainEqual({ k: 'learned', route: 'pump', beta: 'B2', how: 'told', text: '' });
    expect(told.events).toContainEqual({ k: 'talk', node: 'roof' });
    expect(told.state.routes.pump?.told).toEqual(['B2']);
    const picked = act(told.state, { t: 'pick', route: 'pump', crux: 'B', beta: 'B2' });
    expect(picked.state.routes.pump?.pick.B).toBe('B2');
    expect(talkStart(told.state, 'hazel-lot')).toBe('known');
  });

  it('a fall at the crimp rail shows you the rock-over; the roof takes two', () => {
    let s = newGame('test');
    s = act(s, { t: 'go', route: 'pump' }).state;
    const a = act(s, { t: 'done', route: 'pump', result: { sent: false, hi: 5, fellAt: 'A', skin: 4 } });
    expect(a.events).toContainEqual(expect.objectContaining({ k: 'learned', beta: 'A2', how: 'fall' }));
    expect(a.state.skin).toBe(s.skin - 4);
    expect(a.state.routes.pump?.hi).toBe(5);
    const b1 = act(a.state, {
      t: 'done',
      route: 'pump',
      result: { sent: false, hi: 14, fellAt: 'B', skin: 0 },
    });
    expect(b1.events.some((e) => e.k === 'learned')).toBe(false);
    const b2 = act(b1.state, {
      t: 'done',
      route: 'pump',
      result: { sent: false, hi: 14, fellAt: 'B', skin: 0 },
    });
    expect(b2.events).toContainEqual(expect.objectContaining({ k: 'learned', beta: 'B2', how: 'fall' }));
    expect(b2.state.routes.pump?.told).toEqual([]);
  });
});

describe('goes and sends', () => {
  it('a go costs what the button says, and the wall closes at dark', () => {
    const s = newGame('test');
    const r = act(s, { t: 'go', route: 'pump' });
    expect(r.state).toMatchObject({
      min: s.min + CLIMB.goMin,
      energy: s.energy - CLIMB.goEnergy,
      skin: s.skin - CLIMB.goSkin,
    });
    expect(r.state.routes.pump).toMatchObject({ goes: 1, goesToday: 1 });
    expect(goBlocked(at(s, CLIMB.darkFrom))).toBe('Too dark to climb');
    expect(act(at(s, CLIMB.darkFrom), { t: 'go', route: 'pump' }).events[0]).toEqual({
      k: 'refused',
      why: 'Too dark to climb.',
    });
    expect(act(s, { t: 'go', route: 'warmup' }).events[0]?.k).toBe('refused');
  });

  it('first go: onsight, or flash if you were told; later goes: redpoint', () => {
    const sent = { sent: true, hi: 24, fellAt: null, skin: 0 } as const;
    const onsight = play(
      newGame('t'),
      { t: 'go', route: 'pump' },
      { t: 'done', route: 'pump', result: sent },
    );
    expect(onsight.events).toContainEqual({ k: 'sent', route: 'pump', style: 'onsight', go: 1 });
    const flash = play(
      newGame('t'),
      { t: 'say', talk: 'hazel-lot', node: 'morning', opt: 0 },
      { t: 'go', route: 'pump' },
      { t: 'done', route: 'pump', result: sent },
    );
    expect(flash.events).toContainEqual({ k: 'sent', route: 'pump', style: 'flash', go: 1 });
    const red = play(
      newGame('t'),
      { t: 'go', route: 'pump' },
      { t: 'done', route: 'pump', result: { sent: false, hi: 5, fellAt: 'A', skin: 0 } },
      { t: 'rest', route: 'pump' },
      { t: 'go', route: 'pump' },
      { t: 'done', route: 'pump', result: sent },
    );
    expect(red.events).toContainEqual({ k: 'sent', route: 'pump', style: 'redpoint', go: 2 });
    expect(red.state.routes.pump?.sent).toMatchObject({ day: 1, go: 2, style: 'redpoint' });
    expect(talkStart(red.state, 'hazel-crag')).toBe('sent');
  });

  it('warns about the sun once a day, when a go starts after 2 PM', () => {
    const s = at(newGame('t'), CLIMB.greaseFrom);
    const r = play(s, { t: 'go', route: 'pump' }, { t: 'go', route: 'pump' });
    expect(lines(r.events).filter((l) => l.startsWith("Sun's on the wall"))).toHaveLength(1);
  });
});
