// Act I: v0.956's first-season stages, in order, each said and rewarded, and the act's end.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { ACT_I, ACT_I_END } from './content/story';
import { act, emptyLog, newGame } from './game';
import { currentGoal, goalDesc, progress } from './story';
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
    expect(ACT_I.map(goalDesc)).toEqual([
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
    expect(currentGoal(r.state)).toBeNull();
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
