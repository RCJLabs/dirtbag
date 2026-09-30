// The event deck (Phase 22.6): one seeded draw at a time, at most one encounter a day. 22.6a
// deals the knocks on the van at night, by where you're parked; 22.6b the hitchhikers and
// roadside stops on drives to and from the crags. The numbers are EVENTS
// (dials.ts); the knocks are content/knocks.ts.

import { KNOCKS, type Knock, type KnockFx } from './content/knocks';
import { PLACES } from './content/places';
import { EPICS, type Epic, type EpicEnd, type EpicKind } from './content/epics';
import { conditionsAt, seasonOf } from './weather';
import { HITCHERS, PASS_BY, STOPS, type Hitcher, type RoadFx, type RoadStop } from './content/road';
import { EVENTS } from './dials';
import { Rng } from './rng';
import type { GameState } from './types';

// Tonight's odds of a knock where the van's parked, or 0 when one's too recent, or there's
// been an encounter today already.
export function knockOdds(s: GameState, spot: GameState['spot']): number {
  if (s.day < EVENTS.from || s.deck.last === s.day) return 0;
  if (s.deck.knock && s.day - s.deck.knock < EVENTS.knock.every) return 0;
  return EVENTS.knock.odds * EVENTS.knock.spot[spot];
}

// Whether someone knocks tonight, and who: seeded by the night. The deck passes over the
// last few you've heard while the spot has others.
export function knockTonight(s: GameState, spot: GameState['spot']): Knock | null {
  const r = Rng.fromStream(s.seed, 'events').derive(`knock-${s.day}`);
  if (r.next() >= knockOdds(s, spot)) return null;
  const here = KNOCKS.filter((k) => k.spots.includes(spot));
  const recent = s.deck.seen.slice(-EVENTS.fresh);
  const fresh = here.filter((k) => !recent.includes(k.id));
  const pool = fresh.length ? fresh : here;
  return pool[r.int(0, pool.length - 1)] ?? null;
}

export const knockById = (id: string): Knock | undefined => KNOCKS.find((k) => k.id === id);

// A knock's psyche, on the rebuild's scale.
export const knockPsyche = (fx: KnockFx): number => Math.round((fx.psyche ?? 0) * EVENTS.psyche);

// ---- on the road (Phase 22.6b) ----

// A drive to or from a crag: where hitchhikers stand and the pull-offs are.
export const roadTrip = (from: string, to: string): boolean => !!PLACES[from]?.crag || !!PLACES[to]?.crag;

export const hitcherById = (id: string): Hitcher | undefined => HITCHERS.find((h) => h.id === id);
export const stopById = (id: string): RoadStop | undefined => STOPS.find((x) => x.id === id);

// What this drive brings, if anything: a hitchhiker, else a stop, seeded by the day and the
// minute you set off. Nothing on a day that's had its encounter, or too soon after the last.
export function driveEncounter(
  s: GameState,
  from: string,
  to: string,
): NonNullable<GameState['encounter']> | null {
  if (s.day < EVENTS.from || !roadTrip(from, to) || s.deck.last === s.day) return null;
  const r = Rng.fromStream(s.seed, 'events').derive(`drive-${s.day}-${s.min}`);
  const roll = r.next();
  const H = EVENTS.hitch;
  if (!(s.deck.hitch && s.day - s.deck.hitch < H.every) && roll < H.odds) {
    const w = HITCHERS.map((h) => (s.deck.met[h.id] !== undefined ? H.again : 1));
    let x = r.next() * w.reduce((a, b) => a + b, 0);
    const h = HITCHERS.find((_, i) => (x -= w[i]!) < 0) ?? HITCHERS[HITCHERS.length - 1]!;
    return { kind: 'hitch', id: h.id };
  }
  const S = EVENTS.stop;
  if (!(s.deck.stop && s.day - s.deck.stop < S.every) && roll >= H.odds && roll < H.odds + S.odds) {
    // A find you haven't seen first, while there are any.
    const fresh = STOPS.filter((x) => !s.deck.stops.includes(x.id));
    const pool = fresh.length ? fresh : STOPS;
    return { kind: 'stop', id: pool[r.int(0, pool.length - 1)]!.id };
  }
  return null;
}

