// The story (Phase 16.2): Act I, v0.956's first-season stages, in order, each said and
// rewarded, and the act's end; then Acts II to V, on the crags, walls, trips and myths.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { ACT_I, ACT_I_END, STORY } from './content/story';
import { EXPEDITIONS } from './content/expeditions';
import { PLACES } from './content/places';
import { ROUTES, WALLS } from './content/routes';
import { AGE } from './dials';
import { dayAtAge, daysLeft, retireBlocked } from './age';
import { act, emptyLog, newGame } from './game';
import { actOf, currentGoal, goalDesc, LADDER, progress, stageOf, theLine } from './story';
import type { GameEvent, GameState, RouteLog } from './types';

const lines = (ev: GameEvent[]) => ev.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const sent = (): RouteLog => ({ ...emptyLog(), goes: 1, sent: { day: 1, go: 1, style: 'onsight' } });
const made = (over: Partial<GameState> = {}): GameState => ({
  ...newGame('story'),
  climber: {
    name: 'Robin',
    start: 'allrounder',
    skills: { power: 10, fingers: 10, endurance: 10, technique: 10, head: 10 },
  },
  ...over,
});
// Any action that changes nothing much: stand still.
const tick = (s: GameState) => act(s, { t: 'stand', x: 300 });

describe('Act I', () => {
  it('asks in its own numbers', () => {
    expect(ACT_I.map((g) => goalDesc(g))).toEqual([
      'Have $60 in hand',
      'Send 3 lines anywhere',
      'Send 2 lines outside',
      'Be regulars with someone',
      'Climb V4',
    ]);
  });

  it('takes its stages in order, and says each one', () => {
    // Three sends, but no money yet: nothing's done, the first stage comes first.
    const s = made({ cash: 30, routes: { warm: sent(), dyno: sent(), 'sc-1-1': sent() } });
    expect(tick(s).state.goals).toBe(0);
    expect(progress(s, ACT_I[1]!.aim)).toEqual({ have: 3, need: 3 });
    expect(progress(s, ACT_I[2]!.aim)).toEqual({ have: 2, need: 2 });
    // Money in hand: the first three go at once, in order, and the fourth waits.
    const r = tick({ ...s, cash: 60 });
    expect(r.state.goals).toBe(3);
    expect(r.events.filter((e) => e.k === 'goal').map((e) => e.k === 'goal' && e.id)).toEqual([
      'settle',
      'climb',
      'outside',
    ]);
    // The week's board (Phase 23.6) may pay for the same sends; it isn't Act I's to say.
    expect(lines(r.events).filter((l) => !l.includes('off the board'))).toEqual([
      ACT_I[0]!.done,
      `${ACT_I[1]!.done} +1 technique.`,
      ACT_I[2]!.done,
    ]);
    expect(r.state.climber.skills.technique).toBe(11);
    expect(currentGoal(r.state)?.id).toBe('face');
  });

  it('ends with v0.956’s words, its $40, and the act’s card', () => {
    const k = needFor(4);
    const s = made({
      goals: 3,
      people: { sage: { bond: 3, last: 1, since: 1 } },
      climber: {
        name: 'Robin',
        start: 'allrounder',
        skills: { power: k, fingers: k, endurance: k, technique: k, head: k },
      },
      cash: 10,
    });
    const r = tick(s);
    expect(r.state.goals).toBe(ACT_I.length);
    // On into Act II.
    expect(currentGoal(r.state)?.id).toBe('trust');
    expect(actOf(r.state)).toBe(2);
    expect(r.state.cash).toBe(10 + ACT_I_END.cash);
    expect(r.state.climber.skills.head).toBe(k + 2);
    expect(r.events).toContainEqual({ k: 'act', n: 1 });
    expect(lines(r.events)).toContain(
      "First season done. There's $40 in the glovebox you'd forgotten about.",
    );
    expect(r.state.log.map((l) => l.text)).toContain(ACT_I_END.text);
    // Done is done.
    expect(tick(r.state).events.some((e) => e.k === 'goal' || e.k === 'act')).toBe(false);
  });

  it('waits until there is someone to play it', () => {
    const r = act({ ...newGame('story'), cash: 100 }, { t: 'stand', x: 10 });
    expect(r.state.goals).toBe(0);
  });
});

const at = (id: string, day = 1): RouteLog => ({
  ...emptyLog(),
  goes: 1,
  sent: { day, go: 1, style: 'redpoint' },
});
const first = (n: number) => LADDER.findIndex((e) => e.act === n);

