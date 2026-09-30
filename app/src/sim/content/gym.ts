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
import type { SkillId } from '../types';
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
// Board grades run stiff, as real boards' do: each problem climbs like the grade above its
// label (Evan's call, 29 Sep 2026). It keeps the V7 a month-two project, not a fluke.
export const BOARD_STIFF = 1;
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
      trueGrade: grade + BOARD_STIFF,
      board: true,
    });
  });
  cache.set(key, set);
  return set;
}

// ---- The Cave: v0.956's "steep bouldering cave, no ropes, just hard plastic" ----
// Eight problems a week, V3 to V10 (v0.956's grades), mostly power and crimps as its were,
// set on the steep walls of a cave by the trailhead.

export const CAVE = 'cave';
const CAVE_GRADES = [3, 4, 5, 6, 7, 8, 9, 10];
// v0.956's Cave: power three times in six, crimps twice, a dyno once.
const CAVE_TYPES: Style[] = ['power', 'crimp', 'dyno', 'power', 'crimp', 'power'];
const CAVE_NAMES: Record<Style, string[]> = {
  power: [
    'Ceiling Crawl',
    'The Low Roof',
    'Undercut Engine',
    'Stalactite',
    'Lip Service',
    'Heel Hook Grotto',
  ],
  crimp: ['Razor Rail', 'Cave Crimps', 'Fingertip Cavern', 'Dark Edges', 'The Pocket Pull'],
  dyno: ['The Echo', 'Bat Out of Hell', 'Leap in the Dark'],
  technical: ['Toe Hook Trap', 'Kneebar Cave'],
  endurance: ['The Round Trip'],
  crack: ['The Fissure'],
};

// The week's eight problems, left to right, easiest to hardest.
export function caveSet(seed: string, week: number): RouteDef[] {
  const key = `${seed}#cave${week}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = Rng.fromStream(seed, 'worldgen').derive(`cave-w${week}`);
  const used = new Set<string>();
  const set = CAVE_GRADES.map((grade, i) => {
    const type = CAVE_TYPES[rng.int(0, CAVE_TYPES.length - 1)]!;
    const own = CAVE_NAMES[type].filter((n) => !used.has(n));
    const pool = own.length
      ? own
      : Object.values(CAVE_NAMES)
          .flat()
          .filter((n) => !used.has(n));
    const name = pool[rng.int(0, pool.length - 1)]!;
    used.add(name);
    const moves = rng.int(5, 8);
    const from = Math.round(moves * rng.float(0.4, 0.6) * 100) / 100;
    return libraryBoulder(`cv-${week}-${i + 1}`, name, grade, type, CAVE, {
      moves,
      from,
      to: Math.round((from + rng.float(1.3, 1.9)) * 100) / 100,
      cruxName: CRUX_NAME[type],
      heightFt: 12,
      line: `${moves} moves out the cave's roof. Tape says V${grade}.`,
    });
  });
  cache.set(key, set);
  return set;
}

// The indoor places: the tag your day pass leaves on your hand, the skills each place's
// setting brings on faster (v0.956's gym specialties), and its closing time.
export const INDOOR: Record<string, { pass: string; specialty: SkillId[]; name: string }> = {
  [GYM]: { pass: 'pass', specialty: ['technique', 'endurance'], name: 'Send City' },
  [CAVE]: { pass: 'cavepass', specialty: ['power', 'fingers'], name: 'The Cave' },
};
export const indoor = (place: string): boolean => place in INDOOR;
export const INDOOR_CLOSE = 22 * 60;

// Any route or problem by id. Gym problems live only in their set; the id carries its week
// (or the board's block), so an old problem still resolves for its log.
export function routeById(seed: string, id: string): RouteDef | undefined {
  const fixed = ROUTES[id];
  if (fixed) return fixed;
  const m = /^(sc|bd|cv)-(\d+)-(\d+)$/.exec(id);
  if (!m) return undefined;
  const set =
    m[1] === 'bd'
      ? boardSet(seed, Number(m[2]))
      : m[1] === 'cv'
        ? caveSet(seed, Number(m[2]))
        : gymSet(seed, Number(m[2]));
  return set[Number(m[3]) - 1];
}

// The lines you can walk up to at a place today: at the gym, the week's wall, then the board.
export function routesAt(seed: string, place: string, day: number): RouteDef[] {
  if (place === GYM) return [...gymSet(seed, weekOf(day)), ...boardSet(seed, blockOf(day))];
  if (place === CAVE) return caveSet(seed, weekOf(day));
  // A wall's pitches aren't lines you walk up to: they're climbed from the wall, in turn.
  return Object.values(ROUTES).filter((r) => r.place === place && !r.wall);
}
