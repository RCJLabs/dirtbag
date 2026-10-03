// Phase 18.7: the four ladders (criterion 1): each has at least five rungs, the last its
// capstone, and counts what you've climbed from the systems that own them.
import { describe, expect, it } from 'vitest';
import { JOBS } from './content/jobs';
import { COMP_TIERS } from './content/comps';
import { OWN_GYM } from './dials';
import { act, newGame } from './game';
import { capstone, ladderById, LADDERS } from './ladders';
import { LADDER } from './story';
import type { GameState } from './types';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('ladders'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  ...over,
});
const at = (s: GameState, id: Parameters<typeof ladderById>[0]) => ladderById(id).at(s);

describe('the ladders', () => {
  it('are four, each with five rungs or more, all unclimbed on day one', () => {
    const s = base();
    expect(LADDERS.map((l) => l.id)).toEqual(['outdoor', 'comp', 'media', 'business']);
    for (const l of LADDERS) {
      expect(l.rungs(s).length).toBeGreaterThanOrEqual(5);
      expect(l.at(s)).toBe(0);
      expect(capstone(s, l.id)).toBe(false);
    }
  });

  it('outdoors: an act a rung, The Line on top', () => {
    const s = base();
    expect(ladderById('outdoor').rungs(s).at(-1)).toBe('The Line');
    const actOne = LADDER.filter((r) => r.act === 1).length;
    expect(at({ ...s, goals: actOne }, 'outdoor')).toBe(1);
    expect(at({ ...s, goals: LADDER.length }, 'outdoor')).toBe(5);
    expect(capstone({ ...s, goals: LADDER.length }, 'outdoor')).toBe(true);
  });

  it('comps: a rung for each you’ve competed at, the Games on top', () => {
    const s = base();
    const games = COMP_TIERS.length - 1;
    const r = (tier: number, place: number) => ({ tier, day: 1, place, of: 20 });
    expect(ladderById('comp').rungs(s).at(-1)).toBe('The Games');
    expect(at({ ...s, comps: { ...s.comps, results: [r(0, 8), r(1, 5)] } }, 'comp')).toBe(2);
    expect(capstone({ ...s, comps: { ...s.comps, results: [r(games, 14)] } }, 'comp')).toBe(true);
  });

  it('media: known locally, each sponsor, the film', () => {
    const s = base();
    const m = (over: Partial<GameState['media']>) => ({ ...s, media: { ...s.media, ...over } });
    expect(at(m({ followers: 1200 }), 'media')).toBe(1);
    const sponsor = { tier: 2, terms: 'real' as const, due: 20, tasks: [], strikes: 0 };
    expect(at(m({ followers: 31000, sponsor }), 'media')).toBe(4);
    expect(capstone(m({ followers: 41000, sponsor, doc: { aired: 30 } }), 'media')).toBe(true);
  });

  it('work and business: setting’s ranks on the job, your gym, then a full one', () => {
    const s = base();
    expect(at({ ...s, jobs: { set: 1 } }, 'business')).toBe(1);
    const ranks = JOBS.set!.ranks.length;
    const gym = {
      since: 1,
      members: 90,
      quality: 0.5,
      till: 0,
      last: 0,
      setter: false,
      upgrades: [],
      peak: 90,
      set: 0,
    };
    expect(at({ ...s, gym }, 'business')).toBe(ranks + 1);
    expect(capstone({ ...s, gym: { ...gym, peak: OWN_GYM.members.top } }, 'business')).toBe(true);
  });
});
