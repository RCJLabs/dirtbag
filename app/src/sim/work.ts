// Phase 18.1: shifts played, not just worked. A job with a minigame has a brief for the
// day, seeded so a reload never moves it; a play is scored against it, and the score buys
// a bonus on the shift's pay (PLAY). Working it without playing pays the shift, as ever.
// Leave (a rank's perk) is here too: a missed shift you had leave for isn't a warning.

import { JOBS } from './content/jobs';
import {
  CLIENTS,
  PICKS,
  CROWDS,
  DRINKS,
  KITCHENS,
  MOODS,
  RUSH_REGULARS,
  RUSH_WHO,
  SET_MOVES,
  SET_WALLS,
  type Crowd,
  type Kitchen,
  type Mood,
  type SetMove,
  type Wall,
} from './content/setting';
import { weekOf } from './content/gym';
import { COACH, FLOOR, HAUL, PLAY, RUSH, SETTING, YEAR } from './dials';
import { rankAt } from './jobs';
import { Rng } from './rng';
import type { Client, GameState } from './types';

// ---- the setter's puzzle ----

export interface SetBrief {
  wall: Wall;
  crowd: Crowd;
  // The grade the gym wants.
  want: number;
  // The moves you've got to hang, by id.
  hand: string[];
}

const SET_WALL_IDS = Object.keys(SET_WALLS) as Wall[];
const CROWD_IDS = Object.keys(CROWDS) as Crowd[];
const MOVE_IDS = Object.keys(SET_MOVES);

// Today's brief: the wall and the grade by the day, the crowd by the week, and a hand with
// a rest in it, as big as your rank's.
export function setBrief(s: GameState): SetBrief {
  const r = Rng.fromStream(s.seed, 'events').derive(`set-${s.day}`);
  const rank = rankAt(s, 'set');
  const wall = SET_WALL_IDS[r.int(0, SET_WALL_IDS.length - 1)]!;
  const crowd =
    CROWD_IDS[
      Rng.fromStream(s.seed, 'events')
        .derive(`set-w${weekOf(s.day)}`)
        .int(0, CROWD_IDS.length - 1)
    ]!;
  const want = SETTING.want.step * rank + r.int(0, SETTING.want.spread);
  const rests = MOVE_IDS.filter((m) => SET_MOVES[m]!.kind === 'rest');
  const rest = rests[r.int(0, rests.length - 1)]!;
  const rest2 = MOVE_IDS.filter((m) => m !== rest);
  for (let i = rest2.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [rest2[i], rest2[j]] = [rest2[j]!, rest2[i]!];
  }
  const n = SETTING.hand[Math.min(rank, SETTING.hand.length - 1)]!;
  const hand = [rest, ...rest2.slice(0, n - 1)].sort((a, b) => MOVE_IDS.indexOf(a) - MOVE_IDS.indexOf(b));
  return { wall, crowd, want, hand };
}

// A set's grade, from how hard its moves are and how hard its hardest is.
export function setGrade(moves: readonly SetMove[]): number {
  if (!moves.length) return 0;
  const sum = moves.reduce((a, m) => a + m.hard, 0);
  const top = Math.max(...moves.map((m) => m.hard));
  return Math.max(0, Math.round(0.6 * sum + 0.5 * top - 2));
}

export interface SetScore {
  grade: number;
  // The flow's four checks: one crux, a rest before it, no dyno straight after a dyno, three
  // kinds of move or more.
  crux: boolean;
  rest: boolean;
  linked: boolean;
  varied: boolean;
  // The share of the set's moves that suit the wall, rests aside.
  fit: number;
  // Whether this week's crowd gets what it wants.
  crowd: boolean;
  score: number;
}

