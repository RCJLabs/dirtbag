// The demo's later close-up walls: none (Phase 14.5b). Its twin, wall.full.ts, is the full
// game's.
import type * as Full from './wall.full';

export const laterWalls: typeof Full.laterWalls = () => ({ topos: {}, paint: {}, faces: {} });
