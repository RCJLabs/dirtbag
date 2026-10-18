// Phase 37 (Evan's calls, 18 Oct 2026): the session. On a busy day at a boulder crag, whoever
// of the cast who boulder is here, and nameless locals to make three or four, take turns on one
// problem with you, once a day. Everyone's falls at a crux add up toward its hidden move, and
// the fall that turns it up is a find, once a session: yours to share (bond with the cast here,
// the old guard's regard) or keep (they climb without it); a local's shared or kept as they
// would. Their goes are a comp's chance from their grade against the problem's; yours are
// played. The numbers are SESH (dials.ts), the words content/sesh.ts. These functions take the
// state's own session and change it; act() hands them its copy.

import { isCompProblem } from './comps';
import { gradeOf } from './climber';
import { indoor } from './content/gym';
import { PEOPLE } from './content/people';
import { effGrade, type RouteDef } from './content/routes';
import { LOCALS, SESH_CAST, SESH_SAYS } from './content/sesh';
import { crowdNow } from './crowds';
import { gradeOfPerson } from './curves';
import { CLIMB, COMP, SESH } from './dials';
import { fill, listOf, upper } from './format';
import { whereNow } from './presence';
import { Rng } from './rng';
import type { GameState } from './types';

export type Sesh = NonNullable<GameState['sesh']>;
export type SeshSeat = Sesh['seats'][number];

// You, in a session's finds and its first send.
const ME = 'you';
// Today's flag: a session a day.
export const SESH_DAY = 'sesh';

// A problem's hidden moves: each crux's earned beta, in crux order.
export const hiddenMoves = (r: RouteDef): string[] =>
  r.cruxes.flatMap((c) => c.beta.slice(1).filter((b) => !!r.beta[b]?.unlock));

// Today's session on this problem, while you're at it.
export const seshOn = (s: GameState, r: RouteDef): Sesh | null =>
  s.sesh && s.sesh.day === s.day && s.sesh.route === r.id && s.at === r.place ? s.sesh : null;

// Why there's no session for you on this problem now, or null.
export function seshBlocked(s: GameState, r: RouteDef): string | null {
  if (r.disc !== 'boulder' || r.dws || r.wall || r.exped || indoor(r.place) || isCompProblem(r.id))
    return 'No session on this one';
  if (s.at !== r.place) return 'That problem isn’t here';
  if (s.today.includes(SESH_DAY)) return 'You’ve had your session today';
  if (s.routes[r.id]?.sent) return 'You’ve sent it already';
  if (s.min >= CLIMB.darkFrom) return 'Too dark to climb';
  const c = crowdNow(s, r.place);
  if (c !== 'busy' && c !== 'packed') return 'Not enough people out for a session';
  return null;
}

// Who someone in the session is, as you'd say it.
export const seatName = (who: string): string =>
  who.startsWith('local-') ? (LOCALS[Number(who.slice(6))] ?? 'a local') : (PEOPLE[who]?.name ?? who);

// The cast's grade today: Dex and Sage by their curves, the rest a grade over or under yours,
// as on an expedition.
function castGrade(s: GameState, who: string): number {
  return gradeOfPerson(s.seed, who, s.day) ?? gradeOf(s.climber.skills) + (PEOPLE[who]?.grade ?? 0);
}

// Who's on it: the cast here who boulder, in SESH.cast's order, then nameless locals drawn for
// the day, to make the crowd's number. Nobody sessions it more than `SESH.spread[1]` grades
// over the problem: well over it, they'd flash it before anyone else had a go [proposed].
export function seatsFor(s: GameState, r: RouteDef): SeshSeat[] {
  const n = SESH.seats[crowdNow(s, r.place) === 'packed' ? 'packed' : 'busy'];
  const rng = Rng.fromStream(s.seed, 'events').derive(`sesh-${r.id}-${s.day}`);
  const [lo, hi] = SESH.spread as [number, number];
  const seats: SeshSeat[] = SESH.cast
    .filter((w) => s.people[w] && whereNow(s, w) === s.at)
    .slice(0, n)
    .map((who) => ({
      who,
      grade: Math.min(castGrade(s, who), effGrade(r) + hi),
      knows: [],
      sent: false,
      shares: SESH_CAST[who]?.shares ?? true,
    }));
  const pool = LOCALS.map((_, i) => i);
  while (seats.length < n && pool.length) {
    const i = pool.splice(Math.floor(rng.next() * pool.length), 1)[0]!;
    seats.push({
      who: `local-${i}`,
      grade: effGrade(r) + lo + rng.next() * (hi - lo),
      knows: [],
      sent: false,
      shares: rng.next() < SESH.shares,
    });
  }
  return seats;
}

// A session begun: who's on it, and the hidden moves you bring to it, each yours to tell them
// or keep.
export function startSesh(s: GameState, r: RouteDef): Sesh {
  const seats = seatsFor(s, r);
  const known = s.routes[r.id]?.known ?? [];
  const found = hiddenMoves(r)
    .filter((b) => known.includes(b))
    .map((beta) => ({ beta, by: ME, shared: null }));
  const x: Sesh = { route: r.id, day: s.day, seats, falls: {}, found, first: null, round: 0, said: [] };
  x.said = [fill(SESH_SAYS.join, { who: upper(listOf(seats.map((p) => seatName(p.who)))) }), ...prompt(x, r)];
  return x;
}

// The move of yours they're waiting to hear about, if any.
export const pendingFind = (x: Sesh): string | null =>
  x.found.find((f) => f.by === ME && f.shared === null)?.beta ?? null;