export function scoreSet(b: SetBrief, ids: readonly string[]): SetScore {
  const moves = ids.map((id) => SET_MOVES[id]!);
  const grade = setGrade(moves);
  const top = moves.length ? Math.max(...moves.map((m) => m.hard)) : 0;
  const at = moves.findIndex((m) => m.hard === top);
  const crux = top >= 2 && moves.filter((m) => m.hard === top).length === 1;
  const rest = crux && moves.slice(0, at).some((m) => m.kind === 'rest');
  const linked = moves.every((m, i) => i === 0 || !(m.kind === 'dyno' && moves[i - 1]!.kind === 'dyno'));
  const varied = new Set(moves.map((m) => m.kind)).size >= 3;
  const climbing = moves.filter((m) => m.kind !== 'rest');
  const fit = climbing.length
    ? climbing.filter((m) => SET_WALLS[b.wall].fits.includes(m.kind)).length / climbing.length
    : 0;
  const dyno = moves.some((m) => m.kind === 'dyno');
  const crowd =
    b.crowd === 'beginners'
      ? top < 3 && moves.some((m) => m.kind === 'rest')
      : b.crowd === 'regulars'
        ? grade === b.want
        : b.crowd === 'team'
          ? dyno && top === 3
          : dyno && grade <= b.want;
  const w = SETTING.weight;
  const flow = [crux, rest, linked, varied].filter(Boolean).length / 4;
  const acc = Math.max(0, 1 - Math.abs(grade - b.want) / 3);
  const score =
    moves.length === SETTING.pick
      ? w.grade * acc + w.flow * flow + w.fit * fit + w.crowd * (crowd ? 1 : 0)
      : 0;
  return { grade, crux, rest, linked, varied, fit, crowd, score: Math.round(score * 1000) / 1000 };
}

// Why a set can't be hung from today's hand, or null when it can.
export function setRefused(b: SetBrief, ids: readonly string[]): string | null {
  if (ids.length !== SETTING.pick) return `A set is ${SETTING.pick} moves.`;
  if (new Set(ids).size !== ids.length) return 'Each hold goes up once.';
  if (ids.some((id) => !b.hand.includes(id))) return 'That’s not in the bucket today.';
  return null;
}

// What a play's score adds to a shift that pays `base`, from a score of `from` (the
// game's: above what playing at random gets) to a perfect one.
export const playBonus = (base: number, score: number, from: number = PLAY.from): number =>
  Math.round(base * PLAY.top * Math.max(0, Math.min(1, (score - from) / (1 - from))));

// Every order of `n` things, for scoring a play against the best one there was.
function* orders(n: number, pre: number[] = []): Generator<number[]> {
  if (pre.length === n) {
    yield pre;
    return;
  }
  for (let i = 0; i < n; i++) if (!pre.includes(i)) yield* orders(n, [...pre, i]);
}