// A hitchhiker's answers: the first time, theirs and driving past; after that, the second
// meeting's, less any that needs something you didn't do the first time.
export function hitchOpts(s: GameState, h: Hitcher): { label: string; out: string; fx: RoadFx }[] {
  const first = s.deck.met[h.id];
  if (first === undefined) return [...h.opts, { ...PASS_BY, fx: {} }];
  return h.again.opts.filter((o) => o.when === undefined || o.when === first);
}

// A hitchhiker you were good to, at a breakdown: seeded by the day, and never the two who
// took something off you.
export function hitchFriend(s: GameState): Hitcher | null {
  const kind = HITCHERS.filter((h) => h.friend && s.deck.met[h.id] !== undefined);
  if (!kind.length) return null;
  const r = Rng.fromStream(s.seed, 'events').derive(`friend-${s.day}`);
  if (r.next() >= EVENTS.friend) return null;
  return kind[r.int(0, kind.length - 1)]!;
}

// A road event's psyche, on the rebuild's scale.
export const roadPsyche = (p: number | undefined): number => Math.round((p ?? 0) * EVENTS.psyche);

// ---- walk-outs (Phase 22.6c) ----

export const epicByKind = (k: string): Epic | undefined => EPICS.find((e) => e.kind === k);

// How risky walking out of this crag is now: v0.956's reckoning, on the rebuild's state.
export function epicRisk(s: GameState, crag: string): number {
  const E = EVENTS.epic;
  const late = s.min >= E.late;
  let r = 0;
  if (late) r += 2;
  if (s.min >= E.later) r += 1;
  if (late && !s.gear.headlamp) r += 3;
  if (conditionsAt(s.seed, s.day, crag).sky === 'rain') r += 2;
  if (seasonOf(s.day) === 'winter') r += 1;
  if (s.energy < 25) r += 2;
  else if (s.energy < 45) r += 1;
  if (s.fed <= 15) r += 1;
  if (s.supplies <= 0) r += 1;
  if (!Object.values(s.people).some((p) => p.last === s.day)) r += 1;
  return r;
}

export const epicOdds = (s: GameState, crag: string): number =>
  Math.max(0, Math.min(EVENTS.epic.most, (epicRisk(s, crag) - EVENTS.epic.from) * EVENTS.epic.per));

// What kind of walk-out it is: the weather first, then a wall, the winter dark, no light.
export function epicKind(s: GameState, crag: string): EpicKind {
  const late = s.min >= EVENTS.epic.late;
  if (conditionsAt(s.seed, s.day, crag).sky === 'rain') return 'storm';
  if (s.wall) return 'stuck';
  if (late && seasonOf(s.day) === 'winter') return 'cold';
  if (late) return 'dark';
  return 'lost';
}

// Leaving a crag: whether the walk out turns into something, seeded by the day. Never hurt,
// never ten days after the last, never on a day that's had its encounter.
export function epicNow(s: GameState, crag: string): EpicKind | null {
  if (!PLACES[crag]?.crag || s.injury || s.day < EVENTS.from || s.deck.last === s.day) return null;
  if (s.deck.epic && s.day - s.deck.epic < EVENTS.epic.every) return null;
  const r = Rng.fromStream(s.seed, 'events').derive(`epic-${s.day}`);
  return r.next() < epicOdds(s, crag) ? epicKind(s, crag) : null;
}

export const epicEnd = (risk: number): EpicEnd =>
  risk <= EVENTS.epic.clean ? 'clean' : risk <= EVENTS.epic.rough ? 'rough' : 'bad';
