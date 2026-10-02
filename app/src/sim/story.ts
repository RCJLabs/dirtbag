// Where you are in the story: five acts of goals (Phase 16.2), checked after everything you
// do, in order. `s.goals` counts the stages done across all of them.

import { gradeOf } from './climber';
import { indoor, routeById } from './content/gym';
import { PLACES } from './content/places';
import { ROUTES, WALLS } from './content/routes';
import { STORY, type Act, type Aim, type Goal } from './content/story';
import { BOND } from './dials';
import { fill } from './format';
import { PARTNERS } from './presence';
import { familyWords, kinLine } from './heir';
import { HEIR_ACT, HEIR_END } from './content/heir';
import type { GameState } from './types';

type Rung = { act: number; i: number; goal: Goal };
const ladder = (acts: Act[]): Rung[] =>
  acts.flatMap((a, n) => a.goals.map((goal, i) => ({ act: n + 1, i, goal })));

// Every stage of every act, in order, with the act it's in (1 to 5) and its place there.
export const LADDER: Rung[] = ladder(STORY);

// A family's next climber (Phase 16.5) has their own first act, Their Shadow, then the rest.
export const HEIR_STORY: Act[] = [
  { title: 'Their Shadow', goals: HEIR_ACT, end: HEIR_END },
  ...STORY.slice(1),
];
export const HEIR_LADDER: Rung[] = ladder(HEIR_STORY);

export const storyOf = (s: GameState): Act[] => (s.family ? HEIR_STORY : STORY);
const ladderOf = (s: GameState): Rung[] => (s.family ? HEIR_LADDER : LADDER);

// The myths: lines you can't read until the one under them is sent.
const MYTHS = Object.values(ROUTES).filter((r) => r.hiddenUntil);

// The lines you've sent, with their route.
const sentLines = (s: GameState) =>
  Object.entries(s.routes)
    .filter(([, l]) => l.sent)
    .map(([id]) => routeById(s.seed, id));

// How far along a stage is: what you have against what it asks.
export function progress(s: GameState, aim: Aim): { have: number; need: number } {
  const yes = (b: boolean) => ({ have: b ? 1 : 0, need: 1 });
  if ('cash' in aim) return { have: Math.max(0, s.cash), need: aim.cash };
  if ('regular' in aim) {
    const best = Math.max(0, ...PARTNERS.map((w) => s.people[w]?.bond ?? 0));
    return { have: Math.min(best, BOND.tiers[2]!), need: BOND.tiers[2]! };
  }
  if ('wall' in aim) {
    const w = WALLS[aim.wall];
    return yes(!!w && !!s.routes[w.pitches[w.pitches.length - 1]!]?.sent);
  }
  if ('summit' in aim) return yes(s.book.some((t) => t.id === aim.summit && t.end === 'summit'));
  if ('reveal' in aim) return yes(MYTHS.some((r) => !!s.routes[r.hiddenUntil!]?.sent));
  if ('kin' in aim) {
    // Nothing of theirs on the topos: there's no line to get on, and it's done.
    const l = kinLine(s);
    return yes(!l || (s.routes[l.id]?.goes ?? 0) > 0);
  }
  if ('myth' in aim)
    return yes(
      Object.entries(s.firsts).some(([id, f]) => !f.by && (routeById(s.seed, id)?.grade ?? 0) >= 18),
    );
  if ('at' in aim)
    return yes(
      sentLines(s).some((r) => !!r && r.place === aim.at && !r.exped && r.grade >= (aim.grade ?? 0)),
    );
  if ('outside' in aim) {
    const n = sentLines(s).filter((r) => !!r && !indoor(r.place) && !r.exped && r.grade >= aim.grade).length;
    return { have: n, need: aim.outside };
  }
  if ('grade' in aim) return { have: gradeOf(s.climber.skills), need: aim.grade };
  const sent = sentLines(s);
  if ('sends' in aim) return { have: sent.length, need: aim.sends };
  const outside = sent.filter((r) => PLACES[r?.place ?? '']?.crag);
  return { have: outside.length, need: aim.sendsOutside };
}

export const aimMet = (s: GameState, aim: Aim): boolean => {
  const p = progress(s, aim);
  return p.have >= p.need;
};

// The stage you're on, or null once the story's done.
export const currentGoal = (s: GameState): Goal | null => ladderOf(s)[s.goals]?.goal ?? null;

// The act you're in, 1 to 5; one past the last once it's all done.
export const actOf = (s: GameState): number => ladderOf(s)[s.goals]?.act ?? STORY.length + 1;

// The act a stage finishes, if it's its act's last; else null.
export function actEndedBy(s: GameState, goalIndex: number): { n: number; act: Act } | null {
  const e = ladderOf(s)[goalIndex];
  if (!e) return null;
  const act = storyOf(s)[e.act - 1]!;
  return e.i === act.goals.length - 1 ? { n: e.act, act } : null;
}

// Where you are in the act: the stage's number and how many it has.
export function stageOf(s: GameState): { n: number; of: number } | null {
  const e = ladderOf(s)[s.goals];
  return e ? { n: e.i + 1, of: storyOf(s)[e.act - 1]!.goals.length } : null;
}

export const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

// Whether a stage is a count worth showing as "2 of 3": sends, not cash, a grade or a person.
export const counted = (aim: Aim): boolean => 'sends' in aim || 'sendsOutside' in aim || 'outside' in aim;

// A stage's ask in words, from its own numbers.
// With a state, a family's words are filled in too (Phase 16.5).
export function goalDesc(g: Goal, s?: GameState): string {
  const a = g.aim;
  const n: number =
    'cash' in a
      ? a.cash
      : 'outside' in a
        ? a.outside
        : 'grade' in a
          ? (a.grade ?? 0)
          : 'sends' in a
            ? a.sends
            : 'sendsOutside' in a
              ? a.sendsOutside
              : 0;
  const grade = 'grade' in a ? (a.grade ?? 0) : 0;
  return fill(g.desc, { n, g: grade, ...(s?.family ? familyWords(s) : {}) });
}

// The myth you put up, for The Line's naming: its name, grade and crag; the latest if more.
export function theLine(s: GameState): { name: string; grade: number; place: string } | null {
  const mine = Object.entries(s.firsts)
    .filter(([, f]) => !f.by)
    .map(([id, f]) => ({ f, r: routeById(s.seed, id) }))
    .filter((x) => (x.r?.grade ?? 0) >= 18)
    .sort((a, b) => b.f.day - a.f.day)[0];
  return mine
    ? { name: mine.f.name, grade: mine.r!.grade, place: PLACES[mine.r!.place]?.name ?? 'the crag' }
    : null;
}
