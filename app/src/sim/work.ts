// Phase 18.1: shifts played, not just worked. A job with a minigame has a brief for the
// day, seeded so a reload never moves it; a play is scored against it, and the score buys
// a bonus on the shift's pay (PLAY). Working it without playing pays the shift, as ever.
// Leave (a rank's perk) is here too: a missed shift you had leave for isn't a warning.

import { JOBS } from './content/jobs';
import { CROWDS, SET_MOVES, SET_WALLS, type Crowd, type SetMove, type Wall } from './content/setting';
import { weekOf } from './content/gym';
import { PLAY, SETTING, YEAR } from './dials';
import { rankAt } from './jobs';
import { Rng } from './rng';
import type { GameState } from './types';

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

// What a play's score adds to a shift that pays `base`.
export const playBonus = (base: number, score: number): number =>
  Math.round(base * PLAY.top * Math.max(0, Math.min(1, (score - PLAY.from) / (1 - PLAY.from))));

// ---- leave ----

const yearOf = (day: number): number => Math.floor((day - 1) / YEAR.days);

// Days of leave a job gives you in the year of `day` at your rank, less what you've taken.
export function leaveLeft(s: GameState, job: string, day = s.day): number {
  const days = JOBS[job]?.leave?.[rankAt(s, job)] ?? 0;
  const taken = (s.leave[job] ?? []).filter((d) => yearOf(d) === yearOf(day)).length;
  return Math.max(0, days - taken);
}
