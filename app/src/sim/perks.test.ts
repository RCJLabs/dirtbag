// Phase 34.1: rank perks on the jobs there are (Evan's call). From a rank up, a perk that matters
// to a climber; every perk's words formatted from its dial (Phase 34's criterion 2).
import { describe, expect, it } from 'vitest';
import { carePrice } from './clinic';
import { INDOOR } from './content/gym';
import { JOBS, PERK_SAYS } from './content/jobs';
import { ACTS } from './content/places';
import { CLINIC, PERKS } from './dials';
import { act, actCost, newGame } from './game';
import { hasJobPerk, jobPerks, offWords, perkPasses, perkSays, perksNote, type PerkId } from './perks';
import type { GameState } from './types';
import { gasFor } from './van';

const IDS = Object.keys(PERKS) as PerkId[];
// A climber at a job's rank: its shifts worked, and strong enough for any grade it asks.
const at = (job: string, rank: number, over: Partial<GameState> = {}): GameState => {
  const s = newGame('perks');
  return {
    ...s,
    day: 10,
    cash: 500,
    climber: {
      name: 'Kit',
      start: 'allrounder',
      skills: { power: 400, fingers: 400, endurance: 400, technique: 400, head: 400 },
    },
    jobs: { ...s.jobs, [job]: JOBS[job]!.at[rank]! },
    ...over,
  };
};
const cash = (s: GameState, id: string) => actCost(s, ACTS[id]!).cash ?? 0;

describe('every perk', () => {
  it('is said from its dial, with no number of its own', () => {
    for (const id of IDS) {
      expect(PERK_SAYS[id], id).toBeDefined();
      expect(PERK_SAYS[id], id).not.toMatch(/\d/);
      if (PERK_SAYS[id]!.includes('{off}')) expect(perkSays(id)).toContain(offWords(PERKS[id].off));
      expect(JOBS[PERKS[id].job]!.ranks[PERKS[id].from], id).toBeDefined();
    }
    expect(offWords(0.2)).toBe('20% off');
    expect(offWords(1)).toBe('on the house');
  });

  it('comes with its rank and goes on the job’s row', () => {
    const s = at('guide', PERKS.staff.from - 1);
    expect(hasJobPerk(s, 'staff')).toBe(false);
    expect(perksNote(s, 'guide')).toBe(`At ${JOBS.guide!.ranks[PERKS.staff.from]}, ${perkSays('staff')}`);
    const t = at('guide', PERKS.staff.from);
    expect(hasJobPerk(t, 'staff')).toBe(true);
    expect(perksNote(t, 'guide')).toBe(`Perks: ${perkSays('staff')}`);
    expect(jobPerks('set')).toEqual(['sendCity', 'everyGym']);
  });
});

describe('the perks', () => {
  it('let a setter climb free: Send City, then every gym, each morning', () => {
    expect(perkPasses(at('set', 0))).toEqual([]);
    expect(perkPasses(at('set', PERKS.sendCity.from))).toEqual([INDOOR.gym!.pass]);
    expect(perkPasses(at('set', PERKS.everyGym.from)).sort()).toEqual(
      Object.values(INDOOR)
        .map((i) => i.pass)
        .sort(),
    );
    const night = act(
      { ...at('set', PERKS.everyGym.from), at: 'lot', min: 22 * 60 },
      { t: 'act', act: 'lot.sleep' },
    );
    for (const i of Object.values(INDOOR)) expect(night.state.today).toContain(i.pass);
  });

  it('give a guide the gear shop’s staff price, and only there', () => {
    const off = at('guide', 0);
    const on = at('guide', PERKS.staff.from);
    expect(cash(on, 'shop.rope')).toBe(Math.round(cash(off, 'shop.rope') * (1 - PERKS.staff.off)));
    // Not the market's food, not Dale's garage.
    const food = Object.keys(ACTS).find((id) => id.startsWith('market.') && ACTS[id]!.buys)!;
    expect(cash(on, food)).toBe(cash(off, food));
    const garage = Object.keys(ACTS).find(
      (id) => id.startsWith('garage.') && ACTS[id]!.gear && (ACTS[id]!.cost.cash ?? 0) < 0,
    )!;
    expect(cash(on, garage)).toBe(cash(off, garage));
  });

  it('give the warehouse a fuel card', () => {
    expect(gasFor(at('warehouse', PERKS.fuel.from), 40)).toBe(Math.round(40 * (1 - PERKS.fuel.off)));
    expect(gasFor(at('warehouse', PERKS.fuel.from - 1), 40)).toBe(40);
  });

  it('give the Cave’s coaches its physio at a discount, and nothing else at the clinic', () => {
    const on = at('coach', PERKS.physio.from);
    const off = at('coach', 0);
    expect(carePrice(on, 'physio')).toBe(Math.round(carePrice(off, 'physio') * (1 - PERKS.physio.off)));
    expect(carePrice(on, 'cortisone')).toBe(carePrice(off, 'cortisone'));
    expect(CLINIC.physio.price).toBeGreaterThan(0);
  });

  it('give the café’s staff their coffee and the diner’s the special at the staff price', () => {
    expect(cash(at('cafe', PERKS.coffee.from), 'cafe.coffee')).toBe(0);
    expect(cash(at('cafe', 0), 'cafe.coffee')).toBe(ACTS['cafe.coffee']!.cost.cash);
    expect(cash(at('diner', PERKS.special.from), 'diner.meal')).toBe(
      Math.round(ACTS['diner.meal']!.cost.cash! * (1 - PERKS.special.off)),
    );
    // A free coffee is still a coffee.
    const r = act(
      { ...at('cafe', PERKS.coffee.from), at: 'cafe', min: 9 * 60 },
      { t: 'act', act: 'cafe.coffee' },
    );
    expect(r.events.some((e) => e.k === 'refused')).toBe(false);
    expect(r.state.cash).toBe(500);
  });
});
