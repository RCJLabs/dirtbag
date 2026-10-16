// Phase 14.5 (Evan's call): which game this build is: the demo (content/demo.ts) or all of it.
// Set when the game is built (vite's define, from `--mode demo`). The tests and the harness
// play the whole game unless a test asks for the demo's rules.
import { DEMO_PLACES } from './content/demo';
import { RACE_ROUTE } from './content/people';
import { STORY } from './content/story';
import type { GameState } from './types';

declare const __DEMO__: boolean | undefined;

export let DEMO: boolean = typeof __DEMO__ !== 'undefined' && __DEMO__ === true;

// For tests: the demo's rules, without building it.
export function asDemo(on: boolean): void {
  DEMO = on;
}

// Whether a place is in this build: everywhere in the full game, the demo's few in the demo.
export const inEdition = (id: string): boolean => !DEMO || DEMO_PLACES.includes(id);

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
