// The demo's later rock: none (Phase 14.5b). Its twin, rock.full.ts, is the full game's.
import type { Rock } from '../dials';
import type { BetaDef } from './routes';

export function laterRock(): {
  moves: Record<Rock, Record<string, BetaDef>>;
  lines: Record<string, [string, string][]>;
} {
  return { moves: { granite: {}, quartzite: {}, sandstone: {}, gneiss: {}, limestone: {} }, lines: {} };
}