describe('Acts II to V', () => {
  it('are five acts, each at a fixed count, each asking for things that exist', () => {
    expect(STORY.map((a) => a.goals.length)).toEqual([5, 5, 5, 5, 4]);
    for (const { goal } of LADDER) {
      const a = goal.aim;
      if ('at' in a) expect(PLACES[a.at]?.crag).toBe(true);
      if ('wall' in a) expect(WALLS[a.wall]).toBeDefined();
      if ('summit' in a) expect(EXPEDITIONS[a.summit]).toBeDefined();
      expect(goalDesc(goal)).not.toMatch(/\{/);
    }
    expect(new Set(LADDER.map((e) => e.goal.id)).size).toBe(LADDER.length);
  });

  it('asks in their own numbers', () => {
    expect(STORY[1]!.goals.map((g) => goalDesc(g))).toEqual([
      'Send 3 lines outside at V4 or harder',
      'Send a line at Granite Gorge',
      'Send 2 lines outside at V6 or harder',
      'Send a line at Moonstone Boulders',
      'Send a line outside at V7 or harder',
    ]);
  });

  it('counts sends outside at a grade, and a crag, from what you sent', () => {
    const gorge = Object.values(ROUTES).filter(
      (r) => r.place === 'gorge' && r.grade >= 4 && !r.wall && !r.open,
    );
    const s = made({ goals: first(2), routes: { [gorge[0]!.id]: at(gorge[0]!.id) } });
    expect(progress(s, { outside: 3, grade: 4 })).toEqual({ have: 1, need: 3 });
    expect(progress(s, { at: 'gorge' })).toEqual({ have: 1, need: 1 });
    expect(progress(s, { at: 'gorge', grade: 15 })).toEqual({ have: 0, need: 1 });
    expect(stageOf(s)).toEqual({ n: 1, of: 5 });
  });

  it('knows a wall topped, a summit, a myth you can read and one you put up', () => {
    const w = WALLS.obsidian!;
    expect(progress(made(), { wall: 'obsidian' }).have).toBe(0);
    expect(progress(made({ routes: { [w.pitches.at(-1)!]: at('x') } }), { wall: 'obsidian' }).have).toBe(1);
    const trip = {
      id: 'elcap',
      day: 30,
      end: 'summit' as const,
      high: 0,
      partner: null,
      nights: 4,
      seen: [],
      told: true,
    };
    expect(progress(made({ book: [trip] }), { summit: 'elcap' }).have).toBe(1);
    expect(progress(made({ book: [{ ...trip, end: 'bail' as never }] }), { summit: 'elcap' }).have).toBe(0);
    const myth = ROUTES.cmyth!;
    expect(progress(made({ routes: { [myth.hiddenUntil!]: at('x') } }), { reveal: true }).have).toBe(1);
    const mine = made({ firsts: { cmyth: { name: 'The Long Dark', call: 0, day: 400 } } });
    expect(progress(mine, { myth: true }).have).toBe(1);
    const his = made({ firsts: { cmyth: { name: 'Dex Was Here', call: 0, day: 400, by: 'dex' } } });
    expect(progress(his, { myth: true }).have).toBe(0);
  });

  it('ends each act with its scene, its pay and its card, and goes on to the next', () => {
    const last = first(3) - 1;
    const moon = Object.values(ROUTES).find((r) => r.place === 'moon' && r.grade >= 7 && !r.open)!;
    const s = made({ goals: last, cash: 0, routes: { [moon.id]: at(moon.id) } });
    const r = tick(s);
    expect(r.state.goals).toBe(last + 1);
    expect(r.events).toContainEqual({ k: 'act', n: 2 });
    expect(r.state.cash).toBe(STORY[1]!.end.cash);
    expect(r.state.log.map((l) => l.text)).toContain(STORY[1]!.end.text);
    expect(actOf(r.state)).toBe(3);
    expect(currentGoal(r.state)?.id).toBe('stone');
  });

  it('on The Line, your body waits on you: no countdown, no forced end', () => {
    const base = made({ day: dayAtAge(made(), AGE.forced) - 1 });
    expect(daysLeft(base)).not.toBeNull();
    const line = { ...base, goals: first(5) };
    expect(daysLeft(line)).toBeNull();
    const r = act(
      { ...line, at: 'lot', min: 18 * 60, cash: 500, energy: 50, encounter: null },
      { t: 'act', act: 'lot.sleep' },
    );
    expect(r.state.day).toBe(line.day + 1);
    expect(r.state.life.retired).toBeNull();
  });
});

describe('The Line', () => {
  it('names the myth you put up, and after it hanging it up is yours at any age', () => {
    expect(theLine(made())).toBeNull();
    const s = made({ firsts: { cmyth: { name: 'The Long Dark', call: 0, day: 400 } } });
    expect(theLine(s)).toEqual({ name: 'The Long Dark', grade: 18, place: 'The Crucible' });
    // Young, mid-story: not yet. Young, with The Line done: yes.
    expect(retireBlocked({ ...s, goals: LADDER.length - 1 })).toMatch(/^Not before 30/);
    expect(retireBlocked({ ...s, goals: LADDER.length })).toBeNull();
  });

  it('ends the story with The Line’s own words, then nothing more to do', () => {
    const last = LADDER.length - 1;
    const s = made({ goals: last, cash: 0, firsts: { cmyth: { name: 'The Long Dark', call: 0, day: 400 } } });
    const r = tick(s);
    expect(r.events).toContainEqual({ k: 'act', n: STORY.length });
    expect(currentGoal(r.state)).toBeNull();
    expect(actOf(r.state)).toBe(STORY.length + 1);
  });
});