const shuffled = <T>(r: Rng, xs: readonly T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

// ---- the café's rush (Phase 18.2) ----

export interface Order {
  who: string;
  drink: string;
  // Turns of the machine they'll wait, from the start of the rush, for it to be done.
  waits: number;
  tip: number;
  regular: boolean;
}

// Today's queue, by the day: as long as your rank's, a regular or two in it.
export function rushQueue(s: GameState): Order[] {
  const r = Rng.fromStream(s.seed, 'events').derive(`rush-${s.day}`);
  const n = RUSH.queue[Math.min(rankAt(s, 'cafe'), RUSH.queue.length - 1)]!;
  const drinks = Object.keys(DRINKS);
  const regs = shuffled(r, RUSH_REGULARS);
  const strangers = shuffled(r, RUSH_WHO);
  return Array.from({ length: n }, (_, i) => {
    const regular = i < regs.length && r.next() < 0.3;
    const drink = drinks[r.int(0, drinks.length - 1)]!;
    const waits = r.int(RUSH.patience.lo, RUSH.patience.hi) + (regular ? RUSH.regular : 0);
    const tip = DRINKS[drink]!.tip * (regular ? 2 : 1);
    return { who: regular ? regs[i]! : strangers[i % strangers.length]!, drink, waits, tip, regular };
  });
}

// What a queue served in this order tips: each drink made in turn, tipped if it's done
// before they give up. Those left out aren't served.
export function rushTips(q: readonly Order[], order: readonly number[]): number {
  let t = 0;
  let tips = 0;
  for (const i of order) {
    t += DRINKS[q[i]!.drink]!.make;
    if (t <= q[i]!.waits) tips += q[i]!.tip;
  }
  return tips;
}

// How many were served before they gave up.
export function rushServed(q: readonly Order[], order: readonly number[]): number {
  let t = 0;
  let n = 0;
  for (const i of order) {
    t += DRINKS[q[i]!.drink]!.make;
    if (t <= q[i]!.waits) n++;
  }
  return n;
}

export const rushBest = (q: readonly Order[]): number => {
  let best = 0;
  for (const o of orders(q.length)) best = Math.max(best, rushTips(q, o));
  return best;
};

export const rushRefused = (q: readonly Order[], order: readonly number[]): string | null =>
  order.length !== q.length ||
  new Set(order).size !== q.length ||
  order.some((i) => !(i >= 0 && i < q.length))
    ? 'Every order gets made, one at a time.'
    : null;

// ---- the diner's floor (Phase 18.2) ----

export interface Table {
  party: number;
  mood: Mood;
}

// The shift's floor: tables seated in waves, and the kitchen's pace. You take on tables
// from each wave as it comes, not knowing the next; a table stays through its wave and the
// one after, and every table on your section makes the others wait.
export interface Floor {
  waves: Table[][];
  kitchen: Kitchen;
}

export function dinerFloor(s: GameState): Floor {
  const r = Rng.fromStream(s.seed, 'events').derive(`floor-${s.day}`);
  const n = FLOOR.wave[Math.min(rankAt(s, 'diner'), FLOOR.wave.length - 1)]!;
  const moods = Object.keys(MOODS) as Mood[];
  const kitchens = Object.keys(KITCHENS) as Kitchen[];
  const waves = Array.from({ length: FLOOR.waves }, () =>
    Array.from({ length: n }, () => ({ party: r.int(1, 6), mood: moods[r.int(0, moods.length - 1)]! })),
  );
  return { waves, kitchen: kitchens[r.int(0, kitchens.length - 1)]! };
}

// What the tables you took on tip, wave by wave (`take[w]` the tables taken from wave w):
// each tips its party at its mood's rate, less what it loses to the busiest wave it sat
// through, at the kitchen's pace.
export function floorTips(f: Floor, take: readonly (readonly number[])[]): number {
  const on = f.waves.map((_, w) => (take[w]?.length ?? 0) + (w > 0 ? (take[w - 1]?.length ?? 0) : 0));
  let tips = 0;
  f.waves.forEach((wave, w) => {
    const busy = Math.max(on[w]!, on[w + 1] ?? 0);
    for (const i of take[w] ?? []) {
      const t = wave[i]!;
      tips +=
        t.party *
        MOODS[t.mood].tip *
        Math.max(0, 1 - MOODS[t.mood].juggle * KITCHENS[f.kitchen].wait * (busy - 1));
    }
  });
  return Math.round(tips * 10) / 10;
}

// The best the floor allowed, in hindsight.
export function floorBest(f: Floor): number {
  const subsets = (n: number) =>
    Array.from({ length: 1 << n }, (_, m) =>
      Array.from({ length: n }, (_, i) => i).filter((i) => m & (1 << i)),
    );
  let best = 0;
  const go = (w: number, take: number[][]) => {
    if (w === f.waves.length) {
      best = Math.max(best, floorTips(f, take));
      return;
    }
    for (const t of subsets(f.waves[w]!.length)) go(w + 1, [...take, t]);
  };
  go(0, []);
  return best;
}

export const floorRefused = (f: Floor, take: readonly (readonly number[])[]): string | null =>
  take.length !== f.waves.length ||
  take.some((t, w) => new Set(t).size !== t.length || t.some((i) => !(i >= 0 && i < f.waves[w]!.length)))
    ? 'Each wave’s tables, each once.'
    : !take.some((t) => t.length)
      ? 'Take on a table at least.'
      : null;

// ---- the coach's roster (Phase 18.3) ----

export type Focus = 'burns' | 'drill' | 'head' | 'rest';
const STYLES: Client['style'][] = ['crimp', 'power', 'technical', 'dyno'];

// A new client, the nth you've had: named, a project in a style, one to three grades over.
function newClient(seed: string, n: number): Client {
  const r = Rng.fromStream(seed, 'events').derive(`client-${n}`);
  return {
    name: CLIENTS[n % CLIENTS.length]!,
    style: STYLES[r.int(0, STYLES.length - 1)]!,
    gap: r.int(1, 3),
    progress: 0,
    tired: 0,
    scared: r.next() < COACH.scare,
  };
}

// The next client's number once today's roster is filled to your rank's size.
function rosterNext(s: GameState): number {
  const size = COACH.roster[Math.min(rankAt(s, 'coach'), COACH.roster.length - 1)]!;
  const names = (s.coach?.clients ?? []).map((c) => c.name);
  let next = s.coach?.next ?? 0;
  for (let n = names.length; n < size; n++) {
    while (names.includes(CLIENTS[next % CLIENTS.length]!)) next++;
    names.push(CLIENTS[next % CLIENTS.length]!);
    next++;
  }
  return next;
}

// The roster as it turns up today: as big as your rank's, rested a point a day since the
// last session, and some of them scared, by the day.
export function rosterToday(s: GameState): Client[] {
  const size = COACH.roster[Math.min(rankAt(s, 'coach'), COACH.roster.length - 1)]!;
  const c = s.coach ?? { clients: [], next: 0, last: s.day };
  const clients = [...c.clients];
  let next = c.next;
  while (clients.length < size) {
    while (clients.some((c) => c.name === CLIENTS[next % CLIENTS.length])) next++;
    clients.push(newClient(s.seed, next++));
  }
  const rested = s.day - c.last;
  return clients.map((x) => ({
    ...x,
    tired: Math.max(0, x.tired - rested),
    scared:
      x.scared || Rng.fromStream(s.seed, 'events').derive(`scare-${x.name}-${s.day}`).next() < COACH.scare,
  }));
}

// What an hour of each focus does to a client.
export function coached(c: Client, f: Focus): Client {
  const B = COACH.burns;
  if (f === 'burns')
    return {
      ...c,
      progress: c.progress + (c.scared ? B.scared : Math.max(0, B.gain - B.tired * c.tired)),
      tired: c.tired + B.wear,
    };
  if (f === 'drill')
    return { ...c, progress: c.progress + COACH.drill.gain, tired: c.tired + COACH.drill.wear };
  if (f === 'head') return { ...c, progress: c.progress + COACH.head.gain, scared: false };
  return { ...c, tired: Math.max(0, c.tired - COACH.rest.ease) };
}

export const FOCI: Focus[] = ['burns', 'drill', 'head', 'rest'];

export const coachRefused = (roster: readonly Client[], foci: readonly string[]): string | null =>
  foci.length !== roster.length || foci.some((f) => !FOCI.includes(f as Focus))
    ? 'A focus for everyone on the roster.'
    : null;

// A session: each client's hour, who sent, what it pays, and the roster after (a client
// who sent makes room for a new one).
export function coachSession(
  s: GameState,
  foci: readonly Focus[],
): { coach: NonNullable<GameState['coach']>; sent: Client[]; bonus: number; foci: readonly Focus[] } {
  const today = rosterToday(s);
  let next = rosterNext(s);
  const sent: Client[] = [];
  const names = new Set(today.map((c) => c.name));
  const clients = today.map((c, i) => {
    const after = coached(c, foci[i]!);
    if (after.progress < 100) return after;
    sent.push(after);
    // A new face: never someone's name already on the roster.
    while (names.has(CLIENTS[next % CLIENTS.length]!)) next++;
    const fresh = newClient(s.seed, next++);
    names.add(fresh.name);
    return fresh;
  });
  return {
    coach: { clients, next, last: s.day },
    sent,
    bonus: sent.reduce((a, c) => a + COACH.send * c.gap, 0),
    foci,
  };
}

// ---- the warehouse's picks (Phase 18.3) ----

// What's on offer for the nth pick today.
export function haulOffer(s: GameState, n: number): string[] {
  const r = Rng.fromStream(s.seed, 'events').derive(`haul-${s.day}-${n}`);
  return shuffled(r, Object.keys(PICKS)).slice(0, HAUL.offer);
}

// The day on the floor: the heat (0 to 2) and the supervisor (0 to 2).
export function haulDay(s: GameState): { heat: number; dock: number } {
  const r = Rng.fromStream(s.seed, 'events').derive(`haulday-${s.day}`);
  return { heat: r.int(0, HAUL.heat.length - 1), dock: r.int(0, HAUL.dock.length - 1) };
}

// How much a pick takes out of you, at your rank, in today's heat.
export const pickWeight = (s: GameState, id: string): number =>
  Math.round(
    PICKS[id]!.weight * (rankAt(s, 'warehouse') >= 2 ? HAUL.easier : 1) * HAUL.heat[haulDay(s).heat]!,
  );

// What a drop costs of the picks so far, today.
export const dropCost = (s: GameState): number => HAUL.dock[haulDay(s).dock]!;

// The chance of dropping a pick, worn out as you'd be after it.
export const dropChance = (fatigue: number): number => Math.min(0.95, HAUL.risk * (fatigue / 100) ** 2);

// Whether the nth pick today drops, at that chance: by the day, so it's the same on a reload.
export const dropped = (s: GameState, n: number, chance: number): boolean =>
  Rng.fromStream(s.seed, 'events').derive(`drop-${s.day}-${n}`).next() < chance;

// ---- leave ----

const yearOf = (day: number): number => Math.floor((day - 1) / YEAR.days);

// Days of leave a job gives you in the year of `day` at your rank, less what you've taken.
export function leaveLeft(s: GameState, job: string, day = s.day): number {
  const days = JOBS[job]?.leave?.[rankAt(s, job)] ?? 0;
  const taken = (s.leave[job] ?? []).filter((d) => yearOf(d) === yearOf(day)).length;
  return Math.max(0, days - taken);
}
