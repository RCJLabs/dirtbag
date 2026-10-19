// Phase 44.2: your set on the wall. A set you hang stays up till the week's reset, a problem
// like the gym's own, named by you. The gym's problems are made from the seed and yours isn't,
// so its id carries it: the day it went up, then each hold's place in the bucket's list and
// its square, across and up (`ys-<day>-<hold><across><up>…`). Whatever looks a line up by its
// id finds it, a set from weeks ago included, and nothing new is saved but its name.

import type { Style } from './climber';
import { libraryBoulder, type RouteDef } from './content/routes';
import { SET_MOVES, SET_NAMES, SET_WALLS, type Crowd, type Wall } from './content/setting';
import { SETTING } from './dials';
import { setGrade, setMoves, type Cell } from './setpanel';

const IDS = Object.keys(SET_MOVES);
const GYM = 'gym';

// A set's id, from the day it went up and its holds, bottom to top, on their squares. The
// panel's sides stay under ten squares, so a square is two digits.
export const setId = (day: number, ids: readonly string[], cells: readonly Cell[]): string =>
  `ys-${day}-${ids.map((id, i) => `${IDS.indexOf(id).toString(36)}${cells[i]![0]}${cells[i]![1]}`).join('')}`;

// The day, holds and squares an id carries, or null when it isn't a set's.
export function setOf(id: string): { day: number; ids: string[]; cells: Cell[] } | null {
  const m = /^ys-(\d+)-((?:[0-9a-z]\d\d)+)$/.exec(id);
  if (!m) return null;
  const ids: string[] = [];
  const cells: Cell[] = [];
  for (let i = 0; i < m[2]!.length; i += 3) {
    const hold = IDS[parseInt(m[2]![i]!, 36)];
    if (!hold) return null;
    ids.push(hold);
    cells.push([Number(m[2]![i + 1]), Number(m[2]![i + 2])]);
  }
  return { day: Number(m[1]), ids, cells };
}

// A set as a problem on the wall: a boulder with one crux, the move to its hardest hold,
// graded as the panel graded it, in the style of that hold (or of the first hold that isn't a
// rest, should a long reach make a rest the hardest).
export function setRoute(id: string): RouteDef | undefined {
  const set = setOf(id);
  if (!set) return undefined;
  const moves = setMoves(set.ids, set.cells);
  const grade = Math.min(18, setGrade(moves));
  const top = Math.max(...moves.map((m) => m.hard));
  const at = moves.findIndex((m) => m.hard === top);
  const hold = moves[at]!;
  const kind = hold.kind === 'rest' ? moves.find((m) => m.kind !== 'rest')?.kind : hold.kind;
  const n = set.ids.length + 1;
  return libraryBoulder(id, 'Your set', grade, (kind ?? 'technical') as Style, GYM, {
    moves: n,
    from: at,
    to: Math.min(n - 0.2, at + 1.4),
    cruxName: `The ${hold.name.toLowerCase()}`,
    heightFt: 13,
    line: `Your set, up since day ${set.day}: ${set.ids.length} holds on the panel. Tape says V${grade}.`,
  });
}

// Names to give a set as it's hung: its crux hold's, the wall's and the week's crowd's.
export function setNameIdeas(
  wall: Wall,
  crowd: Crowd,
  ids: readonly string[],
  cells: readonly Cell[],
): string[] {
  const moves = setMoves(ids, cells);
  const top = Math.max(0, ...moves.map((m) => m.hard));
  const hold = moves.find((m) => m.hard === top);
  return [
    ...(hold ? [SET_NAMES.crux.replace('{hold}', hold.name)] : []),
    SET_NAMES.wall[wall] ?? SET_WALLS[wall].name,
    SET_NAMES.crowd[crowd],
  ];
}

// A name as given, spaces tidied and cut to length; too short, and it's the first idea.
export function setNameOf(given: string | undefined, ideas: readonly string[]): string {
  const name = (given ?? '').replace(/\s+/g, ' ').trim().slice(0, SETTING.name.max).trim();
  return name.length >= SETTING.name.min ? name : (ideas[0] ?? 'Your set');
}
