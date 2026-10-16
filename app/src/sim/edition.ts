// Phase 14.5 (Evan's call): which game this build is: the demo (content/demo.ts) or all of it.
// Set when the game is built (vite's define, from `--mode demo`). The tests and the harness
// play the whole game unless a test asks for the demo's rules. It reads nothing but the demo's
// places, so anything can ask it, at any time (its end is demo.ts's).
import { DEMO_PLACES } from './content/demo';

declare const __DEMO__: boolean | undefined;

export let DEMO: boolean = typeof __DEMO__ !== 'undefined' && __DEMO__ === true;

// For tests: the demo's rules, without building it.
export function asDemo(on: boolean): void {
  DEMO = on;
}

// Whether a place is in this build: everywhere in the full game, the demo's few in the demo.
export const inEdition = (id: string): boolean => !DEMO || DEMO_PLACES.includes(id);
