// What each thing the player does sounds like, by name. Pure: the game says which cue,
// sound.ts says how it sounds. cues.test.ts holds every act and every crux verb to having one.
import type { ActDef, Verb } from '../sim';

export type Cue =
  // Around the valley.
  | 'tap'
  | 'step'
  | 'talk'
  | 'paper'
  | 'drive'
  // A breakdown on the road (Phase 22.2a).
  | 'breakdown'
  | 'eat'
  | 'earn'
  | 'pay'
  | 'sleep'
  | 'rest'
  | 'dog'
  | 'train'
  // A chord outside the café (Phase 22.5b): clean, or muffed.
  | 'strum'
  // Knuckles on the van's panel at night (Phase 22.6a).
  | 'knock'
  // On the road (Phase 22.6b): the side door rolling shut on a hitchhiker; tires onto a
  // gravel pull-off and the handbrake.
  | 'door'
  | 'pullover'
  // Boots on a dark trail, and the wind in the trees (Phase 22.6c).
  | 'walkout'
  // The morning of your dog's last day (Phase 22.7): one low, held chord.
  | 'farewell'
  // At the fire (Phase 22.9a): a horseshoe on the stake, ringing when it's a ringer and a
  // thud in the dirt when it's not; dice rattled in a cup and set down.
  | 'clang'
  | 'dice'
  // On the wall.
  | 'pullon'
  | 'move'
  | 'clip'
  | 'place'
  | 'crux'
  | 'cleared'
  | 'grip'
  | 'slap'
  | 'charge'
  | 'release'
  | 'breath'
  | 'fell'
  | 'land'
  | 'send';

// An act sounds like what it does to you: bed, the dog, time passing, money in, food in,
// money out, in that order.
export function actCue(a: ActDef): Cue {
  if (a.sleep) return 'sleep';
  if (a.dog) return 'dog';
  if (a.until) return 'rest';
  // The garage's bill is the part's, by wear: always money out.
  if (a.van) return 'pay';
  const c = a.cost;
  if ((c.cash ?? 0) > 0) return 'earn';
  if ((c.fed ?? 0) > 0 || ((c.energy ?? 0) > 0 && (c.cash ?? 0) < 0)) return 'eat';
  if ((c.cash ?? 0) < 0) return 'pay';
  return 'rest';
}

// Each crux verb, as your hands play it: a tension hold grips and lets go, a timing tap
// slaps the hold, a hold-to-load charges and then lets fly.
export const VERB_CUES: Record<Verb, { down: Cue; up?: Cue }> = {
  tension: { down: 'grip' },
  timing: { down: 'slap' },
  load: { down: 'charge', up: 'release' },
};
