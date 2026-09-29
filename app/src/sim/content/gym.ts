// Send City's bouldering wall, reset every week, as v0.956 did: grades V0–V5 across six
// problems, styles drawn from its list, names from its pool (docs: the bundle's `yC` and
// `jte`). The set is a pure function of the seed and the week, so nothing is saved but
// your logs on each problem.

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

// Any route or problem by id. Gym problems live only in their week's set; the id carries
// the week, so an old problem still resolves for its log.
export function routeById(seed: string, id: string): RouteDef | undefined {
  const fixed = ROUTES[id];
  if (fixed) return fixed;
  const m = /^sc-(\d+)-(\d+)$/.exec(id);
  if (!m) return undefined;
  return gymSet(seed, Number(m[1]))[Number(m[2]) - 1];
}

// The lines you can walk up to at a place today.
export function routesAt(seed: string, place: string, day: number): RouteDef[] {
  if (place === GYM) return gymSet(seed, weekOf(day));
  return Object.values(ROUTES).filter((r) => r.place === place);
}
