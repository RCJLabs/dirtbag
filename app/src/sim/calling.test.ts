// Phase 23.3: callings. Offered once you've sent enough to know, taken up for good, and
// each rung of its ambition counted from the day you took it, paying psyche once.
import { describe, expect, it } from 'vitest';
import { injuryChance } from './body';
import { betaScale } from './climb';
import { ambitionText, callingDue, callingTerms, newRungs, rungMet, rungText } from './calling';
import { CALLINGS, OPEN_CALLINGS } from './content/callings';
import { indoor } from './content/gym';
import { ROUTES } from './content/routes';
import { CALLING, LIFESTYLE, LOAD } from './dials';
import { act, newGame } from './game';
import { gainMult, livingMult } from './identity';
import type { GameState, SendStyle } from './types';

const made = () => act(newGame('calls'), { t: 'create', name: 'Lou', start: 'allrounder' }).state;
const outside = Object.values(ROUTES).filter((r) => !indoor(r.place) && !r.exped);
const log = (day: number, style: SendStyle = 'redpoint') => ({
  known: [],
  told: [],
  pick: {},
  falls: {},
  goes: 2,
  goesToday: 0,
  hi: 0,
  sent: { day, go: 2, style },
  sentToday: false,
});
// A climber with these outdoor lines sent, on `day`.
const sent = (s: GameState, ids: string[], day = s.day, style?: SendStyle): GameState => ({
  ...s,
  routes: { ...s.routes, ...Object.fromEntries(ids.map((id) => [id, log(day, style)])) },
});
const taking = (s: GameState, id: string, since = s.day): GameState => ({
  ...s,
  calling: { id, since, rungs: [], offered: true },
});
const at = (g: number, n = 1) =>
  outside
    .filter((r) => r.grade === g)
    .slice(0, n)
    .map((r) => r.id);

