// R1's week, on the sim alone: a bot plays seven days start to finish, and the same seed and
// the same inputs give the same week.
import { describe, expect, it } from 'vitest';
import { humanHands, playWeek } from './bot';
import { gradeOf, STARTS } from './climber';
import { act, newGame } from './game';
import { Rng } from './rng';

describe('a week', () => {
  it('plays seven days: work, climb, eat, sleep, pay the bills, and nothing refused', () => {
    const run = playWeek('week-1');
    expect(run.refused).toEqual([]);
    expect(run.state.day).toBe(8);
    expect(run.sends.length).toBeGreaterThan(0);
    // Climbing moves you: a week of it leaves you stronger than you started.
    expect(gradeOf(run.state.climber.skills)).toBeGreaterThan(0);
    // The bills landed on the seventh night.
    expect(run.state.log.some((l) => l.text.startsWith('Registration and insurance'))).toBe(true);
  });

  it('works for every start, on several seeds', () => {
    for (const start of Object.keys(STARTS))
      for (const seed of ['a', 'b', 'c']) {
        const run = playWeek(`${seed}-${start}`, { start });
        expect(run.refused, `${start} on ${seed}`).toEqual([]);
        expect(run.state.day).toBe(8);
      }
  });

  it('with human-ish hands: falls, learns from them, and still finishes the week', () => {
    let n = 0;
    const run = playWeek('week-h', {
      hands: () => humanHands(Rng.fromStream('week-h', 'session').derive(`go-${n++}`)),
    });
    expect(run.refused).toEqual([]);
    expect(run.state.day).toBe(8);
    const falls = Object.values(run.state.routes).flatMap((r) => Object.values(r.falls));
    expect(falls.length).toBeGreaterThan(0);
    expect(run.sends.length).toBeGreaterThan(0);
  });

  it('replays exactly: the same seed plays the same week, and its inputs rebuild it', () => {
    const a = playWeek('week-2');
    const b = playWeek('week-2');
    expect(b.actions).toEqual(a.actions);
    expect(b.state).toEqual(a.state);
    let s = newGame('week-2');
    for (const x of a.actions) s = act(s, x).state;
    expect(s).toEqual(a.state);
    // A different seed is a different week.
    expect(playWeek('week-3').state).not.toEqual(a.state);
  });
});
