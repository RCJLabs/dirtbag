// The demo's later crags' looks: none (Phase 14.5b). Its twin, scenes.full.ts, is the full
// game's.
import type * as Full from './scenes.full';

export const laterScenes: typeof Full.laterScenes = () => ({
  looks: {},
  trees: {},
  talus: {},
  rocks: {},
  foot: () => undefined,
  dress: () => undefined,
});
