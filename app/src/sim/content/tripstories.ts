// Coming home (Phase 24.5) [proposed]: what a trip sounds like told at the fire, and how the
// trip's card says it ended. By how it ended, not by the wall: the wall's name and the rest
// are filled in from the trip ({name}, {objective}, {partner}, {high}, {pitches}, {next}).

import type { TripEnd } from '../types';

export const TRIP_STORY: Record<TripEnd, string> = {
  summit:
    'You tell {objective} from the top down: the last pitch, the summit, {partner} on the anchor laughing at nothing. Somebody puts another log on. Nobody’s in a hurry to go to bed.',
  bail: 'You tell them about pitch {next} on {name}, where you turned around. It sounds braver at the fire than it felt on the ledge. Nobody says you should have kept going.',
  water:
    'You tell them about the morning the water ran out on {name}, {high} pitches up. They laugh in the right places. You’ll pack more next time, and they know it.',
  time: 'You tell them about the days on {name}: {high} pitches fixed and the clock run out. It’s a good story without a summit. Most of the good ones are.',
};

// The card's line for how it ended; who was on the rope follows it.
export const TRIP_END: Record<TripEnd, string> = {
  summit: 'The summit of {objective}',
  bail: 'You rapped off with {high} of {pitches} pitches fixed',
  water: 'The water ran out with {high} of {pitches} pitches fixed',
  time: 'Out of days with {high} of {pitches} pitches fixed',
};

// How the trip left you and your partner.
export const TRIP_BOND = {
  closer: '{partner}’s closer for it.',
  further: '{partner}’s a little further off.',
};
