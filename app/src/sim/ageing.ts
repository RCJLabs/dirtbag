// Phase 30.1 (Evan's call, 15 Oct 2026: gentle, with skill offsets): how old you are, and what
// the years do to a climber's body. A go uses your skills as your age has them; the grade you
// see is your skills as trained. Kept apart from age.ts, which reads the story and the cast,
// so the climbing code can ask without them.

import { AGE, AGEING } from './dials';
import { originOf } from './identity';
import type { GameState, SkillId, Skills } from './types';

export const startAge = (s: GameState): number => AGE.start + (originOf(s)?.fx.age ?? 0);

// Your age today: a year of it every AGE.days days, less any clock an old save held back.
export const ageOf = (s: GameState, day = s.day): number =>
  startAge(s) + Math.floor(Math.max(0, day - 1 - s.life.held) / AGE.days);

// The first day you're `age`.
export const dayAtAge = (s: GameState, age: number): number =>
  Math.max(1, (age - startAge(s)) * AGE.days + 1 + s.life.held);

const SKILLS: SkillId[] = ['power', 'fingers', 'endurance', 'technique', 'head'];

// What the years have made of a skill, as a share of it: whole before its age, then `a` a
// year, never past `limit`.
export function ageMult(age: number, k: SkillId): number {
  const A = AGEING[k];
  const m = 1 + A.a * Math.max(0, age - A.from);
  return A.a < 0 ? Math.max(A.limit, m) : Math.min(A.limit, m);
}

// Your skills as a go uses them today.
export function agedSkills(s: GameState): Skills {
  const age = ageOf(s);
  const k = s.climber.skills;
  return Object.fromEntries(SKILLS.map((id) => [id, k[id] * ageMult(age, id)])) as unknown as Skills;
}

// A share as a percentage: whole where it is, a tenth where it isn't (half a percent a year).
const pct = (m: number) => `${Number((Math.abs(m - 1) * 100).toFixed(1))}%`;

// The You page's line on what the years have done, or null while they've done nothing.
export function ageingNote(s: GameState): string | null {
  const age = ageOf(s);
  const groups: [string, SkillId][] = [
    ['power and fingers', 'power'],
    ['endurance', 'endurance'],
    ['head and technique', 'head'],
  ];
  const said = groups
    .map(([words, k]) => ({ words, m: ageMult(age, k) }))
    .filter((g) => g.m !== 1)
    .map((g) => `${g.words} ${pct(g.m)} ${g.m < 1 ? 'down' : 'up'}`);
  if (!said.length) return null;
  return `At ${age}, the years have your ${said.join(', ').replace(/, ([^,]*)$/, ' and $1')}.`;
}
