// Phase 14.5 (Evan's call): which game this build is: the demo (content/demo.ts) or all of it.
// Set when the game is built (vite's define, from `--mode demo`); and since 19.1, whether the
// full game is playing the demo's rules till it's unlocked. The tests and the harness
// play the whole game unless a test asks for the demo's rules. It reads nothing but the demo's
// places, so anything can ask it, at any time (its end is demo.ts's).
import { DEMO_PLACES } from './content/demo';

declare const __DEMO__: boolean | undefined;

// Built as the demo: the stripped build, with keys of its own and a full game's save turned away.
export let DEMO_BUILD: boolean = typeof __DEMO__ !== 'undefined' && __DEMO__ === true;

// The demo's rules: always in the demo's build; in the full game's, while it's locked (Phase
// 19.1, game/unlock.ts, set once at start-up before the game boots).
export let DEMO: boolean = DEMO_BUILD;

// The demo's rules on or off: for the full game's gate at start-up, and for tests. The demo's
// build keeps them on.
export function asDemo(on: boolean): void {
  DEMO = DEMO_BUILD || on;
}

// For tests: the demo's build itself (its keys, its turning a full game's save away), not only
// its rules.
export function asDemoBuild(on: boolean): void {
  DEMO_BUILD = on;
  DEMO = on;
}

// Whether a place is in this build: everywhere in the full game, the demo's few in the demo.
export const inEdition = (id: string): boolean => !DEMO || DEMO_PLACES.includes(id);
