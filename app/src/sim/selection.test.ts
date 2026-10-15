// Phase 33.4: selection (Evan's call). The Nationals podium makes the team, and only the team
// climbs the World Series till the next Nationals; the calendar puts Nationals first, clear
// of every other comp.
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { compOn, compSet, lastEdition, nextEdition, onTeam, rungOpen } from './comps';
import { COMP_TIERS, TEAM_SAYS } from './content/comps';
import { INDOOR } from './content/gym';
import { dayName, fill } from './format';
import { act, newGame } from './game';
import type { GameState } from './types';

const NAT = 2;
const WS = 3;
const N = COMP_TIERS[NAT]!.on;
const W = COMP_TIERS[WS]!.on;
const refused = (r: ReturnType<typeof act>) => r.events.find((e) => e.k === 'refused');
const lines = (r: ReturnType<typeof act>): string[] =>
  r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const k = needFor(16);
const base = (over: Partial<GameState> = {}): GameState => {
  const s = newGame('team');
  return {
    ...s,
    at: 'center',
    min: 9 * 60,
    cash: 2000,
    energy: 100,
    climber: {
      name: 'Kit',
      start: 'allrounder',
      skills: { power: k, fingers: k, endurance: k, technique: k, head: k },
    },
    comps: { ...s.comps, points: [{ day: N - 1, pts: 400 }] },
    ...over,
  };
};
const podium = (day: number, place: number) => ({ tier: NAT, day, place, of: COMP_TIERS[NAT]!.field });

describe('the calendar', () => {
  it('puts Nationals before the World Series, and no two comps on one day', () => {
    expect(N + (COMP_TIERS[NAT]!.rounds?.length ?? 0)).toBeLessThan(W);
    for (let day = 1; day <= 4 * 56; day++) {
      const busy = COMP_TIERS.flatMap((t, i) => {
        if (t.division) return [];
        const start = lastEdition(i, day);
        return start !== null && day - start <= (t.rounds?.length ?? 0) ? [t.name] : [];
      });
      expect(busy.length, `day ${day}: ${busy.join(', ')}`).toBeLessThanOrEqual(1);
    }
  });

  it('finds a comp’s editions either side of a day', () => {
    expect(lastEdition(NAT, N - 1)).toBeNull();
    expect(lastEdition(NAT, N + 5)).toBe(N);
    expect(nextEdition(WS, N + 1)).toBe(W);
    expect(nextEdition(WS, W)).toBe(W + COMP_TIERS[WS]!.every);
    expect(compOn(N, 'center')).toBe(NAT);
  });
});

describe('the national team', () => {
  it('is the World Series’ way in, not points', () => {
    const s = base({ day: W });
    expect(refused(act(s, { t: 'comp', do: 'enter' }))).toEqual({
      k: 'refused',
      why: `${fill(TEAM_SAYS.blocked, { name: COMP_TIERS[WS]!.name, from: COMP_TIERS[NAT]!.name })}.`,
    });
    // A podium at the last Nationals, and you're in, whatever your points.
    const team = { ...s, comps: { ...s.comps, points: [], results: [podium(N + 1, 3)] } };
    expect(onTeam(team, WS)).toBe(true);
    expect(refused(act(team, { t: 'comp', do: 'enter' }))).toBeUndefined();
    // Fourth isn't a podium.
    expect(onTeam({ ...s, comps: { ...s.comps, results: [podium(N + 1, 4)] } }, WS)).toBe(false);
    // Points don't open it on the ladder either.
    expect(rungOpen({ ...s, comps: { ...s.comps, points: [{ day: W, pts: 150 }] } })).toBe(NAT);
  });

  it('lasts till the next Nationals', () => {
    const s = base({ comps: { ...base().comps, results: [podium(N + 1, 1)] } });
    const every = COMP_TIERS[NAT]!.every;
    expect(onTeam(s, WS, W)).toBe(true);
    expect(onTeam(s, WS, W + every)).toBe(false);
    // Picked again at the next one.
    const again = { ...s, comps: { ...s.comps, results: [...s.comps.results, podium(N + every, 2)] } };
    expect(onTeam(again, WS, W + every)).toBe(true);
  });

  it('is made on the podium, and lost off it', () => {
    // Through to the final on the qualifier, then every final problem topped first go.
    const final = (s: GameState) => {
      const through = act(
        {
          ...act(s, { t: 'comp', do: 'enter' }).state,
          comps: {
            ...act(s, { t: 'comp', do: 'enter' }).state.comps,
            on: {
              tier: NAT,
              day: s.day,
              round: 0,
              tops: Object.fromEntries(compSet(s.seed, NAT, s.day).map((p) => [p.id, 1])),
            },
          },
        },
        { t: 'comp', do: 'finish' },
      ).state;
      return { ...through, day: s.day + 1, min: 18 * 60, today: [] };
    };
    const day = final(base({ day: N }));
    const won = act(
      {
        ...day,
        comps: {
          ...day.comps,
          on: {
            ...day.comps.on!,
            tops: Object.fromEntries(compSet(day.seed, NAT, N + 1).map((p) => [p.id, 1])),
          },
        },
      },
      { t: 'comp', do: 'finish' },
    );
    expect(lines(won)).toContain(
      fill(TEAM_SAYS.made, { name: COMP_TIERS[WS]!.name, when: `${dayName(W)}, day ${W}` }),
    );
    expect(onTeam(won.state, WS, W)).toBe(true);
    // At the next Nationals, a final not climbed: off the podium, off the team.
    const every = COMP_TIERS[NAT]!.every;
    const next = final({
      ...won.state,
      day: N + every,
      at: 'center',
      min: 9 * 60,
      comps: { ...won.state.comps, points: [{ day: N + every - 1, pts: 400 }] },
    });
    const lost = act(next, { t: 'comp', do: 'finish' });
    expect(lines(lost)).toContain(fill(TEAM_SAYS.dropped, { name: COMP_TIERS[WS]!.name }));
    expect(onTeam(lost.state, WS, W + every)).toBe(false);
  });
});

describe('a round’s morning', () => {
  it('has its wall’s pass in your pocket, as the entry did', () => {
    const s = base({ day: N });
    const through = act(
      {
        ...act(s, { t: 'comp', do: 'enter' }).state,
        comps: {
          ...act(s, { t: 'comp', do: 'enter' }).state.comps,
          on: {
            tier: NAT,
            day: N,
            round: 0,
            tops: Object.fromEntries(compSet(s.seed, NAT, N).map((p) => [p.id, 1])),
          },
        },
      },
      { t: 'comp', do: 'finish' },
    ).state;
    const night = act({ ...through, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' }).state;
    expect(night.day).toBe(N + 1);
    expect(night.today).toContain(INDOOR.center!.pass);
  });
});
