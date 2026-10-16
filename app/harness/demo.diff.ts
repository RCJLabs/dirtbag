// Phase 14.5b (Done-when 4): the demo's build holds none of the full game's content. Reads the
// full game's own content here, the places, lines, walls and rock past the demo's, Acts II to
// V and The Line, the expeditions and the Hollow, and looks for each of its words in what
// `npm run build:demo` wrote. Run after that build: `npx vitest run --mode diff`.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEMO_PLACES } from '../src/sim/content/demo';
import { EXPEDITIONS } from '../src/sim/content/expeditions';
import * as HOLLOW from '../src/sim/content/hollow';
import { PLACES } from '../src/sim/content/places';
import { ROCK_LINES, ROCK_MOVES } from '../src/sim/content/rock';
import { ROUTES, WALLS } from '../src/sim/content/routes';
import { ACT_PAID, LINE_SCENE, STORY } from '../src/sim/content/story';

const DIST = join(__dirname, '..', 'dist-demo');
const SRC = join(__dirname, '..', 'src');

function files(dir: string, kind: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory() ? files(join(dir, f.name), kind) : kind.test(f.name) ? [join(dir, f.name)] : [],
  );
}
const read = (dir: string, kind: RegExp) =>
  files(dir, kind)
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
// The strings a source spells out in quotes, its comments aside: one line at a time, as the
// game's source writes them.
const LITERAL = /'([^'\\\n]*)'|"([^"\\\n]*)"|`([^`\\$\n]*)`/g;
const literals = (text: string): string[] =>
  [...text.replace(/(^|\s)\/\/.*$/gm, '$1').matchAll(LITERAL)].map((m) => m[1] ?? m[2] ?? m[3]!);

// Every string in a piece of content but its ids. A line break splits a string, since the build
// may write it either way.
function words(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') {
    for (const part of x.split('\n').map((p) => p.trim()))
      if (part.length >= 4 && !/^[a-z0-9-]+$/.test(part)) out.push(part);
  } else if (Array.isArray(x)) for (const v of x) words(v, out);
  else if (x && typeof x === 'object') for (const v of Object.values(x)) words(v, out);
  return out;
}

const demoPlace = (id: string | undefined) => id !== undefined && DEMO_PLACES.includes(id);
const later = <T extends { place?: string }>(all: Record<string, T>) => {
  const kept = new Set(words(Object.values(all).filter((x) => demoPlace(x.place))));
  return { gone: Object.values(all).filter((x) => !demoPlace(x.place)), kept };
};

// The full game's content, by what it is. A string the demo's own content also uses (a shared
// crux's words, a pitch's kind) isn't the full game's, and stays out of the list; so does one
// the demo's own source says anywhere (every module but the full game's): a gym problem, a
// name Dex might give a line or a button can share a later line's words.
function stripped(): Record<string, string[]> {
  const own = new Set(literals(read(SRC, /^(?!.*\.(full|test)\.tsx?$).*\.tsx?$/)));
  const routes = later(ROUTES);
  const walls = later(WALLS);
  const placesGone = Object.entries(PLACES).filter(([id]) => !demoPlace(id));
  const placesKept = new Set(words(Object.entries(PLACES).filter(([id]) => demoPlace(id))));
  const actsKept = new Set(words([STORY[0], ACT_PAID[0]]));
  // The moves only the later lines climb.
  const keptLines = Object.keys(ROUTES).filter((id) => demoPlace(ROUTES[id]!.place));
  const keptMoves = new Set(keptLines.flatMap((id) => (ROCK_LINES[id] ?? []).flat()));
  const moves = Object.values(ROCK_MOVES).flatMap((m) => Object.entries(m));
  const rockKept = new Set(words(moves.filter(([id]) => keptMoves.has(id))));
  const groups: Record<string, [unknown, Set<string>]> = {
    // A wall's pitches take their cruxes from their kind, as the Long Prow's do.
    'the later lines': [routes.gone.map((r) => [r.name, r.line, r.wall ? [] : r.cruxes]), routes.kept],
    'the later walls': [walls.gone, walls.kept],
    'the later places': [placesGone.map(([, p]) => [p.name, p.away, p.here, p.locked, p.closed]), placesKept],
    'the later rock': [moves.filter(([id]) => !keptMoves.has(id)).map(([, m]) => m), rockKept],
    'Acts II to V and The Line': [[STORY.slice(1), ACT_PAID.slice(1), LINE_SCENE], actsKept],
    'the expeditions': [Object.values(EXPEDITIONS), new Set()],
    'the Hollow': [HOLLOW, new Set()],
    // And word for word: every string the full game's modules spell out, their painters'
    // colours included, that nothing else does.
    'the full game’s modules, word for word': [literals(read(SRC, /\.full\.tsx?$/)), new Set()],
  };
  return Object.fromEntries(
    Object.entries(groups).map(([k, [x, kept]]) => [
      k,
      [...new Set(words(x))].filter((w) => !kept.has(w) && !own.has(w)),
    ]),
  );
}

// A sentence is the full game's wherever it turns up. A name, or a few words, only as a string
// of its own: "The Prow" inside the Long Prow's line is the demo's. The short ones are looked
// for all at once, between any two quotes.
const SHORT = 25;
const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function inBuild(built: string, list: string[]): Set<string> {
  const short = list.filter((w) => w.length < SHORT);
  const found = new Set(list.filter((w) => w.length >= SHORT && built.includes(w)));
  if (short.length) {
    const any = new RegExp(`(?<=[\`'"])(?:${short.map(escape).join('|')})(?=[\`'"])`, 'g');
    for (const m of built.matchAll(any)) found.add(m[0]);
  }
  return found;
}

describe('the demo’s build', () => {
  it('holds none of the full game’s content', { timeout: 60_000 }, () => {
    const built = read(DIST, /\.(js|html|json|webmanifest)$/);
    const found: string[] = [];
    let checked = 0;
    for (const [group, list] of Object.entries(stripped())) {
      checked += list.length;
      expect(list.length, group).toBeGreaterThan(0);
      for (const w of inBuild(built, list)) found.push(`${group}: ${w}`);
    }
    console.log(`  ${checked} strings of the full game's checked; ${found.length} in the demo`);
    expect(found).toEqual([]);
  });
});
