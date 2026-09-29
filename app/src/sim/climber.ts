// You, as a climber: v0.956's five skills, its grade curve and its per-style skill mixes
// (docs/audit/climbing.md §2.1, §2.9). What changes from v0.956 is where the numbers land.
// There is no odds roll: your skills set how wide each crux's window is.

import type { Skills, SkillId } from './types';
import { LEGACY, WINDOW } from './dials';

// The six styles a route or a sequence can ask for.
export type Style = 'crimp' | 'power' | 'endurance' | 'technical' | 'dyno' | 'crack';

export const SKILLS: SkillId[] = ['power', 'fingers', 'endurance', 'technique', 'head'];

// Each style leans 65/35 on two skills, as in v0.956, so a specialist climbs above their
// grade in their own style and below it in others.
export const MIX: Record<Style, [SkillId, SkillId]> = {
  crimp: ['fingers', 'technique'],
  power: ['power', 'fingers'],
  endurance: ['endurance', 'technique'],
  technical: ['technique', 'head'],
  dyno: ['power', 'head'],
  crack: ['technique', 'fingers'],
};

export interface Start {
  name: string;
  blurb: string;
  skills: Skills;
}

// v0.956's archetypes, word for word.
export const STARTS: Record<string, Start> = {
  boulderer: {
    name: 'The Boulderer',
    blurb: 'Short, powerful problems: explosive pulls and strong fingers.',
    skills: { power: 12, fingers: 10, endurance: 4, technique: 5, head: 6 },
  },
  ropegun: {
    name: 'The Rope Gun',
    blurb: 'Long routes and a cool head: built to endure and commit.',
    skills: { power: 5, fingers: 5, endurance: 13, technique: 5, head: 11 },
  },
  technician: {
    name: 'The Technician',
    blurb: 'Precise feet, efficient movement, quiet control.',
    skills: { power: 5, fingers: 9, endurance: 5, technique: 13, head: 7 },
  },
  allrounder: {
    name: 'The All-Rounder',
    blurb: 'Balanced everywhere: no glaring weakness, no specialty.',
    skills: { power: 8, fingers: 8, endurance: 8, technique: 8, head: 8 },
  },
};

// A climber who came across from v0.956 rather than picking a start: their own skills, as
// far as the cap allows.
export const CARRIED = 'v0956';
export const CARRIED_NAME = 'An old hand';

// What a start is called: one of the four, or someone back from v0.956.
export const startName = (id: string): string =>
  STARTS[id]?.name ?? (id === CARRIED ? CARRIED_NAME : 'A climber');

// The grade curve: a skill average of 8g + 2.4g² climbs grade g. V1 is 10, V3 46, V5 100.
export const needFor = (g: number): number => 8 * g + 2.4 * g * g;

// The continuous grade a skill level climbs at: the curve's inverse.
export const levelOf = (skill: number): number => (-8 + Math.sqrt(64 + 9.6 * Math.max(0, skill))) / 4.8;

export const average = (s: Skills): number => (s.power + s.fingers + s.endurance + s.technique + s.head) / 5;

// Five skills, whole and non-negative, read from something that isn't trusted (an old save
// from v0.956); null if it doesn't read as that.
export function asSkills(k: unknown): Skills | null {
  if (typeof k !== 'object' || k === null) return null;
  const v = k as Record<string, unknown>;
  const s: Skills = { power: 0, fingers: 0, endurance: 0, technique: 0, head: 0 };
  for (const id of SKILLS) {
    const x = v[id];
    if (typeof x !== 'number' || !Number.isFinite(x) || x < 0) return null;
    s[id] = x;
  }
  return s;
}

// A v0.956 climber's skills as they come across: scaled down to the cap if they climbed
// harder than it, in their own shape. Null if they don't read as five skills.
export function carried(k: unknown): Skills | null {
  const s = asSkills(k);
  if (!s) return null;
  // Just over the cap's threshold, so rounding can't drop it a grade.
  const most = needFor(LEGACY.capGrade) + 0.05;
  const avg = average(s);
  const f = avg > most ? most / avg : 1;
  for (const id of SKILLS) s[id] = Math.round(s[id] * f * 100) / 100;
  return s;
}

// Your displayed grade, as in v0.956: the average of all five, head included.
export const gradeOf = (s: Skills): number => Math.min(18, Math.floor(levelOf(average(s))));

export const mix = (s: Skills, style: Style): number => {
  const [a, b] = MIX[style];
  return 0.65 * s[a] + 0.35 * s[b];
};

// How far above (+) or below (−) a grade you climb in a style, in grades.
export const margin = (s: Skills, style: Style, grade: number): number => levelOf(mix(s, style)) - grade;

// A window's width against your margin: open below your level, closing fast above it
// (WINDOW says why).
export const windowFactor = (m: number): number =>
  m >= 0
    ? Math.min(WINDOW.widest, 1 + WINDOW.easier * m)
    : Math.max(WINDOW.narrowest, Math.exp(WINDOW.harder * m));

// Endurance (with technique, as the endurance style) sets how fast you pump against the
// route's grade: a fit climber on an easy route barely pumps, and a stamina-poor climber
// over their head pumps half again as fast.
export const pumpFactor = (s: Skills, grade: number): number =>
  Math.min(1.5, Math.max(0.6, 1 - 0.12 * margin(s, 'endurance', grade)));

// v0.956's diminishing return: 1 at nothing, 0.29 at V5 skill, 0.11 at V10.
export const hi = (skill: number): number => 1 / (1 + skill / 40);

export interface GoSummary {
  grade: number;
  sent: boolean;
  // Share of the route climbed, 0..1.
  progress: number;
  // The route's own style, and the style of each crux sequence you tried.
  type: Style;
  styles: Style[];
}

const round2 = (v: number) => Math.round(v * 100) / 100;

// What a go teaches you. v0.956's formula: a base by grade and result, scaled up for sends
// at or above your grade, then split: the route's style takes 60%, the sequences you
// actually tried take 40%. Each style's first skill gets the full share and its second
// half, both through hi(), so gains slow as a skill grows.
export function gains(s: Skills, go: GoSummary): Partial<Skills> {
  const g = go.grade;
  const cur = gradeOf(s);
  const base = go.sent ? 8 + 1.4 * g : 4 + 0.7 * g;
  const reach = go.sent ? 1 : 0.45 + 0.55 * Math.max(0, Math.min(1, go.progress));
  const stretch = go.sent && g >= cur ? 1 + 0.4 * (g - cur + 1) : 1;
  const total = base * reach * stretch;
  const out: Partial<Skills> = {};
  const add = (style: Style, share: number) => {
    const [a, b] = MIX[style];
    out[a] = (out[a] ?? 0) + total * share * hi(s[a]);
    out[b] = (out[b] ?? 0) + (total * share * hi(s[b])) / 2;
  };
  add(go.type, go.styles.length ? 0.6 : 1);
  for (const st of go.styles) add(st, 0.4 / go.styles.length);
  for (const k of SKILLS) if (out[k] !== undefined) out[k] = round2(out[k]!);
  return out;
}
