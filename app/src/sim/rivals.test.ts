// Phase 33.3: the field that comes back (Evan's call: a roster per tier). From the Circuit up,
// each rung's fields carry its named rivals, each with a grade by year; some go up a rung;
// Skye is in the World Series and comes back for Nationals; fillers make up the numbers and
// are never named.
import { describe, expect, it } from 'vitest';
import { compField, fieldSays, isRival, rivalGrade, rivalsIn, rivalTier, type Score } from './comps';
import { COMP_TIERS, FIELD_SAYS, ROSTER } from './content/comps';
import { MEDIA_RIVAL } from './content/media';
import { RIVALS, YEAR } from './dials';
import { fill } from './format';
import { act, newGame } from './game';
import type { GameState } from './types';

const CIRCUIT = 1;
const NAT = 2;
const WS = 3;
const lines = (r: ReturnType<typeof act>): string[] =>
  r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const rival = (name: string) => ROSTER.find((v) => v.name === name)!;
const dayIn = (tier: number, year: number) => COMP_TIERS[tier]!.on + year * YEAR.days;

describe('the rosters', () => {
  it('put a rung’s rivals in its fields by name, and fillers make up the numbers', () => {
    for (const tier of [CIRCUIT, NAT, WS, 4]) {
      const day = dayIn(tier, 0);
      const field = compField('rivals', tier, day);
      expect(field).toHaveLength(COMP_TIERS[tier]!.field - 1);
      const names = field.map((f) => f.name);
      for (const v of rivalsIn('rivals', tier, 0)) expect(names).toContain(v.name);
      expect(names.filter(isRival)).toHaveLength(rivalsIn('rivals', tier, 0).length);
    }
    // League night's is the pool's, as it was.
    expect(compField('rivals', 0, 4).some((f) => isRival(f.name))).toBe(false);
  });

  it('have Skye at the World Series, and back for Nationals', () => {
    for (const tier of [NAT, WS])
      expect(rivalsIn('rivals', tier, 0).map((v) => v.name)).toContain(MEDIA_RIVAL.name);
    expect(rivalsIn('rivals', CIRCUIT, 0).map((v) => v.name)).not.toContain(MEDIA_RIVAL.name);
  });

  it('give each rival a grade by year: their trend while it runs, give or take the wobble', () => {
    const v = rival('Kai Mendez');
    for (let y = 0; y < 9; y++) {
      const g = rivalGrade('rivals', v, y);
      const trend = v.grade + v.trend * Math.min(y, RIVALS.years);
      expect(Math.abs(g - trend)).toBeLessThanOrEqual(RIVALS.wobble + 0.01);
    }
    // Seeded: the same career, the same grade; another, maybe not.
    expect(rivalGrade('rivals', v, 3)).toBe(rivalGrade('rivals', v, 3));
  });

  it('move a rival up a rung for good once they’re past the top of theirs, and out of the one below', () => {
    const v = rival('Nico Hale');
    const year = Array.from({ length: 6 }, (_, y) => y).find((y) => rivalTier('rivals', v, y) !== CIRCUIT)!;
    expect(year).toBeGreaterThan(0);
    expect(rivalGrade('rivals', v, year)).toBeGreaterThanOrEqual(COMP_TIERS[CIRCUIT]!.grades[1] + RIVALS.up);
    expect(rivalTier('rivals', v, year)).toBe(NAT);
    for (let y = year; y < 9; y++) expect(rivalTier('rivals', v, y)).not.toBe(CIRCUIT);
    const was = rivalsIn('rivals', CIRCUIT, year - 1).map((r) => r.name);
    const now = rivalsIn('rivals', NAT, year);
    expect(was).toContain(v.name);
    expect(rivalsIn('rivals', CIRCUIT, year).map((r) => r.name)).not.toContain(v.name);
    expect(now.find((r) => r.name === v.name)?.up).toBe(CIRCUIT);
    // Only the year they came up.
    expect(rivalsIn('rivals', NAT, year + 1).find((r) => r.name === v.name)?.up).toBeNull();
  });
});

describe('the field’s line', () => {
  const at = (name: string, tops: number, goes = tops): Score => ({ name, tops, goes });
  const field = [at('Juno Vale', 5), at(MEDIA_RIVAL.name, 6), at('Ines Duarte', 4), at('Theo Marsh', 2)];

  it('names who won it, and the rival a place ahead of you', () => {
    // Fourth, behind Skye, Juno (a filler) and Ines.
    expect(fieldSays(field, 4, true)).toBe(
      `${fill(FIELD_SAYS.won, { name: MEDIA_RIVAL.name })} ${fill(FIELD_SAYS.ahead, { name: 'Ines Duarte' })}`,
    );
    // Second: the rival ahead of you won it, said once.
    expect(fieldSays(field, 2, true)).toBe(fill(FIELD_SAYS.won, { name: MEDIA_RIVAL.name }));
  });

  it('never names a filler: a filler who wins is a stranger', () => {
    const f = [at('Juno Vale', 7), at('Ines Duarte', 4)];
    expect(fieldSays(f, 3, true)).toBe(
      `${FIELD_SAYS.stranger} ${fill(FIELD_SAYS.ahead, { name: 'Ines Duarte' })}`,
    );
    expect(fieldSays(f, 2, true)).toBe(FIELD_SAYS.stranger);
  });

  it('says who was second when you won, and out before the final, only who was ahead', () => {
    expect(fieldSays(field, 1, true)).toBe(fill(FIELD_SAYS.second, { name: MEDIA_RIVAL.name }));
    expect(fieldSays(field, 2, false)).toBe(fill(FIELD_SAYS.ahead, { name: MEDIA_RIVAL.name }));
    expect(fieldSays(field, 4, false)).toBe(fill(FIELD_SAYS.ahead, { name: 'Ines Duarte' }));
  });

  it('is said when a comp from the Circuit up is handed in', () => {
    const s0 = newGame('rivals');
    const s: GameState = {
      ...s0,
      day: dayIn(CIRCUIT, 0),
      at: 'cave',
      min: 9 * 60,
      cash: 500,
      climber: {
        name: 'Kit',
        start: 'allrounder',
        skills: { power: 40, fingers: 40, endurance: 40, technique: 40, head: 40 },
      },
      comps: { ...s0.comps, points: [{ day: dayIn(CIRCUIT, 0) - 1, pts: 100 }] },
    };
    const entered = act(s, { t: 'comp', do: 'enter' }).state;
    expect(entered.comps.on?.tier).toBe(CIRCUIT);
    const done = act(entered, { t: 'comp', do: 'finish' });
    const said = lines(done).at(-1)!;
    expect(
      said === FIELD_SAYS.stranger || said.includes(' won it.') || said.includes('one place ahead'),
    ).toBe(true);
  });
});
