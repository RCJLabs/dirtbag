// Climbing above your grade (Phase 16, Evan's call; OVER says why). How far one style
// carries you is capped by your grade; past a grade over, windows close faster and shut at
// the limit; and from a grade and a half over, a line gains cruxes, moves that are only
// moves for someone who climbs the grade. The added cruxes are yours alone: the topo shows
// the line's own.

import { average, levelOf, mix, type Style } from './climber';
import { effGrade, type CruxDef, type RouteDef } from './content/routes';
import { OVER } from './dials';
import type { GameState } from './types';

// Your level in a style, as far as your grade lets it count.
export const reachOf = (s: GameState, style: Style): number =>
  Math.min(levelOf(mix(s.climber.skills, style)), levelOf(average(s.climber.skills)) + OVER.specialist);

// How far above (−) or below (+) a grade you climb in a style, in grades, with that cap.
export const reachMargin = (s: GameState, style: Style, grade: number): number => reachOf(s, style) - grade;

// The cruxes a line gains for you, over it in its own style: one from `cruxFrom` grades
// over, one more each grade on, up to `most`.
export function extraCruxes(s: GameState, r: RouteDef): number {
  const over = -reachMargin(s, r.type, effGrade(r));
  return over < OVER.cruxFrom ? 0 : Math.min(OVER.most, Math.floor(over - OVER.cruxFrom) + 1);
}

// Whether a line is past the limit for you: its style that far over your reach, by the grade
// it's given, so a sandbag doesn't give itself away (its windows still shut at its true one).
export const beyond = (s: GameState, r: RouteDef): boolean => reachMargin(s, r.type, r.grade) <= -OVER.limit;

const NAMES = ['A move that’s a crux for you', 'Another one'];
const PAD = 0.4;
const round = (x: number) => Math.round(x * 100) / 100;

// The widest stretch of the line with no crux and no rest in it, as [from, to]; on a rope,
// above the first bolt or stance, so a crux of yours is never a fall to the ground.
function freeStretch(r: RouteDef, cruxes: CruxDef[]): [number, number] | null {
  const busy: [number, number][] = cruxes.map((c) => [c.from - PAD, c.to + PAD]);
  if (r.rest) busy.push([r.rest.at - r.rest.radius - PAD, r.rest.at + r.rest.radius + PAD]);
  busy.sort((a, b) => a[0] - b[0]);
  let best: [number, number] | null = null;
  const first = r.disc === 'boulder' ? undefined : r.disc === 'trad' ? r.stances?.[0] : r.bolts[0];
  let at = (first ?? 0) + 0.6;
  const end = r.moves - 0.4;
  for (const [a, b] of [...busy, [end, end] as [number, number]]) {
    const to = Math.min(a, end);
    if (to - at > (best ? best[1] - best[0] : 0)) best = [at, to];
    at = Math.max(at, b);
  }
  return best;
}

// The line as you'll meet it on this go: its cruxes, and the ones it gains for you, in the
// longest free stretches, each borrowing the beta of the line's own crux nearest it.
export function overhead(s: GameState, r: RouteDef): RouteDef {
  const n = extraCruxes(s, r);
  if (!n || !r.cruxes.length) return r;
  const cruxes = [...r.cruxes];
  const added: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    const gap = freeStretch(r, cruxes);
    if (!gap || gap[1] - gap[0] < 0.5) break;
    const len = Math.min(1.2, gap[1] - gap[0]);
    const mid = (gap[0] + gap[1]) / 2;
    const at: [number, number] = [round(mid - len / 2), round(mid + len / 2)];
    added.push(at);
    cruxes.push({ id: '', name: '', from: at[0], to: at[1], win: '', beta: [] });
  }
  const mid = (c: { from: number; to: number }) => (c.from + c.to) / 2;
  const extras = added
    .sort((a, b) => a[0] - b[0])
    .map(([from, to], k): CruxDef => {
      const src = [...r.cruxes].sort(
        (a, b) => Math.abs(mid(a) - (from + to) / 2) - Math.abs(mid(b) - (from + to) / 2),
      )[0]!;
      return {
        id: `${src.id}+${k + 1}`,
        name: NAMES[k] ?? NAMES[1]!,
        from,
        to,
        win: 'Through that one.',
        beta: src.beta,
        of: src.id,
      };
    });
  return { ...r, cruxes: [...r.cruxes, ...extras].sort((a, b) => a.from - b.from) };
}
