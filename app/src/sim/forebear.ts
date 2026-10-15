// Phase 31.2: the old climber stays in the valley. They're at the fire at the Lot the first
// night you're there after dark, and some nights after (FAMILY.fire); they tell it from what
// the family kept of their life, and give beta on the lines they sent (their first ascents
// among them), the next thing you don't know on the one of theirs you've worked most.

import { walk } from './ambient';
import { isNight } from './cond';
import { FOREBEAR_LINES, type ForebearNeed } from './content/forebear';
import { routeById } from './content/gym';
import { MARK_NAME, type Mark } from './content/injuries';
import type { RouteDef } from './content/routes';
import { sprayable } from './crowds';
import { FACTION, FAMILY } from './dials';
import { fill } from './format';
import { kinLine } from './heir';
import { Rng } from './rng';
import type { GameState } from './types';

export const MET = 'forebear-met';
const heardId = (i: number) => `forebear-line-${i}`;

// Whether they're at the fire tonight: always, till you've sat with them once.
export function forebearAtFire(s: GameState): boolean {
  if (!s.family || s.at !== 'lot' || !isNight(s.min)) return false;
  if (!s.seen.includes(MET)) return true;
  return Rng.fromStream(s.seed, 'events').derive(`forebear-fire-${s.day}`).next() < FAMILY.fire;
}

// The lines they sent: the family's record of it, or for an heir from before Phase 31, the
// first ascents, which are sends too.
export function theirLines(s: GameState): string[] {
  const f = s.family;
  if (!f) return [];
  return [...new Set([...(f.career?.sent ?? []), ...f.lines])];
}

const nameOf = (s: GameState, r: RouteDef): string => s.firsts[r.id]?.name ?? r.name;

// The line of theirs they'd tell you about tonight: one you haven't sent with something left
// to tell; the one you've had most goes on, then the easiest.
export function betaLine(s: GameState): RouteDef | null {
  const lines = theirLines(s)
    .map((id) => routeById(s.seed, id))
    .filter((r): r is RouteDef => !!r && sprayable(s, r).length > 0)
    .sort((a, b) => (s.routes[b.id]?.goes ?? 0) - (s.routes[a.id]?.goes ?? 0) || a.grade - b.grade);
  return lines[0] ?? null;
}

// Their hardest send outside, by name.
function hardest(s: GameState): RouteDef | null {
  const sent = (s.family?.career?.sent ?? [])
    .map((id) => routeById(s.seed, id))
    .filter((r): r is RouteDef => !!r)
    .sort((a, b) => b.grade - a.grade);
  return sent[0] ?? null;
}

// What fills their lines.
export function forebearWords(s: GameState): Record<string, string> {
  const c = s.family?.career;
  const h = hardest(s);
  const p = c?.project ? routeById(s.seed, c.project) : undefined;
  const scar = c?.scars[0];
  return {
    forebear: s.family?.forebear ?? '',
    you: s.climber.name,
    hardest: h ? nameOf(s, h) : '',
    fa: kinLine(s)?.name ?? '',
    project: p ? nameOf(s, p) : '',
    scar: scar ? (MARK_NAME[scar as Mark] ?? scar) : '',
    summit: c?.summits[0] ?? '',
    crew: c?.crew ?? '',
  };
}

// Whether the family kept what a line names.
function holds(s: GameState, need: ForebearNeed, w: Record<string, string>): boolean {
  const c = s.family?.career;
  if (need === 'body' || need === 'chose' || need === 'home') return c?.how === need;
  if (need === 'oldHigh') return !!c && c.old >= FACTION.bands[2]!;
  if (need === 'oldLow') return !!c && c.old < FACTION.bands[1]!;
  return !!w[need];
}

// What they say tonight: the first line you haven't heard that they can say, in order; then
// one of those walked by the seed. `fresh` marks it heard.
export function forebearSays(s: GameState): { id: string; text: string; fresh: boolean } {
  const w = forebearWords(s);
  const open = FOREBEAR_LINES.map((l, i) => ({ l, i })).filter(({ l }) => !l.needs || holds(s, l.needs, w));
  const next = open.find(({ i }) => !s.seen.includes(heardId(i)));
  if (next) return { id: heardId(next.i), text: fill(next.l.text, w), fresh: true };
  return {
    id: '',
    text: fill(
      walk(
        s.seed,
        'forebear',
        open.map(({ l }) => l.text),
        s.day,
      ),
      w,
    ),
    fresh: false,
  };
}

// Why you can't sit with them, or ask, right now.
export function forebearBlocked(s: GameState, what: 'talk' | 'beta'): string | null {
  if (!s.family) return 'Nobody here climbed before you.';
  if (!forebearAtFire(s)) return `${s.family.forebear} isn’t at the fire tonight.`;
  if (s.today.includes(`forebear-${what}`))
    return what === 'talk' ? 'You’ve sat with them tonight.' : 'You’ve asked them tonight.';
  return null;
}
