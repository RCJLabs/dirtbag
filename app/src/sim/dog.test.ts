// Scout: ten trips out and he picks you; then food, play, and every drive together.
import { describe, expect, it } from 'vitest';
import { dogOffered } from './cond';
import { DOG_LINES, DOG_OFFER } from './content/dog';
import { DOG } from './dials';
import { act, dogLine, dogTier, newGame } from './game';
import type { Action, GameEvent, GameState } from './types';
import { conditions } from './weather';

const lines = (ev: GameEvent[]) => ev.flatMap((e) => (e.k === 'line' ? [e.text] : []));
function play(s: GameState, ...actions: Action[]) {
  const events: GameEvent[] = [];
  for (const a of actions) {
    const r = act(s, a);
    const no = r.events.find((e) => e.k === 'refused');
    if (no) throw new Error(`${JSON.stringify(a)} refused: ${no.k === 'refused' && no.why}`);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}
const why = (s: GameState, a: Action) => {
  const e = act(s, a).events[0];
  return e?.k === 'refused' ? e.why : null;
};
const lot = (over: Partial<GameState> = {}): GameState => ({ ...newGame('dog'), cash: 300, ...over });
const withScout = (over: Partial<GameState> = {}) =>
  lot({ trips: DOG.offerTrips, dog: { name: 'Scout', since: 1, fed: 50, bond: 0 }, ...over });

describe('Scout picks you', () => {
  it('after your tenth trip out to a crag, not before', () => {
    let s = lot({ trips: DOG.offerTrips - 1 });
    expect(dogOffered(s)).toBe(false);
    expect(why(s, { t: 'act', act: 'lot.adopt' })).not.toBeNull();
    // Town doesn't count.
    s = play(s, { t: 'travel', to: 'cafe' }).state;
    expect(s.trips).toBe(DOG.offerTrips - 1);
    const out = play(s, { t: 'travel', to: 'road' });
    expect(out.state.trips).toBe(DOG.offerTrips);
    expect(lines(out.events)).toContain(DOG_OFFER.first);
    expect(dogOffered(out.state)).toBe(true);
    const home = play(out.state, { t: 'travel', to: 'lot' }).state;
    const took = play(home, { t: 'act', act: 'lot.adopt' });
    expect(took.state.dog).toEqual({ name: 'Scout', since: home.day, fed: 60, bond: 0 });
    expect(lines(took.events)).toContain(DOG_OFFER.took);
    expect(dogOffered(took.state)).toBe(false);
  });
});

describe('looking after him', () => {
  it('kibble fills him for $6 and a little bond, when he needs it', () => {
    const s = withScout({ dog: { name: 'Scout', since: 1, fed: 20, bond: 5 } });
    const fed = play(s, { t: 'act', act: 'lot.kibble' });
    expect(fed.state.dog).toMatchObject({ fed: 100, bond: 5 + DOG.kibbleBond });
    expect(fed.state.cash).toBe(s.cash - DOG.kibble);
    expect(why(fed.state, { t: 'act', act: 'lot.kibble' })).toBe("He's good. He'd eat it anyway.");
  });

  it('play is an hour, once a day, and the biggest bond there is', () => {
    const s = withScout();
    const p = play(s, { t: 'act', act: 'lot.play' });
    expect(p.state.dog?.bond).toBe(DOG.playBond);
    expect(p.state.min).toBe(s.min + DOG.playMin);
    expect(DOG_LINES.play).toContain(lines(p.events)[0]);
    expect(why(p.state, { t: 'act', act: 'lot.play' })).toBe("He's had his game today. He disagrees.");
  });

  it('a night empties his bowl a bit, and says so when it’s empty', () => {
    const s = withScout({ min: 18 * 60, dog: { name: 'Scout', since: 1, fed: 40, bond: 0 } });
    const one = play(s, { t: 'act', act: 'lot.sleep' });
    expect(one.state.dog?.fed).toBe(40 - DOG.nightFed);
    expect(lines(one.events)).toContain("Scout's bowl is empty. He's been decent about it, which is worse.");
  });

  it('rides along: bond on every drive, and a line from the crag once a day', () => {
    let d = 2;
    while (!conditions('dog', d).open) d++;
    const s = withScout({ day: d, min: 9 * 60 });
    const out = play(s, { t: 'travel', to: 'road' });
    expect(out.state.dog?.bond).toBe(DOG.rideBond);
    const said = lines(out.events).filter((l) => l.startsWith('Scout'));
    expect(said).toEqual([dogLine(out.state, 'crag')]);
    const again = play(out.state, { t: 'travel', to: 'lot' }, { t: 'travel', to: 'road' });
    expect(again.state.dog?.bond).toBe(3 * DOG.rideBond);
    expect(lines(again.events).filter((l) => l.startsWith('Scout'))).toEqual([]);
  });

  it('says what he’s up to by how close you are, or how hungry he is', () => {
    expect([0, 29, 30, 69, 70, 100].map(dogTier)).toEqual([0, 0, 1, 1, 2, 2]);
    const hungry = withScout({ dog: { name: 'Scout', since: 1, fed: 10, bond: 80 } });
    expect(DOG_LINES.crag.hungry).toContain(dogLine(hungry, 'crag'));
    const close = withScout({ dog: { name: 'Scout', since: 1, fed: 90, bond: 80 } });
    expect(DOG_LINES.crag.tiers[2]).toContain(dogLine(close, 'crag'));
    expect(dogLine(lot(), 'crag')).toBeNull();
  });
});
