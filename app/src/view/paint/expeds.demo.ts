// The demo's expedition scenes: none, as it has no expeditions (Phase 14.5b). Its twin,
// expeds.full.ts, is the full game's. What render.ts and wall.ts ask of it keeps its shape;
// nothing in the demo gets as far as asking.
import type { G, Pt } from '../kit/geom';
import type * as Full from './expeds.full';

const none = (): never => {
  throw new Error('The demo has no expeditions.');
};

export const ELCAP_LINE: Pt[] = [];
export const TORRE_LINE: Pt[] = [];
export const TRANGO_LINE: Pt[] = [];
export const drawSnow: typeof Full.drawSnow = () => undefined;
export const SNOWS: typeof Full.SNOWS = () => false;
export const SCENED: string[] = [];
export const expedScene: typeof Full.expedScene = none;
export const expedSpot: typeof Full.expedSpot = none;
export const EXPED_SKY_W = 0;
export const EXPED_FACE: Pt[] = [];
export const paintExpedWall: (g: G, place: string) => void = none;
