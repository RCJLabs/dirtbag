// Phase 25.4: a young team's trip you pay for: only to an objective you've stood on top of,
// their odds from what you know of it and its weather; home the night your own trip would be,
// with a story, and the Record Book's entry if they top out.
import { describe, expect, it } from 'vitest';
import { EXPEDITIONS } from './content/expeditions';
import { TEAM } from './dials';
import { act, newGame } from './game';
import { aimEarned } from './record';
import { teamCost, teamHome, teamOdds } from './team';
import type { GameState, TripLog } from './types';

const trip = (id: string, end: TripLog['end']): TripLog => ({
  id,
  day: 50,
  end,
  high: end === 'summit' ? EXPEDITIONS[id]!.pitches : 2,
  partner: null,
  nights: 5,
  seen: [],
  told: true,
});
const base = (over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('team'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  return { ...s, day: 100, at: 'lot', min: 10 * 60, cash: 20000, book: [trip('elcap', 'summit')], ...over };
};
const refused = (r: ReturnType<typeof act>) => r.events[0]?.k === 'refused';
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const sleep = (s: GameState) => {
  let r = act({ ...s, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' });
  if (r.state.encounter) r = act(r.state, { t: 'answer', opt: 0 });
  return r;
};

describe('an expedition team', () => {
  it('goes only where you have stood on top, one team at a time, paid up front', () => {
    expect(refused(act(base(), { t: 'team', id: 'trango' }))).toBe(true);
    expect(refused(act(base({ cash: 100 }), { t: 'team', id: 'elcap' }))).toBe(true);
    const s = base();
    const r = act(s, { t: 'team', id: 'elcap' });
    expect(r.state.cash).toBe(s.cash - teamCost(s, 'elcap'));
    expect(r.state.team).toMatchObject({ id: 'elcap', left: 100 });
    expect(lines(r)[0]).toContain(EXPEDITIONS.elcap!.objective);
    expect(refused(act(r.state, { t: 'team', id: 'elcap' }))).toBe(true);
  });

  it('has odds from what you know of it, its weather, and who leads', () => {
    const once = teamOdds(base(), 'elcap');
    const twice = teamOdds(base({ book: [trip('elcap', 'summit'), trip('elcap', 'summit')] }), 'elcap');
    const thrice = teamOdds(base({ book: [0, 1, 2].map(() => trip('elcap', 'summit')) }), 'elcap');
    const tried = teamOdds(base({ book: [trip('elcap', 'bail'), trip('elcap', 'summit')] }), 'elcap');
    expect(twice).toBeGreaterThan(once);
    expect(thrice).toBe(twice);
    expect(tried).toBeGreaterThan(once);
    expect(tried).toBeLessThan(twice);
    // The further objectives' weather keeps a team's odds lower.
    const all = (id: string) => base({ book: [trip(id, 'summit')] });
    expect(teamOdds(all('cerrotorre'), 'cerrotorre')).toBeLessThan(once);
    expect(teamOdds(all('trango'), 'trango')).toBeLessThan(teamOdds(all('cerrotorre'), 'cerrotorre'));
    // The kid you coach leads it once they're good enough, and knows more.
    const kid = { name: 'Fen', level: TEAM.mentee, sessions: 40, since: 1, last: 99, told: [] };
    const led = base({ mentee: kid });
    expect(teamOdds(led, 'elcap')).toBeGreaterThan(once);
    const r = act(led, { t: 'team', id: 'elcap' });
    expect(r.state.team!.names[0]).toBe('Fen');
    expect(refused(act({ ...r.state, at: 'gym', today: ['pass'] }, { t: 'mentee', do: 'coach' }))).toBe(true);
    expect(teamOdds(base({ mentee: { ...kid, level: TEAM.mentee - 1 } }), 'elcap')).toBe(once);
  });

  it('comes home the night your own trip would, with a story and maybe a page in the book', () => {
    let summits = 0;
    for (let d = 100; d < 140; d++) {
      const s = act(base({ day: d, seed: `team-${d}` }), { t: 'team', id: 'elcap' }).state;
      const before = sleep({ ...s, day: s.team!.back - 1 });
      expect(before.state.team).not.toBeNull();
      const home = sleep({ ...s, day: s.team!.back });
      expect(home.state.team).toBeNull();
      const t = home.state.teams[0]!;
      expect(t).toEqual({ id: 'elcap', day: s.team!.back, ...teamHome(s) });
      expect(lines(home).some((l) => l.includes('are back from El Capitan'))).toBe(true);
      expect(aimEarned(home.state, { team: true })).toBe(t.summit);
      if (t.summit) {
        summits++;
        expect(home.state.scene.old).toBe(Math.min(100, s.scene.old + TEAM.old));
      } else expect(t.high).toBeLessThan(EXPEDITIONS.elcap!.pitches);
    }
    // About the odds they left with, over forty teams.
    const odds = teamOdds(base(), 'elcap');
    expect(summits / 40).toBeGreaterThan(odds - 0.2);
    expect(summits / 40).toBeLessThan(odds + 0.2);
  });
});