describe('callings', () => {
  it('offer four, the Influencer with the followers (Phase 18.5); each a perk said from its numbers', () => {
    expect(OPEN_CALLINGS).toEqual(['purist', 'sendorbust', 'lifer', 'influencer']);
    for (const id of OPEN_CALLINGS) {
      const c = CALLINGS[id]!;
      expect(c.rungs).toHaveLength(3);
      expect(c.said).toHaveLength(3);
      expect(callingTerms(c).perks.length, id).toBeGreaterThan(0);
    }
    expect(callingTerms(CALLINGS.purist!).perks).toEqual(['You learn 15% more climbing outside.']);
    expect(callingTerms(CALLINGS.sendorbust!).costs).toEqual(['You’re 10% more likely to get hurt.']);
    expect(ambitionText(CALLINGS.purist!)).toBe('Send a V8, V11, then V14 outside');
    expect(rungText(CALLINGS.lifer!.rungs[0]!)).toBe(
      `Consolidate 5 grades (${CALLING.consolidate} lines sent at each)`,
    );
    expect(ambitionText(CALLINGS.influencer!)).toBe('Reach 2,000, 15,000, then 60,000 followers');
    expect(callingTerms(CALLINGS.influencer!).perks).toEqual(['Posts bring 25% more followers.']);
  });

  it('are asked about once, after enough sends, and wait after that', () => {
    const s = made();
    expect(callingDue(s)).toBe(false);
    const ready = sent(
      s,
      outside.slice(0, CALLING.offerAt).map((r) => r.id),
    );
    expect(callingDue(ready)).toBe(true);
    const r = act({ ...ready, at: 'lot', min: 9 * 60 }, { t: 'act', act: 'lot.rest' });
    expect(r.events.filter((e) => e.k === 'calling')).toHaveLength(1);
    expect(r.state.calling.offered).toBe(true);
    const again = act({ ...r.state, min: 9 * 60 }, { t: 'act', act: 'lot.rest' });
    expect(again.events.some((e) => e.k === 'calling')).toBe(false);
  });

  it('are taken up for good, and only an open one', () => {
    const s = made();
    expect(act(s, { t: 'calling', id: 'nobody' }).events[0]?.k).toBe('refused');
    const r = act(s, { t: 'calling', id: 'lifer' });
    expect(r.state.calling).toEqual({ id: 'lifer', since: s.day, rungs: [], offered: true });
    expect(act(r.state, { t: 'calling', id: 'purist' }).events[0]?.k).toBe('refused');
  });

  it('count only sends since you took it up', () => {
    const s = sent(made(), at(8), 1);
    expect(rungMet(taking(s, 'purist', 1), CALLINGS.purist!.rungs[0]!)).toBe(true);
    expect(rungMet(taking({ ...s, day: 3 }, 'purist', 2), CALLINGS.purist!.rungs[0]!)).toBe(false);
  });

  it('need a first-go send outside for Send-or-Bust, and grades held for the Lifer', () => {
    const c = CALLINGS.sendorbust!;
    expect(rungMet(taking(sent(made(), at(6)), 'sendorbust'), c.rungs[0]!)).toBe(false);
    expect(rungMet(taking(sent(made(), at(6), 1, 'flash'), 'sendorbust'), c.rungs[0]!)).toBe(true);
    const L = CALLINGS.lifer!;
    const four = [4, 5, 6, 7].flatMap((g) => at(g, CALLING.consolidate));
    expect(rungMet(taking(sent(made(), four), 'lifer'), L.rungs[0]!)).toBe(false);
    const five = [...four, ...at(8, CALLING.consolidate)];
    expect(rungMet(taking(sent(made(), five), 'lifer'), L.rungs[0]!)).toBe(true);
  });

  it('pay a rung once, in order, with its psyche and a note', () => {
    const s = { ...taking(sent(made(), [...at(8), ...at(11)]), 'purist'), at: 'lot', min: 9 * 60 };
    expect(newRungs(s)).toEqual([0, 1]);
    const r = act(s, { t: 'act', act: 'lot.rest' });
    expect(r.state.calling.rungs).toEqual([s.day, s.day]);
    expect(r.state.psyche.level).toBe(
      Math.min(100, s.psyche.level + CALLING.psyche[0]! + CALLING.psyche[1]!),
    );
    expect(newRungs(r.state)).toEqual([]);
  });

  it('move what they say: outdoor gains, first-go cruxes, nights and the odds of getting hurt', () => {
    const s = made();
    expect(gainMult(taking(s, 'purist'), 'head', 'out')).toBe(CALLINGS.purist!.fx.gainOut);
    expect(gainMult(taking(s, 'purist'), 'head', 'in')).toBe(1);
    expect(livingMult(taking(s, 'lifer'))).toBe(CALLINGS.lifer!.fx.living);
    expect(Math.round(LIFESTYLE.dirtbag.cost * livingMult(taking(s, 'lifer')))).toBeLessThanOrEqual(
      LIFESTYLE.dirtbag.cost,
    );
    const hot = { ...s, load: { acute: 60, chronic: 20, today: 0 } };
    const p = (x: GameState) => injuryChance(x, { type: 'technical' }, LOAD.perGo, false);
    expect(p(taking(hot, 'lifer'))).toBeCloseTo(p(hot) * CALLINGS.lifer!.fx.injury!, 10);
    const r = outside.find((x) => x.place === 'road')!;
    const b = Object.keys(r.beta)[0]!;
    const here = { ...s, at: r.place };
    expect(betaScale(taking(here, 'sendorbust'), r, b)).toBeCloseTo(
      betaScale(here, r, b) * CALLINGS.sendorbust!.fx.firstGo!,
      10,
    );
    // Not once you've had a go.
    const tried = sent(here, [], s.day);
    tried.routes[r.id] = { ...log(s.day), sent: null, goes: 1 };
    expect(betaScale(taking(tried, 'sendorbust'), r, b)).toBeCloseTo(betaScale(tried, r, b), 10);
  });
});