const cruxOf = (r: RouteDef, beta: string) => r.cruxes.find((c) => c.beta.includes(beta))!;
const cruxWord = (r: RouteDef, beta: string) => cruxOf(r, beta).name.replace(/^The /, 'the ');
const moveWord = (r: RouteDef, beta: string) => (r.beta[beta]?.name ?? beta).toLowerCase();

// The question a find of yours puts to you: turned up today, or brought from another day.
function prompt(x: Sesh, r: RouteDef, fresh = false): string[] {
  const b = pendingFind(x);
  if (!b) return [];
  return [fill(fresh ? SESH_SAYS.found : SESH_SAYS.brought, { crux: cruxWord(r, b), beta: moveWord(r, b) })];
}

// A fall at a crux in the session: it adds to the crux's count, and the fall that reaches a
// hidden move's count turns it up for whoever took it, once a session.
function fallAt(x: Sesh, r: RouteDef, crux: string): string | null {
  const c = r.cruxes.find((k) => k.id === crux);
  if (!c) return null;
  const n = (x.falls[crux] ?? 0) + 1;
  x.falls[crux] = n;
  for (const b of c.beta.slice(1)) {
    const u = r.beta[b]?.unlock;
    if (u && n >= u.falls && !x.found.some((f) => f.beta === b)) return b;
  }
  return null;
}

// Your fall in the session: the move it turns up, if any, now yours to tell or keep, and the
// question it puts. A move you've worked out by your own falls (`known`, after this one) is
// your find too, if nobody's turned it up yet.
export function yourFall(
  x: Sesh,
  r: RouteDef,
  crux: string,
  known: string[],
): { beta: string | null; said: string[] } {
  const own = (m: string) => known.includes(m) && !!r.beta[m]?.unlock && !x.found.some((f) => f.beta === m);
  const b =
    fallAt(x, r, crux) ??
    r.cruxes
      .find((c) => c.id === crux)
      ?.beta.slice(1)
      .find(own) ??
    null;
  if (!b) return { beta: null, said: [] };
  x.found.push({ beta: b, by: ME, shared: null });
  return { beta: b, said: prompt(x, r, true) };
}

// Telling them the move you found, or keeping it: what's said, and the next question.
export function answer(x: Sesh, r: RouteDef, share: boolean): { beta: string; said: string[] } | null {
  const b = pendingFind(x);
  if (!b) return null;
  x.found = x.found.map((f) => (f.beta === b ? { ...f, shared: share } : f));
  if (share) for (const p of x.seats) if (!p.knows.includes(b)) p.knows.push(b);
  return {
    beta: b,
    said: [fill(share ? SESH_SAYS.share : SESH_SAYS.keep, { beta: moveWord(r, b) }), ...prompt(x, r)],
  };
}

// A seat's chance on one go: a comp's chance from their grade against the problem's, spread
// over a session's goes, with the hidden moves they know worth `SESH.knows` grades.
export function seatChance(p: SeshSeat, r: RouteDef): number {
  const hidden = hiddenMoves(r);
  const k = hidden.length ? hidden.filter((b) => p.knows.includes(b)).length / hidden.length : 1;
  const all = 1 / (1 + Math.exp(-COMP.steep * (p.grade + SESH.knows * k - effGrade(r) + 0.5)));
  return 1 - (1 - all) ** (1 / SESH.goes);
}

// Where a seat comes off: the first crux whose hidden move they haven't got, or the first.
const stuckAt = (p: SeshSeat, r: RouteDef): string =>
  (
    r.cruxes.find((c) => c.beta.slice(1).some((b) => r.beta[b]?.unlock && !p.knows.includes(b))) ??
    r.cruxes[0]!
  ).id;

// The others' round: each who hasn't sent has a go, seeded by the round. A send may be the
// day's first; a fall adds up toward a find, which they share with everyone or keep. Returns
// what's said, and the moves shared with you, for act() to teach you as watched.
export function theirRound(s: GameState, x: Sesh, r: RouteDef): { said: string[]; shown: string[] } {
  const rng = Rng.fromStream(s.seed, 'events').derive(`sesh-${r.id}-${s.day}-${x.round}`);
  x.round++;
  const said: string[] = [];
  const shown: string[] = [];
  for (const p of x.seats) {
    if (p.sent) continue;
    const name = upper(seatName(p.who));
    if (rng.next() < seatChance(p, r)) {
      p.sent = true;
      if (x.first) said.push(fill(SESH_SAYS.sent, { who: name }));
      else {
        x.first = p.who;
        said.push(SESH_CAST[p.who]?.first ?? fill(SESH_SAYS.theyFirst, { who: name }));
      }
      continue;
    }
    const crux = stuckAt(p, r);
    said.push(
      fill(SESH_SAYS.fell, {
        who: name,
        crux: r.cruxes.find((c) => c.id === crux)!.name.replace(/^The /, 'the '),
      }),
    );
    const b = fallAt(x, r, crux);
    if (!b) continue;
    x.found.push({ beta: b, by: p.who, shared: p.shares });
    if (!p.knows.includes(b)) p.knows.push(b);
    const words = { who: name, crux: cruxWord(r, b), beta: moveWord(r, b) };
    const cast = SESH_CAST[p.who];
    if (p.shares) {
      for (const q of x.seats) if (!q.knows.includes(b)) q.knows.push(b);
      shown.push(b);
      said.push(cast?.shares ? fill(cast.found, words) : fill(SESH_SAYS.shared, words));
    } else said.push(cast && !cast.shares ? fill(cast.found, words) : fill(SESH_SAYS.kept, words));
  }
  return { said, shown };
}

// Whether everyone else has sent it.
export const allSent = (x: Sesh): boolean => x.seats.every((p) => p.sent);
