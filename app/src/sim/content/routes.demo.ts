// The demo's later crags: none (Phase 14.5b). Its twin, routes.full.ts, is the full game's.
import type { RouteDef, WallDef } from './routes';

export function laterLines(): {
  lines: Record<string, RouteDef>;
  pitches: RouteDef[];
  walls: Record<string, WallDef>;
} {
  return { lines: {}, pitches: [], walls: {} };
}
