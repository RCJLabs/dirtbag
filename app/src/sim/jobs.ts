// Your working life: shifts worked at each job, the rank that earns you, and what a shift
// pays at it. The ranks are data (content/jobs.ts); every act that's a shift says which
// job and how many shifts it counts for (ActDef.job).

import { EXPEDITIONS, tripDays } from './content/expeditions';
import { gradeOf } from './climber';
import { JOBS } from './content/jobs';
import { WEEK_DAYS, weekOf } from './content/gym';
import { LIFESTYLE, MONEY, WORK, type Lifestyle } from './dials';
import { isWeekend } from './cond';
import { Rng } from './rng';
import type { GameState } from './types';
import { livingMult } from './identity';

export const shiftsAt = (s: GameState, job: string): number => s.jobs[job] ?? 0;

// Your rank at a job: the highest whose shifts you've worked and whose grade you climb.
export function rankAt(s: GameState, job: string): number {
  const j = JOBS[job];
  if (!j) return 0;
  const n = shiftsAt(s, job);
  const g = gradeOf(s.climber.skills);
  let r = 0;
  for (let i = 1; i < j.ranks.length; i++) if (n >= j.at[i]! && g >= (j.grade?.[i] ?? 0)) r = i;
  return r;
}

export const rankName = (s: GameState, job: string): string => JOBS[job]?.ranks[rankAt(s, job)] ?? '';

// What a rank adds to one shift's pay.
export const raiseAt = (s: GameState, job: string): number => (JOBS[job]?.raise ?? 0) * rankAt(s, job);

// The next rank and what stands between you and it, or null at the top.
export function nextRank(
  s: GameState,
  job: string,
): { name: string; shifts: number; grade: number | null } | null {
  const j = JOBS[job];
  const r = rankAt(s, job);
  if (!j || r >= j.ranks.length - 1) return null;
  const g = j.grade?.[r + 1] ?? 0;
  return {
    name: j.ranks[r + 1]!,
    shifts: Math.max(0, j.at[r + 1]! - shiftsAt(s, job)),
    grade: gradeOf(s.climber.skills) < g ? g : null,
  };
}

// ---- Phase 22.1: the week's schedule ----

// The days a job posts a shift in a week (weekOf's numbering), in order. A job that posts
// every day has no draw to make; the rest come off the world's seed, by job and week, so
// next week's are already up and a reload never moves them.
export function postedIn(seed: string, job: string, week: number): number[] {
  const j = JOBS[job];
  const days = Array.from({ length: WEEK_DAYS }, (_, i) => (week - 1) * WEEK_DAYS + i + 1);
  if (!j || !j.posts || j.posts >= WEEK_DAYS) return days;
  const r = Rng.fromStream(seed, 'worldgen').derive(`shifts-${job}-w${week}`);
  for (let i = days.length - 1; i > 0; i--) {
    const k = r.int(0, i);
    [days[i], days[k]] = [days[k]!, days[i]!];
  }
  return days.slice(0, j.posts).sort((a, b) => a - b);
}

export const isPosted = (seed: string, job: string, day: number): boolean =>
  postedIn(seed, job, weekOf(day)).includes(day);

// The day you're back on a job's schedule after it let you go, or null if you're on it.
export const benchedUntil = (s: GameState, job: string): number | null => {
  const d = s.benched[job];
  return d !== undefined && s.day < d ? d : null;
};

export const signedUp = (s: GameState, job: string, day: number): boolean =>
  s.shifts.some((x) => x.job === job && x.day === day);

// Why you can't sign up for a job's shift that day, or null when you can. `on: false`
// asks about dropping one instead.
export function signupBlocked(s: GameState, job: string, day: number, on = true): string | null {
  const j = JOBS[job];
  if (!j) return 'No such job.';
  if (!on)
    return signedUp(s, job, day) ? (day > s.day ? null : "It's today. Go, or don't.") : 'Not signed up.';
  if (day <= s.day) return "Today's shifts are walk-ins.";
  // Your own gym (Phase 18.6): nobody posts the owner setting shifts.
  if (job === 'set' && s.gym) return 'You own the place.';
  if (day > s.day + WORK.ahead) return 'Not posted yet.';
  if ((j.grade?.[0] ?? 0) > gradeOf(s.climber.skills)) return `They want V${j.grade![0]}.`;
  if (!isPosted(s.seed, job, day)) return 'No shift posted.';
  const back = benchedUntil(s, job);
  if (back !== null && day < back) return `Off the schedule till day ${back}.`;
  if (s.shifts.some((x) => x.day === day)) return 'You’ve a shift that day.';
  // Phase 24.3: not while you're booked to be away.
  const b = s.booked;
  if (b) {
    const w = tripDays(b.id, b.day);
    if (day >= w.from && day <= w.to) return `You’re away on ${EXPEDITIONS[b.id]!.name} then.`;
  }
  return null;
}

// What tonight's living costs and gives back: how you live, if the card takes it after the
// night's spot (`spot`, what it costs); a dirtbag's night if it won't.
// Living on nothing comes cheaper to some (Phase 23.2): the cost is on your origin's terms.
export function livingTonight(s: GameState, spot: number): (typeof LIFESTYLE)[Lifestyle] {
  const base = skimps(s, spot) ? LIFESTYLE.dirtbag : LIFESTYLE[s.lifestyle];
  return { ...base, cost: Math.round(base.cost * livingMult(s)) };
}

// Whether the card won't stretch to how you like to live tonight.
export const skimps = (s: GameState, spot: number): boolean =>
  s.cash - spot + MONEY.cardLimit < Math.round(LIFESTYLE[s.lifestyle].cost * livingMult(s));

// A shift's tips (the diner's), seeded by the job and the day: a weekday's range, half again
// at the weekend. Zero for a job without them.
export function tipsFor(s: GameState, job: string): number {
  const t = JOBS[job]?.tips;
  if (!t) return 0;
  const n = Rng.fromStream(s.seed, 'events').derive(`tips-${job}-${s.day}`).int(t[0], t[1]);
  return isWeekend(s.day) ? Math.round(n * 1.5) : n;
}
