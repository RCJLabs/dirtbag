// Phase 14.5 (Evan's calls): where the demo ends. Act I, then Dex's race week; over the morning
// after the race is decided, and nothing more happens in it (game.ts refuses).
import { routeById } from './content/gym';
import { RACE_ROUTE } from './content/people';
import { WALLS } from './content/routes';
import { STORY } from './content/story';
import { DEMO, inEdition } from './edition';
import type { GameState } from './types';

// The day Dex's race was decided: Dex's first ascent overnight, or your send. Null till then.
export function raceDecided(s: GameState): number | null {
  const fa = s.firsts[RACE_ROUTE];
  if (fa) return fa.day;
  return s.routes[RACE_ROUTE]?.sent?.day ?? null;
}

// The demo's over the morning after the race is decided, once Act I's done: a last day either
// way, and never on top of the send that won it.
export function demoOver(s: GameState): boolean {
  if (!DEMO || s.goals < STORY[0]!.goals.length) return false;
  const d = raceDecided(s);
  return d !== null && s.day > d;
}

// A climber from the full game (Phase 14.5b): somewhere, or with a line, a wall or a trip, the
// demo hasn't got. The demo turns the save away (save.ts) rather than play half of it; it
// plays in the full game. Read before the save is checked, so it takes nothing on trust.
export function fromFullGame(state: unknown): boolean {
  if (typeof state !== 'object' || state === null) return false;
  const s = state as Partial<GameState>;
  const keys = (x: unknown) => (typeof x === 'object' && x !== null ? Object.keys(x) : []);
  const list = (x: unknown) => (Array.isArray(x) ? (x as unknown[]) : []);
  const places = [s.at, ...list(s.unlocked), ...keys(s.guides)];
  if (places.some((id) => typeof id === 'string' && !inEdition(id))) return true;
  const lines = [...keys(s.routes), ...keys(s.firsts)];
  if (
    lines.some((id) => {
      const r = routeById(String(s.seed), id);
      return !r || !inEdition(r.place);
    })
  )
    return true;
  return (!!s.wall && !WALLS[s.wall.id]) || !!s.expedition || list(s.book).length > 0;
}
