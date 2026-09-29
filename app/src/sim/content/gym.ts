// Send City's bouldering wall, reset every week, as v0.956 did: grades V0–V5 across six
// problems, styles drawn from its list, names from its pool (docs: the bundle's `yC` and
// `jte`). The set is a pure function of the seed and the week, so nothing is saved but
// your logs on each problem.
//
// Beside it, the board: a steep panel where the gym keeps its hard problems, V4–V7. They
// stay up four weeks, so a project carries over (v0.956's "persistent gym walls", Phase
// 10), and a wet day late in the season still has something new to try.

import { Rng } from '../rng';
import type { Style } from '../climber';
import { libraryBoulder, ROUTES, type RouteDef } from './routes';

export const GYM = 'gym';
export const WEEK_DAYS = 7;

// v0.956's Send City: its style list (drawn from, with repeats) and its 26 problem names.
// v0.956 drew a name and a style separately, which could hang crimp beta on "Dyno Lunge";
// here each name sits with the style it describes, and a problem takes a name from its own.
const TYPES: Style[] = ['crimp', 'technical', 'power', 'endurance', 'technical', 'crimp', 'dyno'];
const NAMES: Record<Style, string[]> = {
  crimp: ['Crimp Ladder', 'The Crimp Rail', 'Sidepull City', 'Gaston Gauntlet', 'Pinch Block'],
  technical: [
    'The Arête',
    'Slab Dance',
    'Drop-Knee',
    'Toe-Hook Tango',
    'Mantle Madness',
    'Slopey Topout',
    'Heel-Hook Hell',
  ],
  power: ['Compression', 'Powerband', 'The Campus', 'Roof Romp', 'Tension Block', 'The Prow'],
  endurance: ['The Traverse', 'Volume Stack', 'Sit-Start Special', 'Sloper Heaven'],
  dyno: ['Dyno Lunge', 'Sloper Slap', 'Pocket Rocket'],
  crack: ['Crack the Code'],
};
const CRUX_NAME: Record<Style, string> = {
  crimp: 'The crimps',
  technical: 'The slab',
  power: 'The big move',
  endurance: 'The pump',
  dyno: 'The dyno',
  crack: 'The crack',
};

export const weekOf = (day: number): number => Math.floor((day - 1) / WEEK_DAYS) + 1;

// The board's reset: every BOARD_WEEKS weeks, from the first morning.
export const BOARD_WEEKS = 4;
export const blockOf = (day: number): number => Math.floor((day - 1) / (WEEK_DAYS * BOARD_WEEKS)) + 1;
// One problem at each grade, easiest on the left.
const BOARD_GRADES = [4, 5, 6, 7];
// Board climbing is steep: power and fingers, the odd big move, footwork to stay on.
const BOARD_TYPES: Style[] = ['power', 'crimp', 'power', 'crimp', 'dyno', 'technical'];
const BOARD_NAMES: Record<Style, string[]> = {
  power: ['Forty Degrees', 'The Compression Line', 'Undercling Engine', 'Heel Machine', 'Squeeze'],
  crimp: ['Micro Crimps', 'Thin Edges', 'Left Hand Only', 'The Pinch Ladder', 'Nails'],
  dyno: ['Dead Point', 'The Long Move', 'Double Clutch'],
  technical: ['Toe-Hook Tension', 'Kneebar Special', 'The Sequence'],
  endurance: ['The Circuit'],
  crack: ['The Jam'],
};

const cache = new Map<string, RouteDef[]>();

// The week's six problems, left to right along the wall, easiest to hardest.
export function gymSet(seed: string, week: number): RouteDef[] {
  const key = `${seed}#${week}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = Rng.fromStream(seed, 'worldgen').derive(`sendcity-w${week}`);
  const used = new Set<string>();
  const set: RouteDef[] = [];
  for (let i = 0; i < 6; i++) {
    const type = TYPES[rng.int(0, TYPES.length - 1)]!;
    // A week heavy on one style can run out of its names; then any unused name will do.
    const own = NAMES[type].filter((n) => !used.has(n));
    const pool = own.length
      ? own
      : Object.values(NAMES)
          .flat()
          .filter((n) => !used.has(n));
    const name = pool[rng.int(0, pool.length - 1)]!;
    used.add(name);
    const moves = rng.int(5, 8);
    const from = Math.round(moves * rng.float(0.35, 0.55) * 100) / 100;
    set.push(
      libraryBoulder(`sc-${week}-${i + 1}`, name, i, type, GYM, {
        moves,
        from,
        to: Math.round((from + rng.float(1.2, 1.8)) * 100) / 100,
        cruxName: CRUX_NAME[type],
        heightFt: 13,
        line: `${moves} moves on plastic. Tape says V${i}.`,
      }),
    );
  }
  cache.set(key, set);
  return set;
}

// The board's problems for a block of weeks, V4 to V7, left to right.
export function boardSet(seed: string, block: number): RouteDef[] {
  const key = `${seed}#board${block}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = Rng.fromStream(seed, 'worldgen').derive(`sendcity-board-${block}`);
  const used = new Set<string>();
  const set = BOARD_GRADES.map((grade, i) => {
    const type = BOARD_TYPES[rng.int(0, BOARD_TYPES.length - 1)]!;
    const own = BOARD_NAMES[type].filter((n) => !used.has(n));
    const pool = own.length
      ? own
      : Object.values(BOARD_NAMES)
          .flat()
          .filter((n) => !used.has(n));
    const name = pool[rng.int(0, pool.length - 1)]!;
    used.add(name);
    const moves = rng.int(6, 9);
    const from = Math.round(moves * rng.float(0.4, 0.6) * 100) / 100;
    return libraryBoulder(`bd-${block}-${i + 1}`, name, grade, type, GYM, {
      moves,
      from,
      to: Math.round((from + rng.float(1.4, 2)) * 100) / 100,
      cruxName: CRUX_NAME[type],
      heightFt: 12,
      line: `${moves} moves on the board. It stays up ${BOARD_WEEKS} weeks.`,
      board: true,
    });
  });
  cache.set(key, set);
  return set;
}

// Any route or problem by id. Gym problems live only in their set; the id carries its week
// (or the board's block), so an old problem still resolves for its log.
export function routeById(seed: string, id: string): RouteDef | undefined {
  const fixed = ROUTES[id];
  if (fixed) return fixed;
  const m = /^(sc|bd)-(\d+)-(\d+)$/.exec(id);
  if (!m) return undefined;
  const set = m[1] === 'bd' ? boardSet(seed, Number(m[2])) : gymSet(seed, Number(m[2]));
  return set[Number(m[3]) - 1];
}

// The lines you can walk up to at a place today: at the gym, the week's wall, then the board.
export function routesAt(seed: string, place: string, day: number): RouteDef[] {
  if (place === GYM) return [...gymSet(seed, weekOf(day)), ...boardSet(seed, blockOf(day))];
  return Object.values(ROUTES).filter((r) => r.place === place);
}
